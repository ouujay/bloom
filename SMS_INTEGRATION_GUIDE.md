# 🚀 BLOOM SMS Integration - 90 MINUTE IMPLEMENTATION

**Goal:** Add SMS support for feature phone users via Africa's Talking

**Impact:**
- ✅ Reach mothers without smartphones
- ✅ Daily health tips via SMS
- ✅ AI chat via SMS (send question, get AI response)
- ✅ Appointment reminders
- ✅ Token balance checks

---

## ⏱️ PHASE 1: Setup (15 minutes)

### 1. Sign Up for Africa's Talking

1. Go to: https://account.africastalking.com/auth/register
2. Sign up with your email
3. **Sandbox mode** (FREE for testing):
   - Username: `sandbox`
   - Get API Key from dashboard
4. Add test phone number (your number for testing)

### 2. Install Python SDK

```bash
cd backend
source venv/bin/activate
pip install africastalking
pip freeze > requirements.txt
```

### 3. Add to `.env`

```bash
# Africa's Talking
AT_USERNAME=sandbox  # or your production username
AT_API_KEY=your_api_key_here
AT_SENDER_ID=BLOOM  # Your sender name (max 11 chars)
```

---

## ⏱️ PHASE 2: Django App (20 minutes)

### 1. Create SMS App

```bash
cd backend/apps
python ../../manage.py startapp sms
```

### 2. Add to `settings.py`

```python
INSTALLED_APPS = [
    # ... existing apps
    'apps.sms',
]

# Africa's Talking Config
AT_USERNAME = os.getenv('AT_USERNAME', 'sandbox')
AT_API_KEY = os.getenv('AT_API_KEY')
AT_SENDER_ID = os.getenv('AT_SENDER_ID', 'BLOOM')
```

### 3. Create `apps/sms/africastalking_client.py`

```python
"""
Africa's Talking SMS Client
"""
import africastalking
from django.conf import settings

# Initialize SDK
africastalking.initialize(
    username=settings.AT_USERNAME,
    api_key=settings.AT_API_KEY
)

# Get SMS service
sms = africastalking.SMS

def send_sms(phone_number, message):
    """
    Send SMS to a phone number

    Args:
        phone_number (str): Nigerian phone number (e.g., "+2348012345678")
        message (str): Message to send (max 160 chars for 1 SMS)

    Returns:
        dict: Response from Africa's Talking
    """
    try:
        # Ensure phone number has country code
        if not phone_number.startswith('+'):
            phone_number = f'+234{phone_number.lstrip("0")}'

        response = sms.send(
            message=message,
            recipients=[phone_number],
            sender_id=settings.AT_SENDER_ID
        )

        return {
            'success': True,
            'response': response
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def send_bulk_sms(phone_numbers, message):
    """
    Send SMS to multiple phone numbers

    Args:
        phone_numbers (list): List of phone numbers
        message (str): Message to send

    Returns:
        dict: Response from Africa's Talking
    """
    try:
        # Ensure all numbers have country code
        formatted_numbers = []
        for phone in phone_numbers:
            if not phone.startswith('+'):
                phone = f'+234{phone.lstrip("0")}'
            formatted_numbers.append(phone)

        response = sms.send(
            message=message,
            recipients=formatted_numbers,
            sender_id=settings.AT_SENDER_ID
        )

        return {
            'success': True,
            'response': response
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }
```

### 4. Create `apps/sms/views.py`

