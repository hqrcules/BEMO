"""
Optimized Trading Bot Simulator with Batch Operations
Implements batch inserts, bulk updates, and caching for scalability
"""

import random
import logging
from decimal import Decimal, ROUND_DOWN
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import timedelta
from collections import defaultdict

from django.utils import timezone
from django.db import transaction as db_transaction
from django.core.cache import cache
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from apps.trading.models import BotTrade, TradingSession
from apps.transactions.models import Transaction
from apps.trading.utils.crypto_fetcher import CryptoDataFetcher

logger = logging.getLogger(__name__)


@dataclass
class BotConfiguration:
    """Configuration profile for different bot tiers"""
    win_rate: Decimal
    profit_range: Tuple[Decimal, Decimal]
    loss_range: Tuple[Decimal, Decimal]
    duration_range: Tuple[int, int]
    min_open_duration: timedelta
    max_open_duration: timedelta
    trades_per_run_range: Tuple[int, int]
    max_open_positions: int
    high_yield_chance: Decimal
    high_profit_range: Tuple[Decimal, Decimal]
    high_loss_chance: Decimal
    high_loss_range: Tuple[Decimal, Decimal]
    risk_per_trade: Decimal
    trailing_stop_percent: Decimal
    take_profit_multiplier: Decimal


class BotConfigurationFactory:
    """Factory for creating bot configurations by tier"""

    CONFIGURATIONS = {
        'basic': BotConfiguration(
            win_rate=Decimal('72'),
            profit_range=(Decimal('0.4'), Decimal('2.8')),
            loss_range=(Decimal('-0.6'), Decimal('-2.2')),
            duration_range=(45, 280),
            min_open_duration=timedelta(minutes=1),
            max_open_duration=timedelta(minutes=12),
            trades_per_run_range=(1, 1),  # Changed to 1 trade per run
            max_open_positions=3,
            high_yield_chance=Decimal('0.5'),
            high_profit_range=(Decimal('3'), Decimal('8')),
            high_loss_chance=Decimal('2'),
            high_loss_range=(Decimal('-3'), Decimal('-8')),
            risk_per_trade=Decimal('0.02'),
            trailing_stop_percent=Decimal('1.5'),
            take_profit_multiplier=Decimal('2.5')
        ),
        'premium': BotConfiguration(
            win_rate=Decimal('82'),
            profit_range=(Decimal('0.8'), Decimal('4.5')),
            loss_range=(Decimal('-0.5'), Decimal('-2.0')),
            duration_range=(90, 540),
            min_open_duration=timedelta(minutes=2),
            max_open_duration=timedelta(minutes=22),
            trades_per_run_range=(1, 1),  # Changed to 1 trade per run
            max_open_positions=5,
            high_yield_chance=Decimal('1'),
            high_profit_range=(Decimal('5'), Decimal('12')),
            high_loss_chance=Decimal('1'),
            high_loss_range=(Decimal('-4'), Decimal('-10')),
            risk_per_trade=Decimal('0.03'),
            trailing_stop_percent=Decimal('2.0'),
            take_profit_multiplier=Decimal('3.0')
        ),
        'specialist': BotConfiguration(
            win_rate=Decimal('88'),
            profit_range=(Decimal('1.2'), Decimal('6.5')),
            loss_range=(Decimal('-0.8'), Decimal('-2.5')),
            duration_range=(240, 840),
            min_open_duration=timedelta(minutes=4),
            max_open_duration=timedelta(minutes=35),
            trades_per_run_range=(1, 1),  # Changed to 1 trade per run
            max_open_positions=8,
            high_yield_chance=Decimal('2'),
            high_profit_range=(Decimal('8'), Decimal('18')),
            high_loss_chance=Decimal('0.5'),
            high_loss_range=(Decimal('-5'), Decimal('-12')),
            risk_per_trade=Decimal('0.04'),
            trailing_stop_percent=Decimal('2.5'),
            take_profit_multiplier=Decimal('3.5')
        )
    }

    @classmethod
    def get_config(cls, bot_type: str) -> BotConfiguration:
        """Get configuration for specified bot type"""
        config = cls.CONFIGURATIONS.get(bot_type)
        if not config:
            raise ValueError(f'Invalid bot type: {bot_type}')
        return config

    @classmethod
    def get_config(cls, bot_type: str) -> BotConfiguration:
        """Get configuration for specified bot type"""
        config = cls.CONFIGURATIONS.get(bot_type)
        if not config:
            raise ValueError(f'Invalid bot type: {bot_type}')
        return config


