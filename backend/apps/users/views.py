from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Sum, Count
from .models import User, EmergencyContact, PreferredHospital
from .serializers import (
    UserSerializer, SignupSerializer, LoginSerializer, OnboardingSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()

        # Generate tokens
        refresh = RefreshToken.for_user(user)

        # Award signup bonus
        from apps.tokens.services import TokenService
        TokenService.award_tokens(
            user=user,
            amount=50,
            source='signup',
            description='Welcome to MamaAlert!'
        )

        return Response({
            'success': True,
            'data': {
                'user': UserSerializer(user).data,
                'token': str(refresh.access_token),
                'refresh': str(refresh),
            }
        }, status=status.HTTP_201_CREATED)

    return Response({
        'success': False,
        'message': list(serializer.errors.values())[0][0] if serializer.errors else 'Invalid data',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = authenticate(
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )

        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'success': True,
                'data': {
                    'user': UserSerializer(user).data,
                    'token': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            })

        return Response({
            'success': False,
            'message': 'Invalid email or password'
        }, status=status.HTTP_401_UNAUTHORIZED)

    return Response({
        'success': False,
        'message': 'Invalid data',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user

    if request.method == 'GET':
        data = UserSerializer(user).data
        # Flatten emergency contact for frontend convenience
        ec = user.emergency_contacts.filter(is_primary=True).first()
        if ec:
            data['emergency_contact_name'] = ec.name
            data['emergency_contact_phone'] = ec.phone
            data['emergency_contact_relationship'] = ec.relationship
        else:
            data['emergency_contact_name'] = None
            data['emergency_contact_phone'] = None
            data['emergency_contact_relationship'] = None

        # Flatten hospital for frontend
        hospital = getattr(user, 'preferred_hospital', None)
        if hospital:
            data['hospital_name'] = hospital.name
            data['doctor_name'] = hospital.doctor_name
        else:
            data['hospital_name'] = user.hospital_name or None
            data['doctor_name'] = None

        return Response({
            'success': True,
            'data': data
        })

    elif request.method == 'PATCH':
        data = request.data

        # Update user basic fields
        if 'name' in data:
            parts = data['name'].split(' ', 1)
            user.first_name = parts[0]
            user.last_name = parts[1] if len(parts) > 1 else ''
        if 'phone' in data:
            user.phone = data['phone']
        if 'hospital_name' in data:
            user.hospital_name = data['hospital_name']
        if 'doctor_name' in data:
            user.doctor_name = data.get('doctor_name', '')

        user.save()

        # Update or create emergency contact
        if data.get('emergency_contact_name') or data.get('emergency_contact_phone'):
            ec, created = EmergencyContact.objects.get_or_create(
                user=user,
                is_primary=True,
                defaults={
                    'name': data.get('emergency_contact_name', ''),
                    'phone': data.get('emergency_contact_phone', ''),
                    'relationship': data.get('emergency_contact_relationship', ''),
                }
            )
            if not created:
                ec.name = data.get('emergency_contact_name', ec.name)
                ec.phone = data.get('emergency_contact_phone', ec.phone)
                ec.relationship = data.get('emergency_contact_relationship', ec.relationship)
                ec.save()

        # Update or create preferred hospital
        if data.get('hospital_name'):
            hospital, created = PreferredHospital.objects.get_or_create(
                user=user,
                defaults={
                    'name': data.get('hospital_name', ''),
                    'doctor_name': data.get('doctor_name', ''),
                }
            )
            if not created:
                hospital.name = data.get('hospital_name', hospital.name)
                hospital.doctor_name = data.get('doctor_name', hospital.doctor_name)
                hospital.save()

        # Return updated user data
        response_data = UserSerializer(user).data
        ec = user.emergency_contacts.filter(is_primary=True).first()
        if ec:
            response_data['emergency_contact_name'] = ec.name
            response_data['emergency_contact_phone'] = ec.phone
            response_data['emergency_contact_relationship'] = ec.relationship

        hospital = getattr(user, 'preferred_hospital', None)
        if hospital:
            response_data['hospital_name'] = hospital.name
            response_data['doctor_name'] = hospital.doctor_name

        return Response({
            'success': True,
            'data': response_data
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def complete_onboarding(request):
    serializer = OnboardingSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.validated_data
        user = request.user

        # Update user fields
        user.due_date = data['due_date']
        user.date_of_birth = data.get('date_of_birth')
        user.blood_type = data.get('blood_type', '')
        user.genotype = data.get('genotype', '')
        user.is_first_pregnancy = data.get('is_first_pregnancy', True)
        user.previous_pregnancies = data.get('previous_pregnancies', 0)
        user.health_conditions = data.get('health_conditions', [])
        user.allergies = data.get('allergies', '')
        user.onboarding_complete = True

        # Set starting week/day based on pregnancy
        current_week = user.get_current_week()
        user.current_program_week = current_week or 1
        user.current_program_day = 1

        user.save()

        # Create emergency contact if provided
        if data.get('emergency_contact_name') and data.get('emergency_contact_phone'):
            EmergencyContact.objects.create(
                user=user,
                name=data['emergency_contact_name'],
                phone=data['emergency_contact_phone'],
                relationship=data.get('emergency_contact_relationship', ''),
                is_primary=True
            )

        # Create preferred hospital if provided
        if data.get('hospital_name'):
            PreferredHospital.objects.create(
                user=user,
                name=data['hospital_name'],
                doctor_name=data.get('doctor_name', '')
            )

        # Award onboarding tokens
        from apps.tokens.services import TokenService
        TokenService.award_tokens(
            user=user,
            amount=50,
            source='onboarding',
            description='Completed health profile'
        )

        return Response({
            'success': True,
            'data': UserSerializer(user).data
        })

    return Response({
        'success': False,
        'message': 'Invalid data',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    """Get admin dashboard statistics"""
    if not request.user.is_admin:
        return Response({
            'success': False,
            'message': 'Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    from apps.withdrawals.models import WithdrawalRequest
    from apps.tokens.models import TokenTransaction
    from apps.daily_program.models import UserDayProgress
    from django.utils import timezone

    total_users = User.objects.filter(is_admin=False).count()
    active_users = User.objects.filter(
        is_admin=False,
        onboarding_complete=True
    ).count()

    # Active today
    today = timezone.now().date()
    active_today = UserDayProgress.objects.filter(
        started_at__date=today
    ).values('user').distinct().count()

    pending_withdrawals = WithdrawalRequest.objects.filter(
        status='pending'
    ).count()

    total_tokens_minted = TokenTransaction.objects.filter(
        transaction_type='earn'
    ).aggregate(total=Sum('amount'))['total'] or 0

    total_withdrawals = WithdrawalRequest.objects.filter(
        status='completed'
    ).aggregate(total=Sum('naira_amount'))['total'] or 0

    lessons_completed = UserDayProgress.objects.filter(
        lesson_completed=True
    ).count()

    # Recent users
    recent_users = User.objects.filter(is_admin=False).order_by('-created_at')[:5]
    recent_users_data = []
    for u in recent_users:
        days_ago = (timezone.now() - u.created_at).days
        joined_ago = f"{days_ago} days ago" if days_ago > 0 else "Today"
        recent_users_data.append({
            'id': str(u.id),
            'name': f"{u.first_name} {u.last_name}".strip() or u.email,
            'email': u.email,
            'joined_ago': joined_ago,
        })

    # Recent withdrawals
    recent_withdrawals = WithdrawalRequest.objects.order_by('-created_at')[:5]
    recent_withdrawals_data = []
    for w in recent_withdrawals:
        recent_withdrawals_data.append({
            'id': str(w.id),
            'user_name': f"{w.user.first_name} {w.user.last_name}".strip() or w.user.email,
            'amount': w.tokens_amount,
            'status': w.status,
        })

    return Response({
        'success': True,
        'data': {
            'total_users': total_users,
            'active_users': active_users,
            'active_today': active_today,
            'pending_withdrawals': pending_withdrawals,
            'total_tokens_minted': total_tokens_minted,
            'total_withdrawals_naira': float(total_withdrawals) if total_withdrawals else 0,
            'lessons_completed': lessons_completed,
            'recent_users': recent_users_data,
            'recent_withdrawals': recent_withdrawals_data,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users(request):
    """List all users (admin only)"""
    if not request.user.is_admin:
        return Response({
            'success': False,
            'message': 'Admin access required'
        }, status=status.HTTP_403_FORBIDDEN)

    from apps.daily_program.models import UserDayProgress

    users = User.objects.filter(is_admin=False).order_by('-created_at')
    users_data = []

    for u in users:
        total_days = UserDayProgress.objects.filter(user=u).count()
        completed_days = UserDayProgress.objects.filter(user=u, is_completed=True).count()
        progress_pct = int((completed_days / total_days * 100)) if total_days > 0 else 0

        users_data.append({
            'id': str(u.id),
            'name': f"{u.first_name} {u.last_name}".strip() or u.email,
            'email': u.email,
            'phone': u.phone,
            'current_week': u.current_program_week,
            'progress_percentage': progress_pct,
            'token_balance': u.token_balance,
            'onboarding_complete': u.onboarding_complete,
            'created_at': u.created_at.isoformat(),
        })

    return Response({
        'success': True,
        'data': users_data
    })