```python
"""
SMS Webhook and API Views
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
import logging

from apps.ai.models import Conversation
from apps.users.models import User
from apps.tokens.models import TokenBalance
from .africastalking_client import send_sms

logger = logging.getLogger(__name__)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def sms_webhook(request):
    """
    Receive incoming SMS from Africa's Talking

    Payload:
    {
        "from": "+2348012345678",
        "to": "BLOOM",
        "text": "BAL",
        "date": "2024-12-12 10:30:00",
        "id": "msg-id",
        "linkId": "link-id"
    }
    """
    try:
        from_number = request.data.get('from')
        message_text = request.data.get('text', '').strip().upper()

        logger.info(f"Received SMS from {from_number}: {message_text}")

        # Find user by phone number
        user = User.objects.filter(phone_number=from_number).first()

        if not user:
            send_sms(
                from_number,
                "Welcome to BLOOM! 🌸 Reply SIGNUP to create your account or download our app."
            )
            return HttpResponse(status=200)

        # Handle different commands
        if message_text == 'BAL' or message_text == 'BALANCE':
            handle_balance_check(user, from_number)

        elif message_text.startswith('Q ') or message_text.startswith('QUESTION '):
            # AI Chat: "Q How do I reduce morning sickness?"
            question = message_text[2:] if message_text.startswith('Q ') else message_text[9:]
            handle_ai_question(user, from_number, question)

        elif message_text == 'TIPS' or message_text == 'TIP':
            handle_daily_tip(user, from_number)

        elif message_text == 'HELP':
            handle_help(from_number)

        else:
            # Default: treat as AI question
            handle_ai_question(user, from_number, message_text)

        return HttpResponse(status=200)

    except Exception as e:
        logger.error(f"SMS webhook error: {str(e)}")
        return HttpResponse(status=200)  # Always return 200 to Africa's Talking


def handle_balance_check(user, phone_number):
    """Send token balance via SMS"""
    try:
        balance = TokenBalance.objects.get(user=user)
        naira_value = balance.balance * 0.1  # Assuming 10 tokens = ₦1

        message = f"🌸 BLOOM Balance:\n{balance.balance} tokens\n≈ ₦{naira_value:.2f}\n\nReply HELP for commands"
        send_sms(phone_number, message)
    except Exception as e:
        send_sms(phone_number, "Error checking balance. Please try again.")


def handle_ai_question(user, phone_number, question):
    """Handle AI chat via SMS"""
    try:
        # Use OpenAI to answer (reuse existing AI logic)
        from openai import OpenAI
        client = OpenAI()

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are Bloom, a maternal health assistant for Nigerian mothers. Keep responses SHORT (under 160 characters for SMS). Be warm, supportive, and culturally sensitive."
                },
                {
                    "role": "user",
                    "content": question
                }
            ],
            max_tokens=100
        )

        answer = response.choices[0].message.content.strip()

        # Truncate if needed
        if len(answer) > 160:
            answer = answer[:157] + "..."

        send_sms(phone_number, f"🌸 {answer}\n\nReply Q [question] for more help")

    except Exception as e:
        logger.error(f"AI question error: {str(e)}")
        send_sms(phone_number, "Sorry, I couldn't process that. Please try again or download our app for better support.")


def handle_daily_tip(user, phone_number):
    """Send daily health tip"""
    tips = [
        "Drink 8 glasses of water daily to stay hydrated during pregnancy 💧",
        "Take folic acid daily to prevent birth defects 💊",
        "Rest on your left side to improve blood flow to baby ❤️",
        "Eat small frequent meals to reduce nausea 🍎",
        "Get 30 mins of gentle exercise like walking daily 🚶‍♀️",
        "Attend all antenatal appointments for baby's health 🏥",
        "Avoid alcohol and smoking during pregnancy 🚭",
    ]

    import random
    tip = random.choice(tips)
    send_sms(phone_number, f"🌸 Daily Tip:\n{tip}\n\nReply TIPS for more")


def handle_help(phone_number):
    """Send help menu"""
    message = """🌸 BLOOM Commands:
BAL - Check token balance
Q [question] - Ask health question
TIPS - Get daily tip
HELP - This menu

Download app for full features!"""

    send_sms(phone_number, message)
```

### 5. Create `apps/sms/urls.py`

```python
from django.urls import path
from . import views

urlpatterns = [
    path('webhook/', views.sms_webhook, name='sms-webhook'),
]
```

### 6. Add to main `urls.py`

