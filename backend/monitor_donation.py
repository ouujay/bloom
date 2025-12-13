#!/usr/bin/env python3
"""
Monitor donation status in real-time
"""
import os
import sys
import django
import time
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mamalert.settings')
django.setup()

from apps.tokens.models import Donation, DonationPool
from apps.blockchain_api.models import Donation as BlockchainDonation

# Colors
GREEN = '\033[92m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
RED = '\033[91m'
BOLD = '\033[1m'
RESET = '\033[0m'

def print_header(text):
    print(f"\n{BOLD}{BLUE}{'='*80}{RESET}")
    print(f"{BOLD}{BLUE}{text}{RESET}")
    print(f"{BOLD}{BLUE}{'='*80}{RESET}\n")

print_header("BLOOM Donation Monitor")
print(f"{YELLOW}Monitoring donations in real-time...{RESET}")
print(f"{YELLOW}Press Ctrl+C to stop{RESET}\n")

last_count = 0
last_confirmed = 0

try:
    while True:
        # Get current counts
        total = Donation.objects.count()
        pending = Donation.objects.filter(status='pending').count()
        confirmed = Donation.objects.filter(status='confirmed').count()

        # Check if new donation created
        if total > last_count:
            print(f"\n{GREEN}🎉 NEW DONATION CREATED!{RESET}")
            new_donations = Donation.objects.order_by('-created_at')[:total-last_count]
            for don in new_donations:
                print(f"{BOLD}Reference:{RESET} {don.payment_reference}")
                print(f"{BOLD}Amount:{RESET} ₦{don.amount_naira:,.2f}")
                print(f"{BOLD}Donor:{RESET} {don.donor_name or 'Anonymous'}")
                print(f"{BOLD}Status:{RESET} {don.status}")
                print(f"{BOLD}ALATPay TX ID:{RESET} {don.alatpay_transaction_id or 'N/A'}")
            last_count = total

        # Check if donation confirmed
        if confirmed > last_confirmed:
            print(f"\n{GREEN}✅ DONATION CONFIRMED!{RESET}")
            newly_confirmed = Donation.objects.filter(status='confirmed').order_by('-confirmed_at')[:confirmed-last_confirmed]
            for don in newly_confirmed:
                print(f"{BOLD}Reference:{RESET} {don.payment_reference}")
                print(f"{BOLD}Amount:{RESET} ₦{don.amount_naira:,.2f}")
                print(f"{BOLD}Confirmed:{RESET} {don.confirmed_at}")

                # Check if on blockchain
                blockchain_tx = BlockchainDonation.objects.filter(
                    paystack_reference=don.payment_reference,
                    blockchain_recorded=True
                ).first()

                if blockchain_tx:
                    print(f"{GREEN}✅ RECORDED ON BLOCKCHAIN!{RESET}")
                    print(f"{BOLD}TX Hash:{RESET} {blockchain_tx.blockchain_tx_hash}")
                    print(f"{BLUE}Etherscan:{RESET} https://sepolia.etherscan.io/tx/{blockchain_tx.blockchain_tx_hash}")
                else:
                    print(f"{YELLOW}⏳ Blockchain recording pending...{RESET}")

            last_confirmed = confirmed

        # Show current status
        pool = DonationPool.get_pool()
        timestamp = datetime.now().strftime('%H:%M:%S')
        print(f"\r[{timestamp}] Total: {total} | Pending: {pending} | Confirmed: {confirmed} | Pool: ₦{pool.pool_balance:,.2f}", end='', flush=True)

        time.sleep(2)  # Check every 2 seconds

except KeyboardInterrupt:
    print(f"\n\n{YELLOW}Monitoring stopped{RESET}\n")
