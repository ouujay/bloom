from django.urls import path
from . import views

urlpatterns = [
    # Authenticated endpoints (for passport owner)
    path('<uuid:child_id>/', views.get_passport, name='passport-get'),
    path('<uuid:child_id>/events/', views.get_passport_events, name='passport-events'),
    path('<uuid:child_id>/share/', views.create_share, name='passport-create-share'),
    path('<uuid:child_id>/shares/', views.list_shares, name='passport-list-shares'),
    path('<uuid:child_id>/shares/<uuid:share_id>/', views.deactivate_share, name='passport-deactivate-share'),

    # Public endpoints (for viewing shared passports)
    path('view/<str:share_code>/verify/', views.verify_share, name='passport-verify'),
    path('view/<str:share_code>/', views.view_shared_passport, name='passport-view'),
]
