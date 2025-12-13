#!/usr/bin/env python3
import os
import sys
import django
import json
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mamalert.settings')
django.setup()

from django.conf import settings

print("=== ALATPay Configuration Check ===\n")
print(f"Business ID: '{settings.ALATPAY_BUSINESS_ID}'")
print(f"Length: {len(settings.ALATPAY_BUSINESS_ID)}")
print(f"Has whitespace: {settings.ALATPAY_BUSINESS_ID != settings.ALATPAY_BUSINESS_ID.strip()}")
print(f"Base URL: {settings.ALATPAY_BASE_URL}")

# Test payload
payload = {
    'businessId': settings.ALATPAY_BUSINESS_ID.strip(),
    'amount': 100,
    'currency': 'NGN',
    'orderId': 'TEST123',
    'description': 'Test',
    'customer': {
        'email': 'test@example.com',
        'phone': '08012345678',
        'firstName': 'Test',
        'lastName': 'User',
        'metadata': ''
    }
}

print(f"\n=== Payload ===\n{json.dumps(payload, indent=2)}")

# Test actual API call
print(f"\n=== Testing ALATPay API ===")
url = f'{settings.ALATPAY_BASE_URL}/bank-transfer/api/v1/bankTransfer/virtualAccount'
headers = {
    'Content-Type': 'application/json',
    'Ocp-Apim-Subscription-Key': settings.ALATPAY_SECRET_KEY
}

print(f"URL: {url}")
print(f"Headers: Content-Type: application/json, Ocp-Apim-Subscription-Key: {settings.ALATPAY_SECRET_KEY[:10]}...")

try:
    response = requests.post(url, json=payload, headers=headers, timeout=30)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}")
except requests.exceptions.HTTPError as e:
    print(f"\nHTTP Error: {e}")
    if hasattr(e, 'response') and e.response is not None:
        try:
            print(f"Error Response:\n{json.dumps(e.response.json(), indent=2)}")
        except:
            print(f"Response Text: {e.response.text}")
except Exception as e:
    print(f"\nError: {e}")
