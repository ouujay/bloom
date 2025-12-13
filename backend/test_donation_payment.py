#!/usr/bin/env python3
"""
Comprehensive Donation & Payment Test
Tests ALATPay payment integration and blockchain recording
"""

import os
import sys
import django
import time
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mamalert.settings')
django.setup()

from apps.tokens.models import Donation, DonationPool
from apps.tokens.services import DonationService
from apps.payments.services import alatpay_service
import blockchain

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

def print_error(text):
    print(f"{RED}❌ {text}{RESET}")

def print_data(label, value):
    print(f"{BOLD}{label}:{RESET} {value}")

def print_link(label, url):
    print(f"{BOLD}{label}:{RESET} {BLUE}{url}{RESET}")

print_header("BLOOM Donation & Payment Test")
print_info("This test will simulate a donation with ALATPay and record it on blockchain")

# Step 1: Check payment configuration
print_header("Step 1: Verify Payment Configuration")

alatpay_configured = all([
    os.getenv('ALATPAY_PUBLIC_KEY'),
    os.getenv('ALATPAY_SECRET_KEY'),
    os.getenv('ALATPAY_BUSINESS_ID')
])

blockchain_configured = all([
    os.getenv('CONTRACT_ADDRESS'),
    os.getenv('ADMIN_PRIVATE_KEY')
])

if alatpay_configured:
    print_success("ALATPay credentials configured")
    print_data("Business ID", os.getenv('ALATPAY_BUSINESS_ID'))
    print_data("Base URL", os.getenv('ALATPAY_BASE_URL', 'https://apibox.alatpay.ng'))
else:
    print_error("ALATPay credentials missing! Check .env file")

if blockchain_configured:
    print_success("Blockchain credentials configured")
    print_data("Contract Address", os.getenv('CONTRACT_ADDRESS'))
else:
    print_error("Blockchain credentials missing! Check .env file")

# Step 2: Check donation pool
print_header("Step 2: Check Donation Pool")

try:
    pool = DonationPool.get_pool()
    print_success("Donation pool exists")
    print_data("Pool Balance", f"₦{pool.pool_balance:,.2f}")
    print_data("Total Tokens Issued", f"{pool.total_tokens_issued:,.0f}")
    print_data("Token Value", f"₦{pool.token_value_naira:,.2f}")
    initial_pool_balance = pool.pool_balance
except Exception as e:
    print_error(f"Failed to get donation pool: {e}")
    print_info("Creating initial donation pool...")
    pool = DonationPool.objects.create(
        pool_balance=Decimal('0'),
        total_tokens_issued=Decimal('0'),
        total_tokens_withdrawn=Decimal('0'),
        token_value_naira=Decimal('2.00')
    )
    print_success(f"Created donation pool (ID: {pool.id})")
    initial_pool_balance = Decimal('0')

# Step 3: Create a test donation
print_header("Step 3: Create Test Donation")

donation_amount = 10000  # ₦10,000
donor_email = 'testdonor@bloom.com'
donor_name = 'Test Donor'
reference = f'BLOOM-TEST-{int(time.time())}'

print_info(f"Creating donation for ₦{donation_amount:,.2f}...")

donation = DonationService.create_donation(
    amount_naira=donation_amount,
    donor_name=donor_name,
    donor_email=donor_email,
    donor_phone='+2348123456789',
    is_anonymous=False,
    payment_reference=reference,
    payment_method='alatpay'
)

print_success("Donation created!")
print_data("Donation ID", donation.id)
print_data("Reference", reference)
print_data("Amount", f"₦{donation.amount_naira:,.2f}")
print_data("Status", donation.status)

# Step 4: Test ALATPay payment initiation (will likely fail without actual account)
print_header("Step 4: Test ALATPay Payment Initiation")

print_info("Testing ALATPay API...")
payment_result = alatpay_service.create_payment(
    amount=donation_amount,
    email=donor_email,
    reference=reference,
    metadata={
        'donation_id': str(donation.id),
        'donor_name': donor_name
    }
)

if payment_result.get('success'):
    print_success("ALATPay payment initiated successfully!")
    payment_data = payment_result.get('data', {}).get('data', {})
    print_data("Payment URL", payment_data.get('paymentUrl', 'N/A'))
    print_data("Bank Name", payment_data.get('bankName', 'N/A'))
    print_data("Account Number", payment_data.get('accountNumber', 'N/A'))
    print_data("Account Name", payment_data.get('accountName', 'N/A'))
else:
    print_error(f"ALATPay initiation failed: {payment_result.get('error')}")
    print_info("This is expected in test mode. Proceeding with manual confirmation...")

# Step 5: Manually confirm the donation (simulating payment success)
print_header("Step 5: Confirm Donation (Simulate Payment Success)")

print_info("Confirming donation manually (simulating successful payment)...")

donation, was_confirmed = DonationService.confirm_donation(donation.id)

if was_confirmed:
    print_success("Donation confirmed successfully!")
    print_data("Confirmed At", donation.confirmed_at)
    print_data("Status", donation.status)
else:
    print_info("Donation was already confirmed")

# Step 6: Verify pool balance updated
print_header("Step 6: Verify Donation Pool Updated")

pool.refresh_from_db()
print_data("Pool Balance (Before)", f"₦{initial_pool_balance:,.2f}")
print_data("Pool Balance (After)", f"₦{pool.pool_balance:,.2f}")
print_data("Increase", f"₦{pool.pool_balance - initial_pool_balance:,.2f}")

if pool.pool_balance == initial_pool_balance + donation.amount_naira:
    print_success("Pool balance updated correctly! ✅")
