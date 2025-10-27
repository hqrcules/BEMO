# backend/apps/transactions/admin.py
from django.contrib import admin
from django.utils import timezone

from .models import Transaction
from .services import TransactionService # Імпорт сервісу

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'transaction_type', 'amount', 'status', 'created_at', 'processed_at', 'processed_by')
    list_filter = ('status', 'transaction_type', 'created_at')
    search_fields = ('user__email', 'user__username', 'details')
    readonly_fields = ('created_at',)
    actions = ['approve_transactions', 'reject_transactions']

    def approve_transactions(self, request, queryset):
        updated_count = 0
        user_ids_to_invalidate = set()

        for transaction in queryset.filter(status=Transaction.StatusChoices.PENDING):
            if transaction.transaction_type == Transaction.TypeChoices.DEPOSIT:
                transaction.user.balance += transaction.amount
                transaction.user.save(update_fields=['balance'])
                transaction.status = Transaction.StatusChoices.COMPLETED
                transaction.processed_at = timezone.now()
                transaction.processed_by = request.user
                transaction.save()
                user_ids_to_invalidate.add(transaction.user.id)
                updated_count += 1
            elif transaction.transaction_type == Transaction.TypeChoices.WITHDRAWAL:
                # Баланс вже був зменшений при створенні запиту
                transaction.status = Transaction.StatusChoices.COMPLETED
                transaction.processed_at = timezone.now()
                transaction.processed_by = request.user
                transaction.save()
                user_ids_to_invalidate.add(transaction.user.id)
                updated_count += 1

        # Інвалідуємо кеш для всіх зачеплених користувачів
        for user_id in user_ids_to_invalidate:
            TransactionService.invalidate_balance_history_cache(user_id)

        if updated_count > 0:
            self.message_user(request, f"{updated_count} transactions approved successfully.")
        else:
             self.message_user(request, "No pending transactions selected or eligible for approval.", level='warning')

    approve_transactions.short_description = "Approve selected pending transactions"

    def reject_transactions(self, request, queryset):
        updated_count = 0
        user_ids_to_invalidate = set()

        for transaction in queryset.filter(status=Transaction.StatusChoices.PENDING):
            if transaction.transaction_type == Transaction.TypeChoices.WITHDRAWAL:
                # Повертаємо кошти на баланс
                transaction.user.balance += transaction.total_amount()
                transaction.user.save(update_fields=['balance'])
                user_ids_to_invalidate.add(transaction.user.id) # Баланс змінився - треба інвалідувати

            transaction.status = Transaction.StatusChoices.REJECTED
            transaction.processed_at = timezone.now()
            transaction.processed_by = request.user
            transaction.save()
            updated_count += 1

        # Інвалідуємо кеш (на випадок повернення коштів при відхиленні виводу)
        for user_id in user_ids_to_invalidate:
            TransactionService.invalidate_balance_history_cache(user_id)

        if updated_count > 0:
            self.message_user(request, f"{updated_count} transactions rejected.")
        else:
             self.message_user(request, "No pending transactions selected.", level='warning')

    reject_transactions.short_description = "Reject selected pending transactions"