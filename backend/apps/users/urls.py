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
]
