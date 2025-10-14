import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')

# Create Celery app
app = Celery('crypto_exchange')

# Load config from Django settings with CELERY namespace
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()


# Periodic tasks schedule
app.conf.beat_schedule = {
    # Run bot simulation every hour
    'run-bot-simulation-every-hour': {
        'task': 'apps.trading.tasks.run_bot_simulation',
        'schedule': crontab(minute=0),  # Every hour at minute 0
    },
    # Alternative: Run every 30 minutes
    # 'run-bot-simulation-every-30min': {
    #     'task': 'apps.trading.tasks.run_bot_simulation',
    #     'schedule': crontab(minute='*/30'),
    # },
}

# Optional: Celery task configuration
app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
)
