# MamaAlert Blockchain API Documentation
**For Frontend Developer (Developer B)**

## Base URL
```
http://localhost:8000/api/
```

## Overview
This API provides endpoints for managing blockchain wallets, token transactions, donations, and withdrawals for the MamaAlert platform.

---

## Authentication
Currently, no authentication is required for most endpoints. Admin endpoints should be protected in production.

---

## Endpoints

### 1. Blockchain Status
Get blockchain connection status and contract information.

**Endpoint:** `GET /api/blockchain-status/`

**Response:**
```json
{
  "connected": true,
  "network": "Base Sepolia Testnet",
  "rpc_url": "https://sepolia.base.org",
  "contract_address": "0x...",
  "latest_block": 12345678,
  "total_supply": 1000,
  "token_symbol": "BLOOM",
  "conversion_rate": "1 BLOOM = ₦2"
}
```

---

### 2. Generate Wallet
Create a new blockchain wallet for a user.

**Endpoint:** `POST /api/generate-wallet/`

**Request Body:**
```json
{
  "user_id": 1
}
```

**Success Response (201):**
```json
{
  "success": true,
  "wallet": {
    "id": 1,
    "user_id": 1,
    "username": "jane_doe",
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "created_at": "2025-12-12T10:30:00Z",
    "updated_at": "2025-12-12T10:30:00Z"
  },
  "message": "Wallet generated successfully"
}
```

**Error Response (400):**
```json
{
  "user_id": ["User already has a wallet"]
}
```

---

### 3. Get Wallet Balance
Get real-time balance from blockchain for a specific wallet.

**Endpoint:** `GET /api/wallets/{id}/balance/`

**Response:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "balance": 500,
  "naira_equivalent": 1000,
  "token_symbol": "BLOOM"
}
```

---

### 4. List All Wallets
Get list of all user wallets.

**Endpoint:** `GET /api/wallets/`

**Query Parameters:**
- None

**Response:**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user_id": 1,
      "username": "jane_doe",
      "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "created_at": "2025-12-12T10:30:00Z",
      "updated_at": "2025-12-12T10:30:00Z"
    }
  ]
}
```

---

### 5. Mint Tokens (Reward User)
Mint BLOOM tokens to a user's wallet as a reward for completing healthy actions.

**Endpoint:** `POST /api/mint-tokens/`

**Request Body:**
```json
{
  "user_wallet_id": 1,
  "amount": 200,
  "action_type": "checkup",
  "action_id": "CHECKUP_20251212_001"
}
```

**Action Types:**
- `checkup` - Health checkup completed
- `education` - Educational module completed

**Success Response (201):**
```json
{
  "success": true,
  "transaction": {
    "id": 1,
    "user_wallet": 1,
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "username": "jane_doe",
    "transaction_type": "MINT",
    "action_type": "checkup",
    "action_id": "CHECKUP_20251212_001",
    "token_amount": 200,
    "naira_equivalent": "400.00",
    "tx_hash": "0xabc123...",
    "block_number": 12345678,
    "gas_used": 65000,
    "status": "CONFIRMED",
    "created_at": "2025-12-12T10:35:00Z",
    "confirmed_at": "2025-12-12T10:35:30Z",
    "explorer_url": "https://sepolia.basescan.org/tx/0xabc123..."
  },
  "blockchain": {
    "tx_hash": "0xabc123...",
    "explorer_url": "https://sepolia.basescan.org/tx/0xabc123...",
    "block_number": 12345678,
    "gas_used": 65000
  },
  "message": "200 BLOOM tokens minted successfully"
}
```

---

### 6. List Transactions
Get all token transactions (mints and burns).

**Endpoint:** `GET /api/transactions/`

**Query Parameters:**
- `wallet_id` (optional) - Filter by specific wallet

