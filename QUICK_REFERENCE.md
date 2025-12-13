# Developer A Quick Reference Guide

## Common Commands (Copy-Paste Ready)

### Hardhat Commands
```bash
# Compile contracts
npx hardhat compile

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia

# Open Hardhat console (for testing)
npx hardhat console --network baseSepolia

# Verify contract on Basescan
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>

# Clean build artifacts
npx hardhat clean

# Run tests (if you write them)
npx hardhat test
```

### Python/Django Commands
```bash
# Install dependencies
pip install web3 python-dotenv django djangorestframework

# Create Django app
python manage.py startapp blockchain_api

# Make migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Django shell (for testing)
python manage.py shell

# Test blockchain module
python test_blockchain.py
```

### Git Commands
```bash
# Initialize repository
git init

# Check status
git status

# Add files
git add .

# Commit
git commit -m "Your message"

# Check what's in .gitignore
cat .gitignore

# Verify .env is not tracked
git ls-files | grep .env  # Should return nothing
```

### Environment Variables Check
```bash
# Display current environment variables (Linux/Mac)
cat .env

# Check if variables are set (Linux/Mac)
echo $ADMIN_PRIVATE_KEY  # Should show your key

# Load .env in Python shell
python3 -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('CONTRACT_ADDRESS'))"
```

---

## Testing Snippets

### Test Blockchain Connection
```python
# test_connection.py
from web3 import Web3

w3 = Web3(Web3.HTTPProvider('https://sepolia.base.org'))
print(f"Connected: {w3.is_connected()}")
print(f"Latest block: {w3.eth.block_number}")
```

### Test Contract Interaction
```python
# test_contract.py
import os
from web3 import Web3
from dotenv import load_dotenv
load_dotenv()

w3 = Web3(Web3.HTTPProvider(os.getenv('BASE_RPC_URL')))
contract_address = os.getenv('CONTRACT_ADDRESS')

# Simple balance check (no ABI needed for this)
print(f"Contract address: {contract_address}")
print(f"Contract exists: {w3.eth.get_code(contract_address) != b''}")
```

### Generate Test Wallet
```python
# generate_wallet.py
from eth_account import Account

wallet = Account.create()
print(f"Address: {wallet.address}")
print(f"Private Key: {wallet.key.hex()}")
```

### Quick Balance Check
```python
# quick_balance.py
from blockchain import get_balance

# Replace with actual address
test_wallet = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
balance = get_balance(test_wallet)
print(f"Balance: {balance} BLOOM")
```

---

## Common Issues & Solutions

### Issue: "Insufficient funds for gas"
**Solution:**
```bash
# Get more testnet ETH
# Visit: https://www.alchemy.com/faucets/base-sepolia
# Enter your admin wallet address
# Wait 1-2 minutes

# Check balance:
npx hardhat console --network baseSepolia
# Then: const balance = await ethers.provider.getBalance("YOUR_ADDRESS")
# Then: console.log(ethers.formatEther(balance))
```

### Issue: "Nonce too low" or "Nonce too high"
**Solution:**
```python
# In blockchain.py, modify transaction building to get latest nonce:
nonce = w3.eth.get_transaction_count(admin_account.address, 'pending')

# Or wait a few seconds for pending transactions to clear
```

### Issue: "Transaction reverted"
**Solutions:**
1. Check function parameters are correct
2. Verify caller has permission (onlyOwner)
3. Check contract state (e.g., sufficient balance for burn)
4. Look at transaction on Basescan for revert reason

### Issue: "Contract not verified on Basescan"
**Solution:**
```bash
# Manual verification
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>

# If that fails, verify manually on Basescan:
# 1. Go to contract page on Basescan
# 2. Click "Contract" tab → "Verify and Publish"
# 3. Select: Solidity (Single file)
# 4. Compiler: 0.8.20
# 5. License: MIT
# 6. Paste your entire BloomToken.sol code
```

### Issue: "Cannot connect to RPC"
**Solutions:**
```python
# Try alternative RPC URLs:
# Option 1: Alchemy (free tier)
BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Option 2: Infura
BASE_RPC_URL=https://base-sepolia.infura.io/v3/YOUR_API_KEY

# Option 3: Public RPC (may be slower)
BASE_RPC_URL=https://sepolia.base.org
```

