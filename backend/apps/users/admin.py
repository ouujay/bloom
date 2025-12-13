from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, EmergencyContact, PreferredHospital


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'token_balance', 'onboarding_complete', 'is_admin']
    list_filter = ['is_admin', 'onboarding_complete']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering = ['-created_at']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {'fields': ('date_of_birth', 'blood_type', 'genotype', 'location')}),
        ('Health', {'fields': ('health_conditions', 'allergies')}),
        ('Tokens', {'fields': ('token_balance', 'total_tokens_earned')}),
        ('Status', {'fields': ('onboarding_complete', 'is_admin')}),
    )


@admin.register(EmergencyContact)
class EmergencyContactAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'phone', 'relationship', 'is_primary']


@admin.register(PreferredHospital)
class PreferredHospitalAdmin(admin.ModelAdmin):
    list_display = ['user', 'name', 'doctor_name']