**Response:**
```json
{
  "count": 50,
  "next": "http://localhost:8000/api/transactions/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "user_wallet": 1,
      "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "username": "jane_doe",
      "transaction_type": "MINT",
      "action_type": "checkup",
      "action_id": "CHECKUP_20251212_001",
      "token_amount": 200,
      "naira_equivalent": "400.00",
      "tx_hash": "0xabc123...",
      "block_number": 12345678,
      "gas_used": 65000,
      "status": "CONFIRMED",
      "created_at": "2025-12-12T10:35:00Z",
      "confirmed_at": "2025-12-12T10:35:30Z",
      "explorer_url": "https://sepolia.basescan.org/tx/0xabc123..."
    }
  ]
}
```

---

### 7. Create Withdrawal Request
User requests to withdraw tokens (cash out).

**Endpoint:** `POST /api/create-withdrawal/`

**Request Body:**
```json
{
  "user_wallet_id": 1,
  "token_amount": 100,
  "bank_name": "GTBank",
  "account_number": "0123456789",
  "account_name": "Jane Doe",
  "payment_provider": "OPay"
}
```

**Payment Providers:**
- `OPay`
- `Paystack`
- `Manual`

**Success Response (201):**
```json
{
  "success": true,
  "withdrawal": {
    "id": 1,
    "user_wallet": 1,
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "username": "jane_doe",
    "token_amount": 100,
    "naira_amount": "200.00",
    "bank_name": "GTBank",
    "account_number": "0123456789",
    "account_name": "Jane Doe",
    "payment_provider": "OPay",
    "payment_reference": null,
    "burn_tx_hash": null,
    "burn_confirmed": false,
    "withdrawal_tx_hash": null,
    "withdrawal_recorded": false,
    "status": "PENDING",
    "admin_notes": "",
    "approved_by": null,
    "approved_by_username": null,
    "created_at": "2025-12-12T11:00:00Z",
    "approved_at": null,
    "completed_at": null,
    "burn_explorer_url": null,
    "withdrawal_explorer_url": null
  },
  "message": "Withdrawal request created. Awaiting admin approval."
}
```

**Error Response (400) - Insufficient Balance:**
```json
{
  "error": "Insufficient balance",
  "current_balance": 50,
  "requested": 100
}
```

---

### 8. List Withdrawal Requests
Get all withdrawal requests.

**Endpoint:** `GET /api/withdrawals/`

**Query Parameters:**
- `status` (optional) - Filter by status: `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`

