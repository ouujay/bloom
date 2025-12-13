import api from './axios';

export const childrenApi = {
  /**
   * Get all children for the current user
   */
  list: async () => {
    const response = await api.get('/children/');
    return response.data;
  },

  /**
   * Get a single child by ID
   * @param {string} childId - The child UUID
   */
  get: async (childId) => {
    const response = await api.get(`/children/${childId}/`);
    return response.data;
  },

  /**
   * Create a new child
   * @param {Object} data - Child data (from AI parsed data)
   */
  create: async (data) => {
    const response = await api.post('/children/', data);
    return response.data;
  },

  /**
   * Update a child
   * @param {string} childId - The child UUID
   * @param {Object} data - Updated child data
   */
  update: async (childId, data) => {
    const response = await api.patch(`/children/${childId}/`, data);
    return response.data;
  },

  /**
   * Delete (archive) a child
   * @param {string} childId - The child UUID
   */
  delete: async (childId) => {
    const response = await api.delete(`/children/${childId}/`);
    return response.data;
  },

  /**
   * Get dashboard data for a child
   * @param {string} childId - The child UUID
   */
  getDashboard: async (childId) => {
    const response = await api.get(`/children/${childId}/dashboard/`);
    return response.data;
  },

  /**
   * Record birth for a pregnancy
   * @param {string} childId - The child UUID
   * @param {Object} birthData - Birth information
   */
  recordBirth: async (childId, birthData) => {
    const response = await api.post(`/children/${childId}/birth/`, birthData);
    return response.data;
  },
};

export default childrenApi;
