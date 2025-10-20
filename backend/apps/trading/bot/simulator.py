import random
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from apps.trading.models import BotTrade, TradingSession
from apps.transactions.models import Transaction
from apps.trading.utils.crypto_fetcher import CryptoDataFetcher


class TradingBotSimulator:

    def __init__(self, user, bot_type):
        self.user = user
        self.bot_type = bot_type
        self.session = None

        self.base_prices = CryptoDataFetcher.get_base_prices_sync(limit=20)
        if not self.base_prices:
            print("⚠️ API price fetching failed, using fallback prices.")
            self.base_prices = {
                'BTC/USDT': Decimal('67000.00'), 'ETH/USDT': Decimal('3500.00'),
                'BNB/USDT': Decimal('580.00'), 'SOL/USDT': Decimal('145.00'),
            }
        self.trading_pairs = list(self.base_prices.keys())

        # Загальні налаштування
        self.max_open_positions = 5
        self.open_position_chance = Decimal('25')

        if bot_type == 'basic':
            self.win_rate_percent = Decimal('75')  # Нижча надійність
            self.profit_range = (Decimal('0.5'), Decimal('3.0'))  # Нормальний прибуток %
            self.loss_range = (Decimal('-0.5'), Decimal('-2.0'))  # Нормальний збиток %
            self.trade_duration_range = (60, 300)
            self.trades_per_run_range = (2, 5)  # Зменшено кількість угод
            self.max_open_positions = 3
            # Параметри високої волатильності
            self.high_yield_chance = Decimal('5')  # Шанс на "джекпот"
            self.high_profit_range = (Decimal('30'), Decimal('80'))  # % "джекпоту"
            self.high_loss_chance = Decimal('10')  # Шанс на великий збиток
            self.high_loss_range = (Decimal('-20'), Decimal('-50'))  # % великого збитку

        elif bot_type == 'premium':
            self.win_rate_percent = Decimal('85')  # Стандартна надійність
            self.profit_range = (Decimal('1.0'), Decimal('5.0'))
            self.loss_range = (Decimal('-0.7'), Decimal('-2.5'))
            self.trade_duration_range = (120, 600)
            self.trades_per_run_range = (3, 7)  # Зменшено кількість угод
            self.max_open_positions = 5
            # Параметри високої волатильності
            self.high_yield_chance = Decimal('10')
            self.high_profit_range = (Decimal('50'), Decimal('150'))
            self.high_loss_chance = Decimal('8')
            self.high_loss_range = (Decimal('-30'), Decimal('-70'))

        elif bot_type == 'specialist':
            self.win_rate_percent = Decimal('90')  # Висока надійність
            self.profit_range = (Decimal('1.5'), Decimal('7.0'))
            self.loss_range = (Decimal('-1.0'), Decimal('-3.0'))
            self.trade_duration_range = (300, 900)
            self.trades_per_run_range = (4, 9)  # Зменшено кількість угод
            self.max_open_positions = 7
            # Параметри високої волатильності
            self.high_yield_chance = Decimal('15')
            self.high_profit_range = (Decimal('70'), Decimal('200'))
            self.high_loss_chance = Decimal('5')  # Найнижчий шанс великого збитку
            self.high_loss_range = (Decimal('-40'), Decimal('-80'))
        else:
            raise ValueError('Invalid bot type')

    def start_session(self):
        try:
            self.session = TradingSession.objects.get(user=self.user, is_active=True)
            print(f"Using existing active session for {self.user.email}")
        except TradingSession.DoesNotExist:
            self.session = TradingSession.objects.create(
                user=self.user,
                bot_type=self.bot_type,
                starting_balance=self.user.balance,
                current_balance=self.user.balance,
                is_active=True
            )
            print(f"Started new session for {self.user.email}")
        return self.session

    def generate_trade(self):
        if not self.session or not self.session.is_active:
            self.start_session()
            if not self.session:
                print(f"Could not start session for {self.user.email}. Skipping trade generation.")
                return None

        open_positions_count = BotTrade.objects.filter(user=self.user, is_open=True).count()
        if open_positions_count >= self.max_open_positions:
            print(f"Max open positions ({self.max_open_positions}) reached for {self.user.email}. Skipping new trade.")
            return None

        if not self.trading_pairs:
            print("Cannot generate trade: no trading pairs available.")
            return None

        symbol = random.choice(self.trading_pairs)
        base_price = self.base_prices.get(symbol, Decimal('0'))
        if base_price <= 0:
            print(f"Invalid base price for {symbol}. Skipping trade.")
            return None

        price_variation = Decimal(str(random.uniform(-0.005, 0.005)))
        entry_price = base_price * (Decimal('1') + price_variation)
        entry_price = entry_price.quantize(Decimal('1E-8'))

        side = random.choice(['buy', 'sell'])

        balance = self.session.current_balance
        if not isinstance(balance, Decimal):
            balance = Decimal(str(balance))

        min_trade_amount_eur = Decimal('10.00')
        max_trade_percent = Decimal('0.15')

        if balance < min_trade_amount_eur * 5:
            trade_amount_percent = Decimal(str(random.uniform(0.01, 0.03)))
        elif balance < Decimal('1000'):
            trade_amount_percent = Decimal(str(random.uniform(0.02, 0.05)))
        elif balance < Decimal('10000'):
            trade_amount_percent = Decimal(str(random.uniform(0.05, 0.10)))
        else:
            trade_amount_percent = Decimal(str(random.uniform(0.07, max_trade_percent)))

        trade_amount = balance * trade_amount_percent

        if trade_amount < min_trade_amount_eur:
            if balance >= min_trade_amount_eur:
                trade_amount = min_trade_amount_eur
            else:
                return None

        if entry_price <= 0:
            return None

        quantity = (trade_amount / entry_price).quantize(Decimal('1E-8'))

        if quantity <= 0:
            return None

        make_open_position = random.uniform(0, 100) < self.open_position_chance

        if make_open_position:
            opened_at = timezone.now() - timedelta(seconds=random.randint(1, 60))
            trade = BotTrade.objects.create(
                user=self.user,
                symbol=symbol,
                side=side,
                entry_price=entry_price,
                quantity=quantity,
                is_open=True,
                opened_at=opened_at,
                exit_price=None,
                closed_at=None,
                profit_loss=Decimal('0.00'),
                profit_loss_percent=Decimal('0.00')
            )
            print(f"Opened position for {self.user.email}: {symbol} {side} @ {entry_price}")
            self.session.total_trades += 1
            self.session.save(update_fields=['total_trades'])

        else:  # Генеруємо закриту угоду

            # --- НОВА ЛОГІКА ВОЛАТИЛЬНОСТІ ---
            is_winning_trade = random.uniform(0, 100) < self.win_rate_percent

            if is_winning_trade:
                # Перевірка на "джекпот"
                if random.uniform(0, 100) < self.high_yield_chance:
                    profit_percent = Decimal(str(random.uniform(
                        float(self.high_profit_range[0]), float(self.high_profit_range[1])
                    )))
                    print(f"*** High-Yield WIN for {self.user.email}: {profit_percent:.2f}%")
                else:
                    # Звичайний прибуток
                    profit_percent = Decimal(str(random.uniform(
                        float(self.profit_range[0]), float(self.profit_range[1])
                    )))
            else:
                # Перевірка на великий збиток
                if random.uniform(0, 100) < self.high_loss_chance:
                    profit_percent = Decimal(str(random.uniform(
                        float(self.high_loss_range[0]), float(self.high_loss_range[1])
                    )))
                    print(f"*** High-Loss trade for {self.user.email}: {profit_percent:.2f}%")
                else:
                    # Звичайний збиток
                    profit_percent = Decimal(str(random.uniform(
                        float(self.loss_range[0]), float(self.loss_range[1])
                    )))
            # --- КІНЕЦЬ НОВОЇ ЛОГІКИ ---

            if side == 'buy':
                exit_price = entry_price * (Decimal('1') + profit_percent / Decimal('100'))
            else:
                exit_price = entry_price * (Decimal('1') - profit_percent / Decimal('100'))

            exit_price = exit_price.quantize(Decimal('1E-8'))

            if side == 'buy':
                profit_loss = (exit_price - entry_price) * quantity
            else:
                profit_loss = (entry_price - exit_price) * quantity

            profit_loss = profit_loss.quantize(Decimal('1E-2'))

            duration_seconds = random.randint(self.trade_duration_range[0], self.trade_duration_range[1])
            opened_at = timezone.now() - timedelta(seconds=random.randint(duration_seconds // 2, duration_seconds))
            closed_at = opened_at + timedelta(seconds=duration_seconds)

            trade = BotTrade.objects.create(
                user=self.user,
                symbol=symbol,
                side=side,
                entry_price=entry_price,
                exit_price=exit_price,
                quantity=quantity,
                profit_loss=profit_loss,
                profit_loss_percent=profit_percent.quantize(Decimal('1E-2')),
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
            self.user.save(update_fields=['balance'])

            Transaction.objects.create(
                user=self.user,
                transaction_type='bot_profit',
                amount=profit_loss,
                status='completed',
                processed_at=closed_at
            )

        return trade

    def generate_multiple_trades(self, count=None):
        if count is None:
            count = random.randint(self.trades_per_run_range[0], self.trades_per_run_range[1])

        trades = []
        for _ in range(count):
            trade = self.generate_trade()
            if trade:
                trades.append(trade)
        return trades

    def stop_session(self):
        if not self.session:
            active_session = TradingSession.objects.filter(user=self.user, is_active=True).first()
            if not active_session:
                print(f"No active session found for {self.user.email} to stop.")
                return None
            self.session = active_session

        self.session.is_active = False
        self.session.ended_at = timezone.now()
        self.session.save()
        print(f"Stopped session for {self.user.email}")
        return self.session

    @classmethod
    def simulate_daily_trading(cls, user):
        if user.bot_type == 'none':
            print(f"User {user.email} has no active bot. Skipping simulation.")
            return None

        try:
            simulator = cls(user, user.bot_type)
            simulator.start_session()

            if not simulator.session:
                print(f"Failed to ensure active session for {user.email}.")
                return None

            trades = simulator.generate_multiple_trades()

            total_profit = sum(t.profit_loss for t in trades if not t.is_open and t.profit_loss is not None)
            open_positions_created = sum(1 for t in trades if t.is_open)

            print(
                f"Simulation run for {user.email}: Generated {len(trades)} trades ({open_positions_created} open), Total Profit/Loss from closed: {total_profit:.2f}")

            return {
                'session_id': simulator.session.id,
                'trades_count': len(trades),
                'open_positions_created': open_positions_created,
                'total_profit': total_profit
            }
        except Exception as e:
            print(f"Error during simulation for {user.email}: {e}")
            import traceback
            traceback.print_exc()
            return None