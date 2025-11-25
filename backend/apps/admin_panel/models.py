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


class SiteSettings(models.Model):
    """Model for site-wide customizable settings"""

    SETTING_TYPES = [
        ('withdrawal_info', 'Withdrawal Info Text'),
        ('deposit_info', 'Deposit Info Text'),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    key = models.CharField(
        max_length=50,
        unique=True,
        choices=SETTING_TYPES,
        help_text='Unique key for the setting'
    )
    value = models.TextField(
        help_text='Setting value (can be text, HTML, JSON, etc.)'
    )
    description = models.CharField(
        max_length=255,
        blank=True,
        help_text='Description of what this setting does'
    )

    # Admin Management
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='updated_settings'
    )

    class Meta:
        db_table = 'site_settings'
        verbose_name = 'Site Setting'
        verbose_name_plural = 'Site Settings'
        ordering = ['key']

    def __str__(self):
        return f"{self.get_key_display()}"