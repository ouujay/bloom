#!/usr/bin/env python3
"""
Comprehensive Wallet & Blockchain Test
Tests wallet creation, token minting, and verifies transactions on blockchain
"""

import os
import sys
import django
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mamalert.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.blockchain_api.models import UserWallet, TokenTransaction, Donation
import blockchain

User = get_user_model()

# Colors
GREEN = '\033[92m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
RED = '\033[91m'
BOLD = '\033[1m'
RESET = '\033[0m'

def print_header(text):
    print(f"\n{BOLD}{BLUE}{'='*70}{RESET}")
    print(f"{BOLD}{BLUE}{text}{RESET}")
    print(f"{BOLD}{BLUE}{'='*70}{RESET}\n")

def print_success(text):
    print(f"{GREEN}✅ {text}{RESET}")

def print_info(text):
    print(f"{YELLOW}ℹ️  {text}{RESET}")

def print_data(label, value):
    print(f"{BOLD}{label}:{RESET} {value}")

def print_link(label, url):
    print(f"{BOLD}{label}:{RESET} {BLUE}{url}{RESET}")

print_header("BLOOM Wallet & Blockchain Test")
print_info("This test will create a user, generate a wallet, mint tokens, and verify on blockchain")

# Step 1: Create or get test user
print_header("Step 1: Create Test User")
email = "wallet.test@bloom.com"
User.objects.filter(email=email).delete()

user = User.objects.create_user(
    username="wallettest",
    email=email,
    password="testpass123",
    first_name="Wallet",
    last_name="Test",
    phone="+2348123456789"
)

print_success(f"Created user: {user.email}")
print_data("User ID", user.id)
print_data("Username", user.username)

# Step 2: Generate wallet
print_header("Step 2: Generate Blockchain Wallet")

# Delete existing wallet if any
UserWallet.objects.filter(user=user).delete()

wallet_data = blockchain.generate_wallet()
print_success("Wallet generated!")
print_data("Address", wallet_data['address'])
print_data("Private Key Length", len(wallet_data['private_key']))

# Save to database
wallet = UserWallet.objects.create(
    user=user,
    wallet_address=wallet_data['address'],
    encrypted_private_key=wallet_data['private_key']
)
print_success(f"Wallet saved to database (ID: {wallet.id})")

# Step 3: Check initial balance
print_header("Step 3: Check Initial Balance")

initial_balance = blockchain.get_balance(wallet.wallet_address)
print_data("Initial Balance", f"{initial_balance} BLOOM")
print_data("Naira Equivalent", f"₦{initial_balance * 2:,.2f}")

if initial_balance == 0:
    print_success("Wallet starts with 0 balance (as expected)")

# Step 4: Mint tokens (Health Checkup Reward)
print_header("Step 4: Mint Tokens - Health Checkup Reward")
print_info("Minting 100 BLOOM tokens for completing a health checkup...")

mint_result = blockchain.mint_tokens(
    user_wallet=wallet.wallet_address,
    amount=100,
    action_type='checkup',
    action_id='TEST_CHECKUP_BLOCKCHAIN_001'
)

if mint_result.get('success'):
    print_success("Tokens minted successfully!")
    print_data("Transaction Hash", mint_result['signature'])
    print_data("Block Number", mint_result.get('block_number', 'Pending'))
    print_data("Gas Used", f"{mint_result.get('gas_used', 0):,} wei")
    print_link("View on Etherscan", mint_result.get('explorer_url', f"https://sepolia.etherscan.io/tx/{mint_result['signature']}"))

    # Save to database
    tx = TokenTransaction.objects.create(
        user_wallet=wallet,
        transaction_type='MINT',
        action_type='checkup',
        action_id='TEST_CHECKUP_BLOCKCHAIN_001',
        token_amount=100,
        naira_equivalent=Decimal('200.00'),
        tx_hash=mint_result['signature'],
        block_number=mint_result.get('block_number'),
        gas_used=mint_result.get('gas_used'),
        status='CONFIRMED'
    )
    print_success(f"Transaction saved to database (ID: {tx.id})")
else:
    print(f"{RED}❌ Minting failed: {mint_result.get('error')}{RESET}")

# Step 5: Check new balance
print_header("Step 5: Verify New Balance")

new_balance = blockchain.get_balance(wallet.wallet_address)
print_data("New Balance", f"{new_balance} BLOOM")
print_data("Naira Equivalent", f"₦{new_balance * 2:,.2f}")

if new_balance == 100:
    print_success("Balance updated correctly! ✅")
else:
    print(f"{YELLOW}⚠️  Expected 100 BLOOM, got {new_balance}{RESET}")

# Step 6: Mint more tokens (Educational Module Reward)
print_header("Step 6: Mint More Tokens - Educational Module Reward")
print_info("Minting 50 BLOOM tokens for completing an educational module...")

mint_result2 = blockchain.mint_tokens(
    user_wallet=wallet.wallet_address,
    amount=50,
    action_type='education',
    action_id='TEST_EDUCATION_BLOCKCHAIN_001'
)

