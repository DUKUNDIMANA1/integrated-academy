import api from './axios';

export const hrApi = {
  getSummary: () => api.get('/hr/summary'),
  getDepartments: () => api.get('/hr/departments'),
  createDepartment: (data: object) => api.post('/hr/departments', data),
  updateDepartment: (id: string, data: object) => api.put(`/hr/departments/${id}`, data),
  getEmployees: (params?: object) => api.get('/hr/employees', { params }),
  getEmployee: (id: string) => api.get(`/hr/employees/${id}`),
  createEmployee: (data: object) => api.post('/hr/employees', data),
  updateEmployee: (id: string, data: object) => api.put(`/hr/employees/${id}`, data),
  toggleEmployeeActive: (id: string, isActive: boolean) => api.patch(`/hr/employees/${id}/toggle-active`, { isActive }),
  deleteEmployee: (id: string) => api.delete(`/hr/employees/${id}`),
  getLeaveRequests: (params?: object) => api.get('/hr/leave-requests', { params }),
  createLeaveRequest: (data: object) => api.post('/hr/leave-requests', data),
  updateLeaveStatus: (id: string, status: string) => api.put(`/hr/leave-requests/${id}/status`, { status }),
};
