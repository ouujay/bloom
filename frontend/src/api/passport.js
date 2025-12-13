import api from './axios';

export const passportAPI = {
  // Get full passport data
  getPassport: (childId) =>
    api.get(`/passport/${childId}/`),

  // Get passport events
  getEvents: (childId, type = null, limit = 50) => {
    let url = `/passport/${childId}/events/?limit=${limit}`;
    if (type) url += `&type=${type}`;
    return api.get(url);
  },

  // Create share link
  createShare: (childId, data) =>
    api.post(`/passport/${childId}/share/`, data),

  // List share links
  getShares: (childId) =>
    api.get(`/passport/${childId}/shares/`),

  // Deactivate share link
  deactivateShare: (childId, shareId) =>
    api.delete(`/passport/${childId}/shares/${shareId}/`),

  // Verify shared passport (public)
  verifyShare: (shareCode, passcode) =>
    api.post(`/passport/view/${shareCode}/verify/`, { passcode }),

  // View shared passport (public, after verification)
  viewShared: (shareCode, accessToken) =>
    api.get(`/passport/view/${shareCode}/`, {
      headers: { 'X-Access-Token': accessToken }
    }),
};
