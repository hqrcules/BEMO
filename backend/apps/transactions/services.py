import logging
from datetime import timedelta
from decimal import Decimal
from itertools import groupby

from django.db import models, transaction as db_transaction
from django.db.models import Sum, F, Window, Case, When, Value, Q, DecimalField
from django.db.models.functions import Coalesce
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings

from .models import Transaction
from ..accounts.models import User


logger = logging.getLogger(__name__)


class TransactionQuerySet(models.QuerySet):
    def completed(self):
        return self.filter(status=Transaction.StatusChoices.COMPLETED)

    def pending(self):
        return self.filter(status=Transaction.StatusChoices.PENDING)

    def in_period(self, start_date, end_date):
        return self

    def for_user(self, user):
        return self.filter(user=user)

    def calculate_change(self):
        return self.annotate(
            change=Case(
                When(status=Transaction.StatusChoices.COMPLETED, transaction_type=Transaction.TypeChoices.DEPOSIT, then=F('amount')),
                When(status=Transaction.StatusChoices.COMPLETED, transaction_type=Transaction.TypeChoices.BOT_PROFIT, then=F('amount')),
                When(status=Transaction.StatusChoices.COMPLETED, transaction_type=Transaction.TypeChoices.WITHDRAWAL, then=-(F('amount') + F('commission'))),
                When(status=Transaction.StatusChoices.COMPLETED, transaction_type=Transaction.TypeChoices.COMMISSION, then=-F('amount')),
                When(status=Transaction.StatusChoices.COMPLETED, transaction_type=Transaction.TypeChoices.BOT_PURCHASE, then=-F('amount')),
                default=Value(Decimal('0.00')),
                output_field=models.DecimalField()
            )
        )

class TransactionManager(models.Manager):
    def get_queryset(self):
        return TransactionQuerySet(self.model, using=self._db)

    def total_change_before_date(self, user, date):
        return self.get_queryset().for_user(user).completed().filter(
            processed_at__lt=date
        ).calculate_change().aggregate(
            total=Coalesce(Sum('change'), Decimal('0.00'))
        )['total']


