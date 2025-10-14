from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Transaction
from .serializers import (
    TransactionSerializer,
    DepositSerializer,
    WithdrawalSerializer
)


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for listing and retrieving transactions
    GET /api/transactions/ - list all user transactions
    GET /api/transactions/{id}/ - retrieve single transaction
    """
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'], serializer_class=DepositSerializer)
    def deposit(self, request):
        """
        Create deposit transaction
        POST /api/transactions/deposit/
        Body: {"amount": 250.00, "payment_receipt": file}
        """
        serializer = DepositSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            transaction = serializer.save()
            return Response(
                TransactionSerializer(transaction).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], serializer_class=WithdrawalSerializer)
    def withdraw(self, request):
        """
        Create withdrawal transaction
        POST /api/transactions/withdraw/
        Body: {"amount": 1000.00}
        """
        serializer = WithdrawalSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            transaction = serializer.save()
            return Response(
                TransactionSerializer(transaction).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def history(self, request):
        """
        Get transaction history with filters
        GET /api/transactions/history/?type=deposit&status=completed
        """
        queryset = self.get_queryset()

        # Filters
        transaction_type = request.query_params.get('type')
        status_filter = request.query_params.get('status')

        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
