from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'balance', 'bot_type', 'is_verified', 'created_at']
    list_filter = ['is_active', 'is_staff', 'is_verified', 'bot_type', 'created_at']
    search_fields = ['email', 'full_name']
    ordering = ['-created_at']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name',)}),
        ('Financial', {'fields': ('balance', 'bot_type')}),
        ('Permissions',
         {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
        ('Security', {'fields': ('last_login_ip',)}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'is_staff', 'is_active')}
         ),
    )

    readonly_fields = ['created_at', 'updated_at', 'last_login']

    filter_horizontal = ('groups', 'user_permissions',)
