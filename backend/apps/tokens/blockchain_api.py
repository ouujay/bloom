import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

BLOCKCHAIN_API_URL = getattr(settings, 'BLOCKCHAIN_API_URL', 'http://localhost:8000/api')


class BlockchainAPI:
    """Calls Developer A's blockchain endpoints"""

    @staticmethod
    def record_donation(donor_email, donor_name, amount_naira, reference):
        """Record donation on blockchain - returns Etherscan link"""
        try:
            response = requests.post(
                f"{BLOCKCHAIN_API_URL}/donations/record/",
                json={
                    'donor_email': donor_email or 'anonymous@bloom.com',
                    'donor_name': donor_name or 'Anonymous',
                    'amount_naira': float(amount_naira),
                    'reference': str(reference)
                },
                timeout=30
            )

            if response.status_code in [200, 201]:
                data = response.json()
                return {
                    'success': True,
                    'tx_hash': data.get('blockchain', {}).get('tx_hash', ''),
                    'explorer_url': data.get('blockchain', {}).get('explorer_url', ''),
                }
            return {'success': False, 'error': response.text}
        except Exception as e:
            logger.error(f"Blockchain record_donation failed: {e}")
            return {'success': False, 'error': str(e)}

    @staticmethod
    def mint_tokens(action_type, action_id, auth_token=None):
        """Mint tokens on blockchain when user earns"""
        try:
            headers = {'Content-Type': 'application/json'}
            if auth_token:
                headers['Authorization'] = f'Bearer {auth_token}'

            response = requests.post(
                f"{BLOCKCHAIN_API_URL}/tokens/mint/",
                json={
                    'action_type': action_type,
                    'action_id': str(action_id)
                },
                headers=headers,
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'tokens_earned': data.get('tokens_earned'),
                    'tx_hash': data.get('blockchain_tx', ''),
                    'explorer_url': data.get('explorer_url', ''),
                }
            return {'success': False, 'error': response.json().get('error', 'Unknown')}
        except Exception as e:
            logger.error(f"Blockchain mint_tokens failed: {e}")
            return {'success': False, 'error': str(e)}

    @staticmethod
    def burn_tokens(user_id, amount, withdrawal_id, auth_token=None):
        """Burn tokens on blockchain when user withdraws"""
        try:
            headers = {'Content-Type': 'application/json'}
            if auth_token:
                headers['Authorization'] = f'Bearer {auth_token}'

            response = requests.post(
                f"{BLOCKCHAIN_API_URL}/tokens/burn/",
                json={
                    'user_id': str(user_id),
                    'amount': float(amount),
                    'withdrawal_id': str(withdrawal_id)
                },
                headers=headers,
                timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    'success': True,
                    'tx_hash': data.get('blockchain_tx', ''),
                    'explorer_url': data.get('explorer_url', ''),
                }
            return {'success': False, 'error': response.json().get('error', 'Unknown')}
        except Exception as e:
            logger.error(f"Blockchain burn_tokens failed: {e}")
            return {'success': False, 'error': str(e)}

    @staticmethod
    def get_balance(auth_token=None):
        """Get balance from blockchain"""
        try:
            headers = {}
            if auth_token:
                headers['Authorization'] = f'Bearer {auth_token}'

            response = requests.get(
                f"{BLOCKCHAIN_API_URL}/tokens/balance/",
                headers=headers,
                timeout=10
            )

            if response.status_code == 200:
                return {'success': True, 'balance': response.json().get('balance', 0)}
            return {'success': False, 'error': 'Failed'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
