from django.utils import timezone
from .models import DailyContent, UserDayProgress
from apps.tokens.services import TokenService


class DailyProgramService:

    @staticmethod
    def get_today_program(child):
        """Get the current day's program for a child based on their stage."""
        stage = child.get_current_stage()
        if not stage:
            return None

        stage_type = stage['type']
        stage_week = stage['week']
        day = child.current_day % 7 or 7  # Day 1-7 in week

        content = None

        # Try exact match first
        try:
            content = DailyContent.objects.get(
                stage_type=stage_type,
                stage_week=stage_week,
                day=day
            )
        except DailyContent.DoesNotExist:
            # Fallback 1: try any day from this week
            content = DailyContent.objects.filter(
                stage_type=stage_type,
                stage_week=stage_week
            ).first()

        # Fallback 2: get the closest available week's content
        if not content:
            # Try to find the highest week that has content (for users past available content)
            content = DailyContent.objects.filter(
                stage_type=stage_type,
                stage_week__lte=stage_week,
                day=day
            ).order_by('-stage_week').first()

        # Fallback 3: get any content from the closest lower week
        if not content:
            content = DailyContent.objects.filter(
                stage_type=stage_type,
                stage_week__lte=stage_week
            ).order_by('-stage_week', '-day').first()

        # Fallback 4: get the very first content available for this stage
        if not content:
            content = DailyContent.objects.filter(
                stage_type=stage_type
            ).order_by('stage_week', 'day').first()

        # Final fallback: no content exists at all
        if not content:
            return None

        progress, _ = UserDayProgress.objects.get_or_create(
            child=child,
            daily_content=content
        )

        return {
            'content': content,
            'progress': progress,
            'is_today': True,
            'stage': stage,
            'is_fallback': content.stage_week != stage_week,  # Flag if using fallback content
        }

    @staticmethod
    def get_missed_days(child):
        """Get days child missed that need catch-up."""
        stage = child.get_current_stage()
        if not stage:
            return UserDayProgress.objects.none()

        missed = UserDayProgress.objects.filter(
            child=child,
            is_completed=False,
        ).select_related('daily_content').order_by(
            'daily_content__stage_week',
            'daily_content__day'
        )

        return missed

    @staticmethod
    def complete_lesson(child, day_progress, is_catchup=False):
        """Mark lesson as complete and award tokens."""
        user = child.user

        if day_progress.lesson_completed:
            return day_progress

        day_progress.lesson_completed = True

        tokens = day_progress.daily_content.lesson_tokens
        if is_catchup:
            tokens = min(tokens, day_progress.daily_content.catchup_tokens // 2)

        TokenService.award_tokens(
            user=user,
            amount=tokens,
            source='daily_lesson',
            reference_id=day_progress.id,
            reference_type='day_progress',
            description=f"Completed: {day_progress.daily_content.title}"
        )

        day_progress.tokens_earned += tokens
        day_progress.check_completion()
        day_progress.save()

        if day_progress.is_completed:
            DailyProgramService._on_day_completed(child, day_progress)

        return day_progress

    @staticmethod
    def complete_checkin(child, day_progress, health_data, is_catchup=False):
        """Complete health check-in for the day."""
        from apps.health.models import DailyHealthLog
        user = child.user

        if day_progress.checkin_completed:
            return day_progress

        DailyHealthLog.objects.update_or_create(
            child=child,
            date=timezone.now().date(),
            defaults={
                'mood': health_data.get('mood'),
                'weight_kg': health_data.get('weight'),
                'blood_pressure_systolic': health_data.get('bp_systolic'),
                'blood_pressure_diastolic': health_data.get('bp_diastolic'),
                'symptoms': health_data.get('symptoms', []),
                'baby_movement': health_data.get('baby_movement', ''),
                'notes': health_data.get('notes', ''),
            }
        )

        day_progress.checkin_completed = True

        tokens = day_progress.daily_content.checkin_tokens
        if is_catchup:
            tokens = min(tokens, day_progress.daily_content.catchup_tokens // 2)

        TokenService.award_tokens(
            user=user,
            amount=tokens,
            source='daily_checkin',
            reference_id=day_progress.id,
            reference_type='day_progress',
            description="Daily health check-in"
        )

        day_progress.tokens_earned += tokens
        day_progress.check_completion()
        day_progress.save()

        if day_progress.is_completed:
            DailyProgramService._on_day_completed(child, day_progress)

        return day_progress

    @staticmethod
    def complete_task(child, day_progress):
        """Mark daily task as complete."""
        user = child.user

        if day_progress.task_completed:
            return day_progress

        day_progress.task_completed = True

        tokens = day_progress.daily_content.task_tokens
        TokenService.award_tokens(
            user=user,
            amount=tokens,
            source='daily_task',
            reference_id=day_progress.id,
            reference_type='day_progress',
            description=f"Task: {day_progress.daily_content.task_title}"
        )

        day_progress.tokens_earned += tokens
        day_progress.check_completion()
        day_progress.save()

        if day_progress.is_completed:
            DailyProgramService._on_day_completed(child, day_progress)

        return day_progress

    @staticmethod
    def submit_quiz(child, day_progress, answers):
        """Submit weekly quiz answers."""
        user = child.user

        if not day_progress.daily_content.is_quiz_day:
            raise ValueError("This day does not have a quiz")

        if day_progress.quiz_completed:
            return day_progress

        questions = day_progress.daily_content.quiz_questions.all()
        correct = 0
        total = questions.count()

        for q in questions:
            if answers.get(str(q.id)) == q.correct_answer:
                correct += 1

        day_progress.quiz_completed = True
        day_progress.quiz_score = correct
        day_progress.quiz_total = total

        bonus_tokens = day_progress.daily_content.quiz_bonus_tokens
        earned_bonus = int((correct / total) * bonus_tokens) if total > 0 else 0

        TokenService.award_tokens(
            user=user,
            amount=earned_bonus,
            source='weekly_quiz',
            reference_id=day_progress.id,
            reference_type='day_progress',
            description=f"Weekly quiz: {correct}/{total} correct"
        )

        day_progress.tokens_earned += earned_bonus
        day_progress.check_completion()
        day_progress.save()

        if day_progress.is_completed:
            DailyProgramService._on_day_completed(child, day_progress)

        return day_progress

    @staticmethod
    def _on_day_completed(child, day_progress):
        """Called when a day is fully completed."""
        day_progress.completed_at = timezone.now()
        day_progress.save()

        # Update child's streak
        child.current_streak += 1
        if child.current_streak > child.longest_streak:
            child.longest_streak = child.current_streak

        DailyProgramService._check_streak_bonus(child)

        # Advance to next day
        child.current_day += 1
        child.save()

    @staticmethod
    def _check_streak_bonus(child):
        """Check and award streak bonuses."""
        from apps.tokens.models import StreakBonus
        user = child.user

        streak_rewards = {
            7: 20,
            14: 50,
            30: 100,
            60: 200,
        }

        for streak_days, tokens in streak_rewards.items():
            if child.current_streak >= streak_days:
                bonus, created = StreakBonus.objects.get_or_create(
                    user=user,
                    streak_days=streak_days,
                    defaults={'tokens_awarded': tokens}
                )

                if created:
                    TokenService.award_tokens(
                        user=user,
                        amount=tokens,
                        source='streak_bonus',
                        description=f"{streak_days}-day streak bonus!"
                    )
