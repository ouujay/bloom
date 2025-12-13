# Token & Donation System - FULL IMPLEMENTATION FOR CLAUDE CODE

## OVERVIEW

**Token Value Formula:**
```
TOKEN_VALUE = POOL_BALANCE ÷ TOKENS_IN_CIRCULATION

Example:
- Pool: ₦1,000,000
- Tokens in circulation: 50,000
- Token value: ₦20 per token
- User with 500 tokens = ₦10,000
```

**Minimum Withdrawal:** 200 tokens

---

# BACKEND IMPLEMENTATION

---

## FILE 1: Models

**File: `backend/apps/tokens/models.py`**

```python
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
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='withdrawal_requests')
    
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
```

---

## FILE 2: Services

**File: `backend/apps/tokens/services.py`**

```python
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum
from .models import DonationPool, Donation, TokenTransaction, WithdrawalRequest


class TokenService:
    MINIMUM_WITHDRAWAL = 200
    
    @staticmethod
    def get_pool_info():
        pool = DonationPool.get_pool()
        return {
            'pool_balance_naira': float(pool.pool_balance),
            'total_tokens_issued': float(pool.total_tokens_issued),
            'total_tokens_withdrawn': float(pool.total_tokens_withdrawn),
            'tokens_in_circulation': float(pool.tokens_in_circulation),
            'token_value_naira': float(pool.token_value_naira),
        }
    
    @staticmethod
    def get_user_balance(user):
        result = TokenTransaction.objects.filter(user=user).aggregate(total=Sum('amount'))
        return Decimal(result['total'] or 0)
    
    @staticmethod
    def get_user_balance_naira(user):
        balance = TokenService.get_user_balance(user)
        pool = DonationPool.get_pool()
        return balance * pool.token_value_naira
    
    @staticmethod
    @transaction.atomic
    def award_tokens(user, amount, source, description, reference_id=None, reference_type=''):
        amount = Decimal(str(amount))
        current_balance = TokenService.get_user_balance(user)
        new_balance = current_balance + amount
        
        txn = TokenTransaction.objects.create(
            user=user,
            transaction_type='earn',
            amount=amount,
            balance_after=new_balance,
            source=source,
            description=description,
            reference_id=reference_id,
            reference_type=reference_type,
        )
        
        pool = DonationPool.get_pool()
        pool.total_tokens_issued += amount
        pool.save()
        
        return txn
    
    @staticmethod
    @transaction.atomic
    def deduct_tokens(user, amount, source, description, reference_id=None):
        amount = Decimal(str(amount))
        current_balance = TokenService.get_user_balance(user)
        
        if current_balance < amount:
            raise ValueError("Insufficient token balance")
        
        new_balance = current_balance - amount
        
        txn = TokenTransaction.objects.create(
            user=user,
            transaction_type='withdraw',
            amount=-amount,
            balance_after=new_balance,
            source=source,
            description=description,
            reference_id=reference_id,
            reference_type='withdrawal',
        )
        
        pool = DonationPool.get_pool()
        pool.total_tokens_withdrawn += amount
        pool.save()
        
        return txn
    
    @staticmethod
    def get_user_transactions(user, limit=50):
        return TokenTransaction.objects.filter(user=user)[:limit]


class DonationService:
    @staticmethod
    def create_donation(amount_naira, donor_name='', donor_email='', donor_phone='', 
                       is_anonymous=False, payment_reference='', payment_method='bank_transfer'):
        return Donation.objects.create(
            amount_naira=Decimal(str(amount_naira)),
            donor_name=donor_name,
            donor_email=donor_email,
            donor_phone=donor_phone,
            is_anonymous=is_anonymous,
            payment_reference=payment_reference,
            payment_method=payment_method,
            status='pending',
        )
    
    @staticmethod
    @transaction.atomic
    def confirm_donation(donation_id):
        donation = Donation.objects.select_for_update().get(id=donation_id)
        
        if donation.status == 'confirmed':
            return donation, False
        
        donation.status = 'confirmed'
        donation.confirmed_at = timezone.now()
        donation.save()
        
        pool = DonationPool.get_pool()
        pool.pool_balance += donation.amount_naira
        pool.save()
        
        return donation, True
    
    @staticmethod
    def get_recent_donations(limit=10):
        return Donation.objects.filter(status='confirmed').order_by('-confirmed_at')[:limit]


class WithdrawalService:
    MINIMUM_TOKENS = 200
    
    @staticmethod
    def create_withdrawal_request(user, token_amount, bank_name, account_number, 
                                  account_name, verification_photo=''):
        token_amount = Decimal(str(token_amount))
        
        if token_amount < WithdrawalService.MINIMUM_TOKENS:
            raise ValueError(f"Minimum withdrawal is {WithdrawalService.MINIMUM_TOKENS} tokens")
        
        balance = TokenService.get_user_balance(user)
        if balance < token_amount:
            raise ValueError("Insufficient token balance")
        
        pending = WithdrawalRequest.objects.filter(
            user=user,
            status__in=['pending', 'approved', 'processing']
        ).exists()
        if pending:
            raise ValueError("You have a pending withdrawal request")
        
        pool = DonationPool.get_pool()
        token_value = pool.token_value_naira
        naira_amount = token_amount * token_value
        
        return WithdrawalRequest.objects.create(
            user=user,
            token_amount=token_amount,
            naira_amount=naira_amount,
            token_value_at_request=token_value,
            bank_name=bank_name,
            account_number=account_number,
            account_name=account_name,
            verification_photo=verification_photo,
            status='pending',
        )
    
    @staticmethod
    @transaction.atomic
    def approve_withdrawal(withdrawal_id, admin_user):
        withdrawal = WithdrawalRequest.objects.select_for_update().get(id=withdrawal_id)
        
        if withdrawal.status != 'pending':
            raise ValueError(f"Cannot approve withdrawal with status: {withdrawal.status}")
        
        balance = TokenService.get_user_balance(withdrawal.user)
        if balance < withdrawal.token_amount:
            raise ValueError("User no longer has sufficient balance")
        
        TokenService.deduct_tokens(
            user=withdrawal.user,
            amount=withdrawal.token_amount,
            source='withdrawal',
            description=f"Withdrawal of {withdrawal.token_amount} tokens",
            reference_id=withdrawal.id,
        )
        
        pool = DonationPool.get_pool()
        pool.pool_balance -= withdrawal.naira_amount
        pool.save()
        
        withdrawal.status = 'approved'
        withdrawal.reviewed_by = admin_user
        withdrawal.reviewed_at = timezone.now()
        withdrawal.save()
        
        return withdrawal
    
    @staticmethod
    def reject_withdrawal(withdrawal_id, admin_user, reason):
        withdrawal = WithdrawalRequest.objects.get(id=withdrawal_id)
        
        if withdrawal.status != 'pending':
            raise ValueError(f"Cannot reject withdrawal with status: {withdrawal.status}")
        
        withdrawal.status = 'rejected'
        withdrawal.reviewed_by = admin_user
        withdrawal.reviewed_at = timezone.now()
        withdrawal.rejection_reason = reason
        withdrawal.save()
        
        return withdrawal
    
    @staticmethod
    def mark_as_paid(withdrawal_id, payment_reference):
        withdrawal = WithdrawalRequest.objects.get(id=withdrawal_id)
        
        if withdrawal.status != 'approved':
            raise ValueError("Withdrawal must be approved first")
        
        withdrawal.status = 'completed'
        withdrawal.payment_reference = payment_reference
        withdrawal.paid_at = timezone.now()
        withdrawal.save()
        
        return withdrawal
    
    @staticmethod
    def get_pending_withdrawals():
        return WithdrawalRequest.objects.filter(status='pending').order_by('created_at')
    
    @staticmethod
    def get_user_withdrawals(user):
        return WithdrawalRequest.objects.filter(user=user).order_by('-created_at')
```

