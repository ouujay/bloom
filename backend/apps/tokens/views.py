from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Sum, Count
from .models import DonationPool, Donation, TokenTransaction, WithdrawalRequest
from .services import TokenService, DonationService, WithdrawalService


# ===== PUBLIC =====

@api_view(['GET'])
@permission_classes([AllowAny])
def pool_info(request):
    """Get public pool information and token value"""
    info = TokenService.get_pool_info()
    return Response({
        'success': True,
        'data': info
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def recent_donations(request):
    """Get recent confirmed donations"""
    donations = DonationService.get_recent_donations(limit=10)
    data = [{
        'id': str(d.id),
        'donor_name': 'Anonymous' if d.is_anonymous else (d.donor_name or 'Supporter'),
        'amount_naira': float(d.amount_naira),
        'confirmed_at': d.confirmed_at,
    } for d in donations]
    return Response({
        'success': True,
        'data': data
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def create_donation(request):
    """Create a new donation (pending confirmation)"""
    data = request.data
    try:
        donation = DonationService.create_donation(
            amount_naira=data.get('amount'),
            donor_name=data.get('donor_name', ''),
            donor_email=data.get('donor_email', ''),
            donor_phone=data.get('donor_phone', ''),
            is_anonymous=data.get('is_anonymous', False),
            payment_reference=data.get('payment_reference', ''),
            payment_method=data.get('payment_method', 'bank_transfer'),
        )
        return Response({
            'success': True,
            'data': {
                'donation_id': str(donation.id),
                'amount': float(donation.amount_naira),
                'status': donation.status,
            }
        }, status=201)
    except Exception as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=400)


# ===== USER =====

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_wallet(request):
    """Get user's wallet info including token balance and naira value"""
    user = request.user
    pool = DonationPool.get_pool()
    balance = TokenService.get_user_balance(user)
    balance_naira = balance * pool.token_value_naira

    # Get pending withdrawals
    pending_withdrawal = WithdrawalRequest.objects.filter(
        user=user,
        status__in=['pending', 'approved', 'processing']
    ).aggregate(total=Sum('token_amount'))['total'] or 0

    return Response({
        'success': True,
        'data': {
            'token_balance': float(balance),
            'naira_value': float(balance_naira),
            'token_value_naira': float(pool.token_value_naira),
            'total_earned': user.total_tokens_earned,
            'pending_withdrawal': float(pending_withdrawal),
            'minimum_withdrawal': WithdrawalService.MINIMUM_TOKENS,
            'can_withdraw': float(balance) >= WithdrawalService.MINIMUM_TOKENS,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_transactions(request):
    """Get user's transaction history"""
    transactions = TokenService.get_user_transactions(request.user, limit=50)
    data = [{
        'id': str(t.id),
        'type': t.transaction_type,
        'amount': float(t.amount),
        'balance_after': float(t.balance_after),
        'source': t.source,
        'description': t.description,
        'created_at': t.created_at,
    } for t in transactions]
    return Response({
        'success': True,
        'data': data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_withdrawal(request):
    """Request a token withdrawal"""
    data = request.data
    try:
        withdrawal = WithdrawalService.create_withdrawal_request(
            user=request.user,
            token_amount=data.get('token_amount'),
            bank_name=data.get('bank_name'),
            account_number=data.get('account_number'),
            account_name=data.get('account_name'),
            verification_photo=data.get('verification_photo', ''),
        )
        return Response({
            'success': True,
            'data': {
                'withdrawal_id': str(withdrawal.id),
                'token_amount': float(withdrawal.token_amount),
                'naira_amount': float(withdrawal.naira_amount),
                'status': withdrawal.status,
            }
        }, status=201)
    except ValueError as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_withdrawals(request):
    """Get user's withdrawal history"""
    withdrawals = WithdrawalService.get_user_withdrawals(request.user)
    data = [{
        'id': str(w.id),
        'token_amount': float(w.token_amount),
        'naira_amount': float(w.naira_amount),
        'bank_name': w.bank_name,
        'account_number': w.account_number[-4:].rjust(len(w.account_number), '*'),
        'account_name': w.account_name,
        'status': w.status,
        'rejection_reason': w.rejection_reason,
        'created_at': w.created_at,
        'paid_at': w.paid_at,
    } for w in withdrawals]
    return Response({
        'success': True,
        'data': data
    })


# ===== ADMIN =====

@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_pending_donations(request):
    """Get pending donations for admin review"""
    donations = Donation.objects.filter(status='pending').order_by('-created_at')
    data = [{
        'id': str(d.id),
        'donor_name': d.donor_name or 'Anonymous',
        'donor_email': d.donor_email,
        'donor_phone': d.donor_phone,
        'amount_naira': float(d.amount_naira),
        'payment_reference': d.payment_reference,
        'payment_method': d.payment_method,
        'created_at': d.created_at,
    } for d in donations]
    return Response({
        'success': True,
        'data': data
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def confirm_donation(request, donation_id):
    """Confirm a pending donation"""
    try:
        donation, was_confirmed = DonationService.confirm_donation(donation_id)
        return Response({
            'success': was_confirmed,
            'message': f'Donation of ₦{donation.amount_naira:,.2f} confirmed' if was_confirmed else 'Already confirmed',
        })
    except Donation.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Donation not found'
        }, status=404)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_pending_withdrawals(request):
    """Get pending withdrawals for admin review"""
    withdrawals = WithdrawalService.get_pending_withdrawals()
    data = [{
        'id': str(w.id),
        'user_id': str(w.user.id),
        'user_name': f"{w.user.first_name} {w.user.last_name}".strip() or w.user.email,
        'user_email': w.user.email,
        'user_phone': getattr(w.user, 'phone_number', ''),
        'token_amount': float(w.token_amount),
        'naira_amount': float(w.naira_amount),
        'bank_name': w.bank_name,
        'account_number': w.account_number,
        'account_name': w.account_name,
        'verification_photo': w.verification_photo,
        'created_at': w.created_at,
    } for w in withdrawals]
    return Response({
        'success': True,
        'data': data
    })


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_approve_withdrawal(request, withdrawal_id):
    """Approve a pending withdrawal"""
    try:
        withdrawal = WithdrawalService.approve_withdrawal(withdrawal_id, request.user)
        return Response({
            'success': True,
            'message': f'Approved. Send ₦{withdrawal.naira_amount:,.2f} to {withdrawal.account_name}',
            'data': {
                'bank_name': withdrawal.bank_name,
                'account_number': withdrawal.account_number,
                'account_name': withdrawal.account_name,
                'naira_amount': float(withdrawal.naira_amount),
            }
        })
    except ValueError as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=400)
    except WithdrawalRequest.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Withdrawal not found'
        }, status=404)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_reject_withdrawal(request, withdrawal_id):
    """Reject a pending withdrawal"""
    reason = request.data.get('reason', 'Verification failed')
    try:
        WithdrawalService.reject_withdrawal(withdrawal_id, request.user, reason)
        return Response({
            'success': True,
            'message': 'Withdrawal rejected'
        })
    except ValueError as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=400)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_mark_paid(request, withdrawal_id):
    """Mark a withdrawal as paid"""
    payment_reference = request.data.get('payment_reference', '')
    try:
        WithdrawalService.mark_as_paid(withdrawal_id, payment_reference)
        return Response({
            'success': True,
            'message': 'Marked as paid'
        })
    except ValueError as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=400)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_pool_stats(request):
    """Get comprehensive pool statistics for admin"""
    pool = DonationPool.get_pool()

    donation_total = Donation.objects.filter(status='confirmed').aggregate(
        total=Sum('amount_naira'), count=Count('id')
    )
    withdrawal_total = WithdrawalRequest.objects.filter(status='completed').aggregate(
        tokens=Sum('token_amount'), naira=Sum('naira_amount'), count=Count('id')
    )

    return Response({
        'success': True,
        'data': {
            'pool_balance_naira': float(pool.pool_balance),
            'total_tokens_issued': float(pool.total_tokens_issued),
            'total_tokens_withdrawn': float(pool.total_tokens_withdrawn),
            'tokens_in_circulation': float(pool.tokens_in_circulation),
            'token_value_naira': float(pool.token_value_naira),
            'total_donated': float(donation_total['total'] or 0),
            'total_donations_count': donation_total['count'] or 0,
            'total_withdrawn_naira': float(withdrawal_total['naira'] or 0),
            'total_withdrawals_count': withdrawal_total['count'] or 0,
        }
    })


# Legacy endpoints for backward compatibility
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_balance(request):
    """Legacy: Get user's token balance"""
    return my_wallet(request)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transactions(request):
    """Legacy: Get token transaction history"""
    return my_transactions(request)
