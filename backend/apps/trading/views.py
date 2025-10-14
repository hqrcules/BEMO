from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg, Max, Min, Q, Count
from .models import BotTrade, TradingSession
from .serializers import (
    BotTradeSerializer,
    TradingSessionSerializer,
    TradingStatsSerializer
)


class BotTradeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for bot trades
    GET /api/trading/trades/ - list all user trades
    GET /api/trading/trades/{id}/ - retrieve single trade
    """
    serializer_class = BotTradeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BotTrade.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def open(self, request):
        """
        Get all open trades
        GET /api/trading/trades/open/
        """
        trades = self.get_queryset().filter(is_open=True)
        serializer = self.get_serializer(trades, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def closed(self, request):
        """
        Get all closed trades
        GET /api/trading/trades/closed/
        """
        trades = self.get_queryset().filter(is_open=False)
        serializer = self.get_serializer(trades, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get trading statistics
        GET /api/trading/trades/stats/
        """
        trades = self.get_queryset()

        total_trades = trades.count()
        open_trades = trades.filter(is_open=True).count()
        closed_trades = trades.filter(is_open=False).count()

        # Winning/Losing trades
        winning_trades = trades.filter(is_open=False, profit_loss__gt=0).count()
        losing_trades = trades.filter(is_open=False, profit_loss__lt=0).count()

        # Win rate
        win_rate = (winning_trades / closed_trades * 100) if closed_trades > 0 else 0.0

        # Profit stats
        closed_trades_qs = trades.filter(is_open=False)
        total_profit = closed_trades_qs.aggregate(Sum('profit_loss'))['profit_loss__sum'] or 0
        average_profit = closed_trades_qs.aggregate(Avg('profit_loss'))['profit_loss__avg'] or 0
        best_trade = closed_trades_qs.aggregate(Max('profit_loss'))['profit_loss__max'] or 0
        worst_trade = closed_trades_qs.aggregate(Min('profit_loss'))['profit_loss__min'] or 0

        stats_data = {
            'total_trades': total_trades,
            'open_trades': open_trades,
            'closed_trades': closed_trades,
            'winning_trades': winning_trades,
            'losing_trades': losing_trades,
            'win_rate': round(win_rate, 2),
            'total_profit': total_profit,
            'average_profit': average_profit,
            'best_trade': best_trade,
            'worst_trade': worst_trade,
        }

        serializer = TradingStatsSerializer(stats_data)
        return Response(serializer.data)


class TradingSessionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for trading sessions
    GET /api/trading/sessions/ - list all user sessions
    GET /api/trading/sessions/{id}/ - retrieve single session
    """
    serializer_class = TradingSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TradingSession.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get active trading session
        GET /api/trading/sessions/active/
        """
        session = self.get_queryset().filter(is_active=True).first()

        if session:
            serializer = self.get_serializer(session)
            return Response(serializer.data)

        return Response({
            'message': 'No active trading session'
        }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def trades(self, request, pk=None):
        """
        Get all trades for a specific session
        GET /api/trading/sessions/{id}/trades/
        """
        session = self.get_object()

        # Get trades in the session time range
        trades = BotTrade.objects.filter(
            user=session.user,
            opened_at__gte=session.started_at
        )

        if session.ended_at:
            trades = trades.filter(opened_at__lte=session.ended_at)

        serializer = BotTradeSerializer(trades, many=True)
        return Response(serializer.data)
