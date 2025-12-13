import requests
import logging
import hashlib
import hmac
from decimal import Decimal
from django.conf import settings

logger = logging.getLogger(__name__)


class ALATPayService:
    """Service for interacting with ALATPay API."""

    def __init__(self):
        self.base_url = settings.ALATPAY_BASE_URL
        self.public_key = settings.ALATPAY_PUBLIC_KEY
        self.secret_key = settings.ALATPAY_SECRET_KEY
        self.business_id = settings.ALATPAY_BUSINESS_ID
        self.callback_url = settings.ALATPAY_CALLBACK_URL

    def _get_headers(self):
        """Get headers for API requests."""
        return {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.secret_key}',
        }

    def create_payment(self, amount, email, reference, metadata=None):
        """
        Create a payment request with ALATPay.

        Args:
            amount: Amount in Naira
            email: Customer email
            reference: Unique payment reference
            metadata: Additional metadata

        Returns:
            dict with payment details including bank transfer info
        """
        url = f'{self.base_url}/api/v1/payments/initiate'

        payload = {
            'businessId': self.business_id,
            'amount': float(amount),
            'currency': 'NGN',
            'email': email,
            'reference': reference,
            'callbackUrl': self.callback_url,
            'metadata': metadata or {},
        }

        try:
            logger.info(f'Creating ALATPay payment: {reference} for {amount} NGN')
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            data = response.json()
            logger.info(f'ALATPay payment created: {data}')
            return {
                'success': True,
                'data': data,
            }
        except requests.exceptions.RequestException as e:
            logger.error(f'ALATPay payment creation failed: {e}')
            return {
                'success': False,
                'error': str(e),
            }

    def verify_payment(self, reference):
        """
        Verify payment status by reference.

        Args:
            reference: Payment reference

        Returns:
            dict with payment status
        """
        url = f'{self.base_url}/api/v1/payments/verify/{reference}'

        try:
            logger.info(f'Verifying ALATPay payment: {reference}')
            response = requests.get(url, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            data = response.json()
            logger.info(f'ALATPay verification result: {data}')

            # Check if payment is successful
            status = data.get('data', {}).get('status', '').lower()
            is_successful = status in ['success', 'successful', 'completed', 'paid']

            return {
                'success': True,
                'is_paid': is_successful,
                'status': status,
                'data': data,
            }
        except requests.exceptions.RequestException as e:
            logger.error(f'ALATPay verification failed: {e}')
            return {
                'success': False,
                'is_paid': False,
                'error': str(e),
            }

    def get_payment_status(self, reference):
        """
        Get payment status - alias for verify_payment.
        """
        return self.verify_payment(reference)

    def verify_webhook_signature(self, payload, signature):
        """
        Verify webhook signature from ALATPay.

        Args:
            payload: Raw request body
            signature: Signature from X-ALATPay-Signature header

        Returns:
            bool: True if signature is valid
        """
        if not settings.ALATPAY_WEBHOOK_SECRET:
            logger.warning('ALATPAY_WEBHOOK_SECRET not configured, skipping signature verification')
            return True

        expected_signature = hmac.new(
            settings.ALATPAY_WEBHOOK_SECRET.encode(),
            payload,
            hashlib.sha512
        ).hexdigest()

        return hmac.compare_digest(expected_signature, signature)


# Singleton instance
alatpay_service = ALATPayService()
