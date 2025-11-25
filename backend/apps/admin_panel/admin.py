from django.contrib import admin
from .models import PaymentDetails, SiteSettings


@admin.register(PaymentDetails)
class PaymentDetailsAdmin(admin.ModelAdmin):
    list_display = ['currency', 'wallet_address', 'network', 'is_active', 'updated_at']
    list_filter = ['currency', 'is_active', 'network']
    search_fields = ['wallet_address', 'bank_details']
    readonly_fields = ['id', 'created_at', 'updated_at']

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ['key', 'description', 'updated_at', 'updated_by']
    list_filter = ['key']
    search_fields = ['key', 'value', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user
        super().save_model(request, obj, form, change)