class MarketSimulator:
    """Simulates realistic market conditions with caching"""

    def __init__(self, base_prices: Dict[str, Decimal]):
        self.base_prices = base_prices
        self.volatility_cache = {}

    def get_current_price(self, symbol: str, time_offset_seconds: int = 0) -> Decimal:
        """Generate realistic price with time-based variation"""
        base_price = self.base_prices.get(symbol, Decimal('0'))
        if base_price <= 0:
            return Decimal('0')

        volatility = self._get_volatility(symbol)
        time_factor = Decimal(str(time_offset_seconds / 3600))
        drift = Decimal(str(random.gauss(0, 0.0002))) * time_factor
        random_factor = Decimal(str(random.gauss(0, float(volatility))))

        price_multiplier = Decimal('1') + drift + random_factor
        current_price = base_price * price_multiplier

        return current_price.quantize(Decimal('1E-8'), rounding=ROUND_DOWN)

    def _get_volatility(self, symbol: str) -> Decimal:
        """Get volatility coefficient for symbol"""
        if symbol in self.volatility_cache:
            return self.volatility_cache[symbol]

        if 'BTC' in symbol or 'ETH' in symbol:
            volatility = Decimal('0.008')
        elif 'BNB' in symbol or 'SOL' in symbol:
            volatility = Decimal('0.012')
        else:
            volatility = Decimal('0.015')

        self.volatility_cache[symbol] = volatility
        return volatility

    def calculate_realistic_exit(
        self,
        entry_price: Decimal,
        target_percent: Decimal,
        side: str,
        duration_seconds: int
    ) -> Decimal:
        """Calculate exit price with realistic slippage"""
        if side == 'buy':
            exit_price = entry_price * (Decimal('1') + target_percent / Decimal('100'))
        else:
            exit_price = entry_price * (Decimal('1') - target_percent / Decimal('100'))

        slippage = Decimal(str(random.uniform(0.0001, 0.0005)))
        if target_percent > 0:
            exit_price = exit_price * (Decimal('1') - slippage)
        else:
            exit_price = exit_price * (Decimal('1') + slippage)

        noise_factor = Decimal(str(random.gauss(0, 0.0005 * (duration_seconds / 300))))
        exit_price = exit_price * (Decimal('1') + noise_factor)

        return exit_price.quantize(Decimal('1E-8'), rounding=ROUND_DOWN)


class PositionManager:
    """Manages trading positions with risk controls"""

    def __init__(self, config: BotConfiguration):
        self.config = config

    def calculate_position_size(
        self,
        balance: Decimal,
        entry_price: Decimal,
        open_positions_count: int
    ) -> Tuple[Decimal, Decimal]:
        """Calculate optimal position size"""
        min_trade_amount = Decimal('10.00')
        risk_amount = balance * self.config.risk_per_trade

        position_factor = Decimal('1') - (Decimal(str(open_positions_count)) * Decimal('0.1'))
        position_factor = max(position_factor, Decimal('0.5'))

        if balance < Decimal('100'):
            size_percent = Decimal('0.03')
        elif balance < Decimal('500'):
            size_percent = Decimal('0.05')
        elif balance < Decimal('2000'):
            size_percent = Decimal('0.08')
        elif balance < Decimal('10000'):
            size_percent = Decimal('0.12')
        else:
            size_percent = Decimal('0.15')

        trade_amount = min(risk_amount, balance * size_percent) * position_factor
        trade_amount = max(trade_amount, min_trade_amount)

        if trade_amount > balance * Decimal('0.95'):
            trade_amount = balance * Decimal('0.95')

        if trade_amount < min_trade_amount:
            logger.warning(f"Insufficient balance ({balance}) for min trade amount ({min_trade_amount}). Skipping trade.")
            return Decimal('0'), Decimal('0')

        quantity = (trade_amount / entry_price).quantize(Decimal('1E-8'), rounding=ROUND_DOWN)

        return trade_amount, quantity


