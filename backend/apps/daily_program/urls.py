from django.urls import path
from . import views

urlpatterns = [
    # Today's program for a child
    path('<uuid:child_id>/today/', views.get_today),

    # Get specific day content
    path('<uuid:child_id>/<str:stage_type>/<int:stage_week>/day/<int:day>/', views.get_day),

    # Complete activities
    path('<uuid:child_id>/<uuid:progress_id>/complete-lesson/', views.complete_lesson),
    path('<uuid:child_id>/<uuid:progress_id>/complete-task/', views.complete_task),
    path('<uuid:child_id>/<uuid:progress_id>/checkin/', views.complete_checkin),

    # Progress tracking
    path('<uuid:child_id>/missed/', views.get_missed_days),
    path('<uuid:child_id>/progress/', views.get_progress),
    path('<uuid:child_id>/<str:stage_type>/<int:stage_week>/progress/', views.get_week_progress),

    # Quiz
    path('<uuid:child_id>/<str:stage_type>/<int:stage_week>/quiz/', views.submit_quiz),

    # YouTube Videos
    path('<uuid:child_id>/videos/', views.get_videos),
    path('videos/<uuid:video_id>/', views.get_video),
    path('videos/<uuid:video_id>/complete/', views.complete_video),
    path('videos/<uuid:video_id>/progress/', views.update_video_progress),
]
