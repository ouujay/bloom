# Developer A Strategic Roadmap - MamaAlert Blockchain Layer

## Executive Summary

You are responsible for the complete blockchain infrastructure and financial flows for MamaAlert. This roadmap breaks down your work into logical phases with clear integration points to minimize issues with Developer B.

**Total Estimated Time:** 10-12 hours
**Critical Path:** Smart contract deployment → Blockchain integration → API endpoints → Integration testing

---

## Phase 1: Foundation Setup (2-3 hours)

### Objectives
- Set up all development tools
- Create and fund admin wallet
- Establish testing environment

### Tasks

#### 1.1 Environment Setup (45 mins)
```bash
# Check prerequisites
node --version  # Need 16+
python --version  # Need 3.8+

# Create blockchain workspace
mkdir mamalert-blockchain
cd mamalert-blockchain

# Initialize Hardhat project
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts dotenv
npx hardhat init  # Select "Create a JavaScript project"

# Install Python dependencies
pip install web3 python-dotenv django djangorestframework
```

**Success Criteria:**
- ✅ Hardhat compiles successfully
- ✅ All dependencies installed without errors
- ✅ Project structure matches documentation

#### 1.2 Admin Wallet Creation (30 mins)
```bash
# Generate wallet
npx hardhat console

# In console:
const wallet = ethers.Wallet.createRandom()
console.log("Address:", wallet.address)
console.log("Private Key:", wallet.privateKey)
```

**Create .env file:**
```bash
ADMIN_PRIVATE_KEY=0xYourPrivateKeyHere
BASE_RPC_URL=https://sepolia.base.org
```

**Get Testnet ETH:**
1. Visit: https://www.alchemy.com/faucets/base-sepolia
2. Enter your admin address
3. Request 0.5 ETH (sufficient for ~100 transactions)

**Success Criteria:**
- ✅ Admin wallet created and private key stored securely
- ✅ Wallet funded with testnet ETH (check on basescan.org)
- ✅ .env file created and added to .gitignore

#### 1.3 Git Security Setup (15 mins)
```bash
# Create .gitignore
cat > .gitignore << EOF
.env
*.pyc
__pycache__/
node_modules/
artifacts/
cache/
EOF

git init
git add .gitignore
git commit -m "Initial commit with security setup"
```

**Critical:** NEVER commit .env file or private keys

**Success Criteria:**
- ✅ .gitignore properly configured
- ✅ Git initialized
- ✅ No sensitive data in repository

---

## Phase 2: Smart Contract Development (2-3 hours)

### Objectives
- Deploy production-ready BloomToken contract
- Verify on block explorer
- Test all contract functions

### Tasks

#### 2.1 Write BloomToken.sol (1 hour)
Copy the complete contract from the development guide (lines 146-289 in dev-split-ethereum.md)

**Key Functions to Understand:**
1. `recordDonation()` - Logs donations on-chain (no token minting)
2. `mintTokens()` - Creates tokens for mothers completing actions
3. `burnTokens()` - Destroys tokens during withdrawal
4. `recordWithdrawal()` - Logs completed withdrawals for transparency

**Success Criteria:**
- ✅ Contract compiles without errors: `npx hardhat compile`
- ✅ No security warnings
- ✅ All events defined correctly

#### 2.2 Create Deployment Script (30 mins)
Copy deploy.js from guide (lines 330-376)

**Critical Elements:**
- Checks deployer balance before deployment
- Saves contract address for .env
- Automatically verifies on Basescan
- Provides explorer URL

**Success Criteria:**
- ✅ Deployment script runs without errors
- ✅ Contract address captured
- ✅ Explorer URL accessible

#### 2.3 Deploy to Base Sepolia (30 mins)
```bash
# Compile
npx hardhat compile

# Deploy
npx hardhat run scripts/deploy.js --network baseSepolia

# Expected output:
# BloomToken deployed to: 0xABCDEF...
# Explorer URL: https://sepolia.basescan.org/address/0xABCDEF...

# Add to .env
echo "CONTRACT_ADDRESS=0xYourActualAddress" >> .env
```

**Success Criteria:**
- ✅ Contract deployed successfully
- ✅ Contract verified on Basescan
- ✅ You can view contract on explorer
- ✅ Contract ownership confirmed to admin wallet

**INTEGRATION CHECKPOINT #1:**
Share with Developer B:
- Contract address
- Explorer URL
- Token name: "Bloom"
- Token symbol: "BLOOM"

---

## Phase 3: Backend Integration Layer (3-4 hours)

