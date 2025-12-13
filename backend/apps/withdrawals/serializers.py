from rest_framework import serializers
from .models import WithdrawalRequest


class WithdrawalRequestSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = WithdrawalRequest
        fields = [
            'id', 'user_email', 'user_name', 'status',
            'tokens_amount', 'naira_amount', 'payment_method',
            'bank_name', 'account_number', 'account_name',
            'mobile_network', 'mobile_number',
            'admin_notes', 'rejection_reason',
            'processed_at', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user_email', 'user_name', 'status',
            'naira_amount', 'admin_notes', 'rejection_reason',
            'processed_at', 'created_at', 'updated_at'
        ]
