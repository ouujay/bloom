# Working Base Sepolia Faucets (Tested Alternatives)

Your address: `0x12E1A74e2534088da36c6Ff9172C885EA64ad338`

## ❌ FAUCETS THAT DIDN'T WORK
- QuickNode: Requires real mainnet ETH
- Bware Labs: Under maintenance
- Alchemy: 403 Forbidden errors (may need troubleshooting)

## ✅ FAUCETS TO TRY (In Priority Order)

### 1. LearnWeb3 Faucet ⭐ (RECOMMENDED - TRY FIRST)
- **URL**: https://learnweb3.io/faucets/base_sepolia
- **Requirements**: None or simple signup
- **Amount**: 0.05-0.5 ETH
- **Speed**: Instant
- **Success Rate**: High

### 2. Triangle Platform Faucet
- **URL**: https://faucet.triangleplatform.com/base/sepolia
- **Requirements**: Minimal
- **Amount**: 0.05 ETH
- **Speed**: Fast
- **Success Rate**: Medium-High

### 3. Coinbase Wallet Faucet
- **URL**: https://portal.cdp.coinbase.com/products/faucet
- **Requirements**: Free Coinbase account
- **Amount**: 0.1 ETH
- **Speed**: Instant after signup
- **Success Rate**: High

### 4. Two-Step Method (MOST RELIABLE IF DIRECT FAUCETS FAIL)

#### Step 1: Get Sepolia ETH (Ethereum Testnet)

**Option A: Sepolia PoW Faucet** ⭐ (Always works, no signup)
- **URL**: https://sepolia-faucet.pk910.de/
- **How it works**: Browser mining for 5-10 minutes
- **Amount**: 0.05-0.5 ETH
- **Advantage**: No signup, no verification, always available
- **Steps**:
  1. Visit the URL
  2. Enter: `0x12E1A74e2534088da36c6Ff9172C885EA64ad338`
  3. Start mining in browser
  4. Wait 5-10 minutes
  5. Claim your Sepolia ETH

**Option B: Alchemy Sepolia Faucet**
- **URL**: https://sepoliafaucet.com/
- **Requirements**: Alchemy account (you already have this!)
- **Amount**: 0.5 ETH
- **Speed**: Instant

**Option C: Infura Sepolia Faucet**
- **URL**: https://www.infura.io/faucet/sepolia
- **Requirements**: Free Infura account
- **Amount**: 0.5 ETH

#### Step 2: Bridge Sepolia ETH to Base Sepolia
1. **Visit**: https://bridge.base.org/
2. **Connect wallet**:
   - Import using your private key in MetaMask or
   - Use WalletConnect
3. **Select networks**:
   - From: Ethereum Sepolia
   - To: Base Sepolia
4. **Amount**: Bridge 0.05-0.1 ETH (enough for many deployments)
5. **Wait**: 5-15 minutes for bridge transaction
6. **Verify**: Check https://sepolia.basescan.org/address/0x12E1A74e2534088da36c6Ff9172C885EA64ad338

## 🔧 Troubleshooting Alchemy 403 Error

If you want to try fixing Alchemy since you have an account:

1. **Clear browser cache**:
   - Safari: Preferences → Privacy → Manage Website Data → Remove All
   - Chrome: Settings → Privacy → Clear browsing data

2. **Try incognito mode**:
   - Log in to Alchemy at https://dashboard.alchemy.com
   - Then visit https://www.alchemy.com/faucets/base-sepolia in same window

3. **Verify email**: Check for Alchemy verification email

4. **Try different browser**: Chrome, Safari, Firefox

5. **Disable VPN/ad blockers**: May interfere with faucet

## ✅ Check Your Balance Anytime

```bash
curl -s -X POST https://sepolia.base.org \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getBalance",
    "params":["0x12E1A74e2534088da36c6Ff9172C885EA64ad338", "latest"],
    "id":1
  }' | python3 -c "import sys, json; result = json.load(sys.stdin)['result']; print(f'Balance: {int(result, 16) / 10**18} ETH')"
```

Or visit: https://sepolia.basescan.org/address/0x12E1A74e2534088da36c6Ff9172C885EA64ad338

## 🎯 Recommended Strategy

1. **Try LearnWeb3 first** (5 mins)
2. **If that fails, try Triangle** (5 mins)
3. **If both fail, use Sepolia PoW mining method** (15 mins total)
   - Most reliable
   - No signup required
   - Always available
4. **Bridge Sepolia to Base Sepolia** (15 mins)

## ⚡ Once You Get ETH

You need minimum **0.01 ETH** to deploy. Once you have it:

```bash
cd /Users/useruser/Documents/bloom/mamalert-blockchain
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
npx hardhat run scripts/deploy.js --network baseSepolia
```

Good luck! The Sepolia PoW mining method is your most reliable option if direct Base Sepolia faucets keep failing.
