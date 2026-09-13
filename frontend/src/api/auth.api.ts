import api from './axios';

export const authApi = {
  register: (data: { email: string; firstName: string; lastName: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  logout: (refreshToken?: string) =>
    api.post('/auth/logout', { refreshToken }),

  getProfile: () => api.get('/auth/profile'),

  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string }) =>
    api.put('/auth/profile', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),

  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string }) =>
    api.get('/auth/users', { params }),
  createUser: (data: object) => api.post('/auth/users', data),
  updateUser: (id: string, data: object) => api.put(`/auth/users/${id}`, data),
  toggleUserActive: (id: string, isActive: boolean) => api.patch(`/auth/users/${id}/toggle-active`, { isActive }),
  deleteUser: (id: string) => api.delete(`/auth/users/${id}`),
};