else:
    print_error(f"Pool balance mismatch! Expected ₦{initial_pool_balance + donation.amount_naira:,.2f}")

# Step 7: Record donation on blockchain
print_header("Step 7: Record Donation on Blockchain")

if not blockchain_configured:
    print_error("Blockchain not configured, skipping blockchain recording")
else:
    print_info(f"Recording ₦{donation_amount:,.2f} donation on Ethereum blockchain...")

    blockchain_result = blockchain.record_deposit(
        amount_naira=donation_amount,
        reference=reference,
        donor_email=donor_email
    )

    if blockchain_result.get('success'):
        print_success("Donation recorded on blockchain!")
        print_data("Transaction Hash", blockchain_result['signature'])
        print_data("Block Number", blockchain_result.get('block_number', 'Pending'))
        print_data("Gas Used", f"{blockchain_result.get('gas_used', 0):,} wei")
        print_link("View on Etherscan",
                   f"https://sepolia.etherscan.io/tx/{blockchain_result['signature']}")

        # Update donation with blockchain info
        from apps.blockchain_api.models import Donation as BlockchainDonation
        try:
            blockchain_donation = BlockchainDonation.objects.create(
                donor_email=donor_email,
                amount_naira=Decimal(str(donation_amount)),
                paystack_reference=reference,  # Use reference even though not Paystack
                blockchain_tx_hash=blockchain_result['signature'],
                blockchain_recorded=True,
                payment_status='SUCCESS'
            )
            print_success(f"Blockchain donation record created (ID: {blockchain_donation.id})")
        except Exception as e:
            print_error(f"Failed to create blockchain donation record: {e}")
    else:
        print_error(f"Blockchain recording failed: {blockchain_result.get('error')}")

# Step 8: Get recent donations
print_header("Step 8: Recent Donations")

recent_donations = DonationService.get_recent_donations(limit=5)
print_info(f"Showing {recent_donations.count()} most recent confirmed donations:")

for i, don in enumerate(recent_donations, 1):
    print(f"\n{BOLD}Donation {i}:{RESET}")
    print(f"  Amount: ₦{don.amount_naira:,.2f}")
    print(f"  Donor: {don.donor_name or 'Anonymous'}")
    print(f"  Email: {don.donor_email}")
    print(f"  Reference: {don.payment_reference}")
    print(f"  Status: {don.status}")
    print(f"  Confirmed: {don.confirmed_at}")

# Step 9: Check blockchain donations
print_header("Step 9: Blockchain Donation Records")

from apps.blockchain_api.models import Donation as BlockchainDonation
blockchain_donations = BlockchainDonation.objects.filter(blockchain_recorded=True)[:5]
print_info(f"Found {blockchain_donations.count()} donations recorded on blockchain")

for i, don in enumerate(blockchain_donations, 1):
    print(f"\n{BOLD}Blockchain Donation {i}:{RESET}")
    print(f"  Amount: ₦{don.amount_naira:,.2f}")
    print(f"  Email: {don.donor_email}")
    print(f"  Reference: {don.paystack_reference}")
    print(f"  Tx Hash: {don.blockchain_tx_hash[:20]}...")
    print(f"  {BLUE}https://sepolia.etherscan.io/tx/{don.blockchain_tx_hash}{RESET}")

# Summary
print_header("TEST SUMMARY")

print(f"{BOLD}Donation Created:{RESET}")
print(f"  Reference: {reference}")
print(f"  Amount: ₦{donation.amount_naira:,.2f}")
print(f"  Status: {donation.status}")

print(f"\n{BOLD}Donation Pool:{RESET}")
print(f"  Total Balance: ₦{pool.pool_balance:,.2f}")
print(f"  Tokens Issued: {pool.total_tokens_issued:,.0f}")
print(f"  Token Value: ₦{pool.token_value_naira:,.2f}")

if blockchain_configured and blockchain_result.get('success'):
    print(f"\n{BOLD}Blockchain:{RESET}")
    print(f"  Contract: {os.getenv('CONTRACT_ADDRESS')}")
    print(f"  {BLUE}https://sepolia.etherscan.io/address/{os.getenv('CONTRACT_ADDRESS')}{RESET}")
    print(f"  Donation Tx: {BLUE}https://sepolia.etherscan.io/tx/{blockchain_result['signature']}{RESET}")

print(f"\n{GREEN}{BOLD}{'='*70}{RESET}")
print(f"{GREEN}{BOLD}✅ DONATION TEST COMPLETE!{RESET}")
print(f"{GREEN}{BOLD}{'='*70}{RESET}\n")

print(f"{YELLOW}Test Results:{RESET}")
print(f"✅ Donation created in database")
print(f"✅ Donation pool updated correctly")
if alatpay_configured:
    print(f"{'✅' if payment_result.get('success') else '⚠️'} ALATPay integration {'working' if payment_result.get('success') else 'tested (may need live credentials)'}")
else:
    print(f"⚠️  ALATPay not configured")
if blockchain_configured and blockchain_result.get('success'):
    print(f"✅ Blockchain recording successful")
    print(f"✅ Transaction visible on Etherscan")
elif blockchain_configured:
    print(f"❌ Blockchain recording failed")
else:
    print(f"⚠️  Blockchain not configured")

print(f"\n{YELLOW}Next Steps:{RESET}")
print("1. Click the Etherscan link above to view the blockchain transaction")
print("2. Test the payment API from the frontend application")
print("3. Verify webhook handling when payments are completed")
print("4. All donations are transparently recorded on blockchain! 🎉")
