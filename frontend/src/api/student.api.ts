import api from './axios';

export const studentApi = {
  getDashboard: () => api.get('/student/dashboard'),
  submitApplication: (data: object) => api.post('/student/applications', data),
  getApplications: () => api.get('/student/applications'),
  getApplication: (id: string) => api.get(`/student/applications/${id}`),
  getEnrollments: () => api.get('/student/enrollments'),
  getEnrollmentPaymentStatus: (id: string) => api.get(`/student/enrollments/${id}/payment-status`),
  getCourseContent: (courseId: string) => api.get(`/student/courses/${courseId}/content`),
  markLessonComplete: (lessonId: string, timeSpent?: number) =>
    api.post(`/student/lessons/${lessonId}/complete`, { timeSpent }),
  submitAssessment: (data: object) => api.post('/student/assessments/submit', data),
  getAssessmentForAttempt: (id: string) => api.get(`/student/assessments/${id}`),
  getGrades: () => api.get('/student/grades'),
  getAttendance: () => api.get('/student/attendance'),
  getCertificates: () => api.get('/student/certificates'),
  getCertificateForEnrollment: (enrollmentId: string) => api.get(`/student/certificates/enrollment/${enrollmentId}`),
  getInvoices: () => api.get('/student/invoices'),
  makePayment: (data: object) => api.post('/student/payments', data),
  payRemainingBalance: (invoiceId: string, data: object) =>
    api.post(`/student/invoices/${invoiceId}/pay-balance`, data),
  getNotifications: (params?: { page?: number; limit?: number }) =>
    api.get('/student/notifications', { params }),
  markNotificationRead: (id: string) => api.put(`/student/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/student/notifications/read-all'),
  createTicket: (data: object) => api.post('/student/tickets', data),
  getTickets: () => api.get('/student/tickets'),
};
