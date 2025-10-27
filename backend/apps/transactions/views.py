# backend/apps/transactions/views.py

from datetime import timedelta
from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.db import transaction as db_transaction
from django.utils import timezone
from django.db.models import Q, Sum, Count, Case, When, Value, F, DecimalField
from django.db.models.functions import Coalesce
from .models import Transaction
from .serializers import (
    TransactionSerializer,
    DepositSerializer,
    WithdrawalSerializer,
    BalanceHistorySerializer # Можливо, вже не потрібен
)
from .services import TransactionService # Імпортуємо сервіс


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    transaction_service = TransactionService() # Екземпляр сервісу

    def get_queryset(self):
        # Базовий queryset для користувача
        return Transaction.objects.filter(user=self.request.user).select_related('user', 'processed_by').order_by('-created_at')

    def _get_filtered_queryset(self, request):
        # Допоміжний метод для фільтрації
        queryset = self.get_queryset()
        ttype = request.query_params.get('type')
        status_filter = request.query_params.get('status')
        if ttype:
            queryset = queryset.filter(transaction_type=ttype)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset

    def list(self, request, *args, **kwargs):
        # Використовуємо фільтрований queryset
        queryset = self._get_filtered_queryset(request)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        # Повертаємо count з пагінатора або queryset напряму, якщо немає сторінок
        count = self.paginator.count if hasattr(self, 'paginator') and self.paginator else queryset.count()
        return Response({'results': serializer.data, 'count': count})


    @action(detail=False, methods=['get'])
    def history(self, request):
        # Просто викликаємо list, бо логіка фільтрації вже там
        return self.list(request)


    @action(detail=False, methods=['get'])
    def stats(self, request):
        # Оптимізований запит статистики
        user = request.user
        stats_data = Transaction.objects.filter(
            user=user,
            # Враховуємо тільки завершені для сум, всі для pending
        ).aggregate(
            total_deposits_count=Count('id', filter=Q(transaction_type=Transaction.TypeChoices.DEPOSIT, status=Transaction.StatusChoices.COMPLETED)),
            total_withdrawals_count=Count('id', filter=Q(transaction_type=Transaction.TypeChoices.WITHDRAWAL, status=Transaction.StatusChoices.COMPLETED)),
            pending_transactions_count=Count('id', filter=Q(status=Transaction.StatusChoices.PENDING)),
            total_deposit_amount=Coalesce(Sum('amount', filter=Q(transaction_type=Transaction.TypeChoices.DEPOSIT, status=Transaction.StatusChoices.COMPLETED)), Decimal(0)),
            # Сумуємо total_amount для виводів
            total_withdrawal_amount=Coalesce(Sum('total_amount', filter=Q(transaction_type=Transaction.TypeChoices.WITHDRAWAL, status=Transaction.StatusChoices.COMPLETED)), Decimal(0)),
        )

        return Response({
            'total_deposits': stats_data['total_deposits_count'],
            'total_withdrawals': stats_data['total_withdrawals_count'],
            'pending_transactions': stats_data['pending_transactions_count'],
            'total_deposit_amount': str(stats_data['total_deposit_amount']),
            'total_withdrawal_amount': str(stats_data['total_withdrawal_amount']),
        })

    @action(detail=False, methods=['post'], serializer_class=DepositSerializer)
    def deposit(self, request):
        serializer = DepositSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        try:
            with db_transaction.atomic():
                tx = self.transaction_service.create_transaction(
                    user=request.user,
                    amount=validated_data['amount'],
                    transaction_type=Transaction.TypeChoices.DEPOSIT,
                    payment_method=validated_data.get('payment_method') # Передаємо метод оплати
                )
                # Баланс не змінюється тут, тому кеш не інвалідуємо
                return Response({
                    'transaction': TransactionSerializer(tx).data,
                    'message': 'Deposit request created. Awaiting admin approval.',
                    'user_balance': str(request.user.balance), # Показуємо поточний баланс
                }, status=status.HTTP_201_CREATED)
        except ValueError as e:
             return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
             # Log the exception e
             return Response({'detail': 'An unexpected error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=False, methods=['post'], serializer_class=WithdrawalSerializer)
    def withdraw(self, request):
        serializer = WithdrawalSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        amount = validated_data['amount']
        # Розрахунок комісії (приклад, логіка може бути складнішою)
        fee = amount * Decimal('0.01') # Наприклад, 1% комісія

        try:
            with db_transaction.atomic():
                tx = self.transaction_service.create_transaction(
                    user=request.user,
                    amount=amount,
                    fee=fee,
                    transaction_type=Transaction.TypeChoices.WITHDRAWAL,
                    payment_method=validated_data.get('payment_method') # Може бути інфо про гаманець і т.д.
                )
                # Баланс користувача оновлюється в сервісі *до* створення транзакції
                request.user.refresh_from_db() # Оновлюємо дані користувача з бази
                # Інвалідція кешу тут не потрібна, бо статус PENDING
                return Response({
                    'transaction': TransactionSerializer(tx).data,
                    'message': 'Withdrawal request created.',
                    'user_balance': str(request.user.balance), # Показуємо оновлений баланс
                }, status=status.HTTP_201_CREATED)
        except ValueError as e:
             return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
             # Log the exception e
             return Response({'detail': 'An unexpected error occurred.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    @action(detail=False, methods=['get'], url_path='balance-history')
    def balance_history(self, request):
        """Повертає історію балансу користувача за останні 30 днів."""
        user = request.user
        try:
            history_data = self.transaction_service.get_balance_history(user, days=30)
            return Response(history_data)
        except Exception as e:
            # Log exception e
            return Response({"detail": "Failed to retrieve balance history."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)