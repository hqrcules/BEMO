"""
Optimized Management Command with Bulk Processing
"""

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.db.models import Sum, Avg, Count
from decimal import Decimal

from apps.accounts.models import User
from apps.trading.bot.simulator import TradingBotSimulator, BulkSimulationOrchestrator
from apps.trading.models import TradingSession, BotTrade


class Command(BaseCommand):
    """Optimized bot trading simulation command with batch processing"""

    help = 'Run optimized bot trading simulation with batch operations'

    def add_arguments(self, parser):
        parser.add_argument('--user-id', type=str, help='Simulate for specific user (UUID)')
        parser.add_argument('--email', type=str, help='Simulate for specific user (email)')
        parser.add_argument('--trades', type=int, default=None, help='Number of trades per user')
        parser.add_argument('--bot-type', type=str, choices=['basic', 'premium', 'specialist', 'all'], default='all')
        parser.add_argument('--batch-size', type=int, default=200, help='Batch size for bulk operations')
        parser.add_argument('--stats', action='store_true', help='Show detailed statistics')
        parser.add_argument('--quiet', action='store_true', help='Minimal output')
        parser.add_argument('--bulk', action='store_true', help='Use bulk orchestrator (recommended for 100+ users)')

    def handle(self, *args, **options):
        self.verbosity = options.get('verbosity', 1)
        self.quiet = options.get('quiet', False)

        users = self._get_target_users(options)

        if not users:
            raise CommandError('No users found matching criteria')

        if not self.quiet:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n{"=" * 60}\n'
                    f'  Optimized Trading Bot Simulation\n'
                    f'  Users: {users.count()}\n'
                    f'  Mode: {"BULK PROCESSING" if options.get("bulk") else "STANDARD"}\n'
                    f'  Batch Size: {options.get("batch_size", 200)}\n'
                    f'  Time: {timezone.now().strftime("%Y-%m-%d %H:%M:%S")}\n'
                    f'{"=" * 60}\n'
                )
            )

        start_time = timezone.now()

        # Choose execution mode
        if options.get('bulk') and users.count() > 1:
            results = self._run_bulk_simulation(users, options)
        else:
            results = self._run_standard_simulation(users, options)

        elapsed = (timezone.now() - start_time).total_seconds()

        if not self.quiet:
            self._display_summary(results, elapsed)

        if options.get('stats'):
            self._display_statistics(users)

    def _get_target_users(self, options):
        """Get list of users to simulate"""
        user_id = options.get('user_id')
        email = options.get('email')
        bot_type = options.get('bot_type', 'all')

        if user_id:
            try:
                return User.objects.filter(id=user_id)
            except ValueError:
                raise CommandError(f'Invalid user ID: {user_id}')

        if email:
            return User.objects.filter(email=email)

        queryset = User.objects.filter(is_active=True)

        if bot_type != 'all':
            queryset = queryset.filter(bot_type=bot_type)
        else:
            queryset = queryset.filter(bot_type__in=['basic', 'premium', 'specialist'])

        return queryset

    def _run_bulk_simulation(self, users, options):
        """Run simulation using bulk orchestrator"""
        batch_size = options.get('batch_size', 200)
        orchestrator = BulkSimulationOrchestrator(batch_size=batch_size)

        return orchestrator.simulate_users(users)

    def _run_standard_simulation(self, users, options):
        """Run simulation one user at a time"""
        results = []
        for user in users:
            try:
                simulator = TradingBotSimulator(user, user.bot_type)
                simulator.start_session()

                trades_count = simulator.generate_multiple_trades(options.get('trades'))

                results.append({
                    'user_id': str(user.id),
                    'email': user.email,
                    'bot_type': user.bot_type,
                    'trades_generated': trades_count
                })

                if not self.quiet:
                    self.stdout.write(
                        f'✓ {user.email:30} ({user.bot_type:10}) | Trades: {trades_count}'
                    )

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Error for {user.email}: {str(e)}'))
                continue

        return results

    def _display_summary(self, results, elapsed):
        """Display simulation summary"""
        if not results:
            self.stdout.write(self.style.WARNING('\nNo successful simulations'))
            return

        total_trades = sum(r['trades_generated'] for r in results)
        trades_per_second = total_trades / elapsed if elapsed > 0 else 0

        self.stdout.write(
            self.style.SUCCESS(
                f'\n{"=" * 60}\n'
                f'  Simulation Complete\n'
                f'{"=" * 60}\n'
                f'  Users Processed:     {len(results)}\n'
                f'  Total Trades:        {total_trades}\n'
                f'  Execution Time:      {elapsed:.2f}s\n'
                f'  Trades/Second:       {trades_per_second:.2f}\n'
                f'  Avg Trades/User:     {total_trades / len(results):.1f}\n'
                f'{"=" * 60}\n'
            )
        )

    def _display_statistics(self, users):
        """Display detailed statistics"""
        self.stdout.write(
            self.style.SUCCESS(f'\n{"=" * 60}\n  Detailed Statistics\n{"=" * 60}\n')
        )

        for bot_type in ['basic', 'premium', 'specialist']:
            bot_users = users.filter(bot_type=bot_type)
            if not bot_users.exists():
                continue

            trades = BotTrade.objects.filter(user__in=bot_users, is_open=False)
            if not trades.exists():
                continue

            stats = trades.aggregate(
                total_trades=Count('id'),
                total_profit=Sum('profit_loss'),
                avg_profit=Avg('profit_loss'),
                winning_trades=Count('id', filter=trades.filter(profit_loss__gt=0).query)
            )

            win_rate = (stats['winning_trades'] / stats['total_trades'] * 100) if stats['total_trades'] else 0

            self.stdout.write(
                f'\n  {bot_type.upper()} Bot:\n'
                f'    Users:           {bot_users.count()}\n'
                f'    Total Trades:    {stats["total_trades"]}\n'
                f'    Win Rate:        {win_rate:.1f}%\n'
                f'    Total Profit:    €{stats["total_profit"] or 0:.2f}\n'
            )

        self.stdout.write(f'\n{"=" * 60}\n')
