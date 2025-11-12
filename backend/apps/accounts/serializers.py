from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from drf_spectacular.utils import extend_schema_field
from datetime import date
import re
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


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile with wallet address"""

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'phone',
            'date_of_birth',
            'wallet_address',
            'balance',
            'bot_type',
            'is_verified',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'email',
            'balance',
            'bot_type',
            'is_verified',
            'created_at',
        ]

    def validate_wallet_address(self, value):
        """Validate wallet address format"""
        if value and len(value) < 26:
            raise serializers.ValidationError(
                'Wallet address must be at least 26 characters long.'
            )
        return value


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


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""

    password = serializers.CharField(
        write_only=True,
        required=True,
        min_length=6,
        style={'input_type': 'password'}
    )
    confirm_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'email',
            'phone',
            'date_of_birth',
            'password',
            'confirm_password',
        ]

    def validate_email(self, value):
        """Validate email uniqueness"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('User with this email already exists.')
        return value

    def validate_phone(self, value):
        """Validate phone format and uniqueness"""
        # Remove spaces and validate format
        phone_pattern = re.compile(r'^[\d\+\-\s()]+$')
        if not phone_pattern.match(value):
            raise serializers.ValidationError('Phone number can only contain digits, +, -, and spaces.')

        # Check uniqueness (only if phone is provided and not empty)
        if value and User.objects.filter(phone=value).exists():
            raise serializers.ValidationError('User with this phone number already exists.')

        return value

    def validate_date_of_birth(self, value):
        """Validate date of birth"""
        if value > date.today():
            raise serializers.ValidationError('Date of birth cannot be in the future.')

        # Optional: Check minimum age (e.g., 18 years)
        today = date.today()
        age = today.year - value.year - ((today.month, today.day) < (value.month, value.day))
        if age < 18:
            raise serializers.ValidationError('You must be at least 18 years old to register.')

        return value

    def validate(self, attrs):
        """Validate password match"""
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        return attrs

    def create(self, validated_data):
        """Create new user with hashed password"""
        # Remove confirm_password as it's not a model field
        validated_data.pop('confirm_password')

        # Extract password
        password = validated_data.pop('password')

        # Create full_name from first_name and last_name
        full_name = f"{validated_data.get('first_name', '')} {validated_data.get('last_name', '')}".strip()
        validated_data['full_name'] = full_name

        # Create user
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()

        return user
