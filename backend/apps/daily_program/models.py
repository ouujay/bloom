from django.db import models
import uuid


class DailyContent(models.Model):
    """Content for each day of the program, curated by stage."""
    STAGE_TYPES = [
        ('pregnancy', 'Pregnancy'),
        ('postpartum', 'Postpartum'),
        ('baby', 'Baby'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    stage_type = models.CharField(max_length=20, choices=STAGE_TYPES, default='pregnancy')
    stage_week = models.IntegerField(default=1)  # Week 1-40 for pregnancy, 1-104 for baby
    day = models.IntegerField(default=1)

    title = models.CharField(max_length=200)
    theme = models.CharField(max_length=50)

    lesson_title = models.CharField(max_length=200)
    lesson_content = models.TextField()
    lesson_summary = models.TextField(blank=True)
    lesson_image = models.URLField(blank=True)
    read_time_minutes = models.IntegerField(default=2)

    tip_of_day = models.TextField()

    task_title = models.CharField(max_length=200)
    task_description = models.TextField()
    task_type = models.CharField(max_length=50)

    lesson_tokens = models.IntegerField(default=5)
    checkin_tokens = models.IntegerField(default=5)
    task_tokens = models.IntegerField(default=5)
    total_tokens = models.IntegerField(default=15)
    catchup_tokens = models.IntegerField(default=10)

    is_quiz_day = models.BooleanField(default=False)
    quiz_bonus_tokens = models.IntegerField(default=25)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['stage_type', 'stage_week', 'day']
        ordering = ['stage_type', 'stage_week', 'day']

    def __str__(self):
        return f"{self.get_stage_type_display()} Week {self.stage_week} Day {self.day}: {self.title}"


class QuizQuestion(models.Model):
    """Quiz questions for day 7 of each week"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    daily_content = models.ForeignKey(DailyContent, on_delete=models.CASCADE, related_name='quiz_questions')

    question = models.TextField()
    option_a = models.CharField(max_length=200)
    option_b = models.CharField(max_length=200)
    option_c = models.CharField(max_length=200)
    option_d = models.CharField(max_length=200)
    correct_answer = models.CharField(max_length=1)

    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']


class UserDayProgress(models.Model):
    """Tracks child's progress on each day."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    child = models.ForeignKey('children.Child', on_delete=models.CASCADE, related_name='day_progress', null=True, blank=True)
    daily_content = models.ForeignKey(DailyContent, on_delete=models.CASCADE)

    lesson_completed = models.BooleanField(default=False)
    checkin_completed = models.BooleanField(default=False)
    task_completed = models.BooleanField(default=False)
    quiz_completed = models.BooleanField(default=False)

    is_completed = models.BooleanField(default=False)
    is_catchup = models.BooleanField(default=False)

    quiz_score = models.IntegerField(null=True, blank=True)
    quiz_total = models.IntegerField(null=True, blank=True)

    tokens_earned = models.IntegerField(default=0)

    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['child', 'daily_content']

    @property
    def user(self):
        """Get user from child for backwards compatibility."""
        return self.child.user if self.child else None

    def check_completion(self):
        """Check if all required tasks are done"""
        if self.daily_content.is_quiz_day:
            self.is_completed = self.lesson_completed and self.checkin_completed and self.quiz_completed
        else:
            self.is_completed = self.lesson_completed and self.checkin_completed and self.task_completed
        return self.is_completed


class YouTubeLesson(models.Model):
    """YouTube video lessons for the daily program."""
    STAGE_CHOICES = [
        ('pregnancy', 'Pregnancy'),
        ('postpartum', 'Postpartum'),
        ('infant', 'Infant'),
        ('toddler', 'Toddler'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # When to show
    stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='pregnancy')
    week = models.IntegerField()
    day = models.IntegerField(null=True, blank=True)

    # Video info
    youtube_id = models.CharField(max_length=20)
    title = models.CharField(max_length=200)
    description = models.TextField()
    duration_seconds = models.IntegerField()
    thumbnail_url = models.URLField(blank=True)

    # Content
    key_points = models.JSONField(default=list)

    # Rewards
    token_reward = models.IntegerField(default=50)

    # Status
    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['stage', 'week', 'day']

    def __str__(self):
        return f"{self.get_stage_display()} Week {self.week}: {self.title}"


class VideoProgress(models.Model):
    """Tracks user's progress on YouTube lessons."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='video_progress')
    video = models.ForeignKey(YouTubeLesson, on_delete=models.CASCADE, related_name='progress')

    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    tokens_earned = models.IntegerField(default=0)

    # Optional: track watch progress
    watch_time_seconds = models.IntegerField(default=0)

    class Meta:
        unique_together = ['user', 'video']

    def __str__(self):
        status = "Completed" if self.is_completed else "In Progress"
        return f"{self.user.email} - {self.video.title} ({status})"
