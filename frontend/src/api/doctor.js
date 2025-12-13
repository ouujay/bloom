import api from './axios';

export const doctorAPI = {
  // Auth
  signup: (data) =>
    api.post('/health/doctor/signup/', data),

  // Dashboard
  getStats: () =>
    api.get('/health/doctor/stats/'),

  // Reports
  getReports: (params = {}) =>
    api.get('/health/doctor/reports/', { params }),

  getReport: (reportId) =>
    api.get(`/health/doctor/reports/${reportId}/`),

  addressReport: (reportId, notes = '') =>
    api.post(`/health/doctor/reports/${reportId}/address/`, { notes }),
};

export default doctorAPI;
