from django.db import models
import uuid


class DailyHealthLog(models.Model):
    """Daily health check-in data for a child/pregnancy."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    child = models.ForeignKey('children.Child', on_delete=models.CASCADE, related_name='health_logs', null=True, blank=True)
    date = models.DateField()

    MOOD_CHOICES = [
        ('great', 'Great'),
        ('good', 'Good'),
        ('okay', 'Okay'),
        ('tired', 'Tired'),
        ('stressed', 'Stressed'),
        ('unwell', 'Unwell'),
    ]
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES, null=True, blank=True)

    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    blood_pressure_systolic = models.IntegerField(null=True, blank=True)
    blood_pressure_diastolic = models.IntegerField(null=True, blank=True)

    symptoms = models.JSONField(default=list, blank=True)
    baby_movement = models.CharField(max_length=50, blank=True, null=True, default='')
    notes = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['child', 'date']
        ordering = ['-date']

    @property
    def user(self):
        """Get user from child for backwards compatibility."""
        return self.child.user if self.child else None

    def __str__(self):
        child_name = self.child.name or self.child.nickname if self.child else 'Unknown'
        return f"{child_name} - {self.date}"


class KickCount(models.Model):
    """Baby kick counting sessions for a pregnancy."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    child = models.ForeignKey('children.Child', on_delete=models.CASCADE, related_name='kick_counts', null=True, blank=True)

    start_time = models.DateTimeField()
    end_time = models.DateTimeField(null=True, blank=True)
    kick_count = models.IntegerField(default=0)
    duration_minutes = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-start_time']

    @property
    def user(self):
        """Get user from child for backwards compatibility."""
        return self.child.user if self.child else None

    def __str__(self):
        child_name = self.child.name or self.child.nickname if self.child else 'Unknown'
        return f"{child_name} - {self.kick_count} kicks on {self.start_time.date()}"


class Appointment(models.Model):
    """Medical appointments for a child/pregnancy."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    child = models.ForeignKey('children.Child', on_delete=models.CASCADE, related_name='appointments', null=True, blank=True)

    title = models.CharField(max_length=200)
    appointment_type = models.CharField(max_length=50)
    date = models.DateField()
    time = models.TimeField()
    location = models.CharField(max_length=200, blank=True)
    doctor_name = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    reminder_sent = models.BooleanField(default=False)
    is_completed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'time']

    @property
    def user(self):
        """Get user from child for backwards compatibility."""
        return self.child.user if self.child else None

    def __str__(self):
        return f"{self.title} - {self.date}"


class HealthReport(models.Model):
    """AI-analyzed health reports from conversations - triaged for doctors"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Patient info
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='health_reports')
    child = models.ForeignKey('children.Child', on_delete=models.CASCADE, related_name='health_reports')

    # Timing
    created_at = models.DateTimeField(auto_now_add=True)
    pregnancy_week = models.IntegerField()

    # Report Type
    REPORT_TYPE_CHOICES = [
        ('complaint', 'Symptom Complaint'),
        ('checkin', 'Daily Check-in'),
    ]
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)

    # AI Triage
    URGENCY_CHOICES = [
        ('critical', 'Critical'),
        ('urgent', 'Urgent'),
        ('moderate', 'Moderate'),
        ('normal', 'Normal'),
    ]
    urgency_level = models.CharField(max_length=20, choices=URGENCY_CHOICES, default='normal')

    # Content
    symptoms = models.JSONField(default=list)
    ai_summary = models.TextField()
    ai_assessment = models.TextField(blank=True, default='')
    ai_recommendation = models.TextField(blank=True, default='')

    # Conversation
    conversation_id = models.UUIDField(null=True, blank=True)
    conversation_transcript = models.TextField(blank=True, default='')

    # Doctor handling
    is_addressed = models.BooleanField(default=False)
    addressed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='addressed_reports'
    )
    addressed_at = models.DateTimeField(null=True, blank=True)
    doctor_notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.first_name} - {self.urgency_level} - Week {self.pregnancy_week}"
