from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PaymentDetailsViewSet,
    AdminUserViewSet,
    AdminTransactionViewSet,
    SiteSettingsViewSet
)

app_name = 'admin_panel'

router = DefaultRouter()
router.register(r'payment-details', PaymentDetailsViewSet, basename='payment-details')
router.register(r'users', AdminUserViewSet, basename='admin-users')
router.register(r'transactions', AdminTransactionViewSet, basename='admin-transactions')
router.register(r'settings', SiteSettingsViewSet, basename='settings')

urlpatterns = [
    path('', include(router.urls)),
]