from django.contrib import admin
from .models import PassportShare, PassportEvent


@admin.register(PassportShare)
class PassportShareAdmin(admin.ModelAdmin):
    list_display = ['share_code', 'child', 'recipient_type', 'is_active', 'expires_at', 'view_count', 'created_at']
    list_filter = ['is_active', 'recipient_type']
    search_fields = ['share_code', 'recipient_name']
    readonly_fields = ['id', 'share_code', 'passcode', 'created_at', 'view_count']


@admin.register(PassportEvent)
class PassportEventAdmin(admin.ModelAdmin):
    list_display = ['event_type', 'title', 'child', 'stage_type', 'stage_week', 'is_concern', 'event_date']
    list_filter = ['event_type', 'stage_type', 'is_concern']
    search_fields = ['title', 'description']
    readonly_fields = ['id', 'created_at']
