import uuid
from django.db import models
from django.conf import settings


class SupportMessage(models.Model):
    """Model for support chat messages"""

    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
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
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['is_read']),
        ]

    def __str__(self):
        sender = 'Admin' if self.is_from_admin else self.user.email
        return f"{sender}: {self.message[:50]}..."