```python
urlpatterns = [
    # ... existing paths
    path('sms/', include('apps.sms.urls')),
]
```

---

## ⏱️ PHASE 3: Automated SMS (30 minutes)

### Create `apps/sms/management/commands/send_daily_tips.py`

```python
"""
Send daily health tips via SMS to all users
Run: python manage.py send_daily_tips
"""
from django.core.management.base import BaseCommand
from apps.users.models import User
from apps.sms.africastalking_client import send_bulk_sms
import random


class Command(BaseCommand):
    help = 'Send daily health tips via SMS'

    def handle(self, *args, **options):
        tips = [
            "🌸 Drink 8 glasses of water daily during pregnancy 💧",
            "🌸 Take your folic acid supplement daily 💊",
            "🌸 Rest on your left side for better blood flow ❤️",
            "🌸 Eat small frequent meals to reduce nausea 🍎",
            "🌸 Walk 30 mins daily for healthy pregnancy 🚶‍♀️",
            "🌸 Never miss your antenatal appointments 🏥",
            "🌸 Avoid alcohol and smoking for baby's health 🚭",
        ]

        tip = random.choice(tips)

        # Get all users with phone numbers
        users = User.objects.filter(phone_number__isnull=False).exclude(phone_number='')
        phone_numbers = [user.phone_number for user in users]

        if phone_numbers:
            result = send_bulk_sms(phone_numbers, tip)

            if result['success']:
                self.stdout.write(self.style.SUCCESS(f'✅ Sent tip to {len(phone_numbers)} users'))
            else:
                self.stdout.write(self.style.ERROR(f'❌ Error: {result["error"]}'))
        else:
            self.stdout.write(self.style.WARNING('No users with phone numbers found'))
```

### Create `apps/sms/management/commands/send_appointment_reminders.py`

```python
"""
Send appointment reminders via SMS
Run: python manage.py send_appointment_reminders
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.health.models import Appointment
from apps.sms.africastalking_client import send_sms


class Command(BaseCommand):
    help = 'Send appointment reminders for tomorrow'

    def handle(self, *args, **options):
        tomorrow = timezone.now().date() + timedelta(days=1)

        appointments = Appointment.objects.filter(
            date=tomorrow,
            status='scheduled'
        ).select_related('user')

        sent_count = 0

        for appointment in appointments:
            if appointment.user.phone_number:
                message = f"""🌸 BLOOM Reminder:
Appointment tomorrow at {appointment.time.strftime('%I:%M %p')}
Location: {appointment.location}
Don't forget! Reply HELP for support"""

                result = send_sms(appointment.user.phone_number, message)

                if result['success']:
                    sent_count += 1
                    self.stdout.write(self.style.SUCCESS(f'✅ Sent to {appointment.user.phone_number}'))

        self.stdout.write(self.style.SUCCESS(f'✅ Sent {sent_count} reminders'))
```

---

## ⏱️ PHASE 4: Testing (15 minutes)

### 1. Update User Model (if needed)

Add phone number field if not exists:

```python
# apps/users/models.py
class User(AbstractUser):
    phone_number = models.CharField(max_length=20, blank=True, null=True, unique=True)
    # ... rest of fields
```

Run migration:
```bash
python manage.py makemigrations
python manage.py migrate
```

### 2. Test in Sandbox

```python
# In Django shell
from apps.sms.africastalking_client import send_sms

# Test SMS (use YOUR phone number)
send_sms('+2348012345678', 'Hello from BLOOM! 🌸')
```

### 3. Configure Africa's Talking Webhook

1. Go to: https://account.africastalking.com/sms/callback
2. Set callback URL: `https://your-domain.com/sms/webhook/`
3. For local testing, use ngrok:
   ```bash
   ngrok http 8000
   # Use ngrok URL: https://abc123.ngrok.io/sms/webhook/
   ```

### 4. Test Commands

**From phone, send SMS to Africa's Talking number:**

