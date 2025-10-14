import uuid
from django.db import models
from django.conf import settings


class PaymentDetails(models.Model):
    """Model for admin-managed payment details (реквізити)"""

    CURRENCY_CHOICES = [
        ('USDT_TRC20', 'USDT (TRC20)'),
        ('USDT_ERC20', 'USDT (ERC20)'),
        ('BTC', 'Bitcoin'),
        ('ETH', 'Ethereum'),
        ('BANK_TRANSFER', 'Bank Transfer'),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    currency = models.CharField(
        max_length=20,
        choices=CURRENCY_CHOICES
    )
    wallet_address = models.CharField(
        max_length=255,
        blank=True,
        help_text='Crypto wallet address'
    )
    bank_details = models.TextField(
        blank=True,
        help_text='Bank account details (for bank transfers)'
    )
    network = models.CharField(
        max_length=50,
        blank=True,
        help_text='Blockchain network (e.g., TRC20, ERC20)'
    )

    # Status
    is_active = models.BooleanField(
        default=True,
        help_text='Show this payment method to users'
    )

    # Admin Management
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='updated_payment_details'
    )

    class Meta:
        db_table = 'payment_details'
        verbose_name = 'Payment Details'
        verbose_name_plural = 'Payment Details'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_currency_display()} - {self.wallet_address or self.bank_details[:30]}"
