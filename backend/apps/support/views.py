from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from .models import SupportChat, SupportMessage
from .serializers import SupportChatSerializer, SendMessageSerializer, SupportMessageSerializer


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

    @action(detail=False, methods=['get'], url_path='my-chat')
    def my_chat(self, request):
        """Get or create a chat for the current user."""
        chat, _ = SupportChat.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(chat)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='my-chat/messages')
    def poll_messages(self, request):
        """Polling endpoint for getting new messages in user's chat."""
        try:
            chat = SupportChat.objects.get(user=request.user)
        except SupportChat.DoesNotExist:
            return Response({'messages': []})

        # Get timestamp from query params (optional)
        since = request.query_params.get('since')
        messages_queryset = chat.messages.all()

        if since:
            try:
                since_datetime = parse_datetime(since)
                if since_datetime:
                    messages_queryset = messages_queryset.filter(created_at__gt=since_datetime)
            except (ValueError, TypeError):
                pass  # If parsing fails, return all messages

        messages = messages_queryset.order_by('created_at')
        serializer = SupportMessageSerializer(messages, many=True)

        return Response({
            'messages': serializer.data,
            'chat_status': chat.status,
            'last_updated': timezone.now().isoformat()
        })

    @action(detail=True, methods=['get'], url_path='messages', permission_classes=[IsAdminUser])
    def poll_admin_messages(self, request, pk=None):
        """Polling endpoint for admins to get messages from specific chat."""
        chat = self.get_object()

        # Get timestamp from query params (optional)
        since = request.query_params.get('since')
        messages_queryset = chat.messages.all()

        if since:
            try:
                since_datetime = parse_datetime(since)
                if since_datetime:
                    messages_queryset = messages_queryset.filter(created_at__gt=since_datetime)
            except (ValueError, TypeError):
                pass

        messages = messages_queryset.order_by('created_at')
        serializer = SupportMessageSerializer(messages, many=True)

        return Response({
            'messages': serializer.data,
            'chat_status': chat.status,
            'chat_id': str(chat.id),
            'last_updated': timezone.now().isoformat()
        })

    @action(detail=False, methods=['post'], url_path='my-chat/send_message')
    def send_user_message(self, request):
        """Create a new message from a user."""
        chat, _ = SupportChat.objects.get_or_create(user=request.user)
        serializer = SendMessageSerializer(data=request.data, context=self.get_serializer_context())
        if serializer.is_valid():
            message = serializer.save(chat=chat, user=request.user, is_from_admin=False)

            chat.updated_at = timezone.now()
            chat.status = 'open'
            chat.save()

            return Response(self.get_serializer(chat).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='send_admin_message', permission_classes=[IsAdminUser])
    def send_admin_message(self, request, pk=None):
        """Create a new message from an admin."""
        chat = self.get_object()
        serializer = SendMessageSerializer(data=request.data, context=self.get_serializer_context())
        if serializer.is_valid():
            message = serializer.save(chat=chat, user=request.user, is_from_admin=True)

            chat.status = 'in_progress'
            chat.updated_at = timezone.now()
            chat.save()

            return Response(self.get_serializer(chat).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)