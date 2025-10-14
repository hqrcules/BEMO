from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from .models import SupportChat, SupportMessage
from .serializers import SupportChatSerializer, SendMessageSerializer, SupportMessageSerializer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class SupportChatViewSet(viewsets.ModelViewSet):
    """
    ViewSet for support chat sessions.
    Admins can list/retrieve all chats.
    Users can only access their own chat via the /my-chat/ action.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = SupportChatSerializer

    def get_serializer_context(self):
        """Pass request to serializer."""
        return {'request': self.request}

    def get_queryset(self):
        """Admins see all chats, users see none from the main endpoint."""
        if self.request.user.is_staff:
            return SupportChat.objects.prefetch_related('messages', 'user').order_by('-updated_at')
        # Regular users access their chat via a dedicated action.
        return SupportChat.objects.none()

    def destroy(self, request, *args, **kwargs):
        """Allow only admins to delete a chat."""
        if not request.user.is_staff:
            return Response(status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    def _broadcast_message(self, chat, message_instance):
        """Helper to send message via WebSocket to user and admins."""
        channel_layer = get_channel_layer()
        message_serializer = SupportMessageSerializer(message_instance, context=self.get_serializer_context())

        async_to_sync(channel_layer.group_send)(
            f'support_chat_{chat.id}',
            {
                'type': 'chat.message',
                'message': message_serializer.data,
            }
        )
        async_to_sync(channel_layer.group_send)(
            'support_admin',
            {
                'type': 'chat.message',
                'message': message_serializer.data,
            }
        )

    @action(detail=False, methods=['get'], url_path='my-chat')
    def my_chat(self, request):
        """Get or create a chat for the current user."""
        chat, _ = SupportChat.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(chat)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='my-chat/send_message')
    def send_user_message(self, request):
        """Create a new message from a user and broadcast it."""
        chat, _ = SupportChat.objects.get_or_create(user=request.user)
        serializer = SendMessageSerializer(data=request.data, context=self.get_serializer_context())
        if serializer.is_valid():
            message = serializer.save(chat=chat, user=request.user, is_from_admin=False)
            chat.updated_at = timezone.now()
            chat.status = 'open'
            chat.save()

            self._broadcast_message(chat, message)

            return Response(self.get_serializer(chat).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='send_admin_message', permission_classes=[IsAdminUser])
    def send_admin_message(self, request, pk=None):
        """Create a new message from an admin and broadcast it."""
        chat = self.get_object()
        serializer = SendMessageSerializer(data=request.data, context=self.get_serializer_context())
        if serializer.is_valid():
            message = serializer.save(chat=chat, user=request.user, is_from_admin=True)
            chat.status = 'in_progress'
            chat.updated_at = timezone.now()
            chat.save()

            # Транслюємо повідомлення через WebSocket
            self._broadcast_message(chat, message)

            return Response(self.get_serializer(chat).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)