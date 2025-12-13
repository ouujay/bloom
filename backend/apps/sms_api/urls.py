"""
SMS API URL Configuration
"""
from django.urls import path
from . import views

app_name = 'sms_api'

urlpatterns = [
    # Africa's Talking webhook (receives incoming SMS)
    path('webhook/', views.sms_webhook, name='sms-webhook'),

    # Test endpoint (for manual SMS sending)
    path('test/', views.send_test_sms, name='send-test-sms'),

    # Status endpoint (check if SMS is enabled)
    path('status/', views.sms_status, name='sms-status'),
]
