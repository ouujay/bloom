from django.test import TestCase
from sms_api.africastalking_client import format_phone_number, SMS_ENABLED

class SMSClientTests(TestCase):
    """Tests for SMS client functions"""

    def test_phone_number_formatting(self):
        """Test phone number formatting with various inputs"""
        # Test with leading zero
        self.assertEqual(format_phone_number('08012345678'), '+2348012345678')

        # Test with country code
        self.assertEqual(format_phone_number('+2348012345678'), '+2348012345678')

        # Test with spaces
        self.assertEqual(format_phone_number('0801 234 5678'), '+2348012345678')

        # Test with dashes
        self.assertEqual(format_phone_number('0801-234-5678'), '+2348012345678')

        # Test with None
        self.assertIsNone(format_phone_number(None))

        # Test with empty string
        self.assertIsNone(format_phone_number(''))

    def test_sms_enabled_flag(self):
        """Test that SMS_ENABLED flag is properly set"""
        # This will be False in test environment unless explicitly set
        self.assertIsInstance(SMS_ENABLED, bool)
