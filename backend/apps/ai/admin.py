from django.contrib import admin
from .models import Conversation, Message, AIKnowledgeBase


class MessageInline(admin.TabularInline):
    model = Message
    extra = 0
    readonly_fields = ['id', 'role', 'content', 'created_at']
    fields = ['role', 'content', 'is_complaint', 'created_at']


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'conversation_type', 'status', 'child', 'message_count', 'created_at']
    list_filter = ['conversation_type', 'status', 'created_at']
    search_fields = ['user__email', 'user__first_name']
    readonly_fields = ['id', 'created_at', 'updated_at', 'completed_at']
    inlines = [MessageInline]

    def message_count(self, obj):
        return obj.messages.count()
    message_count.short_description = 'Messages'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'conversation', 'role', 'content_preview', 'is_complaint', 'created_at']
    list_filter = ['role', 'is_complaint', 'created_at']
    search_fields = ['content', 'conversation__user__email']
    readonly_fields = ['id', 'created_at']

    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'


@admin.register(AIKnowledgeBase)
class AIKnowledgeBaseAdmin(admin.ModelAdmin):
    list_display = ['stage_type', 'week', 'theme']
    list_filter = ['stage_type']
    search_fields = ['theme', 'baby_development', 'mother_changes']
    ordering = ['stage_type', 'week']
