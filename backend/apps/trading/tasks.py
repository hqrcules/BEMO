from celery import shared_task
from django.utils import timezone
from apps.accounts.models import User
from .bot.simulator import TradingBotSimulator
import logging

logger = logging.getLogger(__name__)


@shared_task
def run_bot_simulation():
    """
    Dispatcher task: Spawns independent worker tasks for each user with bot enabled.
    This ensures each account has its own isolated worker/task.
    """
    users = User.objects.filter(
        is_active=True,
        bot_type__in=['basic', 'premium', 'specialist'],
        is_bot_enabled=True  # Only run for users with bot enabled
    )

    spawned_tasks = []
    for user in users:
        try:
            # Spawn independent task for each user
            task = simulate_for_user.delay(str(user.id))
            spawned_tasks.append({
                'user': user.email,
                'user_id': str(user.id),
                'task_id': task.id
            })
            logger.info(f"Spawned independent bot task {task.id} for user {user.email}")
        except Exception as e:
            logger.exception(f"Error spawning task for {user.email}: {e}")
            spawned_tasks.append({
                'user': user.email,
                'user_id': str(user.id),
                'error': str(e)
            })

    logger.info(f"Spawned {len(spawned_tasks)} independent bot worker tasks")
    return {
        'spawned_count': len(spawned_tasks),
        'tasks': spawned_tasks
    }


@shared_task
def simulate_for_user(user_id, trades_count=1):
    """
    Run simulation for a specific user (independent worker task)
    Optimized: Generates exactly 1 trade per run for better performance

    Args:
        user_id: UUID of the user
        trades_count: Number of trades to generate (default: 1)
    """
    logger.info(f"Starting independent bot worker for user_id: {user_id}")

    try:
        # Optimized: Use select_related to reduce queries
        user = User.objects.select_related().get(id=user_id)
        logger.info(f"Processing bot simulation for {user.email} (bot_type: {user.bot_type})")

        if user.bot_type == 'none':
            logger.warning(f"User {user.email} does not have active bot subscription")
            return {
                'success': False,
                'user': user.email,
                'error': 'User does not have active bot'
            }

        if not user.is_bot_enabled:
            logger.warning(f"Bot is disabled for user {user.email}")
            return {
                'success': False,
                'user': user.email,
                'error': 'Bot is disabled for this user'
            }

        # Create simulator
        simulator = TradingBotSimulator(user, user.bot_type)
        simulator.start_session()

        if not simulator.session:
            logger.error(f"Failed to start session for {user.email}")
            return {
                'success': False,
                'user': user.email,
                'error': 'Failed to start session'
            }

        # Strategy: Balance between closing old positions and opening new ones
        # First, try to close positions that have been open long enough
        closed_count = simulator.close_open_positions()

        # Then, try to open a new position (if under limit)
        # This creates a dynamic flow: positions open -> run for 2-10 min -> close
        generated_count = simulator.generate_multiple_trades(trades_count)

        # Refresh session
        simulator.session.refresh_from_db()

        result = {
            'success': True,
            'user': user.email,
            'user_id': str(user.id),
            'closed_positions': closed_count,
            'new_trades': generated_count,
            'session_profit': float(simulator.session.total_profit),
            'current_balance': float(simulator.session.current_balance)
        }

        logger.info(
            f"✅ Bot simulation complete for {user.email}: "
            f"Closed {closed_count}, Generated {generated_count}, "
            f"Profit: {simulator.session.total_profit}"
        )

        return result

    except User.DoesNotExist:
        logger.error(f"User with ID {user_id} not found")
        return {
            'success': False,
            'user_id': user_id,
            'error': f'User with ID {user_id} not found'
        }
    except Exception as e:
        logger.exception(f"❌ Error in simulate_for_user for user_id {user_id}: {e}")
        return {
            'success': False,
            'user_id': user_id,
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

            # Skip if bot is disabled for this user
            if not user.is_bot_enabled:
                continue

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
