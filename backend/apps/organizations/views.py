from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q

from .models import (
    Organization,
    OrganizationMember,
    StaffInvitation,
    PatientInvitation,
    OrganizationPatient
)
from .serializers import (
    OrganizationSerializer,
    OrganizationMemberSerializer,
    StaffInvitationSerializer,
    StaffInviteCreateSerializer,
    PatientInvitationSerializer,
    PatientInviteCreateSerializer,
    OrganizationPatientSerializer,
    PatientDetailSerializer,
    OrganizationSignupSerializer,
    JoinOrganizationSerializer,
    OrganizationStatsSerializer,
)
from .permissions import (
    IsOrganizationMember,
    IsOrganizationAdmin,
    get_user_organization,
    get_user_organization_membership
)

User = get_user_model()


# ============ Organization Management ============

@api_view(['POST'])
@permission_classes([AllowAny])
def organization_signup(request):
    """Register a new organization with admin user"""
    serializer = OrganizationSignupSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    # Create the organization
    organization = Organization.objects.create(
        name=data['organization_name'],
        organization_type=data['organization_type'],
        email=data['email'],  # Use admin email as org email
        phone=data['organization_phone'],
        address=data.get('organization_address', ''),
        license_number=data.get('license_number', ''),
        is_verified=False  # Requires admin approval
    )

    # Create the admin user
    # Generate username from email (before @)
    username = data['email'].split('@')[0]
    # Ensure username is unique
    base_username = username
    counter = 1
    while User.objects.filter(username=username).exists():
        username = f"{base_username}{counter}"
        counter += 1

    user = User.objects.create_user(
        username=username,
        email=data['email'],
        password=data['password'],
        first_name=data['first_name'],
        last_name=data['last_name'],
        phone=data['phone'],
        user_type='organization'
    )

    # Link user to organization as primary admin
    OrganizationMember.objects.create(
        organization=organization,
        user=user,
        role='admin',
        is_primary_admin=True
    )

    return Response({
        'success': True,
        'message': 'Organization registered successfully. Pending verification.',
        'data': {
            'organization': OrganizationSerializer(organization).data
        }
    }, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated, IsOrganizationMember])
