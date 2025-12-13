import api from './axios';

export const healthAPI = {
  // Health Logs
  getLogs: (childId = null) =>
    api.get(childId ? `/health/${childId}/logs/` : '/health/logs/'),

  getTodayLog: (childId = null) =>
    api.get(childId ? `/health/${childId}/logs/today/` : '/health/logs/today/'),

  getLog: (logId) =>
    api.get(`/health/logs/${logId}/`),

  createLog: (data) =>
    api.post('/health/logs/', data),

  // Kick Counting
  getKickSessions: (childId = null) =>
    api.get(childId ? `/health/${childId}/kicks/` : '/health/kicks/'),

  startKickSession: (childId = null) =>
    api.post(childId ? `/health/${childId}/kicks/` : '/health/kicks/', {}),

  recordKick: (kickId) =>
    api.post(`/health/kicks/${kickId}/kick/`),

  endKickSession: (kickId, data) =>
    api.patch(`/health/kicks/${kickId}/`, data),

  // Appointments
  getAppointments: (childId = null, upcoming = false) =>
    api.get(childId ? `/health/${childId}/appointments/` : '/health/appointments/', {
      params: { upcoming }
    }),

  createAppointment: (data) =>
    api.post('/health/appointments/', data),

  updateAppointment: (appointmentId, data) =>
    api.patch(`/health/appointments/${appointmentId}/`, data),

  deleteAppointment: (appointmentId) =>
    api.delete(`/health/appointments/${appointmentId}/`),
};

export default healthAPI;
