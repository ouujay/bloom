from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import WithdrawalRequest, TokenConversionRate
from .serializers import WithdrawalRequestSerializer
from apps.tokens.services import TokenService


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def withdrawals(request):
    """List user's withdrawals or create new request"""
    if request.method == 'GET':
        withdrawals = WithdrawalRequest.objects.filter(user=request.user)
        return Response({
            'success': True,
            'data': WithdrawalRequestSerializer(withdrawals, many=True).data
        })

    if request.method == 'POST':
        tokens_amount = request.data.get('tokens_amount')
        payment_method = request.data.get('payment_method')

        if not tokens_amount or not payment_method:
            return Response({
                'success': False,
                'message': 'tokens_amount and payment_method are required'
            }, status=status.HTTP_400_BAD_REQUEST)

        tokens_amount = int(tokens_amount)

        # Check user has enough tokens
        if request.user.token_balance < tokens_amount:
            return Response({
                'success': False,
                'message': 'Insufficient token balance'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Get conversion rate
        rate = TokenConversionRate.get_active()
        if not rate:
            rate = TokenConversionRate.objects.create()

        # Validate withdrawal limits
        if tokens_amount < rate.minimum_withdrawal:
            return Response({
                'success': False,
                'message': f'Minimum withdrawal is {rate.minimum_withdrawal} tokens'
            }, status=status.HTTP_400_BAD_REQUEST)

        if tokens_amount > rate.maximum_withdrawal:
            return Response({
                'success': False,
                'message': f'Maximum withdrawal is {rate.maximum_withdrawal} tokens'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Calculate naira amount
        naira_amount = tokens_amount / rate.tokens_per_naira

        # Create withdrawal request
        withdrawal_data = {
            'tokens_amount': tokens_amount,
            'naira_amount': naira_amount,
            'payment_method': payment_method,
        }

        if payment_method == 'bank_transfer':
            withdrawal_data['bank_name'] = request.data.get('bank_name', '')
            withdrawal_data['account_number'] = request.data.get('account_number', '')
            withdrawal_data['account_name'] = request.data.get('account_name', '')
        else:
            withdrawal_data['mobile_network'] = request.data.get('mobile_network', '')
            withdrawal_data['mobile_number'] = request.data.get('mobile_number', '')

        withdrawal = WithdrawalRequest.objects.create(
            user=request.user,
            **withdrawal_data
        )

        # Deduct tokens from user balance (put on hold)
        TokenService.deduct_tokens(
            user=request.user,
            amount=tokens_amount,
            reason='withdrawal_request',
            reference_id=withdrawal.id,
            reference_type='withdrawal'
        )

        return Response({
            'success': True,
            'data': WithdrawalRequestSerializer(withdrawal).data,
            'new_balance': request.user.token_balance
        }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def withdrawal_detail(request, withdrawal_id):
    """Get specific withdrawal details"""
    try:
        withdrawal = WithdrawalRequest.objects.get(id=withdrawal_id, user=request.user)
    except WithdrawalRequest.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Withdrawal not found'
        }, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'success': True,
        'data': WithdrawalRequestSerializer(withdrawal).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def conversion_rate(request):
    """Get current token conversion rate"""
    rate = TokenConversionRate.get_active()
    if not rate:
        rate = TokenConversionRate.objects.create()

    return Response({
        'success': True,
        'data': {
            'tokens_per_naira': rate.tokens_per_naira,
            'minimum_withdrawal': rate.minimum_withdrawal,
            'maximum_withdrawal': rate.maximum_withdrawal,
        }
    })


# Admin endpoints
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_withdrawals(request):
    """List all withdrawals (admin only)"""
    if not request.user.is_staff:
        return Response({
            'success': False,
            'message': 'Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    status_filter = request.query_params.get('status')
    withdrawals = WithdrawalRequest.objects.all()

    if status_filter:
        withdrawals = withdrawals.filter(status=status_filter)

    return Response({
        'success': True,
        'data': WithdrawalRequestSerializer(withdrawals, many=True).data,
        'counts': {
            'pending': WithdrawalRequest.objects.filter(status='pending').count(),
            'approved': WithdrawalRequest.objects.filter(status='approved').count(),
            'completed': WithdrawalRequest.objects.filter(status='completed').count(),
            'rejected': WithdrawalRequest.objects.filter(status='rejected').count(),
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_process_withdrawal(request, withdrawal_id):
    """Approve or reject withdrawal (admin only)"""
    if not request.user.is_staff:
        return Response({
            'success': False,
            'message': 'Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        withdrawal = WithdrawalRequest.objects.get(id=withdrawal_id)
    except WithdrawalRequest.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Withdrawal not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if withdrawal.status != 'pending':
        return Response({
            'success': False,
            'message': 'Withdrawal already processed'
        }, status=status.HTTP_400_BAD_REQUEST)

    action = request.data.get('action')  # 'approve' or 'reject'

    if action == 'approve':
        withdrawal.status = 'approved'
        withdrawal.processed_by = request.user
        withdrawal.processed_at = timezone.now()
        withdrawal.admin_notes = request.data.get('notes', '')
        withdrawal.save()

        return Response({
            'success': True,
            'message': 'Withdrawal approved',
            'data': WithdrawalRequestSerializer(withdrawal).data
        })

    elif action == 'reject':
        withdrawal.status = 'rejected'
        withdrawal.processed_by = request.user
        withdrawal.processed_at = timezone.now()
        withdrawal.rejection_reason = request.data.get('reason', '')
        withdrawal.save()

        # Refund tokens to user
        TokenService.award_tokens(
            user=withdrawal.user,
            amount=withdrawal.tokens_amount,
            source='withdrawal_refund',
            reference_id=withdrawal.id,
            reference_type='withdrawal',
            description='Withdrawal request rejected - tokens refunded'
        )

        return Response({
            'success': True,
            'message': 'Withdrawal rejected and tokens refunded',
            'data': WithdrawalRequestSerializer(withdrawal).data
        })

    return Response({
        'success': False,
        'message': 'Invalid action. Use "approve" or "reject"'
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_complete_withdrawal(request, withdrawal_id):
    """Mark withdrawal as completed (admin only)"""
    if not request.user.is_staff:
        return Response({
            'success': False,
            'message': 'Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        withdrawal = WithdrawalRequest.objects.get(id=withdrawal_id)
    except WithdrawalRequest.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Withdrawal not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if withdrawal.status != 'approved':
        return Response({
            'success': False,
            'message': 'Withdrawal must be approved first'
        }, status=status.HTTP_400_BAD_REQUEST)

    withdrawal.status = 'completed'
    withdrawal.save()

    return Response({
        'success': True,
        'message': 'Withdrawal marked as completed',
        'data': WithdrawalRequestSerializer(withdrawal).data
    })
