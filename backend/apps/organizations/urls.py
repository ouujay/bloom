from django.urls import path
from . import views

urlpatterns = [
    # Organization management
    path('signup/', views.organization_signup, name='org_signup'),
    path('me/', views.organization_me, name='org_me'),
    path('stats/', views.organization_stats, name='org_stats'),

    # Staff management
    path('staff/', views.staff_list, name='staff_list'),
    path('staff/invite/', views.staff_invite, name='staff_invite'),
    path('staff/invitations/', views.staff_invitations, name='staff_invitations'),
    path('staff/join/', views.staff_join, name='staff_join'),
    path('staff/<uuid:member_id>/', views.staff_remove, name='staff_remove'),

    # Patient management
    path('patients/', views.patients_list, name='patients_list'),
    path('patients/invite/', views.patients_invite, name='patients_invite'),
    path('patients/<uuid:patient_id>/', views.patient_detail, name='patient_detail'),
    path('patients/<uuid:patient_id>/reports/', views.patient_reports, name='patient_reports'),
    path('patients/<uuid:patient_id>/timeline/', views.patient_timeline, name='patient_timeline'),
    path('patients/<uuid:patient_id>/disconnect/', views.patient_disconnect, name='patient_disconnect'),

    # Patient invitations
    path('invitations/', views.patient_invitations, name='patient_invitations'),
    path('invitations/<uuid:invitation_id>/', views.patient_invitation_cancel, name='patient_invitation_cancel'),

    # All reports for organization
    path('reports/', views.organization_reports, name='org_reports'),
]
