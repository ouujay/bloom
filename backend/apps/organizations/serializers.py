from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Organization,
    OrganizationMember,
    StaffInvitation,
    PatientInvitation,
    OrganizationPatient
)
from apps.children.models import Child

User = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    """Full organization details"""
    organization_type_display = serializers.CharField(
        source='get_organization_type_display',
        read_only=True
    )
    member_count = serializers.SerializerMethodField()
    patient_count = serializers.SerializerMethodField()

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'email', 'phone', 'address',
            'organization_type', 'organization_type_display',
            'license_number', 'is_verified', 'logo_url',
            'member_count', 'patient_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'is_verified', 'created_at', 'updated_at']

    def get_member_count(self, obj):
        return obj.members.count()

    def get_patient_count(self, obj):
        return obj.patients.filter(is_active=True).count()


class OrganizationListSerializer(serializers.ModelSerializer):
    """Compact organization info for lists"""
    organization_type_display = serializers.CharField(
        source='get_organization_type_display',
        read_only=True
    )

    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'organization_type', 'organization_type_display',
            'is_verified', 'logo_url'
        ]


class OrganizationMemberSerializer(serializers.ModelSerializer):
    """Staff member details"""
    user_name = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_phone = serializers.CharField(source='user.phone', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = OrganizationMember
        fields = [
            'id', 'user', 'user_name', 'user_email', 'user_phone',
            'role', 'role_display', 'is_primary_admin', 'joined_at'
        ]
        read_only_fields = ['id', 'joined_at']


class StaffInvitationSerializer(serializers.ModelSerializer):
    """Staff invitation details"""
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    invited_by_name = serializers.CharField(source='invited_by.name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)

    class Meta:
        model = StaffInvitation
        fields = [
            'id', 'organization', 'organization_name',
            'email', 'first_name', 'last_name', 'role', 'role_display',
            'invited_by', 'invited_by_name',
            'status', 'status_display', 'invite_code',
            'is_expired', 'created_at', 'expires_at', 'responded_at'
        ]
        read_only_fields = [
            'id', 'organization', 'invited_by', 'invite_code',
            'created_at', 'expires_at', 'responded_at'
        ]


class StaffInviteCreateSerializer(serializers.Serializer):
    """Create a staff invitation"""
    email = serializers.EmailField()
    first_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=StaffInvitation.ROLE_CHOICES)


class PatientInvitationSerializer(serializers.ModelSerializer):
    """Patient invitation details"""
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    organization_type = serializers.CharField(source='organization.organization_type', read_only=True)
    organization_logo = serializers.URLField(source='organization.logo_url', read_only=True)
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    patient_email = serializers.CharField(source='patient.email', read_only=True)
    patient_phone = serializers.CharField(source='patient.phone', read_only=True)
    invited_by_name = serializers.CharField(source='invited_by.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = PatientInvitation
        fields = [
            'id', 'organization', 'organization_name', 'organization_type', 'organization_logo',
            'patient', 'patient_name', 'patient_email', 'patient_phone',
            'invited_by', 'invited_by_name',
            'status', 'status_display', 'message',
            'created_at', 'responded_at'
        ]
        read_only_fields = [
            'id', 'organization', 'patient', 'invited_by',
            'created_at', 'responded_at'
        ]


class PatientInviteCreateSerializer(serializers.Serializer):
    """Create a patient invitation"""
    email = serializers.EmailField()
    message = serializers.CharField(max_length=500, required=False, allow_blank=True)


class ChildSummarySerializer(serializers.ModelSerializer):
    """Compact child info for patient detail"""
    current_stage = serializers.SerializerMethodField()

    class Meta:
        model = Child
        fields = [
            'id', 'name', 'status', 'due_date', 'birth_date',
            'current_stage', 'created_at'
        ]

    def get_current_stage(self, obj):
        return obj.get_current_stage()


class OrganizationPatientSerializer(serializers.ModelSerializer):
    """Connected patient details"""
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    patient_email = serializers.CharField(source='patient.email', read_only=True)
    patient_phone = serializers.CharField(source='patient.phone', read_only=True)
    patient_location = serializers.CharField(source='patient.location', read_only=True)
    children = ChildSummarySerializer(many=True, read_only=True)
    children_count = serializers.SerializerMethodField()
    unaddressed_reports_count = serializers.SerializerMethodField()
    highest_urgency = serializers.SerializerMethodField()

    class Meta:
        model = OrganizationPatient
        fields = [
            'id', 'patient', 'patient_name', 'patient_email', 'patient_phone',
            'patient_location', 'children', 'children_count',
            'unaddressed_reports_count', 'highest_urgency',
            'connected_at', 'is_active'
        ]
        read_only_fields = ['id', 'patient', 'connected_at']

    def get_children_count(self, obj):
        return obj.children.count()

    def get_unaddressed_reports_count(self, obj):
        from apps.health.models import HealthReport
        return HealthReport.objects.filter(
            child__in=obj.children.all(),
            is_addressed=False
        ).count()

    def get_highest_urgency(self, obj):
        from apps.health.models import HealthReport
        urgency_order = {'critical': 1, 'urgent': 2, 'moderate': 3, 'normal': 4}
        reports = HealthReport.objects.filter(
            child__in=obj.children.all(),
            is_addressed=False
        ).values_list('urgency_level', flat=True)

        if not reports:
            return None

        return min(reports, key=lambda x: urgency_order.get(x, 5))


class PatientDetailSerializer(serializers.ModelSerializer):
    """Full patient detail for organization view"""
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    patient_email = serializers.CharField(source='patient.email', read_only=True)
    patient_phone = serializers.CharField(source='patient.phone', read_only=True)
    patient_location = serializers.CharField(source='patient.location', read_only=True)
    patient_blood_type = serializers.CharField(source='patient.blood_type', read_only=True)
    patient_genotype = serializers.CharField(source='patient.genotype', read_only=True)
    patient_health_conditions = serializers.JSONField(source='patient.health_conditions', read_only=True)
    patient_allergies = serializers.CharField(source='patient.allergies', read_only=True)
    children = ChildSummarySerializer(many=True, read_only=True)
    emergency_contacts = serializers.SerializerMethodField()

    class Meta:
        model = OrganizationPatient
        fields = [
            'id', 'patient', 'patient_name', 'patient_email', 'patient_phone',
            'patient_location', 'patient_blood_type', 'patient_genotype',
            'patient_health_conditions', 'patient_allergies',
            'children', 'emergency_contacts',
            'connected_at', 'is_active'
        ]

    def get_emergency_contacts(self, obj):
        contacts = obj.patient.emergency_contacts.all()
        return [{
            'name': c.name,
            'phone': c.phone,
            'relationship': c.relationship,
            'is_primary': c.is_primary
        } for c in contacts]


class AcceptInvitationSerializer(serializers.Serializer):
    """Accept invitation with selected children"""
    child_ids = serializers.ListField(
        child=serializers.UUIDField(),
        min_length=1,
        help_text="List of child IDs to share with the organization"
    )


class UpdateSharedChildrenSerializer(serializers.Serializer):
    """Update which children are shared"""
    child_ids = serializers.ListField(
        child=serializers.UUIDField(),
        help_text="List of child IDs to share"
    )


class OrganizationSignupSerializer(serializers.Serializer):
    """Organization signup - creates org + admin user"""
    # Organization fields
    organization_name = serializers.CharField(max_length=200)
    organization_type = serializers.ChoiceField(choices=Organization.ORGANIZATION_TYPE_CHOICES)
    organization_phone = serializers.CharField(max_length=20)
    organization_address = serializers.CharField(required=False, allow_blank=True)
    license_number = serializers.CharField(max_length=100, required=False, allow_blank=True)

    # Admin user fields
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        if Organization.objects.filter(email=value).exists():
            raise serializers.ValidationError("An organization with this email already exists.")
        return value


class JoinOrganizationSerializer(serializers.Serializer):
    """Join organization with invite code"""
    invite_code = serializers.CharField(max_length=20)
    password = serializers.CharField(min_length=8, write_only=True)


class OrganizationStatsSerializer(serializers.Serializer):
    """Dashboard statistics"""
    total_patients = serializers.IntegerField()
    pending_invitations = serializers.IntegerField()
    critical_reports = serializers.IntegerField()
    urgent_reports = serializers.IntegerField()
    moderate_reports = serializers.IntegerField()
    total_unaddressed = serializers.IntegerField()
