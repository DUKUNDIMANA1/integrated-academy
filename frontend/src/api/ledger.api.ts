import api from './axios';

export const ledgerApi = {
  getChartOfAccounts: (params?: object) => api.get('/ledger/accounts', { params }),
  createAccount: (data: object) => api.post('/ledger/accounts', data),
  updateAccount: (id: string, data: object) => api.put(`/ledger/accounts/${id}`, data),
  getJournalEntries: (params?: object) => api.get('/ledger/journal', { params }),
  createJournalEntry: (data: object) => api.post('/ledger/journal', data),
  getGeneralLedger: (accountId: string, params?: object) => api.get(`/ledger/ledger/${accountId}`, { params }),
  getTrialBalance: (params?: object) => api.get('/ledger/trial-balance', { params }),
  getTaxRecords: (params?: object) => api.get('/ledger/tax', { params }),
  createTaxRecord: (data: object) => api.post('/ledger/tax', data),
  updateTaxRecord: (id: string, data: object) => api.put(`/ledger/tax/${id}`, data),
};
