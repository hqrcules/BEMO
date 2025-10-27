from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db import transaction as db_transaction
from django.utils import timezone
from django.core.cache import cache
from datetime import timedelta
from decimal import Decimal
from .models import Transaction
from .serializers import (
    TransactionSerializer,
    DepositSerializer,
    WithdrawalSerializer,
    BalanceHistorySerializer
)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).select_related('user', 'processed_by').order_by('-created_at')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response({'results': serializer.data, 'count': queryset.count()})

    @action(detail=False, methods=['get'])
    def history(self, request):
        qs = self.get_queryset()
        ttype = request.query_params.get('type')
        status_filter = request.query_params.get('status')
        if ttype:
            qs = qs.filter(transaction_type=ttype)
        if status_filter:
            qs = qs.filter(status=status_filter)

        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(qs, many=True)
        return Response({'results': serializer.data, 'count': qs.count()})

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
            cache_key = f'balance_history_{request.user.id}'
            cache.delete(cache_key)
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
            cache_key = f'balance_history_{request.user.id}'
            cache.delete(cache_key)
            return Response({
                'transaction': TransactionSerializer(tx).data,
                'message': 'Withdrawal request created.',
                'user_balance': str(request.user.balance),
            }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='balance-history')
    def balance_history(self, request):
        user = request.user
        cache_key = f'balance_history_{user.id}'
        cached_data = cache.get(cache_key)

        if cached_data:
            return Response(cached_data)

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
            processed_at_safe = tx.processed_at or tx.created_at
            if processed_at_safe < thirty_days_ago:
                continue

            balance_before_tx = current_balance
            if tx.transaction_type == 'deposit':
                balance_before_tx -= tx.amount
            elif tx.transaction_type == 'withdrawal':
                balance_before_tx += tx.total_amount()
            elif tx.transaction_type == 'bot_profit':
                balance_before_tx -= tx.amount
            elif tx.transaction_type == 'bot_purchase':
                balance_before_tx += tx.amount
            history_data.append({
                "timestamp": processed_at_safe,
                "balance": balance_before_tx
            })
            current_balance = balance_before_tx


        balance_30_days_ago = current_balance
        oldest_tx = transactions.last()
        if not oldest_tx or (oldest_tx.processed_at and oldest_tx.processed_at > thirty_days_ago):
             pass

        history_data.append({
            "timestamp": thirty_days_ago,
            "balance": balance_30_days_ago
        })

        history_data.sort(key=lambda x: x['timestamp'])

        max_points = 100
        if len(history_data) > max_points:
            step = len(history_data) // max_points
            sampled_data = history_data[::step]
            if history_data[-1] not in sampled_data:
                sampled_data.append(history_data[-1])
            history_data = sampled_data

        serializer = BalanceHistorySerializer(history_data, many=True)
        serialized_data = serializer.data

        cache.set(cache_key, serialized_data, timeout=3600)

        return Response(serialized_data)