**Response:**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user_wallet": 1,
      "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "username": "jane_doe",
      "token_amount": 100,
      "naira_amount": "200.00",
      "bank_name": "GTBank",
      "account_number": "0123456789",
      "account_name": "Jane Doe",
      "payment_provider": "OPay",
      "status": "PENDING",
      "created_at": "2025-12-12T11:00:00Z"
    }
  ]
}
```

---

### 9. Approve/Reject Withdrawal (Admin)
Admin endpoint to approve or reject withdrawal requests.

**Endpoint:** `POST /api/approve-withdrawal/`

**Request Body (Approve):**
```json
{
  "withdrawal_id": 1,
  "action": "approve",
  "admin_notes": "Payment processed via OPay"
}
```

**Request Body (Reject):**
```json
{
  "withdrawal_id": 1,
  "action": "reject",
  "admin_notes": "Insufficient funds in admin account"
}
```

**Success Response (Approve):**
```json
{
  "success": true,
  "message": "Withdrawal approved. Tokens burned. Please process ₦200.00 payment to Jane Doe.",
  "withdrawal": {
    "id": 1,
    "status": "APPROVED",
    "burn_tx_hash": "0xdef456...",
    "burn_confirmed": true,
    "withdrawal_tx_hash": "0xghi789...",
    "withdrawal_recorded": true,
    "approved_at": "2025-12-12T11:15:00Z"
  },
  "blockchain": {
    "burn_tx": "0xdef456...",
    "burn_explorer": "https://sepolia.basescan.org/tx/0xdef456...",
    "withdrawal_tx": "0xghi789...",
    "withdrawal_explorer": "https://sepolia.basescan.org/tx/0xghi789..."
  },
  "payment_details": {
    "bank_name": "GTBank",
    "account_number": "0123456789",
    "account_name": "Jane Doe",
    "amount": 200.0,
    "provider": "OPay"
  }
}
```

---

### 10. Paystack Webhook (Donations)
Webhook endpoint called by Paystack when donations are received.

**Endpoint:** `POST /api/paystack-webhook/`

**Request Body (from Paystack):**
```json
{
  "event": "charge.success",
  "data": {
    "reference": "PAY_REF_12345",
    "amount": 500000,
    "customer": {
      "email": "donor@example.com"
    }
  }
}
```

**Success Response (201):**
```json
{
  "success": true,
  "donation_id": 1,
  "blockchain_tx": "0xjkl012...",
  "explorer_url": "https://sepolia.basescan.org/tx/0xjkl012..."
}
```

---

### 11. List Donations
Get all donations.

**Endpoint:** `GET /api/donations/`

**Response:**
```json
{
  "count": 20,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "donor_email": "donor@example.com",
      "amount_naira": "5000.00",
      "paystack_reference": "PAY_REF_12345",
      "blockchain_tx_hash": "0xjkl012...",
      "blockchain_recorded": true,
      "payment_status": "SUCCESS",
      "created_at": "2025-12-12T09:00:00Z",
      "paid_at": "2025-12-12T09:00:15Z",
      "recorded_at": "2025-12-12T09:00:45Z",
      "explorer_url": "https://sepolia.basescan.org/tx/0xjkl012..."
    }
  ]
}
```

---

## Error Responses

All endpoints return standard error responses:

**400 Bad Request:**
```json
{
  "error": "Detailed error message",
  "field_name": ["Validation error for this field"]
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to process request: detailed error message"
}
```

---

## Integration Flow for Frontend

### User Registration Flow
1. User signs up on platform (create Django User)
2. Call `POST /api/generate-wallet/` with `user_id`
3. Store wallet info in UI

### Reward Flow (Mother completes checkup)
1. User completes health checkup
2. Backend verifies completion
3. Call `POST /api/mint-tokens/` with checkup details
4. Show success message with transaction link

### Withdrawal Flow
1. User clicks "Withdraw"
2. Show current balance: `GET /api/wallets/{id}/balance/`
3. User enters amount and bank details
4. Call `POST /api/create-withdrawal/`
5. Show "Pending admin approval" message
6. Admin approves via `POST /api/approve-withdrawal/`
7. User receives payment notification

### Donation Flow
1. Donor pays via Paystack
2. Paystack calls `POST /api/paystack-webhook/`
3. Donation recorded on blockchain
4. Show donors list: `GET /api/donations/`

---

## Testing Endpoints

### Start Django Server
```bash
cd /Users/useruser/Documents/bloom
source venv/bin/activate
python manage.py runserver
```

### Test with cURL

**Check blockchain status:**
```bash
curl http://localhost:8000/api/blockchain-status/
```

**Generate wallet:**
```bash
curl -X POST http://localhost:8000/api/generate-wallet/ \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1}'
```

**Mint tokens:**
```bash
curl -X POST http://localhost:8000/api/mint-tokens/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_wallet_id": 1,
    "amount": 200,
    "action_type": "checkup",
    "action_id": "TEST_001"
  }'
```

---

## Important Notes for Frontend

1. **Token Amount = BLOOM tokens** (not Naira)
   - 1 BLOOM = ₦2
   - Display conversion in UI

2. **Transaction Links**
   - All transactions return `explorer_url`
   - Link to Basescan for transparency

3. **Status Updates**
   - Poll `/api/withdrawals/` to check withdrawal status
   - Or implement webhooks/websockets (future)

4. **Error Handling**
   - Always check `success` field in responses
   - Display user-friendly error messages

5. **CORS**
   - Already configured for `localhost:3000` and `localhost:5173`
   - Add production domain before deployment

---

## Next Steps

1. **Create test users** via Django admin
2. **Generate wallets** for test users
3. **Test token minting** flow
4. **Test withdrawal** approval flow
5. **Integrate Paystack** for donations

---

## Support

For integration questions, contact Developer A or refer to:
- `API_CONTRACT.md` - Original integration specs
- `blockchain.py` - Python blockchain integration
- `blockchain_api/views.py` - API implementation

---

**Last Updated:** 2025-12-12
**API Version:** 1.0
**Status:** Ready for integration testing
