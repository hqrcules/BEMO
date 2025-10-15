from rest_framework import serializers
from django.db import models
from drf_spectacular.utils import extend_schema_field
from .models import PaymentDetails
from apps.accounts.models import User
from apps.transactions.models import Transaction


class PaymentDetailsSerializer(serializers.ModelSerializer):
    """Serializer for PaymentDetails model"""

    updated_by_email = serializers.EmailField(
        source='updated_by.email',
        read_only=True
    )

    class Meta:
        model = PaymentDetails
        fields = [
            'id',
            'currency',
            'wallet_address',
            'bank_details',
            'network',
            'is_active',
            'created_at',
            'updated_at',
            'updated_by',
            'updated_by_email',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'updated_by']


class AdminUserSerializer(serializers.ModelSerializer):
    """Serializer for user management in admin panel"""

    total_deposits = serializers.SerializerMethodField()
    total_withdrawals = serializers.SerializerMethodField()
    pending_transactions = serializers.SerializerMethodField()
    transaction_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'balance',
            'bot_type',
            'is_active',
            'is_staff',
            'is_verified',
            'created_at',
            'last_login',
            'last_login_ip',
            'total_deposits',
            'total_withdrawals',
            'pending_transactions',
            'transaction_count',
        ]
        read_only_fields = ['id', 'created_at', 'last_login']

    @extend_schema_field(serializers.DecimalField(max_digits=15, decimal_places=2))
    def get_total_deposits(self, obj):
        result = obj.transactions.filter(
            transaction_type='deposit',
            status='completed'
        ).aggregate(total=models.Sum('amount'))
        return float(result['total'] or 0)

    @extend_schema_field(serializers.DecimalField(max_digits=15, decimal_places=2))
    def get_total_withdrawals(self, obj):
        result = obj.transactions.filter(
            transaction_type='withdrawal',
            status='completed'
        ).aggregate(total=models.Sum('amount'))
        return float(result['total'] or 0)

    @extend_schema_field(serializers.IntegerField())
    def get_pending_transactions(self, obj):
        return obj.transactions.filter(status='pending').count()

    @extend_schema_field(serializers.IntegerField())
    def get_transaction_count(self, obj):
        return obj.transactions.count()


class AdminTransactionSerializer(serializers.ModelSerializer):
    """Serializer for transaction management"""

    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.full_name', read_only=True, allow_blank=True)
    user_balance = serializers.DecimalField(
        source='user.balance',
        max_digits=15,
        decimal_places=2,
        read_only=True
    )
    processed_by_email = serializers.EmailField(source='processed_by.email', read_only=True)
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = [
            'id',
            'user',
            'user_email',
            'user_full_name',
            'user_balance',
            'transaction_type',
            'amount',
            'commission',
            'total_amount',
            'status',
            'payment_method',
            'payment_receipt',
            'admin_notes',
            'processed_by',
            'processed_by_email',
            'created_at',
            'processed_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'commission']

    @extend_schema_field(serializers.DecimalField(max_digits=15, decimal_places=2))
    def get_total_amount(self, obj):
        return obj.total_amount()