### Issue: "ModuleNotFoundError: No module named 'web3'"
**Solution:**
```bash
# Make sure you're in correct Python environment
which python
python --version

# Reinstall dependencies
pip install web3 python-dotenv

# If using virtual environment, activate it first
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate  # Windows
```

### Issue: Paystack webhook not receiving events
**Solutions:**
1. Use ngrok for local testing:
```bash
ngrok http 8000
# Use the ngrok URL in Paystack dashboard
```

2. Check webhook signature verification:
```python
import hmac
import hashlib

# Verify signature
signature = request.headers.get('x-paystack-signature')
computed = hmac.new(
    settings.PAYSTACK_SECRET.encode(),
    request.body,
    hashlib.sha512
).hexdigest()

if signature != computed:
    print("Signature mismatch!")
```

### Issue: Database and blockchain out of sync
**Solution:**
```python
# Create reconciliation script
# reconcile_balances.py
from blockchain import get_balance
from myapp.models import MotherProfile

for profile in MotherProfile.objects.all():
    blockchain_balance = get_balance(profile.wallet_address)
    db_balance = profile.token_balance

    if blockchain_balance != db_balance:
        print(f"Mismatch for {profile.user.email}:")
        print(f"  Blockchain: {blockchain_balance}")
        print(f"  Database: {db_balance}")

        # Update database to match blockchain
        profile.token_balance = blockchain_balance
        profile.save()
```

---

## Useful URLs

### Development Tools
- Base Sepolia Faucet: https://www.alchemy.com/faucets/base-sepolia
- Basescan Sepolia Explorer: https://sepolia.basescan.org
- Hardhat Docs: https://hardhat.org/docs
- Web3.py Docs: https://web3py.readthedocs.io
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts

### Network Information
- Network Name: Base Sepolia
- Chain ID: 84532
- RPC URL: https://sepolia.base.org
- Explorer: https://sepolia.basescan.org
- Currency: ETH (testnet)

### Paystack
- Dashboard: https://dashboard.paystack.com
- Webhook Documentation: https://paystack.com/docs/payments/webhooks
- Test Card: 4084 0840 8408 4081 (Expires: future date, CVV: 408)

---

## API Testing with cURL

### Mint Tokens
```bash
curl -X POST http://localhost:8000/api/tokens/mint/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "action_type": "checkup",
    "action_id": "test-action-001"
  }'
```

### Get Balance
```bash
curl -X GET http://localhost:8000/api/tokens/balance/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Request Withdrawal
```bash
curl -X POST http://localhost:8000/api/withdrawals/request/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 500,
    "mobile_money": "08012345678",
    "provider": "opay"
  }'
```

### Approve Withdrawal (Admin)
```bash
curl -X POST http://localhost:8000/api/admin/withdrawals/123/approve/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -d '{
    "payment_reference": "OPAY_REF_12345"
  }'
```

### Test Paystack Webhook
```bash
# Generate test signature
echo -n '{"event":"charge.success","data":{"amount":1000000}}' | \
  openssl dgst -sha512 -hmac "YOUR_PAYSTACK_SECRET"

# Send webhook
curl -X POST http://localhost:8000/api/webhooks/paystack/ \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: GENERATED_SIGNATURE" \
  -d '{
    "event": "charge.success",
    "data": {
      "amount": 1000000,
      "reference": "TEST_REF_001",
      "customer": {
        "email": "donor@example.com"
      }
    }
  }'
```

---

## Debugging Tips

### View Transaction Details on Basescan
1. Go to: https://sepolia.basescan.org/tx/YOUR_TX_HASH
2. Look for:
   - Status (Success/Failed)
   - Gas Used
   - Events Emitted
   - Revert Reason (if failed)

### Debug Blockchain Function
```python
# Add verbose logging to blockchain.py
import logging
logging.basicConfig(level=logging.DEBUG)

