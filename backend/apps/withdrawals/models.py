from django.db import models
import uuid


class WithdrawalRequest(models.Model):
    """Token withdrawal requests"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='withdrawal_requests')

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('completed', 'Completed'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    tokens_amount = models.IntegerField()
    naira_amount = models.DecimalField(max_digits=10, decimal_places=2)

    PAYMENT_METHOD_CHOICES = [
        ('bank_transfer', 'Bank Transfer'),
        ('mobile_money', 'Mobile Money'),
    ]
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)

    bank_name = models.CharField(max_length=100, blank=True)
    account_number = models.CharField(max_length=20, blank=True)
    account_name = models.CharField(max_length=100, blank=True)

    mobile_network = models.CharField(max_length=50, blank=True)
    mobile_number = models.CharField(max_length=20, blank=True)

    admin_notes = models.TextField(blank=True)
    rejection_reason = models.TextField(blank=True)

    processed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='processed_withdrawals'
    )
    processed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.tokens_amount} tokens - {self.status}"


class TokenConversionRate(models.Model):
    """Configuration for token to naira conversion"""
    tokens_per_naira = models.IntegerField(default=10)
    minimum_withdrawal = models.IntegerField(default=100)
    maximum_withdrawal = models.IntegerField(default=10000)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    @classmethod
    def get_active(cls):
        return cls.objects.filter(is_active=True).first()
