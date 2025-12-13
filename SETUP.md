# MamaAlert Backend - Setup Guide

**For Developer B:** This guide will help you run the blockchain backend locally for integration testing.

---

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
# Python dependencies
pip install -r requirements.txt

# Blockchain dependencies (optional - for local testing only)
cd mamalert-blockchain
npm install
cd ..
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with actual values
# (Developer A will provide these via Slack/WhatsApp)
nano .env
```

**Fill in these values:**
```bash
# Get these from Developer A:
BASE_RPC_URL=https://1rpc.io/sepolia
CONTRACT_ADDRESS=0x4AfD7A134Eb249E081799d3A94079de11932C37f
ADMIN_PRIVATE_KEY=<ask Dev A - do not commit this!>

# Generate your own Django secret:
SECRET_KEY=<generate using: python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'>
DEBUG=True
```

### 3. Run Migrations

```bash
python manage.py migrate
```

### 4. Start Server

```bash
python manage.py runserver
```

**✅ Backend now running at:** `http://localhost:8000/api`

---

## 🧪 Test the Integration

### Quick Test with cURL

```bash
# Get token balance (replace JWT_TOKEN with your auth token)
curl -X GET http://localhost:8000/api/tokens/balance/ \
  -H "Authorization: Bearer JWT_TOKEN"
```

Expected response:
```json
{
  "balance": 0,
  "available": 0,
  "pending_withdrawals": 0,
  "blockchain_balance": 0,
  "total_earned": 0,
  "total_withdrawn": 0
}
```

### Test from Your Frontend

```javascript
// In your React/Next.js app
const response = await axios.get('http://localhost:8000/api/tokens/balance/', {
  headers: { Authorization: `Bearer ${userToken}` }
});

console.log(response.data.balance); // Should work!
```

---

## 📡 API Base URL Configuration

### For Local Testing (Development)

```javascript
// In your frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### For Production (Later)

```javascript
// In your frontend .env.production
NEXT_PUBLIC_API_URL=https://your-backend-url.com/api
```

---

## 🌐 Network Switching (Optional)

The backend can use either:
- **Ethereum Sepolia** (Public testnet - for demos)
- **Local Hardhat** (Private local chain - for development)

### To Use Sepolia (Default - Recommended)

Already configured in `.env`:
```bash
BASE_RPC_URL=https://1rpc.io/sepolia
CONTRACT_ADDRESS=0x4AfD7A134Eb249E081799d3A94079de11932C37f
```

No additional setup needed!

### To Use Local Hardhat (Advanced)

**Terminal 1:** Start local blockchain
```bash
cd mamalert-blockchain
npx hardhat node
```

**Terminal 2:** Deploy contract
```bash
cd mamalert-blockchain
npx hardhat run scripts/deploy-local.js --network localhost
```

**Terminal 3:** Update `.env` and start Django
```bash
# In .env:
BASE_RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=<from deploy output>

python manage.py runserver
```

---

## 🔍 Verify It's Working

### Check Backend Health

```bash
# Should return 200 OK
curl http://localhost:8000/api/
```

### Check Blockchain Connection

```bash
# Run test script
python test_blockchain.py
```

Expected output:
```
✅ Connected to Ethereum Sepolia
   Latest block: 9826XXX
```

---

## 🐛 Troubleshooting

### Error: "No module named 'web3'"

```bash
# Make sure you activated virtual environment
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

pip install -r requirements.txt
```

### Error: "ADMIN_PRIVATE_KEY not set"

```bash
# Make sure you created .env from .env.example
cp .env.example .env

# Edit .env and add the private key Developer A gave you
nano .env
```

### Error: "Connection refused" when calling API

```bash
# Make sure Django server is running
python manage.py runserver

# Check it's on port 8000
# Visit: http://localhost:8000/api
```

### Error: "Blockchain transaction failed"

- Check RPC URL is correct in `.env`
- Check contract address is correct
- Ask Developer A if Sepolia RPC is working
- Try switching to local Hardhat (see above)

---

## 📋 API Documentation

See **API_CONTRACT.md** for:
- All endpoint specifications
- Request/response formats
- React integration examples
- Error handling patterns

---

## ✅ Integration Checklist

Before starting frontend integration, verify:

- [ ] Backend server starts without errors
- [ ] Can call `/api/tokens/balance/` successfully
- [ ] Have valid JWT authentication tokens
- [ ] Frontend configured with correct API base URL
- [ ] Read API_CONTRACT.md completely
- [ ] Know contract addresses (Sepolia & Local)

---

## 📞 Need Help?

**Contact Developer A:**
- GitHub: @ouujay
- Email: aaladenusi@gmail.com

**Common Questions:**
- What's the admin private key? → Ask Developer A privately
- Which network should I use? → Sepolia (default) for demos
- How do I generate test JWT tokens? → Ask Developer A or check Django auth docs
- What if I see "insufficient balance" errors? → Contract needs ETH for gas (ask Developer A)

---

## 🎯 Next Steps

1. ✅ Complete this setup
2. ✅ Read API_CONTRACT.md
3. ✅ Test calling one endpoint from your frontend
4. ✅ Implement all endpoints following the contract
5. ✅ Test complete user flow with Developer A

Good luck with the integration! 🚀
