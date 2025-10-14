from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from .models import SupportMessage


class SupportMessageSerializer(serializers.ModelSerializer):
    """Serializer for SupportMessage model"""

    user_email = serializers.EmailField(source='user.email', read_only=True)
    sender_name = serializers.SerializerMethodField()

    class Meta:
        model = SupportMessage
        fields = [
            'id',
            'user',
            'user_email',
            'message',
            'attachment',
            'is_from_admin',
            'is_read',
            'sender_name',
            'created_at',
            'read_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'is_from_admin',
            'is_read',
            'created_at',
            'read_at',
        ]

    @extend_schema_field(serializers.CharField)
    def get_sender_name(self, obj):
        if obj.is_from_admin:
            return 'Support Team'
        return obj.user.full_name or obj.user.email


class SendMessageSerializer(serializers.ModelSerializer):
    """Serializer for sending messages"""

    class Meta:
        model = SupportMessage
        fields = ['message', 'attachment']

    def create(self, validated_data):
        user = self.context['request'].user

        message = SupportMessage.objects.create(
            user=user,
            message=validated_data['message'],
            attachment=validated_data.get('attachment'),
            is_from_admin=False
        )

        return message
