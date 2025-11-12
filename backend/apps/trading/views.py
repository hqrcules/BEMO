from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.db.models import Sum, Avg, Count, Q
from decimal import Decimal
import requests
import logging

logger = logging.getLogger('apps.trading')

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
        return BotTrade.objects.filter(user=self.request.user).order_by('-opened_at')

    def list(self, request, *args, **kwargs):
        """List all trades with total profit"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        total_profit = queryset.filter(is_open=False).aggregate(
            total=Sum('profit_loss')
        )['total'] or Decimal('0')

        return Response({
            'results': serializer.data,  # Changed from 'trades' to 'results' for consistency
            'total_profit': float(total_profit)
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get comprehensive trading statistics
        URL: /api/trading/trades/stats/
        """
        trades = BotTrade.objects.filter(user=request.user)

        total_trades = trades.count()
        open_trades = trades.filter(is_open=True).count()
        closed_trades = trades.filter(is_open=False).count()

        # Calculate stats from closed trades only
        closed_trades_qs = trades.filter(is_open=False)

        if closed_trades_qs.exists():
            winning_trades = closed_trades_qs.filter(profit_loss__gt=0).count()
            losing_trades = closed_trades_qs.filter(profit_loss__lt=0).count()

            aggregates = closed_trades_qs.aggregate(
                total_profit=Sum('profit_loss'),
                average_profit=Avg('profit_loss'),
            )

            total_profit = aggregates['total_profit'] or Decimal('0.00')
            average_profit = aggregates['average_profit'] or Decimal('0.00')

            # Get best and worst trades
            best_trade_obj = closed_trades_qs.order_by('-profit_loss').first()
            worst_trade_obj = closed_trades_qs.order_by('profit_loss').first()

            best_trade = best_trade_obj.profit_loss if best_trade_obj else Decimal('0.00')
            worst_trade = worst_trade_obj.profit_loss if worst_trade_obj else Decimal('0.00')

            win_rate = (winning_trades / closed_trades * 100) if closed_trades > 0 else 0.0
        else:
            winning_trades = 0
            losing_trades = 0
            total_profit = Decimal('0.00')
            average_profit = Decimal('0.00')
            best_trade = Decimal('0.00')
            worst_trade = Decimal('0.00')
            win_rate = 0.0

        return Response({
            'total_trades': total_trades,
            'open_trades': open_trades,
            'closed_trades': closed_trades,
            'winning_trades': winning_trades,
            'losing_trades': losing_trades,
            'win_rate': round(win_rate, 2),
            'total_profit': str(total_profit),
            'average_profit': str(average_profit),
            'best_trade': str(best_trade),
            'worst_trade': str(worst_trade),
        })

    @action(detail=False, methods=['get'])
    def open(self, request):
        """
        Get all open positions
        URL: /api/trading/trades/open/
        """
        open_positions = BotTrade.objects.filter(
            user=request.user,
            is_open=True
        ).order_by('-opened_at')

        serializer = self.get_serializer(open_positions, many=True)

        return Response({
            'results': serializer.data,
            'count': open_positions.count()
        })

    @action(detail=False, methods=['get'])
    def closed(self, request):
        """
        Get all closed trades
        URL: /api/trading/trades/closed/
        """
        closed_trades = BotTrade.objects.filter(
            user=request.user,
            is_open=False
        ).order_by('-closed_at')

        serializer = self.get_serializer(closed_trades, many=True)

        # Calculate total profit from closed trades
        total_profit = closed_trades.aggregate(
            total=Sum('profit_loss')
        )['total'] or Decimal('0')

        return Response({
            'results': serializer.data,
            'count': closed_trades.count(),
            'total_profit': float(total_profit)
        })

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        """
        Manually close an open position
        URL: /api/trading/trades/{id}/close/
        """
        try:
            trade = self.get_object()

            if not trade.is_open:
                return Response(
                    {'error': 'This trade is already closed'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Mark as closed (you can add more logic here)
            from django.utils import timezone
            trade.is_open = False
            trade.closed_at = timezone.now()

            # If exit_price is not set, you might want to fetch current market price
            if not trade.exit_price:
                trade.exit_price = trade.entry_price  # Fallback

            trade.save()

            serializer = self.get_serializer(trade)
            return Response(serializer.data)

        except BotTrade.DoesNotExist:
            return Response(
                {'error': 'Trade not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class TradingSessionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TradingSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TradingSession.objects.filter(user=self.request.user).order_by('-started_at')

    def list(self, request, *args, **kwargs):
        """List all sessions"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        return Response({
            'results': serializer.data,
            'count': queryset.count()
        })

    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Get active session
        URL: /api/trading/sessions/active/
        """
        active_session = self.get_queryset().filter(is_active=True).first()

        if not active_session:
            return Response(
                {'detail': 'No active session found'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = self.get_serializer(active_session)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get session statistics
        URL: /api/trading/sessions/stats/
        """
        sessions = self.get_queryset()

        stats = {
            'total_sessions': sessions.count(),
            'active_sessions': sessions.filter(is_active=True).count(),
            'total_trades': sum(s.total_trades for s in sessions),
            'total_profit': float(sessions.aggregate(total=Sum('total_profit'))['total'] or Decimal('0')),
            'avg_profit_per_session': float(sessions.aggregate(avg=Avg('total_profit'))['avg'] or Decimal('0')),
        }

        return Response(stats)

    @action(detail=False, methods=['post'])
    def start_bot(self, request):
        """
        Start bot trading
        URL: /api/trading/sessions/start-bot/
        """
        # Check if user already has active session
        if TradingSession.objects.filter(user=request.user, is_active=True).exists():
            return Response(
                {'status': 'error', 'message': 'Bot is already running'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create new session
        session = TradingSession.objects.create(
            user=request.user,
            bot_type=request.user.bot_type,
            starting_balance=request.user.balance,
            current_balance=request.user.balance,
            is_active=True
        )

        serializer = self.get_serializer(session)
        return Response({
            'status': 'success',
            'message': 'Bot started successfully',
            'session': serializer.data
        })

    @action(detail=False, methods=['post'])
    def stop_bot(self, request):
        """
        Stop bot trading
        URL: /api/trading/sessions/stop-bot/
        """
        try:
            session = TradingSession.objects.get(user=request.user, is_active=True)

            from django.utils import timezone
            session.is_active = False
            session.ended_at = timezone.now()
            session.save()

            serializer = self.get_serializer(session)
            return Response({
                'status': 'success',
                'message': 'Bot stopped successfully',
                'session': serializer.data
            })
        except TradingSession.DoesNotExist:
            return Response(
                {'status': 'error', 'message': 'No active bot session found'},
                status=status.HTTP_404_NOT_FOUND
            )


class MarketHistoryView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        symbol = request.query_params.get('symbol')
        interval = request.query_params.get('interval', '1h')

        # Get client info for debugging
        client_ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', 'unknown'))
        user_agent = request.META.get('HTTP_USER_AGENT', 'unknown')

        logger.info(f"📥 Market History Request - Symbol: {symbol}, Interval: {interval}, Client: {client_ip}")
        logger.debug(f"User Agent: {user_agent}")

        if not symbol:
            logger.warning(f"⚠️ Market History Request missing symbol - Client: {client_ip}")
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
                logger.error(f"❌ No data returned for {symbol} - Client: {client_ip}")
                return Response(
                    {
                        'error': 'No data available for this symbol and interval',
                        'details': 'This could be due to: 1) Invalid symbol, 2) Binance API rate limit, 3) Network connectivity issues, 4) Symbol not supported by Binance'
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            if len(data['ohlc']) < 5:
                logger.warning(f"⚠️ Insufficient data for {symbol}: {len(data['ohlc'])} candles")
                return Response(
                    {
                        'error': f'Insufficient data for {interval} interval. Only {len(data["ohlc"])} candles available. Try a shorter interval.'
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            logger.info(f"✅ Successfully returned {len(data['ohlc'])} candles for {symbol} - Client: {client_ip}")
            return Response(data, status=status.HTTP_200_OK)

        except requests.Timeout:
            logger.error(f"⏱️ Request timeout for {symbol} - Client: {client_ip}")
            return Response(
                {
                    'error': 'Request timeout. Binance API is not responding',
                    'details': 'The request took too long. This could indicate network issues or Binance API being slow.'
                },
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        except requests.exceptions.ConnectionError as e:
            logger.error(f"🌐 Connection error for {symbol} - Client: {client_ip}, Error: {str(e)}")
            return Response(
                {
                    'error': 'Network connection error',
                    'details': 'Unable to connect to Binance API. Check your internet connection or firewall settings.'
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.exception(f"💥 Unexpected error for {symbol} - Client: {client_ip}")
            return Response(
                {
                    'error': f'Internal error: {str(e)}',
                    'details': 'An unexpected error occurred while fetching market data'
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
