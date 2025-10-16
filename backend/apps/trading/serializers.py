from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import BotTrade, TradingSession
from decimal import Decimal


class BotTradeSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    duration = serializers.SerializerMethodField()

    class Meta:
        model = BotTrade
        fields = [
            'id',
            'user',
            'user_email',
            'symbol',
            'side',
            'entry_price',
            'exit_price',
            'quantity',
            'profit_loss',
            'profit_loss_percent',
            'is_open',
            'opened_at',
            'closed_at',
            'duration',
        ]
        read_only_fields = [
            'id',
            'user',
            'profit_loss',
            'profit_loss_percent',
            'opened_at',
            'closed_at',
        ]

    @extend_schema_field(serializers.IntegerField)
    def get_duration(self, obj):
        if obj.closed_at:
            delta = obj.closed_at - obj.opened_at
            return int(delta.total_seconds())
        return None


class TradingSessionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    win_rate = serializers.SerializerMethodField()
    profit_percent = serializers.SerializerMethodField()

    class Meta:
        model = TradingSession
        fields = [
            'id',
            'user',
            'user_email',
            'bot_type',
            'starting_balance',
            'current_balance',
            'total_profit',
            'total_trades',
            'winning_trades',
            'win_rate',
            'profit_percent',
            'is_active',
            'started_at',
            'ended_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'user_email',
            'bot_type',
            'starting_balance',
            'current_balance',
            'total_profit',
            'total_trades',
            'winning_trades',
            'is_active',
            'started_at',
            'ended_at',
        ]

    @extend_schema_field(serializers.FloatField)
    def get_win_rate(self, obj):
        return round(obj.win_rate(), 2)

    @extend_schema_field(serializers.FloatField)
    def get_profit_percent(self, obj):
        if obj.starting_balance > 0:
            return round((Decimal(obj.total_profit) / Decimal(obj.starting_balance)) * Decimal('100'), 2)
        return Decimal('0.0')


class TradingStatsSerializer(serializers.Serializer):
    total_trades = serializers.IntegerField()
    open_trades = serializers.IntegerField()
    closed_trades = serializers.IntegerField()
    winning_trades = serializers.IntegerField()
    losing_trades = serializers.IntegerField()
    win_rate = serializers.FloatField()
    total_profit = serializers.DecimalField(max_digits=15, decimal_places=2)
    average_profit = serializers.DecimalField(max_digits=15, decimal_places=2)
    best_trade = serializers.DecimalField(max_digits=15, decimal_places=2)
    worst_trade = serializers.DecimalField(max_digits=15, decimal_places=2)