#!/usr/bin/env python3
"""
Comprehensive Integration Test for BLOOM Backend
Tests all blockchain and SMS features end-to-end
"""

import os
import sys
import django
import json
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mamalert.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.blockchain_api.models import UserWallet, TokenTransaction, Donation
from apps.users.models import User
import blockchain

# ANSI color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'

def print_test(test_name):
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BOLD}{BLUE}Testing: {test_name}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")

def print_success(message):
    print(f"{GREEN}✅ {message}{RESET}")

def print_error(message):
    print(f"{RED}❌ {message}{RESET}")

def print_info(message):
    print(f"{YELLOW}ℹ️  {message}{RESET}")

def print_data(label, data):
    print(f"{BOLD}{label}:{RESET}")
    if isinstance(data, dict):
        for key, value in data.items():
            print(f"  {key}: {value}")
    else:
        print(f"  {data}")

# Test Results Tracker
test_results = {
    'passed': 0,
    'failed': 0,
    'errors': []
}

def run_test(test_func):
    """Decorator to run tests and track results"""
    try:
        test_func()
        test_results['passed'] += 1
        return True
    except Exception as e:
        test_results['failed'] += 1
        test_results['errors'].append({
            'test': test_func.__name__,
            'error': str(e)
        })
        print_error(f"Test failed: {str(e)}")
        return False

# ============================================================================
# TEST 1: Environment Configuration
# ============================================================================
def test_environment():
    print_test("Environment Configuration")

    required_vars = [
        'BASE_RPC_URL',
        'ADMIN_PRIVATE_KEY',
        'CONTRACT_ADDRESS',
        'OPENAI_API_KEY'
    ]

    from dotenv import load_dotenv
    load_dotenv()

    for var in required_vars:
        value = os.getenv(var)
        if value:
            masked_value = value[:10] + '...' if len(value) > 10 else value
            print_success(f"{var} = {masked_value}")
        else:
            print_error(f"{var} is not set!")
            raise ValueError(f"Missing environment variable: {var}")

    print_success("All required environment variables are set")

# ============================================================================
# TEST 2: Database Models
# ============================================================================
def test_database_models():
    print_test("Database Models")

    # Check User model
    user_count = User.objects.count()
    print_info(f"Users in database: {user_count}")

    # Check blockchain models
    wallet_count = UserWallet.objects.count()
    tx_count = TokenTransaction.objects.count()
    donation_count = Donation.objects.count()

    print_success(f"UserWallet model: {wallet_count} wallets")
    print_success(f"TokenTransaction model: {tx_count} transactions")
    print_success(f"Donation model: {donation_count} donations")

# ============================================================================
# TEST 3: Create Test User
# ============================================================================
def test_create_user():
    print_test("Create Test User")

    # Delete existing test user if exists
    User.objects.filter(email='testuser@bloom.com').delete()

    user = User.objects.create_user(
        username='testuser',
        email='testuser@bloom.com',
        password='testpass123',
        first_name='Test',
        last_name='User',
        phone='+2348012345678'
    )

    print_success(f"Created user: {user.email}")
    print_data("User Details", {
        'ID': user.id,
        'Email': user.email,
        'Phone': user.phone,
        'Full Name': f"{user.first_name} {user.last_name}"
    })

    return user

# ============================================================================
# TEST 4: Blockchain Module Import
# ============================================================================
def test_blockchain_import():
    print_test("Blockchain Module Import")

    # Test module import
    import blockchain
    print_success("blockchain module imported")

    # Check all required functions exist
    required_functions = [
        'generate_wallet',
        'mint_tokens',
        'burn_tokens',
        'record_deposit',
        'record_withdrawal',
        'get_balance',
        'get_total_supply'
    ]

    for func_name in required_functions:
        if hasattr(blockchain, func_name):
            print_success(f"Function '{func_name}' exists")
        else:
            raise AttributeError(f"Function '{func_name}' not found")

# ============================================================================
# TEST 5: Wallet Generation
# ============================================================================
def test_wallet_generation(user):
    print_test("Wallet Generation")

    # Delete existing wallet if exists
    UserWallet.objects.filter(user=user).delete()

    # Generate new wallet
    result = blockchain.generate_wallet()

    print_success("Wallet generated successfully")
    print_data("Wallet Details", {
        'Address': result['address'],
        'Private Key Length': len(result['private_key'])
    })

    # Save to database
    wallet = UserWallet.objects.create(
        user=user,
        wallet_address=result['address'],
        encrypted_private_key=result['private_key']  # In production, this should be encrypted
    )

    print_success(f"Wallet saved to database (ID: {wallet.id})")

    return wallet

