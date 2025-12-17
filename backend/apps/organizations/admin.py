from django.contrib import admin
from .models import (
    Organization,
    OrganizationMember,
    StaffInvitation,
    PatientInvitation,
    OrganizationPatient
)


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'organization_type', 'email', 'is_verified', 'created_at']
    list_filter = ['organization_type', 'is_verified', 'created_at']
    search_fields = ['name', 'email', 'license_number']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(OrganizationMember)
class OrganizationMemberAdmin(admin.ModelAdmin):
    list_display = ['user', 'organization', 'role', 'is_primary_admin', 'joined_at']
    list_filter = ['role', 'is_primary_admin', 'organization']
    search_fields = ['user__email', 'user__first_name', 'organization__name']
    readonly_fields = ['id', 'joined_at']


@admin.register(StaffInvitation)
class StaffInvitationAdmin(admin.ModelAdmin):
    list_display = ['email', 'organization', 'role', 'status', 'invite_code', 'expires_at']
    list_filter = ['status', 'role', 'organization']
    search_fields = ['email', 'organization__name', 'invite_code']
    readonly_fields = ['id', 'invite_code', 'created_at']


@admin.register(PatientInvitation)
class PatientInvitationAdmin(admin.ModelAdmin):
    list_display = ['patient', 'organization', 'status', 'invited_by', 'created_at']
    list_filter = ['status', 'organization']
    search_fields = ['patient__email', 'organization__name']
    readonly_fields = ['id', 'created_at']


@admin.register(OrganizationPatient)
class OrganizationPatientAdmin(admin.ModelAdmin):
    list_display = ['patient', 'organization', 'is_active', 'connected_at']
    list_filter = ['is_active', 'organization']
    search_fields = ['patient__email', 'organization__name']
    readonly_fields = ['id', 'connected_at']
    filter_horizontal = ['children']