- `BAL` → Get token balance
- `Q How do I reduce nausea?` → AI answer
- `TIPS` → Get health tip
- `HELP` → Show menu

---

## ⏱️ PHASE 5: Schedule Automation (10 minutes)

### Using Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add these lines:
# Daily tips at 8 AM
0 8 * * * cd /path/to/backend && source venv/bin/activate && python manage.py send_daily_tips

# Appointment reminders at 5 PM
0 17 * * * cd /path/to/backend && source venv/bin/activate && python manage.py send_appointment_reminders
```

### OR Using Celery (if already set up)

```python
# apps/sms/tasks.py
from celery import shared_task
from apps.sms.africastalking_client import send_bulk_sms
from apps.users.models import User
import random

@shared_task
def send_daily_tips():
    tips = [...]  # same as above
    tip = random.choice(tips)

    users = User.objects.filter(phone_number__isnull=False)
    phone_numbers = [u.phone_number for u in users]

    if phone_numbers:
        send_bulk_sms(phone_numbers, tip)
```

---

## 🎯 QUICK WINS (10 minutes)

### Add SMS Opt-in During Signup

```python
# apps/users/serializers.py
class SignupSerializer(serializers.ModelSerializer):
    sms_notifications = serializers.BooleanField(default=True)

    class Meta:
        model = User
        fields = ['email', 'phone_number', 'password', 'sms_notifications']
```

### Send Welcome SMS on Signup

```python
# apps/users/views.py
from apps.sms.africastalking_client import send_sms

@api_view(['POST'])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()

        # Send welcome SMS
        if user.phone_number:
            send_sms(
                user.phone_number,
                "🌸 Welcome to BLOOM! Reply HELP to see what I can do. Download our app for the full experience!"
            )

        # ... rest of signup logic
```

---

## 📊 SMS COMMANDS SUMMARY

| Command | Response | Use Case |
|---------|----------|----------|
| `BAL` | Token balance | Quick balance check |
| `Q [question]` | AI answer | Health questions |
| `TIPS` | Daily health tip | Education |
| `HELP` | Command menu | Onboarding |
| Any text | AI answer | Default fallback |

---

## 💰 PRICING (Production)

**Africa's Talking SMS Rates (Nigeria):**
- Local SMS: ~₦2-4 per SMS
- Bulk discounts available
- Free sandbox for testing

**Estimated Cost:**
- 1,000 users × 1 SMS/day = ₦2,000-4,000/day
- Monthly: ~₦60,000-120,000

---

## 🚨 PRODUCTION CHECKLIST

- [ ] Switch from sandbox to production credentials
- [ ] Register sender ID with Africa's Talking
- [ ] Set up proper webhook URL (HTTPS)
- [ ] Add SMS opt-in/opt-out
- [ ] Monitor SMS delivery rates
- [ ] Set up error logging
- [ ] Add SMS quota limits per user
- [ ] Create admin dashboard for SMS stats

---

## 🎤 PITCH POINTS

**For Investors/Demo:**
> "We support feature phones via SMS! Mothers without smartphones can:
> - Get daily health tips
> - Ask our AI health questions
> - Check token balance
> - Receive appointment reminders
>
> This reaches **millions more mothers** in rural Nigeria where smartphones are rare but feature phones are everywhere!"

---

## ⚡ TOTAL TIME: ~90 MINUTES

- Setup: 15 min
- Django app: 20 min
- Views & logic: 30 min
- Automation: 15 min
- Testing: 10 min

**You can launch SMS support in 90 minutes!** 🚀

---

## 🔥 NEXT STEPS (After Launch)

1. Add SMS analytics dashboard
2. Support for local languages (Yoruba, Igbo, Hausa)
3. USSD integration (even more basic phones)
4. Two-way AI conversations via SMS
5. SMS-based token withdrawals

---

**This gives you MASSIVE reach with minimal code!** Feature phone users are a HUGE untapped market in Nigeria. 🇳🇬
