# backend/apps/transactions/services.py
import logging
from datetime import timedelta
from decimal import Decimal
from django.db import models, transaction as db_transaction
from django.db.models import Sum, F, Window, Case, When, Value, Min
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.core.cache import cache
from .models import Transaction
from ..accounts.models import User

logger = logging.getLogger(__name__)

class BalanceHistoryService:
    CACHE_TIMEOUT = 60 * 5

    @classmethod
    def _get_cache_key(cls, user_id, days):
        return f'balance_history_{user_id}_{days}'

    @classmethod
    def invalidate_cache(cls, user_id, days=30):
        cache.delete(cls._get_cache_key(user_id, days))
        logger.info(f"Invalidated balance history cache for user {user_id}")

    @classmethod
    def get_history(cls, user: User, days: int = 30) -> list[dict]:
        cache_key = cls._get_cache_key(user.id, days)

        def calculate_and_format_history() -> list[dict]:
            logger.debug(f"Calculating balance history for user {user.id} for {days} days.")
            now = timezone.now()
            start_date = now - timedelta(days=days)

            total_change_before_start = Transaction.objects.total_change_before_date(user, start_date)
            balance_at_start = user.initial_balance + total_change_before_start
            logger.debug(f"Initial balance at {start_date}: {balance_at_start}")

            transactions = Transaction.objects.for_user(user).completed().in_period(start_date, now) \
                .calculate_change() \
                .annotate(effective_timestamp=Coalesce(F('processed_at'), F('created_at'))) \
                .order_by('effective_timestamp')

            cumulative_change_window = Window(
                expression=Sum('change'),
                order_by=F('effective_timestamp').asc(),
            )

            points_qs = transactions.annotate(
                cumulative_change_period=cumulative_change_window
            ).values(
                'effective_timestamp',
                'cumulative_change_period',
                'change'
            )

            # --- Revised Point Generation ---
            history_points_map = {}
            history_points_map[start_date] = balance_at_start

            last_ts = start_date
            last_balance = balance_at_start

            for point in points_qs:
                ts = point['effective_timestamp']
                change = point['change']
                cumulative_change = point['cumulative_change_period']
                balance_after_tx = balance_at_start + cumulative_change

                # If timestamp changed, ensure the balance BEFORE this transaction is recorded
                if ts > last_ts:
                    if last_ts not in history_points_map:
                         # Record the balance *after* the previous transaction group
                         history_points_map[last_ts] = last_balance

                # Always update/set the balance *after* the current transaction for its timestamp
                history_points_map[ts] = balance_after_tx

                last_ts = ts
                last_balance = balance_after_tx # Update last known balance

            # Ensure the state at the timestamp of the very last transaction is present
            if last_ts not in history_points_map and last_ts >= start_date:
                 history_points_map[last_ts] = last_balance

            # Ensure current time and balance point exists
            # Add state just before 'now' if 'now' is later than the last transaction
            if now > last_ts and last_ts not in history_points_map:
                 history_points_map[last_ts] = last_balance

            history_points_map[now] = user.balance # Set/overwrite the 'now' point with actual current balance
            logger.debug(f"Final balance point at {now}: {user.balance}")
            # --- End Revised Point Generation ---


            final_data = sorted(
                [
                    {"timestamp": ts.isoformat(), "balance": str(bal)}
                    for ts, bal in history_points_map.items()
                    if ts >= start_date
                ],
                key=lambda x: x['timestamp']
            )

            # Post-processing: If consecutive points have the same balance, remove the earlier one
            # This simplifies steps but might remove intermediate horizontal lines if desired
            # simplified_data = []
            # if final_data:
            #     simplified_data.append(final_data[0])
            #     for i in range(1, len(final_data)):
            #         if final_data[i]['balance'] != final_data[i-1]['balance'] or i == len(final_data) - 1:
            #              # Keep if balance changed OR it's the very last point
            #              # We might need the previous point too for step charts
            #             if simplified_data[-1]['timestamp'] != final_data[i-1]['timestamp']:
            #                  simplified_data.append(final_data[i-1]) # Ensure point before change is kept
            #             simplified_data.append(final_data[i])

            # Keep all points for now to ensure horizontal lines are represented
            processed_data = final_data
            logger.debug(f"Generated {len(processed_data)} history points.")
            return processed_data


        result = cache.get_or_set(cache_key, calculate_and_format_history, timeout=cls.CACHE_TIMEOUT)
        return result


