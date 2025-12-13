# MetaMask Setup Guide - Step by Step

## Step 1: Install MetaMask (2 minutes)

### For Chrome/Brave/Edge:
1. Visit: **https://metamask.io/download/**
2. Click **"Install MetaMask for Chrome"** (or your browser)
3. Click **"Add to Chrome"** in Chrome Web Store
4. Click **"Add extension"** when prompted
5. MetaMask icon should appear in your browser toolbar (top right)

### For Firefox:
1. Visit: **https://metamask.io/download/**
2. Click **"Install MetaMask for Firefox"**
3. Follow Firefox add-on installation

---

## Step 2: Import Your Existing Wallet (3 minutes)

**IMPORTANT:** We're importing your EXISTING wallet (the one we already generated), not creating a new one.

1. **Click the MetaMask extension icon** (fox icon in toolbar)

2. **Click "Get Started"**

3. **Click "Import an existing wallet"** (NOT "Create a new wallet")

4. **Agree to terms**

5. **On "Import with Secret Recovery Phrase" screen:**
   - **IMPORTANT:** Click **"Import using Secret Recovery Phrase"** at the bottom
   - Then click **"No thanks"** (we'll use private key instead)

6. **Alternative Method - Import with Private Key:**
   - After creating initial MetaMask
   - Click MetaMask icon → Click account circle (top right)
   - Click **"Import Account"**
   - Select **"Private Key"**
   - Paste your private key:
     ```
     0x2564591ee38a80abb9c1e66c8990e5e2e9dd3ae39dfeb967dfeda87f0f1236f8
     ```
   - Click **"Import"**

7. **Your wallet address should show:**
   ```
   0x12E1A74e2534088da36c6Ff9172C885EA64ad338
   ```

8. **Set a password** (for MetaMask access - can be anything you want)

9. **Done!** Your wallet is now in MetaMask

---

## Step 3: Add Base Sepolia Network (2 minutes)

1. **Click MetaMask icon** in toolbar

2. **Click the network dropdown** (top left - probably says "Ethereum Mainnet")

3. **Scroll down and click "Add network"**

4. **Click "Add a network manually"** (at bottom)

5. **Enter these details EXACTLY:**
   - **Network Name:** `Base Sepolia`
   - **New RPC URL:** `https://sepolia.base.org`
   - **Chain ID:** `84532`
   - **Currency Symbol:** `ETH`
   - **Block Explorer URL:** `https://sepolia.basescan.org`

6. **Click "Save"**

7. **Click "Switch to Base Sepolia"** when prompted

8. **You should now see:**
   - Network: "Base Sepolia" (top left)
   - Balance: 0 ETH (this is what we're fixing!)
   - Your address: `0x12E1...d338`

---

## Step 4: Try Coinbase Faucet with MetaMask (5 minutes)

### Option A: Coinbase Wallet Faucet

1. **Visit:** https://portal.cdp.coinbase.com/products/faucet

2. **Sign up/Sign in:**
   - Click **"Sign in"** or **"Get Started"**
   - Use Google, GitHub, or email
   - Complete signup (free account)

3. **Connect MetaMask:**
   - Click **"Connect Wallet"** button
   - Select **"MetaMask"**
   - Click **"Next"** → **"Connect"** in MetaMask popup
   - Approve connection

4. **Request testnet ETH:**
   - Make sure "Base Sepolia" is selected
   - Your address should auto-populate
   - Click **"Request"** or **"Get testnet ETH"**

5. **Wait 1-2 minutes:**
   - Check MetaMask - balance should update
   - If it doesn't work, see Option B below

### Option B: Alternative Faucets with MetaMask

If Coinbase doesn't work, try these with MetaMask connected:

**1. Alchemy Faucet (with MetaMask):**
   - Visit: https://www.alchemy.com/faucets/base-sepolia
   - Make sure you're logged into Alchemy
   - Make sure MetaMask is on Base Sepolia network
   - Click "Send Me ETH"
   - Check MetaMask balance

**2. Chainlink Faucet:**
   - Visit: https://faucets.chain.link/
   - Connect MetaMask
   - Select "Base Sepolia"
   - Request ETH

---

## Step 5: Verify You Got ETH (1 minute)

### Check in MetaMask:
1. Click MetaMask icon
2. Look at balance (should be > 0 ETH)
3. Should see something like "0.05 ETH" or "0.1 ETH"

### Check on Basescan:
1. Visit: https://sepolia.basescan.org/address/0x12E1A74e2534088da36c6Ff9172C885EA64ad338
2. Should see balance and transaction history

### Check via command line:
```bash
curl -s -X POST https://sepolia.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x12E1A74e2534088da36c6Ff9172C885EA64ad338","latest"],"id":1}' \
  | python3 -c "import sys, json; print(f'Balance: {int(json.load(sys.stdin)[\"result\"], 16) / 10**18} ETH')"
```

---

## Step 6: Deploy Contract Once You Have ETH! (2 minutes)

Once your balance shows > 0 ETH:

```bash
cd /Users/useruser/Documents/bloom/mamalert-blockchain
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
npx hardhat run scripts/deploy.js --network baseSepolia
```

**Expected output:**
```
Deploying BloomToken to Base Sepolia...
Deploying with account: 0x12E1A74e2534088da36c6Ff9172C885EA64ad338
Account balance: 0.05 ETH

✅ BloomToken deployed to: 0xYOUR_CONTRACT_ADDRESS
📝 IMPORTANT: Save this address in your .env file
🔍 View on explorer: https://sepolia.basescan.org/address/0xYOUR_CONTRACT_ADDRESS
```

**Copy the contract address!**

---

## Step 7: Update .env File (1 minute)

```bash
cd /Users/useruser/Documents/bloom
nano .env
```

Update this line:
```
CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS_FROM_STEP_6
```

Save and exit (Ctrl+O, Enter, Ctrl+X)

---

## Step 8: Test Everything! (5 minutes)

```bash
cd /Users/useruser/Documents/bloom
source venv/bin/activate
python test_blockchain.py
```

You should see:
```
✅ Connected to Base Sepolia
✅ Donation recorded successfully
✅ Tokens minted successfully
✅ Balance: 200 BLOOM
✅ Tokens burned successfully
✅ Balance: 100 BLOOM
✅ Withdrawal recorded successfully
🎉 TESTS COMPLETE
```

---

## Troubleshooting

### MetaMask doesn't show my wallet address
- Make sure you imported the correct private key
- Check the address matches: `0x12E1A74e2534088da36c6Ff9172C885EA64ad338`
- If wrong, remove account and re-import

### Coinbase faucet says "Already claimed"
- Try from different browser
- Try other faucets (Chainlink, Alchemy)
- Wait 24 hours and try again

### MetaMask shows 0 ETH after claiming
- Wait 2-5 minutes for transaction to confirm
- Refresh MetaMask (close and reopen)
- Check Basescan to see if transaction is pending

### Base Sepolia network not showing
- Double-check Chain ID is exactly: `84532`
- Double-check RPC URL is exactly: `https://sepolia.base.org`
- Try removing and re-adding the network

### Still can't get testnet ETH?
- Ask in Ethereum Discord: https://discord.gg/ethereum (#testnet-faucet channel)
- Ask in your hackathon Slack/Discord
- Tweet asking for help with your address
- Buy $5 mainnet ETH and use Chainlink faucet (guaranteed to work)

---

## Quick Reference

**Your Wallet Address:**
```
0x12E1A74e2534088da36c6Ff9172C885EA64ad338
```

**Your Private Key:** (in .env file)
```
0x2564591ee38a80abb9c1e66c8990e5e2e9dd3ae39dfeb967dfeda87f0f1236f8
```

**Base Sepolia Network Details:**
- RPC URL: `https://sepolia.base.org`
- Chain ID: `84532`
- Explorer: `https://sepolia.basescan.org`

**Check Balance:**
https://sepolia.basescan.org/address/0x12E1A74e2534088da36c6Ff9172C885EA64ad338

---

## Next Steps After Getting ETH

1. ✅ Deploy contract
2. ✅ Update .env
3. ✅ Test with `python test_blockchain.py`
4. ✅ Start Django server
5. ✅ Share contract address with Developer B
6. ✅ Integration testing
7. ✅ Hackathon demo ready!

---

Good luck! Follow the steps carefully and you should have testnet ETH in 5-10 minutes.
