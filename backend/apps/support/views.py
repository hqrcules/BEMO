from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import SupportMessage
from .serializers import SupportMessageSerializer, SendMessageSerializer


class SupportMessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for support chat messages
    GET /api/support/messages/ - list all user messages
    POST /api/support/messages/ - send new message
    GET /api/support/messages/{id}/ - retrieve single message
    """
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return SendMessageSerializer
        return SupportMessageSerializer

    def get_queryset(self):
        return SupportMessage.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        """Get all messages for current user"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)

        # Mark all unread messages as read
        queryset.filter(is_read=False, is_from_admin=True).update(
            is_read=True,
            read_at=timezone.now()
        )

        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Send new message"""
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            message = serializer.save()
            return Response(
                SupportMessageSerializer(message).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """
        Get count of unread messages from admin
        GET /api/support/messages/unread_count/
        """
        count = self.get_queryset().filter(
            is_from_admin=True,
            is_read=False
        ).count()

        return Response({'unread_count': count})

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Mark message as read
        POST /api/support/messages/{id}/mark_read/
        """
        message = self.get_object()

        if not message.is_read:
            message.is_read = True
            message.read_at = timezone.now()
            message.save()

        return Response({
            'message': 'Marked as read',
            'data': self.get_serializer(message).data
        })
