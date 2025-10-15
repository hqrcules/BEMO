from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction as db_transaction
from .models import Transaction
from .serializers import TransactionSerializer, DepositSerializer, WithdrawalSerializer

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).select_related('user', 'processed_by').order_by('-created_at')

    # GET /api/transactions/ — повертаємо {results, count}
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
            # Повертаємо уніфіковано, щоб фронт міг одразу оновити історію
            return Response({
                'transaction': TransactionSerializer(tx).data,
                'message': 'Deposit created. Awaiting admin approval.',
                'user_balance': str(request.user.balance),  # наразі не змінюємо баланс до approve
            }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], serializer_class=WithdrawalSerializer)
    def withdraw(self, request):
        with db_transaction.atomic():
            s = WithdrawalSerializer(data=request.data, context={'request': request})
            if not s.is_valid():
                return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)
            tx = s.save()
            # У нас баланс для withdrawal списується в serializer (якщо ви так реалізували), тоді повертаємо оновлений
            request.user.refresh_from_db()
            return Response({
                'transaction': TransactionSerializer(tx).data,
                'message': 'Withdrawal request created.',
                'user_balance': str(request.user.balance),
            }, status=status.HTTP_201_CREATED)
