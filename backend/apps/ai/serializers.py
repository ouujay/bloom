from rest_framework import serializers
from .models import Conversation, Message, AIKnowledgeBase


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model."""

    class Meta:
        model = Message
        fields = [
            'id',
            'role',
            'content',
            'audio_input_url',
            'audio_output_url',
            'parsed_data',
            'detected_symptoms',
            'is_complaint',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for Conversation model."""

    messages = MessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id',
            'conversation_type',
            'status',
            'child',
            'parsed_data',
            'messages',
            'message_count',
            'created_at',
            'updated_at',
            'completed_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'completed_at']

    def get_message_count(self, obj):
        return obj.messages.count()


class ConversationCreateSerializer(serializers.Serializer):
    """Serializer for creating a new conversation."""

    conversation_type = serializers.ChoiceField(
        choices=['onboarding', 'add_child', 'chat', 'birth']
    )
    child_id = serializers.UUIDField(required=False, allow_null=True)


class ChatMessageSerializer(serializers.Serializer):
    """Serializer for sending a chat message."""

    conversation_id = serializers.UUIDField()
    message = serializers.CharField(required=False, allow_blank=True)
    # Audio will be handled as a file upload


class AIKnowledgeBaseSerializer(serializers.ModelSerializer):
    """Serializer for AI knowledge base entries."""

    class Meta:
        model = AIKnowledgeBase
        fields = [
            'id',
            'stage_type',
            'week',
            'theme',
            'expected_symptoms',
            'warning_signs',
            'common_questions',
            'recommended_actions',
            'baby_development',
            'mother_changes',
        ]
