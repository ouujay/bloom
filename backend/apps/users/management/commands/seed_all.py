"""
Comprehensive seed command for demo data.
Run: python manage.py seed_all
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, timedelta
from decimal import Decimal
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed all demo data for hackathon deployment'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('\n=== Seeding Bloom Demo Data ===\n'))

        # 1. Create demo users
        self.seed_users()

        # 2. Create children/pregnancies
        self.seed_children()

        # 3. Add token balances
        self.seed_tokens()

        # 4. Seed daily program content
        self.seed_content()

        # 5. Add health logs
        self.seed_health_data()

        # 6. Add some donations
        self.seed_donations()

        self.stdout.write(self.style.SUCCESS('\n=== Demo Data Seeding Complete! ===\n'))
        self.stdout.write('Demo Accounts:')
        self.stdout.write('  Mother: demo@bloom.ng / demo1234')
        self.stdout.write('  Admin:  admin@bloom.ng / admin1234')
        self.stdout.write('  Doctor: doctor@bloom.ng / doctor1234\n')

    def seed_users(self):
        self.stdout.write('Creating demo users...')

        demo_users = [
            {
                'email': 'demo@bloom.ng',
                'password': 'demo1234',
                'username': 'demo_mother',
                'phone': '08012345678',
                'first_name': 'Adaeze',
                'last_name': 'Okonkwo',
                'is_staff': False,
                'is_superuser': False,
                'is_admin': False,
                'user_type': 'mother',
                'onboarding_complete': True,
                'blood_type': 'O+',
                'genotype': 'AA',
                'location': 'Lagos, Nigeria',
                'token_balance': 2450,
                'total_tokens_earned': 3200,
            },
            {
                'email': 'admin@bloom.ng',
                'password': 'admin1234',
                'username': 'admin_user',
                'phone': '08012345679',
                'first_name': 'Admin',
                'last_name': 'User',
                'is_staff': True,
                'is_superuser': True,
                'is_admin': True,
                'user_type': 'admin',
                'onboarding_complete': True,
            },
            {
                'email': 'doctor@bloom.ng',
                'password': 'doctor1234',
                'username': 'demo_doctor',
                'phone': '08012345680',
                'first_name': 'Chidi',
                'last_name': 'Eze',
                'is_staff': False,
                'is_superuser': False,
                'is_admin': False,
                'user_type': 'doctor',
                'is_verified_doctor': True,
                'medical_license': 'MDCN-45678',
                'specialization': 'Obstetrics & Gynecology',
                'hospital_name': 'Lagos University Teaching Hospital',
                'onboarding_complete': True,
            },
        ]

        for user_data in demo_users:
            email = user_data.pop('email')
            password = user_data.pop('password')

            user, created = User.objects.update_or_create(
                email=email,
                defaults=user_data
            )
            user.set_password(password)
            user.save()

            status = 'Created' if created else 'Updated'
            self.stdout.write(f'  {status}: {email}')

    def seed_children(self):
        self.stdout.write('Creating pregnancies/children...')

        try:
            from apps.children.models import Child
        except ImportError:
            self.stdout.write(self.style.WARNING('  Children app not found, skipping...'))
            return

        mother = User.objects.filter(email='demo@bloom.ng').first()
        if not mother:
            return

        # Create a pregnancy at week 28
        due_date = date.today() + timedelta(weeks=12)  # 12 weeks to go = week 28

        child, created = Child.objects.update_or_create(
            user=mother,
            status='pregnant',
            defaults={
                'due_date': due_date,
                'nickname': 'Baby',
                'current_day': 196,  # Day 196 = Week 28
                'current_streak': 7,
                'longest_streak': 14,
                'is_active': True,
            }
        )

        status = 'Created' if created else 'Updated'
        self.stdout.write(f'  {status}: Pregnancy for {mother.first_name} (Week 28)')

    def seed_tokens(self):
        self.stdout.write('Setting up token balances...')

        try:
            from apps.tokens.models import TokenPool, TokenTransaction, Donation
        except ImportError:
            self.stdout.write(self.style.WARNING('  Tokens app not found, skipping...'))
            return

        # Create token pool if not exists
        pool, created = TokenPool.objects.get_or_create(
            id=1,
            defaults={
                'total_tokens': 1000000,
                'available_tokens': 950000,
                'distributed_tokens': 50000,
            }
        )
        if created:
            self.stdout.write('  Created token pool')

        # Add some token transactions for demo mother
        mother = User.objects.filter(email='demo@bloom.ng').first()
        if mother:
            # Create sample transactions
            transaction_types = [
                ('lesson', 5, 'Completed daily lesson'),
                ('checkin', 5, 'Health check-in'),
                ('task', 5, 'Wellness task'),
                ('streak', 20, '7-day streak bonus'),
            ]

            for i, (action, amount, desc) in enumerate(transaction_types):
                TokenTransaction.objects.get_or_create(
                    user=mother,
                    amount=amount,
                    transaction_type='earn',
                    description=desc,
                    defaults={
                        'created_at': timezone.now() - timedelta(days=i),
                    }
                )
            self.stdout.write(f'  Added token transactions for {mother.first_name}')

    def seed_content(self):
        self.stdout.write('Seeding daily program content...')

        try:
            call_command('seed_content', verbosity=0)
            self.stdout.write('  Daily program content seeded')
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'  Could not seed content: {e}'))

        # Also seed YouTube videos
        self.stdout.write('Seeding YouTube videos...')
        try:
            call_command('seed_videos', verbosity=0)
            self.stdout.write('  YouTube videos seeded')
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'  Could not seed videos: {e}'))

    def seed_health_data(self):
        self.stdout.write('Creating health logs...')

        try:
            from apps.health.models import DailyHealthLog
            from apps.children.models import Child
        except ImportError:
            self.stdout.write(self.style.WARNING('  Health app not found, skipping...'))
            return

        mother = User.objects.filter(email='demo@bloom.ng').first()
        if not mother:
            return

        # Get the child/pregnancy
        child = Child.objects.filter(user=mother, status='pregnant').first()
        if not child:
            self.stdout.write(self.style.WARNING('  No pregnancy found, skipping health logs...'))
            return

        # Create last 7 days of health logs
        moods = ['great', 'good', 'okay', 'tired', 'stressed']
        symptoms_list = [
            ['back_pain'],
            ['nausea', 'fatigue'],
            ['swelling'],
            [],
            ['heartburn'],
            ['back_pain', 'fatigue'],
            [],
        ]

        for i in range(7):
            log_date = date.today() - timedelta(days=i)
            DailyHealthLog.objects.update_or_create(
                child=child,
                date=log_date,
                defaults={
                    'mood': random.choice(moods),
                    'symptoms': symptoms_list[i % len(symptoms_list)],
                    'weight_kg': Decimal('72.5') + Decimal(str(round(random.uniform(-0.5, 0.5), 2))),
                    'baby_movement': random.choice(['active', 'normal', 'quiet']),
                    'notes': '',
                }
            )

        self.stdout.write(f'  Created 7 days of health logs for {mother.first_name}')

    def seed_donations(self):
        self.stdout.write('Creating sample donations...')

        try:
            from apps.tokens.models import Donation
        except ImportError:
            self.stdout.write(self.style.WARNING('  Donations model not found, skipping...'))
            return

        donations = [
            {'donor_name': 'Anonymous', 'donor_email': 'anon@example.com', 'amount_naira': Decimal('5000'), 'status': 'confirmed'},
            {'donor_name': 'Chukwu Emeka', 'donor_email': 'emeka@example.com', 'amount_naira': Decimal('10000'), 'status': 'confirmed'},
            {'donor_name': 'Blessing Ojo', 'donor_email': 'blessing@example.com', 'amount_naira': Decimal('2500'), 'status': 'confirmed'},
        ]

        for i, donation_data in enumerate(donations):
            Donation.objects.update_or_create(
                payment_reference=f'DEMO-DON-{1000 + i}',
                defaults={
                    **donation_data,
                    'payment_method': 'alatpay',
                    'is_anonymous': donation_data['donor_name'] == 'Anonymous',
                    'confirmed_at': timezone.now() - timedelta(days=i * 3),
                }
            )

        self.stdout.write(f'  Created {len(donations)} sample donations')
