# Quick Start: MamaAlert Backend Server

## Start the Django API Server

```bash
cd /Users/useruser/Documents/bloom
source venv/bin/activate
python manage.py runserver
```

Server will start at: **http://localhost:8000**

## Available Endpoints

### API Endpoints (for Frontend)
- http://localhost:8000/api/blockchain-status/
- http://localhost:8000/api/wallets/
- http://localhost:8000/api/transactions/
- http://localhost:8000/api/donations/
- http://localhost:8000/api/withdrawals/

### Admin Panel
- http://localhost:8000/admin/

(Create admin user first: `python manage.py createsuperuser`)

## Test the API

```bash
# Check blockchain status
curl http://localhost:8000/api/blockchain-status/

# List wallets
curl http://localhost:8000/api/wallets/
```

## Before Hackathon Demo

1. **Get testnet ETH** (from mobile hotspot or friend's wifi)
2. **Deploy contract**:
   ```bash
   cd mamalert-blockchain
   export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
   npx hardhat run scripts/deploy.js --network baseSepolia
   ```
3. **Update .env** with contract address
4. **Test**: `python test_blockchain.py`

## Documentation

- **API_DOCUMENTATION.md** - Complete API reference for Developer B
- **BACKEND_COMPLETE.md** - Full summary of what's been built
- **API_CONTRACT.md** - Integration specifications

---

**Everything is ready! Just needs testnet deployment before hackathon.**