def mint_tokens(user_wallet, amount, action_type, action_id):
    print(f"Minting {amount} tokens to {user_wallet}")
    try:
        # ... rest of function
        print(f"Transaction hash: {tx_hash.hex()}")
        print(f"Gas used: {receipt['gasUsed']}")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
```

### Django Shell Testing
```bash
python manage.py shell

# In shell:
from blockchain import mint_tokens, get_balance

# Test minting
result = mint_tokens(
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    100,
    "checkup",
    "test-001"
)
print(result)

# Check balance
balance = get_balance("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
print(f"Balance: {balance}")
```

### Check Smart Contract Events
```python
# view_events.py
from blockchain import contract, w3

# Get all TokensMinted events
events = contract.events.TokensMinted.create_filter(
    from_block=0,
    to_block='latest'
).get_all_entries()

for event in events:
    print(f"Recipient: {event['args']['recipient']}")
    print(f"Amount: {event['args']['amount']}")
    print(f"Action: {event['args']['actionType']}")
    print(f"Block: {event['blockNumber']}")
    print("---")
```

---

## Performance Optimization

### Gas Optimization Tips
```solidity
// Already optimized in BloomToken.sol:
// ✅ Using uint256 instead of smaller uints
// ✅ Batch operations where possible
// ✅ Events instead of storing all data on-chain
// ✅ Using OpenZeppelin's optimized ERC20
```

### API Performance
```python
# Cache balance in database, refresh periodically
class MotherProfile(models.Model):
    token_balance = models.IntegerField(default=0)  # Cached
    last_balance_update = models.DateTimeField(auto_now=True)

    def get_balance(self, force_refresh=False):
        # Refresh if older than 5 minutes or forced
        if force_refresh or (timezone.now() - self.last_balance_update).seconds > 300:
            from blockchain import get_balance
            self.token_balance = get_balance(self.wallet_address)
            self.save()
        return self.token_balance
```

---

## Security Best Practices Checklist

- [ ] Never log private keys
- [ ] Never commit .env to git
- [ ] Always verify Paystack webhook signatures
- [ ] Use environment variables for all secrets
- [ ] Validate all user inputs
- [ ] Use HTTPS in production
- [ ] Rate limit API endpoints
- [ ] Implement proper authentication
- [ ] Use Django's built-in protections (CSRF, SQL injection)
- [ ] Keep admin wallet funded but not over-funded
- [ ] Monitor for unusual transaction patterns
- [ ] Implement admin action logging

---

## Emergency Procedures

### Admin Wallet Compromised
1. Immediately transfer contract ownership to new wallet
2. Pause all operations
3. Notify users
4. Investigate breach
5. Deploy new contract if necessary

### Smart Contract Bug Found
1. If minor: Document and plan upgrade
2. If critical: Pause operations immediately
3. Cannot modify deployed contract, may need to deploy new one
4. Migrate user balances to new contract

### Database Compromised
1. Immediately take app offline
2. Blockchain is source of truth - balances are safe
3. Restore database from backup
4. Reconcile balances from blockchain
5. Investigate breach before going live

---

## Daily Workflow

### Start of Day
```bash
# 1. Check testnet ETH balance
npx hardhat console --network baseSepolia
# balance = await ethers.provider.getBalance("ADMIN_ADDRESS")

# 2. Pull latest code
git pull

# 3. Run tests
python test_blockchain.py

# 4. Start Django server
python manage.py runserver
```

### End of Day
```bash
# 1. Commit progress
git add .
git commit -m "Descriptive message"
git push

# 2. Update PROGRESS_CHECKLIST.md

# 3. Note any blockers for tomorrow

# 4. Communicate progress to Developer B
```

---

## Contact & Resources

**Developer B:** [Contact info here]

**Emergency Contact:** [Tech lead contact]

**Documentation:** All files in `/bloom/` directory
- DEVELOPER_A_ROADMAP.md (Strategy)
- API_CONTRACT.md (Integration specs)
- PROGRESS_CHECKLIST.md (Track progress)
- QUICK_REFERENCE.md (This file)

**Original Guide:** dev-split-ethereum.md

---

**Last Updated:** 2024-12-12
**Version:** 1.0
