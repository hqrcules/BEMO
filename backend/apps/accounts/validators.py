"""
Custom validators for account-related models

Provides validation for cryptocurrency wallet addresses, decimal values,
and other account-specific data to prevent invalid inputs and security issues.
"""
import re
from decimal import Decimal
from django.core.exceptions import ValidationError


def validate_crypto_wallet_address(value):
    """
    Validate cryptocurrency wallet addresses (Bitcoin and Ethereum)

    Supported formats:
    - Bitcoin Legacy: 25-34 characters, base58 encoded
    - Bitcoin SegWit: bc1 prefix, 42-62 characters
    - Ethereum: 0x prefix, 40 hex characters

    Args:
        value: Wallet address string to validate

    Raises:
        ValidationError: If address format is invalid
    """
    if not value:
        return  # Allow empty values (handled by required=False)

    # Strip whitespace
    value = value.strip()

    # Bitcoin address patterns
    # Legacy addresses: 1 or 3 prefix, 25-34 characters, base58
    btc_legacy_pattern = r'^[13][a-km-zA-HJ-NP-Z1-9]{24,33}$'
    # SegWit addresses: bc1 prefix, bech32 encoded
    btc_segwit_pattern = r'^bc1[a-z0-9]{39,59}$'

    # Ethereum address pattern: 0x + 40 hex characters
    eth_pattern = r'^0x[a-fA-F0-9]{40}$'

    # Validate against all supported formats
    is_valid = (
        re.match(btc_legacy_pattern, value) or
        re.match(btc_segwit_pattern, value) or
        re.match(eth_pattern, value)
    )

    if not is_valid:
        raise ValidationError(
            'Invalid wallet address format. Must be a valid Bitcoin (Legacy/SegWit) '
            'or Ethereum address. Examples: '
            '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa (BTC Legacy), '
            'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh (BTC SegWit), '
            '0x742d35Cc6634C0532925a3b844Bc454e4438f44e (ETH)',
            code='invalid_wallet_address'
        )


def validate_positive_decimal(value):
    """
    Ensure decimal values are positive (>= 0)

    Args:
        value: Decimal or numeric value to validate

    Raises:
        ValidationError: If value is negative
    """
    if value < 0:
        raise ValidationError(
            'Value must be positive (>= 0)',
            code='negative_value'
        )


def validate_bot_type(value):
    """
    Validate bot type selection

    Args:
        value: Bot type string

    Raises:
        ValidationError: If bot type is invalid
    """
    valid_types = ['none', 'basic', 'premium', 'specialist']

    if value not in valid_types:
        raise ValidationError(
            f'Invalid bot type. Must be one of: {", ".join(valid_types)}',
            code='invalid_bot_type'
        )


def validate_email_format(value):
    """
    Additional email validation beyond Django's default

    Prevents common email spoofing attempts and validates format

    Args:
        value: Email address string

    Raises:
        ValidationError: If email format is suspicious
    """
    if not value:
        return

    # Check for multiple @ symbols (email spoofing attempt)
    if value.count('@') != 1:
        raise ValidationError(
            'Invalid email format',
            code='invalid_email'
        )

    # Check for suspicious characters
    suspicious_chars = ['<', '>', '"', "'", '\\', '\n', '\r', '\t']
    if any(char in value for char in suspicious_chars):
        raise ValidationError(
            'Email contains invalid characters',
            code='invalid_email_chars'
        )

    # Check email length
    if len(value) > 254:  # RFC 5321
        raise ValidationError(
            'Email address is too long (max 254 characters)',
            code='email_too_long'
        )


def validate_full_name(value):
    """
    Validate full name field to prevent XSS and injection

    Args:
        value: Full name string

    Raises:
        ValidationError: If name contains invalid characters
    """
    if not value:
        return  # Allow empty (handled by required=False)

    # Check for HTML/script tags
    html_pattern = r'<[^>]+>'
    if re.search(html_pattern, value):
        raise ValidationError(
            'Name cannot contain HTML tags',
            code='html_in_name'
        )

    # Check for SQL injection patterns
    sql_patterns = [
        r"('|(\\')|(;)|(--)|(\/\*))",  # Common SQL injection chars
        r'(union|select|insert|update|delete|drop|create|alter)\s',  # SQL keywords
    ]

    for pattern in sql_patterns:
        if re.search(pattern, value, re.IGNORECASE):
            raise ValidationError(
                'Name contains invalid characters',
                code='invalid_name_chars'
            )

    # Length check
    if len(value) > 100:
        raise ValidationError(
            'Name is too long (max 100 characters)',
            code='name_too_long'
        )


def validate_transaction_amount(value):
    """
    Validate transaction amounts to prevent overflow and invalid values

    Args:
        value: Transaction amount (Decimal)

    Raises:
        ValidationError: If amount is invalid
    """
    # Must be positive
    validate_positive_decimal(value)

    # Check for reasonable maximum (prevent overflow)
    max_amount = Decimal('999999999999.99')  # 13 digits total, 2 decimal
    if value > max_amount:
        raise ValidationError(
            f'Amount exceeds maximum allowed value ({max_amount})',
            code='amount_too_large'
        )

    # Check for too many decimal places
    if value.as_tuple().exponent < -2:
        raise ValidationError(
            'Amount can have at most 2 decimal places',
            code='too_many_decimals'
        )