class BalanceHistoryService:
    CACHE_TIMEOUT = 60 * 5

    @classmethod
    def _get_cache_key(cls, user_id, days, include_pending=False):
        return f'balance_history_{user_id}_{days}_{include_pending}'

    @classmethod
    def invalidate_cache(cls, user_id, days=30, include_pending=False):
        cache.delete(cls._get_cache_key(user_id, days, True))
        cache.delete(cls._get_cache_key(user_id, days, False))
        logger.info(f"Invalidated balance history caches for user {user_id}, days={days}")

    @classmethod
    def get_history(cls, user: User, days: int = 30, include_pending: bool = False) -> list[dict]:
        cache_key = cls._get_cache_key(user.id, days, include_pending)

        cached_result = cache.get(cache_key)
        if cached_result is not None:
             logger.debug(f"Cache hit for balance history: {cache_key}")
             return cached_result

        logger.debug(f"Cache miss for balance history: {cache_key}. Calculating...")

        def calculate_and_format_history() -> list[dict]:
            logger.debug(f"Calculating balance history for user {user.id} for {days} days. Include pending: {include_pending}")
            now = timezone.now()
            start_date = (now - timedelta(days=days)).replace(hour=0, minute=0, second=0, microsecond=0)

            total_change_before_start = Transaction.objects.total_change_before_date(user, start_date)
            initial_user_balance = Decimal('0.00')
            balance_at_start = initial_user_balance + total_change_before_start
            logger.debug(f"Calculated balance at start ({start_date}): {balance_at_start}")

            status_filter = [Transaction.StatusChoices.COMPLETED]
            if include_pending:
                status_filter.append(Transaction.StatusChoices.PENDING)

            transactions = Transaction.objects.filter(
                user=user,
                status__in=status_filter,
            ).annotate(
                effective_timestamp=Case(
                    When(status=Transaction.StatusChoices.COMPLETED, then=Coalesce(F('processed_at'), F('created_at'))),
                    When(status=Transaction.StatusChoices.PENDING, then=F('created_at')),
                    default=F('created_at'),
                    output_field=models.DateTimeField()
                ),
                change=Case(
                    When(status=Transaction.StatusChoices.COMPLETED, transaction_type=Transaction.TypeChoices.DEPOSIT, then=F('amount')),
                    When(status=Transaction.StatusChoices.COMPLETED, transaction_type=Transaction.TypeChoices.BOT_PROFIT, then=F('amount')),
                    When(status=Transaction.StatusChoices.COMPLETED, transaction_type=Transaction.TypeChoices.WITHDRAWAL, then=-(F('amount') + F('commission'))),
                    When(status=Transaction.StatusChoices.COMPLETED, transaction_type=Transaction.TypeChoices.COMMISSION, then=-F('amount')),
                    When(status=Transaction.StatusChoices.COMPLETED, transaction_type=Transaction.TypeChoices.BOT_PURCHASE, then=-F('amount')),
                    default=Value(Decimal('0.00')),
                    output_field=models.DecimalField()
                )
            ).filter(
                effective_timestamp__gte=start_date
            ).order_by('effective_timestamp', 'id')

            history_points = []
            history_points.append({'timestamp': start_date, 'balance': balance_at_start})

            running_balance = balance_at_start
            last_timestamp = start_date

            grouped_transactions = groupby(transactions, key=lambda tx: tx.effective_timestamp)

            for timestamp, tx_group in grouped_transactions:
                try:
                    tx_list = list(tx_group)
                    total_change_at_timestamp = sum(tx.change for tx in tx_list if tx.status == Transaction.StatusChoices.COMPLETED)
                    logger.debug(f"Processing timestamp: {timestamp}, Change: {total_change_at_timestamp}, Num Tx: {len(tx_list)}")

                    if timestamp > last_timestamp:
                        if not history_points or history_points[-1]['balance'] != running_balance:
                            history_points.append({'timestamp': timestamp, 'balance': running_balance})

                    if total_change_at_timestamp != Decimal('0.00'):
                        running_balance += total_change_at_timestamp
                        if history_points and history_points[-1]['timestamp'] == timestamp:
                             history_points[-1]['balance'] = running_balance
                        else:
                             history_points.append({'timestamp': timestamp, 'balance': running_balance})

                    logger.debug(f"Points after processing {timestamp}: {history_points[-2:] if len(history_points) > 1 else history_points}")
                    last_timestamp = timestamp
                except Exception as e_inner:
                    logger.error(f"Error processing group for timestamp {timestamp}: {e_inner}", exc_info=True)
                    raise

            current_actual_balance = user.balance

            if history_points and history_points[-1]['timestamp'] == now:
                history_points[-1]['balance'] = current_actual_balance
            elif now > last_timestamp:
                 if not history_points or history_points[-1]['balance'] != running_balance:
                     history_points.append({'timestamp': now, 'balance': running_balance})
                 if not history_points or history_points[-1]['timestamp'] != now:
                    history_points.append({'timestamp': now, 'balance': current_actual_balance})
                 else:
                      history_points[-1]['balance'] = current_actual_balance
            elif not history_points:
                 history_points.append({'timestamp': start_date, 'balance': balance_at_start})
                 if start_date != now:
                     history_points.append({'timestamp': now, 'balance': current_actual_balance})
                 else:
                     history_points[-1]['balance'] = current_actual_balance

            logger.debug(f"Generated {len(history_points)} history points before formatting.")

            final_data = [
                {"timestamp": p['timestamp'].isoformat(), "balance": str(p['balance'].quantize(Decimal("0.01")))}
                for p in history_points
            ]

            deduplicated_data = []
            if final_data:
                deduplicated_data.append(final_data[0])
                for i in range(1, len(final_data)):
                    if final_data[i]['timestamp'] != final_data[i-1]['timestamp'] or \
                       final_data[i]['balance'] != final_data[i-1]['balance']:
                        deduplicated_data.append(final_data[i])
            final_data = deduplicated_data

            if len(final_data) > 2:
                simplified_data = [final_data[0]]
                for i in range(1, len(final_data) - 1):
                    if final_data[i]['balance'] != simplified_data[-1]['balance'] or \
                       final_data[i]['balance'] != final_data[i+1]['balance']:
                        simplified_data.append(final_data[i])
                simplified_data.append(final_data[-1])
                final_data = simplified_data
                logger.debug(f"Simplified to {len(final_data)} points after removing redundant horizontal points.")

            return final_data

        result = cache.get_or_set(cache_key, calculate_and_format_history, timeout=cls.CACHE_TIMEOUT)
        logger.debug(f"Returning {len(result)} points for key {cache_key}")
        return result