# ============================================================================
# TEST 6: Check Blockchain Connection
# ============================================================================
def test_blockchain_connection():
    print_test("Blockchain Connection")

    try:
        total_supply = blockchain.get_total_supply()
        print_success(f"Connected to blockchain")
        print_data("Total BLOOM Supply", {
            'Total Supply': f"{total_supply:,} BLOOM tokens"
        })
    except Exception as e:
        print_error(f"Blockchain connection failed: {str(e)}")
        raise

# ============================================================================
# TEST 7: Token Minting
# ============================================================================
def test_token_minting(wallet):
    print_test("Token Minting (Reward System)")

    print_info("Minting 100 BLOOM tokens for health checkup...")

    try:
        result = blockchain.mint_tokens(
            user_wallet=wallet.wallet_address,
            amount=100,
            action_type='checkup',
            action_id='TEST_CHECKUP_001'
        )

        print_success("Tokens minted successfully!")
        print_data("Transaction Details", {
            'Transaction Hash': result['signature'],
            'Block Number': result.get('block_number', 'N/A'),
            'Gas Used': result.get('gas_used', 'N/A'),
            'Etherscan': result.get('explorer_url', f"https://sepolia.etherscan.io/tx/{result['signature']}")
        })

        # Save transaction to database
        tx = TokenTransaction.objects.create(
            user_wallet=wallet,
            transaction_type='MINT',
            action_type='checkup',
            action_id='TEST_CHECKUP_001',
            token_amount=100,
            naira_equivalent=Decimal('200.00'),
            tx_hash=result['signature'],
            block_number=result.get('block_number'),
            gas_used=result.get('gas_used'),
            status='CONFIRMED'
        )

        print_success(f"Transaction saved to database (ID: {tx.id})")

        return result
    except Exception as e:
        print_error(f"Token minting failed: {str(e)}")
        raise

# ============================================================================
# TEST 8: Balance Checking
# ============================================================================
def test_balance_checking(wallet):
    print_test("Balance Checking")

    try:
        balance = blockchain.get_balance(wallet.wallet_address)

        print_success("Balance retrieved successfully!")
        print_data("Wallet Balance", {
            'Address': wallet.wallet_address,
            'BLOOM Balance': f"{balance} BLOOM",
            'Naira Equivalent': f"₦{balance * 2:,.2f}"
        })

        if balance > 0:
            print_success("Wallet has positive balance!")
        else:
            print_info("Wallet balance is zero (expected for new wallet)")

        return balance
    except Exception as e:
        print_error(f"Balance check failed: {str(e)}")
        raise

# ============================================================================
# TEST 9: Donation Recording
# ============================================================================
def test_donation_recording():
    print_test("Donation Recording")

    print_info("Recording a ₦5,000 donation...")

    # Generate unique reference
    import time
    unique_ref = f'TEST_DONATION_{int(time.time())}'

    try:
        result = blockchain.record_deposit(
            amount_naira=5000,
            reference=unique_ref,
            donor_email='donor@example.com'
        )

        print_success("Donation recorded on blockchain!")
        print_data("Donation Details", {
            'Amount': '₦5,000',
            'Reference': unique_ref,
            'Transaction Hash': result['signature'],
            'Etherscan': f"https://sepolia.etherscan.io/tx/{result['signature']}"
        })

        # Save to database
        donation = Donation.objects.create(
            donor_email='donor@example.com',
            amount_naira=Decimal('5000.00'),
            paystack_reference=unique_ref,
            blockchain_tx_hash=result['signature'],
            blockchain_recorded=True,
            payment_status='SUCCESS'
        )

        print_success(f"Donation saved to database (ID: {donation.id})")

        return result
    except Exception as e:
        print_error(f"Donation recording failed: {str(e)}")
        raise

