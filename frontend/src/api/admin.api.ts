import api from './axios';

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStats: () => api.get('/admin/stats'),
  getApplications: (params?: object) => api.get('/admin/applications', { params }),
  getApplication: (id: string) => api.get(`/admin/applications/${id}`),
  confirmApplication: (id: string) => api.post(`/admin/applications/${id}/confirm`),
  rejectApplication: (id: string, reason: string) => api.post(`/admin/applications/${id}/reject`, { reason }),
  getAuditLogs: (params?: object) => api.get('/admin/audit-logs', { params }),
};
