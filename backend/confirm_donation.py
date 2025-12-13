#!/usr/bin/env python3
"""
Quick script to manually confirm a donation for testing
Usage: python3 confirm_donation.py BLOOM-DON-XXXX
"""

import os
import sys
import django
from decimal import Decimal

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mamalert.settings')
django.setup()

from apps.tokens.models import Donation
from apps.tokens.services import DonationService
import blockchain

# Colors
GREEN = '\033[92m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
RED = '\033[91m'
BOLD = '\033[1m'
RESET = '\033[0m'

if len(sys.argv) < 2:
    print(f"{RED}Usage: python3 confirm_donation.py <reference>{RESET}")
    print(f"{YELLOW}Example: python3 confirm_donation.py BLOOM-DON-ABC123{RESET}")
    sys.exit(1)

reference = sys.argv[1]

print(f"\n{BOLD}{BLUE}Confirming Donation: {reference}{RESET}\n")

try:
    donation = Donation.objects.get(payment_reference=reference)
    print(f"{GREEN}✅ Found donation:{RESET}")
    print(f"  Amount: ₦{donation.amount_naira:,.2f}")
    print(f"  Donor: {donation.donor_name or 'Anonymous'}")
    print(f"  Email: {donation.donor_email}")
    print(f"  Status: {donation.status}")

    if donation.status == 'confirmed':
        print(f"\n{YELLOW}⚠️  Donation already confirmed{RESET}")
        sys.exit(0)

    print(f"\n{YELLOW}Confirming donation...{RESET}")

    # Confirm in database
    donation, was_confirmed = DonationService.confirm_donation(donation.id)
    print(f"{GREEN}✅ Donation confirmed in database{RESET}")

    # Record on blockchain
    print(f"\n{YELLOW}Recording on blockchain...{RESET}")
    blockchain_result = blockchain.record_deposit(
        amount_naira=float(donation.amount_naira),
        reference=reference,
        donor_email=donation.donor_email or 'anonymous@bloom.com'
    )

    if blockchain_result.get('success'):
        print(f"{GREEN}✅ Recorded on blockchain!{RESET}")
        print(f"  Tx Hash: {blockchain_result['signature']}")
        print(f"  Block: {blockchain_result.get('block_number', 'Pending')}")
        print(f"  {BLUE}https://sepolia.etherscan.io/tx/{blockchain_result['signature']}{RESET}")

        # Save blockchain info
        from apps.blockchain_api.models import Donation as BlockchainDonation
        try:
            blockchain_donation = BlockchainDonation.objects.create(
                donor_email=donation.donor_email or 'anonymous@bloom.com',
                amount_naira=donation.amount_naira,
                paystack_reference=reference,
                blockchain_tx_hash=blockchain_result['signature'],
                blockchain_recorded=True,
                payment_status='SUCCESS'
            )
            print(f"{GREEN}✅ Blockchain record saved (ID: {blockchain_donation.id}){RESET}")
        except Exception as e:
            print(f"{YELLOW}⚠️  Blockchain record may already exist: {e}{RESET}")
    else:
        print(f"{RED}❌ Blockchain recording failed: {blockchain_result.get('error')}{RESET}")

    print(f"\n{GREEN}{BOLD}✅ DONATION CONFIRMED!{RESET}")
    print(f"{YELLOW}Now refresh the frontend to see the updated donation in the list{RESET}\n")

except Donation.DoesNotExist:
    print(f"{RED}❌ Donation not found with reference: {reference}{RESET}")
    print(f"\n{YELLOW}Recent donations:{RESET}")
    recent = Donation.objects.all().order_by('-created_at')[:5]
    for don in recent:
        print(f"  {don.payment_reference} - ₦{don.amount_naira:,.2f} - {don.status}")
    sys.exit(1)
except Exception as e:
    print(f"{RED}❌ Error: {e}{RESET}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
