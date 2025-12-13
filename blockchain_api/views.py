"""
Django REST API views for MamaAlert blockchain integration
Handles all API endpoints for wallet management, token operations, and withdrawals
"""
import sys
import os

# Add parent directory to path to import blockchain.py
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import transaction as db_transaction

from .models import UserWallet, TokenTransaction, Donation, WithdrawalRequest
from .serializers import (
    UserWalletSerializer, TokenTransactionSerializer,
    DonationSerializer, WithdrawalRequestSerializer,
    GenerateWalletSerializer, MintTokensSerializer,
    PaystackWebhookSerializer, CreateWithdrawalSerializer,
    ApproveWithdrawalSerializer
)

# Import our blockchain integration module
import blockchain


class UserWalletViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing user wallets
    GET /api/wallets/ - List all wallets
    GET /api/wallets/{id}/ - Get specific wallet
    GET /api/wallets/{id}/balance/ - Get wallet balance from blockchain
    """
    queryset = UserWallet.objects.all()
    serializer_class = UserWalletSerializer

    @action(detail=True, methods=['get'])
    def balance(self, request, pk=None):
        """Get real-time balance from blockchain"""
        wallet = self.get_object()
        try:
            balance = blockchain.get_balance(wallet.wallet_address)
            return Response({
                'wallet_address': wallet.wallet_address,
                'balance': balance,
                'naira_equivalent': balance * 2,  # 1 BLOOM = ₦2
                'token_symbol': 'BLOOM'
            })
        except Exception as e:
            return Response(
                {'error': f'Failed to get balance: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TokenTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing token transactions
    GET /api/transactions/ - List all transactions
    GET /api/transactions/{id}/ - Get specific transaction
    """
    queryset = TokenTransaction.objects.all()
    serializer_class = TokenTransactionSerializer

    def get_queryset(self):
        """Filter by wallet if specified"""
        queryset = TokenTransaction.objects.all()
        wallet_id = self.request.query_params.get('wallet_id')
        if wallet_id:
            queryset = queryset.filter(user_wallet_id=wallet_id)
        return queryset


class DonationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing donations
    GET /api/donations/ - List all donations
    GET /api/donations/{id}/ - Get specific donation
    """
    queryset = Donation.objects.all()
    serializer_class = DonationSerializer


class WithdrawalRequestViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for viewing withdrawal requests
    GET /api/withdrawals/ - List all withdrawal requests
    GET /api/withdrawals/{id}/ - Get specific withdrawal request
    """
    queryset = WithdrawalRequest.objects.all()
    serializer_class = WithdrawalRequestSerializer

    def get_queryset(self):
        """Filter by status if specified"""
        queryset = WithdrawalRequest.objects.all()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


