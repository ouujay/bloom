# Blockchain Integration - Connect Token System to Blockchain API

## THE FLOW

```
┌─────────────────────────────────────────────────────────────────┐
│                     DONATION FLOW                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Donor donates via Alat/OPay/Bank Transfer                  │
│                    ↓                                            │
│  2. Admin confirms in your system (confirm_donation)           │
│                    ↓                                            │
│  3. Your system calls blockchain API:                          │
│     POST /api/donations/record/                                 │
│                    ↓                                            │
│  4. Blockchain records donation permanently                     │
│                    ↓                                            │
│  5. Etherscan link returned! 🎉                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    WITHDRAWAL FLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User requests withdrawal (your system)                     │
│                    ↓                                            │
│  2. Admin approves & pays Naira to user                        │
│                    ↓                                            │
│  3. Your system calls blockchain API:                          │
│     POST /api/admin/withdrawals/{id}/approve/                  │
│                    ↓                                            │
│  4. Blockchain BURNS tokens (reduces supply)                   │
│                    ↓                                            │
│  5. Transaction recorded on Etherscan! ✅                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    TOKEN EARNING FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. User completes task (lesson, checkin, etc.)                │
│                    ↓                                            │
│  2. Your system calls blockchain API:                          │
│     POST /api/tokens/mint/                                     │
│                    ↓                                            │
│  3. Blockchain MINTS new tokens to user's wallet               │
│                    ↓                                            │
│  4. Transaction recorded on Etherscan! ✅                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## FILE 1: Blockchain API Service

**File: `backend/apps/tokens/blockchain_api.py`**

```python
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# Blockchain API base URL (Developer A's server)
BLOCKCHAIN_API_URL = getattr(settings, 'BLOCKCHAIN_API_URL', 'http://localhost:8000/api')


