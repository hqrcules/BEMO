from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.db.models import Sum, Avg
from decimal import Decimal
import requests

from .models import BotTrade, TradingSession
from .serializers import (
    BotTradeSerializer,
    TradingSessionSerializer,
    TradingStatsSerializer
)
from .services import MarketDataService


class BotTradeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BotTradeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BotTrade.objects.filter(user=self.request.user).order_by('-closed_at')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        total_profit = queryset.filter(is_open=False).aggregate(
            total=Sum('profit_loss')
        )['total'] or Decimal('0')

        return Response({
            'trades': serializer.data,
            'total_profit': float(total_profit)
        })


class TradingSessionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TradingSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TradingSession.objects.filter(user=self.request.user).order_by('-started_at')

    @action(detail=False, methods=['get'])
    def active(self, request):
        active_sessions = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(active_sessions, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        sessions = self.get_queryset()

        stats = {
            'total_sessions': sessions.count(),
            'active_sessions': sessions.filter(is_active=True).count(),
            'total_trades': sum(s.total_trades for s in sessions),
            'total_profit': float(sessions.aggregate(total=Sum('total_profit'))['total'] or Decimal('0')),
            'avg_profit_per_session': float(sessions.aggregate(avg=Avg('total_profit'))['avg'] or Decimal('0')),
        }

        return Response(stats)


class MarketHistoryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        symbol = request.query_params.get('symbol')
        interval = request.query_params.get('interval', '1h')

        if not symbol:
            return Response(
                {'error': 'Symbol is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        limit_map = {
            '1h': 168,
            '4h': 168,
            '1d': 90,
            '1w': 100
        }
        limit = limit_map.get(interval, 168)

        try:
            market_service = MarketDataService()
            data = market_service.fetch_market_data(symbol, interval, limit)

            if not data:
                return Response(
                    {'error': 'No data available for this symbol and interval'},
                    status=status.HTTP_404_NOT_FOUND
                )

            if len(data['ohlc']) < 5:
                return Response(
                    {
                        'error': f'Insufficient data for {interval} interval. Only {len(data["ohlc"])} candles available. Try a shorter interval.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            return Response(data, status=status.HTTP_200_OK)

        except requests.Timeout:
            return Response(
                {'error': 'Request timeout. API is not responding'},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        except Exception as e:
            return Response(
                {'error': f'Internal error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
