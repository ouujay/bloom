"""
URL routing for blockchain API endpoints
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router for viewsets (automatic CRUD endpoints)
router = DefaultRouter()
router.register(r'wallets', views.UserWalletViewSet, basename='wallet')
router.register(r'transactions', views.TokenTransactionViewSet, basename='transaction')
router.register(r'donations', views.DonationViewSet, basename='donation')
router.register(r'withdrawals', views.WithdrawalRequestViewSet, basename='withdrawal')

# URL patterns
urlpatterns = [
    # ViewSet routes (automatic)
    path('', include(router.urls)),

    # Custom function-based endpoints
    path('generate-wallet/', views.generate_wallet, name='generate-wallet'),
    path('mint-tokens/', views.mint_tokens, name='mint-tokens'),
    path('paystack-webhook/', views.paystack_webhook, name='paystack-webhook'),
    path('donations/record/', views.record_donation, name='record-donation'),  # NEW: Simple donation API
    path('create-withdrawal/', views.create_withdrawal_request, name='create-withdrawal'),
    path('approve-withdrawal/', views.approve_withdrawal, name='approve-withdrawal'),
    path('blockchain-status/', views.blockchain_status, name='blockchain-status'),
]
