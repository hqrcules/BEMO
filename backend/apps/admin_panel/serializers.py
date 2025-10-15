from rest_framework import serializers
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

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'balance',
            'bot_type',
            'is_active',
            'is_verified',
            'created_at',
            'last_login',
            'total_deposits',
            'total_withdrawals',
            'pending_transactions',
        ]
        read_only_fields = ['id', 'created_at', 'last_login']

    @extend_schema_field(serializers.IntegerField)
    def get_total_deposits(self, obj):
        return obj.transactions.filter(
            transaction_type='deposit',
            status='completed'
        ).count()

    @extend_schema_field(serializers.IntegerField)
    def get_total_withdrawals(self, obj):
        return obj.transactions.filter(
            transaction_type='withdrawal',
            status='completed'
        ).count()

    @extend_schema_field(serializers.IntegerField)
    def get_pending_transactions(self, obj):
        return obj.transactions.filter(status='pending').count()


class AdminTransactionSerializer(serializers.ModelSerializer):
    """Serializer for transaction management"""

    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id',
            'user',
            'user_email',
            'transaction_type',
            'amount',
            'commission',
            'status',
            'payment_receipt',
            'admin_notes',
            'processed_by',
            'created_at',
            'processed_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'commission']