class TransactionService:

    @staticmethod
    def _calculate_fee(amount: Decimal, transaction_type: str) -> Decimal:
        if transaction_type == Transaction.TypeChoices.WITHDRAWAL:
            fee_percentage = Decimal('0.01')
            return (amount * fee_percentage).quantize(Decimal('0.01'))
        return Decimal('0.00')

    @staticmethod
    def _update_user_balance(user: User, change: Decimal, reason: str = ""):
        user.balance += change
        user.save(update_fields=['balance'])
        logger.info(f"Updated balance for user {user.id} by {change}. New balance: {user.balance}. Reason: {reason}")
        BalanceHistoryService.invalidate_cache(user.id)

    @classmethod
    def create_deposit_request(cls, user: User, amount: Decimal, payment_method: str = None) -> Transaction:
        if amount <= 0:
            raise ValueError("Deposit amount must be positive.")

        tx = Transaction.objects.create(
            user=user,
            amount=amount,
            fee=Decimal('0.00'),
            transaction_type=Transaction.TypeChoices.DEPOSIT,
            status=Transaction.StatusChoices.PENDING,
            payment_method=payment_method
        )
        logger.info(f"Created deposit request {tx.id} for user {user.id} amount {amount}")
        return tx

    @classmethod
    def create_withdrawal_request(cls, user: User, amount: Decimal, payment_method: str = None) -> Transaction:
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive.")

        fee = cls._calculate_fee(amount, Transaction.TypeChoices.WITHDRAWAL)
        total_deduction = amount + fee

        if user.balance < total_deduction:
            raise ValueError("Insufficient balance for withdrawal.")

        cls._update_user_balance(user, -total_deduction, reason=f"Withdrawal request {amount}+{fee}")

        tx = Transaction.objects.create(
            user=user,
            amount=amount,
            fee=fee,
            transaction_type=Transaction.TypeChoices.WITHDRAWAL,
            status=Transaction.StatusChoices.PENDING,
            payment_method=payment_method
        )
        logger.info(f"Created withdrawal request {tx.id} for user {user.id} amount {amount} (fee {fee})")
        return tx

    @classmethod
    def approve_transaction(cls, transaction: Transaction, admin_user: User) -> bool:
        if transaction.status != Transaction.StatusChoices.PENDING:
            logger.warning(f"Attempted to approve non-pending transaction {transaction.id}")
            return False

        with db_transaction.atomic():
            transaction_locked = Transaction.objects.select_for_update().get(pk=transaction.pk)
            if transaction_locked.status != Transaction.StatusChoices.PENDING:
                 logger.warning(f"Transaction {transaction.id} status changed before approval.")
                 return False

            if transaction_locked.transaction_type == Transaction.TypeChoices.DEPOSIT:
                cls._update_user_balance(transaction_locked.user, transaction_locked.amount, reason=f"Deposit approved {transaction.id}")


            transaction_locked.status = Transaction.StatusChoices.COMPLETED
            transaction_locked.processed_at = timezone.now()
            transaction_locked.processed_by = admin_user
            transaction_locked.save()
            logger.info(f"Approved transaction {transaction.id} by admin {admin_user.id}")

        return True


    @classmethod
    def reject_transaction(cls, transaction: Transaction, admin_user: User) -> bool:
        if transaction.status != Transaction.StatusChoices.PENDING:
            logger.warning(f"Attempted to reject non-pending transaction {transaction.id}")
            return False

        with db_transaction.atomic():
            transaction_locked = Transaction.objects.select_for_update().get(pk=transaction.pk)
            if transaction_locked.status != Transaction.StatusChoices.PENDING:
                 logger.warning(f"Transaction {transaction.id} status changed before rejection.")
                 return False

            if transaction_locked.transaction_type == Transaction.TypeChoices.WITHDRAWAL:
                cls._update_user_balance(transaction_locked.user, transaction_locked.total_amount(), reason=f"Withdrawal rejected {transaction.id}")


            transaction_locked.status = Transaction.StatusChoices.REJECTED
            transaction_locked.processed_at = timezone.now()
            transaction_locked.processed_by = admin_user
            transaction_locked.save()
            logger.info(f"Rejected transaction {transaction.id} by admin {admin_user.id}")

        return True