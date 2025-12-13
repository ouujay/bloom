from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Create demo users for testing (mother, admin, doctor)'

    def handle(self, *args, **options):
        demo_users = [
            {
                'email': 'demo@bloom.ng',
                'password': 'demo1234',
                'username': 'demo_mother',
                'phone': '08012345678',
                'first_name': 'Demo',
                'last_name': 'Mother',
                'is_staff': False,
                'is_superuser': False,
                'is_admin': False,
                'user_type': 'mother',
                'onboarding_complete': True,
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
                'first_name': 'Dr. Demo',
                'last_name': 'Doctor',
                'is_staff': False,
                'is_superuser': False,
                'is_admin': False,
                'user_type': 'doctor',
                'is_verified_doctor': True,
                'medical_license': 'MD-12345',
                'specialization': 'Obstetrics & Gynecology',
                'hospital_name': 'Demo Hospital',
                'onboarding_complete': True,
            },
        ]

        for user_data in demo_users:
            email = user_data.pop('email')
            password = user_data.pop('password')

            user, created = User.objects.get_or_create(
                email=email,
                defaults=user_data
            )

            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f'Created user: {email}')
                )
            else:
                # Update password and fields
                user.set_password(password)
                for key, value in user_data.items():
                    setattr(user, key, value)
                user.save()
                self.stdout.write(
                    self.style.WARNING(f'Updated user: {email}')
                )

        self.stdout.write(self.style.SUCCESS('\nDemo accounts ready:'))
        self.stdout.write('  Mother: demo@bloom.ng / demo1234')
        self.stdout.write('  Admin:  admin@bloom.ng / admin1234')
        self.stdout.write('  Doctor: doctor@bloom.ng / doctor1234')
