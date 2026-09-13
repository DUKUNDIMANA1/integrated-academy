import api from './axios';

export const supplierApi = {
  getDashboard: () => api.get('/suppliers/dashboard'),
  getSuppliers: (params?: object) => api.get('/suppliers', { params }),
  getSupplier: (id: string) => api.get(`/suppliers/${id}`),
  createSupplier: (data: object) => api.post('/suppliers', data),
  updateSupplier: (id: string, data: object) => api.put(`/suppliers/${id}`, data),
  approveSupplier: (id: string) => api.post(`/suppliers/${id}/approve`),
  evaluate: (id: string, data: object) => api.post(`/suppliers/${id}/evaluate`, data),

  getInvoices: (params?: object) => api.get('/suppliers/invoices/all', { params }),
  createInvoice: (data: object) => api.post('/suppliers/invoices', data),
  approveInvoice: (id: string) => api.post(`/suppliers/invoices/${id}/approve`),

  getPurchaseOrders: (params?: object) => api.get('/suppliers/purchase-orders/all', { params }),
  createPurchaseOrder: (data: object) => api.post('/suppliers/purchase-orders', data),
  updatePOStatus: (id: string, status: string) => api.put(`/suppliers/purchase-orders/${id}/status`, { status }),

  createPayment: (data: object) => api.post('/suppliers/payments', data),
  confirmPayment: (id: string) => api.post(`/suppliers/payments/${id}/confirm`),

  getAccountsPayable: () => api.get('/suppliers/accounts-payable/summary'),
  getAgingReport: () => api.get('/suppliers/accounts-payable/aging'),

  getContracts: (params?: object) => api.get('/suppliers/contracts/all', { params }),
  createContract: (data: object) => api.post('/suppliers/contracts', data),
};
