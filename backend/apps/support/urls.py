from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SupportChatViewSet

app_name = 'support'

router = DefaultRouter()
router.register(r'chats', SupportChatViewSet, basename='chat')

urlpatterns = [
    path('', include(router.urls)),
]