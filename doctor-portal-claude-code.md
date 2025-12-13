# Doctor Portal Implementation - Execute Now

## STEP 1: Add HealthReport Model

**File: `backend/apps/health/models.py`**

Add this model to the existing file:

```python
class HealthReport(models.Model):
    """AI-analyzed health reports from conversations - triaged for doctors"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Patient info
    user = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='health_reports')
    child = models.ForeignKey('children.Child', on_delete=models.CASCADE, related_name='health_reports')
    
    # Timing
    created_at = models.DateTimeField(auto_now_add=True)
    pregnancy_week = models.IntegerField()
    
    # Report Type
    REPORT_TYPE_CHOICES = [
        ('complaint', 'Symptom Complaint'),
        ('checkin', 'Daily Check-in'),
    ]
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    
    # AI Triage
    URGENCY_CHOICES = [
        ('critical', 'Critical'),
        ('urgent', 'Urgent'),
        ('moderate', 'Moderate'),
        ('normal', 'Normal'),
    ]
    urgency_level = models.CharField(max_length=20, choices=URGENCY_CHOICES, default='normal')
    
    # Content
    symptoms = models.JSONField(default=list)
    ai_summary = models.TextField()
    ai_assessment = models.TextField()
    ai_recommendation = models.TextField()
    
    # Conversation
    conversation_id = models.UUIDField(null=True, blank=True)
    conversation_transcript = models.TextField()
    
    # Doctor handling
    is_addressed = models.BooleanField(default=False)
    addressed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='addressed_reports'
    )
    addressed_at = models.DateTimeField(null=True, blank=True)
    doctor_notes = models.TextField(blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.first_name} - {self.urgency_level} - Week {self.pregnancy_week}"
```

---

## STEP 2: Add Doctor Fields to User Model

**File: `backend/apps/users/models.py`**

Add these fields to your existing User model:

```python
# Add to User model
USER_TYPE_CHOICES = [
    ('mother', 'Mother'),
    ('doctor', 'Doctor'),
    ('admin', 'Admin'),
]
user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='mother')

# Doctor-specific fields
medical_license = models.CharField(max_length=100, blank=True)
specialization = models.CharField(max_length=100, blank=True)
hospital_name = models.CharField(max_length=200, blank=True)
is_verified_doctor = models.BooleanField(default=False)

@property
def is_doctor(self):
    return self.user_type == 'doctor' and self.is_verified_doctor
```

---

## STEP 3: Create Health Report Serializers

**File: `backend/apps/health/serializers.py`**

Add these serializers:

```python
from rest_framework import serializers
from .models import HealthReport, DailyHealthLog

class HealthReportListSerializer(serializers.ModelSerializer):
    """Compact view for doctor dashboard list"""
    patient_name = serializers.SerializerMethodField()
    patient_phone = serializers.CharField(source='user.phone_number', default='')
    patient_location = serializers.CharField(source='user.location', default='')
    
    class Meta:
        model = HealthReport
        fields = [
            'id',
            'patient_name',
            'patient_phone',
            'patient_location',
            'pregnancy_week',
            'urgency_level',
            'report_type',
            'symptoms',
            'ai_summary',
            'created_at',
            'is_addressed',
        ]
    
    def get_patient_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"


class HealthReportDetailSerializer(serializers.ModelSerializer):
    """Full details for single report view"""
    patient_name = serializers.SerializerMethodField()
    patient_phone = serializers.CharField(source='user.phone_number', default='')
    patient_location = serializers.CharField(source='user.location', default='')
    patient_email = serializers.CharField(source='user.email', default='')
    
    class Meta:
        model = HealthReport
        fields = '__all__'
    
    def get_patient_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"
```

---

## STEP 4: Create Doctor Views

**File: `backend/apps/health/views.py`**

Add these views:

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Count, Case, When, IntegerField
from .models import HealthReport, DailyHealthLog
from .serializers import HealthReportListSerializer, HealthReportDetailSerializer
from apps.passport.models import PassportEvent