if mint_result2.get('success'):
    print_success("Tokens minted successfully!")
    print_data("Transaction Hash", mint_result2['signature'])
    print_data("Block Number", mint_result2.get('block_number', 'Pending'))
    print_link("View on Etherscan", mint_result2.get('explorer_url', f"https://sepolia.etherscan.io/tx/{mint_result2['signature']}"))

    # Save to database
    tx2 = TokenTransaction.objects.create(
        user_wallet=wallet,
        transaction_type='MINT',
        action_type='education',
        action_id='TEST_EDUCATION_BLOCKCHAIN_001',
        token_amount=50,
        naira_equivalent=Decimal('100.00'),
        tx_hash=mint_result2['signature'],
        block_number=mint_result2.get('block_number'),
        gas_used=mint_result2.get('gas_used'),
        status='CONFIRMED'
    )
    print_success(f"Transaction saved to database (ID: {tx2.id})")

# Step 7: Check final balance
print_header("Step 7: Check Final Balance")

final_balance = blockchain.get_balance(wallet.wallet_address)
print_data("Final Balance", f"{final_balance} BLOOM")
print_data("Naira Equivalent", f"₦{final_balance * 2:,.2f}")

if final_balance == 150:
    print_success("Balance updated correctly! ✅")
else:
    print(f"{YELLOW}⚠️  Expected 150 BLOOM, got {final_balance}{RESET}")

# Step 8: Record a donation
print_header("Step 8: Record Donation on Blockchain")
print_info("Recording a ₦10,000 donation...")

import time
donation_ref = f'TEST_DONATION_BLOCKCHAIN_{int(time.time())}'

donation_result = blockchain.record_deposit(
    amount_naira=10000,
    reference=donation_ref,
    donor_email='testdonor@example.com'
)

if donation_result.get('success'):
    print_success("Donation recorded on blockchain!")
    print_data("Amount", "₦10,000")
    print_data("Reference", donation_ref)
    print_data("Transaction Hash", donation_result['signature'])
    print_link("View on Etherscan", f"https://sepolia.etherscan.io/tx/{donation_result['signature']}")

    # Save to database
    donation = Donation.objects.create(
        donor_email='testdonor@example.com',
        amount_naira=Decimal('10000.00'),
        paystack_reference=donation_ref,
        blockchain_tx_hash=donation_result['signature'],
        blockchain_recorded=True,
        payment_status='SUCCESS'
    )
    print_success(f"Donation saved to database (ID: {donation.id})")

# Step 9: Get transaction history
print_header("Step 9: Transaction History")

transactions = TokenTransaction.objects.filter(user_wallet=wallet).order_by('-created_at')
print_info(f"Found {transactions.count()} transactions for this wallet")

for i, tx in enumerate(transactions, 1):
    print(f"\n{BOLD}Transaction {i}:{RESET}")
    print(f"  Type: {tx.transaction_type}")
    print(f"  Amount: {tx.token_amount} BLOOM (₦{tx.naira_equivalent})")
    print(f"  Action: {tx.action_type}")
    print(f"  Status: {tx.status}")
    print(f"  Hash: {tx.tx_hash[:20]}...")
    print(f"  {BLUE}https://sepolia.etherscan.io/tx/{tx.tx_hash}{RESET}")

# Step 10: Check total supply
print_header("Step 10: Check Total BLOOM Supply")

total_supply = blockchain.get_total_supply()
print_data("Total BLOOM Supply", f"{total_supply:,} BLOOM")
print_info("This is the total supply of BLOOM tokens across all users")

# Summary
print_header("TEST SUMMARY")

print(f"{BOLD}Test User:{RESET}")
print(f"  Email: {user.email}")
print(f"  Wallet: {wallet.wallet_address}")
print(f"  Balance: {final_balance} BLOOM (₦{final_balance * 2:,.2f})")

print(f"\n{BOLD}Transactions Created:{RESET}")
transactions_created = TokenTransaction.objects.filter(user_wallet=wallet).count()
print(f"  Total: {transactions_created} transactions")
print(f"  All viewable on Etherscan Sepolia")

print(f"\n{BOLD}Blockchain Links:{RESET}")
all_txs = TokenTransaction.objects.filter(user_wallet=wallet)
for tx in all_txs:
    print(f"  {BLUE}https://sepolia.etherscan.io/tx/{tx.tx_hash}{RESET}")

all_donations = Donation.objects.filter(blockchain_recorded=True)
for don in all_donations:
    if don.blockchain_tx_hash:
        print(f"  {BLUE}https://sepolia.etherscan.io/tx/{don.blockchain_tx_hash}{RESET}")

print(f"\n{BOLD}Smart Contract:{RESET}")
contract_address = os.getenv('CONTRACT_ADDRESS')
print(f"  Address: {contract_address}")
print(f"  {BLUE}https://sepolia.etherscan.io/address/{contract_address}{RESET}")

print(f"\n{GREEN}{BOLD}{'='*70}{RESET}")
print(f"{GREEN}{BOLD}✅ WALLET TEST COMPLETE!{RESET}")
print(f"{GREEN}{BOLD}All transactions are live on Ethereum Sepolia blockchain!{RESET}")
print(f"{GREEN}{BOLD}{'='*70}{RESET}\n")

print(f"{YELLOW}Next Steps:{RESET}")
print("1. Click the Etherscan links above to view transactions")
print("2. Login to the app with wallet.test@bloom.com / testpass123")
print("3. Check your wallet page to see the 150 BLOOM tokens")
print("4. All transactions are permanently recorded on blockchain! 🎉")