### Objectives
- Create robust blockchain interaction module
- Test all blockchain functions
- Handle errors gracefully

### Tasks

#### 3.1 Create blockchain.py Module (2 hours)
Copy the complete blockchain.py module from guide (lines 411-1350)

**Critical Functions:**

1. **record_deposit()** - Called by Paystack webhook
   - Records donation on blockchain
   - Returns transaction hash
   - Handles failures gracefully

2. **mint_tokens()** - Called when mother completes action
   - Validates wallet address
   - Mints tokens on-chain
   - Updates local database

3. **burn_tokens()** - Called during withdrawal approval
   - Validates sufficient balance
   - Burns tokens on-chain
   - Cannot be reversed

4. **record_withdrawal()** - Called after admin pays mother
   - Records payment reference on-chain
   - Provides transparency for donors

5. **get_balance()** - Read-only, no gas cost
   - Fetches current balance from blockchain
   - Used for verification

**Error Handling Strategy:**
```python
# Every blockchain call should:
1. Try the transaction
2. Wait for confirmation (2-5 seconds on Base)
3. Return success/failure with details
4. Log errors but don't crash the app
```

**Success Criteria:**
- ✅ All functions implement proper error handling
- ✅ Transaction receipts captured correctly
- ✅ Explorer URLs formatted properly
- ✅ No hardcoded values (all from .env)

#### 3.2 Create Test Script (1 hour)
Copy test_blockchain.py from guide (lines 1610-1694)

**Test Sequence:**
1. Record a test donation
2. Mint tokens to test wallet
3. Check balance
4. Burn tokens
5. Record withdrawal
6. Verify total supply

```bash
# Run tests
python test_blockchain.py

# Expected output:
# ✓ Donation recorded: TX 0xABC...
# ✓ Tokens minted: TX 0xDEF...
# ✓ Balance: 200 BLOOM
# ✓ Tokens burned: TX 0xGHI...
# ✓ Withdrawal recorded: TX 0xJKL...
# ✓ Total supply updated correctly
```

**Success Criteria:**
- ✅ All 6 tests pass
- ✅ Transactions appear on Basescan
- ✅ Events emitted correctly
- ✅ Balances update as expected

**INTEGRATION CHECKPOINT #2:**
Demonstrate to Developer B:
- Working blockchain integration
- Test transactions on explorer
- Expected response formats from each function

---

## Phase 4: Django API Layer (3-4 hours)

### Objectives
- Build secure API endpoints
- Implement proper authentication
- Create clear contract for Developer B

### Tasks

#### 4.1 Define Django Models (1 hour)

**Critical Models Needed:**

```python
# User Model Extensions
class MotherProfile(models.Model):
    user = models.OneToOneField(User)
    wallet_address = models.CharField(max_length=42)  # Ethereum address
    token_balance = models.IntegerField(default=0)  # Cached from blockchain
    available_balance = models.IntegerField(default=0)  # Balance - pending withdrawals

# Donation Model
class Donation(models.Model):
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reference = models.CharField(max_length=100, unique=True)  # Paystack reference
    donor_email = models.EmailField()
    blockchain_tx = models.CharField(max_length=66)  # Transaction hash
    explorer_url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)

# Token Transaction Model
class TokenTransaction(models.Model):
    user = models.ForeignKey(MotherProfile)
    amount = models.IntegerField()
    tx_type = models.CharField(max_length=20)  # mint, burn
    action_type = models.CharField(max_length=50)  # checkup, module, etc.
    blockchain_tx = models.CharField(max_length=66)
    explorer_url = models.URLField()
    created_at = models.DateTimeField(auto_now_add=True)

# Withdrawal Request Model
class WithdrawalRequest(models.Model):
    user = models.ForeignKey(MotherProfile)
    token_amount = models.IntegerField()
    naira_amount = models.DecimalField(max_digits=10, decimal_places=2)
    destination = models.CharField(max_length=20)  # Phone number
    provider = models.CharField(max_length=20)  # OPay, Alat, etc.
    status = models.CharField(max_length=20)  # pending, completed, rejected
    payment_reference = models.CharField(max_length=100, blank=True)
    blockchain_tx = models.CharField(max_length=66, blank=True)
    explorer_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
```

**Success Criteria:**
- ✅ Models created and migrations run
- ✅ Admin interface configured
- ✅ Test data can be created

#### 4.2 Implement API Endpoints (2 hours)

**Endpoint 1: Paystack Webhook**
```python
POST /api/webhooks/paystack/
# No authentication (verified via signature)
# Called by Paystack when donation succeeds
# Records donation on blockchain
```

