# MamaAlert Backend PRD

**Stack:** Django 5.x + Django REST Framework + PostgreSQL  
**Purpose:** API backend for MamaAlert maternal health platform

---

## Table of Contents

1. [Project Setup](#1-project-setup)
2. [Database Models](#2-database-models)
3. [Authentication API](#3-authentication-api)
4. [Daily Program API](#4-daily-program-api)
5. [Health Logging API](#5-health-logging-api)
6. [Tokens & Rewards API](#6-tokens--rewards-api)
7. [Withdrawals API](#7-withdrawals-api)
8. [Admin API](#8-admin-api)
9. [Business Logic](#9-business-logic)
10. [Scheduled Tasks](#10-scheduled-tasks)

---

## 1. Project Setup

### Project Structure

```
backend/
├── mamalert/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
│
├── apps/
│   ├── users/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── admin.py
│   │
│   ├── daily_program/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── services.py
│   │
│   ├── health/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── tokens/
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   ├── urls.py
│   │   └── services.py
│   │
│   └── withdrawals/
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       └── admin.py
│
├── manage.py
└── requirements.txt
```

### Requirements

```
# requirements.txt
Django>=5.0
djangorestframework>=3.14
djangorestframework-simplejwt>=5.3
django-cors-headers>=4.3
psycopg2-binary>=2.9
python-decouple>=3.8
Pillow>=10.0
django-filter>=23.5
```

### Settings

```python
# mamalert/settings.py

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    
    # Local apps
    'apps.users',
    'apps.daily_program',
    'apps.health',
    'apps.tokens',
    'apps.withdrawals',
]

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### URL Configuration

```python
# mamalert/urls.py
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/daily/', include('apps.daily_program.urls')),
    path('api/health/', include('apps.health.urls')),
    path('api/tokens/', include('apps.tokens.urls')),
    path('api/withdrawals/', include('apps.withdrawals.urls')),
]
```

---

## 2. Database Models

### User Model

```python
# apps/users/models.py
from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, unique=True)
    
    # Pregnancy info
    due_date = models.DateField(null=True, blank=True)
    last_menstrual_period = models.DateField(null=True, blank=True)
    
    # Profile
    date_of_birth = models.DateField(null=True, blank=True)
    blood_type = models.CharField(max_length=5, blank=True)  # A+, B-, O+, etc.
    genotype = models.CharField(max_length=5, blank=True)  # AA, AS, SS
    
    # Pregnancy history
    is_first_pregnancy = models.BooleanField(default=True)
    previous_pregnancies = models.IntegerField(default=0)
    
    # Health conditions (JSON array)
    health_conditions = models.JSONField(default=list, blank=True)
    allergies = models.TextField(blank=True)
    
    # Onboarding
    onboarding_complete = models.BooleanField(default=False)
    
    # Tokens
    token_balance = models.IntegerField(default=0)
    total_tokens_earned = models.IntegerField(default=0)
    
    # Progress tracking
    current_program_week = models.IntegerField(default=1)
    current_program_day = models.IntegerField(default=1)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    
    # Role
    is_admin = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'phone']

    def get_current_week(self):
        """Calculate pregnancy week from due date"""
        if not self.due_date:
            return None
        from datetime import date
        days_until_due = (self.due_date - date.today()).days
        weeks_pregnant = 40 - (days_until_due // 7)
        return max(1, min(40, weeks_pregnant))

    def __str__(self):
        return self.email


class EmergencyContact(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emergency_contacts')
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    relationship = models.CharField(max_length=50)  # husband, mother, sister, etc.
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_primary', 'name']


class PreferredHospital(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='preferred_hospital')
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=15, blank=True)
    doctor_name = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

### Daily Program Models

```python
# apps/daily_program/models.py
from django.db import models
import uuid

class DailyContent(models.Model):
    """Content for each day of the program"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    week = models.IntegerField()  # 1-40
    day = models.IntegerField()   # 1-7
    
    # Content
    title = models.CharField(max_length=200)
    theme = models.CharField(max_length=50)  # baby_development, nutrition, exercise, etc.
    
    # Lesson
    lesson_title = models.CharField(max_length=200)
    lesson_content = models.TextField()
    lesson_summary = models.TextField(blank=True)  # For catch-up mode
    lesson_image = models.URLField(blank=True)
    read_time_minutes = models.IntegerField(default=2)
    
    # Tip
    tip_of_day = models.TextField()
    
    # Daily task
    task_title = models.CharField(max_length=200)
    task_description = models.TextField()
    task_type = models.CharField(max_length=50)  # action, log, schedule, etc.
    
    # Tokens
    lesson_tokens = models.IntegerField(default=5)
    checkin_tokens = models.IntegerField(default=5)
    task_tokens = models.IntegerField(default=5)
    total_tokens = models.IntegerField(default=15)
    catchup_tokens = models.IntegerField(default=10)
    
    # Quiz (only for day 7)
    is_quiz_day = models.BooleanField(default=False)
    quiz_bonus_tokens = models.IntegerField(default=25)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['week', 'day']
        ordering = ['week', 'day']

    def __str__(self):
        return f"Week {self.week} Day {self.day}: {self.title}"


class QuizQuestion(models.Model):
    """Quiz questions for day 7 of each week"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    daily_content = models.ForeignKey(DailyContent, on_delete=models.CASCADE, related_name='quiz_questions')
    
    question = models.TextField()
    option_a = models.CharField(max_length=200)
    option_b = models.CharField(max_length=200)
    option_c = models.CharField(max_length=200)
    option_d = models.CharField(max_length=200)
    correct_answer = models.CharField(max_length=1)  # a, b, c, or d
    
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']


class UserDayProgress(models.Model):
    """Tracks user's progress on each day"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='day_progress')
    daily_content = models.ForeignKey(DailyContent, on_delete=models.CASCADE)
    
    # Progress flags
    lesson_completed = models.BooleanField(default=False)
    checkin_completed = models.BooleanField(default=False)
    task_completed = models.BooleanField(default=False)
    quiz_completed = models.BooleanField(default=False)
    
    # Completion status
    is_completed = models.BooleanField(default=False)
    is_catchup = models.BooleanField(default=False)  # Completed in catch-up mode
    
    # Quiz score (for day 7)
    quiz_score = models.IntegerField(null=True, blank=True)
    quiz_total = models.IntegerField(null=True, blank=True)
    
    # Tokens earned
    tokens_earned = models.IntegerField(default=0)
    
    # Timestamps
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['user', 'daily_content']

    def check_completion(self):
        """Check if all required tasks are done"""
        if self.daily_content.is_quiz_day:
            self.is_completed = self.lesson_completed and self.checkin_completed and self.quiz_completed
        else:
            self.is_completed = self.lesson_completed and self.checkin_completed and self.task_completed
        return self.is_completed
```

### Health Logging Models

```python
# apps/health/models.py
from django.db import models
import uuid

class DailyHealthLog(models.Model):
    """Daily health check-in"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='health_logs')
    
    date = models.DateField()
    
    # Mood
    MOOD_CHOICES = [
        ('great', 'Great'),
        ('okay', 'Okay'),
        ('tired', 'Tired'),
        ('sick', 'Sick'),
        ('anxious', 'Anxious'),
    ]
    mood = models.CharField(max_length=20, choices=MOOD_CHOICES)
    
    # Vitals (optional)
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    blood_pressure_systolic = models.IntegerField(null=True, blank=True)
    blood_pressure_diastolic = models.IntegerField(null=True, blank=True)
    
    # Symptoms (JSON array)
    symptoms = models.JSONField(default=list, blank=True)
    # Options: nausea, headache, fatigue, swelling, cramps, back_pain, dizziness, none
    
    # Baby movement
    MOVEMENT_CHOICES = [
        ('normal', 'Normal'),
        ('less', 'Less than usual'),
        ('more', 'More than usual'),
        ('none', 'No movement felt'),
    ]
    baby_movement = models.CharField(max_length=20, choices=MOVEMENT_CHOICES, blank=True)
    
    # Notes
    notes = models.TextField(blank=True)
    
    # Flags
    has_warning_symptoms = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']

    def save(self, *args, **kwargs):
        # Check for warning symptoms
        warning_symptoms = ['severe_headache', 'vision_changes', 'severe_swelling', 'heavy_bleeding']
        self.has_warning_symptoms = (
            any(s in self.symptoms for s in warning_symptoms) or
            self.baby_movement == 'none'
        )
        super().save(*args, **kwargs)


class KickCount(models.Model):
    """Kick counting sessions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='kick_counts')
    
    date = models.DateField()
    kick_count = models.IntegerField()
    duration_minutes = models.IntegerField()
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date', '-created_at']


class Appointment(models.Model):
    """Prenatal appointments"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='appointments')
    
    TYPE_CHOICES = [
        ('prenatal', 'Prenatal Checkup'),
        ('ultrasound', 'Ultrasound/Scan'),
        ('glucose', 'Glucose Screening'),
        ('lab', 'Lab Test'),
        ('postpartum', 'Postpartum Checkup'),
        ('other', 'Other'),
    ]
    appointment_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    
    date = models.DateField()
    time = models.TimeField(null=True, blank=True)
    
    hospital_name = models.CharField(max_length=200, blank=True)
    doctor_name = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    
    # Completion
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Results (after completion)
    baby_heartbeat = models.IntegerField(null=True, blank=True)  # bpm
    weight_kg = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    blood_pressure_systolic = models.IntegerField(null=True, blank=True)
    blood_pressure_diastolic = models.IntegerField(null=True, blank=True)
    doctor_notes = models.TextField(blank=True)
    
    # Tokens
    tokens_earned = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'time']
```

### Token Models

```python
# apps/tokens/models.py
from django.db import models
import uuid

class TokenTransaction(models.Model):
    """All token transactions"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='token_transactions')
    
    TYPE_CHOICES = [
        ('earn', 'Earned'),
        ('spend', 'Spent'),
        ('withdraw', 'Withdrawn'),
        ('bonus', 'Bonus'),
    ]
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    
    amount = models.IntegerField()
    
    # Source of earning
    SOURCE_CHOICES = [
        ('signup', 'Signup Bonus'),
        ('onboarding', 'Completed Onboarding'),
        ('daily_lesson', 'Daily Lesson'),
        ('daily_checkin', 'Daily Check-in'),
        ('daily_task', 'Daily Task'),
        ('weekly_quiz', 'Weekly Quiz'),
        ('streak_bonus', 'Streak Bonus'),
        ('checkup', 'Prenatal Checkup'),
        ('referral', 'Referral'),
        ('withdrawal', 'Withdrawal'),
    ]
    source = models.CharField(max_length=30, choices=SOURCE_CHOICES)
    
    # Reference to related object
    reference_id = models.UUIDField(null=True, blank=True)
    reference_type = models.CharField(max_length=50, blank=True)  # day_progress, appointment, etc.
    
    description = models.CharField(max_length=200, blank=True)
    
    # Balance after transaction
    balance_after = models.IntegerField()
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class StreakBonus(models.Model):
    """Track streak bonuses awarded"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='streak_bonuses')
    
    streak_days = models.IntegerField()  # 7, 14, 30, 60
    tokens_awarded = models.IntegerField()
    
    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'streak_days']
```

### Withdrawal Models

```python
# apps/withdrawals/models.py
from django.db import models
import uuid

class WithdrawalRequest(models.Model):
    """Withdrawal requests from mothers"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='withdrawals')
    
    token_amount = models.IntegerField()
    naira_amount = models.DecimalField(max_digits=10, decimal_places=2)  # token_amount * 2
    
    # Destination
    PROVIDER_CHOICES = [
        ('opay', 'OPay'),
        ('palmpay', 'PalmPay'),
        ('bank', 'Bank Transfer'),
    ]
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES)
    destination = models.CharField(max_length=50)  # Phone number or account number
    account_name = models.CharField(max_length=100, blank=True)  # For bank transfers
    bank_name = models.CharField(max_length=100, blank=True)
    
    # Status
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Admin handling
    reviewed_by = models.ForeignKey(
        'users.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='reviewed_withdrawals'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Payment reference (admin enters after paying)
    payment_reference = models.CharField(max_length=100, blank=True)
    
    # Rejection reason
    rejection_reason = models.TextField(blank=True)
    
    # Blockchain (for future)
    blockchain_tx = models.CharField(max_length=200, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - ₦{self.naira_amount} - {self.status}"
```

---

## 3. Authentication API

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup/` | Register new user |
| POST | `/api/auth/login/` | Login user |
| GET | `/api/auth/me/` | Get current user |
| PATCH | `/api/auth/me/` | Update current user |
| POST | `/api/auth/onboarding/` | Complete onboarding |

### Serializers

```python
# apps/users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import EmergencyContact, PreferredHospital

User = get_user_model()

class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = ['id', 'name', 'phone', 'relationship', 'is_primary']


class PreferredHospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreferredHospital
        fields = ['id', 'name', 'address', 'phone', 'doctor_name']


class UserSerializer(serializers.ModelSerializer):
    emergency_contacts = EmergencyContactSerializer(many=True, read_only=True)
    preferred_hospital = PreferredHospitalSerializer(read_only=True)
    current_week = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone', 'first_name', 'last_name',
            'due_date', 'date_of_birth', 'blood_type', 'genotype',
            'is_first_pregnancy', 'previous_pregnancies',
            'health_conditions', 'allergies',
            'onboarding_complete',
            'token_balance', 'total_tokens_earned',
            'current_program_week', 'current_program_day',
            'current_streak', 'longest_streak',
            'current_week',
            'emergency_contacts', 'preferred_hospital',
            'created_at',
        ]
        read_only_fields = ['id', 'token_balance', 'total_tokens_earned', 'created_at']

    def get_current_week(self, obj):
        return obj.get_current_week()


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['email', 'phone', 'password', 'first_name', 'last_name']

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['username'] = validated_data['email']
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class OnboardingSerializer(serializers.Serializer):
    due_date = serializers.DateField()
    date_of_birth = serializers.DateField(required=False)
    blood_type = serializers.CharField(required=False)
    genotype = serializers.CharField(required=False)
    is_first_pregnancy = serializers.BooleanField()
    previous_pregnancies = serializers.IntegerField(required=False, default=0)
    health_conditions = serializers.ListField(child=serializers.CharField(), required=False)
    allergies = serializers.CharField(required=False, allow_blank=True)
    
    emergency_contacts = serializers.ListField(
        child=serializers.DictField(),
        min_length=1
    )
    
    preferred_hospital = serializers.DictField(required=False)
```

### Views

```python
# apps/users/views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, EmergencyContact, PreferredHospital
from .serializers import (
    UserSerializer, SignupSerializer, LoginSerializer, OnboardingSerializer
)
from apps.tokens.services import TokenService

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        # Award signup bonus
        TokenService.award_tokens(
            user=user,
            amount=50,
            source='signup',
            description='Welcome to MamaAlert!'
        )
        
        return Response({
            'success': True,
            'data': {
                'user': UserSerializer(user).data,
                'token': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'success': False,
        'error': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = authenticate(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )
        
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'success': True,
                'data': {
                    'user': UserSerializer(user).data,
                    'token': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            })
        
        return Response({
            'success': False,
            'error': 'Invalid email or password'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response({
        'success': False,
        'error': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == 'GET':
        return Response({
            'success': True,
            'data': UserSerializer(request.user).data
        })
    
    elif request.method == 'PATCH':
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'data': serializer.data
            })
        return Response({
            'success': False,
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_onboarding(request):
    serializer = OnboardingSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.validated_data
        user = request.user
        
        # Update user fields
        user.due_date = data['due_date']
        user.date_of_birth = data.get('date_of_birth')
        user.blood_type = data.get('blood_type', '')
        user.genotype = data.get('genotype', '')
        user.is_first_pregnancy = data['is_first_pregnancy']
        user.previous_pregnancies = data.get('previous_pregnancies', 0)
        user.health_conditions = data.get('health_conditions', [])
        user.allergies = data.get('allergies', '')
        user.onboarding_complete = True
        
        # Set starting week/day based on pregnancy
        current_week = user.get_current_week()
        user.current_program_week = current_week or 1
        user.current_program_day = 1
        
        user.save()
        
        # Create emergency contacts
        for contact_data in data['emergency_contacts']:
            EmergencyContact.objects.create(
                user=user,
                name=contact_data['name'],
                phone=contact_data['phone'],
                relationship=contact_data.get('relationship', ''),
                is_primary=contact_data.get('is_primary', False)
            )
        
        # Create preferred hospital
        if data.get('preferred_hospital'):
            hospital_data = data['preferred_hospital']
            PreferredHospital.objects.create(
                user=user,
                name=hospital_data.get('name', ''),
                address=hospital_data.get('address', ''),
                phone=hospital_data.get('phone', ''),
                doctor_name=hospital_data.get('doctor_name', '')
            )
        
        # Award onboarding tokens
        TokenService.award_tokens(
            user=user,
            amount=50,
            source='onboarding',
            description='Completed health profile'
        )
        
        return Response({
            'success': True,
            'data': UserSerializer(user).data
        })
    
    return Response({
        'success': False,
        'error': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)
```

### URLs

```python
# apps/users/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup),
    path('login/', views.login),
    path('me/', views.me),
    path('onboarding/', views.complete_onboarding),
]
```

---

## 4. Daily Program API

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/daily/today/` | Get today's program |
| GET | `/api/daily/week/<week>/day/<day>/` | Get specific day |
| POST | `/api/daily/<id>/complete-lesson/` | Mark lesson complete |
| POST | `/api/daily/<id>/complete-task/` | Mark task complete |
| POST | `/api/daily/<id>/checkin/` | Submit health check-in |
| GET | `/api/daily/missed/` | Get missed days needing catch-up |
| GET | `/api/daily/progress/` | Get overall progress |
| GET | `/api/daily/week/<week>/progress/` | Get week progress |
| POST | `/api/daily/week/<week>/quiz/` | Submit weekly quiz |

### Services

```python
# apps/daily_program/services.py
from django.utils import timezone
from .models import DailyContent, UserDayProgress
from apps.tokens.services import TokenService

class DailyProgramService:
    
    @staticmethod
    def get_today_program(user):
        """Get the current day's program for user"""
        # Get user's current position
        week = user.current_program_week
        day = user.current_program_day
        
        try:
            content = DailyContent.objects.get(week=week, day=day)
        except DailyContent.DoesNotExist:
            return None
        
        # Get or create progress record
        progress, _ = UserDayProgress.objects.get_or_create(
            user=user,
            daily_content=content
        )
        
        return {
            'content': content,
            'progress': progress,
            'is_today': True,
        }
    
    @staticmethod
    def get_missed_days(user):
        """Get days user missed that need catch-up"""
        # Find all incomplete days before current day
        missed = UserDayProgress.objects.filter(
            user=user,
            is_completed=False,
            daily_content__week__lte=user.current_program_week,
        ).exclude(
            daily_content__week=user.current_program_week,
            daily_content__day__gte=user.current_program_day
        ).select_related('daily_content').order_by(
            'daily_content__week', 
            'daily_content__day'
        )
        
        return missed
    
    @staticmethod
    def complete_lesson(user, day_progress, is_catchup=False):
        """Mark lesson as complete and award tokens"""
        if day_progress.lesson_completed:
            return day_progress
        
        day_progress.lesson_completed = True
        
        # Award tokens
        tokens = day_progress.daily_content.lesson_tokens
        if is_catchup:
            tokens = min(tokens, day_progress.daily_content.catchup_tokens // 2)
        
        TokenService.award_tokens(
            user=user,
            amount=tokens,
            source='daily_lesson',
            reference_id=day_progress.id,
            reference_type='day_progress',
            description=f"Completed: {day_progress.daily_content.title}"
        )
        
        day_progress.tokens_earned += tokens
        day_progress.check_completion()
        day_progress.save()
        
        # Check if day completed and advance user
        if day_progress.is_completed:
            DailyProgramService._on_day_completed(user, day_progress)
        
        return day_progress
    
    @staticmethod
    def complete_checkin(user, day_progress, health_data, is_catchup=False):
        """Complete health check-in for the day"""
        from apps.health.models import DailyHealthLog
        
        if day_progress.checkin_completed:
            return day_progress
        
        # Create health log
        DailyHealthLog.objects.update_or_create(
            user=user,
            date=timezone.now().date(),
            defaults={
                'mood': health_data.get('mood'),
                'weight_kg': health_data.get('weight'),
                'blood_pressure_systolic': health_data.get('bp_systolic'),
                'blood_pressure_diastolic': health_data.get('bp_diastolic'),
                'symptoms': health_data.get('symptoms', []),
                'baby_movement': health_data.get('baby_movement', ''),
                'notes': health_data.get('notes', ''),
            }
        )
        
        day_progress.checkin_completed = True
        
        # Award tokens
        tokens = day_progress.daily_content.checkin_tokens
        if is_catchup:
            tokens = min(tokens, day_progress.daily_content.catchup_tokens // 2)
        
        TokenService.award_tokens(
            user=user,
            amount=tokens,
            source='daily_checkin',
            reference_id=day_progress.id,
            reference_type='day_progress',
            description="Daily health check-in"
        )
        
        day_progress.tokens_earned += tokens
        day_progress.check_completion()
        day_progress.save()
        
        if day_progress.is_completed:
            DailyProgramService._on_day_completed(user, day_progress)
        
        return day_progress
    
    @staticmethod
    def complete_task(user, day_progress):
        """Mark daily task as complete"""
        if day_progress.task_completed:
            return day_progress
        
        day_progress.task_completed = True
        
        # Award tokens
        tokens = day_progress.daily_content.task_tokens
        TokenService.award_tokens(
            user=user,
            amount=tokens,
            source='daily_task',
            reference_id=day_progress.id,
            reference_type='day_progress',
            description=f"Task: {day_progress.daily_content.task_title}"
        )
        
        day_progress.tokens_earned += tokens
        day_progress.check_completion()
        day_progress.save()
        
        if day_progress.is_completed:
            DailyProgramService._on_day_completed(user, day_progress)
        
        return day_progress
    
    @staticmethod
    def submit_quiz(user, day_progress, answers):
        """Submit weekly quiz answers"""
        if not day_progress.daily_content.is_quiz_day:
            raise ValueError("This day does not have a quiz")
        
        if day_progress.quiz_completed:
            return day_progress
        
        questions = day_progress.daily_content.quiz_questions.all()
        correct = 0
        total = questions.count()
        
        for q in questions:
            if answers.get(str(q.id)) == q.correct_answer:
                correct += 1
        
        day_progress.quiz_completed = True
        day_progress.quiz_score = correct
        day_progress.quiz_total = total
        
        # Award quiz bonus tokens (proportional to score)
        bonus_tokens = day_progress.daily_content.quiz_bonus_tokens
        earned_bonus = int((correct / total) * bonus_tokens) if total > 0 else 0
        
        TokenService.award_tokens(
            user=user,
            amount=earned_bonus,
            source='weekly_quiz',
            reference_id=day_progress.id,
            reference_type='day_progress',
            description=f"Weekly quiz: {correct}/{total} correct"
        )
        
        day_progress.tokens_earned += earned_bonus
        day_progress.check_completion()
        day_progress.save()
        
        if day_progress.is_completed:
            DailyProgramService._on_day_completed(user, day_progress)
        
        return day_progress
    
    @staticmethod
    def _on_day_completed(user, day_progress):
        """Called when a day is fully completed"""
        day_progress.completed_at = timezone.now()
        day_progress.save()
        
        # Update streak
        user.current_streak += 1
        if user.current_streak > user.longest_streak:
            user.longest_streak = user.current_streak
        
        # Check for streak bonuses
        DailyProgramService._check_streak_bonus(user)
        
        # Advance to next day
        if day_progress.daily_content.day == 7:
            # Move to next week
            user.current_program_week += 1
            user.current_program_day = 1
        else:
            user.current_program_day += 1
        
        user.save()
    
    @staticmethod
    def _check_streak_bonus(user):
        """Check and award streak bonuses"""
        from apps.tokens.models import StreakBonus
        
        streak_rewards = {
            7: 20,
            14: 50,
            30: 100,
            60: 200,
        }
        
        for streak_days, tokens in streak_rewards.items():
            if user.current_streak >= streak_days:
                bonus, created = StreakBonus.objects.get_or_create(
                    user=user,
                    streak_days=streak_days,
                    defaults={'tokens_awarded': tokens}
                )
                
                if created:
                    TokenService.award_tokens(
                        user=user,
                        amount=tokens,
                        source='streak_bonus',
                        description=f"{streak_days}-day streak bonus!"
                    )
```

### Views

```python
# apps/daily_program/views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import DailyContent, UserDayProgress
from .serializers import DailyContentSerializer, UserDayProgressSerializer
from .services import DailyProgramService


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_today(request):
    """Get today's program for the user"""
    result = DailyProgramService.get_today_program(request.user)
    
    if not result:
        return Response({
            'success': False,
            'error': 'No content available for today'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Check for missed days
    missed = DailyProgramService.get_missed_days(request.user)
    
    return Response({
        'success': True,
        'data': {
            'content': DailyContentSerializer(result['content']).data,
            'progress': UserDayProgressSerializer(result['progress']).data,
            'has_missed_days': missed.exists(),
            'missed_count': missed.count(),
            'user_week': request.user.current_program_week,
            'user_day': request.user.current_program_day,
            'streak': request.user.current_streak,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_day(request, week, day):
    """Get specific day's content"""
    try:
        content = DailyContent.objects.get(week=week, day=day)
    except DailyContent.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Day not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    progress, _ = UserDayProgress.objects.get_or_create(
        user=request.user,
        daily_content=content
    )
    
    # Check if this day is accessible (not ahead of user's progress)
    is_accessible = (
        week < request.user.current_program_week or
        (week == request.user.current_program_week and day <= request.user.current_program_day)
    )
    
    return Response({
        'success': True,
        'data': {
            'content': DailyContentSerializer(content).data,
            'progress': UserDayProgressSerializer(progress).data,
            'is_accessible': is_accessible,
            'is_current': (week == request.user.current_program_week and 
                          day == request.user.current_program_day),
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_lesson(request, progress_id):
    """Mark lesson as complete"""
    try:
        progress = UserDayProgress.objects.get(
            id=progress_id,
            user=request.user
        )
    except UserDayProgress.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Progress not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    is_catchup = request.data.get('is_catchup', False)
    progress = DailyProgramService.complete_lesson(request.user, progress, is_catchup)
    
    return Response({
        'success': True,
        'data': {
            'progress': UserDayProgressSerializer(progress).data,
            'new_balance': request.user.token_balance,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_checkin(request, progress_id):
    """Submit daily health check-in"""
    try:
        progress = UserDayProgress.objects.get(
            id=progress_id,
            user=request.user
        )
    except UserDayProgress.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Progress not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    is_catchup = request.data.get('is_catchup', False)
    health_data = {
        'mood': request.data.get('mood'),
        'weight': request.data.get('weight'),
        'bp_systolic': request.data.get('bp_systolic'),
        'bp_diastolic': request.data.get('bp_diastolic'),
        'symptoms': request.data.get('symptoms', []),
        'baby_movement': request.data.get('baby_movement'),
        'notes': request.data.get('notes', ''),
    }
    
    progress = DailyProgramService.complete_checkin(
        request.user, progress, health_data, is_catchup
    )
    
    return Response({
        'success': True,
        'data': {
            'progress': UserDayProgressSerializer(progress).data,
            'new_balance': request.user.token_balance,
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_task(request, progress_id):
    """Mark daily task as complete"""
    try:
        progress = UserDayProgress.objects.get(
            id=progress_id,
            user=request.user
        )
    except UserDayProgress.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Progress not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    progress = DailyProgramService.complete_task(request.user, progress)
    
    return Response({
        'success': True,
        'data': {
            'progress': UserDayProgressSerializer(progress).data,
            'new_balance': request.user.token_balance,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_missed_days(request):
    """Get days that need catch-up"""
    missed = DailyProgramService.get_missed_days(request.user)
    
    return Response({
        'success': True,
        'data': {
            'missed_days': [
                {
                    'progress': UserDayProgressSerializer(p).data,
                    'content': DailyContentSerializer(p.daily_content).data,
                }
                for p in missed
            ],
            'count': missed.count(),
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_progress(request):
    """Get user's overall progress"""
    user = request.user
    
    total_completed = UserDayProgress.objects.filter(
        user=user,
        is_completed=True
    ).count()
    
    total_tokens = user.total_tokens_earned
    
    return Response({
        'success': True,
        'data': {
            'current_week': user.current_program_week,
            'current_day': user.current_program_day,
            'current_streak': user.current_streak,
            'longest_streak': user.longest_streak,
            'days_completed': total_completed,
            'total_tokens_earned': total_tokens,
            'token_balance': user.token_balance,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_week_progress(request, week):
    """Get progress for specific week"""
    days = DailyContent.objects.filter(week=week).order_by('day')
    
    progress_list = []
    for day_content in days:
        progress, _ = UserDayProgress.objects.get_or_create(
            user=request.user,
            daily_content=day_content
        )
        progress_list.append({
            'day': day_content.day,
            'title': day_content.title,
            'is_completed': progress.is_completed,
            'tokens_earned': progress.tokens_earned,
        })
    
    return Response({
        'success': True,
        'data': {
            'week': week,
            'days': progress_list,
            'completed_count': sum(1 for p in progress_list if p['is_completed']),
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_quiz(request, week):
    """Submit weekly quiz"""
    try:
        content = DailyContent.objects.get(week=week, day=7, is_quiz_day=True)
    except DailyContent.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Quiz not found for this week'
        }, status=status.HTTP_404_NOT_FOUND)
    
    progress, _ = UserDayProgress.objects.get_or_create(
        user=request.user,
        daily_content=content
    )
    
    answers = request.data.get('answers', {})
    progress = DailyProgramService.submit_quiz(request.user, progress, answers)
    
    return Response({
        'success': True,
        'data': {
            'progress': UserDayProgressSerializer(progress).data,
            'score': progress.quiz_score,
            'total': progress.quiz_total,
            'new_balance': request.user.token_balance,
        }
    })
```

### URLs

```python
# apps/daily_program/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('today/', views.get_today),
    path('week/<int:week>/day/<int:day>/', views.get_day),
    path('<uuid:progress_id>/complete-lesson/', views.complete_lesson),
    path('<uuid:progress_id>/complete-task/', views.complete_task),
    path('<uuid:progress_id>/checkin/', views.complete_checkin),
    path('missed/', views.get_missed_days),
    path('progress/', views.get_progress),
    path('week/<int:week>/progress/', views.get_week_progress),
    path('week/<int:week>/quiz/', views.submit_quiz),
]
```

---

## 5. Health Logging API

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/health/log/` | Submit health log |
| GET | `/api/health/history/` | Get health history |
| GET | `/api/health/profile/` | Get health profile |
| PATCH | `/api/health/profile/` | Update health profile |
| POST | `/api/health/kicks/` | Log kick count |
| GET | `/api/health/appointments/` | Get appointments |
| POST | `/api/health/appointments/` | Create appointment |
| POST | `/api/health/appointments/<id>/complete/` | Log completed checkup |

### Views

```python
# apps/health/views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import DailyHealthLog, KickCount, Appointment
from .serializers import (
    DailyHealthLogSerializer, KickCountSerializer, AppointmentSerializer
)
from apps.tokens.services import TokenService


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_health(request):
    """Submit daily health log"""
    data = request.data.copy()
    data['user'] = request.user.id
    data['date'] = timezone.now().date()
    
    serializer = DailyHealthLogSerializer(data=data)
    if serializer.is_valid():
        log = serializer.save(user=request.user)
        
        return Response({
            'success': True,
            'data': DailyHealthLogSerializer(log).data,
            'has_warnings': log.has_warning_symptoms,
        })
    
    return Response({
        'success': False,
        'error': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_history(request):
    """Get health log history"""
    start_date = request.query_params.get('start')
    end_date = request.query_params.get('end')
    
    logs = DailyHealthLog.objects.filter(user=request.user)
    
    if start_date:
        logs = logs.filter(date__gte=start_date)
    if end_date:
        logs = logs.filter(date__lte=end_date)
    
    return Response({
        'success': True,
        'data': DailyHealthLogSerializer(logs, many=True).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def log_kicks(request):
    """Log kick counting session"""
    serializer = KickCountSerializer(data=request.data)
    if serializer.is_valid():
        kick = serializer.save(
            user=request.user,
            date=timezone.now().date()
        )
        
        return Response({
            'success': True,
            'data': KickCountSerializer(kick).data
        })
    
    return Response({
        'success': False,
        'error': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def appointments(request):
    """List or create appointments"""
    if request.method == 'GET':
        appts = Appointment.objects.filter(user=request.user)
        return Response({
            'success': True,
            'data': AppointmentSerializer(appts, many=True).data
        })
    
    elif request.method == 'POST':
        serializer = AppointmentSerializer(data=request.data)
        if serializer.is_valid():
            appt = serializer.save(user=request.user)
            return Response({
                'success': True,
                'data': AppointmentSerializer(appt).data
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'error': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_appointment(request, appointment_id):
    """Log completed checkup and earn tokens"""
    try:
        appt = Appointment.objects.get(id=appointment_id, user=request.user)
    except Appointment.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Appointment not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if appt.is_completed:
        return Response({
            'success': False,
            'error': 'Appointment already completed'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Update appointment with results
    appt.is_completed = True
    appt.completed_at = timezone.now()
    appt.baby_heartbeat = request.data.get('baby_heartbeat')
    appt.weight_kg = request.data.get('weight_kg')
    appt.blood_pressure_systolic = request.data.get('bp_systolic')
    appt.blood_pressure_diastolic = request.data.get('bp_diastolic')
    appt.doctor_notes = request.data.get('doctor_notes', '')
    
    # Award tokens based on appointment type
    tokens = 200 if appt.appointment_type in ['prenatal', 'postpartum'] else 100
    appt.tokens_earned = tokens
    appt.save()
    
    TokenService.award_tokens(
        user=request.user,
        amount=tokens,
        source='checkup',
        reference_id=appt.id,
        reference_type='appointment',
        description=f"Completed {appt.get_appointment_type_display()}"
    )
    
    return Response({
        'success': True,
        'data': {
            'appointment': AppointmentSerializer(appt).data,
            'tokens_earned': tokens,
            'new_balance': request.user.token_balance,
        }
    })
```

---

## 6. Tokens & Rewards API

### Token Service

```python
# apps/tokens/services.py
from django.db import transaction
from .models import TokenTransaction

class TokenService:
    
    @staticmethod
    @transaction.atomic
    def award_tokens(user, amount, source, description='', reference_id=None, reference_type=''):
        """Award tokens to user"""
        user.token_balance += amount
        user.total_tokens_earned += amount
        user.save()
        
        TokenTransaction.objects.create(
            user=user,
            transaction_type='earn',
            amount=amount,
            source=source,
            description=description,
            reference_id=reference_id,
            reference_type=reference_type,
            balance_after=user.token_balance,
        )
        
        return user.token_balance
    
    @staticmethod
    @transaction.atomic
    def deduct_tokens(user, amount, source, description='', reference_id=None):
        """Deduct tokens from user (for withdrawals)"""
        if user.token_balance < amount:
            raise ValueError("Insufficient token balance")
        
        user.token_balance -= amount
        user.save()
        
        TokenTransaction.objects.create(
            user=user,
            transaction_type='withdraw',
            amount=-amount,
            source=source,
            description=description,
            reference_id=reference_id,
            reference_type='withdrawal',
            balance_after=user.token_balance,
        )
        
        return user.token_balance
```

### Views

```python
# apps/tokens/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import TokenTransaction
from .serializers import TokenTransactionSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_balance(request):
    """Get user's token balance"""
    user = request.user
    
    # Calculate pending withdrawals
    from apps.withdrawals.models import WithdrawalRequest
    pending = WithdrawalRequest.objects.filter(
        user=user,
        status='pending'
    ).aggregate(total=models.Sum('token_amount'))['total'] or 0
    
    return Response({
        'success': True,
        'data': {
            'balance': user.token_balance,
            'available': user.token_balance - pending,
            'pending_withdrawal': pending,
            'naira_value': user.token_balance * 2,
            'total_earned': user.total_tokens_earned,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transactions(request):
    """Get token transaction history"""
    transactions = TokenTransaction.objects.filter(user=request.user)
    
    page = request.query_params.get('page', 1)
    # Pagination handled by DRF
    
    return Response({
        'success': True,
        'data': TokenTransactionSerializer(transactions, many=True).data
    })
```

---

## 7. Withdrawals API

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/withdrawals/request/` | Request withdrawal |
| GET | `/api/withdrawals/my/` | Get my withdrawals |
| GET | `/api/withdrawals/admin/pending/` | Admin: List pending |
| POST | `/api/withdrawals/admin/<id>/approve/` | Admin: Approve |
| POST | `/api/withdrawals/admin/<id>/reject/` | Admin: Reject |

### Views

```python
# apps/withdrawals/views.py
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import WithdrawalRequest
from .serializers import WithdrawalRequestSerializer
from apps.tokens.services import TokenService


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_withdrawal(request):
    """Request a withdrawal"""
    user = request.user
    token_amount = int(request.data.get('amount', 0))
    
    # Validate minimum
    if token_amount < 500:
        return Response({
            'success': False,
            'error': 'Minimum withdrawal is 500 tokens'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check balance
    pending = WithdrawalRequest.objects.filter(
        user=user, status='pending'
    ).aggregate(total=models.Sum('token_amount'))['total'] or 0
    
    available = user.token_balance - pending
    
    if token_amount > available:
        return Response({
            'success': False,
            'error': 'Insufficient available balance'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create request
    withdrawal = WithdrawalRequest.objects.create(
        user=user,
        token_amount=token_amount,
        naira_amount=token_amount * 2,
        provider=request.data.get('provider'),
        destination=request.data.get('destination'),
        account_name=request.data.get('account_name', ''),
        bank_name=request.data.get('bank_name', ''),
    )
    
    return Response({
        'success': True,
        'data': WithdrawalRequestSerializer(withdrawal).data,
        'message': 'Withdrawal request submitted successfully'
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_withdrawals(request):
    """Get user's withdrawal history"""
    withdrawals = WithdrawalRequest.objects.filter(user=request.user)
    return Response({
        'success': True,
        'data': WithdrawalRequestSerializer(withdrawals, many=True).data
    })


# Admin views

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_pending_withdrawals(request):
    """List pending withdrawals (admin only)"""
    if not request.user.is_admin:
        return Response({
            'success': False,
            'error': 'Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)
    
    status_filter = request.query_params.get('status', 'pending')
    withdrawals = WithdrawalRequest.objects.filter(status=status_filter)
    
    return Response({
        'success': True,
        'data': WithdrawalRequestSerializer(withdrawals, many=True).data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_approve_withdrawal(request, withdrawal_id):
    """Approve withdrawal and record payment (admin only)"""
    if not request.user.is_admin:
        return Response({
            'success': False,
            'error': 'Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        withdrawal = WithdrawalRequest.objects.get(id=withdrawal_id)
    except WithdrawalRequest.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Withdrawal not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if withdrawal.status != 'pending':
        return Response({
            'success': False,
            'error': 'Withdrawal is not pending'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    payment_reference = request.data.get('payment_reference')
    if not payment_reference:
        return Response({
            'success': False,
            'error': 'Payment reference is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Deduct tokens from user
    TokenService.deduct_tokens(
        user=withdrawal.user,
        amount=withdrawal.token_amount,
        source='withdrawal',
        description=f'Withdrawal #{withdrawal.id}',
        reference_id=withdrawal.id
    )
    
    # Update withdrawal
    withdrawal.status = 'completed'
    withdrawal.payment_reference = payment_reference
    withdrawal.reviewed_by = request.user
    withdrawal.reviewed_at = timezone.now()
    withdrawal.completed_at = timezone.now()
    withdrawal.save()
    
    # TODO: Trigger blockchain recording here
    
    return Response({
        'success': True,
        'data': WithdrawalRequestSerializer(withdrawal).data,
        'message': 'Withdrawal approved and completed'
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_reject_withdrawal(request, withdrawal_id):
    """Reject withdrawal (admin only)"""
    if not request.user.is_admin:
        return Response({
            'success': False,
            'error': 'Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        withdrawal = WithdrawalRequest.objects.get(id=withdrawal_id)
    except WithdrawalRequest.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Withdrawal not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    if withdrawal.status != 'pending':
        return Response({
            'success': False,
            'error': 'Withdrawal is not pending'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    reason = request.data.get('reason', '')
    
    withdrawal.status = 'rejected'
    withdrawal.rejection_reason = reason
    withdrawal.reviewed_by = request.user
    withdrawal.reviewed_at = timezone.now()
    withdrawal.save()
    
    return Response({
        'success': True,
        'data': WithdrawalRequestSerializer(withdrawal).data,
        'message': 'Withdrawal rejected'
    })
```

### URLs

```python
# apps/withdrawals/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('request/', views.request_withdrawal),
    path('my/', views.my_withdrawals),
    path('admin/pending/', views.admin_pending_withdrawals),
    path('admin/<uuid:withdrawal_id>/approve/', views.admin_approve_withdrawal),
    path('admin/<uuid:withdrawal_id>/reject/', views.admin_reject_withdrawal),
]
```

---

## 8. Admin API

### Dashboard Stats

```python
# apps/users/views.py (add to existing)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    """Get admin dashboard statistics"""
    if not request.user.is_admin:
        return Response({
            'success': False,
            'error': 'Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)
    
    from apps.withdrawals.models import WithdrawalRequest
    from apps.tokens.models import TokenTransaction
    from django.db.models import Sum, Count
    
    total_users = User.objects.filter(is_admin=False).count()
    active_users = User.objects.filter(
        is_admin=False,
        onboarding_complete=True
    ).count()
    
    pending_withdrawals = WithdrawalRequest.objects.filter(
        status='pending'
    ).count()
    
    total_tokens_minted = TokenTransaction.objects.filter(
        transaction_type='earn'
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    total_withdrawals = WithdrawalRequest.objects.filter(
        status='completed'
    ).aggregate(total=Sum('naira_amount'))['total'] or 0
    
    return Response({
        'success': True,
        'data': {
            'total_users': total_users,
            'active_users': active_users,
            'pending_withdrawals': pending_withdrawals,
            'total_tokens_minted': total_tokens_minted,
            'total_withdrawals_naira': total_withdrawals,
        }
    })
```

---

## 9. Business Logic Summary

### Token Earning Rules

| Action | Tokens | When |
|--------|--------|------|
| Signup | 50 | Once on registration |
| Complete onboarding | 50 | Once |
| Daily lesson | 5 | Each day |
| Daily check-in | 5 | Each day |
| Daily task | 5 | Each day |
| Weekly quiz | Up to 25 | Day 7 (based on score) |
| Prenatal checkup | 200 | Each checkup logged |
| 7-day streak | 20 | Once |
| 14-day streak | 50 | Once |
| 30-day streak | 100 | Once |
| 60-day streak | 200 | Once |
| Catch-up day | 10 | Per missed day |

### Streak Rules

- Streak increases by 1 when day is completed
- Missing 1-2 days: Can recover by catching up within 48 hours
- Missing 3+ days: Streak resets to 0
- Streak bonuses are one-time only

### Withdrawal Rules

- Minimum: 500 tokens (₦1,000)
- Exchange rate: 1 token = ₦2
- Status flow: pending → approved/rejected → completed
- Tokens deducted only when admin approves

---

## 10. Management Commands

### Seed Daily Content

```python
# apps/daily_program/management/commands/seed_content.py
from django.core.management.base import BaseCommand
from apps.daily_program.models import DailyContent, QuizQuestion

class Command(BaseCommand):
    help = 'Seed daily content for weeks 24-26'

    def handle(self, *args, **options):
        # Week 24 content
        week_24_content = [
            {
                'week': 24, 'day': 1,
                'title': "Baby Can Hear",
                'theme': 'baby_development',
                'lesson_title': "Your Baby Can Hear!",
                'lesson_content': "At 24 weeks, your baby's ears are developed enough to hear your voice, your heartbeat, and sounds from the outside world...",
                'tip_of_day': "Baby responds most to low-pitched voices. Dad's voice is perfect!",
                'task_title': "Talk or sing to baby",
                'task_description': "Spend 5 minutes talking or singing to your baby",
                'task_type': 'action',
            },
            # ... more days
        ]
        
        for content_data in week_24_content:
            DailyContent.objects.update_or_create(
                week=content_data['week'],
                day=content_data['day'],
                defaults=content_data
            )
        
        self.stdout.write(self.style.SUCCESS('Content seeded successfully'))
```

### Create Admin User

```python
# apps/users/management/commands/create_admin.py
from django.core.management.base import BaseCommand
from apps.users.models import User

class Command(BaseCommand):
    help = 'Create admin user'

    def handle(self, *args, **options):
        email = 'admin@mamalert.com'
        if not User.objects.filter(email=email).exists():
            User.objects.create_superuser(
                email=email,
                username='admin',
                phone='08000000000',
                password='adminpassword123',
                is_admin=True,
            )
            self.stdout.write(self.style.SUCCESS('Admin created'))
        else:
            self.stdout.write('Admin already exists')
```

---

## Quick Start Commands

```bash
# Create project
django-admin startproject mamalert .

# Create apps
python manage.py startapp users
python manage.py startapp daily_program
python manage.py startapp health
python manage.py startapp tokens
python manage.py startapp withdrawals

# Move apps to apps/ folder and update INSTALLED_APPS

# Create migrations
python manage.py makemigrations

# Run migrations
python manage.py migrate

# Create admin
python manage.py create_admin

# Seed content
python manage.py seed_content

# Run server
python manage.py runserver
```

---

This is the complete backend PRD. Give this to Claude Code and it should be able to build the entire Django backend.
