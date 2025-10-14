from django.contrib import admin
from .models import SupportMessage


@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'message_preview', 'is_from_admin', 'is_read', 'created_at']
    list_filter = ['is_from_admin', 'is_read', 'created_at']
    search_fields = ['user__email', 'message']
    readonly_fields = ['id', 'created_at']

    def user_email(self, obj):
        return obj.user.email

    user_email.short_description = 'User'

    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message

    message_preview.short_description = 'Message'
