import uuid
import secrets
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


def generate_share_code():
    """Generate a unique 8-character share code."""
    return secrets.token_urlsafe(6)[:8].upper()


def generate_passcode():
    """Generate a 6-digit passcode."""
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])


class PassportShare(models.Model):
    """
    Represents a shareable link to a child's Life Passport.
    """

    RECIPIENT_TYPES = [
        ('doctor', 'Doctor/Healthcare Provider'),
        ('family', 'Family Member'),
        ('partner', 'Partner'),
        ('other', 'Other'),
    ]

    DURATION_CHOICES = [
        ('24h', '24 Hours'),
        ('7d', '7 Days'),
        ('30d', '30 Days'),
        ('custom', 'Custom'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    child = models.ForeignKey(
        'children.Child',
        on_delete=models.CASCADE,
        related_name='passport_shares'
    )

    # Share credentials
    share_code = models.CharField(max_length=20, unique=True, default=generate_share_code)
    passcode = models.CharField(max_length=6, default=generate_passcode)

    # Recipient info
    recipient_name = models.CharField(max_length=100, blank=True)
    recipient_type = models.CharField(max_length=20, choices=RECIPIENT_TYPES, default='other')
    recipient_email = models.EmailField(blank=True, null=True)

    # Access control
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField()
    duration_type = models.CharField(max_length=10, choices=DURATION_CHOICES, default='7d')

    # Analytics
    view_count = models.IntegerField(default=0)
    last_viewed_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Share for {self.child} ({self.share_code})"

    def save(self, *args, **kwargs):
        # Calculate expiry if not set
        if not self.expires_at:
            duration_map = {
                '24h': timedelta(hours=24),
                '7d': timedelta(days=7),
                '30d': timedelta(days=30),
            }
            self.expires_at = timezone.now() + duration_map.get(self.duration_type, timedelta(days=7))

        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return self.is_active and not self.is_expired

    def verify_passcode(self, passcode):
        """Verify the passcode."""
        return self.passcode == passcode

    def record_view(self):
        """Record a view of this passport."""
        self.view_count += 1
        self.last_viewed_at = timezone.now()
        self.save(update_fields=['view_count', 'last_viewed_at'])

    def deactivate(self):
        """Deactivate this share link."""
        self.is_active = False
        self.save(update_fields=['is_active'])

    def get_share_url(self):
        """Get the full share URL."""
        # This would be configured based on frontend URL
        return f"/passport/view/{self.share_code}"


class PassportEvent(models.Model):
    """
    Events that appear on the Life Passport timeline.
    Aggregates activities from various sources.
    """

    EVENT_TYPES = [
        ('task_completed', 'Task Completed'),
        ('lesson_completed', 'Lesson Completed'),
        ('health_checkin', 'Health Check-in'),
        ('symptom_reported', 'Symptom Reported'),
        ('ai_conversation', 'AI Conversation'),
        ('appointment', 'Appointment'),
        ('milestone', 'Milestone'),
        ('birth', 'Birth'),
        ('measurement', 'Measurement'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    child = models.ForeignKey(
        'children.Child',
        on_delete=models.CASCADE,
        related_name='passport_events'
    )

    event_type = models.CharField(max_length=30, choices=EVENT_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    # Stage info at time of event
    stage_type = models.CharField(max_length=20, blank=True)  # pregnancy, postpartum, baby
    stage_week = models.IntegerField(null=True, blank=True)
    stage_day = models.IntegerField(null=True, blank=True)

    # Additional data
    data = models.JSONField(default=dict, blank=True)

    # For symptoms/concerns
    is_concern = models.BooleanField(default=False)
    severity = models.CharField(max_length=20, blank=True)  # mild, moderate, severe

    # Reference to source record
    source_type = models.CharField(max_length=50, blank=True)  # model name
    source_id = models.UUIDField(null=True, blank=True)

    # Timestamps
    event_date = models.DateField()
    event_time = models.TimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-event_date', '-created_at']

    def __str__(self):
        return f"{self.event_type}: {self.title}"


class PassportService:
    """Service for generating passport data and creating events."""

    @staticmethod
    def get_passport_data(child):
        """
        Generate complete passport data for a child.
        """
        from apps.health.models import DailyHealthLog
        from apps.daily_program.models import UserDayProgress
        from apps.ai.models import Message

        user = child.user
        stage = child.get_current_stage()

        # Get events from passport_events table (for summary stats)
        all_events = PassportEvent.objects.filter(child=child)

        # Get limited events for timeline
        events = all_events.order_by('-event_date')[:100]

        # Build timeline
        timeline = []
        for event in events:
            timeline.append({
                'id': str(event.id),
                'date': event.event_date.isoformat(),
                'time': event.event_time.isoformat() if event.event_time else None,
                'type': event.event_type,
                'title': event.title,
                'description': event.description,
                'stage': {
                    'type': event.stage_type,
                    'week': event.stage_week,
                    'day': event.stage_day,
                },
                'is_concern': event.is_concern,
                'data': event.data,
            })

        # Calculate summary stats (use all_events, not sliced events)
        summary = {
            'tasks_completed': all_events.filter(event_type='task_completed').count(),
            'lessons_completed': all_events.filter(event_type='lesson_completed').count(),
            'health_checkins': all_events.filter(event_type='health_checkin').count(),
            'concerns_reported': all_events.filter(is_concern=True).count(),
            'appointments': all_events.filter(event_type='appointment').count(),
        }

        return {
            'mother': {
                'name': user.get_full_name() or user.first_name,
                'blood_type': user.blood_type,
                'genotype': getattr(user, 'genotype', ''),
                'health_conditions': getattr(user, 'health_conditions', []),
            },
            'child': {
                'id': str(child.id),
                'name': child.name or child.nickname,
                'status': child.status,
                'birth_date': child.birth_date.isoformat() if child.birth_date else None,
                'due_date': child.due_date.isoformat() if child.due_date else None,
                'current_stage': stage,
            },
            'timeline': timeline,
            'summary': summary,
            'generated_at': timezone.now().isoformat(),
        }

    @staticmethod
    def create_event(child, event_type, title, description='', data=None, is_concern=False, event_date=None, source_type='', source_id=None):
        """Create a passport event."""
        stage = child.get_current_stage()

        return PassportEvent.objects.create(
            child=child,
            event_type=event_type,
            title=title,
            description=description,
            stage_type=stage.get('type', ''),
            stage_week=stage.get('week') or stage.get('age_weeks'),
            stage_day=stage.get('day_of_week') or stage.get('age_days'),
            data=data or {},
            is_concern=is_concern,
            source_type=source_type,
            source_id=source_id,
            event_date=event_date or timezone.now().date(),
        )
