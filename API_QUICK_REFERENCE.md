# 📱 BLOOM API - Quick Reference Card

**Base URL:** `http://localhost:8000/api`
**Auth:** JWT Bearer Token (handled by axios interceptor)

---

## 🔑 Essential Endpoints (Copy & Paste)

### 1. Generate Wallet (Signup)
```javascript
POST /api/users/generate-wallet/
Body: { "user_id": 1 }
Response: { "success": true, "wallet_address": "0x..." }
```

### 2. Mint Tokens (Reward)
```javascript
POST /api/tokens/mint/
Body: {
  "user_wallet_id": 1,
  "amount": 200,
  "action_type": "checkup",
  "action_id": "CHECKUP_123"
}
```

### 3. Check Balance
```javascript
GET /api/tokens/balance/{wallet_address}/
Response: { "balance": 450, "naira_equivalent": 90 }
```

### 4. Transaction History
```javascript
GET /api/transactions/{wallet_address}/
Response: { "transactions": [...] }
```

### 5. Request Withdrawal
```javascript
POST /api/withdrawals/request/
Body: {
  "user_wallet_id": 1,
  "token_amount": 100,
  "bank_name": "GTBank",
  "account_number": "0123456789",
  "account_name": "Jane Doe"
}
```

### 6. Record Donation (Optional)
```javascript
POST /api/donations/record/
Body: {
  "donor_email": "jane@example.com",
  "amount_naira": 5000,
  "reference": "PAY_123"
}
```

### 7. Send SMS (Optional)
```javascript
POST /sms/test/
Body: {
  "phone_number": "+2348033986757",
  "message": "Hello from BLOOM!"
}
```

---

## 💎 Token Rewards

| Action | Tokens |
|--------|--------|
| Signup | 50 |
| Profile Complete | 50 |
| Checkup | 200 |
| Module | 50 |
| Daily Log | 10 |
| Referral | 150 |

**Conversion:** 1 BLOOM = ₦0.2 (1000 BLOOM = ₦200)

---

## ⚡ Integration Flow

1. **User Signs Up** → Call `/api/users/generate-wallet/` → Save `wallet_address`
2. **User Does Action** → Call `/api/tokens/mint/` → Tokens added to balance
3. **User Views Wallet** → Call `/api/tokens/balance/` → Display balance
4. **User Withdraws** → Call `/api/withdrawals/request/` → Admin approves

---

## 🔧 Environment Setup

**.env.development:**
```bash
VITE_API_URL=http://localhost:8000/api
```

**Start Backend:**
```bash
cd backend
python manage.py runserver 8000
```

---

## 📞 Support

**Full Docs:** `API_CONTRACT.md`, `INTEGRATION_GUIDE_FOR_DEV_B.md`
**Need Help?** Check if backend is running on port 8000
