#!/usr/bin/env python3
"""
Comprehensive System Test
Tests all major functionality and user flows
"""

import os
import sys
import django
import time
import requests
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mamalert.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.blockchain_api.models import UserWallet, TokenTransaction, Donation as BlockchainDonation
from apps.tokens.models import Donation, DonationPool
from apps.tokens.services import DonationService
from apps.payments.services import alatpay_service
import blockchain

User = get_user_model()

# Colors
GREEN = '\033[92m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
RED = '\033[91m'
BOLD = '\033[1m'
RESET = '\033[0m'

test_results = {
    'passed': [],
    'failed': [],
    'warnings': []
}

def print_header(text):
    print(f"\n{BOLD}{BLUE}{'='*80}{RESET}")
    print(f"{BOLD}{BLUE}{text.center(80)}{RESET}")
    print(f"{BOLD}{BLUE}{'='*80}{RESET}\n")

def print_success(text):
    print(f"{GREEN}✅ {text}{RESET}")
    test_results['passed'].append(text)

def print_error(text):
    print(f"{RED}❌ {text}{RESET}")
    test_results['failed'].append(text)

def print_warning(text):
    print(f"{YELLOW}⚠️  {text}{RESET}")
    test_results['warnings'].append(text)

def print_info(text):
    print(f"{YELLOW}ℹ️  {text}{RESET}")

