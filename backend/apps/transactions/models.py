import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class Transaction(models.Model):
    """Model for deposits, withdrawals and commissions"""

    TYPE_CHOICES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('commission', 'Commission'),
        ('bot_profit', 'Bot Profit'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES
    )
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    commission = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text='Commission amount (25% for withdrawals)'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    payment_method = models.CharField(max_length=50, default='card')

    # Payment Receipt
    payment_receipt = models.FileField(
        upload_to='receipts/%Y/%m/%d/',
        null=True,
        blank=True,
        help_text='Payment receipt uploaded to support chat'
    )

    # Admin Management
    admin_notes = models.TextField(
        blank=True,
        help_text='Admin notes for this transaction'
    )
    processed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='processed_transactions'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'transactions'
        verbose_name = 'Transaction'
        verbose_name_plural = 'Transactions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['transaction_type', 'status']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.transaction_type.title()} - {self.amount} EUR ({self.status})"

    def calculate_commission(self):
        """Calculate 25% commission for withdrawals"""
        if self.transaction_type == 'withdrawal':
            self.commission = self.amount * (Decimal(str(settings.WITHDRAWAL_COMMISSION_PERCENT)) / Decimal('100'))
        return self.commission

    def total_amount(self):
        """Total amount including commission"""
        return self.amount + self.commission