import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from core.middleware.jwt_auth_middleware import CookieJWTAuthMiddleware

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

django_asgi_app = get_asgi_application()

from apps.trading.routing import websocket_urlpatterns as trading_ws

websocket_urlpatterns = trading_ws

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        CookieJWTAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        )
    ),
})