from rest_framework import serializers
from django.conf import settings
from decimal import Decimal
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id', 'user', 'user_email',
            'transaction_type', 'amount', 'commission', 'total_amount',
            'status', 'payment_method', 'payment_receipt',
            'admin_notes', 'created_at', 'processed_at',
        ]
        read_only_fields = ['id', 'user', 'commission', 'created_at', 'processed_at']

    def get_total_amount(self, obj):
        return str(obj.total_amount())

class DepositSerializer(serializers.ModelSerializer):
    payment_receipt = serializers.FileField(required=False, allow_null=True)
    payment_method = serializers.CharField(required=False, default='card')

    class Meta:
        model = Transaction
        fields = ['amount', 'payment_method', 'payment_receipt']

    def validate_amount(self, value):
        min_deposit = getattr(settings, 'MIN_DEPOSIT_AMOUNT', 10.00)
        if value < Decimal(str(min_deposit)):
            raise serializers.ValidationError(f'Minimum deposit amount is {min_deposit} EUR.')
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        return Transaction.objects.create(
            user=user,
            transaction_type='deposit',
            status='pending',
            **validated_data
        )

class WithdrawalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['amount']

    def validate_amount(self, value):
        user = self.context['request'].user
        commission_percent = getattr(settings, 'WITHDRAWAL_COMMISSION_PERCENT', 25)
        commission = value * (Decimal(str(commission_percent)) / 100)
        total_required = value + commission
        if total_required > user.balance:
            raise serializers.ValidationError(f'Insufficient balance. Need {total_required} EUR including commission.')
        return value

    def create(self, validated_data):
        user = self.context['request'].user
        tx = Transaction.objects.create(
            user=user,
            transaction_type='withdrawal',
            amount=validated_data['amount'],
            status='pending'
        )
        tx.calculate_commission()
        tx.save()
        # user.balance -= tx.total_amount()
        # user.save()
        return tx

class BalanceHistorySerializer(serializers.Serializer):
    """Serializer for balance history data points."""
    timestamp = serializers.DateTimeField()
    balance = serializers.DecimalField(max_digits=15, decimal_places=2)