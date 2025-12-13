from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Count, Case, When, IntegerField
from apps.children.models import Child
from .models import DailyHealthLog, KickCount, Appointment, HealthReport
from .serializers import (
    DailyHealthLogSerializer, KickCountSerializer, AppointmentSerializer,
    HealthReportListSerializer, HealthReportDetailSerializer
)


class IsDoctorPermission(BasePermission):
    """Only allow verified doctors"""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, 'is_doctor') and
            request.user.is_doctor
        )


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def health_logs(request, child_id=None):
    """List health logs or create new one"""
    if request.method == 'GET':
        if child_id:
            child = get_object_or_404(Child, id=child_id, user=request.user)
            logs = DailyHealthLog.objects.filter(child=child)[:30]
        else:
            logs = DailyHealthLog.objects.filter(child__user=request.user)[:30]
        return Response({
            'success': True,
            'data': DailyHealthLogSerializer(logs, many=True).data
        })

    if request.method == 'POST':
        child_id = request.data.get('child_id')
        if child_id:
            child = get_object_or_404(Child, id=child_id, user=request.user)
        else:
            child = request.user.children.first()
            if not child:
                return Response({
                    'success': False,
                    'message': 'No child found for this user'
                }, status=status.HTTP_400_BAD_REQUEST)

        # Default to today's date if not provided
        data = request.data.copy()
        if 'date' not in data or not data['date']:
            data['date'] = timezone.now().date()

        # Check if a log already exists for this date
        existing_log = DailyHealthLog.objects.filter(
            child=child,
            date=data['date']
        ).first()

        if existing_log:
            # Update existing log instead of creating new one
            serializer = DailyHealthLogSerializer(existing_log, data=data, partial=True)
        else:
            serializer = DailyHealthLogSerializer(data=data)

        if serializer.is_valid():
            serializer.save(child=child)
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def health_log_detail(request, log_id):
    """Get specific health log"""
    try:
        log = DailyHealthLog.objects.get(id=log_id, child__user=request.user)
    except DailyHealthLog.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Health log not found'
        }, status=status.HTTP_404_NOT_FOUND)

    return Response({
        'success': True,
        'data': DailyHealthLogSerializer(log).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def today_log(request, child_id=None):
    """Get today's health log"""
    today = timezone.now().date()
    if child_id:
        child = get_object_or_404(Child, id=child_id, user=request.user)
        log = DailyHealthLog.objects.filter(child=child, date=today).first()
    else:
        log = DailyHealthLog.objects.filter(child__user=request.user, date=today).first()

    return Response({
        'success': True,
        'data': DailyHealthLogSerializer(log).data if log else None
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def kick_counts(request, child_id=None):
    """List kick count sessions or start new one"""
    if request.method == 'GET':
        if child_id:
            child = get_object_or_404(Child, id=child_id, user=request.user)
            counts = KickCount.objects.filter(child=child)[:30]
        else:
            counts = KickCount.objects.filter(child__user=request.user)[:30]
        return Response({
            'success': True,
            'data': KickCountSerializer(counts, many=True).data
        })

    if request.method == 'POST':
        child_id = request.data.get('child_id')
        if child_id:
            child = get_object_or_404(Child, id=child_id, user=request.user)
        else:
            child = request.user.children.filter(status='pregnant').first()
            if not child:
                return Response({
                    'success': False,
                    'message': 'No active pregnancy found'
                }, status=status.HTTP_400_BAD_REQUEST)

        data = request.data.copy()
        if 'start_time' not in data:
            data['start_time'] = timezone.now()

        serializer = KickCountSerializer(data=data)
        if serializer.is_valid():
            serializer.save(child=child)
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH', 'POST'])
@permission_classes([IsAuthenticated])
def update_kick_count(request, kick_id):
    """Update kick count session (add kick or end session)"""
    try:
        kick = KickCount.objects.get(id=kick_id, child__user=request.user)
    except KickCount.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Kick count session not found'
        }, status=status.HTTP_404_NOT_FOUND)

    # Handle single kick registration
    if request.method == 'POST':
        kick.kick_count += 1
        kick.save()
        return Response({
            'success': True,
            'data': KickCountSerializer(kick).data
        })

    # Handle full update
    serializer = KickCountSerializer(kick, data=request.data, partial=True)
    if serializer.is_valid():
        # If ending session, calculate duration
        if 'end_time' in request.data and not kick.end_time:
            end_time = serializer.validated_data.get('end_time')
            if end_time:
                duration = (end_time - kick.start_time).total_seconds() / 60
                serializer.validated_data['duration_minutes'] = int(duration)
        serializer.save()
        return Response({
            'success': True,
            'data': serializer.data
        })
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def appointments(request, child_id=None):
    """List appointments or create new one"""
    if request.method == 'GET':
        upcoming = request.query_params.get('upcoming', 'false').lower() == 'true'
        if child_id:
            child = get_object_or_404(Child, id=child_id, user=request.user)
            appts = Appointment.objects.filter(child=child)
        else:
            appts = Appointment.objects.filter(child__user=request.user)

        if upcoming:
            appts = appts.filter(date__gte=timezone.now().date(), is_completed=False)

        return Response({
            'success': True,
            'data': AppointmentSerializer(appts[:20], many=True).data
        })

    if request.method == 'POST':
        child_id = request.data.get('child_id')
        if child_id:
            child = get_object_or_404(Child, id=child_id, user=request.user)
        else:
            child = request.user.children.first()
            if not child:
                return Response({
                    'success': False,
                    'message': 'No child found for this user'
                }, status=status.HTTP_400_BAD_REQUEST)

        serializer = AppointmentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(child=child)
            return Response({
                'success': True,
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def appointment_detail(request, appointment_id):
    """Update or delete appointment"""
    try:
        appt = Appointment.objects.get(id=appointment_id, child__user=request.user)
    except Appointment.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Appointment not found'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'DELETE':
        appt.delete()
        return Response({
            'success': True,
            'message': 'Appointment deleted'
        })

    serializer = AppointmentSerializer(appt, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({
            'success': True,
            'data': serializer.data
        })
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


# ============ DOCTOR PORTAL VIEWS ============

@api_view(['GET'])
@permission_classes([IsDoctorPermission])
def doctor_dashboard_stats(request):
    """Get counts of reports by urgency level"""
    stats = HealthReport.objects.filter(
        is_addressed=False
    ).values('urgency_level').annotate(count=Count('id'))

    result = {'critical': 0, 'urgent': 0, 'moderate': 0, 'normal': 0, 'total': 0}
    for item in stats:
        result[item['urgency_level']] = item['count']
        result['total'] += item['count']

    return Response({
        'success': True,
        'data': result
    })


@api_view(['GET'])
@permission_classes([IsDoctorPermission])
def doctor_reports_list(request):
    """List health reports for doctors, filtered by urgency"""
    urgency = request.query_params.get('urgency', None)
    show_addressed = request.query_params.get('addressed', 'false').lower() == 'true'

    reports = HealthReport.objects.select_related('user', 'child')

    if not show_addressed:
        reports = reports.filter(is_addressed=False)

    if urgency and urgency != 'all':
        reports = reports.filter(urgency_level=urgency)

    # Order by urgency (critical first) then by date
    reports = reports.annotate(
        urgency_order=Case(
            When(urgency_level='critical', then=0),
            When(urgency_level='urgent', then=1),
            When(urgency_level='moderate', then=2),
            When(urgency_level='normal', then=3),
            output_field=IntegerField(),
        )
    ).order_by('urgency_order', '-created_at')[:50]

    serializer = HealthReportListSerializer(reports, many=True)
    return Response({
        'success': True,
        'data': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsDoctorPermission])
def doctor_report_detail(request, report_id):
    """Get full details of a single health report"""
    report = get_object_or_404(HealthReport, id=report_id)
    user = report.user
    child = report.child

    # Get recent health logs
    recent_health = []
    try:
        logs = DailyHealthLog.objects.filter(child=child).order_by('-date')[:7]
        recent_health = [
            {
                'date': str(log.date),
                'mood': log.mood,
                'symptoms': log.symptoms,
                'notes': log.notes
            }
            for log in logs
        ]
    except:
        pass

    # Get emergency contact
    emergency_contact = None
    try:
        contact = user.emergency_contacts.first()
        if contact:
            emergency_contact = {
                'name': contact.name,
                'relationship': contact.relationship,
                'phone': contact.phone
            }
    except:
        pass

    # Get pregnancy info
    pregnancy_week = report.pregnancy_week
    due_date = None
    if hasattr(child, 'due_date') and child.due_date:
        due_date = str(child.due_date)
    if hasattr(child, 'get_pregnancy_week'):
        pregnancy_week = child.get_pregnancy_week() or report.pregnancy_week

    return Response({
        'success': True,
        'data': {
            'report': HealthReportDetailSerializer(report).data,
            'patient': {
                'id': str(user.id),
                'name': f"{user.first_name} {user.last_name}",
                'phone': getattr(user, 'phone', ''),
                'email': user.email,
                'location': getattr(user, 'location', ''),
                'emergency_contact': emergency_contact,
            },
            'pregnancy': {
                'current_week': pregnancy_week,
                'due_date': due_date,
            },
            'conversation_transcript': report.conversation_transcript,
            'recent_health_logs': recent_health,
        }
    })


@api_view(['POST'])
@permission_classes([IsDoctorPermission])
def address_report(request, report_id):
    """Mark a report as addressed by doctor"""
    report = get_object_or_404(HealthReport, id=report_id)

    report.is_addressed = True
    report.addressed_by = request.user
    report.addressed_at = timezone.now()
    report.doctor_notes = request.data.get('notes', '')
    report.save()

    # Log to passport
    try:
        from apps.passport.models import PassportEvent
        PassportEvent.objects.create(
            child=report.child,
            event_type='doctor_review',
            title=f'Report reviewed by Dr. {request.user.last_name}',
            data={
                'report_id': str(report.id),
                'doctor_id': str(request.user.id),
                'notes': report.doctor_notes
            }
        )
    except:
        pass

    return Response({
        'success': True,
        'message': 'Report marked as addressed'
    })


@api_view(['POST'])
def doctor_signup(request):
    """Register a new doctor account"""
    from apps.users.models import User
    from django.contrib.auth.hashers import make_password

    data = request.data

    # Check if email exists
    if User.objects.filter(email=data.get('email')).exists():
        return Response({
            'success': False,
            'error': 'Email already registered'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.create(
            email=data.get('email'),
            username=data.get('email'),
            password=make_password(data.get('password')),
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            phone=data.get('phone', ''),
            user_type='doctor',
            medical_license=data.get('medical_license', ''),
            specialization=data.get('specialization', ''),
            hospital_name=data.get('hospital_name', ''),
            is_verified_doctor=False,  # Needs admin approval
        )

        return Response({
            'success': True,
            'message': 'Doctor account created. Pending verification.',
            'user_id': str(user.id)
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_doctor(request, user_id):
    """Admin verifies a doctor account"""
    if not request.user.is_staff and not request.user.is_admin:
        return Response({
            'success': False,
            'error': 'Admin only'
        }, status=status.HTTP_403_FORBIDDEN)

    from apps.users.models import User
    user = get_object_or_404(User, id=user_id, user_type='doctor')
    user.is_verified_doctor = True
    user.save()

    return Response({
        'success': True,
        'message': f'Doctor {user.first_name} {user.last_name} verified'
    })
