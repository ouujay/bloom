from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum
from .models import DonationPool, Donation, TokenTransaction, WithdrawalRequest
import logging

logger = logging.getLogger(__name__)


class TokenService:
    MINIMUM_WITHDRAWAL = 200

    @staticmethod
    def get_pool_info():
        pool = DonationPool.get_pool()
        return {
            'pool_balance_naira': float(pool.pool_balance),
            'total_tokens_issued': float(pool.total_tokens_issued),
            'total_tokens_withdrawn': float(pool.total_tokens_withdrawn),
            'tokens_in_circulation': float(pool.tokens_in_circulation),
            'token_value_naira': float(pool.token_value_naira),
        }

    @staticmethod
    def get_user_balance(user):
        result = TokenTransaction.objects.filter(user=user).aggregate(total=Sum('amount'))
        return Decimal(result['total'] or 0)

    @staticmethod
    def get_user_balance_naira(user):
        balance = TokenService.get_user_balance(user)
        pool = DonationPool.get_pool()
        return balance * pool.token_value_naira

    @staticmethod
    @transaction.atomic
    def award_tokens(user, amount, source, description='', reference_id=None, reference_type=''):
        amount = Decimal(str(amount))
        current_balance = TokenService.get_user_balance(user)
        new_balance = current_balance + amount

        txn = TokenTransaction.objects.create(
            user=user,
            transaction_type='earn',
            amount=amount,
            balance_after=new_balance,
            source=source,
            description=description,
            reference_id=reference_id,
            reference_type=reference_type,
        )

        pool = DonationPool.get_pool()
        pool.total_tokens_issued += amount
        pool.save()

        # Update user's cached balance
        user.token_balance = int(new_balance)
        user.total_tokens_earned += int(amount)
        user.save(update_fields=['token_balance', 'total_tokens_earned'])

        return txn

    @staticmethod
    @transaction.atomic
    def deduct_tokens(user, amount, source, description='', reference_id=None):
        amount = Decimal(str(amount))
        current_balance = TokenService.get_user_balance(user)

        if current_balance < amount:
            raise ValueError("Insufficient token balance")

        new_balance = current_balance - amount

        txn = TokenTransaction.objects.create(
            user=user,
            transaction_type='withdraw',
            amount=-amount,
            balance_after=new_balance,
            source=source,
            description=description,
            reference_id=reference_id,
            reference_type='withdrawal',
        )

        pool = DonationPool.get_pool()
        pool.total_tokens_withdrawn += amount
        pool.save()

        # Update user's cached balance
        user.token_balance = int(new_balance)
        user.save(update_fields=['token_balance'])

        return txn

    @staticmethod
    def get_user_transactions(user, limit=50):
        return TokenTransaction.objects.filter(user=user)[:limit]


class DonationService:
    @staticmethod
    def create_donation(amount_naira, donor_name='', donor_email='', donor_phone='',
                       is_anonymous=False, payment_reference='', payment_method='bank_transfer'):
        return Donation.objects.create(
            amount_naira=Decimal(str(amount_naira)),
            donor_name=donor_name,
            donor_email=donor_email,
            donor_phone=donor_phone,
            is_anonymous=is_anonymous,
            payment_reference=payment_reference,
            payment_method=payment_method,
            status='pending',
        )

    @staticmethod
    @transaction.atomic
    def confirm_donation(donation_id):
        donation = Donation.objects.select_for_update().get(id=donation_id)

        if donation.status == 'confirmed':
            return donation, False

        donation.status = 'confirmed'
        donation.confirmed_at = timezone.now()
        donation.save()

        pool = DonationPool.get_pool()
        pool.pool_balance += donation.amount_naira
        pool.save()

        # Automatically record on blockchain
        try:
            import blockchain
            from apps.blockchain_api.models import Donation as BlockchainDonation

            # Check if already recorded
            already_recorded = BlockchainDonation.objects.filter(
                paystack_reference=donation.payment_reference,
                blockchain_recorded=True
            ).exists()

            if not already_recorded:
                logger.info(f"Recording donation {donation.payment_reference} on blockchain...")
                blockchain_result = blockchain.record_deposit(
                    amount_naira=float(donation.amount_naira),
                    reference=donation.payment_reference,
                    donor_email=donation.donor_email or 'anonymous@bloom.com'
                )

                if blockchain_result.get('success'):
                    # Save blockchain record
                    BlockchainDonation.objects.create(
                        donor_email=donation.donor_email or 'anonymous@bloom.com',
                        amount_naira=donation.amount_naira,
                        paystack_reference=donation.payment_reference,
                        blockchain_tx_hash=blockchain_result['signature'],
                        blockchain_recorded=True,
                        payment_status='SUCCESS'
                    )
                    logger.info(f"✅ Donation recorded on blockchain: {blockchain_result['signature']}")
                else:
                    logger.error(f"❌ Blockchain recording failed: {blockchain_result.get('error')}")
        except Exception as e:
            # Don't fail the confirmation if blockchain recording fails
            logger.error(f"❌ Error recording on blockchain: {e}")

        return donation, True

    @staticmethod
    def get_recent_donations(limit=10):
        return Donation.objects.filter(status='confirmed').order_by('-confirmed_at')[:limit]


