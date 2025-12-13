from rest_framework import serializers
from .models import DailyHealthLog, KickCount, Appointment, HealthReport


class DailyHealthLogSerializer(serializers.ModelSerializer):
    child_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = DailyHealthLog
        fields = [
            'id', 'child', 'child_id', 'date', 'mood', 'weight_kg',
            'blood_pressure_systolic', 'blood_pressure_diastolic',
            'symptoms', 'baby_movement', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'child', 'created_at', 'updated_at']


class KickCountSerializer(serializers.ModelSerializer):
    child_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = KickCount
        fields = [
            'id', 'child', 'child_id', 'start_time', 'end_time', 'kick_count',
            'duration_minutes', 'notes', 'created_at'
        ]
        read_only_fields = ['id', 'child', 'created_at']


class AppointmentSerializer(serializers.ModelSerializer):
    child_id = serializers.UUIDField(write_only=True, required=False)

    class Meta:
        model = Appointment
        fields = [
            'id', 'child', 'child_id', 'title', 'appointment_type', 'date', 'time',
            'location', 'doctor_name', 'notes',
            'reminder_sent', 'is_completed',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'child', 'reminder_sent', 'created_at', 'updated_at']


class HealthReportListSerializer(serializers.ModelSerializer):
    """Compact view for doctor dashboard list"""
    patient_name = serializers.SerializerMethodField()
    patient_phone = serializers.CharField(source='user.phone', default='')
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
    patient_phone = serializers.CharField(source='user.phone', default='')
    patient_location = serializers.CharField(source='user.location', default='')
    patient_email = serializers.CharField(source='user.email', default='')
    addressed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = HealthReport
        fields = '__all__'

    def get_patient_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

    def get_addressed_by_name(self, obj):
        if obj.addressed_by:
            return f"Dr. {obj.addressed_by.last_name}"
        return None
