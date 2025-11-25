from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.utils import timezone
from django.db import transaction, models
from decimal import Decimal
from .models import PaymentDetails, SiteSettings
from .serializers import (
    PaymentDetailsSerializer,
    AdminUserSerializer,
    AdminTransactionSerializer,
    SiteSettingsSerializer
)
from apps.accounts.models import User
from apps.transactions.models import Transaction
from apps.trading.models import BotTrade


class PaymentDetailsViewSet(viewsets.ModelViewSet):
    """ViewSet for managing payment details"""
    queryset = PaymentDetails.objects.all()
    serializer_class = PaymentDetailsSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active payment methods"""
        active_details = self.queryset.filter(is_active=True)
        serializer = self.get_serializer(active_details, many=True)
        return Response(serializer.data)


class AdminUserViewSet(viewsets.ModelViewSet):
    """ViewSet for user management"""
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        """Improved queryset with proper ordering and filtering"""
        queryset = User.objects.all().order_by('-created_at')

        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                models.Q(email__icontains=search) |
                models.Q(full_name__icontains=search)
            )

        # Status filter
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        return queryset

    def list(self, request, *args, **kwargs):
        """Enhanced list with statistics"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        return Response({
            'results': serializer.data,
            'count': queryset.count(),
            'stats': self._get_user_stats()
        })

    def _get_user_stats(self):
        """Get user statistics for admin dashboard"""
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        verified_users = User.objects.filter(is_verified=True).count()

        return {
            'total_users': total_users,
            'active_users': active_users,
            'verified_users': verified_users,
            'inactive_users': total_users - active_users
        }

    @action(detail=True, methods=['patch'])
    def update_balance(self, request, pk=None):
        """Update user balance"""
        balance = request.data.get('balance')

        if balance is None:
            return Response(
                {'error': 'Balance is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                # CRITICAL: Lock the user row to prevent race conditions
                user = User.objects.select_for_update().get(pk=pk)
                old_balance = user.balance
                user.balance = Decimal(str(balance))
                user.save()

        except Exception as e:
            return Response(
                {'error': f'Invalid balance value: {e}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            'message': 'Balance updated successfully',
            'old_balance': str(old_balance),
            'new_balance': str(user.balance)
        })

    @action(detail=True, methods=['patch'])
    def update_bot(self, request, pk=None):
        """Update user bot type"""
        user = self.get_object()
        bot_type = request.data.get('bot_type')

        if not bot_type:
            return Response(
                {'error': 'Bot type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.bot_type = bot_type
        user.save()

        return Response({
            'message': 'Bot type updated successfully',
            'new_bot_type': user.bot_type
        })

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify user (KYC)"""
        user = self.get_object()
        user.is_verified = True
        user.save()

        return Response({
            'message': 'User verified successfully'
        })

    @action(detail=True, methods=['post'], url_path='create-trade')
    def create_trade(self, request, pk=None):
        data = request.data

        required_fields = ['symbol', 'side', 'entry_price', 'exit_price', 'quantity']
        if not all(field in data for field in required_fields):
            return Response(
                {'error': 'Missing required fields for trade creation.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                # CRITICAL: Lock the user row to prevent race conditions
                user = User.objects.select_for_update().get(pk=pk)

                entry_price = Decimal(str(data['entry_price']))
                exit_price = Decimal(str(data['exit_price']))
                quantity = Decimal(str(data['quantity']))

                if data['side'] == 'buy':
                    profit_loss = (exit_price - entry_price) * quantity
                else:
                    profit_loss = (entry_price - exit_price) * quantity

                profit_loss_percent = (profit_loss / (
                            entry_price * quantity)) * 100 if entry_price > 0 and quantity > 0 else 0

                BotTrade.objects.create(
                    user=user,
                    symbol=data['symbol'],
                    side=data['side'],
                    entry_price=entry_price,
                    exit_price=exit_price,
                    quantity=quantity,
                    profit_loss=profit_loss,
                    profit_loss_percent=profit_loss_percent,
                    is_open=False,
                    closed_at=timezone.now()
                )

                Transaction.objects.create(
                    user=user,
                    transaction_type='bot_profit',
                    amount=profit_loss,
                    payment_method='bot_trading',
                    status='completed',
                    processed_by=request.user,
                    processed_at=timezone.now()
                )

                user.balance += profit_loss
                user.save()

            return Response(
                {'message': f'Trade created successfully for {user.email}. Profit: {profit_loss:.2f}'},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AdminTransactionViewSet(viewsets.ModelViewSet):
    """ViewSet for transaction management"""
    serializer_class = AdminTransactionSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        """Enhanced queryset with proper relations"""
        queryset = Transaction.objects.all().select_related(
            'user', 'processed_by'
        ).order_by('-created_at')

        # Filters
        status_filter = self.request.query_params.get('status')
        transaction_type = self.request.query_params.get('type')
        user_email = self.request.query_params.get('user_email')

        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        if user_email:
            queryset = queryset.filter(user__email__icontains=user_email)

        return queryset

    def list(self, request, *args, **kwargs):
        """Enhanced list with statistics"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        return Response({
            'results': serializer.data,
            'count': queryset.count(),
            'stats': self._get_transaction_stats()
        })

    def _get_transaction_stats(self):
        """Get transaction statistics"""
        stats = Transaction.objects.aggregate(
            total_count=models.Count('id'),
            pending_count=models.Count('id', filter=models.Q(status='pending')),
            completed_count=models.Count('id', filter=models.Q(status='completed')),
            total_deposits=models.Sum('amount', filter=models.Q(
                transaction_type='deposit', status='completed'
            )),
            total_withdrawals=models.Sum('amount', filter=models.Q(
                transaction_type='withdrawal', status='completed'
            ))
        )

        return {
            'total_transactions': stats['total_count'] or 0,
            'pending_transactions': stats['pending_count'] or 0,
            'completed_transactions': stats['completed_count'] or 0,
            'total_deposits': float(stats['total_deposits'] or 0),
            'total_withdrawals': float(stats['total_withdrawals'] or 0)
        }

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending transactions with enhanced data"""
        pending = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(pending, many=True)
        return Response({
            'results': serializer.data,
            'count': pending.count()
        })

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve transaction with real-time updates"""
        with transaction.atomic():
            # Lock transaction to prevent duplicate approvals
            transaction_obj = Transaction.objects.select_for_update().get(pk=pk)

            if transaction_obj.status != 'pending':
                return Response(
                    {'error': 'Only pending transactions can be approved'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # CRITICAL: Lock the user row to prevent race conditions
            user = User.objects.select_for_update().get(pk=transaction_obj.user.pk)

            # Update transaction
            transaction_obj.status = 'completed'
            transaction_obj.processed_at = timezone.now()
            transaction_obj.processed_by = request.user

            if transaction_obj.transaction_type == 'deposit':
                user.balance += transaction_obj.amount

                # Bot prices
                bot_prices = {
                    'basic': Decimal('250.00'),
                    'premium': Decimal('500.00'),
                    'specialist': Decimal('1000.00'),
                }

                deposit_amount = transaction_obj.amount
                bot_purchased = None
                bot_cost = Decimal('0.00')

                # Check if deposit amount matches a bot price
                if deposit_amount == bot_prices['specialist']:
                    user.bot_type = 'specialist'
                    bot_purchased = 'Specialist Bot'
                    bot_cost = bot_prices['specialist']
                elif deposit_amount == bot_prices['premium']:
                    user.bot_type = 'premium'
                    bot_purchased = 'Premium Bot'
                    bot_cost = bot_prices['premium']
                elif deposit_amount == bot_prices['basic']:
                    user.bot_type = 'basic'
                    bot_purchased = 'Basic Bot'
                    bot_cost = bot_prices['basic']

                if bot_purchased:
                    # user.balance -= bot_cost
                    # INSIDE atomic block - will rollback if this fails
                    Transaction.objects.create(
                        user=user,
                        transaction_type='bot_purchase',
                        amount=bot_cost,
                        status='completed',
                        processed_by=request.user,
                        processed_at=timezone.now(),
                        admin_notes=f'Purchase of {bot_purchased}.'
                    )

            elif transaction_obj.transaction_type == 'withdrawal':
                total_to_deduct = transaction_obj.total_amount()
                # Check balance inside locked transaction
                if user.balance >= total_to_deduct:
                    user.balance -= total_to_deduct
                else:
                    transaction_obj.status = 'rejected'
                    transaction_obj.admin_notes = 'Insufficient funds at time of approval.'
                    transaction_obj.save()
                    return Response(
                        {'error': 'Insufficient funds at time of approval. Transaction rejected.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            user.save()
            transaction_obj.save()

            return Response({
                'message': 'Transaction approved successfully',
                'transaction': self.get_serializer(transaction_obj).data,
                'user_balance': str(user.balance)
            })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject transaction"""
        with transaction.atomic():
            transaction_obj = self.get_object()

            if transaction_obj.status != 'pending':
                return Response(
                    {'error': 'Only pending transactions can be rejected'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            reason = request.data.get('reason', '')
            user = transaction_obj.user

            transaction_obj.status = 'rejected'
            transaction_obj.processed_at = timezone.now()
            transaction_obj.processed_by = request.user
            transaction_obj.admin_notes = reason
            transaction_obj.save()

            return Response({
                'message': 'Transaction rejected successfully',
                'transaction': self.get_serializer(transaction_obj).data,
                'user_balance': str(user.balance)
            })


class SiteSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet for managing site settings"""
    queryset = SiteSettings.objects.all()
    serializer_class = SiteSettingsSerializer
    permission_classes = [IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)

    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[])
    def public(self, request):
        """Public endpoint to get all settings (no auth required)"""
        settings_dict = {
            setting.key: setting.value
            for setting in self.queryset.all()
        }
        return Response(settings_dict)