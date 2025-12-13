from django.core.management.base import BaseCommand
from decimal import Decimal
from apps.tokens.models import DonationPool, Donation
from apps.tokens.services import DonationService


class Command(BaseCommand):
    help = 'Seed the donation pool with initial donations'

    def add_arguments(self, parser):
        parser.add_argument(
            '--amount',
            type=int,
            default=100000,
            help='Initial pool amount in Naira (default: 100000)'
        )

    def handle(self, *args, **options):
        amount = options['amount']

        # Get or create the pool
        pool = DonationPool.get_pool()
        self.stdout.write(f'Current pool balance: ₦{pool.pool_balance:,.2f}')
        self.stdout.write(f'Tokens in circulation: {pool.tokens_in_circulation:,.2f}')
        self.stdout.write(f'Token value: ₦{pool.token_value_naira:.4f}')

        if pool.pool_balance > 0:
            self.stdout.write(
                self.style.WARNING('\nPool already has funds. Adding seed donation...')
            )

        # Create and confirm a seed donation
        donation = DonationService.create_donation(
            amount_naira=amount,
            donor_name='Bloom Foundation',
            donor_email='foundation@bloom.ng',
            is_anonymous=False,
            payment_reference='SEED_DONATION',
            payment_method='seed',
        )

        # Confirm the donation
        DonationService.confirm_donation(donation.id)

        # Refresh pool data
        pool.refresh_from_db()

        self.stdout.write(self.style.SUCCESS(f'\nSeed donation of ₦{amount:,} confirmed!'))
        self.stdout.write(self.style.SUCCESS(f'New pool balance: ₦{pool.pool_balance:,.2f}'))
        self.stdout.write(self.style.SUCCESS(f'Token value: ₦{pool.token_value_naira:.4f}'))
