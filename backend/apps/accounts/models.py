import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with email as username field"""

    BOT_TYPE_CHOICES = [
        ('none', 'No Bot'),
        ('basic', 'Basic Bot - 250 EUR'),
        ('premium', 'Premium Bot - 500 EUR'),
        ('specialist', 'Specialist Trading - 1000 EUR'),
    ]

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text='Unique identifier for the user'
    )
    email = models.EmailField(
        unique=True,
        max_length=255,
        help_text='User email address (used for login)'
    )
    first_name = models.CharField(
        max_length=100,
        blank=True,
        help_text='First name of the user'
    )
    last_name = models.CharField(
        max_length=100,
        blank=True,
        help_text='Last name of the user'
    )
    full_name = models.CharField(
        max_length=255,
        blank=True,
        help_text='Full name of the user'
    )
    phone = models.CharField(
        max_length=20,
        blank=True,
        help_text='Phone number of the user'
    )
    date_of_birth = models.DateField(
        null=True,
        blank=True,
        help_text='Date of birth of the user'
    )

    # Financial Information
    balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0.00,
        help_text='Current account balance'
    )
    bot_type = models.CharField(
        max_length=20,
        choices=BOT_TYPE_CHOICES,
        default='none',
        help_text='Active bot subscription type'
    )
    wallet_address = models.CharField(
        max_length=255,
        blank=True,
        help_text='Cryptocurrency wallet address for withdrawals'
    )

    # Account Status
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(
        default=False,
        help_text='KYC verification status'
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)

    # Security
    last_login_ip = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text='Last IP address used for login'
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.email

    def get_full_name(self):
        return self.full_name or self.email

    def get_short_name(self):
        return self.email.split('@')[0]
