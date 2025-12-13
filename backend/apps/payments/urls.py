from django.urls import path
from . import views

urlpatterns = [
    path('initiate/', views.initiate_payment, name='payment-initiate'),
    path('status/<str:reference>/', views.check_payment_status, name='payment-status'),
    path('confirm/', views.manual_confirm, name='payment-confirm'),
    path('webhook/', views.payment_webhook, name='payment-webhook'),
]