**Endpoint 2: Mint Tokens**
```python
POST /api/tokens/mint/
# Authentication: Required (user token)
# Body: { "action_type": "checkup", "action_id": "uuid" }
# Response: { "success": true, "tokens_earned": 200, "new_balance": 450, "explorer_url": "..." }
```

**Endpoint 3: Request Withdrawal**
```python
POST /api/withdrawals/request/
# Authentication: Required (user token)
# Body: { "amount": 500, "mobile_money": "08012345678", "provider": "opay" }
# Response: { "success": true, "message": "Request submitted", "request_id": 123 }
```

**Endpoint 4: Approve Withdrawal (Admin)**
```python
POST /api/admin/withdrawals/{id}/approve/
# Authentication: Required (admin only)
# Body: { "payment_reference": "OPAY_REF_12345" }
# Response: { "success": true, "explorer_url": "..." }
```

**Endpoint 5: Get Balance**
```python
GET /api/tokens/balance/
# Authentication: Required (user token)
# Response: { "balance": 450, "available": 450, "pending_withdrawals": 0 }
```

**Endpoint 6: Transaction History**
```python
GET /api/tokens/transactions/
# Authentication: Required (user token)
# Response: { "transactions": [...], "total_earned": 1200, "total_withdrawn": 750 }
```

**Success Criteria:**
- ✅ All endpoints implemented
- ✅ Proper authentication/authorization
- ✅ Error handling for all edge cases
- ✅ Blockchain errors don't crash the API

#### 4.3 Create API Documentation for Developer B (1 hour)

Create `API_CONTRACT.md`:

```markdown
# MamaAlert API Contract - Developer B Integration Guide

## Base URL
`http://localhost:8000/api`

## Authentication
All endpoints (except webhook) require JWT token:
`Authorization: Bearer <token>`

## Endpoints Developer B Will Call

### 1. Mint Tokens (When Mother Completes Action)
**Trigger:** Mother completes any rewarded action
**Call:** `POST /api/tokens/mint/`
**Body:**
{
  "action_type": "checkup",  // checkup, module, daily_log, referral
  "action_id": "unique-uuid"
}
**Response:**
{
  "success": true,
  "tokens_earned": 200,
  "new_balance": 450,
  "explorer_url": "https://sepolia.basescan.org/tx/0xABC..."
}

