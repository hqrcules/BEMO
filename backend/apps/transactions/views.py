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
from django.utils.dateparse import parse_datetime
from django.core.cache import cache
from django.db.models import Q, Sum, Count, Avg, Max, Min
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
        # cached_data = cache.get(cache_key)
        # if cached_data:
        #     return Response(cached_data)
        cache.delete(cache_key) # Force refresh for debugging

        thirty_days_ago = timezone.now() - timedelta(days=30)
        history_points = []

        # 1. Отримати всі транзакції за період
        transactions = Transaction.objects.filter(
            Q(processed_at__gte=thirty_days_ago) |
            Q(processed_at__isnull=True, created_at__gte=thirty_days_ago),
            user=user,
            status='completed'
        ).order_by('processed_at', 'created_at') # Сортуємо від найстарішої до найновішої

        # 2. Визначити початковий баланс 30 днів тому
        # Це найскладніша частина, бо треба від поточного балансу відняти/додати всі транзакції ДО початку періоду
        # Простіший варіант (може бути неточний, якщо є старі транзакції): почати з 0 або першої транзакції
        # Більш точний: розрахувати баланс *до* першої транзакції в нашому вікні
        first_tx_in_window = transactions.first()
        balance_at_start_of_window = user.balance # Починаємо з поточного

        # Розраховуємо баланс до першої транзакції в вікні, йдучи назад від поточної дати
        transactions_before_window_start = Transaction.objects.filter(
             user=user,
             status='completed',
             # Вибираємо ті, що були оброблені або створені ПІСЛЯ першої транзакції нашого вікна (або зараз, якщо вікно порожнє)
             # АБО ті, що були до вікна, але ми рухаємось назад
        ).filter(
            # Всі транзакції ПІСЛЯ початку нашого вікна (processed_at або created_at)
            Q(processed_at__gte=first_tx_in_window.processed_at if first_tx_in_window and first_tx_in_window.processed_at else thirty_days_ago) |
            Q(processed_at__isnull=True, created_at__gte=first_tx_in_window.created_at if first_tx_in_window else thirty_days_ago)
        ).order_by('-processed_at', '-created_at') # Йдемо назад від найновіших

        temp_balance = user.balance
        for tx in transactions_before_window_start:
             processed_at_safe = tx.processed_at if tx.processed_at else tx.created_at
             # Якщо транзакція СТАРША за початок вікна, її не враховуємо в цьому циклі
             # Ми вже її пройдемо, коли будемо розраховувати balance_at_start_of_window
             # Цей цикл потрібен щоб дійти до стану НА МОМЕНТ початку вікна
             if processed_at_safe < (first_tx_in_window.processed_at if first_tx_in_window and first_tx_in_window.processed_at else thirty_days_ago):
                 # Можна додати логіку розрахунку балансу до початку вікна тут, але це складно
                 # Простіший варіант - взяти баланс до першої транзакції вікна
                 continue # Пропускаємо ті що вже позаду

             # Розраховуємо баланс *ДО* цієї транзакції (рухаючись назад)
             if tx.transaction_type == 'deposit':
                temp_balance -= tx.amount
             elif tx.transaction_type == 'withdrawal':
                temp_balance += tx.total_amount()
             elif tx.transaction_type == 'bot_profit':
                temp_balance -= tx.amount
             elif tx.transaction_type == 'bot_purchase':
                temp_balance += tx.amount

        # Після циклу, temp_balance - це баланс на момент ПЕРШОЇ транзакції у вікні (або на thirty_days_ago)
        balance_at_start_of_window = temp_balance


        # 3. Додати початкову точку
        history_points.append({
            "timestamp": thirty_days_ago,
            "balance": balance_at_start_of_window
        })

        # 4. Пройти по транзакціях і додати точки *після* кожної
        current_balance = balance_at_start_of_window
        last_timestamp = thirty_days_ago

        for tx in transactions:
            processed_at_safe = tx.processed_at if tx.processed_at else tx.created_at

            # Якщо час змінився з попередньої точки, додаємо точку зі старим балансом ПЕРЕД зміною
            if processed_at_safe > last_timestamp:
                # Перевіряємо, чи ця точка вже не існує (щоб уникнути дублів при однакових processed_at_safe)
                 if not history_points or history_points[-1]['timestamp'] != last_timestamp:
                      history_points.append({
                          "timestamp": last_timestamp,
                          "balance": current_balance # Баланс до цієї транзакції
                      })


            # Оновлюємо баланс *після* транзакції
            if tx.transaction_type == 'deposit':
                current_balance += tx.amount
            elif tx.transaction_type == 'withdrawal':
                current_balance -= tx.total_amount()
            elif tx.transaction_type == 'bot_profit':
                current_balance += tx.amount
            elif tx.transaction_type == 'bot_purchase':
                current_balance -= tx.amount

             # Додаємо точку з новим балансом ПІСЛЯ транзакції
             # Якщо є кілька транзакцій в той самий момент, додаємо тільки одну точку в кінці
            if not transactions.filter(
                Q(processed_at=processed_at_safe) | Q(processed_at__isnull=True, created_at=processed_at_safe)
            ).exclude(id=tx.id).exists(): # Перевіряємо, чи є ще транзакції в той же час
                 history_points.append({
                     "timestamp": processed_at_safe,
                     "balance": current_balance
                 })

            last_timestamp = processed_at_safe


        # 5. Додати кінцеву точку (поточний час і поточний баланс користувача)
        now = timezone.now()
        # Перевіряємо чи остання точка вже не є поточною
        if not history_points or history_points[-1]['timestamp'] < now:
             # Якщо остання обчислена точка раніше, додаємо її ще раз перед поточною
             if history_points and history_points[-1]['timestamp'] != last_timestamp and last_timestamp < now:
                  history_points.append({
                       "timestamp": last_timestamp,
                       "balance": current_balance
                  })
             # Додаємо поточний стан
             history_points.append({
                 "timestamp": now,
                 "balance": user.balance # Використовуємо актуальний баланс користувача
             })


        # 6. Унікалізація та фінальне сортування (на випадок помилок)
        unique_history = {}
        history_points.sort(key=lambda x: x['timestamp']) # Сортуємо перед унікалізацією
        for point in history_points:
             # Використовуємо ISO рядок з мілісекундами як ключ для більшої точності
             ts_key = point['timestamp'].isoformat()
             unique_history[ts_key] = point # Останнє значення для цього часу перезапише попереднє

        final_history_data = sorted(unique_history.values(), key=lambda x: x['timestamp'])


        # 7. Форматування для фронтенду
        for point in final_history_data:
            point['timestamp'] = point['timestamp'].isoformat()
            point['balance'] = float(point['balance'])


        serialized_data = final_history_data

        cache.set(cache_key, serialized_data, timeout=60)

        return Response(serialized_data)