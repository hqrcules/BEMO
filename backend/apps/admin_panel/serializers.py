from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import PaymentDetails, SiteSettings
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
    user_full_name = serializers.CharField(source='user.full_name', read_only=True)
    user_balance = serializers.DecimalField(source='user.balance', max_digits=15, decimal_places=2, read_only=True)
    processed_by_email = serializers.EmailField(source='processed_by.email', read_only=True)
    total_amount = serializers.SerializerMethodField()
    payment_receipt = serializers.SerializerMethodField()

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

    def get_total_amount(self, obj):
        """Return total amount including commission"""
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


class SiteSettingsSerializer(serializers.ModelSerializer):
    """Serializer for SiteSettings model"""

    updated_by_email = serializers.EmailField(
        source='updated_by.email',
        read_only=True
    )

    class Meta:
        model = SiteSettings
        fields = [
            'id',
            'key',
            'value',
            'description',
            'created_at',
            'updated_at',
            'updated_by',
            'updated_by_email',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'updated_by']