---

## FILE 3: Views

**File: `backend/apps/tokens/views.py`**

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import DonationPool, Donation, TokenTransaction, WithdrawalRequest
from .services import TokenService, DonationService, WithdrawalService


# ===== PUBLIC =====

@api_view(['GET'])
@permission_classes([AllowAny])
def pool_info(request):
    info = TokenService.get_pool_info()
    return Response(info)


@api_view(['GET'])
@permission_classes([AllowAny])
def recent_donations(request):
    donations = DonationService.get_recent_donations(limit=10)
    data = [{
        'id': str(d.id),
        'donor_name': 'Anonymous' if d.is_anonymous else (d.donor_name or 'Supporter'),
        'amount_naira': float(d.amount_naira),
        'confirmed_at': d.confirmed_at,
    } for d in donations]
    return Response(data)


@api_view(['POST'])
@permission_classes([AllowAny])
def create_donation(request):
    data = request.data
    try:
        donation = DonationService.create_donation(
            amount_naira=data.get('amount'),
            donor_name=data.get('donor_name', ''),
            donor_email=data.get('donor_email', ''),
            donor_phone=data.get('donor_phone', ''),
            is_anonymous=data.get('is_anonymous', False),
            payment_reference=data.get('payment_reference', ''),
            payment_method=data.get('payment_method', 'bank_transfer'),
        )
        return Response({
            'success': True,
            'donation_id': str(donation.id),
            'amount': float(donation.amount_naira),
            'status': donation.status,
        }, status=201)
    except Exception as e:
        return Response({'error': str(e)}, status=400)


