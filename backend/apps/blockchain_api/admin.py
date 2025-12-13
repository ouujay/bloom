from django.contrib import admin
from .models import UserWallet, TokenTransaction, Donation, WithdrawalRequest


@admin.register(UserWallet)
class UserWalletAdmin(admin.ModelAdmin):
    list_display = ('user', 'wallet_address', 'created_at')
    search_fields = ('user__username', 'wallet_address')
    readonly_fields = ('wallet_address', 'created_at', 'updated_at')
    list_filter = ('created_at',)


@admin.register(TokenTransaction)
class TokenTransactionAdmin(admin.ModelAdmin):
    list_display = ('user_wallet', 'transaction_type', 'action_type', 'token_amount', 'status', 'created_at')
    list_filter = ('transaction_type', 'action_type', 'status', 'created_at')
    search_fields = ('user_wallet__wallet_address', 'tx_hash', 'action_id')
    readonly_fields = ('tx_hash', 'block_number', 'gas_used', 'created_at', 'confirmed_at')
    fieldsets = (
        ('Transaction Info', {
            'fields': ('user_wallet', 'transaction_type', 'action_type', 'action_id')
        }),
        ('Amounts', {
            'fields': ('token_amount', 'naira_equivalent')
        }),
        ('Blockchain Data', {
            'fields': ('tx_hash', 'block_number', 'gas_used', 'status')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'confirmed_at')
        }),
    )


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ('donor_email', 'amount_naira', 'payment_status', 'blockchain_recorded', 'created_at')
    list_filter = ('payment_status', 'blockchain_recorded', 'created_at')
    search_fields = ('donor_email', 'paystack_reference', 'blockchain_tx_hash')
    readonly_fields = ('blockchain_tx_hash', 'created_at', 'paid_at', 'recorded_at')


@admin.register(WithdrawalRequest)
class WithdrawalRequestAdmin(admin.ModelAdmin):
    list_display = ('user_wallet', 'token_amount', 'naira_amount', 'status', 'created_at')
    list_filter = ('status', 'payment_provider', 'created_at')
    search_fields = ('user_wallet__user__username', 'account_number', 'payment_reference')
    readonly_fields = ('burn_tx_hash', 'withdrawal_tx_hash', 'created_at', 'approved_at', 'completed_at')
    fieldsets = (
        ('User Info', {
            'fields': ('user_wallet', 'token_amount', 'naira_amount')
        }),
        ('Bank Details', {
            'fields': ('bank_name', 'account_number', 'account_name', 'payment_provider', 'payment_reference')
        }),
        ('Blockchain Data', {
            'fields': ('burn_tx_hash', 'burn_confirmed', 'withdrawal_tx_hash', 'withdrawal_recorded')
        }),
        ('Approval', {
            'fields': ('status', 'admin_notes', 'approved_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'approved_at', 'completed_at')
        }),
    )
