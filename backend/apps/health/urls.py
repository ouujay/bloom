from django.urls import path
from . import views

urlpatterns = [
    # Health logs - with or without child filter
    path('logs/', views.health_logs),
    path('logs/today/', views.today_log),
    path('logs/<uuid:log_id>/', views.health_log_detail),
    path('<uuid:child_id>/logs/', views.health_logs),
    path('<uuid:child_id>/logs/today/', views.today_log),

    # Kick counting
    path('kicks/', views.kick_counts),
    path('kicks/<uuid:kick_id>/', views.update_kick_count),
    path('kicks/<uuid:kick_id>/kick/', views.update_kick_count),  # POST to add single kick
    path('<uuid:child_id>/kicks/', views.kick_counts),

    # Appointments
    path('appointments/', views.appointments),
    path('appointments/<uuid:appointment_id>/', views.appointment_detail),
    path('<uuid:child_id>/appointments/', views.appointments),

    # Doctor portal routes
    path('doctor/stats/', views.doctor_dashboard_stats, name='doctor_stats'),
    path('doctor/reports/', views.doctor_reports_list, name='doctor_reports'),
    path('doctor/reports/<uuid:report_id>/', views.doctor_report_detail, name='doctor_report_detail'),
    path('doctor/reports/<uuid:report_id>/address/', views.address_report, name='address_report'),
    path('doctor/signup/', views.doctor_signup, name='doctor_signup'),
    path('doctor/verify/<uuid:user_id>/', views.verify_doctor, name='verify_doctor'),
]