### 2. Request Withdrawal (When Mother Withdraws)
...
```

**INTEGRATION CHECKPOINT #3:**
Coordinate with Developer B:
- Walk through API contract together
- Share Postman collection or API tests
- Agree on error handling approach
- Test one complete flow together

---

## Phase 5: Integration Testing (1-2 hours)

### Objectives
- Test complete user flows
- Verify Developer B integration
- Catch edge cases

### Test Scenarios

#### Test 1: Complete Mother Journey
1. Mother signs up → wallet created
2. Mother completes checkup → tokens minted
3. Mother checks balance → matches blockchain
4. Mother requests withdrawal → request pending
5. Admin approves → tokens burned, withdrawal recorded
6. Verify all transactions on Basescan

#### Test 2: Donation Flow
1. Donor makes payment on Paystack
2. Webhook received
3. Donation recorded on blockchain
4. Verify transaction on Basescan

#### Test 3: Error Scenarios
1. Insufficient balance withdrawal → Proper error
2. Duplicate action ID → No double minting
3. Invalid wallet address → Clear error message
4. Network timeout → Retry logic works

**Success Criteria:**
- ✅ All happy paths work
- ✅ Error handling graceful
- ✅ No orphaned transactions
- ✅ Database and blockchain stay in sync

---

## Risk Mitigation Strategies

### Risk 1: Blockchain Transaction Failures
**Mitigation:**
- Always try/catch blockchain calls
- Log all failures for manual review
- Don't update database until blockchain confirms
- Implement retry logic for network issues

### Risk 2: Integration Issues with Developer B
**Mitigation:**
- Define API contract early (Phase 4.3)
- Use clear, consistent response formats
- Provide Postman collection
- Test integration together at checkpoints
- Document all error codes

### Risk 3: Security Vulnerabilities
**Mitigation:**
- Never expose private keys
- Validate all inputs
- Implement rate limiting on endpoints
- Use HTTPS for webhooks
- Verify Paystack webhook signatures

### Risk 4: Gas Price Fluctuations
**Mitigation:**
- Use dynamic gas pricing: `w3.eth.gas_price`
- Monitor gas costs during testing
- Set gas limits appropriately (200k-250k per tx)
- Keep admin wallet funded

### Risk 5: Database/Blockchain Desync
**Mitigation:**
- Update database ONLY after blockchain confirmation
- Cache blockchain balance but trust blockchain as source of truth
- Implement balance reconciliation script
- Log all transaction hashes for audit

---

## Integration Points with Developer B

### What Developer B Needs From You (Deliverables)

1. **Environment Variables**
   ```
   CONTRACT_ADDRESS=0xYourActualAddress
   ADMIN_PRIVATE_KEY=0xYourPrivateKey
   BASE_RPC_URL=https://sepolia.base.org
   ```

2. **API Documentation** (API_CONTRACT.md)
   - All endpoints
   - Request/response formats
   - Error codes
   - Example calls

3. **Database Models** (Share schema)
   - User.wallet_address
   - User.token_balance
   - TokenTransaction model
   - WithdrawalRequest model

4. **Explorer URL Format**
   ```
   https://sepolia.basescan.org/tx/{transaction_hash}
   ```

### What You Need From Developer B

1. **User Registration Flow**
   - When user signs up, call your wallet generation function
   - Store wallet_address in User model

2. **Action Completion Triggers**
   - When mother completes action, call `POST /api/tokens/mint/`
   - Display tokens earned in UI

3. **Withdrawal UI**
   - Form to request withdrawal
   - Display pending requests
   - Show transaction history with explorer links

4. **Admin Dashboard**
   - List pending withdrawals
   - Approve/reject buttons
   - Display blockchain transaction links

### Communication Protocol

**Daily Standups (5 mins):**
- What you completed
- What you're working on
- Any blockers

**Integration Checkpoints:**
1. After Phase 2: Share contract address
2. After Phase 3: Demo blockchain working
3. After Phase 4: Share API documentation
4. After Phase 5: Joint testing session

---

## Verification Checklist

Before considering your work complete:

### Smart Contract
- [ ] Contract deployed to Base Sepolia
- [ ] Contract verified on Basescan
- [ ] All functions tested manually
- [ ] Ownership confirmed

### Blockchain Integration
- [ ] blockchain.py created and tested
- [ ] All 6 test functions pass
- [ ] Error handling implemented
- [ ] Environment variables configured

### API Layer
- [ ] All 6 endpoints implemented
- [ ] Authentication working
- [ ] Error responses standardized
- [ ] API documentation complete

### Integration
- [ ] API contract shared with Developer B
- [ ] At least one complete flow tested together
- [ ] Database models aligned
- [ ] Response formats agreed upon

### Security
- [ ] .env in .gitignore
- [ ] No hardcoded secrets
- [ ] Webhook signature verification
- [ ] Admin-only endpoints protected

---

## Quick Start Execution Plan

If you want to start immediately, follow this sequence:

**Day 1 (4-6 hours):**
1. Phase 1: Environment setup (2 hours)
2. Phase 2: Deploy smart contract (2 hours)
3. Share contract address with Developer B ✓

**Day 2 (4-6 hours):**
1. Phase 3: Blockchain integration (3 hours)
2. Phase 4.1: Django models (1 hour)
3. Test blockchain.py thoroughly ✓

**Day 3 (4-6 hours):**
1. Phase 4.2-4.3: API endpoints + docs (3 hours)
2. Phase 5: Integration testing (2 hours)
3. Final coordination with Developer B ✓

**Total: 12-18 hours over 3 days**

---

## Support Resources

**Debugging Tools:**
- Basescan Explorer: https://sepolia.basescan.org
- Hardhat Console: `npx hardhat console --network baseSepolia`
- Web3.py Docs: https://web3py.readthedocs.io

**Common Issues & Solutions:**

1. "Insufficient funds for gas"
   → Get more testnet ETH from faucet

2. "Nonce too low"
   → Clear transaction queue or wait for pending tx

3. "Transaction reverted"
   → Check contract function parameters and permissions

4. "Contract not verified"
   → Run verification manually: `npx hardhat verify --network baseSepolia <address>`

---

## Success Metrics

You'll know you're done when:

1. ✅ Smart contract deployed and verified
2. ✅ All blockchain functions tested and working
3. ✅ All API endpoints implemented and documented
4. ✅ Developer B successfully integrates
5. ✅ Complete user flow tested end-to-end
6. ✅ All transactions visible on Basescan
7. ✅ No security vulnerabilities
8. ✅ Error handling graceful and informative

---

**Ready to start? Begin with Phase 1, Task 1.1!**
