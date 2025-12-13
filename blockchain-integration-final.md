# Blockchain Integration - COPY THIS TO CLAUDE CODE

## WHAT THIS DOES
Connects your token system to Developer A's blockchain API so that:
- Donations are recorded on Etherscan
- Token earnings are minted on blockchain
- Withdrawals burn tokens on blockchain
- Users get Etherscan links to verify everything

---

## STEP 1: Create Blockchain API Service

**Create file: `backend/apps/tokens/blockchain_api.py`**

```python
import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

BLOCKCHAIN_API_URL = getattr(settings, 'BLOCKCHAIN_API_URL', 'http://localhost:8000/api')


class BlockchainAPI:
    """Calls Developer A's blockchain endpoints"""
    
    @staticmethod
    def record_donation(donor_email, donor_name, amount_naira, reference):
        """Record donation on blockchain - returns Etherscan link"""
        try:
            response = requests.post(
                f"{BLOCKCHAIN_API_URL}/donations/record/",
                json={
                    'donor_email': donor_email or 'anonymous@bloom.com',
                    'donor_name': donor_name or 'Anonymous',
                    'amount_naira': float(amount_naira),
                    'reference': str(reference)
                },
                timeout=30
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                return {
                    'success': True,
                    'tx_hash': data.get('blockchain', {}).get('tx_hash', ''),
                    'explorer_url': data.get('blockchain', {}).get('explorer_url', ''),
                }
            return {'success': False, 'error': response.text}
        except Exception as e:
            logger.error(f"Blockchain record_donation failed: {e}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def mint_tokens(action_type, action_id, auth_token=None):
        """Mint tokens on blockchain when user earns"""
        try:
            headers = {'Content-Type': 'application/json'}
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
                return {
                    'success': True,
                    'tokens_earned': data.get('tokens_earned'),
                    'tx_hash': data.get('blockchain_tx', ''),
                    'explorer_url': data.get('explorer_url', ''),
                }
            return {'success': False, 'error': response.json().get('error', 'Unknown')}
        except Exception as e:
            logger.error(f"Blockchain mint_tokens failed: {e}")
            return {'success': False, 'error': str(e)}
    
    @staticmethod
    def get_balance(auth_token=None):
        """Get balance from blockchain"""
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
                return {'success': True, 'balance': response.json().get('balance', 0)}
            return {'success': False, 'error': 'Failed'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
```

---

## STEP 2: Add Blockchain Fields to Models

**Update file: `backend/apps/tokens/models.py`**

Add these fields to your existing models:

```python
# Add to Donation model (after existing fields)
blockchain_tx = models.CharField(max_length=100, blank=True)
explorer_url = models.URLField(blank=True)

# Add to TokenTransaction model (after existing fields)
blockchain_tx = models.CharField(max_length=100, blank=True)
explorer_url = models.URLField(blank=True)

# Add to WithdrawalRequest model (after existing fields)
blockchain_tx = models.CharField(max_length=100, blank=True)
explorer_url = models.URLField(blank=True)
```

---

## STEP 3: Update Services to Call Blockchain

**Update file: `backend/apps/tokens/services.py`**

Add this import at top:
```python
from .blockchain_api import BlockchainAPI
```

Then update the `confirm_donation` method in `DonationService`:

```python
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
    
    # Record on blockchain
    blockchain_result = BlockchainAPI.record_donation(
        donor_email=donation.donor_email,
        donor_name=donation.donor_name,
        amount_naira=donation.amount_naira,
        reference=donation.payment_reference or str(donation.id),
    )
    
    if blockchain_result.get('success'):
        donation.blockchain_tx = blockchain_result.get('tx_hash', '')
        donation.explorer_url = blockchain_result.get('explorer_url', '')
    
    donation.save()
    return donation, True
```

Update the `award_tokens` method in `TokenService`:

```python
@staticmethod
@transaction.atomic
def award_tokens(user, amount, source, description, reference_id=None, reference_type=''):
    """Award tokens and mint on blockchain"""
    amount = Decimal(str(amount))
    current_balance = TokenService.get_user_balance(user)
    new_balance = current_balance + amount
    
    # Create local transaction
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
    
    # Mint on blockchain
    action_map = {
        'signup': 'signup',
        'daily_lesson': 'module',
        'daily_checkin': 'daily_log',
        'daily_task': 'daily_log',
        'health_checkin': 'daily_log',
        'video_watched': 'module',
        'referral': 'referral',
    }
    
    blockchain_result = BlockchainAPI.mint_tokens(
        action_type=action_map.get(source, 'daily_log'),
        action_id=reference_id or txn.id,
    )
    
    if blockchain_result.get('success'):
        txn.blockchain_tx = blockchain_result.get('tx_hash', '')
        txn.explorer_url = blockchain_result.get('explorer_url', '')
        txn.save()
    
    return txn
```

---

## STEP 4: Add to Settings

**Update file: `backend/config/settings.py`**

```python
# Blockchain API
BLOCKCHAIN_API_URL = os.environ.get('BLOCKCHAIN_API_URL', 'http://localhost:8000/api')
```

**Update file: `.env`**

```bash
BLOCKCHAIN_API_URL=http://localhost:8000/api
```

---

## STEP 5: Update Views to Return Blockchain Links

**Update file: `backend/apps/tokens/views.py`**

In `my_transactions` view, add blockchain fields to response:
```python
data = [{
    'id': str(t.id),
    'type': t.transaction_type,
    'amount': float(t.amount),
    'balance_after': float(t.balance_after),
    'source': t.source,
    'description': t.description,
    'created_at': t.created_at,
    'blockchain_tx': t.blockchain_tx,      # ADD THIS
    'explorer_url': t.explorer_url,        # ADD THIS
} for t in transactions]
```

In `my_withdrawals` view, add blockchain fields:
```python
data = [{
    # ... existing fields ...
    'blockchain_tx': w.blockchain_tx,      # ADD THIS
    'explorer_url': w.explorer_url,        # ADD THIS
} for w in withdrawals]
```

In `admin_approve_withdrawal` view response:
```python
return Response({
    'success': True,
    'message': f'Approved. Send ₦{withdrawal.naira_amount:,.2f} to {withdrawal.account_name}',
    'bank_name': withdrawal.bank_name,
    'account_number': withdrawal.account_number,
    'account_name': withdrawal.account_name,
    'naira_amount': float(withdrawal.naira_amount),
    'blockchain_tx': withdrawal.blockchain_tx,      # ADD THIS
    'explorer_url': withdrawal.explorer_url,        # ADD THIS
})
```

---

## STEP 6: Run Migrations

```bash
python manage.py makemigrations tokens
python manage.py migrate
```

---

## STEP 7: Frontend - Show Etherscan Links

**Update `frontend/src/pages/mother/Wallet.jsx`**

Add link to transactions:
```jsx
{t.explorer_url && (
  <a 
    href={t.explorer_url} 
    target="_blank" 
    rel="noopener noreferrer"
    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
  >
    🔗 View on Blockchain
  </a>
)}
```

---

## DONE! 

Now when:
- **Donation confirmed** → Recorded on Etherscan ✅
- **User earns tokens** → Minted on Etherscan ✅
- **Withdrawal approved** → Burned on Etherscan ✅

Users can click the link to verify on blockchain!
