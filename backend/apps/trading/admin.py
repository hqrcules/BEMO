from django.contrib import admin
from .models import BotTrade, TradingSession


@admin.register(BotTrade)
class BotTradeAdmin(admin.ModelAdmin):
    list_display = ['symbol', 'user_email', 'side', 'entry_price', 'exit_price', 'profit_loss', 'is_open', 'opened_at']
    list_filter = ['is_open', 'side', 'symbol', 'opened_at']
    search_fields = ['user__email', 'symbol']
    readonly_fields = ['id', 'opened_at', 'profit_loss', 'profit_loss_percent']

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = 'User'


@admin.register(TradingSession)
class TradingSessionAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'bot_type', 'starting_balance', 'current_balance', 'total_profit', 'win_rate_display',
                    'is_active']
    list_filter = ['bot_type', 'is_active', 'started_at']
    search_fields = ['user__email']
    readonly_fields = ['id', 'started_at', 'win_rate_display']

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = 'User'

    def win_rate_display(self, obj):
        return f"{obj.win_rate():.2f}%"

    win_rate_display.short_description = 'Win Rate'
