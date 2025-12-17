from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup),
    path('login/', views.login),
    path('me/', views.me),
    path('profile/', views.me),
    path('onboarding/', views.complete_onboarding),
    path('admin/stats/', views.admin_stats),
    path('admin/users/', views.admin_users),

    # Organization invitations (mother-side)
    path('org-invitations/', views.org_invitations_list),
    path('org-invitations/<uuid:invitation_id>/accept/', views.org_invitation_accept),
    path('org-invitations/<uuid:invitation_id>/decline/', views.org_invitation_decline),
    path('connected-orgs/', views.connected_orgs_list),
    path('connected-orgs/<uuid:connection_id>/', views.connected_org_disconnect),
    path('connected-orgs/<uuid:connection_id>/children/', views.connected_org_update_children),
]
