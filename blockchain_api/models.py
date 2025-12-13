"""
Django models for MamaAlert blockchain integration
Stores all blockchain-related data and transaction records
"""
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class UserWallet(models.Model):
    """
    Stores wallet information for mothers using the platform
    Each mother gets a unique blockchain wallet for BLOOM tokens
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    wallet_address = models.CharField(max_length=42, unique=True, db_index=True)
    encrypted_private_key = models.TextField(help_text="Encrypted private key - NEVER store in plain text")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User Wallet"
        verbose_name_plural = "User Wallets"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.wallet_address[:10]}..."


class TokenTransaction(models.Model):
    """
    Records all BLOOM token transactions (mints and burns)
    Provides audit trail of all token movements
    """
    TRANSACTION_TYPES = [
        ('MINT', 'Mint (Reward)'),
        ('BURN', 'Burn (Withdrawal)'),
    ]

    ACTION_TYPES = [
        ('checkup', 'Health Checkup'),
        ('education', 'Educational Module'),
        ('donation', 'Platform Donation'),
        ('withdrawal', 'Token Withdrawal'),
    ]

    user_wallet = models.ForeignKey(UserWallet, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    action_id = models.CharField(max_length=100, help_text="Reference ID for the specific action")

    # Token amounts
    token_amount = models.IntegerField(help_text="Amount of BLOOM tokens")
    naira_equivalent = models.DecimalField(max_digits=10, decimal_places=2, help_text="Naira value (1 BLOOM = ₦2)")

    # Blockchain data
    tx_hash = models.CharField(max_length=66, unique=True, db_index=True, help_text="Blockchain transaction hash")
    block_number = models.IntegerField(null=True, blank=True)
    gas_used = models.IntegerField(null=True, blank=True)

    # Metadata
    status = models.CharField(max_length=20, default='PENDING', choices=[
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('FAILED', 'Failed'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Token Transaction"
        verbose_name_plural = "Token Transactions"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tx_hash']),
            models.Index(fields=['user_wallet', '-created_at']),
        ]

    def __str__(self):
        return f"{self.transaction_type} - {self.token_amount} BLOOM - {self.tx_hash[:10]}..."

    def save(self, *args, **kwargs):
        # Auto-calculate naira equivalent (1 BLOOM = ₦2)
        if self.token_amount and not self.naira_equivalent:
            self.naira_equivalent = self.token_amount * 2
        super().save(*args, **kwargs)


class Donation(models.Model):
    """
    Records all donations made via Paystack
    Links payment to blockchain recording
    """
    # Payment information
    donor_email = models.EmailField()
    amount_naira = models.DecimalField(max_digits=10, decimal_places=2)
    paystack_reference = models.CharField(max_length=100, unique=True, db_index=True)

    # Blockchain recording
    blockchain_tx_hash = models.CharField(max_length=66, null=True, blank=True, help_text="Hash of blockchain recording tx")
    blockchain_recorded = models.BooleanField(default=False)

    # Status tracking
    payment_status = models.CharField(max_length=20, default='PENDING', choices=[
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
    ])

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    recorded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Donation"
        verbose_name_plural = "Donations"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['paystack_reference']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"Donation - ₦{self.amount_naira} - {self.donor_email}"


class WithdrawalRequest(models.Model):
    """
    Handles withdrawal requests from mothers
    Admin approval required before processing
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending Admin Approval'),
        ('APPROVED', 'Approved'),
        ('PROCESSING', 'Processing Payment'),
        ('COMPLETED', 'Completed'),
        ('REJECTED', 'Rejected'),
        ('FAILED', 'Failed'),
    ]

    # User and amount
    user_wallet = models.ForeignKey(UserWallet, on_delete=models.CASCADE, related_name='withdrawal_requests')
    token_amount = models.IntegerField(help_text="Amount of BLOOM tokens to withdraw")
    naira_amount = models.DecimalField(max_digits=10, decimal_places=2, help_text="Naira equivalent")

    # Bank details (for payment)
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=20)
    account_name = models.CharField(max_length=100)

    # Payment provider details
    payment_provider = models.CharField(max_length=50, default='OPay', choices=[
        ('OPay', 'OPay'),
        ('Paystack', 'Paystack'),
        ('Manual', 'Manual Bank Transfer'),
    ])
    payment_reference = models.CharField(max_length=100, null=True, blank=True, help_text="Payment provider transaction reference")

    # Blockchain burn transaction
    burn_tx_hash = models.CharField(max_length=66, null=True, blank=True, help_text="Hash of token burn transaction")
    burn_confirmed = models.BooleanField(default=False)

    # Withdrawal recording transaction
    withdrawal_tx_hash = models.CharField(max_length=66, null=True, blank=True, help_text="Hash of withdrawal recording tx")
    withdrawal_recorded = models.BooleanField(default=False)

    # Status and approval
    status = models.CharField(max_length=20, default='PENDING', choices=STATUS_CHOICES)
    admin_notes = models.TextField(blank=True, help_text="Admin notes/rejection reason")
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_withdrawals')

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Withdrawal Request"
        verbose_name_plural = "Withdrawal Requests"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', '-created_at']),
            models.Index(fields=['user_wallet', '-created_at']),
        ]

    def __str__(self):
        return f"Withdrawal - {self.token_amount} BLOOM - {self.status} - {self.user_wallet.user.username}"

    def save(self, *args, **kwargs):
        # Auto-calculate naira amount (1 BLOOM = ₦2)
        if self.token_amount and not self.naira_amount:
            self.naira_amount = self.token_amount * 2
        super().save(*args, **kwargs)