# ===== USER =====

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_wallet(request):
    user = request.user
    pool = DonationPool.get_pool()
    balance = TokenService.get_user_balance(user)
    balance_naira = balance * pool.token_value_naira
    
    return Response({
        'token_balance': float(balance),
        'naira_value': float(balance_naira),
        'token_value_naira': float(pool.token_value_naira),
        'minimum_withdrawal': WithdrawalService.MINIMUM_TOKENS,
        'can_withdraw': balance >= WithdrawalService.MINIMUM_TOKENS,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_transactions(request):
    transactions = TokenService.get_user_transactions(request.user, limit=50)
    data = [{
        'id': str(t.id),
        'type': t.transaction_type,
        'amount': float(t.amount),
        'balance_after': float(t.balance_after),
        'source': t.source,
        'description': t.description,
        'created_at': t.created_at,
    } for t in transactions]
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_withdrawal(request):
    data = request.data
    try:
        withdrawal = WithdrawalService.create_withdrawal_request(
            user=request.user,
            token_amount=data.get('token_amount'),
            bank_name=data.get('bank_name'),
            account_number=data.get('account_number'),
            account_name=data.get('account_name'),
            verification_photo=data.get('verification_photo', ''),
        )
        return Response({
            'success': True,
            'withdrawal_id': str(withdrawal.id),
            'token_amount': float(withdrawal.token_amount),
            'naira_amount': float(withdrawal.naira_amount),
            'status': withdrawal.status,
        }, status=201)
    except ValueError as e:
        return Response({'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_withdrawals(request):
    withdrawals = WithdrawalService.get_user_withdrawals(request.user)
    data = [{
        'id': str(w.id),
        'token_amount': float(w.token_amount),
        'naira_amount': float(w.naira_amount),
        'bank_name': w.bank_name,
        'account_number': w.account_number[-4:].rjust(len(w.account_number), '*'),
        'status': w.status,
        'rejection_reason': w.rejection_reason,
        'created_at': w.created_at,
        'paid_at': w.paid_at,
    } for w in withdrawals]
    return Response(data)


# ===== ADMIN =====

@api_view(['POST'])
@permission_classes([IsAdminUser])
def confirm_donation(request, donation_id):
    try:
        donation, was_confirmed = DonationService.confirm_donation(donation_id)
        return Response({
            'success': was_confirmed,
            'message': f'Donation of ₦{donation.amount_naira:,.2f} confirmed' if was_confirmed else 'Already confirmed',
        })
    except Donation.DoesNotExist:
        return Response({'error': 'Donation not found'}, status=404)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_pending_withdrawals(request):
    withdrawals = WithdrawalService.get_pending_withdrawals()
    data = [{
        'id': str(w.id),
        'user_id': str(w.user.id),
        'user_name': f"{w.user.first_name} {w.user.last_name}",
        'user_email': w.user.email,
        'user_phone': getattr(w.user, 'phone_number', ''),
        'token_amount': float(w.token_amount),
        'naira_amount': float(w.naira_amount),
        'bank_name': w.bank_name,
        'account_number': w.account_number,
        'account_name': w.account_name,
        'verification_photo': w.verification_photo,
        'created_at': w.created_at,
    } for w in withdrawals]
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_approve_withdrawal(request, withdrawal_id):
    try:
        withdrawal = WithdrawalService.approve_withdrawal(withdrawal_id, request.user)
        return Response({
            'success': True,
            'message': f'Approved. Send ₦{withdrawal.naira_amount:,.2f} to {withdrawal.account_name}',
            'bank_name': withdrawal.bank_name,
            'account_number': withdrawal.account_number,
            'account_name': withdrawal.account_name,
            'naira_amount': float(withdrawal.naira_amount),
        })
    except ValueError as e:
        return Response({'error': str(e)}, status=400)
    except WithdrawalRequest.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_reject_withdrawal(request, withdrawal_id):
    reason = request.data.get('reason', 'Verification failed')
    try:
        WithdrawalService.reject_withdrawal(withdrawal_id, request.user, reason)
        return Response({'success': True, 'message': 'Rejected'})
    except ValueError as e:
        return Response({'error': str(e)}, status=400)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_mark_paid(request, withdrawal_id):
    payment_reference = request.data.get('payment_reference', '')
    try:
        WithdrawalService.mark_as_paid(withdrawal_id, payment_reference)
        return Response({'success': True, 'message': 'Marked as paid'})
    except ValueError as e:
        return Response({'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_pending_donations(request):
    donations = Donation.objects.filter(status='pending').order_by('-created_at')
    data = [{
        'id': str(d.id),
        'donor_name': d.donor_name or 'Anonymous',
        'donor_email': d.donor_email,
        'donor_phone': d.donor_phone,
        'amount_naira': float(d.amount_naira),
        'payment_reference': d.payment_reference,
        'created_at': d.created_at,
    } for d in donations]
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_pool_stats(request):
    pool = DonationPool.get_pool()
    from django.db.models import Sum, Count
    
    donation_total = Donation.objects.filter(status='confirmed').aggregate(
        total=Sum('amount_naira'), count=Count('id')
    )
    withdrawal_total = WithdrawalRequest.objects.filter(status='completed').aggregate(
        tokens=Sum('token_amount'), naira=Sum('naira_amount'), count=Count('id')
    )
    
    return Response({
        'pool_balance_naira': float(pool.pool_balance),
        'tokens_in_circulation': float(pool.tokens_in_circulation),
        'token_value_naira': float(pool.token_value_naira),
        'total_donated': float(donation_total['total'] or 0),
        'total_donations': donation_total['count'] or 0,
        'total_withdrawn_naira': float(withdrawal_total['naira'] or 0),
        'total_withdrawals': withdrawal_total['count'] or 0,
    })
```

---

## FILE 4: URLs

**File: `backend/apps/tokens/urls.py`**

```python
from django.urls import path
from . import views

urlpatterns = [
    # Public
    path('pool/', views.pool_info, name='pool_info'),
    path('donations/recent/', views.recent_donations, name='recent_donations'),
    path('donations/create/', views.create_donation, name='create_donation'),
    
    # User
    path('wallet/', views.my_wallet, name='my_wallet'),
    path('transactions/', views.my_transactions, name='my_transactions'),
    path('withdraw/', views.request_withdrawal, name='request_withdrawal'),
    path('withdrawals/', views.my_withdrawals, name='my_withdrawals'),
    
    # Admin
    path('admin/donations/pending/', views.admin_pending_donations, name='admin_pending_donations'),
    path('admin/donations/<uuid:donation_id>/confirm/', views.confirm_donation, name='confirm_donation'),
    path('admin/withdrawals/pending/', views.admin_pending_withdrawals, name='admin_pending_withdrawals'),
    path('admin/withdrawals/<uuid:withdrawal_id>/approve/', views.admin_approve_withdrawal, name='admin_approve_withdrawal'),
    path('admin/withdrawals/<uuid:withdrawal_id>/reject/', views.admin_reject_withdrawal, name='admin_reject_withdrawal'),
    path('admin/withdrawals/<uuid:withdrawal_id>/paid/', views.admin_mark_paid, name='admin_mark_paid'),
    path('admin/stats/', views.admin_pool_stats, name='admin_pool_stats'),
]
```

**Add to `backend/config/urls.py`:**
```python
path('api/tokens/', include('apps.tokens.urls')),
```

---

## RUN MIGRATIONS

```bash
python manage.py makemigrations tokens
python manage.py migrate
```

---

# FRONTEND IMPLEMENTATION

---

## FILE 5: Token API Service

**File: `frontend/src/services/tokenApi.js`**

```javascript
import api from './api';

export const tokenApi = {
  getPoolInfo: () => api.get('/tokens/pool/'),
  getRecentDonations: () => api.get('/tokens/donations/recent/'),
  createDonation: (data) => api.post('/tokens/donations/create/', data),
  
  getWallet: () => api.get('/tokens/wallet/'),
  getTransactions: () => api.get('/tokens/transactions/'),
  requestWithdrawal: (data) => api.post('/tokens/withdraw/', data),
  getMyWithdrawals: () => api.get('/tokens/withdrawals/'),
  
  getPendingDonations: () => api.get('/tokens/admin/donations/pending/'),
  confirmDonation: (id) => api.post(`/tokens/admin/donations/${id}/confirm/`),
  getPendingWithdrawals: () => api.get('/tokens/admin/withdrawals/pending/'),
  approveWithdrawal: (id) => api.post(`/tokens/admin/withdrawals/${id}/approve/`),
  rejectWithdrawal: (id, reason) => api.post(`/tokens/admin/withdrawals/${id}/reject/`, { reason }),
  markWithdrawalPaid: (id, ref) => api.post(`/tokens/admin/withdrawals/${id}/paid/`, { payment_reference: ref }),
  getPoolStats: () => api.get('/tokens/admin/stats/'),
};

export default tokenApi;
```

---

## FILE 6: User Wallet Page

**File: `frontend/src/pages/mother/Wallet.jsx`**

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import tokenApi from '../../services/tokenApi';

export default function Wallet() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [walletRes, txnRes, withdrawRes] = await Promise.all([
        tokenApi.getWallet(),
        tokenApi.getTransactions(),
        tokenApi.getMyWithdrawals(),
      ]);
      setWallet(walletRes.data);
      setTransactions(txnRes.data);
      setWithdrawals(withdrawRes.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const formatNaira = (amt) => `₦${Number(amt).toLocaleString()}`;
  const formatDate = (d) => new Date(d).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-bold mb-6">My Wallet</h1>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white mb-6">
        <p className="text-purple-200 text-sm">Token Balance</p>
        <p className="text-4xl font-bold">{wallet?.token_balance?.toLocaleString() || 0} <span className="text-lg">tokens</span></p>
        
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-purple-200 text-sm">Naira Value</p>
          <p className="text-2xl font-semibold">{formatNaira(wallet?.naira_value || 0)}</p>
          <p className="text-purple-200 text-xs mt-1">@ {formatNaira(wallet?.token_value_naira || 0)} per token</p>
        </div>

        <button
          onClick={() => navigate('/mother/withdraw')}
          disabled={!wallet?.can_withdraw}
          className={`mt-6 w-full py-3 rounded-xl font-semibold ${wallet?.can_withdraw ? 'bg-white text-purple-600' : 'bg-white/20 text-white/60 cursor-not-allowed'}`}
        >
          {wallet?.can_withdraw ? 'Withdraw Tokens' : `Min ${wallet?.minimum_withdrawal} tokens to withdraw`}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('transactions')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'transactions' ? 'bg-purple-600 text-white' : 'bg-white'}`}>Transactions</button>
        <button onClick={() => setActiveTab('withdrawals')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'withdrawals' ? 'bg-purple-600 text-white' : 'bg-white'}`}>Withdrawals</button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm">
        {activeTab === 'transactions' ? (
          <div className="divide-y">
            {transactions.length === 0 ? (
              <p className="p-4 text-center text-gray-500">No transactions yet</p>
            ) : transactions.map((t) => (
              <div key={t.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{t.description}</p>
                  <p className="text-sm text-gray-500">{formatDate(t.created_at)}</p>
                </div>
                <span className={`font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {t.amount > 0 ? '+' : ''}{t.amount}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y">
            {withdrawals.length === 0 ? (
              <p className="p-4 text-center text-gray-500">No withdrawals yet</p>
            ) : withdrawals.map((w) => (
              <div key={w.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{w.token_amount} tokens → {formatNaira(w.naira_amount)}</p>
                    <p className="text-sm text-gray-500">{w.bank_name} - {w.account_number}</p>
                    <p className="text-xs text-gray-400">{formatDate(w.created_at)}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    w.status === 'completed' ? 'bg-green-100 text-green-700' :
                    w.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    w.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{w.status}</span>
                </div>
                {w.rejection_reason && <p className="mt-2 text-sm text-red-600">Reason: {w.rejection_reason}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## FILE 7: Withdraw Page

**File: `frontend/src/pages/mother/Withdraw.jsx`**

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import tokenApi from '../../services/tokenApi';

const BANKS = ['Access Bank', 'GTBank', 'First Bank', 'UBA', 'Zenith Bank', 'Kuda', 'OPay', 'PalmPay', 'Moniepoint'];

export default function Withdraw() {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    token_amount: '',
    bank_name: '',
    account_number: '',
    account_name: '',
    verification_photo: '',
  });

  useEffect(() => {
    tokenApi.getWallet().then(res => {
      setWallet(res.data);
      setLoading(false);
    });
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const nairaValue = wallet && form.token_amount 
    ? (Number(form.token_amount) * wallet.token_value_naira).toFixed(2) 
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await tokenApi.requestWithdrawal(form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="bg-white rounded-xl p-8 text-center max-w-md">
          <span className="text-5xl">✅</span>
          <h1 className="text-2xl font-bold mt-4">Request Submitted!</h1>
          <p className="text-gray-600 mt-2">Your withdrawal is pending approval. We'll notify you once it's processed.</p>
          <button onClick={() => navigate('/mother/wallet')} className="mt-6 bg-purple-600 text-white px-6 py-2 rounded-lg">Back to Wallet</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <button onClick={() => navigate('/mother/wallet')} className="text-purple-600 mb-4">← Back</button>
      
      <h1 className="text-2xl font-bold mb-2">Withdraw Tokens</h1>
      <p className="text-gray-600 mb-6">Convert your tokens to Naira</p>

      {/* Balance */}
      <div className="bg-purple-50 rounded-xl p-4 mb-6">
        <p className="text-sm text-purple-600">Available Balance</p>
        <p className="text-2xl font-bold text-purple-800">{wallet.token_balance.toLocaleString()} tokens</p>
        <p className="text-sm text-purple-600">Min withdrawal: {wallet.minimum_withdrawal} tokens</p>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-1">Token Amount</label>
          <input
            type="number"
            name="token_amount"
            value={form.token_amount}
            onChange={handleChange}
            min={wallet.minimum_withdrawal}
            max={wallet.token_balance}
            className="w-full border rounded-lg px-4 py-2"
            required
          />
          {form.token_amount && (
            <p className="text-sm text-green-600 mt-1">= ₦{Number(nairaValue).toLocaleString()}</p>
          )}
        </div>

        {/* Bank */}
        <div>
          <label className="block text-sm font-medium mb-1">Bank</label>
          <select name="bank_name" value={form.bank_name} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" required>
            <option value="">Select bank</option>
            {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Account Number */}
        <div>
          <label className="block text-sm font-medium mb-1">Account Number</label>
          <input type="text" name="account_number" value={form.account_number} onChange={handleChange} maxLength={10} className="w-full border rounded-lg px-4 py-2" required />
        </div>

        {/* Account Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Account Name</label>
          <input type="text" name="account_name" value={form.account_name} onChange={handleChange} className="w-full border rounded-lg px-4 py-2" required />
        </div>

        {/* Verification Photo */}
        <div>
          <label className="block text-sm font-medium mb-1">Verification Photo (URL)</label>
          <input type="url" name="verification_photo" value={form.verification_photo} onChange={handleChange} placeholder="Upload belly photo and paste URL" className="w-full border rounded-lg px-4 py-2" />
          <p className="text-xs text-gray-500 mt-1">Upload a photo showing your pregnancy for verification</p>
        </div>

        <button type="submit" disabled={submitting} className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit Withdrawal Request'}
        </button>
      </form>
    </div>
  );
}
```

---

## FILE 8: Admin Token Dashboard

**File: `frontend/src/pages/admin/TokenAdmin.jsx`**

```jsx
import React, { useState, useEffect } from 'react';
import tokenApi from '../../services/tokenApi';

export default function TokenAdmin() {
  const [stats, setStats] = useState(null);
  const [pendingDonations, setPendingDonations] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [activeTab, setActiveTab] = useState('withdrawals');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, donationsRes, withdrawalsRes] = await Promise.all([
        tokenApi.getPoolStats(),
        tokenApi.getPendingDonations(),
        tokenApi.getPendingWithdrawals(),
      ]);
      setStats(statsRes.data);
      setPendingDonations(donationsRes.data);
      setPendingWithdrawals(withdrawalsRes.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleConfirmDonation = async (id) => {
    if (!confirm('Confirm this donation?')) return;
    await tokenApi.confirmDonation(id);
    loadData();
  };

  const handleApproveWithdrawal = async (id) => {
    if (!confirm('Approve this withdrawal?')) return;
    const res = await tokenApi.approveWithdrawal(id);
    alert(`Approved! Send ${res.data.naira_amount} to ${res.data.account_name} at ${res.data.bank_name} - ${res.data.account_number}`);
    loadData();
  };

  const handleRejectWithdrawal = async (id) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    await tokenApi.rejectWithdrawal(id, reason);
    loadData();
  };

  const handleMarkPaid = async (id) => {
    const ref = prompt('Payment reference:');
    await tokenApi.markWithdrawalPaid(id, ref || '');
    loadData();
  };

  const formatNaira = (amt) => `₦${Number(amt).toLocaleString()}`;

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Token Administration</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-gray-500 text-sm">Pool Balance</p>
          <p className="text-2xl font-bold text-green-600">{formatNaira(stats?.pool_balance_naira || 0)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-gray-500 text-sm">Tokens in Circulation</p>
          <p className="text-2xl font-bold">{stats?.tokens_in_circulation?.toLocaleString() || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-gray-500 text-sm">Token Value</p>
          <p className="text-2xl font-bold text-purple-600">{formatNaira(stats?.token_value_naira || 0)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-gray-500 text-sm">Total Donated</p>
          <p className="text-2xl font-bold">{formatNaira(stats?.total_donated || 0)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setActiveTab('withdrawals')} className={`px-4 py-2 rounded-lg ${activeTab === 'withdrawals' ? 'bg-purple-600 text-white' : 'bg-white'}`}>
          Pending Withdrawals ({pendingWithdrawals.length})
        </button>
        <button onClick={() => setActiveTab('donations')} className={`px-4 py-2 rounded-lg ${activeTab === 'donations' ? 'bg-purple-600 text-white' : 'bg-white'}`}>
          Pending Donations ({pendingDonations.length})
        </button>
      </div>

      {/* Withdrawals */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-xl shadow-sm">
          {pendingWithdrawals.length === 0 ? (
            <p className="p-4 text-center text-gray-500">No pending withdrawals</p>
          ) : pendingWithdrawals.map((w) => (
            <div key={w.id} className="p-4 border-b">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{w.user_name}</p>
                  <p className="text-sm text-gray-500">{w.user_email} • {w.user_phone}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{w.token_amount} tokens</p>
                  <p className="text-green-600">{formatNaira(w.naira_amount)}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded p-2 mb-3 text-sm">
                <p><strong>Bank:</strong> {w.bank_name}</p>
                <p><strong>Account:</strong> {w.account_number}</p>
                <p><strong>Name:</strong> {w.account_name}</p>
              </div>
              {w.verification_photo && (
                <a href={w.verification_photo} target="_blank" className="text-blue-600 text-sm">View Verification Photo</a>
              )}
              <div className="flex gap-2 mt-3">
                <button onClick={() => handleApproveWithdrawal(w.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">Approve</button>
                <button onClick={() => handleRejectWithdrawal(w.id)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Donations */}
      {activeTab === 'donations' && (
        <div className="bg-white rounded-xl shadow-sm">
          {pendingDonations.length === 0 ? (
            <p className="p-4 text-center text-gray-500">No pending donations</p>
          ) : pendingDonations.map((d) => (
            <div key={d.id} className="p-4 border-b flex justify-between items-center">
              <div>
                <p className="font-semibold">{d.donor_name || 'Anonymous'}</p>
                <p className="text-sm text-gray-500">{d.donor_email} • Ref: {d.payment_reference}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="font-bold text-lg">{formatNaira(d.amount_naira)}</p>
                <button onClick={() => handleConfirmDonation(d.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm">Confirm</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## FILE 9: Donation Page (Public)

**File: `frontend/src/pages/Donate.jsx`**

```jsx
import React, { useState, useEffect } from 'react';
import tokenApi from '../services/tokenApi';

export default function Donate() {
  const [pool, setPool] = useState(null);
  const [recentDonations, setRecentDonations] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    amount: '',
    donor_name: '',
    donor_email: '',
    donor_phone: '',
    is_anonymous: false,
    payment_reference: '',
  });

  useEffect(() => {
    tokenApi.getPoolInfo().then(res => setPool(res.data));
    tokenApi.getRecentDonations().then(res => setRecentDonations(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await tokenApi.createDonation(form);
    setSubmitted(true);
  };

  const formatNaira = (amt) => `₦${Number(amt).toLocaleString()}`;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <span className="text-5xl">🙏</span>
          <h1 className="text-2xl font-bold mt-4">Thank You!</h1>
          <p className="text-gray-600 mt-2">Your donation is pending confirmation. Once we verify payment, it will be added to the pool.</p>
          <p className="mt-4 text-sm text-gray-500">Reference: {form.payment_reference}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-600 to-blue-600 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white text-center mb-2">Support Mothers</h1>
        <p className="text-purple-200 text-center mb-8">Your donation helps pregnant mothers earn rewards for healthy behaviors</p>

        {/* Pool Stats */}
        <div className="bg-white/10 backdrop-blur rounded-xl p-4 mb-6 text-white">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-purple-200 text-sm">Current Pool</p>
              <p className="text-2xl font-bold">{formatNaira(pool?.pool_balance_naira || 0)}</p>
            </div>
            <div>
              <p className="text-purple-200 text-sm">Token Value</p>
              <p className="text-2xl font-bold">{formatNaira(pool?.token_value_naira || 0)}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-lg mb-4">Make a Donation</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount (₦)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} className="w-full border rounded-lg px-4 py-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Your Name</label>
              <input type="text" value={form.donor_name} onChange={(e) => setForm({...form, donor_name: e.target.value})} className="w-full border rounded-lg px-4 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input type="email" value={form.donor_email} onChange={(e) => setForm({...form, donor_email: e.target.value})} className="w-full border rounded-lg px-4 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Payment Reference</label>
              <input type="text" value={form.payment_reference} onChange={(e) => setForm({...form, payment_reference: e.target.value})} placeholder="Transfer reference" className="w-full border rounded-lg px-4 py-2" />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.is_anonymous} onChange={(e) => setForm({...form, is_anonymous: e.target.checked})} />
              <span className="text-sm">Donate anonymously</span>
            </label>
            <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold">Submit Donation</button>
          </form>
        </div>

        {/* Recent Donations */}
        <div className="bg-white rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4">Recent Donations</h2>
          {recentDonations.map((d, i) => (
            <div key={i} className="flex justify-between py-2 border-b last:border-0">
              <span className="text-gray-600">{d.donor_name}</span>
              <span className="font-semibold">{formatNaira(d.amount_naira)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## FILE 10: Add Routes

**File: `frontend/src/App.jsx`**

Add these routes:

```jsx
import Wallet from './pages/mother/Wallet';
import Withdraw from './pages/mother/Withdraw';
import Donate from './pages/Donate';
import TokenAdmin from './pages/admin/TokenAdmin';

// In Routes:
<Route path="/mother/wallet" element={<Wallet />} />
<Route path="/mother/withdraw" element={<Withdraw />} />
<Route path="/donate" element={<Donate />} />
<Route path="/admin/tokens" element={<TokenAdmin />} />
```

---

## API ENDPOINTS SUMMARY

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tokens/pool/` | Public | Get pool info & token value |
| GET | `/api/tokens/donations/recent/` | Public | Recent donations |
| POST | `/api/tokens/donations/create/` | Public | Create donation |
| GET | `/api/tokens/wallet/` | User | User's wallet info |
| GET | `/api/tokens/transactions/` | User | Transaction history |
| POST | `/api/tokens/withdraw/` | User | Request withdrawal |
| GET | `/api/tokens/withdrawals/` | User | User's withdrawals |
| GET | `/api/tokens/admin/donations/pending/` | Admin | Pending donations |
| POST | `/api/tokens/admin/donations/{id}/confirm/` | Admin | Confirm donation |
| GET | `/api/tokens/admin/withdrawals/pending/` | Admin | Pending withdrawals |
| POST | `/api/tokens/admin/withdrawals/{id}/approve/` | Admin | Approve withdrawal |
| POST | `/api/tokens/admin/withdrawals/{id}/reject/` | Admin | Reject withdrawal |
| POST | `/api/tokens/admin/withdrawals/{id}/paid/` | Admin | Mark as paid |
| GET | `/api/tokens/admin/stats/` | Admin | Pool statistics |
