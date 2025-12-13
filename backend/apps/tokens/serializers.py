from rest_framework import serializers
from .models import TokenTransaction


class TokenTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = TokenTransaction
        fields = [
            'id', 'transaction_type', 'amount', 'source',
            'description', 'balance_after', 'created_at'
        ]
