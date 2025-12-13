import uuid
from django.db import models
from django.conf import settings


class Conversation(models.Model):
    """
    Represents a conversation session with the AI.
    Can be for onboarding, adding a child, or general chat.
    """

    CONVERSATION_TYPES = [
        ('onboarding', 'Mother Onboarding'),
        ('add_child', 'Add Child'),
        ('chat', 'General Chat'),
        ('birth', 'Birth Recording'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversations'
    )
    child = models.ForeignKey(
        'children.Child',
        on_delete=models.CASCADE,
        related_name='conversations',
        null=True,
        blank=True
    )

    conversation_type = models.CharField(max_length=20, choices=CONVERSATION_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    # Parsed data extracted from conversation
    parsed_data = models.JSONField(default=dict, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.first_name}'s {self.get_conversation_type_display()} ({self.status})"

    def get_messages_for_context(self, limit=20):
        """Get recent messages formatted for LLM context."""
        messages = self.messages.order_by('-created_at')[:limit]
        return [
            {'role': msg.role, 'content': msg.content}
            for msg in reversed(list(messages))
        ]

    def mark_complete(self, parsed_data=None):
        """Mark conversation as complete."""
        from django.utils import timezone
        self.status = 'completed'
        self.completed_at = timezone.now()
        if parsed_data:
            self.parsed_data = parsed_data
        self.save()


class Message(models.Model):
    """
    Individual message in a conversation.
    """

    ROLE_CHOICES = [
        ('system', 'System'),
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()

    # Audio handling
    audio_input_url = models.URLField(max_length=500, blank=True, null=True)
    audio_output_url = models.URLField(max_length=500, blank=True, null=True)

    # If this message contains parsed/extracted data
    parsed_data = models.JSONField(default=dict, blank=True, null=True)

    # For tracking symptoms/complaints mentioned
    detected_symptoms = models.JSONField(default=list, blank=True, null=True)
    is_complaint = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        preview = self.content[:50] + '...' if len(self.content) > 50 else self.content
        return f"{self.role}: {preview}"


class AIKnowledgeBase(models.Model):
    """
    Stores curated knowledge for AI context.
    This is used to provide stage-specific information to the AI.
    """

    STAGE_TYPES = [
        ('pregnancy', 'Pregnancy'),
        ('postpartum', 'Postpartum'),
        ('baby', 'Baby'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    stage_type = models.CharField(max_length=20, choices=STAGE_TYPES)
    week = models.IntegerField()  # Week 1-40 for pregnancy, 1-104 for baby (months*4)

    # Content
    theme = models.CharField(max_length=200)
    expected_symptoms = models.JSONField(default=list)
    warning_signs = models.JSONField(default=list)
    common_questions = models.JSONField(default=list)
    recommended_actions = models.JSONField(default=list)

    # Baby development info (for pregnancy)
    baby_development = models.TextField(blank=True)

    # Mother info
    mother_changes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['stage_type', 'week']
        ordering = ['stage_type', 'week']

    def __str__(self):
        return f"{self.get_stage_type_display()} Week {self.week}: {self.theme}"
