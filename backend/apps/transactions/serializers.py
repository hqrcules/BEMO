from rest_framework import serializers
from django.conf import settings
from decimal import Decimal
from .models import Transaction

class TransactionSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    total_amount = serializers.SerializerMethodField()
    payment_receipt = serializers.SerializerMethodField()

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

    def get_payment_receipt(self, obj):
        """Return relative URL for payment receipt file"""
        if obj.payment_receipt:
            # Build relative URL from file name
            # obj.payment_receipt.name returns path relative to MEDIA_ROOT
            # e.g., "receipts/2025/01/13/photo.jpg"
            from django.conf import settings
            file_url = f"{settings.MEDIA_URL}{obj.payment_receipt.name}"
            # Ensure it starts with /media/ (relative path)
            if file_url.startswith('http'):
                # If somehow it's absolute, extract just the path part
                from urllib.parse import urlparse
                file_url = urlparse(file_url).path
            return file_url
        return None

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
    payment_receipt = serializers.FileField(required=False, allow_null=True)
    payment_method = serializers.CharField(required=False, default='card')
    payment_details = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Transaction
        fields = ['amount', 'payment_method', 'payment_receipt', 'payment_details']

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
        # Extract payment_details if provided, but don't pass it to create
        payment_details = validated_data.pop('payment_details', None)

        tx = Transaction.objects.create(
            user=user,
            transaction_type='withdrawal',
            status='pending',
            **validated_data
        )
        tx.calculate_commission()

        # Store payment details in admin_notes for now (or add a new field if needed)
        if payment_details:
            tx.admin_notes = f"User payment details: {payment_details}"

        tx.save()
        # user.balance -= tx.total_amount()
        # user.save()
        return tx

class BalanceHistorySerializer(serializers.Serializer):
    """Serializer for balance history data points."""
    timestamp = serializers.DateTimeField()
    balance = serializers.DecimalField(max_digits=15, decimal_places=2)