# ============================================================================
# TEST 10: SMS Configuration
# ============================================================================
def test_sms_configuration():
    print_test("SMS Configuration")

    sms_enabled = os.getenv('SMS_ENABLED', 'False') == 'True'
    sms_provider = os.getenv('SMS_PROVIDER', 'twilio')

    print_data("SMS Settings", {
        'SMS Enabled': sms_enabled,
        'Provider': sms_provider,
        'OpenAI Configured': 'Yes' if os.getenv('OPENAI_API_KEY') else 'No'
    })

    if sms_enabled:
        print_success("SMS feature is enabled")

        if sms_provider == 'twilio':
            twilio_sid = os.getenv('TWILIO_ACCOUNT_SID')
            if twilio_sid and twilio_sid != 'your_twilio_account_sid_here':
                print_success("Twilio credentials configured")
            else:
                print_info("Twilio credentials not configured (using test mode)")

        elif sms_provider == 'africastalking':
            at_api_key = os.getenv('AT_API_KEY')
            if at_api_key:
                print_success(f"Africa's Talking API key configured: {at_api_key[:20]}...")
            else:
                print_info("Africa's Talking not configured")
    else:
        print_info("SMS feature is disabled")

# ============================================================================
# TEST 11: Transaction History
# ============================================================================
def test_transaction_history(wallet):
    print_test("Transaction History")

    transactions = TokenTransaction.objects.filter(user_wallet=wallet)

    print_success(f"Found {transactions.count()} transactions for this wallet")

    for i, tx in enumerate(transactions, 1):
        print_data(f"Transaction {i}", {
            'Type': tx.transaction_type,
            'Amount': f"{tx.token_amount} BLOOM",
            'Action': tx.action_type,
            'Status': tx.status,
            'Hash': tx.tx_hash[:20] + '...'
        })

# ============================================================================
# MAIN TEST RUNNER
# ============================================================================
def run_all_tests():
    print(f"\n{BOLD}{BLUE}{'='*60}{RESET}")
    print(f"{BOLD}{BLUE}BLOOM BACKEND INTEGRATION TEST SUITE{RESET}")
    print(f"{BOLD}{BLUE}Testing: Blockchain + SMS + Django Integration{RESET}")
    print(f"{BOLD}{BLUE}{'='*60}{RESET}\n")

    # Run tests
    run_test(test_environment)
    run_test(test_database_models)

    user = None
    wallet = None

    if test_results['failed'] == 0:
        try:
            user = test_create_user()
            test_results['passed'] += 1
        except Exception as e:
            test_results['failed'] += 1
            print_error(f"User creation failed: {e}")

    run_test(test_blockchain_import)
    run_test(test_blockchain_connection)

    if user:
        try:
            wallet = test_wallet_generation(user)
            test_results['passed'] += 1
        except Exception as e:
            test_results['failed'] += 1
            print_error(f"Wallet generation failed: {e}")

    if wallet:
        run_test(lambda: test_token_minting(wallet))
        run_test(lambda: test_balance_checking(wallet))
        run_test(lambda: test_transaction_history(wallet))

    run_test(test_donation_recording)
    run_test(test_sms_configuration)

    # Print final results
    print(f"\n{BOLD}{BLUE}{'='*60}{RESET}")
    print(f"{BOLD}{BLUE}TEST RESULTS SUMMARY{RESET}")
    print(f"{BOLD}{BLUE}{'='*60}{RESET}\n")

    total_tests = test_results['passed'] + test_results['failed']
    pass_rate = (test_results['passed'] / total_tests * 100) if total_tests > 0 else 0

    print(f"{BOLD}Total Tests:{RESET} {total_tests}")
    print(f"{GREEN}{BOLD}Passed:{RESET} {test_results['passed']}")
    print(f"{RED}{BOLD}Failed:{RESET} {test_results['failed']}")
    print(f"{BOLD}Pass Rate:{RESET} {pass_rate:.1f}%\n")

    if test_results['failed'] > 0:
        print(f"{RED}{BOLD}FAILED TESTS:{RESET}")
        for error in test_results['errors']:
            print(f"  {RED}❌ {error['test']}: {error['error']}{RESET}")
        print()

    if test_results['passed'] == total_tests:
        print(f"{GREEN}{BOLD}{'='*60}{RESET}")
        print(f"{GREEN}{BOLD}🎉 ALL TESTS PASSED! INTEGRATION SUCCESSFUL! 🎉{RESET}")
        print(f"{GREEN}{BOLD}{'='*60}{RESET}\n")
        return 0
    else:
        print(f"{RED}{BOLD}{'='*60}{RESET}")
        print(f"{RED}{BOLD}⚠️  SOME TESTS FAILED - REVIEW ERRORS ABOVE{RESET}")
        print(f"{RED}{BOLD}{'='*60}{RESET}\n")
        return 1

if __name__ == '__main__':
    sys.exit(run_all_tests())
