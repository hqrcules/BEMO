from django.core.management.base import BaseCommand
from apps.accounts.models import User
from decimal import Decimal


class Command(BaseCommand):
    """
    Create new user via command line
    Usage: python manage.py create_user email@example.com password123
    """
    help = 'Create a new user account'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='User email')
        parser.add_argument('password', type=str, help='User password')
        parser.add_argument(
            '--full-name',
            type=str,
            default='',
            help='User full name'
        )
        parser.add_argument(
            '--balance',
            type=float,
            default=0.0,
            help='Initial balance'
        )
        parser.add_argument(
            '--bot-type',
            type=str,
            choices=['none', 'basic', 'premium', 'specialist'],
            default='none',
            help='Bot type'
        )
        parser.add_argument(
            '--verified',
            action='store_true',
            help='Mark user as verified'
        )

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']

        # Check if user exists
        if User.objects.filter(email=email).exists():
            self.stdout.write(
                self.style.ERROR(f'User with email {email} already exists')
            )
            return

        # Create user
        try:
            user = User.objects.create_user(
                email=email,
                password=password,
                full_name=options['full_name'],
                balance=Decimal(str(options['balance'])),
                bot_type=options['bot_type'],
                is_verified=options['verified']
            )

            self.stdout.write(
                self.style.SUCCESS(f'✅ User created successfully!')
            )
            self.stdout.write(f'   Email: {user.email}')
            self.stdout.write(f'   Password: {password}')
            self.stdout.write(f'   Balance: €{user.balance}')
            self.stdout.write(f'   Bot Type: {user.bot_type}')
            self.stdout.write(f'   Verified: {user.is_verified}')

        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error creating user: {str(e)}')
            )
