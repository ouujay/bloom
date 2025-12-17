from rest_framework.permissions import BasePermission
from .models import OrganizationMember, OrganizationPatient


class IsOrganizationMember(BasePermission):
    """User is part of a verified organization"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        return OrganizationMember.objects.filter(
            user=request.user,
            organization__is_verified=True
        ).exists()


class IsOrganizationAdmin(BasePermission):
    """User is an admin of their organization"""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        return OrganizationMember.objects.filter(
            user=request.user,
            organization__is_verified=True,
            role='admin'
        ).exists()


class CanAccessPatient(BasePermission):
    """Org member can only access connected patients"""

    def has_object_permission(self, request, view, obj):
        # obj should be an OrganizationPatient instance
        org_ids = request.user.organization_memberships.values_list(
            'organization_id', flat=True
        )

        # Check if patient is connected to user's organization
        return OrganizationPatient.objects.filter(
            organization_id__in=org_ids,
            patient=obj.patient if hasattr(obj, 'patient') else obj,
            is_active=True
        ).exists()


def get_user_organization(user):
    """Get the organization the user belongs to (first one if multiple)"""
    membership = OrganizationMember.objects.filter(user=user).first()
    return membership.organization if membership else None


def get_user_organization_membership(user):
    """Get the user's organization membership"""
    return OrganizationMember.objects.filter(user=user).first()
