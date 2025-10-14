from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from drf_spectacular.utils import extend_schema_field
from .models import User


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model - read operations"""

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'balance',
            'bot_type',
            'is_verified',
            'is_staff',
            'is_superuser',
            'created_at',
            'last_login',
        ]
        read_only_fields = [
            'id',
            'balance',
            'bot_type',
            'is_verified',
            'is_staff',
            'is_superuser',
            'created_at',
            'last_login',
        ]



class LoginSerializer(serializers.Serializer):
    """Serializer for user login"""

    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            user = authenticate(
                request=self.context.get('request'),
                email=email,
                password=password
            )

            if not user:
                raise serializers.ValidationError(
                    'Unable to log in with provided credentials.',
                    code='authorization'
                )

            if not user.is_active:
                raise serializers.ValidationError(
                    'User account is disabled.',
                    code='authorization'
                )

            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError(
                'Must include "email" and "password".',
                code='authorization'
            )


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change"""

    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Password fields do not match.'
            })
        return attrs

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""

    class Meta:
        model = User
        fields = ['full_name']


class UserDetailSerializer(serializers.ModelSerializer):
    """Detailed user serializer with additional info"""

    total_deposits = serializers.SerializerMethodField()
    total_withdrawals = serializers.SerializerMethodField()
    total_trades = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'full_name',
            'balance',
            'bot_type',
            'is_verified',
            'created_at',
            'last_login',
            'total_deposits',
            'total_withdrawals',
            'total_trades',
        ]
        read_only_fields = [
            'id',
            'email',
            'balance',
            'bot_type',
            'is_verified',
            'created_at',
            'last_login',
        ]

    @extend_schema_field(serializers.IntegerField)
    def get_total_deposits(self, obj):
        """Get total number of completed deposits"""
        try:
            return obj.transactions.filter(
                transaction_type='deposit',
                status='completed'
            ).count()
        except Exception:
            return 0

    @extend_schema_field(serializers.IntegerField)
    def get_total_withdrawals(self, obj):
        """Get total number of completed withdrawals"""
        try:
            return obj.transactions.filter(
                transaction_type='withdrawal',
                status='completed'
            ).count()
        except Exception:
            return 0

    @extend_schema_field(serializers.IntegerField)
    def get_total_trades(self, obj):
        """Get total number of bot trades"""
        try:
            return obj.bot_trades.count()
        except Exception:
            return 0
