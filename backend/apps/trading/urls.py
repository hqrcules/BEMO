from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BotTradeViewSet, TradingSessionViewSet, MarketHistoryView

app_name = 'trading'

router = DefaultRouter()
router.register(r'trades', BotTradeViewSet, basename='trade')
router.register(r'sessions', TradingSessionViewSet, basename='session')

urlpatterns = [
    path('history/', MarketHistoryView.as_view(), name='market-history'),
    path('', include(router.urls)),
]
