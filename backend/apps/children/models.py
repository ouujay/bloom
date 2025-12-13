import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import date, timedelta


class Child(models.Model):
    """
    Represents a child being tracked - either a pregnancy or a born baby.
    Each user (mother) can have multiple children.
    """

    STATUS_CHOICES = [
        ('pregnant', 'Pregnant'),
        ('born', 'Born'),
        ('archived', 'Archived'),
    ]

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('unknown', 'Unknown'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='children'
    )

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pregnant')

    # Pregnancy fields (used when status='pregnant')
    due_date = models.DateField(null=True, blank=True)
    conception_date = models.DateField(null=True, blank=True)
    weeks_at_registration = models.IntegerField(null=True, blank=True)
    last_menstrual_period = models.DateField(null=True, blank=True)

    # Baby fields (used when status='born')
    name = models.CharField(max_length=100, blank=True, default='')
    nickname = models.CharField(max_length=50, blank=True, default='Baby')
    birth_date = models.DateField(null=True, blank=True)
    birth_weight_kg = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    birth_time = models.TimeField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='unknown')
    delivery_type = models.CharField(max_length=50, blank=True, default='')

    # Progress tracking
    current_day = models.IntegerField(default=1)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)

    # Status flags
    is_active = models.BooleanField(default=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'children'
        ordering = ['-created_at']

    def __str__(self):
        if self.status == 'pregnant':
            return f"{self.user.first_name}'s Pregnancy (Week {self.get_pregnancy_week()})"
        return f"{self.name or self.nickname} ({self.user.first_name}'s child)"

    def get_current_stage(self):
        """
        Returns the current stage information.
        For pregnancy: week and day of pregnancy
        For baby: age in months and weeks
        """
        if self.status == 'pregnant':
            week = self.get_pregnancy_week()
            day_of_week = self.get_pregnancy_day_of_week()
            total_days = self.get_total_pregnancy_days()
            return {
                'type': 'pregnancy',
                'week': week,
                'day_of_week': day_of_week,
                'total_days': total_days,
                'trimester': self.get_trimester(),
                'days_until_due': self.get_days_until_due(),
            }
        elif self.status == 'born':
            age_days = self.get_baby_age_days()
            age_weeks = age_days // 7
            age_months = self.get_baby_age_months()
            return {
                'type': 'baby',
                'age_days': age_days,
                'age_weeks': age_weeks,
                'age_months': age_months,
                'stage': self.get_baby_stage(),
            }
        return {'type': 'archived'}

    def get_pregnancy_week(self):
        """Calculate current pregnancy week based on due date."""
        if not self.due_date:
            return self.weeks_at_registration or 1

        today = date.today()
        days_until_due = (self.due_date - today).days
        current_week = 40 - (days_until_due // 7)
        return max(1, min(42, current_week))

    def get_pregnancy_day_of_week(self):
        """Get the day within the current week (1-7)."""
        if not self.due_date:
            return 1

        today = date.today()
        days_until_due = (self.due_date - today).days
        total_days = 280 - days_until_due
        return (total_days % 7) + 1

    def get_total_pregnancy_days(self):
        """Get total days since conception/LMP."""
        if not self.due_date:
            return (self.weeks_at_registration or 1) * 7

        today = date.today()
        days_until_due = (self.due_date - today).days
        return 280 - days_until_due

    def get_days_until_due(self):
        """Get days remaining until due date."""
        if not self.due_date:
            return None
        return (self.due_date - date.today()).days

    def get_trimester(self):
        """Get current trimester (1, 2, or 3)."""
        week = self.get_pregnancy_week()
        if week <= 13:
            return 1
        elif week <= 27:
            return 2
        return 3

    def get_baby_age_days(self):
        """Get baby's age in days since birth."""
        if not self.birth_date:
            return 0
        return (date.today() - self.birth_date).days

    def get_baby_age_months(self):
        """Get baby's age in months."""
        if not self.birth_date:
            return 0

        today = date.today()
        months = (today.year - self.birth_date.year) * 12
        months += today.month - self.birth_date.month

        if today.day < self.birth_date.day:
            months -= 1

        return max(0, months)

    def get_baby_stage(self):
        """Get the baby's developmental stage."""
        months = self.get_baby_age_months()

        if months < 1:
            return 'newborn'
        elif months < 3:
            return 'early_infant'
        elif months < 6:
            return 'infant'
        elif months < 12:
            return 'older_infant'
        elif months < 18:
            return 'young_toddler'
        elif months < 24:
            return 'toddler'
        else:
            return 'graduated'

    def is_near_due_date(self):
        """Check if pregnancy is at or past week 37."""
        return self.status == 'pregnant' and self.get_pregnancy_week() >= 37

    def transition_to_born(self, birth_date, name=None, weight=None, gender=None, delivery_type=None, birth_time=None):
        """Transition from pregnancy to born status."""
        self.status = 'born'
        self.birth_date = birth_date
        if name:
            self.name = name
        if weight:
            self.birth_weight_kg = weight
        if gender:
            self.gender = gender
        if delivery_type:
            self.delivery_type = delivery_type
        if birth_time:
            self.birth_time = birth_time

        self.current_day = 1
        self.save()

    def check_and_archive(self):
        """Archive child if baby is 2+ years old."""
        if self.status == 'born' and self.get_baby_age_months() >= 24:
            self.status = 'archived'
            self.is_active = False
            self.save()
            return True
        return False
