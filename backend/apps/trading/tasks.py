from celery import shared_task
from django.utils import timezone
from apps.accounts.models import User
from .bot.simulator import TradingBotSimulator


@shared_task
def run_bot_simulation():
    """
    Celery task for automatic trading simulation
    Runs every hour via Celery Beat

    Returns:
        List of results for each user
    """
    # Get all users with active bots
    users = User.objects.filter(
        is_active=True,
        bot_type__in=['basic', 'premium', 'specialist']
    )

    results = []

    for user in users:
        try:
            # Run daily trading simulation
            result = TradingBotSimulator.simulate_daily_trading(user)

            results.append({
                'user': user.email,
                'success': True,
                'trades': result['trades_count'],
                'profit': float(result['total_profit'])
            })

        except Exception as e:
            # Log error but continue with other users
            results.append({
                'user': user.email,
                'success': False,
                'error': str(e)
            })

    return results


@shared_task
def simulate_for_user(user_id, trades_count=5):
    """
    Celery task to simulate trading for specific user

    Args:
        user_id: User UUID as string
        trades_count: Number of trades to generate

    Returns:
        Dictionary with simulation results
    """
    try:
        user = User.objects.get(id=user_id)

        if user.bot_type == 'none':
            return {
                'success': False,
                'error': 'User does not have active bot'
            }

        # Get or create session
        from .models import TradingSession

        session = TradingSession.objects.filter(
            user=user,
            is_active=True
        ).first()

        simulator = TradingBotSimulator(user, user.bot_type)

        if not session:
            simulator.start_session()
        else:
            simulator.session = session

        # Generate trades
        trades = simulator.generate_multiple_trades(trades_count)
        total_profit = sum(t.profit_loss for t in trades)

        return {
            'success': True,
            'user': user.email,
            'trades_count': len(trades),
            'total_profit': float(total_profit),
            'new_balance': float(user.balance)
        }

    except User.DoesNotExist:
        return {
            'success': False,
            'error': f'User with ID {user_id} not found'
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
