from django.urls import path
from . import views

urlpatterns = [
    # ===== PUBLIC =====
    path('pool/', views.pool_info),
    path('donations/recent/', views.recent_donations),
    path('donations/create/', views.create_donation),

    # ===== USER =====
    path('wallet/', views.my_wallet),
    path('transactions/', views.my_transactions),
    path('withdraw/', views.request_withdrawal),
    path('withdrawals/', views.my_withdrawals),

    # ===== ADMIN =====
    path('admin/donations/pending/', views.admin_pending_donations),
    path('admin/donations/<uuid:donation_id>/confirm/', views.confirm_donation),
    path('admin/withdrawals/pending/', views.admin_pending_withdrawals),
    path('admin/withdrawals/<uuid:withdrawal_id>/approve/', views.admin_approve_withdrawal),
    path('admin/withdrawals/<uuid:withdrawal_id>/reject/', views.admin_reject_withdrawal),
    path('admin/withdrawals/<uuid:withdrawal_id>/paid/', views.admin_mark_paid),
    path('admin/stats/', views.admin_pool_stats),

    # ===== LEGACY (backward compatibility) =====
    path('balance/', views.get_balance),
]
