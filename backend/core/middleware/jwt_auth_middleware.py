import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

User = get_user_model()


@database_sync_to_async
def get_user(token_key):
    try:
        access_token = AccessToken(token_key)
        user_id = access_token.get(settings.SIMPLE_JWT['USER_ID_CLAIM'])
        if user_id:
            return User.objects.get(id=user_id)
        return AnonymousUser()
    except (TokenError, User.DoesNotExist, jwt.DecodeError):
        return AnonymousUser()


class CookieJWTAuthMiddleware(BaseMiddleware):
    def __init__(self, inner):
        super().__init__(inner)

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if not token:
            headers = dict(scope['headers'])
            cookie_header = headers.get(b'cookie')
            if cookie_header:
                cookies = dict(cookie.split('=', 1) for cookie in cookie_header.decode().split('; ') if '=' in cookie)
                token = cookies.get('access_token')

        if token:
            scope['user'] = await get_user(token)
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)