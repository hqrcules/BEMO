import uuid
from django.db import models
from django.conf import settings


class SupportChat(models.Model):
    """Model for a support chat session between a user and admin."""
    STATUS_CHOICES = [
        ('open', 'Открытый'),
        ('in_progress', 'В обработке'),
        ('closed', 'Закрытый'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='support_chats'
    )
    assigned_admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_support_chats',
        limit_choices_to={'is_staff': True}
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    subject = models.CharField(max_length=255, blank=True, help_text="Тема обращения")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'support_chats'
        verbose_name = 'Support Chat'
        verbose_name_plural = 'Support Chats'
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', '-updated_at']),
            models.Index(fields=['status', '-updated_at']),
            models.Index(fields=['assigned_admin', '-updated_at']),
        ]

    def __str__(self):
        return f"Chat with {self.user.email} ({self.status})"


class SupportMessage(models.Model):
    """Model for support chat messages"""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    chat = models.ForeignKey(
        SupportChat,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='support_messages'
    )
    message = models.TextField()
    attachment = models.FileField(
        upload_to='support/%Y/%m/%d/',
        null=True,
        blank=True,
        help_text='Attached file (receipt, screenshot, etc.)'
    )

    # Message Metadata
    is_from_admin = models.BooleanField(
        default=False,
        help_text='True if message is from admin/support'
    )
    is_read = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'support_messages'
        verbose_name = 'Support Message'
        verbose_name_plural = 'Support Messages'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['chat', 'created_at']),
            models.Index(fields=['is_read', 'is_from_admin']),
        ]

    def __str__(self):
        sender = 'Admin' if self.is_from_admin else self.user.email
        return f"{sender}: {self.message[:50]}..."