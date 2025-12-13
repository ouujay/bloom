"""
Django REST Framework serializers for blockchain API
Handles JSON serialization/deserialization for API endpoints
"""
from rest_framework import serializers
from .models import UserWallet, TokenTransaction, Donation, WithdrawalRequest
from django.contrib.auth.models import User


class UserWalletSerializer(serializers.ModelSerializer):
    """Serializer for UserWallet - excludes private key for security"""
    username = serializers.CharField(source='user.username', read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = UserWallet
        fields = ['id', 'user_id', 'username', 'wallet_address', 'created_at', 'updated_at']
        read_only_fields = ['id', 'wallet_address', 'created_at', 'updated_at']


class TokenTransactionSerializer(serializers.ModelSerializer):
    """Serializer for TokenTransaction records"""
    wallet_address = serializers.CharField(source='user_wallet.wallet_address', read_only=True)
    username = serializers.CharField(source='user_wallet.user.username', read_only=True)
    explorer_url = serializers.SerializerMethodField()

    class Meta:
        model = TokenTransaction
        fields = [
            'id', 'user_wallet', 'wallet_address', 'username',
            'transaction_type', 'action_type', 'action_id',
            'token_amount', 'naira_equivalent',
            'tx_hash', 'block_number', 'gas_used',
            'status', 'created_at', 'confirmed_at', 'explorer_url'
        ]
        read_only_fields = [
            'id', 'tx_hash', 'block_number', 'gas_used',
            'status', 'created_at', 'confirmed_at'
        ]

    def get_explorer_url(self, obj):
        """Generate Basescan explorer URL for transaction"""
        if obj.tx_hash:
            return f"https://sepolia.basescan.org/tx/{obj.tx_hash}"
        return None


class DonationSerializer(serializers.ModelSerializer):
    """Serializer for Donation records"""
    explorer_url = serializers.SerializerMethodField()

    class Meta:
        model = Donation
        fields = [
            'id', 'donor_email', 'amount_naira', 'paystack_reference',
            'blockchain_tx_hash', 'blockchain_recorded',
            'payment_status', 'created_at', 'paid_at', 'recorded_at',
            'explorer_url'
        ]
        read_only_fields = [
            'id', 'blockchain_tx_hash', 'blockchain_recorded',
            'created_at', 'paid_at', 'recorded_at'
        ]

    def get_explorer_url(self, obj):
        """Generate Basescan explorer URL for blockchain transaction"""
        if obj.blockchain_tx_hash:
            return f"https://sepolia.basescan.org/tx/{obj.blockchain_tx_hash}"
        return None


class WithdrawalRequestSerializer(serializers.ModelSerializer):
    """Serializer for WithdrawalRequest records"""
    wallet_address = serializers.CharField(source='user_wallet.wallet_address', read_only=True)
    username = serializers.CharField(source='user_wallet.user.username', read_only=True)
    approved_by_username = serializers.CharField(source='approved_by.username', read_only=True)
    burn_explorer_url = serializers.SerializerMethodField()
    withdrawal_explorer_url = serializers.SerializerMethodField()

    class Meta:
        model = WithdrawalRequest
        fields = [
            'id', 'user_wallet', 'wallet_address', 'username',
            'token_amount', 'naira_amount',
            'bank_name', 'account_number', 'account_name',
            'payment_provider', 'payment_reference',
            'burn_tx_hash', 'burn_confirmed',
            'withdrawal_tx_hash', 'withdrawal_recorded',
            'status', 'admin_notes', 'approved_by', 'approved_by_username',
            'created_at', 'approved_at', 'completed_at',
            'burn_explorer_url', 'withdrawal_explorer_url'
        ]
        read_only_fields = [
            'id', 'naira_amount', 'payment_reference',
            'burn_tx_hash', 'burn_confirmed',
            'withdrawal_tx_hash', 'withdrawal_recorded',
            'approved_by', 'created_at', 'approved_at', 'completed_at'
        ]

    def get_burn_explorer_url(self, obj):
        """Generate Basescan explorer URL for burn transaction"""
        if obj.burn_tx_hash:
            return f"https://sepolia.basescan.org/tx/{obj.burn_tx_hash}"
        return None

    def get_withdrawal_explorer_url(self, obj):
        """Generate Basescan explorer URL for withdrawal recording"""
        if obj.withdrawal_tx_hash:
            return f"https://sepolia.basescan.org/tx/{obj.withdrawal_tx_hash}"
        return None


# Input serializers for specific API actions

class GenerateWalletSerializer(serializers.Serializer):
    """Input for generating a new wallet for a user"""
    user_id = serializers.IntegerField()

    def validate_user_id(self, value):
        """Ensure user exists and doesn't already have a wallet"""
        try:
            user = User.objects.get(id=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User does not exist")

        if UserWallet.objects.filter(user=user).exists():
            raise serializers.ValidationError("User already has a wallet")

        return value


class MintTokensSerializer(serializers.Serializer):
    """Input for minting tokens to a user"""
    user_wallet_id = serializers.IntegerField()
    amount = serializers.IntegerField(min_value=1)
    action_type = serializers.ChoiceField(choices=['checkup', 'education'])
    action_id = serializers.CharField(max_length=100)

    def validate_user_wallet_id(self, value):
        """Ensure wallet exists"""
        if not UserWallet.objects.filter(id=value).exists():
            raise serializers.ValidationError("Wallet does not exist")
        return value


class PaystackWebhookSerializer(serializers.Serializer):
    """Input from Paystack webhook"""
    event = serializers.CharField()
    data = serializers.DictField()


class CreateWithdrawalSerializer(serializers.Serializer):
    """Input for creating a withdrawal request"""
    user_wallet_id = serializers.IntegerField()
    token_amount = serializers.IntegerField(min_value=1)
    bank_name = serializers.CharField(max_length=100)
    account_number = serializers.CharField(max_length=20)
    account_name = serializers.CharField(max_length=100)
    payment_provider = serializers.ChoiceField(
        choices=['OPay', 'Paystack', 'Manual'],
        default='OPay'
    )

    def validate_user_wallet_id(self, value):
        """Ensure wallet exists"""
        if not UserWallet.objects.filter(id=value).exists():
            raise serializers.ValidationError("Wallet does not exist")
        return value


class ApproveWithdrawalSerializer(serializers.Serializer):
    """Input for admin approval/rejection of withdrawal"""
    withdrawal_id = serializers.IntegerField()
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    admin_notes = serializers.CharField(required=False, allow_blank=True)

    def validate_withdrawal_id(self, value):
        """Ensure withdrawal exists and is pending"""
        try:
            withdrawal = WithdrawalRequest.objects.get(id=value)
            if withdrawal.status != 'PENDING':
                raise serializers.ValidationError(
                    f"Withdrawal is not pending (current status: {withdrawal.status})"
                )
        except WithdrawalRequest.DoesNotExist:
            raise serializers.ValidationError("Withdrawal request does not exist")
        return value
