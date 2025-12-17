import uuid
import secrets
from django.db import models
from django.utils import timezone
from datetime import timedelta


class Organization(models.Model):
    """Healthcare organization (hospital, clinic, etc.)"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    address = models.TextField(blank=True)

    ORGANIZATION_TYPE_CHOICES = [
        ('hospital', 'Hospital'),
        ('clinic', 'Clinic'),
        ('health_center', 'Health Center'),
        ('maternity_home', 'Maternity Home'),
    ]
    organization_type = models.CharField(
        max_length=20,
        choices=ORGANIZATION_TYPE_CHOICES,
        default='hospital'
    )

    license_number = models.CharField(max_length=100, blank=True)
    is_verified = models.BooleanField(default=False)
    logo_url = models.URLField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.get_organization_type_display()})"


class OrganizationMember(models.Model):
    """Staff members of an organization"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='members'
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='organization_memberships'
    )

    ROLE_CHOICES = [
        ('admin', 'Administrator'),
        ('doctor', 'Doctor'),
        ('nurse', 'Nurse'),
        ('staff', 'Staff'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    is_primary_admin = models.BooleanField(default=False)

    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['organization', 'user']
        ordering = ['-is_primary_admin', 'role', 'joined_at']

    def __str__(self):
        return f"{self.user.name} - {self.organization.name} ({self.get_role_display()})"


class StaffInvitation(models.Model):
    """Invitation for staff to join an organization"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='staff_invitations'
    )

    email = models.EmailField()
    first_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100, blank=True)

    ROLE_CHOICES = [
        ('doctor', 'Doctor'),
        ('nurse', 'Nurse'),
        ('staff', 'Staff'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')

    invited_by = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='sent_staff_invitations'
    )

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('expired', 'Expired'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    invite_code = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.invite_code:
            self.invite_code = secrets.token_urlsafe(12)[:16].upper()
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Staff invite to {self.email} for {self.organization.name}"


class PatientInvitation(models.Model):
    """Invitation for a mother to connect with an organization"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='patient_invitations'
    )

    # Target - MUST be existing user
    patient = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='org_invitations'
    )

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    invited_by = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='sent_patient_invitations'
    )

    message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        # Prevent duplicate invitations
        unique_together = ['organization', 'patient']

    def __str__(self):
        return f"Patient invite to {self.patient.name} from {self.organization.name}"


class OrganizationPatient(models.Model):
    """Accepted connection between org and mother"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='patients'
    )
    patient = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='connected_organizations'
    )

    # Which children does this org have access to?
    children = models.ManyToManyField(
        'children.Child',
        blank=True,
        related_name='accessible_by_organizations'
    )

    connected_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['organization', 'patient']
        ordering = ['-connected_at']

    def __str__(self):
        return f"{self.patient.name} connected to {self.organization.name}"
