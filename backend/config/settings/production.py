from .base import *
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
import sys

# ========== CRITICAL SECURITY VALIDATION ==========
# Fail fast if required security settings are not properly configured

# Check 1: SECRET_KEY must be set to a secure value
if SECRET_KEY == 'django-insecure-change-this-in-production':
    print("=" * 80)
    print("FATAL ERROR: SECRET_KEY must be set to a secure value in production!")
    print("Generate one with: python -c 'import secrets; print(secrets.token_urlsafe(50))'")
    print("=" * 80)
    sys.exit(1)

# Check 2: CORS must not allow all origins in production
if CORS_ALLOW_ALL_ORIGINS:
    print("=" * 80)
    print("FATAL ERROR: CORS_ALLOW_ALL_ORIGINS must be False in production!")
    print("Set CORS_ALLOWED_ORIGINS instead to specific domains")
    print("=" * 80)
    sys.exit(1)

# Check 3: DEBUG must be False in production
if DEBUG:
    print("=" * 80)
    print("WARNING: DEBUG is True in production settings!")
    print("This is overridden to False below, but your environment config should set DEBUG=False")
    print("=" * 80)

DEBUG = False

# ========== SECURITY SETTINGS ==========
# Force HTTPS in production
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Force secure cookies (overrides base.py settings)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Additional security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HTTPS Strict Transport Security (HSTS)
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Sentry Error Tracking (опціонально)
if config('SENTRY_DSN', default=''):
    sentry_sdk.init(
        dsn=config('SENTRY_DSN'),
        integrations=[DjangoIntegration()],
        traces_sample_rate=0.1,
        send_default_pii=True
    )

# Cache with Redis
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://localhost:6379/1'),
    }
}
