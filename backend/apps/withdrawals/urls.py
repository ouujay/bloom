from django.urls import path
from . import views

urlpatterns = [
    path('', views.withdrawals),
    path('rate/', views.conversion_rate),
    path('<uuid:withdrawal_id>/', views.withdrawal_detail),
    path('admin/', views.admin_withdrawals),
    path('admin/<uuid:withdrawal_id>/process/', views.admin_process_withdrawal),
    path('admin/<uuid:withdrawal_id>/complete/', views.admin_complete_withdrawal),
]
