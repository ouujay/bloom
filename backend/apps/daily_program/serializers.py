from rest_framework import serializers
from .models import DailyContent, QuizQuestion, UserDayProgress, YouTubeLesson, VideoProgress


class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ['id', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'order']


class DailyContentSerializer(serializers.ModelSerializer):
    quiz_questions = QuizQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = DailyContent
        fields = [
            'id', 'stage_type', 'stage_week', 'day', 'title', 'theme',
            'lesson_title', 'lesson_content', 'lesson_summary', 'lesson_image',
            'read_time_minutes', 'tip_of_day',
            'task_title', 'task_description', 'task_type',
            'lesson_tokens', 'checkin_tokens', 'task_tokens', 'total_tokens',
            'is_quiz_day', 'quiz_bonus_tokens', 'quiz_questions',
        ]


class UserDayProgressSerializer(serializers.ModelSerializer):
    stage_type = serializers.CharField(source='daily_content.stage_type', read_only=True)
    stage_week = serializers.IntegerField(source='daily_content.stage_week', read_only=True)
    day = serializers.IntegerField(source='daily_content.day', read_only=True)
    title = serializers.CharField(source='daily_content.title', read_only=True)

    class Meta:
        model = UserDayProgress
        fields = [
            'id', 'stage_type', 'stage_week', 'day', 'title',
            'lesson_completed', 'checkin_completed', 'task_completed', 'quiz_completed',
            'is_completed', 'is_catchup',
            'quiz_score', 'quiz_total', 'tokens_earned',
            'started_at', 'completed_at',
        ]


class YouTubeLessonSerializer(serializers.ModelSerializer):
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)
    duration_formatted = serializers.SerializerMethodField()

    class Meta:
        model = YouTubeLesson
        fields = [
            'id', 'stage', 'stage_display', 'week', 'day',
            'youtube_id', 'title', 'description', 'duration_seconds', 'duration_formatted',
            'thumbnail_url', 'key_points', 'token_reward', 'is_active',
            'created_at', 'updated_at',
        ]

    def get_duration_formatted(self, obj):
        """Format duration as MM:SS."""
        minutes = obj.duration_seconds // 60
        seconds = obj.duration_seconds % 60
        return f"{minutes}:{seconds:02d}"


class VideoProgressSerializer(serializers.ModelSerializer):
    video_title = serializers.CharField(source='video.title', read_only=True)

    class Meta:
        model = VideoProgress
        fields = [
            'id', 'video', 'video_title',
            'started_at', 'completed_at', 'is_completed',
            'tokens_earned', 'watch_time_seconds',
        ]