def organization_me(request):
    """Get or update current organization details"""
    organization = get_user_organization(request.user)

    if not organization:
        return Response({
            'success': False,
            'message': 'You are not part of any organization'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        membership = get_user_organization_membership(request.user)
        return Response({
            'success': True,
            'data': {
                'organization': OrganizationSerializer(organization).data,
                'membership': OrganizationMemberSerializer(membership).data
            }
        })

    elif request.method == 'PATCH':
        # Only admins can update
        membership = get_user_organization_membership(request.user)
        if membership.role != 'admin':
            return Response({
                'success': False,
                'message': 'Only admins can update organization details'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = OrganizationSerializer(
            organization,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'data': {'organization': serializer.data}
            })
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOrganizationMember])
def organization_stats(request):
    """Get dashboard statistics"""
    organization = get_user_organization(request.user)

    if not organization:
        return Response({
            'success': False,
            'message': 'You are not part of any organization'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get patient IDs
    patient_connections = OrganizationPatient.objects.filter(
        organization=organization,
        is_active=True
    )

    # Get all children IDs from connected patients
    child_ids = []
    for connection in patient_connections:
        child_ids.extend(connection.children.values_list('id', flat=True))

    # Count reports by urgency
    from apps.health.models import HealthReport
    reports = HealthReport.objects.filter(
        child_id__in=child_ids,
        is_addressed=False
    )

    critical = reports.filter(urgency_level='critical').count()
    urgent = reports.filter(urgency_level='urgent').count()
    moderate = reports.filter(urgency_level='moderate').count()

    pending_invitations = PatientInvitation.objects.filter(
        organization=organization,
        status='pending'
    ).count()

    return Response({
        'success': True,
        'data': {
            'total_patients': patient_connections.count(),
            'pending_invitations': pending_invitations,
            'critical_reports': critical,
            'urgent_reports': urgent,
            'moderate_reports': moderate,
            'total_unaddressed': critical + urgent + moderate
        }
    })


# ============ Staff Management ============

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOrganizationMember])
def staff_list(request):
    """List organization staff members"""
    organization = get_user_organization(request.user)

    members = OrganizationMember.objects.filter(organization=organization)
    serializer = OrganizationMemberSerializer(members, many=True)

    return Response({
        'success': True,
        'data': {'staff': serializer.data}
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOrganizationAdmin])
def staff_invite(request):
    """Invite a staff member to join the organization"""
    serializer = StaffInviteCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    organization = get_user_organization(request.user)
    data = serializer.validated_data

    # Check if already invited
    existing = StaffInvitation.objects.filter(
        organization=organization,
        email=data['email'],
        status='pending'
    ).first()

    if existing:
        return Response({
            'success': False,
            'message': 'An invitation has already been sent to this email'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check if already a member
    if OrganizationMember.objects.filter(
        organization=organization,
        user__email=data['email']
    ).exists():
        return Response({
            'success': False,
            'message': 'This person is already a member of your organization'
        }, status=status.HTTP_400_BAD_REQUEST)

    invitation = StaffInvitation.objects.create(
        organization=organization,
        email=data['email'],
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
        role=data['role'],
        invited_by=request.user
    )

    return Response({
        'success': True,
        'message': 'Invitation sent successfully',
        'data': {'invitation': StaffInvitationSerializer(invitation).data}
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOrganizationMember])
def staff_invitations(request):
    """List pending staff invitations"""
    organization = get_user_organization(request.user)

    invitations = StaffInvitation.objects.filter(
        organization=organization,
        status='pending'
    )
    serializer = StaffInvitationSerializer(invitations, many=True)

    return Response({
        'success': True,
        'data': {'invitations': serializer.data}
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOrganizationAdmin])
def staff_remove(request, member_id):
    """Remove a staff member from the organization"""
    organization = get_user_organization(request.user)

    try:
        member = OrganizationMember.objects.get(
            id=member_id,
            organization=organization
        )
    except OrganizationMember.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Staff member not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Cannot remove primary admin
    if member.is_primary_admin:
        return Response({
            'success': False,
            'message': 'Cannot remove the primary administrator'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Cannot remove yourself
    if member.user == request.user:
        return Response({
            'success': False,
            'message': 'Cannot remove yourself'
        }, status=status.HTTP_400_BAD_REQUEST)

    member.delete()

    return Response({
        'success': True,
        'message': 'Staff member removed successfully'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def staff_join(request):
    """Join an organization using an invite code"""
    serializer = JoinOrganizationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    data = serializer.validated_data

    # Find the invitation
    try:
        invitation = StaffInvitation.objects.get(
            invite_code=data['invite_code'].upper(),
            status='pending'
        )
    except StaffInvitation.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Invalid or expired invitation code'
        }, status=status.HTTP_404_NOT_FOUND)

    if invitation.is_expired:
        invitation.status = 'expired'
        invitation.save()
        return Response({
            'success': False,
            'message': 'This invitation has expired'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check if user already exists
    existing_user = User.objects.filter(email=invitation.email).first()

    if existing_user:
        # User exists - just add to organization
        user = existing_user
    else:
        # Create new user - generate username from email
        username = invitation.email.split('@')[0]
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=invitation.email,
            password=data['password'],
            first_name=invitation.first_name,
            last_name=invitation.last_name,
            user_type='organization'
        )

    # Add to organization
    OrganizationMember.objects.create(
        organization=invitation.organization,
        user=user,
        role=invitation.role
    )

    # Update invitation
    invitation.status = 'accepted'
    invitation.responded_at = timezone.now()
    invitation.save()

    return Response({
        'success': True,
        'message': 'Successfully joined the organization',
        'data': {
            'organization': OrganizationSerializer(invitation.organization).data
        }
    })


# ============ Patient Management ============

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOrganizationMember])
def patients_list(request):
    """List connected patients"""
    organization = get_user_organization(request.user)

    # Get filter params
    search = request.query_params.get('search', '')
    urgency = request.query_params.get('urgency', None)

    patients = OrganizationPatient.objects.filter(
        organization=organization,
        is_active=True
    ).select_related('patient')

    if search:
        patients = patients.filter(
            Q(patient__first_name__icontains=search) |
            Q(patient__last_name__icontains=search) |
            Q(patient__email__icontains=search) |
            Q(patient__phone__icontains=search)
        )

    serializer = OrganizationPatientSerializer(patients, many=True)
    data = serializer.data

    # Filter by urgency if specified
    if urgency:
        data = [p for p in data if p.get('highest_urgency') == urgency]

    return Response({
        'success': True,
        'data': {'patients': data}
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsOrganizationMember])
def patients_invite(request):
    """Invite a mother to connect with the organization"""
    serializer = PatientInviteCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

    organization = get_user_organization(request.user)
    data = serializer.validated_data

    # Find the user by email
    try:
        patient = User.objects.get(
            email=data['email'],
            user_type='mother'
        )
    except User.DoesNotExist:
        return Response({
            'success': False,
            'message': 'No mother account found with this email. They must sign up first.'
        }, status=status.HTTP_404_NOT_FOUND)

    # Check if already connected
    if OrganizationPatient.objects.filter(
        organization=organization,
        patient=patient,
        is_active=True
    ).exists():
        return Response({
            'success': False,
            'message': 'This patient is already connected to your organization'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Check if already invited (pending)
    existing_invite = PatientInvitation.objects.filter(
        organization=organization,
        patient=patient,
        status='pending'
    ).first()

    if existing_invite:
        return Response({
            'success': False,
            'message': 'An invitation has already been sent to this patient'
        }, status=status.HTTP_400_BAD_REQUEST)

    # Create invitation
    invitation = PatientInvitation.objects.create(
        organization=organization,
        patient=patient,
        invited_by=request.user,
        message=data.get('message', '')
    )

    return Response({
        'success': True,
        'message': 'Invitation sent successfully',
        'data': {'invitation': PatientInvitationSerializer(invitation).data}
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOrganizationMember])
def patient_invitations(request):
    """List patient invitations"""
    organization = get_user_organization(request.user)
    status_filter = request.query_params.get('status', 'pending')

    invitations = PatientInvitation.objects.filter(organization=organization)

    if status_filter and status_filter != 'all':
        invitations = invitations.filter(status=status_filter)

    serializer = PatientInvitationSerializer(invitations, many=True)

    return Response({
        'success': True,
        'data': {'invitations': serializer.data}
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOrganizationMember])
def patient_invitation_cancel(request, invitation_id):
    """Cancel a patient invitation"""
    organization = get_user_organization(request.user)

    try:
        invitation = PatientInvitation.objects.get(
            id=invitation_id,
            organization=organization,
            status='pending'
        )
    except PatientInvitation.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Invitation not found'
        }, status=status.HTTP_404_NOT_FOUND)

    invitation.delete()

    return Response({
        'success': True,
        'message': 'Invitation cancelled successfully'
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOrganizationMember])
def patient_detail(request, patient_id):
    """Get detailed patient info including passport data"""
    organization = get_user_organization(request.user)

    try:
        patient_connection = OrganizationPatient.objects.get(
            id=patient_id,
            organization=organization,
            is_active=True
        )
    except OrganizationPatient.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Patient not found'
        }, status=status.HTTP_404_NOT_FOUND)

    serializer = PatientDetailSerializer(patient_connection)

    return Response({
        'success': True,
        'data': {'patient': serializer.data}
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOrganizationMember])
def patient_reports(request, patient_id):
    """Get health reports for a patient"""
    organization = get_user_organization(request.user)

    try:
        patient_connection = OrganizationPatient.objects.get(
            id=patient_id,
            organization=organization,
            is_active=True
        )
    except OrganizationPatient.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Patient not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get reports for shared children only
    from apps.health.models import HealthReport
    from apps.health.serializers import HealthReportListSerializer

    child_ids = patient_connection.children.values_list('id', flat=True)
    urgency = request.query_params.get('urgency', None)
    addressed = request.query_params.get('addressed', 'false') == 'true'

    reports = HealthReport.objects.filter(child_id__in=child_ids)

    if not addressed:
        reports = reports.filter(is_addressed=False)

    if urgency:
        reports = reports.filter(urgency_level=urgency)

    reports = reports.order_by('-created_at')

    serializer = HealthReportListSerializer(reports, many=True)

    return Response({
        'success': True,
        'data': {'reports': serializer.data}
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOrganizationMember])
def patient_timeline(request, patient_id):
    """Get timeline events for a patient"""
    organization = get_user_organization(request.user)

    try:
        patient_connection = OrganizationPatient.objects.get(
            id=patient_id,
            organization=organization,
            is_active=True
        )
    except OrganizationPatient.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Patient not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Get events for shared children only
    from apps.passport.models import PassportEvent

    child_ids = patient_connection.children.values_list('id', flat=True)
    event_type = request.query_params.get('type', None)
    limit = int(request.query_params.get('limit', 50))

    events = PassportEvent.objects.filter(child_id__in=child_ids)

    if event_type:
        events = events.filter(event_type=event_type)

    events = events.order_by('-created_at')[:limit]

    event_data = [{
        'id': str(e.id),
        'child_id': str(e.child_id),
        'child_name': e.child.name,
        'event_type': e.event_type,
        'title': e.title,
        'description': e.description,
        'pregnancy_week': e.pregnancy_week,
        'is_concern': e.is_concern,
        'created_at': e.created_at.isoformat()
    } for e in events]

    return Response({
        'success': True,
        'data': {'events': event_data}
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsOrganizationMember])
def patient_disconnect(request, patient_id):
    """Disconnect a patient from the organization"""
    organization = get_user_organization(request.user)

    try:
        patient_connection = OrganizationPatient.objects.get(
            id=patient_id,
            organization=organization
        )
    except OrganizationPatient.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Patient not found'
        }, status=status.HTTP_404_NOT_FOUND)

    patient_connection.is_active = False
    patient_connection.save()

    return Response({
        'success': True,
        'message': 'Patient disconnected successfully'
    })


# ============ Organization Reports ============

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsOrganizationMember])
def organization_reports(request):
    """Get all health reports for organization's patients"""
    organization = get_user_organization(request.user)

    # Get all child IDs from connected patients
    patient_connections = OrganizationPatient.objects.filter(
        organization=organization,
        is_active=True
    )

    child_ids = []
    for connection in patient_connections:
        child_ids.extend(connection.children.values_list('id', flat=True))

    from apps.health.models import HealthReport
    from apps.health.serializers import HealthReportListSerializer

    urgency = request.query_params.get('urgency', None)
    addressed = request.query_params.get('addressed', 'false') == 'true'

    reports = HealthReport.objects.filter(child_id__in=child_ids)

    if not addressed:
        reports = reports.filter(is_addressed=False)

    if urgency:
        reports = reports.filter(urgency_level=urgency)

    reports = reports.select_related('user', 'child').order_by('-created_at')

    serializer = HealthReportListSerializer(reports, many=True)

    return Response({
        'success': True,
        'data': {'reports': serializer.data}
    })
