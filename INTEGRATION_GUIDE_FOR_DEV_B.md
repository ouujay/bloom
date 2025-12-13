# 🚀 BLOOM Backend Integration Guide - For Developer B

**Quick Start:** Your frontend is ready! Just point it to these endpoints and you're done.

---

## 📋 What You Need (2 Minutes Setup)

### 1. Environment Variables

**Frontend (.env.development):**
```bash
VITE_API_URL=http://localhost:8000/api
```

**That's it!** Backend is already running at `localhost:8000`

---

## 🔗 API Endpoints - Direct Mapping

### Your Frontend Calls → Our Backend Endpoints

| Your Frontend Call | Backend Endpoint | What It Does |
|-------------------|------------------|--------------|
| `tokensAPI.getWallet()` | `GET /api/tokens/balance/{wallet_address}/` | Get user's BLOOM token balance |
| `tokensAPI.getTransactions()` | `GET /api/transactions/{wallet_address}/` | Get transaction history |
| `tokensAPI.requestWithdrawal()` | `POST /api/withdrawals/request/` | Request withdrawal to mobile money |
| `tokensAPI.createDonation()` | `POST /api/donations/record/` | Record donation on blockchain |

---

## 🎯 Core Integration - 5 Endpoints

### 1️⃣ **Generate Wallet** (On User Signup)

**When:** User completes registration

**Call:**
```javascript
const response = await axios.post('/api/users/generate-wallet/', {
  user_id: user.id
});

// Response
{
  "success": true,
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "message": "Wallet generated successfully"
}
```

**Save `wallet_address` to user profile!**

---

### 2️⃣ **Mint Tokens** (Reward User for Actions)

**When:** User completes health action (checkup, module, daily log)

**Call:**
```javascript
await axios.post('/api/tokens/mint/', {
  user_wallet_id: 1,           // Your DB user ID
  amount: 200,                  // BLOOM tokens to mint
  action_type: "checkup",       // Type of action
  action_id: "CHECKUP_123"      // Your internal tracking ID
});

// Response
{
  "success": true,
  "transaction": {
    "token_amount": 200,
    "tx_hash": "0xabc123...",
    "explorer_url": "https://sepolia.etherscan.io/tx/0xabc123..."
  },
  "message": "200 BLOOM tokens minted successfully"
}
```

**Token Amounts by Action:**
| Action | Tokens |
|--------|--------|
| Signup | 50 BLOOM |
| Profile Complete | 50 BLOOM |
| Checkup | 200 BLOOM |
| Module Complete | 50 BLOOM |
| Daily Log | 10 BLOOM |
| Referral | 150 BLOOM |

---

### 3️⃣ **Check Balance** (Display in Wallet)

**Call:**
```javascript
const response = await axios.get(`/api/tokens/balance/${walletAddress}/`);

// Response
{
  "wallet_address": "0x742d35Cc...",
  "balance": 450,
  "naira_equivalent": 90,  // 1 BLOOM = ₦0.2
  "token_symbol": "BLOOM"
}
```

**Display:**
```javascript
<div>
  <h3>{response.data.balance} BLOOM</h3>
  <p>≈ ₦{response.data.naira_equivalent}</p>
</div>
```

---

### 4️⃣ **Transaction History**

**Call:**
```javascript
const response = await axios.get(`/api/transactions/${walletAddress}/`);

// Response
{
  "transactions": [
    {
      "id": 1,
      "transaction_type": "MINT",
      "action_type": "checkup",
      "token_amount": 200,
      "tx_hash": "0xabc123...",
      "explorer_url": "https://sepolia.etherscan.io/tx/0xabc123...",
      "status": "CONFIRMED",
      "created_at": "2024-12-13T10:30:00Z"
    }
  ]
}
```

**Display:**
```javascript
{transactions.map(tx => (
  <div key={tx.id}>
    <span>+{tx.token_amount} BLOOM</span>
    <span>{tx.action_type}</span>
    <a href={tx.explorer_url} target="_blank">View on Blockchain →</a>
  </div>
))}
```

---

### 5️⃣ **Request Withdrawal** (Cash Out)

**When:** User wants to convert BLOOM → Naira

**Call:**
```javascript
await axios.post('/api/withdrawals/request/', {
  user_wallet_id: 1,
  token_amount: 100,
  bank_name: "GTBank",
  account_number: "0123456789",
  account_name: "Jane Doe",
  payment_provider: "OPay"  // OPay, Alat, or Paystack
});

// Response
{
  "success": true,
  "withdrawal": {
    "id": 42,
    "token_amount": 100,
    "naira_amount": 20,
    "status": "PENDING"
  },
  "message": "Withdrawal request created. Awaiting admin approval."
}
```

---

## 💰 **BONUS: Record Donations** (Optional)

**When:** Someone donates via Paystack

