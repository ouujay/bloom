# How to Get Base Sepolia Testnet ETH

Your admin address: `0x12E1A74e2534088da36c6Ff9172C885EA64ad338`

## Option 1: QuickNode Faucet (Usually Works Best)

1. Visit: https://faucet.quicknode.com/base/sepolia
2. Enter your address: `0x12E1A74e2534088da36c6Ff9172C885EA64ad338`
3. Complete any verification
4. Request ETH

## Option 2: LearnWeb3 Faucet

1. Visit: https://learnweb3.io/faucets/base_sepolia
2. Enter your address: `0x12E1A74e2534088da36c6Ff9172C885EA64ad338`
3. Request testnet ETH

## Option 3: Alchemy Faucet (Requires Account)

1. Visit: https://www.alchemy.com/faucets/base-sepolia
2. **Sign in/Create free Alchemy account** (This is required!)
3. Select "Base Sepolia"
4. Enter address: `0x12E1A74e2534088da36c6Ff9172C885EA64ad338`
5. Request ETH

## Option 4: Coinbase Wallet Faucet

1. Visit: https://portal.cdp.coinbase.com/products/faucet
2. Connect or enter your address
3. Select Base Sepolia
4. Request testnet ETH

## Option 5: Two-Step Method (If Others Fail)

Base Sepolia testnet ETH can be obtained via Ethereum Sepolia:

### Step 1: Get Sepolia ETH
1. Visit: https://sepoliafaucet.com/
2. Enter your address: `0x12E1A74e2534088da36c6Ff9172C885EA64ad338`
3. Request Sepolia ETH

### Step 2: Bridge to Base Sepolia
1. Visit Base Sepolia Bridge: https://bridge.base.org/
2. Connect wallet with your private key or use manual bridge
3. Bridge from Sepolia to Base Sepolia

## Checking Your Balance

After requesting, check if ETH arrived:
https://sepolia.basescan.org/address/0x12E1A74e2534088da36c6Ff9172C885EA64ad338

You should see:
- Balance: ~0.05 to 0.5 ETH (testnet)
- This is enough for dozens of deployments

## How Much Do You Need?

- **Minimum for deployment:** 0.01 ETH
- **Recommended:** 0.1 ETH (for multiple transactions)
- **One deployment costs:** ~0.001-0.003 ETH

## Troubleshooting

### 403 Forbidden Error (Alchemy)
- **Solution:** Sign in to Alchemy first, then try faucet
- **Or:** Use QuickNode/LearnWeb3 faucets instead

### Rate Limit Error
- **Solution:** Wait 24 hours or try different faucet
- Each faucet has its own rate limit

### "Address already claimed"
- **Solution:** Try a different faucet
- You can use multiple faucets for the same address

### Nothing in Balance After 5 Minutes
- Check transaction on explorer
- Try a different faucet
- Wait a bit longer (sometimes takes 10-15 mins)

## Alternative: Deploy Without Faucet (Advanced)

If all faucets fail, you can deploy using Remix IDE which provides test ETH:

1. Go to https://remix.ethereum.org
2. Copy your BloomToken.sol contract
3. Use Remix's built-in deployment (it provides test accounts)
4. Deploy to Base Sepolia via Remix
5. Copy the deployed contract address

## What to Do After You Get ETH

1. Verify balance on Basescan (link above)
2. Run deployment:
   ```bash
   cd /Users/useruser/Documents/bloom/mamalert-blockchain
   export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
   npx hardhat run scripts/deploy.js --network baseSepolia
   ```
3. Save the contract address from the output
4. Continue to Phase 4!

## Quick Test Once You Have ETH

```bash
# Test if you have enough ETH
curl -X POST https://sepolia.base.org \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getBalance",
    "params":["0x12E1A74e2534088da36c6Ff9172C885EA64ad338", "latest"],
    "id":1
  }'
```

If you get a result with `"result":"0x..."` and it's not "0x0", you have ETH!
