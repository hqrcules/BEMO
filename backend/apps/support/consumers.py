import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import SupportChat, SupportMessage
from .serializers import SupportMessageSerializer
from django.contrib.auth.models import AnonymousUser


class SupportConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if isinstance(self.user, AnonymousUser):
            await self.close()
            return

        # Use different group names for users and admins
        if self.user.is_staff:
            self.chat_group_name = 'support_admin'
        else:
            chat = await self.get_user_chat()
            self.chat_group_name = f'support_chat_{chat.id}'

        await self.channel_layer.group_add(
            self.chat_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'chat_group_name'):
            await self.channel_layer.group_discard(
                self.chat_group_name,
                self.channel_name
            )

    async def chat_message(self, event):
        """
        Handler for messages broadcasted from the view.
        """
        message_data = event['message']
        await self.send(text_data=json.dumps({
            'type': 'new_message',
            'message': message_data
        }))

    @database_sync_to_async
    def get_user_chat(self):
        chat, _ = SupportChat.objects.get_or_create(user=self.user)
        return chat