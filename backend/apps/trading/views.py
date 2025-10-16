from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Avg, Max, Min
from .models import BotTrade, TradingSession
from .serializers import (
    BotTradeSerializer,
    TradingSessionSerializer,
    TradingStatsSerializer
)
import random
import logging

logger = logging.getLogger(__name__)


class BotTradeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BotTradeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BotTrade.objects.filter(user=self.request.user).order_by('-opened_at')

    @action(detail=False, methods=['get'])
    def stats(self, request):
        trades = self.get_queryset()
        total_trades = trades.count()
        closed_trades = trades.filter(is_open=False).count()
        winning_trades = trades.filter(is_open=False, profit_loss__gt=0).count()
        win_rate = (winning_trades / closed_trades * 100) if closed_trades > 0 else 0.0
        closed_trades_qs = trades.filter(is_open=False)
        stats_data = {
            'total_trades': total_trades,
            'open_trades': trades.filter(is_open=True).count(),
            'closed_trades': closed_trades,
            'winning_trades': winning_trades,
            'losing_trades': closed_trades - winning_trades,
            'win_rate': round(win_rate, 2),
            'total_profit': closed_trades_qs.aggregate(Sum('profit_loss'))['profit_loss__sum'] or 0,
            'average_profit': closed_trades_qs.aggregate(Avg('profit_loss'))['profit_loss__avg'] or 0,
            'best_trade': closed_trades_qs.aggregate(Max('profit_loss'))['profit_loss__max'] or 0,
            'worst_trade': closed_trades_qs.aggregate(Min('profit_loss'))['profit_loss__min'] or 0,
        }
        serializer = TradingStatsSerializer(stats_data)
        return Response(serializer.data)


class TradingSessionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TradingSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TradingSession.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get'])
    def active(self, request):
        logger.info(f"Searching for active session for user {request.user.email}")
        session = self.get_queryset().filter(is_active=True).first()
        if session:
            logger.info(f"Active session found for user {request.user.email}")
            serializer = self.get_serializer(session)
            return Response(serializer.data)
        logger.info(f"No active session found for user {request.user.email}")
        return Response({'message': 'No active session'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def start(self, request):
        logger.info(f"Attempting to start a new session for {request.user.email}")
        from .bot.simulator import TradingBotSimulator
        if TradingSession.objects.filter(user=request.user, is_active=True).exists():
            logger.warning(f"Attempted to start an already active session for {request.user.email}")
            return Response({'message': 'Session already active'}, status=status.HTTP_400_BAD_REQUEST)

        simulator = TradingBotSimulator(request.user, request.user.bot_type)
        session = simulator.start_session()
        new_trades_count = random.randint(1, 3)
        new_trades = simulator.generate_multiple_trades(new_trades_count)
        logger.info(f"New session created and generated {new_trades_count} initial trades for {request.user.email}")

        session.refresh_from_db()

        session_serializer = self.get_serializer(session)
        trades_serializer = BotTradeSerializer(new_trades, many=True)

        return Response({
            'session': session_serializer.data,
            'new_trades': trades_serializer.data
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def stop(self, request):
        logger.info(f"Attempting to stop session for {request.user.email}")
        session = self.get_queryset().filter(is_active=True).first()
        if not session:
            logger.warning(f"Attempted to stop a non-existent session for {request.user.email}")
            return Response({'message': 'No active session to stop'}, status=status.HTTP_404_NOT_FOUND)

        logger.info(f"Stopping session for {request.user.email}")
        from .bot.simulator import TradingBotSimulator
        simulator = TradingBotSimulator(request.user, request.user.bot_type)
        simulator.session = session
        stopped_session = simulator.stop_session()
        logger.info(f"Session stopped successfully for {request.user.email}")
        serializer = self.get_serializer(stopped_session)
        return Response(serializer.data)