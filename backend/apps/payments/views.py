import uuid
import json
import logging
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from apps.tokens.models import Donation
from apps.tokens.services import DonationService
from .services import alatpay_service

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
def initiate_payment(request):
    """
    Initiate a payment for donation.

    POST /api/payments/initiate/
    Body: {
        "amount": 5000,
        "donor_name": "John Doe",
        "donor_email": "john@example.com",
        "donor_phone": "08012345678",
        "is_anonymous": false
    }
    """
    data = request.data
    amount = data.get('amount')

    if not amount or float(amount) < 100:
        return Response({
            'success': False,
            'message': 'Minimum donation is ₦100'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Generate unique reference
    reference = f'BLOOM-DON-{uuid.uuid4().hex[:12].upper()}'

    # Create donation record (pending)
    donation = DonationService.create_donation(
        amount_naira=amount,
        donor_name=data.get('donor_name', ''),
        donor_email=data.get('donor_email', ''),
        donor_phone=data.get('donor_phone', ''),
        is_anonymous=data.get('is_anonymous', False),
        payment_reference=reference,
        payment_method='alatpay',
    )

    # Create payment with ALATPay
    email = data.get('donor_email') or 'donor@bloom.ng'
    result = alatpay_service.create_payment(
        amount=amount,
        email=email,
        reference=reference,
        metadata={
            'donation_id': str(donation.id),
            'donor_name': data.get('donor_name', ''),
        }
    )

    if not result['success']:
        # Still return the donation for manual verification
        return Response({
            'success': True,
            'message': 'Donation recorded. Please make a bank transfer.',
            'data': {
                'donation_id': str(donation.id),
                'reference': reference,
                'amount': float(amount),
                'bank_name': 'GTBank',  # Fallback bank details
                'account_number': '0123456789',
                'account_name': 'Bloom Foundation',
            }
        }, status=status.HTTP_201_CREATED)

    # Return payment details from ALATPay
    payment_data = result.get('data', {}).get('data', {})

    return Response({
        'success': True,
        'data': {
            'donation_id': str(donation.id),
            'reference': reference,
            'amount': float(amount),
            'payment_url': payment_data.get('paymentUrl'),
            'bank_name': payment_data.get('bankName', 'Wema Bank'),
            'account_number': payment_data.get('accountNumber'),
            'account_name': payment_data.get('accountName', 'Bloom Foundation'),
            'expires_at': payment_data.get('expiresAt'),
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([AllowAny])
def check_payment_status(request, reference):
    """
    Check payment status by reference.

    GET /api/payments/status/<reference>/
    """
    # First check our database
    try:
        donation = Donation.objects.get(payment_reference=reference)
        if donation.status == 'confirmed':
            return Response({
                'success': True,
                'data': {
                    'status': 'confirmed',
                    'is_paid': True,
                    'donation_id': str(donation.id),
                    'amount': float(donation.amount_naira),
                    'confirmed_at': donation.confirmed_at,
                }
            })
    except Donation.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Donation not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Check with ALATPay
    result = alatpay_service.verify_payment(reference)

    if result.get('is_paid'):
        # Confirm the donation
        try:
            donation, was_confirmed = DonationService.confirm_donation(donation.id)
            return Response({
                'success': True,
                'data': {
                    'status': 'confirmed',
                    'is_paid': True,
                    'donation_id': str(donation.id),
                    'amount': float(donation.amount_naira),
                    'confirmed_at': donation.confirmed_at,
                    'message': 'Thank you for your donation!' if was_confirmed else 'Donation already confirmed',
                }
            })
        except Exception as e:
            logger.error(f'Failed to confirm donation: {e}')

    # Return pending status
    return Response({
        'success': True,
        'data': {
            'status': donation.status,
            'is_paid': False,
            'donation_id': str(donation.id),
            'amount': float(donation.amount_naira),
            'alatpay_status': result.get('status', 'unknown'),
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def payment_webhook(request):
    """
    Handle ALATPay webhook callbacks.

    POST /api/payments/webhook/
    """
    # Verify signature
    signature = request.headers.get('X-ALATPay-Signature', '')
    if not alatpay_service.verify_webhook_signature(request.body, signature):
        logger.warning('Invalid webhook signature')
        return Response({'status': 'invalid signature'}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        data = request.data
        event_type = data.get('event')
        payment_data = data.get('data', {})
        reference = payment_data.get('reference')

        logger.info(f'ALATPay webhook received: {event_type} for {reference}')

        if event_type in ['payment.success', 'charge.success', 'transfer.success']:
            # Find and confirm the donation
            try:
                donation = Donation.objects.get(payment_reference=reference)
                DonationService.confirm_donation(donation.id)
                logger.info(f'Donation {donation.id} confirmed via webhook')
            except Donation.DoesNotExist:
                logger.error(f'Donation not found for reference: {reference}')

        return Response({'status': 'received'})

    except Exception as e:
        logger.error(f'Webhook processing error: {e}')
        return Response({'status': 'error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def manual_confirm(request):
    """
    Manually trigger payment check (for "I have sent money" button).

    POST /api/payments/confirm/
    Body: { "reference": "BLOOM-DON-XXXX" }
    """
    reference = request.data.get('reference')
    if not reference:
        return Response({
            'success': False,
            'message': 'Reference is required'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check with ALATPay
    result = alatpay_service.verify_payment(reference)

    if result.get('is_paid'):
        try:
            donation = Donation.objects.get(payment_reference=reference)
            donation, was_confirmed = DonationService.confirm_donation(donation.id)
            return Response({
                'success': True,
                'data': {
                    'status': 'confirmed',
                    'is_paid': True,
                    'donation_id': str(donation.id),
                    'amount': float(donation.amount_naira),
                    'message': 'Payment confirmed! Thank you for your generous donation.',
                }
            })
        except Donation.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Donation not found'
            }, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'success': True,
        'data': {
            'status': 'pending',
            'is_paid': False,
            'message': 'Payment not yet received. Please ensure you have completed the transfer.',
        }
    })