**Call:**
```javascript
await axios.post('/api/donations/record/', {
  donor_email: "jane@example.com",
  amount_naira: 5000,
  reference: paystackReference  // Paystack payment reference
});

// Response
{
  "success": true,
  "blockchain": {
    "tx_hash": "0x8f3e2c...",
    "view_on_etherscan": "https://sepolia.etherscan.io/tx/0x8f3e2c..."
  },
  "message": "₦5000 donation recorded on blockchain successfully! 🎉"
}
```

**Show donor the Etherscan link for transparency!**

---

## 📱 **BONUS: SMS Feature** (Optional)

**Send SMS to users:**
```javascript
await axios.post('/sms/test/', {
  phone_number: "+2348033986757",
  message: "Your withdrawal of ₦50 is being processed!"
});
```

**Check SMS status:**
```javascript
const response = await axios.get('/sms/status/');
// { "sms_enabled": true }
```

---

## 🔧 Integration Checklist

### Step 1: On User Registration
```javascript
// After user signs up successfully
const wallet = await axios.post('/api/users/generate-wallet/', {
  user_id: newUser.id
});

// Save wallet address to user profile
await updateUser(newUser.id, {
  wallet_address: wallet.data.wallet_address
});

// Give signup bonus
await axios.post('/api/tokens/mint/', {
  user_wallet_id: newUser.id,
  amount: 50,
  action_type: "signup",
  action_id: `SIGNUP_${newUser.id}`
});
```

### Step 2: On Health Actions
```javascript
// When user completes a checkup
const mintTokens = async (userId, actionType, amount, actionId) => {
  await axios.post('/api/tokens/mint/', {
    user_wallet_id: userId,
    amount: amount,
    action_type: actionType,
    action_id: actionId
  });

  toast.success(`+${amount} BLOOM tokens earned! 🎉`);
};

// Usage
await mintTokens(user.id, "checkup", 200, "CHECKUP_123");
```

### Step 3: Display Wallet
```javascript
const WalletPage = () => {
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const fetchBalance = async () => {
      const res = await axios.get(`/api/tokens/balance/${user.wallet_address}/`);
      setBalance(res.data);
    };
    fetchBalance();
  }, []);

  return (
    <div>
      <h2>{balance?.balance} BLOOM</h2>
      <p>≈ ₦{balance?.naira_equivalent}</p>
      <button onClick={handleWithdraw}>Withdraw</button>
    </div>
  );
};
```

---

## ❗ Common Integration Issues & Fixes

### Issue 1: "Network error" when calling API
**Fix:** Check backend is running on port 8000
```bash
python manage.py runserver 8000
```

### Issue 2: "Wallet not found"
**Fix:** Ensure wallet was generated on signup
```javascript
// Check if user has wallet_address
if (!user.wallet_address) {
  const wallet = await axios.post('/api/users/generate-wallet/', {
    user_id: user.id
  });
  user.wallet_address = wallet.data.wallet_address;
}
```

### Issue 3: "User not authenticated"
**Fix:** Ensure JWT token is in request
```javascript
// Already handled by axios interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

## 🎯 What You DON'T Need

❌ **NO** web3.js
❌ **NO** ethers.js
❌ **NO** blockchain libraries
❌ **NO** private key management
❌ **NO** smart contract knowledge

**Just axios!** Everything is abstracted.

---

## 🧪 Testing Endpoints

**Quick test with curl:**
```bash
# 1. Generate wallet
curl -X POST http://localhost:8000/api/users/generate-wallet/ \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1}'

# 2. Mint tokens
curl -X POST http://localhost:8000/api/tokens/mint/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_wallet_id": 1,
    "amount": 200,
    "action_type": "checkup",
    "action_id": "TEST_001"
  }'

# 3. Check balance
curl http://localhost:8000/api/tokens/balance/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb/
```

---

## 📊 Response Format (All Endpoints)

**Success:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error description",
  "message": "User-friendly error message"
}
```

---

## 🚀 Production Deployment

**Environment Variables:**
```bash
# Backend .env
BASE_RPC_URL=https://1rpc.io/sepolia
ADMIN_PRIVATE_KEY=your_key_here
CONTRACT_ADDRESS=0x4AfD7A134Eb249E081799d3A94079de11932C37f

# Frontend .env.production
VITE_API_URL=https://api.bloom.com/api
```

**Update axios baseURL:**
```javascript
// Already configured!
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api'
});
```

---

## 📞 Need Help?

**Check these first:**
1. Backend running? `python manage.py runserver 8000`
2. Correct API URL? `VITE_API_URL=http://localhost:8000/api`
3. User has wallet? Generated on signup?

**Full API Documentation:**
- See `API_CONTRACT.md` for complete details
- See `SMS_FEATURE_GUIDE.md` for SMS integration

---

## ✅ Integration Complete When:

- [ ] Users get wallet on signup
- [ ] Tokens minted for each action
- [ ] Balance displays in wallet page
- [ ] Transaction history shows up
- [ ] Withdrawals can be requested
- [ ] (Optional) Donations recorded
- [ ] (Optional) SMS notifications working

---

**That's it! You're ready to integrate.** 🎉

**Questions?** Check the full `API_CONTRACT.md` for detailed specs.
