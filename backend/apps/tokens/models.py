import uuid
from django.db import models
from django.utils import timezone
from decimal import Decimal


class DonationPool(models.Model):
    """Single record tracking the total donation pool"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pool_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_tokens_issued = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_tokens_withdrawn = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def tokens_in_circulation(self):
        return self.total_tokens_issued - self.total_tokens_withdrawn

    @property
    def token_value_naira(self):
        if self.tokens_in_circulation <= 0:
            return Decimal('0')
        return self.pool_balance / self.tokens_in_circulation

    @classmethod
    def get_pool(cls):
        pool, _ = cls.objects.get_or_create(pk='00000000-0000-0000-0000-000000000001')
        return pool

    def __str__(self):
        return f"Pool: ₦{self.pool_balance:,.2f} | {self.tokens_in_circulation:,.0f} tokens"


class Donation(models.Model):
    """Track all donations into the pool"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    donor_name = models.CharField(max_length=200, blank=True)
    donor_email = models.EmailField(blank=True)
    donor_phone = models.CharField(max_length=20, blank=True)
    is_anonymous = models.BooleanField(default=False)
    amount_naira = models.DecimalField(max_digits=12, decimal_places=2)
    payment_reference = models.CharField(max_length=100, blank=True)
    payment_method = models.CharField(max_length=50, default='bank_transfer')
    alatpay_transaction_id = models.CharField(max_length=255, blank=True, help_text='ALATPay transaction ID for verification')

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('failed', 'Failed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        name = self.donor_name if not self.is_anonymous else "Anonymous"
        return f"{name} - ₦{self.amount_naira:,.2f} - {self.status}"


class TokenTransaction(models.Model):
    """Track all token movements"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='token_transactions')

    TYPE_CHOICES = [
        ('earn', 'Earned'),
        ('withdraw', 'Withdrawn'),
        ('bonus', 'Bonus'),
        ('deduct', 'Deducted'),
    ]
    transaction_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    balance_after = models.DecimalField(max_digits=10, decimal_places=2)

    SOURCE_CHOICES = [
        ('signup', 'Signup Bonus'),
        ('onboarding', 'Completed Onboarding'),
        ('daily_lesson', 'Daily Lesson'),
        ('daily_checkin', 'Daily Check-in'),
        ('daily_task', 'Daily Task'),
        ('weekly_quiz', 'Weekly Quiz'),
        ('streak_bonus', 'Streak Bonus'),
        ('health_checkin', 'Health Check-in'),
        ('video_watched', 'Video Watched'),
        ('referral', 'Referral'),
        ('withdrawal', 'Withdrawal'),
        ('admin', 'Admin Adjustment'),
    ]
    source = models.CharField(max_length=30, choices=SOURCE_CHOICES)
    reference_id = models.UUIDField(null=True, blank=True)
    reference_type = models.CharField(max_length=50, blank=True)
    description = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class WithdrawalRequest(models.Model):
    """User withdrawal requests"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='token_withdrawal_requests')

    token_amount = models.DecimalField(max_digits=10, decimal_places=2)
    naira_amount = models.DecimalField(max_digits=12, decimal_places=2)
    token_value_at_request = models.DecimalField(max_digits=10, decimal_places=4)

    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=20)
    account_name = models.CharField(max_length=200)

    verification_photo = models.URLField(blank=True)
    verification_notes = models.TextField(blank=True)

    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('processing', 'Processing Payment'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    reviewed_by = models.ForeignKey('users.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_withdrawals')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)

    payment_reference = models.CharField(max_length=100, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']


class StreakBonus(models.Model):
    """Track streak bonuses awarded"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='streak_bonuses')

    streak_days = models.IntegerField()
    tokens_awarded = models.IntegerField()

    awarded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'streak_days']
