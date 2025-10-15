from rest_framework import serializers
from django.conf import settings
from decimal import Decimal
from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for Transaction model"""

    user_email = serializers.EmailField(source='user.email', read_only=True)
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id',
            'user',
            'user_email',
            'transaction_type',
            'amount',
            'commission',
            'total_amount',
            'status',
            'payment_method',
            'payment_receipt',
            'admin_notes',
            'created_at',
            'processed_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'commission',
            'status',
            'admin_notes',
            'created_at',
            'processed_at',
        ]

    def get_total_amount(self, obj):
        return obj.total_amount()


class DepositSerializer(serializers.ModelSerializer):
    """Serializer for deposit creation"""

    amount = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        min_value=Decimal('250.00')
    )
    payment_method = serializers.CharField(max_length=50)

    class Meta:
        model = Transaction
        fields = ['amount', 'payment_receipt', 'payment_method']

    def validate_amount(self, value):
        if value < Decimal(str(settings.MIN_DEPOSIT_AMOUNT)):
            raise serializers.ValidationError(
                f'Minimum deposit amount is {settings.MIN_DEPOSIT_AMOUNT} EUR.'
            )
        return value

    def create(self, validated_data):
        user = self.context['request'].user

        transaction = Transaction.objects.create(
            user=user,
            transaction_type='deposit',
            amount=validated_data['amount'],
            payment_method=validated_data['payment_method'],
            payment_receipt=validated_data.get('payment_receipt'),
            status='pending'
        )

        return transaction


class WithdrawalSerializer(serializers.ModelSerializer):
    """Serializer for withdrawal creation"""

    class Meta:
        model = Transaction
        fields = ['amount']

    def validate_amount(self, value):
        user = self.context['request'].user

        # Calculate total amount with commission
        commission = value * (Decimal(str(settings.WITHDRAWAL_COMMISSION_PERCENT)) / 100)
        total_required = value + commission

        if total_required > user.balance:
            raise serializers.ValidationError(
                f'Insufficient balance. You need {total_required} EUR '
                f'(including {commission} EUR commission).'
            )

        return value

    def create(self, validated_data):
        user = self.context['request'].user
        amount = validated_data['amount']

        transaction = Transaction.objects.create(
            user=user,
            transaction_type='withdrawal',
            amount=amount,
            status='pending'
        )

        # Calculate commission
        transaction.calculate_commission()
        transaction.save()

        return transaction