from rest_framework import serializers
from .models import PassportShare, PassportEvent


class PassportShareSerializer(serializers.ModelSerializer):
    """Serializer for PassportShare."""

    share_url = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    is_valid = serializers.SerializerMethodField()

    class Meta:
        model = PassportShare
        fields = [
            'id',
            'share_code',
            'passcode',
            'recipient_name',
            'recipient_type',
            'recipient_email',
            'duration_type',
            'expires_at',
            'is_active',
            'is_expired',
            'is_valid',
            'view_count',
            'last_viewed_at',
            'share_url',
            'created_at',
        ]
        read_only_fields = ['id', 'share_code', 'passcode', 'created_at', 'view_count', 'last_viewed_at']

    def get_share_url(self, obj):
        return obj.get_share_url()

    def get_is_expired(self, obj):
        return obj.is_expired

    def get_is_valid(self, obj):
        return obj.is_valid


class PassportShareCreateSerializer(serializers.Serializer):
    """Serializer for creating a share link."""

    recipient_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    recipient_type = serializers.ChoiceField(
        choices=['doctor', 'family', 'partner', 'other'],
        default='other'
    )
    recipient_email = serializers.EmailField(required=False, allow_blank=True)
    duration_type = serializers.ChoiceField(
        choices=['24h', '7d', '30d'],
        default='7d'
    )


class PassportEventSerializer(serializers.ModelSerializer):
    """Serializer for PassportEvent."""

    class Meta:
        model = PassportEvent
        fields = [
            'id',
            'event_type',
            'title',
            'description',
            'stage_type',
            'stage_week',
            'stage_day',
            'data',
            'is_concern',
            'severity',
            'event_date',
            'event_time',
            'created_at',
        ]


class PassportVerifySerializer(serializers.Serializer):
    """Serializer for verifying passport access."""

    passcode = serializers.CharField(max_length=6)
