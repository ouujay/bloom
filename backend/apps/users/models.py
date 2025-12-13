from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=15, unique=True)

    # Profile
    date_of_birth = models.DateField(null=True, blank=True)
    blood_type = models.CharField(max_length=5, blank=True)
    genotype = models.CharField(max_length=5, blank=True)
    location = models.CharField(max_length=100, blank=True)  # State/City in Nigeria

    # Health conditions
    health_conditions = models.JSONField(default=list, blank=True)
    allergies = models.TextField(blank=True)

    # Onboarding
    onboarding_complete = models.BooleanField(default=False)

    # Tokens
    token_balance = models.IntegerField(default=0)
    total_tokens_earned = models.IntegerField(default=0)

    # Role
    is_admin = models.BooleanField(default=False)

    # User type
    USER_TYPE_CHOICES = [
        ('mother', 'Mother'),
        ('doctor', 'Doctor'),
        ('admin', 'Admin'),
    ]
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='mother')

    # Doctor-specific fields
    medical_license = models.CharField(max_length=100, blank=True)
    specialization = models.CharField(max_length=100, blank=True)
    hospital_name = models.CharField(max_length=200, blank=True)
    is_verified_doctor = models.BooleanField(default=False)

    @property
    def is_doctor(self):
        return self.user_type == 'doctor' and self.is_verified_doctor

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'phone']

    def __str__(self):
        return self.email


class EmergencyContact(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='emergency_contacts')
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15)
    relationship = models.CharField(max_length=50)
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
