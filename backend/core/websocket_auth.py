"""
WebSocket JWT Authentication Middleware

Provides JWT-based authentication for Django Channels WebSocket connections.
Supports token from both query parameters and cookies.
"""
from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from apps.accounts.models import User
from urllib.parse import parse_qs
import logging

logger = logging.getLogger(__name__)


@database_sync_to_async
def get_user_from_token(token_string):
    """
    Validate JWT token and return associated user

    Args:
        token_string: JWT access token string

    Returns:
        User object if valid, AnonymousUser if invalid
    """
    try:
        # Validate and decode the access token
        access_token = AccessToken(token_string)
        user_id = access_token['user_id']

        # Fetch user from database
        user = User.objects.get(id=user_id)

        # Additional validation: check if user is active
        if not user.is_active:
            logger.warning(f"Inactive user attempted WebSocket connection: {user.email}")
            return AnonymousUser()

        logger.info(f"WebSocket authenticated user: {user.email}")
        return user

    except (InvalidToken, TokenError) as e:
        logger.debug(f"Invalid JWT token for WebSocket: {e}")
        return AnonymousUser()
    except User.DoesNotExist:
        logger.warning(f"User not found for token user_id: {access_token.get('user_id')}")
        return AnonymousUser()
    except Exception as e:
        logger.error(f"Unexpected error in WebSocket auth: {e}")
        return AnonymousUser()


class JWTAuthMiddleware:
    """
    Custom middleware for JWT authentication in WebSocket connections

    Extracts token from:
    1. Query string (?token=xxx)
    2. Cookies (access_token)
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        """
        Authenticate WebSocket connection and add user to scope

        Args:
            scope: ASGI connection scope
            receive: ASGI receive channel
            send: ASGI send channel
        """
        # Extract token from query string
        query_string = scope.get('query_string', b'').decode()
        params = parse_qs(query_string)
        token = params.get('token', [None])[0]  # Get first value or None

        # If no token in query string, try cookies
        if not token:
            # Parse cookies from headers
            headers = dict(scope.get('headers', []))
            cookie_header = headers.get(b'cookie', b'').decode()

            # Simple cookie parsing
            cookies = {}
            if cookie_header:
                for cookie in cookie_header.split('; '):
                    if '=' in cookie:
                        key, value = cookie.split('=', 1)
                        cookies[key] = value

            token = cookies.get('access_token')

        # Authenticate user with token
        if token:
            scope['user'] = await get_user_from_token(token)
        else:
            scope['user'] = AnonymousUser()

        # Log connection attempt
        user = scope['user']
        if user.is_authenticated:
            logger.info(f"[WS Auth] Authenticated connection: {user.email}")
        else:
            logger.debug("[WS Auth] Anonymous connection")

        return await self.app(scope, receive, send)


def JWTAuthMiddlewareStack(app):
    """
    Wrap the given application with JWT authentication middleware

    Usage:
        application = ProtocolTypeRouter({
            "websocket": JWTAuthMiddlewareStack(
                URLRouter(websocket_urlpatterns)
            ),
        })

    Args:
        app: ASGI application to wrap

    Returns:
        Wrapped application with JWT auth
    """
    return JWTAuthMiddleware(AuthMiddlewareStack(app))
