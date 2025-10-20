import random
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from apps.trading.models import BotTrade, TradingSession
from apps.transactions.models import Transaction
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from apps.trading.utils.crypto_fetcher import CryptoDataFetcher


class TradingBotSimulator:

    def __init__(self, user, bot_type):
        self.user = user
        self.bot_type = bot_type
        self.session = None

        # --- New dynamic price fetching ---
        self.base_prices = CryptoDataFetcher.get_base_prices_sync(limit=20)
        if not self.base_prices:
            # Fallback to hardcoded prices if API fails
            print("⚠️ API price fetching failed, using fallback prices.")
            self.base_prices = {
                'BTC/USDT': Decimal('67000.00'), 'ETH/USDT': Decimal('3500.00'),
                'BNB/USDT': Decimal('580.00'), 'SOL/USDT': Decimal('145.00'),
            }
        self.trading_pairs = list(self.base_prices.keys())
        # ------------------------------------

        if bot_type == 'basic':
            self.profit_range = (0.5, 2.5)
            self.trade_duration_range = (1, 5)
            self.trades_per_run = (10, 15)
        elif bot_type == 'premium':
            self.profit_range = (1.0, 4.0)
            self.trade_duration_range = (1, 5)
            self.trades_per_run = (15, 20)
        elif bot_type == 'specialist':
            self.profit_range = (1.5, 5.5)
            self.trade_duration_range = (1, 5)
            self.trades_per_run = (20, 25)
        else:
            raise ValueError('Invalid bot type')

    def start_session(self):
        if TradingSession.objects.filter(user=self.user, is_active=True).exists():
            raise ValueError('Active session already exists')

        self.session = TradingSession.objects.create(
            user=self.user,
            bot_type=self.bot_type,
            starting_balance=self.user.balance,
            current_balance=self.user.balance,
            is_active=True
        )

        return self.session

    def generate_trade(self):
        if not self.session or not self.session.is_active:
            raise ValueError('No active session')

        if not self.trading_pairs:
            print("Cannot generate trade: no trading pairs available.")
            return None

        symbol = random.choice(self.trading_pairs)
        base_price = self.base_prices.get(symbol, Decimal('0'))
        if base_price <= 0:
            return None  # Skip if price is invalid

        price_variation = Decimal(str(random.uniform(-0.05, 0.05)))
        entry_price = base_price * (1 + price_variation)
        side = random.choice(['buy', 'sell'])

        balance = self.session.current_balance
        if balance < 1000:
            trade_amount_percent = Decimal(str(random.uniform(0.01, 0.05)))
        elif balance < 10000:
            trade_amount_percent = Decimal(str(random.uniform(0.05, 0.15)))
        else:
            trade_amount_percent = Decimal(str(random.uniform(0.10, 0.25)))

        trade_amount = balance * trade_amount_percent
        quantity = trade_amount / entry_price if entry_price > 0 else Decimal('0')

        is_open_position = random.choice([True, False, False, False])

        if is_open_position:
            trade = BotTrade.objects.create(
                user=self.user,
                symbol=symbol,
                side=side,
                entry_price=entry_price,
                quantity=quantity,
                is_open=True,
                opened_at=timezone.now(),
            )
        else:
            profit_percent = Decimal(str(random.uniform(*self.profit_range)))
            if side == 'buy':
                exit_price = entry_price * (Decimal('1') + profit_percent / Decimal('100'))
            else:
                exit_price = entry_price * (Decimal('1') - profit_percent / Decimal('100'))

            profit_loss = (exit_price - entry_price) * quantity if side == 'buy' else (
                                                                                                  entry_price - exit_price) * quantity

            duration_seconds = random.randint(*self.trade_duration_range)
            opened_at = timezone.now() - timedelta(seconds=duration_seconds)
            closed_at = timezone.now()

            trade = BotTrade.objects.create(
                user=self.user,
                symbol=symbol,
                side=side,
                entry_price=entry_price,
                exit_price=exit_price,
                quantity=quantity,
                profit_loss=profit_loss,
                profit_loss_percent=profit_percent,
                is_open=False,
                opened_at=opened_at,
                closed_at=closed_at
            )

            self.session.current_balance = Decimal(str(self.session.current_balance)) + profit_loss
            self.session.total_profit = Decimal(str(self.session.total_profit)) + profit_loss
            self.session.total_trades += 1
            if profit_loss > 0:
                self.session.winning_trades += 1
            self.session.save()

            self.user.balance = Decimal(str(self.user.balance)) + profit_loss
            self.user.save()

            Transaction.objects.create(
                user=self.user,
                transaction_type='bot_profit',
                amount=profit_loss,
                status='completed',
                processed_at=closed_at
            )

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{self.user.id}",
                {
                    "type": "balance_update",
                    "balance": str(self.user.balance),
                },
            )
        return trade

    def generate_multiple_trades(self, count):
        trades = []
        for _ in range(count):
            trade = self.generate_trade()
            if trade:
                trades.append(trade)
        return trades

    def stop_session(self):
        if not self.session:
            raise ValueError('No session to stop')
        self.session.is_active = False
        self.session.ended_at = timezone.now()
        self.session.save()
        return self.session

    @classmethod
    def simulate_daily_trading(cls, user):
        if user.bot_type == 'none':
            return None

        active_session = TradingSession.objects.filter(
            user=user,
            is_active=True
        ).first()

        simulator = cls(user, user.bot_type)
        if not active_session:
            simulator.start_session()
        else:
            simulator.session = active_session

        trades_count = random.randint(*simulator.trades_per_run)
        trades = simulator.generate_multiple_trades(trades_count)

        return {
            'session': simulator.session,
            'trades_count': len(trades),
            'total_profit': sum(t.profit_loss for t in trades if not t.is_open and t.profit_loss)
        }