class TransactionService:

    @staticmethod
    def _calculate_fee(amount: Decimal, transaction_type: str) -> Decimal:
        if transaction_type == Transaction.TypeChoices.WITHDRAWAL:
            commission_percent_str = getattr(settings, 'WITHDRAWAL_COMMISSION_PERCENT', '25.0')
            fee_percentage = Decimal(commission_percent_str) / Decimal('100')
            return (amount * fee_percentage).quantize(Decimal('0.01'))
        return Decimal('0.00')

    @staticmethod
    def _update_user_balance(user: User, change: Decimal, reason: str = ""):
        with db_transaction.atomic():
            user_reloaded = User.objects.select_for_update().get(pk=user.pk)
            original_balance = user_reloaded.balance
            user_reloaded.balance += change
            user_reloaded.save(update_fields=['balance'])
            logger.info(f"Updated balance for user {user.id} from {original_balance} by {change}. New balance: {user_reloaded.balance}. Reason: {reason}")

    @classmethod
    def create_transaction(cls, user: User, amount: Decimal, transaction_type: str, fee: Decimal = Decimal('0.00'), payment_method: str = None, payment_receipt = None, admin_user: User = None) -> Transaction:

        if amount <= 0:
            raise ValueError("Transaction amount must be positive.")

        status = Transaction.StatusChoices.PENDING
        processed_at = None
        processed_by = admin_user

        if transaction_type == Transaction.TypeChoices.DEPOSIT:
            fee = Decimal('0.00')
            min_deposit = Decimal(str(getattr(settings, 'MIN_DEPOSIT_AMOUNT', '10.00')))
            if amount < min_deposit:
                 raise ValueError(f"Minimum deposit amount is {min_deposit} EUR.")

        elif transaction_type == Transaction.TypeChoices.WITHDRAWAL:
            fee = cls._calculate_fee(amount, transaction_type)
            total_deduction = amount + fee
            if user.balance < total_deduction:
                raise ValueError("Insufficient balance for withdrawal request.")
            cls._update_user_balance(user, -total_deduction, reason=f"Withdrawal request {amount}+{fee} (pending)")

        elif transaction_type == Transaction.TypeChoices.BOT_PROFIT:
             status = Transaction.StatusChoices.COMPLETED
             processed_at = timezone.now()
             cls._update_user_balance(user, amount, reason=f"Bot profit {amount}")
        elif transaction_type == Transaction.TypeChoices.BOT_PURCHASE:
             status = Transaction.StatusChoices.COMPLETED
             processed_at = timezone.now()
             if user.balance < amount:
                  raise ValueError("Insufficient balance for bot purchase.")
             cls._update_user_balance(user, -amount, reason=f"Bot purchase {amount}")
        elif transaction_type == Transaction.TypeChoices.COMMISSION:
             status = Transaction.StatusChoices.COMPLETED
             processed_at = timezone.now()
             if user.balance < amount:
                  logger.warning(f"User {user.id} insufficient balance {user.balance} for commission {amount}")
                  amount = user.balance
             if amount > 0:
                 cls._update_user_balance(user, -amount, reason=f"Commission deduction {amount}")
             else:
                 logger.warning(f"Skipping zero commission deduction for user {user.id}")
                 return None


        tx_data = {
            'user': user,
            'amount': amount,
            'fee': fee,
            'transaction_type': transaction_type,
            'status': status,
            'payment_method': payment_method,
            'payment_receipt': payment_receipt,
            'processed_at': processed_at,
            'processed_by': processed_by,
        }

        tx_data = {k: v for k, v in tx_data.items() if v is not None}

        tx = Transaction.objects.create(**tx_data)
        logger.info(f"Created transaction {tx.id} for user {user.id}: type={transaction_type}, amount={amount}, fee={fee}, status={status}")

        if status == Transaction.StatusChoices.COMPLETED and transaction_type not in [Transaction.TypeChoices.WITHDRAWAL, Transaction.TypeChoices.DEPOSIT]:
            BalanceHistoryService.invalidate_cache(user.id)

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

            user_to_update = User.objects.select_for_update().get(pk=transaction_locked.user.pk)

            if transaction_locked.transaction_type == Transaction.TypeChoices.DEPOSIT:
                cls._update_user_balance(user_to_update, transaction_locked.amount, reason=f"Deposit approved {transaction.id}")

            elif transaction_locked.transaction_type == Transaction.TypeChoices.WITHDRAWAL:
                 pass

            transaction_locked.status = Transaction.StatusChoices.COMPLETED
            transaction_locked.processed_at = timezone.now()
            transaction_locked.processed_by = admin_user
            transaction_locked.save()
            logger.info(f"Approved transaction {transaction.id} by admin {admin_user.id}")
            BalanceHistoryService.invalidate_cache(user_to_update.id)

        return True


    @classmethod
    def reject_transaction(cls, transaction: Transaction, admin_user: User, reason: str = "") -> bool:
        if transaction.status != Transaction.StatusChoices.PENDING:
            logger.warning(f"Attempted to reject non-pending transaction {transaction.id}")
            return False

        balance_changed = False
        with db_transaction.atomic():
            transaction_locked = Transaction.objects.select_for_update().get(pk=transaction.pk)
            if transaction_locked.status != Transaction.StatusChoices.PENDING:
                 logger.warning(f"Transaction {transaction.id} status changed before rejection.")
                 return False

            user_to_update = User.objects.select_for_update().get(pk=transaction_locked.user.pk)

            if transaction_locked.transaction_type == Transaction.TypeChoices.WITHDRAWAL:
                cls._update_user_balance(user_to_update, transaction_locked.total_amount(), reason=f"Withdrawal rejected {transaction.id}")
                balance_changed = True

            elif transaction_locked.transaction_type == Transaction.TypeChoices.DEPOSIT:
                pass

            transaction_locked.status = Transaction.StatusChoices.REJECTED
            transaction_locked.processed_at = timezone.now()
            transaction_locked.processed_by = admin_user
            transaction_locked.admin_notes = reason
            transaction_locked.save()
            logger.info(f"Rejected transaction {transaction.id} by admin {admin_user.id}. Reason: {reason}")
            if balance_changed:
                BalanceHistoryService.invalidate_cache(user_to_update.id)

        return True