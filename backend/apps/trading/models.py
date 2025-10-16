import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class BotTrade(models.Model):
    TRADE_SIDE_CHOICES = [
        ('buy', 'Buy'),
        ('sell', 'Sell'),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bot_trades'
    )
    symbol = models.CharField(
        max_length=20,
        help_text='Trading pair (e.g., BTC/USDT, ETH/USDT)'
    )
    side = models.CharField(
        max_length=4,
        choices=TRADE_SIDE_CHOICES
    )
    entry_price = models.DecimalField(
        max_digits=20,
        decimal_places=8,
        validators=[MinValueValidator(Decimal('0.00000001'))]
    )
    exit_price = models.DecimalField(
        max_digits=20,
        decimal_places=8,
        null=True,
        blank=True
    )
    quantity = models.DecimalField(
        max_digits=20,
        decimal_places=8,
        validators=[MinValueValidator(Decimal('0.00000001'))]
    )
    profit_loss = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text='Profit/Loss in EUR'
    )
    profit_loss_percent = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=Decimal('0.00')
    )
    is_open = models.BooleanField(default=True)
    opened_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'bot_trades'
        verbose_name = 'Bot Trade'
        verbose_name_plural = 'Bot Trades'
        ordering = ['-opened_at']
        indexes = [
            models.Index(fields=['user', 'is_open']),
            models.Index(fields=['symbol', 'opened_at']),
        ]

    def __str__(self):
        status = 'Open' if self.is_open else 'Closed'
        return f"{self.symbol} - {self.side.upper()} - {status}"

    def calculate_profit_loss(self):
        if self.exit_price and not self.is_open:
            if self.side == 'buy':
                self.profit_loss = (self.exit_price - self.entry_price) * self.quantity
            else:
                self.profit_loss = (self.entry_price - self.exit_price) * self.quantity

            if self.entry_price > 0:
                self.profit_loss_percent = ((self.exit_price - self.entry_price) / self.entry_price) * 100

        return self.profit_loss


class TradingSession(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='trading_sessions'
    )
    bot_type = models.CharField(max_length=20)
    starting_balance = models.DecimalField(max_digits=15, decimal_places=2)
    current_balance = models.DecimalField(max_digits=15, decimal_places=2)
    total_profit = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal('0.00'))
    total_trades = models.IntegerField(default=0)
    winning_trades = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'trading_sessions'
        verbose_name = 'Trading Session'
        verbose_name_plural = 'Trading Sessions'
        ordering = ['-started_at']

    def __str__(self):
        return f"{self.user.email} - {self.bot_type} - {self.started_at}"

    def win_rate(self):
        if self.total_trades > 0:
            return (self.winning_trades / self.total_trades) * 100
        return 0.0