from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import EmergencyContact, PreferredHospital

User = get_user_model()


class EmergencyContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmergencyContact
        fields = ['id', 'name', 'phone', 'relationship', 'is_primary']


class PreferredHospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreferredHospital
        fields = ['id', 'name', 'address', 'phone', 'doctor_name']


class UserSerializer(serializers.ModelSerializer):
    emergency_contacts = EmergencyContactSerializer(many=True, read_only=True)
    preferred_hospital = PreferredHospitalSerializer(read_only=True)
    name = serializers.SerializerMethodField()
    children_count = serializers.SerializerMethodField()
    is_doctor = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'phone', 'first_name', 'last_name', 'name',
            'date_of_birth', 'blood_type', 'genotype', 'location',
            'health_conditions', 'allergies',
            'onboarding_complete', 'is_admin', 'is_doctor',
            'user_type', 'specialization', 'hospital_name',
            'token_balance', 'total_tokens_earned',
            'emergency_contacts', 'preferred_hospital',
            'children_count',
            'created_at',
        ]
        read_only_fields = ['id', 'token_balance', 'total_tokens_earned', 'created_at']

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email

    def get_children_count(self, obj):
        return obj.children.filter(is_active=True).count()

    def get_is_doctor(self, obj):
        return obj.is_doctor


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    name = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ['email', 'phone', 'password', 'name', 'first_name', 'last_name']

    def create(self, validated_data):
        password = validated_data.pop('password')
        name = validated_data.pop('name', '')

        # Split name into first and last
        if name and not validated_data.get('first_name'):
            parts = name.split(' ', 1)
            validated_data['first_name'] = parts[0]
            validated_data['last_name'] = parts[1] if len(parts) > 1 else ''

        validated_data['username'] = validated_data['email']
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()


class OnboardingSerializer(serializers.Serializer):
    """Serializer for completing voice-based onboarding with AI-parsed data."""
    date_of_birth = serializers.DateField(required=False, allow_null=True)
    blood_type = serializers.CharField(required=False, allow_blank=True)
    genotype = serializers.CharField(required=False, allow_blank=True)
    location = serializers.CharField(required=False, allow_blank=True)
    health_conditions = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    allergies = serializers.CharField(required=False, allow_blank=True)

    emergency_contact_name = serializers.CharField(required=False, allow_blank=True)
    emergency_contact_phone = serializers.CharField(required=False, allow_blank=True)
    emergency_contact_relationship = serializers.CharField(required=False, allow_blank=True)

    hospital_name = serializers.CharField(required=False, allow_blank=True)
    doctor_name = serializers.CharField(required=False, allow_blank=True)