class TradingBotSimulator:
    """
    Trading bot simulator - generates realistic trades
    """

    def __init__(self, user, bot_type: str):
        self.user = user
        self.bot_type = bot_type
        self.session: Optional[TradingSession] = None

        self.config = BotConfigurationFactory.get_config(bot_type)
        self.base_prices = self._fetch_market_prices()
        self.trading_pairs = list(self.base_prices.keys())
        self.market = MarketSimulator(self.base_prices)
        self.position_manager = PositionManager(self.config)
        self.channel_layer = get_channel_layer()

        logger.info(f"Initialized {bot_type} bot simulator for user {user.email}")

    def _fetch_market_prices(self) -> Dict[str, Decimal]:
        """Fetch market prices with caching"""
        cache_key = 'market_prices_v1'
        prices = cache.get(cache_key)

        if prices:
            logger.debug("Using cached market prices")
            return prices

        prices = CryptoDataFetcher.get_base_prices_sync(limit=30)

        if not prices:
            logger.warning("API price fetching failed, using fallback prices")
            prices = {
                'BTC/USDT': Decimal('67000.00'),
                'ETH/USDT': Decimal('3500.00'),
                'BNB/USDT': Decimal('580.00'),
                'SOL/USDT': Decimal('145.00'),
                'XRP/USDT': Decimal('0.52'),
                'ADA/USDT': Decimal('0.38'),
                'DOGE/USDT': Decimal('0.085'),
                'DOT/USDT': Decimal('6.20'),
                'MATIC/USDT': Decimal('0.72'),
                'AVAX/USDT': Decimal('28.50'),
            }

        cache.set(cache_key, prices, 300)
        return prices

    def start_session(self) -> Optional[TradingSession]:
        """Start or resume trading session with optimized cleanup"""
        try:
            self.session = TradingSession.objects.select_related('user').get(
                user=self.user,
                is_active=True
            )
            logger.info(f"Resumed active session for {self.user.email}")
        except TradingSession.DoesNotExist:
            # Cleanup old sessions before creating new one
            self._cleanup_old_sessions()

            self.session = TradingSession.objects.create(
                user=self.user,
                bot_type=self.bot_type,
                starting_balance=self.user.balance,
                current_balance=self.user.balance,
                is_active=True
            )
            logger.info(f"Started new session for {self.user.email}")

        return self.session

    def _cleanup_old_sessions(self) -> int:
        """
        Cleanup old inactive sessions and their trades to keep database lean.
        Keeps only the last 3 sessions per user for history.
        """
        # Get all inactive sessions for this user, ordered by most recent first
        old_sessions = TradingSession.objects.filter(
            user=self.user,
            is_active=False
        ).order_by('-ended_at')

        # Keep only the last 3 sessions
        sessions_to_keep = 3
        sessions_to_delete = old_sessions[sessions_to_keep:]

        if not sessions_to_delete:
            return 0

        # Get session IDs to delete
        session_ids = list(sessions_to_delete.values_list('id', flat=True))

        # Delete associated trades in bulk (much faster than cascading)
        trades_deleted = BotTrade.objects.filter(
            user=self.user
        ).exclude(
            # Keep trades from sessions we're keeping
            id__in=BotTrade.objects.filter(
                user=self.user,
                opened_at__gte=old_sessions[sessions_to_keep-1].started_at if old_sessions.count() > sessions_to_keep else timezone.now()
            ).values_list('id', flat=True)
        ).delete()[0]

        # Delete old sessions
        sessions_deleted = sessions_to_delete.delete()[0]

        logger.info(
            f"Cleaned up {sessions_deleted} old sessions and {trades_deleted} trades "
            f"for {self.user.email}"
        )

        return sessions_deleted

    def _calculate_profit_loss(
        self,
        entry_price: Decimal,
        exit_price: Decimal,
        quantity: Decimal,
        side: str
    ) -> Tuple[Decimal, Decimal]:
        """Calculate profit/loss with fees"""
        fee_percent = Decimal('0.002')

        if side == 'buy':
            raw_pl = (exit_price - entry_price) * quantity
        else:
            raw_pl = (entry_price - exit_price) * quantity

        trade_value = entry_price * quantity
        fees = trade_value * fee_percent
        profit_loss = raw_pl - fees
        profit_loss = profit_loss.quantize(Decimal('0.01'), rounding=ROUND_DOWN)

        if entry_price > 0:
            if side == 'buy':
                profit_loss_percent = ((exit_price - entry_price) / entry_price) * Decimal('100')
            else:
                profit_loss_percent = ((entry_price - exit_price) / entry_price) * Decimal('100')
            profit_loss_percent -= (fee_percent * Decimal('100'))
        else:
            profit_loss_percent = Decimal('0.00')

        profit_loss_percent = profit_loss_percent.quantize(Decimal('0.01'), rounding=ROUND_DOWN)

        return profit_loss, profit_loss_percent

    def _send_bot_trade_update(self, trade: BotTrade, new_balance: Decimal):
        """Send WebSocket notification about trade (open or closed)"""
        if not self.channel_layer:
            return

        group_name = f'user_{self.user.id}'

        try:
            async_to_sync(self.channel_layer.group_send)(
                group_name,
                {
                    'type': 'bot_trade_update',
                    'balance': str(new_balance),
                    'trade': {
                        'id': str(trade.id),
                        'symbol': trade.symbol,
                        'side': trade.side,
                        'entry_price': str(trade.entry_price),
                        'exit_price': str(trade.exit_price) if trade.exit_price else None,
                        'quantity': str(trade.quantity),
                        'profit_loss': str(trade.profit_loss),
                        'profit_loss_percent': str(trade.profit_loss_percent),
                        'is_open': trade.is_open,
                        'opened_at': trade.opened_at.isoformat() if trade.opened_at else None,
                        'closed_at': trade.closed_at.isoformat() if trade.closed_at else None,
                    }
                }
            )
            status = "OPENED" if trade.is_open else "CLOSED"
            logger.info(f"Sent bot_trade_update ({status}) to user {self.user.email}: {trade.symbol}")
        except Exception as e:
            logger.error(f"Error sending WebSocket message: {e}")

    def _generate_profit_target(self) -> Decimal:
        """Generate profit/loss target"""
        is_winning_trade = random.uniform(0, 100) < float(self.config.win_rate)

        if is_winning_trade:
            if random.uniform(0, 100) < float(self.config.high_yield_chance):
                profit_percent = Decimal(str(random.uniform(
                    float(self.config.high_profit_range[0]),
                    float(self.config.high_profit_range[1])
                )))
            else:
                profit_percent = Decimal(str(random.triangular(
                    float(self.config.profit_range[0]),
                    float(self.config.profit_range[1]),
                    float(self.config.profit_range[0]) * 1.3
                )))
        else:
            if random.uniform(0, 100) < float(self.config.high_loss_chance):
                profit_percent = Decimal(str(random.uniform(
                    float(self.config.high_loss_range[0]),
                    float(self.config.high_loss_range[1])
                )))
            else:
                profit_percent = Decimal(str(random.triangular(
                    float(self.config.loss_range[0]),
                    float(self.config.loss_range[1]),
                    float(self.config.loss_range[1]) * 0.7
                )))

        return profit_percent.quantize(Decimal('0.01'), rounding=ROUND_DOWN)

    def generate_trade(self) -> bool:
        """
        Generate a single OPEN position (optimized for live trading display)
        Returns True if position was opened
        """
        if not self.session or not self.session.is_active:
            self.start_session()
            if not self.session:
                return False

        # Check position limits
        open_positions_count = BotTrade.objects.filter(
            user=self.user,
            is_open=True
        ).count()

        logger.info(f"Open positions: {open_positions_count}/{self.config.max_open_positions} for {self.user.email}")

        if open_positions_count >= self.config.max_open_positions:
            logger.info(f"Max open positions reached ({open_positions_count}/{self.config.max_open_positions}) for {self.user.email}")
            return False

        if not self.trading_pairs:
            return False

        # Select trading pair with weighted random
        weights = [3 if 'BTC' in pair or 'ETH' in pair else 1 for pair in self.trading_pairs]
        symbol = random.choices(self.trading_pairs, weights=weights, k=1)[0]

        entry_price = self.market.get_current_price(symbol)
        if entry_price <= 0:
            return False

        side = random.choices(['buy', 'sell'], weights=[0.55, 0.45], k=1)[0]

        balance = Decimal(str(self.session.current_balance))
        trade_amount, quantity = self.position_manager.calculate_position_size(
            balance, entry_price, open_positions_count
        )

        if quantity <= 0:
            return False

        # Create timestamps - position opens NOW
        current_time = timezone.now()

        # Create OPEN position (no exit price yet)
        trade = BotTrade.objects.create(
            user=self.user,
            symbol=symbol,
            side=side,
            entry_price=entry_price,
            exit_price=None,  # Will be set when position closes
            quantity=quantity,
            profit_loss=Decimal('0.00'),  # No P/L yet
            profit_loss_percent=Decimal('0.00'),
            is_open=True,  # Position is OPEN
            opened_at=current_time,
            closed_at=None
        )

        # Update session (increment trade count)
        from django.db.models import F
        TradingSession.objects.filter(id=self.session.id).update(
            total_trades=F('total_trades') + 1
        )

        # Refresh session
        self.session.refresh_from_db()

        # Send WebSocket notification for new OPEN position
        self._send_bot_trade_update(trade, self.user.balance)

        logger.info(f"Opened position: {symbol} {side.upper()} @ {entry_price} for {self.user.email}")

        return True

    def generate_multiple_trades(self, count: Optional[int] = None) -> int:
        """
        Generate multiple trades
        Returns number of trades generated
        """
        if count is None:
            count = random.randint(*self.config.trades_per_run_range)

        trades_generated = 0
        for _ in range(count):
            try:
                if self.generate_trade():
                    trades_generated += 1
            except Exception as e:
                logger.error(f"Error generating trade for {self.user.email}: {e}")
                continue

        logger.info(f"Generated {trades_generated} trades for {self.user.email}")
        return trades_generated

    def close_open_positions(self) -> int:
        """
        Close open positions that have been running long enough (optimized with bulk operations)
        Only closes positions open for at least min_open_duration
        Returns number of positions closed
        """
        current_time = timezone.now()

        # Only close positions that have been open for minimum duration
        min_time_ago = current_time - self.config.min_open_duration
        max_time_ago = current_time - self.config.max_open_duration

        # First, check ALL open positions
        all_open = BotTrade.objects.filter(user=self.user, is_open=True)
        logger.info(f"Total open positions for {self.user.email}: {all_open.count()}")

        # Fetch positions ready to close (open for min duration or longer)
        open_positions = list(BotTrade.objects.filter(
            user=self.user,
            is_open=True,
            opened_at__lte=min_time_ago  # Only positions open long enough
        ))

        logger.info(f"Positions ready to close (open >= {self.config.min_open_duration}): {len(open_positions)}")

        if not open_positions:
            return 0

        # Close positions based on how long they've been open:
        # - If open longer than max_duration: ALWAYS close (100%)
        # - If open between min and max duration: 70% chance to close
        positions_to_close = []
        for pos in open_positions:
            if pos.opened_at <= max_time_ago:
                # Been open too long - always close
                positions_to_close.append(pos)
            elif random.random() < 0.7:
                # 70% chance to close positions that are ready
                positions_to_close.append(pos)

        if not positions_to_close:
            logger.debug(f"No positions ready to close for {self.user.email}")
            return 0

        logger.info(f"Closing {len(positions_to_close)} out of {len(open_positions)} open positions for {self.user.email}")

        closed_count = 0
        total_profit_loss = Decimal('0')
        winning_count = 0
        positions_to_update = []
        transactions_to_create = []

        # Process positions ready to close
        for position in positions_to_close:
            try:
                # Generate exit conditions
                profit_target = self._generate_profit_target()
                duration_seconds = int((current_time - position.opened_at).total_seconds())

                exit_price = self.market.calculate_realistic_exit(
                    position.entry_price,
                    profit_target,
                    position.side,
                    duration_seconds
                )

                if exit_price <= 0:
                    exit_price = position.entry_price * Decimal('0.99')

                profit_loss, profit_loss_percent = self._calculate_profit_loss(
                    position.entry_price,
                    exit_price,
                    position.quantity,
                    position.side
                )

                # Prepare position for bulk update
                position.exit_price = exit_price
                position.profit_loss = profit_loss
                position.profit_loss_percent = profit_loss_percent
                position.is_open = False
                position.closed_at = current_time
                positions_to_update.append(position)

                # Prepare transaction for bulk create
                transactions_to_create.append(Transaction(
                    user=self.user,
                    transaction_type='bot_profit' if profit_loss > 0 else 'bot_loss',
                    amount=abs(profit_loss),
                    status='completed',
                    processed_at=current_time
                ))

                # Track totals
                total_profit_loss += profit_loss
                if profit_loss > 0:
                    winning_count += 1
                closed_count += 1

            except Exception as e:
                logger.error(f"Error processing position {position.id}: {e}")
                continue

        # Optimized: Use single atomic transaction for all updates
        if positions_to_update:
            with db_transaction.atomic():
                from django.db.models import F

                # Bulk update positions
                BotTrade.objects.bulk_update(
                    positions_to_update,
                    ['exit_price', 'profit_loss', 'profit_loss_percent', 'is_open', 'closed_at'],
                    batch_size=100
                )

                # Bulk create transactions
                Transaction.objects.bulk_create(transactions_to_create, batch_size=100)

                # Update session with single query
                if self.session:
                    TradingSession.objects.filter(id=self.session.id).update(
                        current_balance=F('current_balance') + total_profit_loss,
                        total_profit=F('total_profit') + total_profit_loss,
                        winning_trades=F('winning_trades') + winning_count
                    )

                # Update user balance with single query
                from apps.accounts.models import User
                User.objects.filter(id=self.user.id).update(
                    balance=F('balance') + total_profit_loss
                )

            # Refresh to get updated values
            if self.session:
                self.session.refresh_from_db()
            self.user.refresh_from_db()

            # Send WebSocket notifications for closed positions
            for position in positions_to_update:
                self._send_bot_trade_update(position, self.user.balance)

        logger.info(f"Closed {closed_count} positions for {self.user.email} (total P/L: {total_profit_loss})")
        return closed_count
