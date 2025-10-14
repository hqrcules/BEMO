from django.contrib import admin
from .models import SupportChat, SupportMessage


class SupportMessageInline(admin.TabularInline):
    model = SupportMessage
    fields = ['user', 'message', 'is_from_admin', 'is_read', 'created_at']
    readonly_fields = ['user', 'created_at']
    extra = 0


@admin.register(SupportChat)
class SupportChatAdmin(admin.ModelAdmin):
    list_display = ['user', 'status', 'assigned_admin', 'updated_at']
    list_filter = ['status', 'assigned_admin']
    search_fields = ['user__email', 'subject']
    inlines = [SupportMessageInline]