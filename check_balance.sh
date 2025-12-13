#!/bin/bash
# Quick script to check if you have testnet ETH

echo "================================================"
echo "Checking Balance for MamaAlert Admin Wallet"
echo "================================================"
echo ""
echo "Wallet Address: 0x12E1A74e2534088da36c6Ff9172C885EA64ad338"
echo ""

# Check balance on Base Sepolia
BALANCE=$(curl -s -X POST https://sepolia.base.org \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBalance","params":["0x12E1A74e2534088da36c6Ff9172C885EA64ad338","latest"],"id":1}' \
  | python3 -c "import sys, json; print(int(json.load(sys.stdin)['result'], 16) / 10**18)" 2>/dev/null)

echo "Balance on Base Sepolia: ${BALANCE} ETH"
echo ""

if (( $(echo "$BALANCE > 0" | bc -l 2>/dev/null || echo 0) )); then
    echo "✅ SUCCESS! You have testnet ETH!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy contract: cd mamalert-blockchain && npx hardhat run scripts/deploy.js --network baseSepolia"
    echo "2. Update .env with contract address"
    echo "3. Test: python test_blockchain.py"
else
    echo "❌ No ETH yet. Keep trying the faucets!"
    echo ""
    echo "View on explorer:"
    echo "https://sepolia.basescan.org/address/0x12E1A74e2534088da36c6Ff9172C885EA64ad338"
fi

echo ""
echo "================================================"
