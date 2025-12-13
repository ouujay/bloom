#!/usr/bin/env python3
"""
Check the latest donation and its blockchain status
Usage: python3 check_latest_donation.py
"""

import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mamalert.settings')
django.setup()

from apps.tokens.models import Donation
from apps.blockchain_api.models import Donation as BlockchainDonation
from apps.payments.services import ALATPayService

# Colors
GREEN = '\033[92m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
RED = '\033[91m'
BOLD = '\033[1m'
RESET = '\033[0m'

print(f"\n{BOLD}{BLUE}{'='*80}{RESET}")
print(f"{BOLD}{BLUE}LATEST DONATION STATUS{RESET}")
print(f"{BOLD}{BLUE}{'='*80}{RESET}\n")

# Get latest donation
latest = Donation.objects.all().order_by('-created_at').first()

if not latest:
    print(f"{YELLOW}No donations found{RESET}\n")
    sys.exit(0)

print(f"{BOLD}Reference:{RESET} {latest.payment_reference}")
print(f"{BOLD}Amount:{RESET} ₦{latest.amount_naira:,.2f}")
print(f"{BOLD}Donor:{RESET} {latest.donor_name or 'Anonymous'}")
print(f"{BOLD}Email:{RESET} {latest.donor_email}")
print(f"{BOLD}Created:{RESET} {latest.created_at}")
print(f"{BOLD}Status:{RESET} {latest.status}")

# Check ALATPay status if has TX ID
if latest.alatpay_transaction_id:
    print(f"{BOLD}ALATPay TX ID:{RESET} {latest.alatpay_transaction_id}")

    try:
        alatpay = ALATPayService()
        result = alatpay.verify_payment(latest.alatpay_transaction_id)

        if result['success']:
            payment_data = result['data']
            payment_status = payment_data.get('status', 'unknown')

            if payment_status.lower() == 'completed':
                print(f"{GREEN}✅ ALATPay Payment: COMPLETED{RESET}")
            elif payment_status.lower() == 'open':
                print(f"{YELLOW}⏳ ALATPay Payment: PENDING (waiting for transfer){RESET}")
            else:
                print(f"{YELLOW}ALATPay Payment: {payment_status}{RESET}")
        else:
            print(f"{RED}❌ ALATPay Error: {result.get('error')}{RESET}")
    except Exception as e:
        print(f"{RED}❌ Error checking ALATPay: {e}{RESET}")
else:
    print(f"{YELLOW}No ALATPay TX ID - cannot verify payment{RESET}")

# Check blockchain status
blockchain_tx = BlockchainDonation.objects.filter(
    paystack_reference=latest.payment_reference,
    blockchain_recorded=True
).first()

if blockchain_tx:
    print(f"\n{GREEN}✅ RECORDED ON BLOCKCHAIN{RESET}")
    print(f"{BOLD}TX Hash:{RESET} {blockchain_tx.blockchain_tx_hash}")
    print(f"{BLUE}Etherscan:{RESET} https://sepolia.etherscan.io/tx/0x{blockchain_tx.blockchain_tx_hash}")
else:
    print(f"\n{YELLOW}⏳ Not yet recorded on blockchain{RESET}")

print(f"\n{BOLD}{BLUE}{'='*80}{RESET}\n")

# Show what to do next
if latest.status == 'pending':
    if latest.alatpay_transaction_id:
        print(f"{YELLOW}Next Steps:{RESET}")
        print(f"1. Wait for your bank transfer to complete")
        print(f"2. Run this script again to check status")
        print(f"3. Or run: python3 confirm_donation.py {latest.payment_reference}")
    else:
        print(f"{YELLOW}This donation doesn't have ALATPay tracking.{RESET}")
        print(f"You can manually confirm it with:")
        print(f"python3 confirm_donation.py {latest.payment_reference}")
elif latest.status == 'confirmed' and not blockchain_tx:
    print(f"{YELLOW}Donation is confirmed but not on blockchain yet.{RESET}")
    print(f"Run: python3 confirm_donation.py {latest.payment_reference}")
else:
    print(f"{GREEN}✅ Everything is complete!{RESET}")

print()
