from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import User
from apps.trading.bot.simulator import TradingBotSimulator


class Command(BaseCommand):
    """
    Django management command to run bot trading simulation
    Usage: python manage.py run_bot_simulation [options]
    """

    help = 'Run bot trading simulation for all active users'

    def add_arguments(self, parser):
        """Add command line arguments"""
        parser.add_argument(
            '--user-id',
            type=str,
            help='Simulate for specific user (UUID)',
        )
        parser.add_argument(
            '--trades',
            type=int,
            default=5,
            help='Number of trades to generate',
        )

    def handle(self, *args, **options):
        """Main command handler"""
        user_id = options.get('user_id')
        trades_count = options.get('trades')

        if user_id:
            # Simulate for specific user
            try:
                user = User.objects.get(id=user_id)
                self.simulate_for_user(user, trades_count)
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'User with ID {user_id} not found')
                )
        else:
            # Simulate for all users with active bots
            users = User.objects.filter(
                is_active=True,
                bot_type__in=['basic', 'premium', 'specialist']
            )

            self.stdout.write(
                self.style.SUCCESS(f'Found {users.count()} users with active bots')
            )

            for user in users:
                self.simulate_for_user(user, trades_count)

    def simulate_for_user(self, user, trades_count):
        """
        Simulate trading for a user

        Args:
            user: User model instance
            trades_count: Number of trades to generate
        """
        try:
            # Get or create active session
            from apps.trading.models import TradingSession

            session = TradingSession.objects.filter(
                user=user,
                is_active=True
            ).first()

            simulator = TradingBotSimulator(user, user.bot_type)

            if not session:
                simulator.start_session()
                self.stdout.write(
                    self.style.SUCCESS(f'Started new session for {user.email}')
                )
            else:
                simulator.session = session

            # Generate trades
            trades = simulator.generate_multiple_trades(trades_count)

            total_profit = sum(t.profit_loss for t in trades)

            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ {user.email} ({user.bot_type}): '
                    f'{len(trades)} trades, Profit: €{total_profit:.2f}'
                )
            )

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error for {user.email}: {str(e)}')
            )