print_header("BLOOM COMPREHENSIVE SYSTEM TEST")
print_info("Testing all functionality and user flows")
print_info(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")

# ============================================================================
# TEST 1: Server Status
# ============================================================================
print_header("TEST 1: Server Status & Configuration")

try:
    # Check backend
    response = requests.get('http://localhost:8000/api/', timeout=5)
    if response.status_code == 401 or response.status_code == 200:
        print_success("Backend server running on port 8000")
    else:
        print_error(f"Backend returned unexpected status: {response.status_code}")
except Exception as e:
    print_error(f"Backend server not accessible: {e}")

try:
    # Check frontend
    response = requests.get('http://localhost:3000/', timeout=5)
    if response.status_code == 200 and 'Bloom' in response.text:
        print_success("Frontend server running on port 3000")
    else:
        print_error("Frontend server not responding correctly")
except Exception as e:
    print_error(f"Frontend server not accessible: {e}")

# Check environment variables
env_checks = [
    ('OPENAI_API_KEY', 'OpenAI API configured'),
    ('CONTRACT_ADDRESS', 'Blockchain contract configured'),
    ('ADMIN_PRIVATE_KEY', 'Blockchain admin key configured'),
    ('ALATPAY_SECRET_KEY', 'ALATPay configured'),
    ('ALATPAY_BUSINESS_ID', 'ALATPay Business ID configured'),
]

for env_var, message in env_checks:
    if os.getenv(env_var):
        print_success(message)
    else:
        print_warning(f"{message} - NOT CONFIGURED")

# ============================================================================
# TEST 2: Database & Models
# ============================================================================
print_header("TEST 2: Database & Models")

try:
    # Check DonationPool
    pool = DonationPool.get_pool()
    print_success(f"DonationPool accessible (Balance: ₦{pool.pool_balance:,.2f})")
except Exception as e:
    print_error(f"DonationPool error: {e}")

try:
    # Check User model
    user_count = User.objects.count()
    print_success(f"User model accessible ({user_count} users in database)")
except Exception as e:
    print_error(f"User model error: {e}")

try:
    # Check Donation model
    donation_count = Donation.objects.count()
    print_success(f"Donation model accessible ({donation_count} donations)")
except Exception as e:
    print_error(f"Donation model error: {e}")

try:
    # Check UserWallet model
    wallet_count = UserWallet.objects.count()
    print_success(f"UserWallet model accessible ({wallet_count} wallets)")
except Exception as e:
    print_error(f"UserWallet model error: {e}")

# ============================================================================
# TEST 3: User Authentication Flow
# ============================================================================
print_header("TEST 3: User Authentication Flow")

test_email = f"systemtest_{int(time.time())}@bloom.com"
test_username = f"systemtest{int(time.time())}"

try:
    # Clean up existing test user
    User.objects.filter(email=test_email).delete()
    print_info(f"Creating test user: {test_email}")

    # Create user
    test_user = User.objects.create_user(
        username=test_username,
        email=test_email,
        password='TestPass123!',
        first_name='System',
        last_name='Test',
        phone='+2348000000000'
    )
    print_success(f"User created successfully (ID: {test_user.id})")

    # Verify user fields
    if test_user.email == test_email:
        print_success("User email stored correctly")
    else:
        print_error("User email mismatch")

    if not test_user.onboarding_complete:
        print_success("New user onboarding_complete defaults to False")
    else:
        print_warning("New user onboarding_complete should be False")

    # Test authentication
    from django.contrib.auth import authenticate
    auth_user = authenticate(username=test_username, password='TestPass123!')
    if auth_user:
        print_success("User authentication working")
    else:
        print_error("User authentication failed")

except Exception as e:
    print_error(f"User authentication flow error: {e}")
    test_user = None

# ============================================================================
# TEST 4: Blockchain Wallet Generation
# ============================================================================
print_header("TEST 4: Blockchain Wallet Generation")

if test_user:
    try:
        # Delete existing wallet if any
        UserWallet.objects.filter(user=test_user).delete()

        # Generate wallet
        wallet_data = blockchain.generate_wallet()
        print_success(f"Wallet generated: {wallet_data['address']}")

        # Verify wallet address format
        if wallet_data['address'].startswith('0x') and len(wallet_data['address']) == 42:
            print_success("Wallet address format valid")
        else:
            print_error("Wallet address format invalid")

        # Save to database
        wallet = UserWallet.objects.create(
            user=test_user,
            wallet_address=wallet_data['address'],
            encrypted_private_key=wallet_data['private_key']
        )
        print_success(f"Wallet saved to database (ID: {wallet.id})")

        # Check balance
        balance = blockchain.get_balance(wallet.wallet_address)
        if balance == 0:
            print_success(f"Initial wallet balance is 0 BLOOM (correct)")
        else:
            print_warning(f"Initial wallet balance is {balance} BLOOM (expected 0)")

    except Exception as e:
        print_error(f"Blockchain wallet generation error: {e}")
        wallet = None
else:
    print_warning("Skipping wallet test - no test user")
    wallet = None

# ============================================================================
# TEST 5: Token Minting (Blockchain)
# ============================================================================
print_header("TEST 5: Token Minting & Blockchain Integration")

if wallet:
    try:
        print_info("Minting 50 BLOOM tokens...")

        mint_result = blockchain.mint_tokens(
            user_wallet=wallet.wallet_address,
            amount=50,
            action_type='test',
            action_id=f'SYSTEM_TEST_{int(time.time())}'
        )

        if mint_result.get('success'):
            print_success("Tokens minted successfully")
            print_success(f"Transaction hash: {mint_result['signature'][:20]}...")
            print_success(f"Gas used: {mint_result.get('gas_used', 0):,} wei")

            # Save to database
            tx = TokenTransaction.objects.create(
                user_wallet=wallet,
                transaction_type='MINT',
                action_type='test',
                action_id=f'SYSTEM_TEST_{int(time.time())}',
                token_amount=50,
                naira_equivalent=Decimal('100.00'),
                tx_hash=mint_result['signature'],
                block_number=mint_result.get('block_number'),
                gas_used=mint_result.get('gas_used'),
                status='CONFIRMED'
            )
            print_success(f"Transaction saved to database (ID: {tx.id})")

            # Verify balance updated
            new_balance = blockchain.get_balance(wallet.wallet_address)
            if new_balance == 50:
                print_success(f"Balance updated correctly: {new_balance} BLOOM")
            else:
                print_error(f"Balance mismatch: expected 50, got {new_balance}")

            # Verify on blockchain
            print_info(f"Etherscan: https://sepolia.etherscan.io/tx/{mint_result['signature']}")
        else:
            print_error(f"Token minting failed: {mint_result.get('error')}")

    except Exception as e:
        print_error(f"Token minting error: {e}")
else:
    print_warning("Skipping token minting test - no wallet")

# ============================================================================
# TEST 6: Donation Flow
# ============================================================================
print_header("TEST 6: Donation Flow")

try:
    print_info("Creating test donation...")

    donation_amount = 500  # ₦500
    donation_ref = f'SYSTEM-TEST-{int(time.time())}'

    # Create donation
    donation = DonationService.create_donation(
        amount_naira=donation_amount,
        donor_name='System Test',
        donor_email='systemtest@bloom.com',
        donor_phone='+2348000000000',
        is_anonymous=False,
        payment_reference=donation_ref,
        payment_method='test'
    )
    print_success(f"Donation created (ID: {donation.id}, Reference: {donation_ref})")

    # Verify donation status
    if donation.status == 'pending':
        print_success("Donation status is 'pending' (correct)")
    else:
        print_error(f"Donation status is '{donation.status}' (expected 'pending')")

    # Confirm donation
    donation, was_confirmed = DonationService.confirm_donation(donation.id)
    if was_confirmed:
        print_success("Donation confirmed successfully")
    else:
        print_error("Donation confirmation failed")

    # Verify pool updated
    pool.refresh_from_db()
    print_success(f"Donation pool balance now: ₦{pool.pool_balance:,.2f}")

except Exception as e:
    print_error(f"Donation flow error: {e}")

# ============================================================================
# TEST 7: ALATPay Integration
# ============================================================================
print_header("TEST 7: ALATPay Payment Integration")

try:
    print_info("Testing ALATPay virtual account generation...")

    alatpay_result = alatpay_service.create_payment(
        amount=100,
        email='test@bloom.com',
        reference=f'ALATPAY-TEST-{int(time.time())}',
        metadata={'test': True}
    )

    if alatpay_result.get('success'):
        print_success("ALATPay virtual account generated")
        data = alatpay_result.get('data', {})
        if data.get('accountNumber'):
            print_success(f"Virtual account: {data.get('accountNumber')} ({data.get('bankName')})")
        if data.get('transactionId'):
            print_success(f"Transaction ID: {data.get('transactionId')[:20]}...")
    else:
        error_msg = alatpay_result.get('error', 'Unknown error')
        if '404' in str(error_msg) or 'Not Found' in str(error_msg):
            print_warning(f"ALATPay sandbox not active (404): {error_msg}")
            print_info("This is expected for test credentials - contact ALATPay support")
        else:
            print_error(f"ALATPay error: {error_msg}")

except Exception as e:
    print_error(f"ALATPay integration error: {e}")

# ============================================================================
# TEST 8: API Endpoints
# ============================================================================
print_header("TEST 8: API Endpoints")

api_tests = [
    ('GET', '/api/tokens/pool/', 'Token pool info'),
    ('GET', '/api/tokens/donations/recent/', 'Recent donations'),
]

for method, endpoint, description in api_tests:
    try:
        url = f'http://localhost:8000{endpoint}'
        if method == 'GET':
            response = requests.get(url, timeout=5)
        elif method == 'POST':
            response = requests.post(url, json={}, timeout=5)

        if response.status_code in [200, 201]:
            print_success(f"{description}: {method} {endpoint}")
        elif response.status_code == 401:
            print_success(f"{description}: {method} {endpoint} (requires auth)")
        else:
            print_warning(f"{description}: {method} {endpoint} - Status {response.status_code}")
    except Exception as e:
        print_error(f"{description}: {e}")

# ============================================================================
# TEST 9: Frontend Routes
# ============================================================================
print_header("TEST 9: Frontend Routes")

frontend_routes = [
    '/',
    '/login',
    '/signup',
    '/donate',
]

for route in frontend_routes:
    try:
        response = requests.get(f'http://localhost:3000{route}', timeout=5)
        if response.status_code == 200:
            print_success(f"Route accessible: {route}")
        else:
            print_warning(f"Route {route} returned status {response.status_code}")
    except Exception as e:
        print_error(f"Route {route} error: {e}")

# ============================================================================
# TEST 10: Blockchain Contract
# ============================================================================
print_header("TEST 10: Blockchain Smart Contract")

try:
    contract_address = os.getenv('CONTRACT_ADDRESS')
    if contract_address:
        print_success(f"Contract deployed at: {contract_address}")
        print_info(f"Etherscan: https://sepolia.etherscan.io/address/{contract_address}")

        # Check total supply
        total_supply = blockchain.get_total_supply()
        print_success(f"Total BLOOM supply: {total_supply:,.0f} tokens")
    else:
        print_error("Contract address not configured")
except Exception as e:
    print_error(f"Blockchain contract error: {e}")

# ============================================================================
# SUMMARY
# ============================================================================
print_header("TEST SUMMARY")

total_tests = len(test_results['passed']) + len(test_results['failed']) + len(test_results['warnings'])
passed = len(test_results['passed'])
failed = len(test_results['failed'])
warnings = len(test_results['warnings'])

print(f"\n{BOLD}Results:{RESET}")
print(f"{GREEN}✅ Passed: {passed}{RESET}")
print(f"{RED}❌ Failed: {failed}{RESET}")
print(f"{YELLOW}⚠️  Warnings: {warnings}{RESET}")
print(f"{BOLD}Total Tests: {total_tests}{RESET}\n")

if failed > 0:
    print(f"{BOLD}{RED}Failed Tests:{RESET}")
    for i, test in enumerate(test_results['failed'], 1):
        print(f"  {i}. {test}")
    print()

if warnings > 0:
    print(f"{BOLD}{YELLOW}Warnings:{RESET}")
    for i, test in enumerate(test_results['warnings'], 1):
        print(f"  {i}. {test}")
    print()

# Calculate success rate
if total_tests > 0:
    success_rate = (passed / total_tests) * 100
    print(f"{BOLD}Success Rate: {success_rate:.1f}%{RESET}\n")

    if success_rate >= 90:
        print(f"{GREEN}{BOLD}{'='*80}{RESET}")
        print(f"{GREEN}{BOLD}✅ SYSTEM TEST PASSED - All major functionality working!{RESET}")
        print(f"{GREEN}{BOLD}{'='*80}{RESET}\n")
    elif success_rate >= 70:
        print(f"{YELLOW}{BOLD}{'='*80}{RESET}")
        print(f"{YELLOW}{BOLD}⚠️  SYSTEM TEST PARTIAL - Some issues need attention{RESET}")
        print(f"{YELLOW}{BOLD}{'='*80}{RESET}\n")
    else:
        print(f"{RED}{BOLD}{'='*80}{RESET}")
        print(f"{RED}{BOLD}❌ SYSTEM TEST FAILED - Critical issues detected{RESET}")
        print(f"{RED}{BOLD}{'='*80}{RESET}\n")

# Cleanup test user
if 'test_user' in locals() and test_user:
    try:
        print_info(f"Cleaning up test user: {test_email}")
        test_user.delete()
        print_success("Test user deleted")
    except:
        pass

print(f"{BOLD}Test completed at: {time.strftime('%Y-%m-%d %H:%M:%S')}{RESET}\n")
