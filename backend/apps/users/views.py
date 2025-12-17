from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Sum, Count
from django.utils import timezone
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

        # Award signup bonus (don't fail signup if this errors)
        try:
            from apps.tokens.services import TokenService
            TokenService.award_tokens(
                user=user,
                amount=50,
                source='signup',
                description='Welcome to MamaAlert!'
            )
        except Exception as e:
            # Log but don't fail signup
            import logging
            logging.getLogger(__name__).error(f"Failed to award signup bonus: {e}")

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

    from apps.tokens.models import TokenTransaction, WithdrawalRequest
    from apps.daily_program.models import UserDayProgress
    from django.utils import timezone

    total_users = User.objects.filter(is_admin=False).count()
    active_users = User.objects.filter(
        is_admin=False,
        onboarding_complete=True
    ).count()

    # Active today (count unique users active today)
    today = timezone.now().date()
    active_today = UserDayProgress.objects.filter(
        started_at__date=today
    ).values('child__user').distinct().count()

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
        # Get progress across all children for this user
        total_days = UserDayProgress.objects.filter(child__user=u).count()
        completed_days = UserDayProgress.objects.filter(child__user=u, is_completed=True).count()
        progress_pct = int((completed_days / total_days * 100)) if total_days > 0 else 0

        # Get current week from first active child
        current_week = None
        first_child = u.children.filter(is_active=True).first()
        if first_child and first_child.due_date:
            from datetime import date
            days_pregnant = (first_child.due_date - date.today()).days
            weeks_remaining = days_pregnant // 7
            current_week = 40 - weeks_remaining if weeks_remaining <= 40 else 1

        users_data.append({
            'id': str(u.id),
            'name': f"{u.first_name} {u.last_name}".strip() or u.email,
            'email': u.email,
            'phone': u.phone,
            'current_week': current_week,
            'progress_percentage': progress_pct,
            'token_balance': u.token_balance,
            'onboarding_complete': u.onboarding_complete,
            'created_at': u.created_at.isoformat(),
        })

    return Response({
        'success': True,
        'data': users_data
    })


# ============ Organization Invitations (Mother-side) ============

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def org_invitations_list(request):
    """List pending organization invitations for the mother"""
    from apps.organizations.models import PatientInvitation
    from apps.organizations.serializers import PatientInvitationSerializer

    invitations = PatientInvitation.objects.filter(
        patient=request.user,
        status='pending'
    ).select_related('organization', 'invited_by')

    serializer = PatientInvitationSerializer(invitations, many=True)

    return Response({
        'success': True,
        'data': {
            'invitations': serializer.data,
            'count': invitations.count()
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def org_invitation_accept(request, invitation_id):
    """Accept an organization invitation and select children to share"""
    from apps.organizations.models import PatientInvitation, OrganizationPatient
    from apps.organizations.serializers import AcceptInvitationSerializer, OrganizationListSerializer
    from apps.children.models import Child

    try:
        invitation = PatientInvitation.objects.get(
            id=invitation_id,
            patient=request.user,
            status='pending'
        )
    except PatientInvitation.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Invitation not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Validate child_ids
    serializer = AcceptInvitationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    child_ids = serializer.validated_data['child_ids']

    # Verify all children belong to the user
    children = Child.objects.filter(
        id__in=child_ids,
        user=request.user,
        is_active=True
    )

    if children.count() != len(child_ids):
        return Response({
            'success': False,
            'message': 'One or more children not found or not yours'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Create the connection
    patient_connection = OrganizationPatient.objects.create(
        organization=invitation.organization,
        patient=request.user
    )
    patient_connection.children.set(children)

    # Update invitation status
    invitation.status = 'accepted'
    invitation.responded_at = timezone.now()
    invitation.save()

    return Response({
        'success': True,
        'message': f'Connected to {invitation.organization.name}',
        'data': {
            'organization': OrganizationListSerializer(invitation.organization).data,
            'shared_children_count': children.count()
        }
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def org_invitation_decline(request, invitation_id):
    """Decline an organization invitation"""
    from apps.organizations.models import PatientInvitation

    try:
        invitation = PatientInvitation.objects.get(
            id=invitation_id,
            patient=request.user,
            status='pending'
        )
    except PatientInvitation.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Invitation not found'
        }, status=status.HTTP_404_NOT_FOUND)

    invitation.status = 'declined'
    invitation.responded_at = timezone.now()
    invitation.save()

    return Response({
        'success': True,
        'message': 'Invitation declined'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def connected_orgs_list(request):
    """List organizations the mother is connected to"""
    from apps.organizations.models import OrganizationPatient
    from apps.organizations.serializers import OrganizationListSerializer, ChildSummarySerializer

    connections = OrganizationPatient.objects.filter(
        patient=request.user,
        is_active=True
    ).select_related('organization')

    data = []
    for conn in connections:
        data.append({
            'id': str(conn.id),
            'organization': OrganizationListSerializer(conn.organization).data,
            'shared_children': ChildSummarySerializer(conn.children.all(), many=True).data,
            'connected_at': conn.connected_at.isoformat()
        })

    return Response({
        'success': True,
        'data': {'connections': data}
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def connected_org_disconnect(request, connection_id):
    """Disconnect from an organization"""
    from apps.organizations.models import OrganizationPatient

    try:
        connection = OrganizationPatient.objects.get(
            id=connection_id,
            patient=request.user,
            is_active=True
        )
    except OrganizationPatient.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Connection not found'
        }, status=status.HTTP_404_NOT_FOUND)

    connection.is_active = False
    connection.save()

    return Response({
        'success': True,
        'message': 'Disconnected from organization'
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def connected_org_update_children(request, connection_id):
    """Update which children are shared with an organization"""
    from apps.organizations.models import OrganizationPatient
    from apps.organizations.serializers import UpdateSharedChildrenSerializer, ChildSummarySerializer
    from apps.children.models import Child

    try:
        connection = OrganizationPatient.objects.get(
            id=connection_id,
            patient=request.user,
            is_active=True
        )
    except OrganizationPatient.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Connection not found'
        }, status=status.HTTP_404_NOT_FOUND)

    serializer = UpdateSharedChildrenSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    child_ids = serializer.validated_data['child_ids']

    # Verify all children belong to the user
    children = Child.objects.filter(
        id__in=child_ids,
        user=request.user,
        is_active=True
    )

    if children.count() != len(child_ids):
        return Response({
            'success': False,
            'message': 'One or more children not found or not yours'
        }, status=status.HTTP_400_BAD_REQUEST)

    connection.children.set(children)

    return Response({
        'success': True,
        'message': 'Shared children updated',
        'data': {
            'shared_children': ChildSummarySerializer(children, many=True).data
        }
    })
