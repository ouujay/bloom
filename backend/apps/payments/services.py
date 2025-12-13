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
        """Get headers for API requests (ALATPay uses Ocp-Apim-Subscription-Key)."""
        return {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': self.secret_key,
        }

    def create_payment(self, amount, email, reference, metadata=None):
        """
        Generate virtual account for bank transfer payment with ALATPay.

        Args:
            amount: Amount in Naira
            email: Customer email
            reference: Unique payment reference (orderId)
            metadata: Additional metadata (customer info)

        Returns:
            dict with virtual account details for bank transfer
        """
        url = f'{self.base_url}/bank-transfer/api/v1/bankTransfer/virtualAccount'

        # Extract customer info from metadata if provided
        customer_data = metadata or {}
        donor_name = customer_data.get('donor_name', '')
        name_parts = donor_name.split(' ', 1) if donor_name else ['', '']

        payload = {
            'businessId': self.business_id,
            'amount': float(amount),
            'currency': 'NGN',
            'orderId': reference,  # Use our reference as orderId
            'description': f'Bloom Donation - {reference}',
            'customer': {
                'email': email,
                'phone': customer_data.get('phone', ''),
                'firstName': name_parts[0] or 'Anonymous',
                'lastName': name_parts[1] if len(name_parts) > 1 else 'Donor',
                'metadata': str(metadata) if metadata else ''
            }
        }

        try:
            logger.info(f'Creating ALATPay virtual account: {reference} for {amount} NGN')
            response = requests.post(url, json=payload, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            result = response.json()
            logger.info(f'ALATPay virtual account created: {result}')

            # Check if successful
            if result.get('status'):
                data = result.get('data', {})
                return {
                    'success': True,
                    'data': {
                        'transactionId': data.get('transactionId'),
                        'virtualBankCode': data.get('virtualBankCode'),
                        'virtualBankAccountNumber': data.get('virtualBankAccountNumber'),
                        'bankName': 'Wema Bank' if data.get('virtualBankCode') == '035' else 'Bank',
                        'accountNumber': data.get('virtualBankAccountNumber'),
                        'accountName': 'Bloom Foundation',
                        'amount': data.get('amount'),
                        'orderId': data.get('orderId'),
                        'expiresAt': data.get('expiredAt'),
                    },
                    'raw': result
                }
            else:
                return {
                    'success': False,
                    'error': result.get('message', 'Failed to create virtual account'),
                }
        except requests.exceptions.RequestException as e:
            logger.error(f'ALATPay virtual account creation failed: {e}')
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    logger.error(f'Error response: {error_data}')
                except:
                    pass
            return {
                'success': False,
                'error': str(e),
            }

    def verify_payment(self, transaction_id):
        """
        Verify payment status by transactionId.

        Args:
            transaction_id: ALATPay transaction ID (from virtual account creation)

        Returns:
            dict with payment status
        """
        url = f'{self.base_url}/bank-transfer/api/v1/bankTransfer/transactions/{transaction_id}'

        try:
            logger.info(f'Verifying ALATPay transaction: {transaction_id}')
            response = requests.get(url, headers=self._get_headers(), timeout=30)
            response.raise_for_status()
            result = response.json()
            logger.info(f'ALATPay verification result: {result}')

            # Check if successful
            if result.get('status'):
                data = result.get('data', {})
                status = data.get('status', '').lower()

                # ALATPay statuses: pending, processing, successful, failed, etc.
                is_successful = status in ['successful', 'success', 'completed', 'paid']

                return {
                    'success': True,
                    'is_paid': is_successful,
                    'status': status,
                    'amount': data.get('amount'),
                    'orderId': data.get('orderId'),
                    'data': result,
                }
            else:
                return {
                    'success': False,
                    'is_paid': False,
                    'error': result.get('message', 'Verification failed'),
                }
        except requests.exceptions.RequestException as e:
            logger.error(f'ALATPay verification failed: {e}')
            return {
                'success': False,
                'is_paid': False,
                'error': str(e),
            }

    def get_payment_status(self, transaction_id):
        """
        Get payment status - alias for verify_payment.
        """
        return self.verify_payment(transaction_id)

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