class BlockchainAPI:
    """
    Service to communicate with blockchain layer (Developer A's API)
    """
    
    @staticmethod
    def record_donation(donor_email, donor_name, amount_naira, reference):
        """
        Record a donation on the blockchain.
        Call this AFTER confirming payment was received.
        
        Returns:
            {
                'success': True,
                'tx_hash': '0x...',
                'explorer_url': 'https://sepolia.etherscan.io/tx/0x...',
                'block_number': 1234567
            }
        """
        try:
            response = requests.post(
                f"{BLOCKCHAIN_API_URL}/donations/record/",
                json={
                    'donor_email': donor_email,
                    'donor_name': donor_name,
                    'amount_naira': float(amount_naira),
                    'reference': reference
                },
                timeout=30  # Blockchain can be slow
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                logger.info(f"Donation recorded on blockchain: {data.get('blockchain', {}).get('tx_hash')}")
                return {
                    'success': True,
                    'tx_hash': data.get('blockchain', {}).get('tx_hash'),
                    'explorer_url': data.get('blockchain', {}).get('explorer_url'),
                    'block_number': data.get('blockchain', {}).get('block_number'),
                }
            else:
                logger.error(f"Blockchain API error: {response.text}")
                return {'success': False, 'error': response.text}
                
        except requests.exceptions.Timeout:
            logger.error("Blockchain API timeout")
            return {'success': False, 'error': 'Blockchain API timeout', 'retry': True}
        except Exception as e:
            logger.error(f"Blockchain API exception: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def mint_tokens(user_wallet_address, action_type, action_id, auth_token=None):
        """
        Mint tokens to a user's wallet when they complete an action.
        
        action_type: signup, daily_lesson, daily_checkin, daily_task, 
                     weekly_quiz, health_checkin, video_watched, referral
        
        Returns:
            {
                'success': True,
                'tokens_earned': 50,
                'new_balance': 450,
                'tx_hash': '0x...',
                'explorer_url': 'https://sepolia.etherscan.io/tx/0x...'
            }
        """
        try:
            headers = {}
            if auth_token:
                headers['Authorization'] = f'Bearer {auth_token}'
            
            response = requests.post(
                f"{BLOCKCHAIN_API_URL}/tokens/mint/",
                json={
                    'action_type': action_type,
                    'action_id': str(action_id)
                },
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Tokens minted: {data.get('tokens_earned')} for action {action_type}")
                return {
                    'success': True,
                    'tokens_earned': data.get('tokens_earned'),
                    'new_balance': data.get('new_balance'),
                    'tx_hash': data.get('blockchain_tx'),
                    'explorer_url': data.get('explorer_url'),
                }
            else:
                return {'success': False, 'error': response.json().get('error', 'Unknown error')}
                
        except Exception as e:
            logger.error(f"Mint tokens exception: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_blockchain_balance(user_wallet_address, auth_token=None):
        """
        Get user's token balance directly from blockchain.
        """
        try:
            headers = {}
            if auth_token:
                headers['Authorization'] = f'Bearer {auth_token}'
            
            response = requests.get(
                f"{BLOCKCHAIN_API_URL}/tokens/balance/",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'balance': data.get('balance', 0),
                    'blockchain_balance': data.get('blockchain_balance', 0),
                }
            else:
                return {'success': False, 'error': 'Failed to get balance'}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def burn_tokens_for_withdrawal(withdrawal_id, auth_token=None):
        """
        Burn tokens when withdrawal is approved.
        This is called by the blockchain API when admin approves.
        """
        try:
            headers = {}
            if auth_token:
                headers['Authorization'] = f'Bearer {auth_token}'
            
            response = requests.post(
                f"{BLOCKCHAIN_API_URL}/admin/withdrawals/{withdrawal_id}/approve/",
                json={'payment_reference': f'WITHDRAW_{withdrawal_id}'},
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'tokens_burned': data.get('tokens_burned'),
                    'tx_hash': data.get('explorer_url', '').split('/')[-1],
                    'explorer_url': data.get('explorer_url'),
                }
            else:
                return {'success': False, 'error': response.json().get('error', 'Unknown error')}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
```

---

## FILE 2: Update Services to Call Blockchain

**File: `backend/apps/tokens/services.py`**

Add blockchain calls to existing services:

```python
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum
from .models import DonationPool, Donation, TokenTransaction, WithdrawalRequest
from .blockchain_api import BlockchainAPI


class TokenService:
    MINIMUM_WITHDRAWAL = 200
    
    # ... existing methods ...
    
    @staticmethod
    @transaction.atomic
    def award_tokens(user, amount, source, description, reference_id=None, reference_type=''):
        """Award tokens - also mints on blockchain if configured"""
        amount = Decimal(str(amount))
        current_balance = TokenService.get_user_balance(user)
        new_balance = current_balance + amount
        
        # Create local transaction record
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
        
        # Update pool
        pool = DonationPool.get_pool()
        pool.total_tokens_issued += amount
        pool.save()
        
        # === BLOCKCHAIN: Mint tokens ===
        # Map source to blockchain action_type
        action_type_map = {
            'signup': 'signup',
            'daily_lesson': 'module',
            'daily_checkin': 'daily_log',
            'daily_task': 'daily_log',
            'weekly_quiz': 'module',
            'health_checkin': 'daily_log',
            'video_watched': 'module',
            'referral': 'referral',
        }
        
        blockchain_action = action_type_map.get(source, 'daily_log')
        
        try:
            blockchain_result = BlockchainAPI.mint_tokens(
                user_wallet_address=getattr(user, 'wallet_address', None),
                action_type=blockchain_action,
                action_id=reference_id or txn.id,
            )
            
            if blockchain_result.get('success'):
                txn.blockchain_tx = blockchain_result.get('tx_hash', '')
                txn.explorer_url = blockchain_result.get('explorer_url', '')
                txn.save()
        except Exception as e:
            # Log but don't fail - local transaction still valid
            import logging
            logging.error(f"Blockchain mint failed: {e}")
        
        return txn


class DonationService:
    
    @staticmethod
    @transaction.atomic
    def confirm_donation(donation_id):
        """Confirm donation and record on blockchain"""
        donation = Donation.objects.select_for_update().get(id=donation_id)
        
        if donation.status == 'confirmed':
            return donation, False
        
        donation.status = 'confirmed'
        donation.confirmed_at = timezone.now()
        
        # Add to pool
        pool = DonationPool.get_pool()
        pool.pool_balance += donation.amount_naira
        pool.save()
        
        # === BLOCKCHAIN: Record donation ===
        try:
            blockchain_result = BlockchainAPI.record_donation(
                donor_email=donation.donor_email or 'anonymous@bloom.com',
                donor_name=donation.donor_name or 'Anonymous',
                amount_naira=float(donation.amount_naira),
                reference=donation.payment_reference or str(donation.id),
            )
            
            if blockchain_result.get('success'):
                donation.blockchain_tx = blockchain_result.get('tx_hash', '')
                donation.explorer_url = blockchain_result.get('explorer_url', '')
        except Exception as e:
            import logging
            logging.error(f"Blockchain donation record failed: {e}")
        
        donation.save()
        return donation, True


class WithdrawalService:
    
    @staticmethod
    @transaction.atomic
    def approve_withdrawal(withdrawal_id, admin_user):
        """Approve withdrawal and burn tokens on blockchain"""
        withdrawal = WithdrawalRequest.objects.select_for_update().get(id=withdrawal_id)
        
        if withdrawal.status != 'pending':
            raise ValueError(f"Cannot approve withdrawal with status: {withdrawal.status}")
        
        # Verify balance
        balance = TokenService.get_user_balance(withdrawal.user)
        if balance < withdrawal.token_amount:
            raise ValueError("User no longer has sufficient balance")
        
        # Deduct tokens locally
        TokenService.deduct_tokens(
            user=withdrawal.user,
            amount=withdrawal.token_amount,
            source='withdrawal',
            description=f"Withdrawal of {withdrawal.token_amount} tokens",
            reference_id=withdrawal.id,
        )
        
        # Reduce pool
        pool = DonationPool.get_pool()
        pool.pool_balance -= withdrawal.naira_amount
        pool.save()
        
        # === BLOCKCHAIN: Burn tokens ===
        try:
            blockchain_result = BlockchainAPI.burn_tokens_for_withdrawal(
                withdrawal_id=str(withdrawal.id),
            )
            
            if blockchain_result.get('success'):
                withdrawal.blockchain_tx = blockchain_result.get('tx_hash', '')
                withdrawal.explorer_url = blockchain_result.get('explorer_url', '')
        except Exception as e:
            import logging
            logging.error(f"Blockchain burn failed: {e}")
        
        # Update status
        withdrawal.status = 'approved'
        withdrawal.reviewed_by = admin_user
        withdrawal.reviewed_at = timezone.now()
        withdrawal.save()
        
        return withdrawal
```

---

## FILE 3: Add Blockchain Fields to Models

**File: `backend/apps/tokens/models.py`**

Add these fields to existing models:

```python
# Add to Donation model
class Donation(models.Model):
    # ... existing fields ...
    
    # Blockchain tracking
    blockchain_tx = models.CharField(max_length=100, blank=True)
    explorer_url = models.URLField(blank=True)


# Add to TokenTransaction model  
class TokenTransaction(models.Model):
    # ... existing fields ...
    
    # Blockchain tracking
    blockchain_tx = models.CharField(max_length=100, blank=True)
    explorer_url = models.URLField(blank=True)


# Add to WithdrawalRequest model
class WithdrawalRequest(models.Model):
    # ... existing fields ...
    
    # Blockchain tracking
    blockchain_tx = models.CharField(max_length=100, blank=True)
    explorer_url = models.URLField(blank=True)
```

---

## FILE 4: Update Settings

**File: `backend/config/settings.py`**

Add blockchain configuration:

```python
# Blockchain API Configuration
BLOCKCHAIN_API_URL = env('BLOCKCHAIN_API_URL', default='http://localhost:8000/api')
BLOCKCHAIN_ENABLED = env.bool('BLOCKCHAIN_ENABLED', default=True)

# Contract Info (for display)
TOKEN_NAME = 'BLOOM'
TOKEN_SYMBOL = 'BLOOM'
TOKEN_CONVERSION_RATE = 2  # 1 BLOOM = ₦2
```

**File: `.env`**

```bash
# Blockchain API
BLOCKCHAIN_API_URL=http://localhost:8000/api
BLOCKCHAIN_ENABLED=True
```

---

## FILE 5: Update API Responses to Include Blockchain

**File: `backend/apps/tokens/views.py`**

Update responses to include blockchain info:

```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_transactions(request):
    """Get user's transaction history with blockchain links"""
    transactions = TokenService.get_user_transactions(request.user, limit=50)
    data = [{
        'id': str(t.id),
        'type': t.transaction_type,
        'amount': float(t.amount),
        'balance_after': float(t.balance_after),
        'source': t.source,
        'description': t.description,
        'created_at': t.created_at,
        # Blockchain info
        'blockchain_tx': t.blockchain_tx,
        'explorer_url': t.explorer_url,
    } for t in transactions]
    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_withdrawals(request):
    """Get user's withdrawal history with blockchain links"""
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
        # Blockchain info
        'blockchain_tx': w.blockchain_tx,
        'explorer_url': w.explorer_url,
    } for w in withdrawals]
    return Response(data)
```

---

## FILE 6: Frontend - Show Blockchain Links

**Update `frontend/src/pages/mother/Wallet.jsx`**

Add Etherscan links to transactions:

```jsx
// In transaction list
{transactions.map((t) => (
  <div key={t.id} className="p-4 flex justify-between items-center">
    <div>
      <p className="font-medium">{t.description}</p>
      <p className="text-sm text-gray-500">{formatDate(t.created_at)}</p>
      {/* Blockchain link */}
      {t.explorer_url && (
        <a 
          href={t.explorer_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          View on Blockchain →
        </a>
      )}
    </div>
    <span className={`font-bold ${t.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
      {t.amount > 0 ? '+' : ''}{t.amount}
    </span>
  </div>
))}
```

---

## SUMMARY: What Happens Now

### When Donation is Confirmed:

```
1. Admin clicks "Confirm Donation"
2. Your system: Updates pool balance
3. Your system: Calls BlockchainAPI.record_donation()
4. Blockchain: Records donation permanently
5. Response includes Etherscan link
6. Donor can verify on blockchain! ✅
```

### When User Earns Tokens:

```
1. User completes a task
2. Your system: Creates TokenTransaction
3. Your system: Updates pool tokens_issued
4. Your system: Calls BlockchainAPI.mint_tokens()
5. Blockchain: Mints BLOOM tokens to user's wallet
6. User can see transaction on Etherscan! ✅
```

### When Withdrawal is Approved:

```
1. Admin approves withdrawal
2. Admin pays user via Alat/OPay (manually)
3. Admin clicks "Mark as Paid"
4. Your system: Deducts tokens
5. Your system: Calls BlockchainAPI.burn_tokens()
6. Blockchain: Burns tokens permanently
7. Transaction recorded on Etherscan! ✅
```

---

## API ENDPOINTS FROM BLOCKCHAIN (Developer A)

| Endpoint | When to Call | What it Does |
|----------|--------------|--------------|
| `POST /api/donations/record/` | After confirming donation | Records on blockchain |
| `POST /api/tokens/mint/` | After user earns tokens | Mints tokens on blockchain |
| `POST /api/admin/withdrawals/{id}/approve/` | After paying user | Burns tokens on blockchain |
| `GET /api/tokens/balance/` | To verify balance | Gets blockchain balance |

---

## RUN MIGRATIONS

```bash
python manage.py makemigrations tokens
python manage.py migrate
```
