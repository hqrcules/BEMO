from celery import shared_task
from django.utils import timezone
from apps.accounts.models import User
from .bot.simulator import TradingBotSimulator
import logging

logger = logging.getLogger(__name__)


@shared_task
def run_bot_simulation():
    """
    Run bot simulation for all active users with bots enabled
    """
    users = User.objects.filter(
        is_active=True,
        bot_type__in=['basic', 'premium', 'specialist']
    )

    results = []
    for user in users:
        try:
            # Create instance and run simulation
            simulator = TradingBotSimulator(user, user.bot_type)
            simulator.start_session()

            if not simulator.session:
                logger.error(f"Failed to start session for {user.email}")
                results.append({
                    'user': user.email,
                    'success': False,
                    'error': 'Failed to start session'
                })
                continue

            # Close open positions
            closed_count = simulator.close_open_positions()

            # Generate new trades
            import random
            trades_to_generate = random.randint(*simulator.config.trades_per_run_range)
            generated_count = simulator.generate_multiple_trades(trades_to_generate)

            # Refresh session data
            simulator.session.refresh_from_db()

            results.append({
                'user': user.email,
                'success': True,
                'closed_positions': closed_count,
                'new_trades': generated_count,
                'session_profit': float(simulator.session.total_profit),
                'current_balance': float(simulator.session.current_balance)
            })

            logger.info(
                f"Simulation complete for {user.email}: "
                f"Closed {closed_count}, Generated {generated_count}"
            )

        except Exception as e:
            logger.exception(f"Error simulating for {user.email}: {e}")
            results.append({
                'user': user.email,
                'success': False,
                'error': str(e)
            })

    return results


@shared_task
def simulate_for_user(user_id, trades_count=None):
    """
    Run simulation for a specific user

    Args:
        user_id: UUID of the user
        trades_count: Number of trades to generate (None for random based on bot config)
    """
    try:
        user = User.objects.get(id=user_id)

        if user.bot_type == 'none':
            return {
                'success': False,
                'error': 'User does not have active bot'
            }

        # Create simulator
        simulator = TradingBotSimulator(user, user.bot_type)
        simulator.start_session()

        if not simulator.session:
            return {
                'success': False,
                'error': 'Failed to start session'
            }

        # Close open positions
        closed_count = simulator.close_open_positions()

        # Generate new trades
        generated_count = simulator.generate_multiple_trades(trades_count)

        # Refresh session
        simulator.session.refresh_from_db()

        return {
            'success': True,
            'user': user.email,
            'closed_positions': closed_count,
            'new_trades': generated_count,
            'session_profit': float(simulator.session.total_profit),
            'current_balance': float(simulator.session.current_balance)
        }

    except User.DoesNotExist:
        return {
            'success': False,
            'error': f'User with ID {user_id} not found'
        }
    except Exception as e:
        logger.exception(f"Error in simulate_for_user: {e}")
        return {
            'success': False,
            'error': str(e)
        }


@shared_task
def close_stale_positions():
    """
    Close positions that have been open too long
    Runs periodically to prevent positions from staying open indefinitely
    """
    from .models import BotTrade
    from django.utils import timezone
    from datetime import timedelta

    # Get positions open for more than 1 hour
    stale_time = timezone.now() - timedelta(hours=1)
    stale_positions = BotTrade.objects.filter(
        is_open=True,
        opened_at__lt=stale_time
    )

    closed_count = 0
    for position in stale_positions:
        try:
            user = position.user
            simulator = TradingBotSimulator(user, user.bot_type)

            # Generate exit price
            from decimal import Decimal
            import random
            profit_target = Decimal(str(random.uniform(-2.0, 3.0)))

            duration_seconds = int((timezone.now() - position.opened_at).total_seconds())
            exit_price = simulator.market.calculate_realistic_exit(
                position.entry_price,
                profit_target,
                position.side,
                duration_seconds
            )

            if exit_price <= 0:
                exit_price = position.entry_price * Decimal('0.99')

            if simulator.close_position(position, exit_price, timezone.now()):
                closed_count += 1

        except Exception as e:
            logger.error(f"Error closing stale position {position.id}: {e}")
            continue

    return {
        'closed_count': closed_count,
        'timestamp': timezone.now().isoformat()
    }
