# 🔗 Merge Blockchain API into Your Django Backend

**IMPORTANT:** There is NO separate blockchain server! The `blockchain_api` is a Django app that goes INSIDE your existing Django backend.

---

## 🎯 Understanding the Architecture

**BEFORE (What Developer B thinks):**
```
Frontend → Developer B's Backend (localhost:8001)
        → Developer A's Blockchain Backend (???) ❌ WRONG!
```

**AFTER (Correct architecture):**
```
Frontend → ONE Django Backend (localhost:8001)
           ├── apps/users/           (Developer B)
           ├── apps/children/        (Developer B)
           ├── apps/ai/              (Developer B)
           ├── apps/blockchain_api/  (Developer A) ← ADD THIS
           └── apps/sms_api/         (Developer A) ← ADD THIS
```

---

## 📦 Step 1: Copy the Django Apps

From the `developer-A-fully-integrated` branch, copy these folders:

```bash
# Switch to Developer A's branch
git checkout developer-A-fully-integrated

# Copy blockchain_api
cp -r blockchain_api ../backend/apps/

# Copy sms_api
cp -r sms_api ../backend/apps/

# Copy blockchain.py (blockchain integration module)
cp blockchain.py ../backend/

# Copy requirements updates
# (merge with your existing requirements.txt)
```

---

## ⚙️ Step 2: Update Django Settings

**File: `backend/mamalert/settings.py`**

Add to `INSTALLED_APPS`:
```python
INSTALLED_APPS = [
    # ... your existing apps ...
    'apps.users',
    'apps.children',
    'apps.ai',
    'apps.daily_program',
    'apps.health',
    'apps.tokens',          # Your existing token app
    'apps.withdrawals',     # Your existing withdrawal app
    'apps.blockchain_api',  # ← ADD THIS (Developer A's blockchain)
    'apps.sms_api',         # ← ADD THIS (Developer A's SMS - optional)
]
```

---

## 🔗 Step 3: Update URL Routing

**File: `backend/mamalert/urls.py`**

```python
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),

    # Your existing routes
    path('api/auth/', include('apps.users.urls')),
    path('api/children/', include('apps.children.urls')),
    path('api/ai/', include('apps.ai.urls')),
    # ... other routes ...

    # Developer A's blockchain routes
    path('api/', include('apps.blockchain_api.urls')),  # ← ADD THIS

    # Developer A's SMS routes (optional)
    path('sms/', include('apps.sms_api.urls')),  # ← ADD THIS
]
```

---

## 📄 Step 4: Update Requirements

**File: `backend/requirements.txt`**

Add these to your existing requirements:
```txt
# Blockchain integration
web3>=6.0.0
eth-account>=0.10.0

# SMS integration (optional)
africastalking>=1.2.6
twilio>=9.0.0

# AI integration (optional - for SMS AI chat)
openai>=1.0.0
```

Then install:
```bash
cd backend
pip install -r requirements.txt
```

---

## 🔐 Step 5: Environment Variables

**File: `backend/.env`**

Add these to your existing `.env`:
```bash
# Blockchain Configuration
BASE_RPC_URL=https://1rpc.io/sepolia
ADMIN_PRIVATE_KEY=0x2564591ee38a80abb9c1e66c8990e5e2e9dd3ae39dfeb967dfeda87f0f1236f8
CONTRACT_ADDRESS=0x4AfD7A134Eb249E081799d3A94079de11932C37f
ADMIN_ADDRESS=0x12E1A74e2534088da36c6Ff9172C885EA64ad338

# SMS Integration (Optional)
SMS_ENABLED=True
SMS_PROVIDER=twilio

# Twilio
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Africa's Talking
AT_USERNAME=sandbox
AT_API_KEY=your_key_here
AT_SENDER_ID=BLOOM

# OpenAI (for SMS AI chat)
OPENAI_API_KEY=your_key_here
```

---

## 🗄️ Step 6: Run Migrations

```bash
cd backend
python manage.py makemigrations blockchain_api
python manage.py makemigrations sms_api
python manage.py migrate
```

---

## 🚀 Step 7: Start ONE Backend

```bash
cd backend
python manage.py runserver 8001
```

**That's it!** Your backend now serves:
- ✅ Your existing endpoints (users, children, ai, etc.)
- ✅ Blockchain endpoints (mint, burn, donations)
- ✅ SMS endpoints (send SMS, webhook)

---

## 🧪 Test Integration

**1. Check blockchain endpoint:**
```bash
curl http://localhost:8001/api/blockchain-status/
```

**2. Check SMS endpoint:**
```bash
curl http://localhost:8001/sms/status/
```

**3. Test wallet generation:**
```bash
curl -X POST http://localhost:8001/api/users/generate-wallet/ \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1}'
```

---

## 📱 Frontend Update

**File: `frontend/.env.development`**

**KEEP IT THE SAME:**
```bash
VITE_API_URL=http://localhost:8001/api
```

No changes needed! Frontend still calls `localhost:8001`.

---

## ✅ Verify Integration

After merging, your ONE backend should respond to:

**Your existing endpoints:**
- `http://localhost:8001/api/users/...`
- `http://localhost:8001/api/children/...`
- `http://localhost:8001/api/ai/...`

**New blockchain endpoints:**
- `http://localhost:8001/api/users/generate-wallet/`
- `http://localhost:8001/api/tokens/mint/`
- `http://localhost:8001/api/tokens/balance/...`
- `http://localhost:8001/api/donations/record/`
- `http://localhost:8001/api/withdrawals/request/`

**New SMS endpoints (optional):**
- `http://localhost:8001/sms/webhook/`
- `http://localhost:8001/sms/test/`
- `http://localhost:8001/sms/status/`

---

## 🔧 Handling Your Existing Token System

You currently have `apps/tokens/` with database-only token tracking. You have two options:

### Option 1: Replace with Blockchain (Recommended)
1. Remove or disable `apps/tokens/`
2. Use `apps/blockchain_api/` for all token operations
3. Benefits: True blockchain transparency, Etherscan verification

### Option 2: Hybrid Approach
1. Keep `apps/tokens/` for internal tracking
2. Add `apps/blockchain_api/` for blockchain recording
3. Call both when minting tokens
4. Benefits: Maintain existing code, add blockchain proof

**We recommend Option 1** for simplicity and true blockchain benefits.

---

## 🐛 Troubleshooting

### "Module not found: blockchain_api"
**Fix:** Ensure you copied the folder to `backend/apps/blockchain_api/`

### "No module named 'web3'"
**Fix:** Install requirements: `pip install -r requirements.txt`

### "Contract not initialized"
**Fix:** Check `.env` has `CONTRACT_ADDRESS` and `ADMIN_PRIVATE_KEY`

### "Port 8001 already in use"
**Fix:** Kill existing Django process: `pkill -f "python manage.py runserver"`

---

## 📞 Need Help?

1. Check that `blockchain_api` is in `backend/apps/`
2. Check it's in `INSTALLED_APPS`
3. Check URLs are included in `urlpatterns`
4. Run migrations
5. Restart Django server

**Full docs:** See `API_CONTRACT.md` and `INTEGRATION_GUIDE_FOR_DEV_B.md`

---

**Remember:** There's only ONE Django backend running on port 8001. All endpoints (yours + blockchain + SMS) are served from this single backend!
