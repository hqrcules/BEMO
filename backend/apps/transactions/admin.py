from django.contrib import admin
from django.utils.html import format_html
from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user_email', 'transaction_type', 'amount', 'commission', 'status', 'created_at']
    list_filter = ['transaction_type', 'status', 'created_at']
    search_fields = ['user__email', 'id']
    readonly_fields = ['id', 'created_at', 'commission']

    fieldsets = (
        ('Transaction Info', {
            'fields': ('id', 'user', 'transaction_type', 'amount', 'commission', 'status')
        }),
        ('Payment Details', {
            'fields': ('payment_receipt',)
        }),
        ('Admin Management', {
            'fields': ('admin_notes', 'processed_by', 'processed_at')
        }),
        ('Timestamps', {
            'fields': ('created_at',)
        }),
    )

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = 'User'

    def save_model(self, request, obj, form, change):
        if change:
            obj.processed_by = request.user
        obj.calculate_commission()
        super().save_model(request, obj, form, change)
