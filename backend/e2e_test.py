#!/usr/bin/env python3
"""End-to-end test for MamaAlert backend"""
import requests
import json
import time

BASE_URL = "http://localhost:8000/api"

def test_full_flow():
    print("=" * 50)
    print("MAMALERT END-TO-END TEST")
    print("=" * 50)

    # Use unique email for each test
    unique_email = f"test{int(time.time())}@test.com"

    # 1. Signup
    print("\n1. SIGNUP NEW USER")
    unique_phone = f"080{int(time.time())%100000000:08d}"
    signup_data = {
        "email": unique_email,
        "password": "TestPass123",
        "first_name": "Full",
        "last_name": "Test",
        "phone": unique_phone
    }
    resp = requests.post(f"{BASE_URL}/auth/signup/", json=signup_data)
    data = resp.json()
    print(f"   Success: {data.get('success')}")
    if not data.get('success'):
        print(f"   Error: {data.get('message')}")
        return

    token = data.get('data', {}).get('token')
    user = data.get('data', {}).get('user', {})
    print(f"   Email: {user.get('email')}")
    print(f"   Token Balance: {user.get('token_balance')}")

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Today's Program
    print("\n2. GET TODAY'S PROGRAM")
    resp = requests.get(f"{BASE_URL}/daily/today/", headers=headers)
    data = resp.json()
    print(f"   Success: {data.get('success')}")
    day_data = data.get('data', {})
    print(f"   Week: {day_data.get('week')}")
    print(f"   Day: {day_data.get('day_number')}")
    print(f"   Title: {day_data.get('title')}")
    print(f"   Lesson Completed: {day_data.get('lesson_completed')}")
    progress_id = day_data.get('id')

    # 3. Complete Lesson
    print("\n3. COMPLETE LESSON")
    resp = requests.post(f"{BASE_URL}/daily/{progress_id}/complete-lesson/", headers=headers)
    data = resp.json()
    print(f"   Success: {data.get('success')}")
    print(f"   New Balance: {data.get('data', {}).get('new_balance')}")

    # 4. Complete Check-in
    print("\n4. COMPLETE HEALTH CHECK-IN")
    checkin_data = {"mood": "good", "weight": 65, "notes": "Feeling great!"}
    resp = requests.post(f"{BASE_URL}/daily/{progress_id}/checkin/", headers=headers, json=checkin_data)
    print(f"   Status Code: {resp.status_code}")
    if resp.status_code != 200:
        print(f"   Response: {resp.text[:500]}")
    else:
        data = resp.json()
        print(f"   Success: {data.get('success')}")
        print(f"   New Balance: {data.get('data', {}).get('new_balance')}")

    # 5. Complete Task
    print("\n5. COMPLETE TASK")
    resp = requests.post(f"{BASE_URL}/daily/{progress_id}/complete-task/", headers=headers)
    data = resp.json()
    print(f"   Success: {data.get('success')}")
    print(f"   New Balance: {data.get('data', {}).get('new_balance')}")
    progress = data.get('data', {}).get('progress', {})
    print(f"   Day Completed: {progress.get('is_completed')}")

    # 6. Get Overall Progress
    print("\n6. GET OVERALL PROGRESS")
    resp = requests.get(f"{BASE_URL}/daily/progress/", headers=headers)
    data = resp.json()
    print(f"   Success: {data.get('success')}")
    progress = data.get('data', {})
    print(f"   Days Completed: {progress.get('days_completed')}")
    print(f"   Current Week: {progress.get('current_week')}")
    print(f"   Current Day: {progress.get('current_day')}")
    print(f"   Streak: {progress.get('current_streak')}")
    print(f"   Token Balance: {progress.get('token_balance')}")

    # 7. Get Token Balance
    print("\n7. GET TOKEN BALANCE")
    resp = requests.get(f"{BASE_URL}/tokens/balance/", headers=headers)
    data = resp.json()
    print(f"   Success: {data.get('success')}")
    balance = data.get('data', {})
    print(f"   Balance: {balance.get('balance')}")
    print(f"   Total Earned: {balance.get('total_earned')}")
    print(f"   Naira Value: ₦{balance.get('naira_value')}")

    # 8. Get Week Progress
    print("\n8. GET WEEK 1 PROGRESS")
    resp = requests.get(f"{BASE_URL}/daily/week/1/progress/", headers=headers)
    data = resp.json()
    print(f"   Success: {data.get('success')}")
    week_data = data.get('data', {})
    print(f"   Week: {week_data.get('week')}")
    print(f"   Days: {len(week_data.get('days', []))}")
    print(f"   Completed: {week_data.get('completed_count')}")

    # 9. Test Health Logs (use different date since today's log was created in step 4)
    print("\n9. CREATE HEALTH LOG")
    health_data = {
        "date": "2025-12-11",
        "mood": "great",
        "weight_kg": 65.5,
        "symptoms": ["mild_nausea"],
        "baby_movement": "active"
    }
    resp = requests.post(f"{BASE_URL}/health/logs/", headers=headers, json=health_data)
    if resp.status_code == 200 or resp.status_code == 201:
        data = resp.json()
        print(f"   Success: {data.get('success')}")
    else:
        print(f"   Status: {resp.status_code} (Expected - log may already exist)")

    # 10. Test Withdrawal Rate
    print("\n10. GET WITHDRAWAL RATE")
    resp = requests.get(f"{BASE_URL}/withdrawals/rate/", headers=headers)
    data = resp.json()
    print(f"   Success: {data.get('success')}")
    rate = data.get('data', {})
    print(f"   Tokens per Naira: {rate.get('tokens_per_naira')}")
    print(f"   Min Withdrawal: {rate.get('minimum_withdrawal')}")
    print(f"   Max Withdrawal: {rate.get('maximum_withdrawal')}")

    print("\n" + "=" * 50)
    print("END-TO-END TEST COMPLETE!")
    print("=" * 50)

if __name__ == "__main__":
    test_full_flow()
