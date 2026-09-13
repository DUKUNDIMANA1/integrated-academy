import api from './axios';

export const communicationApi = {
  getAnnouncements: (params?: object) => api.get('/communication/announcements', { params }),
  createAnnouncement: (data: object) => api.post('/communication/announcements', data),
  updateAnnouncement: (id: string, data: object) => api.put(`/communication/announcements/${id}`, data),
  deleteAnnouncement: (id: string) => api.delete(`/communication/announcements/${id}`),
  getMessages: () => api.get('/communication/messages'),
  sendMessage: (data: object) => api.post('/communication/messages', data),
  markMessageRead: (id: string) => api.put(`/communication/messages/${id}/read`),
  getDiscussions: (params?: object) => api.get('/communication/discussions', { params }),
  createDiscussion: (data: object) => api.post('/communication/discussions', data),
  getReplies: (threadId: string) => api.get(`/communication/discussions/${threadId}/replies`),
  addReply: (threadId: string, content: string) => api.post(`/communication/discussions/${threadId}/replies`, { content }),
  submitFeedback: (data: object) => api.post('/communication/feedback', data),
  getSettings: () => api.get('/communication/settings'),
  saveSetting: (data: object) => api.post('/communication/settings', data),
};
