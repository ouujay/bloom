"""
Send daily health tips via SMS to all users
Usage: python manage.py send_daily_tips
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from sms_api.africastalking_client import send_bulk_sms, get_random_health_tip, SMS_ENABLED

User = get_user_model()


class Command(BaseCommand):
    help = 'Send daily health tips via SMS to all users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be sent without actually sending',
        )

    def handle(self, *args, **options):
        if not SMS_ENABLED:
            self.stdout.write(self.style.WARNING(
                '⚠️  SMS feature is disabled (SMS_ENABLED=False)'
            ))
            self.stdout.write('Tip: Set SMS_ENABLED=True in .env to enable SMS')
            return

        dry_run = options['dry_run']

        # Get random health tip
        tip = get_random_health_tip()

        # Get all users with phone numbers
        # Note: Assumes User model has phone_number field
        try:
            users = User.objects.exclude(phone_number__isnull=True).exclude(phone_number='')
            phone_numbers = [user.phone_number for user in users]

            if not phone_numbers:
                self.stdout.write(self.style.WARNING(
                    '⚠️  No users with phone numbers found'
                ))
                return

            self.stdout.write(f'\n📱 Tip to send: "{tip}"')
            self.stdout.write(f'👥 Recipients: {len(phone_numbers)} users\n')

            if dry_run:
                self.stdout.write(self.style.SUCCESS(
                    f'✅ DRY RUN - Would send to {len(phone_numbers)} users'
                ))
                self.stdout.write(f'   Phone numbers: {phone_numbers[:5]}...')
                return

            # Send bulk SMS
            result = send_bulk_sms(phone_numbers, tip)

            if result['success']:
                self.stdout.write(self.style.SUCCESS(
                    f'✅ Successfully sent tip to {len(phone_numbers)} users'
                ))
            else:
                self.stdout.write(self.style.ERROR(
                    f'❌ Error sending tips: {result.get("error", "Unknown error")}'
                ))

        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f'❌ Error: {str(e)}'
            ))
