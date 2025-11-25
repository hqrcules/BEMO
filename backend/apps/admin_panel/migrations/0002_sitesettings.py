# Generated manually on 2025-01-15

import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('admin_panel', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SiteSettings',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('key', models.CharField(choices=[('withdrawal_info', 'Withdrawal Info Text'), ('deposit_info', 'Deposit Info Text')], help_text='Unique key for the setting', max_length=50, unique=True)),
                ('value', models.TextField(help_text='Setting value (can be text, HTML, JSON, etc.)')),
                ('description', models.CharField(blank=True, help_text='Description of what this setting does', max_length=255)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('updated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='updated_settings', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Site Setting',
                'verbose_name_plural': 'Site Settings',
                'db_table': 'site_settings',
                'ordering': ['key'],
            },
        ),
    ]
