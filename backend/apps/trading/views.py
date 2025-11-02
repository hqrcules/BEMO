from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.db.models import Sum, Avg, Max, Min, Q, Count
from django.utils import timezone
from django.db import transaction as db_transaction
from django.db import models
from decimal import Decimal
from asgiref.sync import async_to_sync
from .models import BotTrade, TradingSession
from .serializers import (
    BotTradeSerializer,
    TradingSessionSerializer,
    TradingStatsSerializer
)
from .utils.market_data_fetcher import MarketDataFetcher


class BotTradeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BotTradeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BotTrade.objects.filter(user=self.request.user).order_by('-closed_at')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({'results': serializer.data})

    @action(detail=False, methods=['get'])
    def open(self, request):
        trades = self.get_queryset().filter(is_open=True)
        serializer = self.get_serializer(trades, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def closed(self, request):
        trades = self.get_queryset().filter(is_open=False)
        serializer = self.get_serializer(trades, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        trades = self.get_queryset()

        total_trades = trades.count()
        open_trades = trades.filter(is_open=True).count()
        closed_trades = trades.filter(is_open=False).count()

        winning_trades = trades.filter(is_open=False, profit_loss__gt=0).count()
        losing_trades = trades.filter(is_open=False, profit_loss__lt=0).count()

        win_rate = (winning_trades / closed_trades * 100) if closed_trades > 0 else 0.0

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
    serializer_class = TradingSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TradingSession.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='start-bot')
    def start_bot(self, request):
        user = request.user
        if user.bot_type == 'none':
            return Response({'error': 'No bot purchased'}, status=status.HTTP_400_BAD_REQUEST)

        session, created = TradingSession.objects.get_or_create(
            user=user,
            is_active=True,
            defaults={'bot_type': user.bot_type, 'starting_balance': user.balance, 'current_balance': user.balance}
        )

        if not created and not session.is_active:
            session.is_active = True
            session.ended_at = None
            session.save(update_fields=['is_active', 'ended_at'])
            print(f"Reactivated existing session for user {user.email}")
        elif created:
            print(f"Started new session for user {user.email}")
        else:
            print(f"Session already active for user {user.email}")

        return Response({'status': 'Bot session active'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='stop-bot')
    def stop_bot(self, request):
        user = request.user
        closed_trade_count = 0
        session_stopped = False

        active_session = TradingSession.objects.filter(user=user, is_active=True).first()
        if active_session:
            active_session.is_active = False
            active_session.ended_at = timezone.now()
            active_session.save(update_fields=['is_active', 'ended_at'])
            session_stopped = True
            print(f"Stopped active session for user {user.email}")

        open_trades = BotTrade.objects.filter(user=user, is_open=True)
        closed_trade_count = open_trades.update(
            is_open=False,
            exit_price=models.F('entry_price'),
            closed_at=timezone.now(),
            profit_loss=Decimal('0.00'),
            profit_loss_percent=Decimal('0.00')
        )
        print(f"Closed {closed_trade_count} open positions for user {user.email}")

        status_message = f'Bot stopped. {closed_trade_count} open positions closed (at entry price).'
        if not session_stopped and closed_trade_count == 0:
            status_message = 'No active session found and no open positions to close.'
        elif not session_stopped:
            status_message = f'No active session found, but {closed_trade_count} open positions were closed (at entry price).'

        return Response({'status': status_message}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def active(self, request):
        session = self.get_queryset().filter(is_active=True).first()
        if session:
            serializer = self.get_serializer(session)
            return Response(serializer.data)
        return Response({'message': 'No active trading session'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def trades(self, request, pk=None):
        session = self.get_object()
        trades = BotTrade.objects.filter(
            user=session.user,
            opened_at__gte=session.started_at
        )
        if session.ended_at:
            trades = trades.filter(opened_at__lte=session.ended_at)
        serializer = BotTradeSerializer(trades, many=True)
        return Response(serializer.data)


class MarketHistoryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        symbol = request.query_params.get('symbol')
        interval = request.query_params.get('interval', '1d')

        if not symbol:
            return Response({"error": "Symbol parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        valid_intervals = ['1h', '4h', '1d', '1w']
        if interval not in valid_intervals:
            return Response({"error": f"Invalid interval. Must be one of {valid_intervals}"},
                            status=status.HTTP_400_BAD_REQUEST)

        fetcher = MarketDataFetcher()
        data = async_to_sync(fetcher.fetch_history)(symbol, interval)

        return Response(data)