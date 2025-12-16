from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from django.utils import timezone
from apps.children.models import Child
from apps.tokens.services import TokenService
from apps.passport.models import PassportEvent
from .models import DailyContent, UserDayProgress, YouTubeLesson, VideoProgress
from .serializers import DailyContentSerializer, UserDayProgressSerializer, YouTubeLessonSerializer, VideoProgressSerializer
from .services import DailyProgramService


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_today(request, child_id):
    """Get today's program for a child."""
    child = get_object_or_404(Child, id=child_id, user=request.user)
    result = DailyProgramService.get_today_program(child)

    if not result:
        return Response({
            'success': False,
            'message': 'No content available for today'
        }, status=status.HTTP_404_NOT_FOUND)

    missed = DailyProgramService.get_missed_days(child)
    stage = result.get('stage', {})

    # Get today's video task based on week and day
    current_week = stage.get('week', 1) if stage else 1
    current_day = result['content'].day

    # Find a video for today (check for exact week+day match first, then week match)
    daily_video = YouTubeLesson.objects.filter(
        stage=result['content'].stage_type,
        week=current_week,
        day=current_day,
        is_active=True
    ).first()

    # Fallback: get any video from this week
    if not daily_video:
        daily_video = YouTubeLesson.objects.filter(
            stage=result['content'].stage_type,
            week=current_week,
            is_active=True
        ).first()

    # Fallback: get closest week's video
    if not daily_video:
        daily_video = YouTubeLesson.objects.filter(
            stage=result['content'].stage_type,
            week__lte=current_week,
            is_active=True
        ).order_by('-week').first()

    # Check if video has been completed (which marks task as done)
    video_completed = False
    video_data = None
    if daily_video:
        video_progress = VideoProgress.objects.filter(
            user=request.user,
            video=daily_video
        ).first()
        video_completed = video_progress.is_completed if video_progress else False
        # Use hqdefault thumbnail (always available) if thumbnail_url uses maxresdefault
        thumbnail = daily_video.thumbnail_url
        if thumbnail and 'maxresdefault' in thumbnail:
            thumbnail = thumbnail.replace('maxresdefault', 'hqdefault')
        elif not thumbnail:
            thumbnail = f"https://i.ytimg.com/vi/{daily_video.youtube_id}/hqdefault.jpg"
        video_data = {
            'id': str(daily_video.id),
            'youtube_id': daily_video.youtube_id,
            'title': daily_video.title,
            'description': daily_video.description,
            'duration_seconds': daily_video.duration_seconds,
            'thumbnail_url': thumbnail,
            'key_points': daily_video.key_points,
            'token_reward': daily_video.token_reward,
            'is_completed': video_completed,
        }

    # Task is now watching the daily video
    task_title = f"Watch: {daily_video.title}" if daily_video else result['content'].task_title
    task_description = daily_video.description if daily_video else result['content'].task_description
    task_completed = video_completed if daily_video else result['progress'].task_completed
    task_tokens = daily_video.token_reward if daily_video else result['content'].task_tokens

    return Response({
        'success': True,
        'data': {
            'id': str(result['progress'].id),
            'stage_type': result['content'].stage_type,
            'stage_week': result['content'].stage_week,
            'day_number': result['content'].day,
            'title': result['content'].title,
            'lesson': {
                'title': result['content'].lesson_title,
                'content': result['content'].lesson_content,
                'tips': [result['content'].tip_of_day] if result['content'].tip_of_day else [],
            },
            'tasks': [{
                'id': str(daily_video.id) if daily_video else 'task-1',
                'title': task_title,
                'description': task_description,
                'completed': task_completed,
                'tokens': task_tokens,
                'type': 'video' if daily_video else 'general',
                'video': video_data,
            }],
            'daily_video': video_data,
            'lesson_completed': result['progress'].lesson_completed,
            'checkin_completed': result['progress'].checkin_completed,
            'task_completed': task_completed,
            'is_complete': result['progress'].is_completed,
            'has_missed_days': missed.exists(),
            'missed_count': missed.count(),
            'streak': child.current_streak,
            'child_stage': stage,
            'is_fallback_content': result.get('is_fallback', False),
            'user_week': stage.get('week') if stage else None,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_day(request, child_id, stage_type, stage_week, day):
    """Get specific day's content for a child."""
    child = get_object_or_404(Child, id=child_id, user=request.user)

    try:
        content = DailyContent.objects.get(
            stage_type=stage_type,
            stage_week=stage_week,
            day=day
        )
    except DailyContent.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Day not found'
        }, status=status.HTTP_404_NOT_FOUND)

    progress, _ = UserDayProgress.objects.get_or_create(
        child=child,
        daily_content=content
    )

    # Check if this day is accessible based on child's current progress
    child_stage = child.get_current_stage()
    is_accessible = False
    is_current = False

    if child_stage:
        current_type = child_stage['type']
        current_week = child_stage['week']
        current_day = child.current_day % 7 or 7

        if stage_type == current_type:
            if stage_week < current_week:
                is_accessible = True
            elif stage_week == current_week and day <= current_day:
                is_accessible = True
                is_current = (day == current_day)

    return Response({
        'success': True,
        'data': {
            'id': str(progress.id),
            'stage_type': content.stage_type,
            'stage_week': content.stage_week,
            'day_number': content.day,
            'title': content.title,
            'lesson': {
                'title': content.lesson_title,
                'content': content.lesson_content,
                'tips': [content.tip_of_day] if content.tip_of_day else [],
            },
            'tasks': [{
                'id': 'task-1',
                'title': content.task_title,
                'description': content.task_description,
                'completed': progress.task_completed,
                'tokens': content.task_tokens,
            }],
            'lesson_completed': progress.lesson_completed,
            'checkin_completed': progress.checkin_completed,
            'is_complete': progress.is_completed,
            'is_accessible': is_accessible,
            'is_current': is_current,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_lesson(request, child_id, progress_id):
    """Mark lesson as complete."""
    child = get_object_or_404(Child, id=child_id, user=request.user)

    try:
        progress = UserDayProgress.objects.get(
            id=progress_id,
            child=child
        )
    except UserDayProgress.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Progress not found'
        }, status=status.HTTP_404_NOT_FOUND)

    is_catchup = request.data.get('is_catchup', False)
    progress = DailyProgramService.complete_lesson(child, progress, is_catchup)

    return Response({
        'success': True,
        'data': {
            'progress': UserDayProgressSerializer(progress).data,
            'new_balance': request.user.token_balance,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_checkin(request, child_id, progress_id):
    """Submit daily health check-in."""
    child = get_object_or_404(Child, id=child_id, user=request.user)

    try:
        progress = UserDayProgress.objects.get(
            id=progress_id,
            child=child
        )
    except UserDayProgress.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Progress not found'
        }, status=status.HTTP_404_NOT_FOUND)

    is_catchup = request.data.get('is_catchup', False)
    health_data = {
        'mood': request.data.get('mood'),
        'weight': request.data.get('weight'),
        'bp_systolic': request.data.get('bp_systolic'),
        'bp_diastolic': request.data.get('bp_diastolic'),
        'symptoms': request.data.get('symptoms', []),
        'baby_movement': request.data.get('baby_movement'),
        'notes': request.data.get('notes', ''),
    }

    progress = DailyProgramService.complete_checkin(
        child, progress, health_data, is_catchup
    )

    return Response({
        'success': True,
        'data': {
            'progress': UserDayProgressSerializer(progress).data,
            'new_balance': request.user.token_balance,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_task(request, child_id, progress_id):
    """Mark daily task as complete."""
    child = get_object_or_404(Child, id=child_id, user=request.user)

    try:
        progress = UserDayProgress.objects.get(
            id=progress_id,
            child=child
        )
    except UserDayProgress.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Progress not found'
        }, status=status.HTTP_404_NOT_FOUND)

    progress = DailyProgramService.complete_task(child, progress)

    return Response({
        'success': True,
        'data': {
            'progress': UserDayProgressSerializer(progress).data,
            'new_balance': request.user.token_balance,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_missed_days(request, child_id):
    """Get days that need catch-up."""
    child = get_object_or_404(Child, id=child_id, user=request.user)
    missed = DailyProgramService.get_missed_days(child)

    return Response({
        'success': True,
        'data': {
            'missed_days': [
                {
                    'progress': UserDayProgressSerializer(p).data,
                    'content': DailyContentSerializer(p.daily_content).data,
                }
                for p in missed
            ],
            'count': missed.count(),
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_progress(request, child_id):
    """Get child's overall progress."""
    child = get_object_or_404(Child, id=child_id, user=request.user)
    user = request.user
    stage = child.get_current_stage()

    total_completed = UserDayProgress.objects.filter(
        child=child,
        is_completed=True
    ).count()

    # Calculate total available days for this stage type
    stage_type = stage['type'] if stage else 'pregnancy'
    total_days = DailyContent.objects.filter(stage_type=stage_type).count()
    overall_pct = int((total_completed / total_days) * 100) if total_days > 0 else 0

    # Week progress
    current_week = stage['week'] if stage else 1
    week_days = UserDayProgress.objects.filter(
        child=child,
        daily_content__stage_type=stage_type,
        daily_content__stage_week=current_week
    )
    week_completed = week_days.filter(is_completed=True).count()
    week_total = week_days.count() or 7
    week_pct = int((week_completed / week_total) * 100)

    return Response({
        'success': True,
        'data': {
            'stage_type': stage_type,
            'current_week': current_week,
            'current_day': child.current_day,
            'current_streak': child.current_streak,
            'streak': child.current_streak,
            'longest_streak': child.longest_streak,
            'days_completed': total_completed,
            'lessons_completed': total_completed,
            'tasks_completed': UserDayProgress.objects.filter(child=child, task_completed=True).count(),
            'checkins_completed': UserDayProgress.objects.filter(child=child, checkin_completed=True).count(),
            'total_tokens_earned': user.total_tokens_earned,
            'tokens_earned': user.total_tokens_earned,
            'token_balance': user.token_balance,
            'overall_percentage': overall_pct,
            'week_percentage': week_pct,
            'total_days': total_days,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_week_progress(request, child_id, stage_type, stage_week):
    """Get progress for specific week."""
    child = get_object_or_404(Child, id=child_id, user=request.user)
    days = DailyContent.objects.filter(
        stage_type=stage_type,
        stage_week=stage_week
    ).order_by('day')

    progress_list = []
    for day_content in days:
        progress, _ = UserDayProgress.objects.get_or_create(
            child=child,
            daily_content=day_content
        )
        progress_list.append({
            'day': day_content.day,
            'title': day_content.title,
            'is_completed': progress.is_completed,
            'tokens_earned': progress.tokens_earned,
        })

    return Response({
        'success': True,
        'data': {
            'stage_type': stage_type,
            'stage_week': stage_week,
            'days': progress_list,
            'completed_count': sum(1 for p in progress_list if p['is_completed']),
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_quiz(request, child_id, stage_type, stage_week):
    """Submit weekly quiz."""
    child = get_object_or_404(Child, id=child_id, user=request.user)

    try:
        content = DailyContent.objects.get(
            stage_type=stage_type,
            stage_week=stage_week,
            day=7,
            is_quiz_day=True
        )
    except DailyContent.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Quiz not found for this week'
        }, status=status.HTTP_404_NOT_FOUND)

    progress, _ = UserDayProgress.objects.get_or_create(
        child=child,
        daily_content=content
    )

    answers = request.data.get('answers', {})
    progress = DailyProgramService.submit_quiz(child, progress, answers)

    return Response({
        'success': True,
        'data': {
            'progress': UserDayProgressSerializer(progress).data,
            'score': progress.quiz_score,
            'total': progress.quiz_total,
            'new_balance': request.user.token_balance,
        }
    })


# YouTube Video Endpoints

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_videos(request, child_id):
    """Get available videos for a child based on their stage."""
    child = get_object_or_404(Child, id=child_id, user=request.user)
    stage = child.get_current_stage()

    if not stage:
        return Response({
            'success': False,
            'message': 'Unable to determine child stage'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Get videos for current stage and week
    videos = YouTubeLesson.objects.filter(
        stage=stage['type'],
        week__lte=stage['week'],
        is_active=True
    )

    # Get user's progress for these videos
    video_data = []
    for video in videos:
        progress = VideoProgress.objects.filter(
            user=request.user,
            video=video
        ).first()

        video_data.append({
            'video': YouTubeLessonSerializer(video).data,
            'progress': VideoProgressSerializer(progress).data if progress else None,
            'is_completed': progress.is_completed if progress else False,
        })

    return Response({
        'success': True,
        'data': video_data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_video(request, video_id):
    """Get a specific video and user's progress."""
    video = get_object_or_404(YouTubeLesson, id=video_id, is_active=True)

    progress, created = VideoProgress.objects.get_or_create(
        user=request.user,
        video=video
    )

    return Response({
        'success': True,
        'data': {
            'video': YouTubeLessonSerializer(video).data,
            'progress': VideoProgressSerializer(progress).data,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_video(request, video_id):
    """Mark a video as completed and award tokens. Also marks daily task as complete."""
    video = get_object_or_404(YouTubeLesson, id=video_id, is_active=True)

    progress, created = VideoProgress.objects.get_or_create(
        user=request.user,
        video=video
    )

    if progress.is_completed:
        return Response({
            'success': False,
            'message': 'Video already completed'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Mark as completed
    progress.is_completed = True
    progress.completed_at = timezone.now()
    progress.tokens_earned = video.token_reward
    progress.save()

    # Award tokens
    TokenService.award_tokens(
        user=request.user,
        amount=video.token_reward,
        source='daily_task',
        reference_id=str(video.id),
        reference_type='youtube_lesson',
        description=f"Watched: {video.title}"
    )

    # Log to passport and mark task as complete
    child_id = request.data.get('child_id')
    child = None
    if child_id:
        child = Child.objects.filter(id=child_id, user=request.user).first()
    if not child:
        child = request.user.children.first()

    task_completed = False
    day_progress_data = None

    if child:
        # Mark the current day's task as complete
        result = DailyProgramService.get_today_program(child)
        if result:
            day_progress = result['progress']
            if not day_progress.task_completed:
                day_progress.task_completed = True
                day_progress.check_completion()
                day_progress.save()

                if day_progress.is_completed:
                    DailyProgramService._on_day_completed(child, day_progress)

                task_completed = True
                day_progress_data = UserDayProgressSerializer(day_progress).data

        # Log to passport
        PassportEvent.objects.create(
            child=child,
            event_type='lesson_completed',
            title=f'Watched: {video.title}',
            data={'video_id': str(video.id), 'tokens': video.token_reward}
        )

    return Response({
        'success': True,
        'data': {
            'progress': VideoProgressSerializer(progress).data,
            'tokens_earned': video.token_reward,
            'new_balance': request.user.token_balance,
            'task_completed': task_completed,
            'day_progress': day_progress_data,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_video_progress(request, video_id):
    """Update watch progress for a video (optional tracking)."""
    video = get_object_or_404(YouTubeLesson, id=video_id, is_active=True)

    progress, created = VideoProgress.objects.get_or_create(
        user=request.user,
        video=video
    )

    watch_time = request.data.get('watch_time_seconds', 0)
    if watch_time > progress.watch_time_seconds:
        progress.watch_time_seconds = watch_time
        progress.save()

    return Response({
        'success': True,
        'data': {
            'progress': VideoProgressSerializer(progress).data,
        }
    })