@api_view(['POST'])
def generate_wallet(request):
    """
    Generate a new blockchain wallet for a user
    POST /api/generate-wallet/
    Body: {"user_id": 1}
    """
    serializer = GenerateWalletSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    user_id = serializer.validated_data['user_id']

    try:
        user = User.objects.get(id=user_id)

        # Generate wallet using blockchain.py
        wallet_data = blockchain.generate_wallet()

        # Create UserWallet record
        user_wallet = UserWallet.objects.create(
            user=user,
            wallet_address=wallet_data['address'],
            encrypted_private_key=wallet_data['private_key']  # TODO: Encrypt this in production!
        )

        return Response({
            'success': True,
            'wallet': UserWalletSerializer(user_wallet).data,
            'message': 'Wallet generated successfully'
        }, status=status.HTTP_201_CREATED)

    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to generate wallet: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def mint_tokens(request):
    """
    Mint BLOOM tokens to a user as a reward
    POST /api/mint-tokens/
    Body: {
        "user_wallet_id": 1,
        "amount": 200,
        "action_type": "checkup",
        "action_id": "CHECKUP_123"
    }
    """
    serializer = MintTokensSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_wallet = UserWallet.objects.get(id=serializer.validated_data['user_wallet_id'])

        # Mint tokens on blockchain
        result = blockchain.mint_tokens(
            user_wallet=user_wallet.wallet_address,
            amount=serializer.validated_data['amount'],
            action_type=serializer.validated_data['action_type'],
            action_id=serializer.validated_data['action_id']
        )

        if result['success']:
            # Record transaction in database
            token_tx = TokenTransaction.objects.create(
                user_wallet=user_wallet,
                transaction_type='MINT',
                action_type=serializer.validated_data['action_type'],
                action_id=serializer.validated_data['action_id'],
                token_amount=serializer.validated_data['amount'],
                tx_hash=result['signature'],
                block_number=result.get('block_number'),
                gas_used=result.get('gas_used'),
                status='CONFIRMED',
                confirmed_at=timezone.now()
            )

            return Response({
                'success': True,
                'transaction': TokenTransactionSerializer(token_tx).data,
                'blockchain': {
                    'tx_hash': result['signature'],
                    'explorer_url': result['explorer_url'],
                    'block_number': result.get('block_number'),
                    'gas_used': result.get('gas_used')
                },
                'message': f"{serializer.validated_data['amount']} BLOOM tokens minted successfully"
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(
                {'error': f"Blockchain transaction failed: {result['error']}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    except UserWallet.DoesNotExist:
        return Response(
            {'error': 'Wallet not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to mint tokens: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def paystack_webhook(request):
    """
    Webhook endpoint for Paystack donation notifications
    POST /api/paystack-webhook/

    Called by Paystack when a donation is successful
    Records donation on blockchain
    """
    serializer = PaystackWebhookSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    event_type = serializer.validated_data['event']
    event_data = serializer.validated_data['data']

    if event_type != 'charge.success':
        return Response({'message': 'Event ignored'}, status=status.HTTP_200_OK)

    try:
        # Extract payment details
        reference = event_data['reference']
        amount_kobo = event_data['amount']  # Paystack sends amount in kobo (smallest unit)
        amount_naira = amount_kobo / 100
        donor_email = event_data['customer']['email']

        # Check if already recorded
        if Donation.objects.filter(paystack_reference=reference).exists():
            return Response(
                {'message': 'Donation already processed'},
                status=status.HTTP_200_OK
            )

        with db_transaction.atomic():
            # Create donation record
            donation = Donation.objects.create(
                donor_email=donor_email,
                amount_naira=amount_naira,
                paystack_reference=reference,
                payment_status='SUCCESS',
                paid_at=timezone.now()
            )

            # Record on blockchain
            blockchain_result = blockchain.record_deposit(
                amount_naira=int(amount_naira),
                reference=reference,
                donor_email=donor_email
            )

            if blockchain_result['success']:
                donation.blockchain_tx_hash = blockchain_result['signature']
                donation.blockchain_recorded = True
                donation.recorded_at = timezone.now()
                donation.save()

                return Response({
                    'success': True,
                    'donation_id': donation.id,
                    'blockchain_tx': blockchain_result['signature'],
                    'explorer_url': blockchain_result['explorer_url']
                }, status=status.HTTP_201_CREATED)
            else:
                # Payment succeeded but blockchain recording failed
                # Keep donation record but mark as not recorded
                return Response({
                    'warning': 'Payment recorded but blockchain recording failed',
                    'donation_id': donation.id,
                    'error': blockchain_result['error']
                }, status=status.HTTP_202_ACCEPTED)

    except Exception as e:
        return Response(
            {'error': f'Webhook processing failed: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def create_withdrawal_request(request):
    """
    Create a new withdrawal request (mother wants to cash out tokens)
    POST /api/create-withdrawal/
    Body: {
        "user_wallet_id": 1,
        "token_amount": 100,
        "bank_name": "GTBank",
        "account_number": "0123456789",
        "account_name": "Jane Doe",
        "payment_provider": "OPay"
    }
    """
    serializer = CreateWithdrawalSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_wallet = UserWallet.objects.get(id=serializer.validated_data['user_wallet_id'])

        # Check if user has enough balance
        current_balance = blockchain.get_balance(user_wallet.wallet_address)
        requested_amount = serializer.validated_data['token_amount']

        if current_balance < requested_amount:
            return Response(
                {
                    'error': 'Insufficient balance',
                    'current_balance': current_balance,
                    'requested': requested_amount
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create withdrawal request (status=PENDING, awaits admin approval)
        withdrawal = WithdrawalRequest.objects.create(
            user_wallet=user_wallet,
            token_amount=requested_amount,
            bank_name=serializer.validated_data['bank_name'],
            account_number=serializer.validated_data['account_number'],
            account_name=serializer.validated_data['account_name'],
            payment_provider=serializer.validated_data.get('payment_provider', 'OPay'),
            status='PENDING'
        )

        return Response({
            'success': True,
            'withdrawal': WithdrawalRequestSerializer(withdrawal).data,
            'message': 'Withdrawal request created. Awaiting admin approval.'
        }, status=status.HTTP_201_CREATED)

    except UserWallet.DoesNotExist:
        return Response(
            {'error': 'Wallet not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to create withdrawal request: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def approve_withdrawal(request):
    """
    Admin endpoint to approve or reject withdrawal requests
    POST /api/approve-withdrawal/
    Body: {
        "withdrawal_id": 1,
        "action": "approve",  // or "reject"
        "admin_notes": "Payment processed via OPay"
    }

    If approved:
    1. Burns tokens from user's wallet
    2. Records withdrawal on blockchain
    3. Admin processes payment manually (OPay/Paystack)
    """
    serializer = ApproveWithdrawalSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    try:
        withdrawal = WithdrawalRequest.objects.get(id=serializer.validated_data['withdrawal_id'])
        action = serializer.validated_data['action']
        admin_notes = serializer.validated_data.get('admin_notes', '')

        if action == 'reject':
            withdrawal.status = 'REJECTED'
            withdrawal.admin_notes = admin_notes
            withdrawal.approved_by = request.user if request.user.is_authenticated else None
            withdrawal.approved_at = timezone.now()
            withdrawal.save()

            return Response({
                'success': True,
                'message': 'Withdrawal request rejected',
                'withdrawal': WithdrawalRequestSerializer(withdrawal).data
            })

        elif action == 'approve':
            with db_transaction.atomic():
                # Step 1: Burn tokens from user's wallet
                burn_result = blockchain.burn_tokens(
                    user_wallet=withdrawal.user_wallet.wallet_address,
                    amount=withdrawal.token_amount,
                    withdrawal_id=f"WD_{withdrawal.id}"
                )

                if not burn_result['success']:
                    return Response(
                        {'error': f"Failed to burn tokens: {burn_result['error']}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                # Step 2: Record withdrawal on blockchain
                # Note: Admin must process actual payment separately
                withdrawal_result = blockchain.record_withdrawal(
                    user_wallet=withdrawal.user_wallet.wallet_address,
                    token_amount=withdrawal.token_amount,
                    naira_amount=int(withdrawal.naira_amount),
                    withdrawal_id=f"WD_{withdrawal.id}",
                    payment_reference="PENDING_MANUAL_PAYMENT"  # Admin updates this after payment
                )

                if not withdrawal_result['success']:
                    return Response(
                        {'error': f"Tokens burned but withdrawal recording failed: {withdrawal_result['error']}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                # Update withdrawal record
                withdrawal.burn_tx_hash = burn_result['signature']
                withdrawal.burn_confirmed = True
                withdrawal.withdrawal_tx_hash = withdrawal_result['signature']
                withdrawal.withdrawal_recorded = True
                withdrawal.status = 'APPROVED'
                withdrawal.admin_notes = admin_notes
                withdrawal.approved_by = request.user if request.user.is_authenticated else None
                withdrawal.approved_at = timezone.now()
                withdrawal.save()

                # Create transaction record for burn
                TokenTransaction.objects.create(
                    user_wallet=withdrawal.user_wallet,
                    transaction_type='BURN',
                    action_type='withdrawal',
                    action_id=f"WD_{withdrawal.id}",
                    token_amount=withdrawal.token_amount,
                    tx_hash=burn_result['signature'],
                    block_number=burn_result.get('block_number'),
                    gas_used=burn_result.get('gas_used'),
                    status='CONFIRMED',
                    confirmed_at=timezone.now()
                )

                return Response({
                    'success': True,
                    'message': f'Withdrawal approved. Tokens burned. Please process ₦{withdrawal.naira_amount} payment to {withdrawal.account_name}.',
                    'withdrawal': WithdrawalRequestSerializer(withdrawal).data,
                    'blockchain': {
                        'burn_tx': burn_result['signature'],
                        'burn_explorer': burn_result['explorer_url'],
                        'withdrawal_tx': withdrawal_result['signature'],
                        'withdrawal_explorer': withdrawal_result['explorer_url']
                    },
                    'payment_details': {
                        'bank_name': withdrawal.bank_name,
                        'account_number': withdrawal.account_number,
                        'account_name': withdrawal.account_name,
                        'amount': float(withdrawal.naira_amount),
                        'provider': withdrawal.payment_provider
                    }
                }, status=status.HTTP_200_OK)

    except WithdrawalRequest.DoesNotExist:
        return Response(
            {'error': 'Withdrawal request not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Failed to process withdrawal: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
def blockchain_status(request):
    """
    Get blockchain connection status and contract info
    GET /api/blockchain-status/
    """
    try:
        is_connected = blockchain.w3.is_connected()
        latest_block = blockchain.w3.eth.block_number if is_connected else None
        total_supply = blockchain.get_total_supply() if is_connected else None

        return Response({
            'connected': is_connected,
            'network': 'Base Sepolia Testnet',
            'rpc_url': os.getenv('BASE_RPC_URL', 'Not configured'),
            'contract_address': os.getenv('CONTRACT_ADDRESS', 'Not deployed'),
            'latest_block': latest_block,
            'total_supply': total_supply,
            'token_symbol': 'BLOOM',
            'conversion_rate': '1 BLOOM = ₦2'
        })
    except Exception as e:
        return Response(
            {'error': f'Failed to get blockchain status: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
