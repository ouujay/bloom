"""
SMS Webhook and API Views for BLOOM
Handles incoming SMS and provides SMS-related endpoints
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model
import logging

from .africastalking_client import send_sms, get_random_health_tip, SMS_ENABLED

logger = logging.getLogger(__name__)
User = get_user_model()


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def sms_webhook(request):
    """
    Receive incoming SMS from Africa's Talking or Twilio

    Africa's Talking payload:
    {
        "from": "+2348012345678",
        "text": "BAL"
    }

    Twilio payload:
    {
        "From": "+2348012345678",
        "Body": "BAL"
    }
    """
    if not SMS_ENABLED:
        logger.info("SMS webhook called but SMS_ENABLED=False")
        return HttpResponse("SMS disabled", status=200)

    try:
        # Support both Africa's Talking and Twilio formats
        from_number = request.data.get('from') or request.data.get('From')
        message_text = (request.data.get('text') or request.data.get('Body') or '').strip().upper()

        logger.info(f"📱 SMS from {from_number}: {message_text}")

        # Find user by phone number
        # Note: Assumes User model has phone_number field
        try:
            user = User.objects.filter(phone_number=from_number).first()
        except:
            user = None

        if not user:
            send_sms(
                from_number,
                "Welcome to BLOOM! 🌸\n\nReply HELP to see commands or download our app for full features!"
            )
            return HttpResponse(status=200)

        # Handle different commands
        if message_text in ['BAL', 'BALANCE']:
            handle_balance_check(user, from_number)

        elif message_text.startswith('Q '):
            # AI Chat: "Q How do I reduce morning sickness?"
            question = message_text[2:].strip()
            handle_ai_question(user, from_number, question)

        elif message_text in ['TIPS', 'TIP']:
            handle_daily_tip(from_number)

        elif message_text == 'HELP':
            handle_help(from_number)

        else:
            # Default: treat as AI question
            handle_ai_question(user, from_number, message_text)

        return HttpResponse(status=200)

    except Exception as e:
        logger.error(f"❌ SMS webhook error: {str(e)}")
        # Always return 200 to Africa's Talking to prevent retries
        return HttpResponse(status=200)


def handle_balance_check(user, phone_number):
    """
    Send token balance via SMS

    Integrates with blockchain_api TokenBalance if available
    """
    try:
        # Try to import blockchain balance
        try:
            from blockchain_api.models import TokenBalance
            balance_obj = TokenBalance.objects.filter(user=user).first()

            if balance_obj:
                balance = balance_obj.balance
                naira_value = balance * 0.1  # 10 tokens = ₦1

                message = f"""🌸 BLOOM Balance:
{balance} tokens
≈ ₦{naira_value:.2f}

Reply HELP for commands"""
            else:
                message = "🌸 No balance found. Complete actions to earn tokens!"

        except ImportError:
            # Blockchain module not available - graceful fallback
            message = "🌸 Balance check unavailable. Download our app for full features!"

        send_sms(phone_number, message)

    except Exception as e:
        logger.error(f"Balance check error: {str(e)}")
        send_sms(phone_number, "Error checking balance. Please try again or use the app.")


def handle_ai_question(user, phone_number, question):
    """
    Handle AI chat via SMS using OpenAI

    Keeps responses short for SMS (under 160 chars)
    """
    try:
        # Try to use OpenAI if available
        try:
            from openai import OpenAI
            import os

            openai_key = os.getenv('OPENAI_API_KEY')
            if not openai_key:
                raise ImportError("No OpenAI key")

            client = OpenAI(api_key=openai_key)

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are Bloom, a maternal health assistant for Nigerian mothers. Keep responses VERY SHORT (under 150 characters for SMS). Be warm, supportive, and culturally sensitive. Focus on safety and evidence-based advice."
                    },
                    {
                        "role": "user",
                        "content": question
                    }
                ],
                max_tokens=80,
                temperature=0.7
            )

            answer = response.choices[0].message.content.strip()

            # Truncate if needed (SMS limit)
            if len(answer) > 150:
                answer = answer[:147] + "..."

            message = f"🌸 {answer}\n\nReply Q [question] for more help"

        except ImportError:
            # OpenAI not available - provide generic response
            message = "🌸 Download our app for AI chat! Or call your doctor for urgent concerns."

        send_sms(phone_number, message)

    except Exception as e:
        logger.error(f"AI question error: {str(e)}")
        send_sms(phone_number, "Sorry, I couldn't process that. Download our app for better support!")


def handle_daily_tip(phone_number):
    """Send a random daily health tip"""
    try:
        tip = get_random_health_tip()
        send_sms(phone_number, tip + "\n\nReply TIPS for more")
    except Exception as e:
        logger.error(f"Daily tip error: {str(e)}")
        send_sms(phone_number, "Error sending tip. Please try again.")


def handle_help(phone_number):
    """Send help menu with all available commands"""
    message = """🌸 BLOOM Commands:

BAL - Check token balance
Q [question] - Ask health question
TIPS - Get daily health tip
HELP - This menu

Download app for full features!"""

    send_sms(phone_number, message)


# Optional: Manual SMS sending endpoint (for testing)
@api_view(['POST'])
@permission_classes([AllowAny])  # Change to IsAdminUser in production
def send_test_sms(request):
    """
    Test endpoint to send SMS manually

    POST /sms/test/
    {
        "phone_number": "+2348012345678",
        "message": "Test message"
    }
    """
    if not SMS_ENABLED:
        return Response({
            'success': False,
            'error': 'SMS feature is disabled'
        }, status=400)

    phone_number = request.data.get('phone_number')
    message = request.data.get('message')

    if not phone_number or not message:
        return Response({
            'success': False,
            'error': 'phone_number and message required'
        }, status=400)

    result = send_sms(phone_number, message)

    return Response(result)


@api_view(['GET'])
def sms_status(request):
    """
    Check if SMS feature is enabled

    GET /sms/status/
    """
    return Response({
        'sms_enabled': SMS_ENABLED,
        'message': 'SMS feature is active' if SMS_ENABLED else 'SMS feature is disabled'
    })
