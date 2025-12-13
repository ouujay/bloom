import api from './axios';

export const authAPI = {
  login: (email, password) =>
    api.post('/auth/login/', { email, password }),

  signup: (data) =>
    api.post('/auth/signup/', data),

  getMe: () =>
    api.get('/auth/me/'),

  updateProfile: (data) =>
    api.patch('/auth/profile/', data),

  logout: () =>
    api.post('/auth/logout/'),
};
