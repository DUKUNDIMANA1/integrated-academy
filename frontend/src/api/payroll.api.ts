import api from './axios';

export const payrollApi = {
  getSummary: () => api.get('/payroll/summary'),
  getPeriods: (params?: object) => api.get('/payroll/periods', { params }),
  createPeriod: (data: object) => api.post('/payroll/periods', data),
  process: (id: string) => api.post(`/payroll/periods/${id}/process`),
  approve: (id: string) => api.post(`/payroll/periods/${id}/approve`),
  getPayslips: (id: string) => api.get(`/payroll/periods/${id}/payslips`),
};
