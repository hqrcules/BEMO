from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction as db_transaction
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import Transaction
from .serializers import (
    TransactionSerializer,
    DepositSerializer,
    WithdrawalSerializer,
    BalanceHistorySerializer
)

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).select_related('user', 'processed_by').order_by('-created_at')

    # GET /api/transactions/
    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        data = self.get_serializer(qs, many=True).data
        return Response({'results': data, 'count': qs.count()})

    @action(detail=False, methods=['get'])
    def history(self, request):
        qs = self.get_queryset()
        ttype = request.query_params.get('type')
        status_filter = request.query_params.get('status')
        if ttype:
            qs = qs.filter(transaction_type=ttype)
        if status_filter:
            qs = qs.filter(status=status_filter)
        data = self.get_serializer(qs, many=True).data
        return Response({'results': data, 'count': qs.count()})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        from django.db.models import Sum, Count, Q
        qs = self.get_queryset()
        dep = qs.filter(transaction_type='deposit', status='completed').aggregate(cnt=Count('id'), total=Sum('amount'))
        wd = qs.filter(transaction_type='withdrawal', status='completed').aggregate(cnt=Count('id'), total=Sum('amount'))
        return Response({
            'total_deposits': dep['cnt'] or 0,
            'total_withdrawals': wd['cnt'] or 0,
            'pending_transactions': qs.filter(status='pending').count(),
            'total_deposit_amount': str(dep['total'] or 0),
            'total_withdrawal_amount': str(wd['total'] or 0),
        })

    @action(detail=False, methods=['post'], serializer_class=DepositSerializer)
    def deposit(self, request):
        with db_transaction.atomic():
            s = DepositSerializer(data=request.data, context={'request': request})
            if not s.is_valid():
                return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)
            tx = s.save()
            return Response({
                'transaction': TransactionSerializer(tx).data,
                'message': 'Deposit created. Awaiting admin approval.',
                'user_balance': str(request.user.balance),
            }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], serializer_class=WithdrawalSerializer)
    def withdraw(self, request):
        with db_transaction.atomic():
            s = WithdrawalSerializer(data=request.data, context={'request': request})
            if not s.is_valid():
                return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)
            tx = s.save()
            request.user.refresh_from_db()
            return Response({
                'transaction': TransactionSerializer(tx).data,
                'message': 'Withdrawal request created.',
                'user_balance': str(request.user.balance),
            }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='balance-history')
    def balance_history(self, request):
        """
        Returns the user's balance history for the last 30 days.
        Calculates balance changes based on completed transactions.
        """
        user = request.user
        thirty_days_ago = timezone.now() - timedelta(days=30)
        history_data = []
        current_balance = user.balance

        transactions = Transaction.objects.filter(
            user=user,
            status='completed',
            processed_at__gte=thirty_days_ago
        ).order_by('-processed_at')

        history_data.append({
            "timestamp": timezone.now(),
            "balance": current_balance
        })

        for tx in transactions:
            if tx.transaction_type == 'deposit':
                current_balance -= tx.amount
            elif tx.transaction_type == 'withdrawal':
                current_balance += tx.total_amount()
            elif tx.transaction_type == 'bot_profit':
                current_balance -= tx.amount
            elif tx.transaction_type == 'bot_purchase':
                current_balance += tx.amount

            history_data.append({
                "timestamp": tx.processed_at,
                "balance": current_balance
            })

        if transactions.count() == 0:
            history_data.append({
                "timestamp": thirty_days_ago,
                "balance": user.balance
            })
        else:
            oldest_calculated_balance = history_data[-1]['balance']
            history_data.append({
                "timestamp": thirty_days_ago,
                "balance": oldest_calculated_balance
            })

        history_data.reverse()

        serializer = BalanceHistorySerializer(history_data, many=True)
        return Response(serializer.data)
