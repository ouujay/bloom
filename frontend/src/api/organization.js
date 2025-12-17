import api from './axios';

export const organizationAPI = {
  // Organization signup (creates org + admin user)
  signup: (data) =>
    api.post('/organizations/signup/', data),

  // Get current organization info
  getMe: () =>
    api.get('/organizations/me/'),

  // Update organization info
  updateMe: (data) =>
    api.patch('/organizations/me/', data),

  // Get organization dashboard stats
  getStats: () =>
    api.get('/organizations/stats/'),

  // Staff management
  getStaff: () =>
    api.get('/organizations/staff/'),

  inviteStaff: (data) =>
    api.post('/organizations/staff/invite/', data),

  removeStaff: (staffId) =>
    api.delete(`/organizations/staff/${staffId}/`),

  // Join organization with invite code
  joinOrganization: (inviteCode, userData) =>
    api.post('/organizations/staff/join/', { invite_code: inviteCode, ...userData }),

  // Patient management
  getPatients: (params = {}) =>
    api.get('/organizations/patients/', { params }),

  invitePatient: (email, message = '') =>
    api.post('/organizations/patients/invite/', { email, message }),

  getPatientDetail: (patientId) =>
    api.get(`/organizations/patients/${patientId}/`),

  getPatientReports: (patientId) =>
    api.get(`/organizations/patients/${patientId}/reports/`),

  getPatientChildren: (patientId) =>
    api.get(`/organizations/patients/${patientId}/children/`),

  // Invitations sent to patients
  getInvitations: () =>
    api.get('/organizations/invitations/'),

  cancelInvitation: (invitationId) =>
    api.delete(`/organizations/invitations/${invitationId}/`),
};

// Mother-side organization endpoints
export const motherOrgAPI = {
  // Get pending organization invitations
  getInvitations: () =>
    api.get('/auth/org-invitations/'),

  // Accept invitation and select children to share
  acceptInvitation: (invitationId, childIds) =>
    api.post(`/auth/org-invitations/${invitationId}/accept/`, { child_ids: childIds }),

  // Decline invitation
  declineInvitation: (invitationId) =>
    api.post(`/auth/org-invitations/${invitationId}/decline/`),

  // Get connected organizations
  getConnectedOrgs: () =>
    api.get('/auth/connected-orgs/'),

  // Disconnect from organization
  disconnectOrg: (connectionId) =>
    api.delete(`/auth/connected-orgs/${connectionId}/`),

  // Update which children are shared with an org
  updateSharedChildren: (connectionId, childIds) =>
    api.patch(`/auth/connected-orgs/${connectionId}/children/`, { child_ids: childIds }),
};
