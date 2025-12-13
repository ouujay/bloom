"""
Multi-Provider SMS Client for BLOOM
Supports Africa's Talking and Twilio
"""
import os
import logging

# SMS feature flag - can be disabled without breaking the app
SMS_ENABLED = os.getenv('SMS_ENABLED', 'False') == 'True'
SMS_PROVIDER = os.getenv('SMS_PROVIDER', 'twilio')  # 'africastalking' or 'twilio'

logger = logging.getLogger(__name__)

# Provider-specific variables
sms = None  # Africa's Talking client
twilio_client = None  # Twilio client

# Initialize SMS provider only if enabled
if SMS_ENABLED:
    if SMS_PROVIDER == 'africastalking':
        try:
            import africastalking

            AT_USERNAME = os.getenv('AT_USERNAME', 'sandbox')
            AT_API_KEY = os.getenv('AT_API_KEY')
            AT_SENDER_ID = os.getenv('AT_SENDER_ID', 'BLOOM')

            if AT_API_KEY:
                africastalking.initialize(username=AT_USERNAME, api_key=AT_API_KEY)
                sms = africastalking.SMS
                logger.info(f"✅ Africa's Talking initialized: {AT_USERNAME}")
            else:
                logger.warning("⚠️ AT_API_KEY not set - SMS will be mocked")
        except ImportError:
            logger.warning("⚠️ africastalking module not installed - SMS disabled")
            SMS_ENABLED = False

    elif SMS_PROVIDER == 'twilio':
        try:
            from twilio.rest import Client

            TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
            TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
            TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')

            if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
                twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
                logger.info(f"✅ Twilio initialized: {TWILIO_PHONE_NUMBER}")
            else:
                logger.warning("⚠️ Twilio credentials not set - SMS will be mocked")
        except ImportError:
            logger.warning("⚠️ twilio module not installed - SMS disabled")
            SMS_ENABLED = False
else:
    logger.info("ℹ️ SMS feature disabled (SMS_ENABLED=False)")


def format_phone_number(phone_number):
    """
    Format Nigerian phone number with country code

    Args:
        phone_number (str): Phone number in various formats

    Returns:
        str: Formatted phone number with +234 prefix
    """
    if not phone_number:
        return None

    # Remove spaces and dashes
    phone = phone_number.replace(' ', '').replace('-', '')

    # If already has country code, return as is
    if phone.startswith('+'):
        return phone

    # Remove leading 0 and add +234
    if phone.startswith('0'):
        phone = phone[1:]

    return f'+234{phone}'


def send_sms(phone_number, message):
    """
    Send SMS to a single phone number (multi-provider support)

    Args:
        phone_number (str): Phone number
        message (str): Message to send (max 160 chars recommended)

    Returns:
        dict: Response with success status
    """
    if not SMS_ENABLED or (sms is None and twilio_client is None):
        logger.info(f"📱 [MOCK SMS to {phone_number}]: {message}")
        return {
            'success': True,
            'message': 'SMS feature disabled - message logged',
            'mock': True
        }

    try:
        formatted_number = format_phone_number(phone_number)

        if not formatted_number:
            return {
                'success': False,
                'error': f'Invalid phone number: {phone_number}'
            }

        # Use Twilio
        if SMS_PROVIDER == 'twilio' and twilio_client:
            TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')
            response = twilio_client.messages.create(
                body=message,
                from_=TWILIO_PHONE_NUMBER,
                to=formatted_number
            )
            logger.info(f"✅ Twilio SMS sent to {formatted_number} (SID: {response.sid})")
            return {
                'success': True,
                'message': 'SMS sent successfully',
                'recipients': 1,
                'phone': formatted_number
            }

        # Use Africa's Talking
        elif SMS_PROVIDER == 'africastalking' and sms:
            AT_SENDER_ID = os.getenv('AT_SENDER_ID', 'BLOOM')
            response = sms.send(
                message=message,
                recipients=[formatted_number],
                sender_id=AT_SENDER_ID if hasattr(sms, 'sender_id') else None
            )
            logger.info(f"✅ Africa's Talking SMS sent to {formatted_number}")
            return {
                'success': True,
                'response': response,
                'phone': formatted_number
            }

    except Exception as e:
        logger.error(f"❌ SMS error for {phone_number}: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


def send_bulk_sms(phone_numbers, message):
    """
    Send SMS to multiple phone numbers

    Args:
        phone_numbers (list): List of phone numbers
        message (str): Message to send

    Returns:
        dict: Response with success status
    """
    if not SMS_ENABLED or sms is None:
        logger.info(f"📱 [MOCK BULK SMS to {len(phone_numbers)} recipients]: {message}")
        return {
            'success': True,
            'message': 'SMS feature disabled - message logged',
            'mock': True,
            'count': len(phone_numbers)
        }

    try:
        formatted_numbers = [format_phone_number(p) for p in phone_numbers if p]
        formatted_numbers = [p for p in formatted_numbers if p]  # Remove None

        if not formatted_numbers:
            return {
                'success': False,
                'error': 'No valid phone numbers'
            }

        response = sms.send(
            message=message,
            recipients=formatted_numbers,
            sender_id=AT_SENDER_ID if hasattr(sms, 'sender_id') else None
        )

        logger.info(f"✅ Bulk SMS sent to {len(formatted_numbers)} recipients")
        return {
            'success': True,
            'response': response,
            'count': len(formatted_numbers)
        }

    except Exception as e:
        logger.error(f"❌ Bulk SMS error: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


# Health tips database (for daily SMS)
HEALTH_TIPS = [
    "🌸 Drink 8 glasses of water daily to stay hydrated during pregnancy 💧",
    "🌸 Take your folic acid supplement daily to prevent birth defects 💊",
    "🌸 Rest on your left side to improve blood flow to baby ❤️",
    "🌸 Eat small frequent meals to reduce nausea and heartburn 🍎",
    "🌸 Walk 30 minutes daily for a healthy pregnancy 🚶‍♀️",
    "🌸 Never miss your antenatal appointments for baby's health 🏥",
    "🌸 Avoid alcohol, smoking and raw foods during pregnancy 🚭",
    "🌸 Get enough sleep - aim for 8 hours every night 😴",
    "🌸 Eat iron-rich foods like vegetables and beans 🥬",
    "🌸 Report any bleeding or severe pain immediately 🚨",
]


def get_random_health_tip():
    """Get a random health tip for SMS"""
    import random
    return random.choice(HEALTH_TIPS)