class WithdrawalService:
    MINIMUM_TOKENS = 200

    @staticmethod
    def create_withdrawal_request(user, token_amount, bank_name, account_number,
                                  account_name, verification_photo=''):
        token_amount = Decimal(str(token_amount))

        if token_amount < WithdrawalService.MINIMUM_TOKENS:
            raise ValueError(f"Minimum withdrawal is {WithdrawalService.MINIMUM_TOKENS} tokens")

        balance = TokenService.get_user_balance(user)
        if balance < token_amount:
            raise ValueError("Insufficient token balance")

        pending = WithdrawalRequest.objects.filter(
            user=user,
            status__in=['pending', 'approved', 'processing']
        ).exists()
        if pending:
            raise ValueError("You have a pending withdrawal request")

        pool = DonationPool.get_pool()
        token_value = pool.token_value_naira
        naira_amount = token_amount * token_value

        return WithdrawalRequest.objects.create(
            user=user,
            token_amount=token_amount,
            naira_amount=naira_amount,
            token_value_at_request=token_value,
            bank_name=bank_name,
            account_number=account_number,
            account_name=account_name,
            verification_photo=verification_photo,
            status='pending',
        )

    @staticmethod
    @transaction.atomic
    def approve_withdrawal(withdrawal_id, admin_user):
        withdrawal = WithdrawalRequest.objects.select_for_update().get(id=withdrawal_id)

        if withdrawal.status != 'pending':
            raise ValueError(f"Cannot approve withdrawal with status: {withdrawal.status}")

        balance = TokenService.get_user_balance(withdrawal.user)
        if balance < withdrawal.token_amount:
            raise ValueError("User no longer has sufficient balance")

        TokenService.deduct_tokens(
            user=withdrawal.user,
            amount=withdrawal.token_amount,
            source='withdrawal',
            description=f"Withdrawal of {withdrawal.token_amount} tokens",
            reference_id=withdrawal.id,
        )

        pool = DonationPool.get_pool()
        pool.pool_balance -= withdrawal.naira_amount
        pool.save()

        withdrawal.status = 'approved'
        withdrawal.reviewed_by = admin_user
        withdrawal.reviewed_at = timezone.now()
        withdrawal.save()

        return withdrawal

    @staticmethod
    def reject_withdrawal(withdrawal_id, admin_user, reason):
        withdrawal = WithdrawalRequest.objects.get(id=withdrawal_id)

        if withdrawal.status != 'pending':
            raise ValueError(f"Cannot reject withdrawal with status: {withdrawal.status}")

        withdrawal.status = 'rejected'
        withdrawal.reviewed_by = admin_user
        withdrawal.reviewed_at = timezone.now()
        withdrawal.rejection_reason = reason
        withdrawal.save()

        return withdrawal

    @staticmethod
    def mark_as_paid(withdrawal_id, payment_reference):
        withdrawal = WithdrawalRequest.objects.get(id=withdrawal_id)

        if withdrawal.status != 'approved':
            raise ValueError("Withdrawal must be approved first")

        withdrawal.status = 'completed'
        withdrawal.payment_reference = payment_reference
        withdrawal.paid_at = timezone.now()
        withdrawal.save()

        return withdrawal

    @staticmethod
    def get_pending_withdrawals():
        return WithdrawalRequest.objects.filter(status='pending').order_by('created_at')

    @staticmethod
    def get_user_withdrawals(user):
        return WithdrawalRequest.objects.filter(user=user).order_by('-created_at')
