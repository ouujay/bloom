from rest_framework import serializers
from .models import Child


class ChildSerializer(serializers.ModelSerializer):
    """Serializer for Child model."""

    current_stage = serializers.SerializerMethodField()
    is_near_due_date = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    pregnancy_week = serializers.SerializerMethodField()
    age_months = serializers.SerializerMethodField()

    class Meta:
        model = Child
        fields = [
            'id',
            'status',
            # Pregnancy fields
            'due_date',
            'conception_date',
            'weeks_at_registration',
            'last_menstrual_period',
            # Baby fields
            'name',
            'nickname',
            'birth_date',
            'birth_weight_kg',
            'birth_time',
            'gender',
            'delivery_type',
            # Progress
            'current_day',
            'current_streak',
            'longest_streak',
            # Status
            'is_active',
            # Computed fields
            'current_stage',
            'is_near_due_date',
            'display_name',
            'pregnancy_week',
            'age_months',
            # Timestamps
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'current_stage', 'is_near_due_date', 'display_name', 'pregnancy_week', 'age_months']

    def get_current_stage(self, obj):
        return obj.get_current_stage()

    def get_is_near_due_date(self, obj):
        return obj.is_near_due_date()

    def get_display_name(self, obj):
        if obj.status == 'pregnant':
            return obj.nickname or 'Baby'
        return obj.name or obj.nickname or 'Baby'

    def get_pregnancy_week(self, obj):
        if obj.status == 'pregnant':
            return obj.get_pregnancy_week()
        return None

    def get_age_months(self, obj):
        if obj.status == 'born' and obj.birth_date:
            from datetime import date
            today = date.today()
            months = (today.year - obj.birth_date.year) * 12 + (today.month - obj.birth_date.month)
            return max(0, months)
        return None


class ChildCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new child."""

    class Meta:
        model = Child
        fields = [
            'status',
            'due_date',
            'weeks_at_registration',
            'name',
            'nickname',
            'birth_date',
            'birth_weight_kg',
            'gender',
        ]

    def validate(self, data):
        status = data.get('status', 'pregnant')

        if status == 'pregnant':
            if not data.get('due_date') and not data.get('weeks_at_registration'):
                raise serializers.ValidationError(
                    "For pregnancy, either due_date or weeks_at_registration is required."
                )
        elif status == 'born':
            if not data.get('birth_date'):
                raise serializers.ValidationError(
                    "For born babies, birth_date is required."
                )

        return data

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user

        # Calculate due_date from weeks if not provided
        if validated_data.get('status') == 'pregnant' and not validated_data.get('due_date'):
            from datetime import date, timedelta
            weeks = validated_data.get('weeks_at_registration', 1)
            remaining_weeks = 40 - weeks
            validated_data['due_date'] = date.today() + timedelta(weeks=remaining_weeks)

        return super().create(validated_data)


class ChildBirthTransitionSerializer(serializers.Serializer):
    """Serializer for transitioning a child from pregnant to born."""

    birth_date = serializers.DateField(required=True)
    name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    birth_weight_kg = serializers.DecimalField(max_digits=4, decimal_places=2, required=False, allow_null=True)
    gender = serializers.ChoiceField(choices=['male', 'female', 'unknown'], required=False)
    delivery_type = serializers.CharField(max_length=50, required=False, allow_blank=True)
    birth_time = serializers.TimeField(required=False, allow_null=True)


class ChildDashboardSerializer(serializers.ModelSerializer):
    """Serializer for child dashboard data."""

    current_stage = serializers.SerializerMethodField()
    is_near_due_date = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    today_tasks = serializers.SerializerMethodField()
    recent_health_logs = serializers.SerializerMethodField()
    stats = serializers.SerializerMethodField()

    class Meta:
        model = Child
        fields = [
            'id',
            'status',
            'display_name',
            'current_stage',
            'is_near_due_date',
            'current_day',
            'current_streak',
            'longest_streak',
            'today_tasks',
            'recent_health_logs',
            'stats',
        ]

    def get_current_stage(self, obj):
        return obj.get_current_stage()

    def get_is_near_due_date(self, obj):
        return obj.is_near_due_date()

    def get_display_name(self, obj):
        if obj.status == 'pregnant':
            return obj.nickname or 'Baby'
        return obj.name or obj.nickname or 'Baby'

    def get_today_tasks(self, obj):
        # This will be implemented when we update daily_program
        return []

    def get_recent_health_logs(self, obj):
        # This will be implemented when we update health app
        return []

    def get_stats(self, obj):
        return {
            'days_completed': obj.current_day - 1,
            'current_streak': obj.current_streak,
            'longest_streak': obj.longest_streak,
            'tokens_earned': obj.user.total_tokens_earned,
        }
