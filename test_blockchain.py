"""
Test script for blockchain integration
Run: python test_blockchain.py (after contract is deployed)
"""

import os
from dotenv import load_dotenv
load_dotenv()

# Only run tests if contract is deployed
CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS')

if not CONTRACT_ADDRESS:
    print("=" * 60)
    print("⚠️  CONTRACT NOT YET DEPLOYED")
    print("=" * 60)
    print("\nThis test script requires a deployed contract.")
    print("\nSteps to deploy:")
    print("1. Get testnet ETH from faucet")
    print("2. Run: cd mamalert-blockchain && npx hardhat run scripts/deploy.js --network baseSepolia")
    print("3. Add CONTRACT_ADDRESS to .env file")
    print("4. Run this test again")
    print("\n" + "=" * 60)
    exit(0)

from blockchain import (
    record_deposit,
    mint_tokens,
    burn_tokens,
    record_withdrawal,
    get_balance,
    get_total_supply,
    generate_wallet,
    w3
)

# Generate test wallet
print("=" * 60)
print("BLOOM TOKEN BLOCKCHAIN TESTS")
print("=" * 60)

print("\n📝 Generating test wallet...")
test_wallet_data = generate_wallet()
TEST_WALLET = test_wallet_data['address']
print(f"Test wallet address: {TEST_WALLET}")
print(f"⚠️  Test wallet private key: {test_wallet_data['private_key'][:10]}... (hidden)")

print("\n" + "=" * 60)

# Test 1: Check Connection
print("\n1️⃣  Testing blockchain connection...")
if w3.is_connected():
    print(f"✅ Connected to Base Sepolia")
    print(f"   Latest block: {w3.eth.block_number}")
else:
    print("❌ Not connected to Base Sepolia")
    exit(1)

# Test 2: Record Donation
print("\n2️⃣  Recording test donation...")
result = record_deposit(
    amount_naira=10000,
    reference="TEST_REF_001",
    donor_email="donor@example.com"
)
if result['success']:
    print(f"✅ Donation recorded successfully")
    print(f"   TX Hash: {result['signature'][:10]}...")
    print(f"   Explorer: {result['explorer_url']}")
    print(f"   Gas used: {result['gas_used']}")
else:
    print(f"❌ Failed: {result['error']}")

# Test 3: Mint Tokens
print("\n3️⃣  Minting tokens to test wallet...")
result = mint_tokens(
    user_wallet=TEST_WALLET,
    amount=200,
    action_type="checkup",
    action_id="TEST_ACTION_001"
)
if result['success']:
    print(f"✅ Tokens minted successfully")
    print(f"   TX Hash: {result['signature'][:10]}...")
    print(f"   Explorer: {result['explorer_url']}")
    print(f"   Gas used: {result['gas_used']}")
else:
    print(f"❌ Failed: {result['error']}")

# Test 4: Check Balance
print("\n4️⃣  Checking balance...")
balance = get_balance(TEST_WALLET)
print(f"✅ Balance: {balance} BLOOM")
if balance == 200:
    print("   ✓ Balance matches minted amount")
else:
    print(f"   ⚠️  Expected 200, got {balance}")

# Test 5: Burn Tokens
print("\n5️⃣  Burning 100 tokens...")
result = burn_tokens(
    user_wallet=TEST_WALLET,
    amount=100,
    withdrawal_id="TEST_WITHDRAWAL_001"
)
if result['success']:
    print(f"✅ Tokens burned successfully")
    print(f"   TX Hash: {result['signature'][:10]}...")
    print(f"   Gas used: {result['gas_used']}")
else:
    print(f"❌ Failed: {result['error']}")

# Test 6: Check Balance After Burn
print("\n6️⃣  Checking balance after burn...")
balance = get_balance(TEST_WALLET)
print(f"✅ Balance: {balance} BLOOM")
if balance == 100:
    print("   ✓ Balance correctly decreased")
else:
    print(f"   ⚠️  Expected 100, got {balance}")

# Test 7: Record Withdrawal
print("\n7️⃣  Recording withdrawal...")
result = record_withdrawal(
    user_wallet=TEST_WALLET,
    token_amount=100,
    naira_amount=200,
    withdrawal_id="TEST_WITHDRAWAL_001",
    payment_reference="OPAY_TEST_12345"
)
if result['success']:
    print(f"✅ Withdrawal recorded successfully")
    print(f"   TX Hash: {result['signature'][:10]}...")
    print(f"   Explorer: {result['explorer_url']}")
else:
    print(f"❌ Failed: {result['error']}")

# Test 8: Total Supply
print("\n8️⃣  Checking total supply...")
supply = get_total_supply()
print(f"✅ Total Supply: {supply} BLOOM")
if supply == 100:
    print("   ✓ Supply matches (200 minted - 100 burned)")
else:
    print(f"   ℹ️  Current supply: {supply}")

print("\n" + "=" * 60)
print("🎉 TESTS COMPLETE")
print("=" * 60)
print(f"\n📊 Summary:")
print(f"   Contract: {CONTRACT_ADDRESS}")
print(f"   Test Wallet: {TEST_WALLET}")
print(f"   Final Balance: {balance} BLOOM")
print(f"   Total Supply: {supply} BLOOM")
print(f"\n🔍 View all transactions:")
print(f"   https://sepolia.basescan.org/address/{CONTRACT_ADDRESS}")
print("\n" + "=" * 60)