class IsDoctorPermission(BasePermission):
    """Only allow verified doctors"""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            hasattr(request.user, 'is_doctor') and 
            request.user.is_doctor
        )


@api_view(['GET'])
@permission_classes([IsDoctorPermission])
def doctor_dashboard_stats(request):
    """Get counts of reports by urgency level"""
    stats = HealthReport.objects.filter(
        is_addressed=False
    ).values('urgency_level').annotate(count=Count('id'))
    
    result = {'critical': 0, 'urgent': 0, 'moderate': 0, 'normal': 0}
    for item in stats:
        result[item['urgency_level']] = item['count']
    
    return Response(result)


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
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsDoctorPermission])
def doctor_report_detail(request, report_id):
    """Get full details of a single health report"""
    report = get_object_or_404(HealthReport, id=report_id)
    user = report.user
    child = report.child
    
    # Get recent passport events for this child
    recent_events = []
    try:
        events = PassportEvent.objects.filter(child=child).order_by('-created_at')[:20]
        recent_events = [
            {
                'id': str(e.id),
                'event_type': e.event_type,
                'title': e.title,
                'created_at': e.created_at,
                'data': e.data
            }
            for e in events
        ]
    except:
        pass
    
    # Get recent health logs
    recent_health = []
    try:
        logs = DailyHealthLog.objects.filter(user=user).order_by('-date')[:7]
        recent_health = [
            {
                'date': log.date,
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
                'phone': contact.phone_number
            }
    except:
        pass
    
    return Response({
        'report': HealthReportDetailSerializer(report).data,
        'patient': {
            'id': str(user.id),
            'name': f"{user.first_name} {user.last_name}",
            'phone': getattr(user, 'phone_number', ''),
            'email': user.email,
            'location': getattr(user, 'location', ''),
            'emergency_contact': emergency_contact,
        },
        'pregnancy': {
            'current_week': child.current_pregnancy_week if hasattr(child, 'current_pregnancy_week') else report.pregnancy_week,
            'due_date': str(child.due_date) if hasattr(child, 'due_date') else None,
        },
        'conversation_transcript': report.conversation_transcript,
        'recent_history': recent_events,
        'recent_health_logs': recent_health,
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


# Doctor signup endpoint
@api_view(['POST'])
def doctor_signup(request):
    """Register a new doctor account"""
    from apps.users.serializers import UserSerializer
    
    data = request.data.copy()
    data['user_type'] = 'doctor'
    
    serializer = UserSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()
        user.user_type = 'doctor'
        user.medical_license = data.get('medical_license', '')
        user.specialization = data.get('specialization', '')
        user.hospital_name = data.get('hospital_name', '')
        user.is_verified_doctor = False  # Needs admin approval
        user.save()
        
        return Response({
            'success': True,
            'message': 'Doctor account created. Pending verification.',
            'user_id': str(user.id)
        }, status=201)
    
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_doctor(request, user_id):
    """Admin verifies a doctor account"""
    if not request.user.is_staff:
        return Response({'error': 'Admin only'}, status=403)
    
    from apps.users.models import User
    user = get_object_or_404(User, id=user_id, user_type='doctor')
    user.is_verified_doctor = True
    user.save()
    
    return Response({
        'success': True,
        'message': f'Doctor {user.first_name} {user.last_name} verified'
    })
```

---

## STEP 5: Add Doctor URLs

**File: `backend/apps/health/urls.py`**

Update or create this file:

```python
from django.urls import path
from . import views

urlpatterns = [
    # Existing health routes...
    
    # Doctor portal routes
    path('doctor/stats/', views.doctor_dashboard_stats, name='doctor_stats'),
    path('doctor/reports/', views.doctor_reports_list, name='doctor_reports'),
    path('doctor/reports/<uuid:report_id>/', views.doctor_report_detail, name='doctor_report_detail'),
    path('doctor/reports/<uuid:report_id>/address/', views.address_report, name='address_report'),
    path('doctor/signup/', views.doctor_signup, name='doctor_signup'),
    path('doctor/verify/<uuid:user_id>/', views.verify_doctor, name='verify_doctor'),
]
```

Make sure to include in main urls.py:
```python
path('api/health/', include('apps.health.urls')),
```

---

## STEP 6: Create Health Report from AI Conversation

**File: `backend/apps/ai/services.py`**

Add this function to create reports after AI conversations:

```python
import json
import re
from apps.health.models import HealthReport
from apps.passport.models import PassportEvent


def create_health_report_from_ai(user, child, conversation_type, full_transcript, ai_final_response):
    """
    Called after health conversation ends.
    Parses AI response for triage data and creates HealthReport.
    """
    
    # Try to extract JSON from AI response
    analysis = extract_ai_analysis(ai_final_response)
    
    # Create the health report
    report = HealthReport.objects.create(
        user=user,
        child=child,
        pregnancy_week=getattr(child, 'current_pregnancy_week', 20),
        report_type='complaint' if conversation_type == 'health_complaint' else 'checkin',
        urgency_level=analysis.get('urgency_level', 'normal'),
        symptoms=analysis.get('symptoms', []),
        ai_summary=analysis.get('ai_summary', 'Health conversation completed'),
        ai_assessment=analysis.get('ai_assessment', ''),
        ai_recommendation=analysis.get('ai_recommendation', ''),
        conversation_transcript=full_transcript,
    )
    
    # Log to Life Passport
    try:
        PassportEvent.objects.create(
            child=child,
            event_type='health_report',
            title=f"Health Report: {analysis.get('ai_summary', 'Check-in')}",
            data={
                'report_id': str(report.id),
                'urgency': report.urgency_level,
                'symptoms': report.symptoms,
            }
        )
    except Exception as e:
        print(f"Failed to log passport event: {e}")
    
    return report


def extract_ai_analysis(ai_response):
    """Extract JSON analysis from AI response"""
    
    # Default values
    default = {
        'urgency_level': 'normal',
        'symptoms': [],
        'ai_summary': 'Health check-in completed',
        'ai_assessment': '',
        'ai_recommendation': '',
    }
    
    # Try to find JSON in response
    # Pattern 1: ```json ... ```
    json_match = re.search(r'```json\s*(.*?)\s*```', ai_response, re.DOTALL)
    
    if json_match:
        try:
            return {**default, **json.loads(json_match.group(1))}
        except json.JSONDecodeError:
            pass
    
    # Pattern 2: Raw JSON object
    json_match = re.search(r'\{[^{}]*"urgency_level"[^{}]*\}', ai_response, re.DOTALL)
    
    if json_match:
        try:
            return {**default, **json.loads(json_match.group(0))}
        except json.JSONDecodeError:
            pass
    
    # Pattern 3: Look for urgency keywords in response
    response_lower = ai_response.lower()
    
    if any(word in response_lower for word in ['critical', 'emergency', 'immediately', 'hospital now', 'preeclampsia']):
        default['urgency_level'] = 'critical'
        default['ai_summary'] = 'Urgent symptoms reported - immediate attention needed'
    elif any(word in response_lower for word in ['urgent', 'see doctor', 'within 24', 'concerning']):
        default['urgency_level'] = 'urgent'
        default['ai_summary'] = 'Concerning symptoms - doctor visit recommended'
    elif any(word in response_lower for word in ['monitor', 'watch', 'follow up', 'persist']):
        default['urgency_level'] = 'moderate'
        default['ai_summary'] = 'Symptoms to monitor'
    
    return default
```

---

## STEP 7: Update AI Conversation Handler

**File: `backend/apps/ai/views.py`**

In your existing conversation endpoint, add this after the AI responds:

```python
from .services import create_health_report_from_ai

# Inside your conversation view, after getting AI response:

# Check if this is a health conversation that needs a report
if conversation_type in ['health_complaint', 'health_checkin', 'checkin']:
    # Build full transcript
    full_transcript = "\n\n".join([
        f"{'Patient' if msg['role'] == 'user' else 'Iyabot'}: {msg['content']}"
        for msg in conversation_messages
    ])
    
    # Create health report for doctor dashboard
    report = create_health_report_from_ai(
        user=request.user,
        child=child,  # Get from request or context
        conversation_type=conversation_type,
        full_transcript=full_transcript,
        ai_final_response=ai_response_text
    )
    
    # Include report ID in response
    response_data['health_report_id'] = str(report.id)
    response_data['urgency_level'] = report.urgency_level
```

---

## STEP 8: Update AI System Prompt for Triage

Add this to your AI prompts when conversation type is health-related:

```python
HEALTH_TRIAGE_INSTRUCTIONS = """
IMPORTANT: At the end of this conversation, you MUST output a JSON analysis block.

URGENCY CLASSIFICATION:
🔴 CRITICAL (needs immediate care):
- Severe headache + vision changes + swelling (preeclampsia signs)
- Heavy bleeding
- Severe abdominal pain
- No fetal movement after week 24
- Water breaking before week 37
- High fever (38°C+)

🟠 URGENT (see doctor in 24-48 hours):
- Persistent vomiting, can't keep fluids down
- Painful urination
- Unusual discharge
- Decreased fetal movement
- Significant swelling

🟡 MODERATE (monitor):
- Symptoms persisting 3+ days
- New unusual symptoms
- Mental health concerns

🟢 NORMAL (routine):
- Expected symptoms for current week
- Mild discomfort

OUTPUT THIS JSON AT THE END:
```json
{
    "urgency_level": "critical|urgent|moderate|normal",
    "symptoms": ["symptom1", "symptom2"],
    "ai_summary": "One sentence for doctor dashboard",
    "ai_assessment": "Your clinical reasoning in 2-3 sentences",
    "ai_recommendation": "What you told patient to do"
}
```
"""
```

---

## STEP 9: Run Migrations

```bash
python manage.py makemigrations health
python manage.py makemigrations users
python manage.py migrate
```

---

## STEP 10: Test the Flow

```bash
# Create a test doctor
python manage.py shell

>>> from apps.users.models import User
>>> doctor = User.objects.create_user(
...     email='doctor@test.com',
...     password='testpass123',
...     first_name='Dr. Test',
...     last_name='Doctor',
...     user_type='doctor',
...     is_verified_doctor=True
... )
>>> print(f"Doctor created: {doctor.id}")

# Create a test health report
>>> from apps.health.models import HealthReport
>>> from apps.users.models import User
>>> from apps.children.models import Child

>>> mother = User.objects.filter(user_type='mother').first()
>>> child = Child.objects.first()

>>> report = HealthReport.objects.create(
...     user=mother,
...     child=child,
...     pregnancy_week=28,
...     report_type='complaint',
...     urgency_level='critical',
...     symptoms=['severe headache', 'blurry vision', 'hand swelling'],
...     ai_summary='Severe headache with vision changes - possible preeclampsia',
...     ai_assessment='Patient reports concerning combination of symptoms',
...     ai_recommendation='Advised immediate medical care',
...     conversation_transcript='Test conversation...'
... )
>>> print(f"Report created: {report.id}")
```

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health/doctor/stats/` | Get counts by urgency |
| GET | `/api/health/doctor/reports/` | List all reports |
| GET | `/api/health/doctor/reports/?urgency=critical` | Filter by urgency |
| GET | `/api/health/doctor/reports/<id>/` | Get full report details |
| POST | `/api/health/doctor/reports/<id>/address/` | Mark as addressed |
| POST | `/api/health/doctor/signup/` | Doctor registration |
| POST | `/api/health/doctor/verify/<user_id>/` | Admin verifies doctor |
