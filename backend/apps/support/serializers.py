from rest_framework import serializers
from .models import SupportChat, SupportMessage

class SupportMessageSerializer(serializers.ModelSerializer):
    """Serializer for a single message."""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    sender_name = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()

    class Meta:
        model = SupportMessage
        fields = [
            'id', 'chat', 'user', 'user_email', 'message', 'attachment',
            'attachment_url', 'is_from_admin', 'is_read', 'sender_name',
            'created_at', 'read_at',
        ]
        read_only_fields = ['id', 'user', 'chat', 'is_from_admin', 'created_at', 'read_at']

    def get_sender_name(self, obj):
        if obj.is_from_admin:
            return 'Команда поддержки'
        return obj.user.full_name or obj.user.email

    def get_attachment_url(self, obj):
        request = self.context.get('request')
        if obj.attachment and request:
            return request.build_absolute_uri(obj.attachment.url)
        return None

class SupportChatSerializer(serializers.ModelSerializer):
    """Serializer for a chat session, including its messages."""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    messages = SupportMessageSerializer(many=True, read_only=True)

    class Meta:
        model = SupportChat
        fields = [
            'id', 'user', 'user_email', 'user_full_name', 'status', 'subject',
            'created_at', 'updated_at', 'messages'
        ]

    def get_fields(self):
        fields = super().get_fields()
        # Pass context to nested serializer
        fields['messages'].context.update(self.context)
        return fields

class SendMessageSerializer(serializers.ModelSerializer):
    """Serializer for creating a new message."""
    class Meta:
        model = SupportMessage
        fields = ['message', 'attachment']

    def save(self, **kwargs):
        # The view will pass 'chat', 'user', and 'is_from_admin'
        return super().save(**kwargs)