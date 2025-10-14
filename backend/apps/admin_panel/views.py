from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.utils import timezone
from .models import PaymentDetails
from .serializers import (
    PaymentDetailsSerializer,
    AdminUserSerializer,
    AdminTransactionSerializer
)
from apps.accounts.models import User
from apps.transactions.models import Transaction
from apps.support.models import SupportChat
from apps.support.serializers import SupportChatSerializer


class PaymentDetailsViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing payment details (реквізити)
    Only accessible by admin users
    """
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
    """
    ViewSet for user management
    Only accessible by admin users
    """
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=['post'])
    def update_balance(self, request, pk=None):
        """
        Update user balance
        POST /api/admin/users/{id}/update_balance/
        Body: {"amount": 1000.00, "action": "add" or "subtract"}
        """
        user = self.get_object()
        amount = request.data.get('amount')
        action = request.data.get('action', 'add')

        if not amount:
            return Response(
                {'error': 'Amount is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            amount = float(amount)
        except ValueError:
            return Response(
                {'error': 'Invalid amount'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if action == 'add':
            user.balance += amount
        elif action == 'subtract':
            user.balance -= amount
        else:
            return Response(
                {'error': 'Action must be "add" or "subtract"'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.save()

        return Response({
            'message': 'Balance updated successfully',
            'new_balance': user.balance
        })

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """
        Verify user (KYC)
        POST /api/admin/users/{id}/verify/
        """
        user = self.get_object()
        user.is_verified = True
        user.save()

        return Response({
            'message': 'User verified successfully'
        })


class AdminTransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for transaction management
    Only accessible by admin users
    """
    queryset = Transaction.objects.all()
    serializer_class = AdminTransactionSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get all pending transactions"""
        pending = self.queryset.filter(status='pending')
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve transaction
        POST /api/admin/transactions/{id}/approve/
        """
        transaction = self.get_object()

        if transaction.status != 'pending':
            return Response(
                {'error': 'Only pending transactions can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update transaction
        transaction.status = 'completed'
        transaction.processed_at = timezone.now()
        transaction.processed_by = request.user

        # Update user balance
        user = transaction.user

        if transaction.transaction_type == 'deposit':
            user.balance += transaction.amount

            # Update bot type based on deposit amount
            if transaction.amount >= 1000:
                user.bot_type = 'specialist'
            elif transaction.amount >= 500:
                user.bot_type = 'premium'
            elif transaction.amount >= 250:
                user.bot_type = 'basic'

        elif transaction.transaction_type == 'withdrawal':
            # Balance already deducted, just mark as completed
            pass

        user.save()
        transaction.save()

        return Response({
            'message': 'Transaction approved successfully',
            'transaction': self.get_serializer(transaction).data
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """
        Reject transaction
        POST /api/admin/transactions/{id}/reject/
        Body: {"reason": "Reason for rejection"}
        """
        transaction = self.get_object()

        if transaction.status != 'pending':
            return Response(
                {'error': 'Only pending transactions can be rejected'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reason = request.data.get('reason', '')

        transaction.status = 'rejected'
        transaction.processed_at = timezone.now()
        transaction.processed_by = request.user
        transaction.admin_notes = reason
        transaction.save()

        return Response({
            'message': 'Transaction rejected',
            'transaction': self.get_serializer(transaction).data
        })


class AdminSupportChatViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for admin to view and respond to support chats.
    """
    queryset = SupportChat.objects.all()
    serializer_class = SupportChatSerializer
    permission_classes = [IsAdminUser]

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        chat = self.get_object()
        serializer = SendMessageSerializer(data=request.data)
        if serializer.is_valid():
            SupportMessage.objects.create(
                chat=chat,
                user=request.user, # The admin user
                message=serializer.validated_data['message'],
                is_from_admin=True
            )
            chat.status = 'in_progress'
            chat.save()
            return Response(SupportChatSerializer(chat).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)