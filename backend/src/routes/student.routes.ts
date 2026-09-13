import { Router } from 'express';
import * as studentController from '../controllers/student.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Role } from '@prisma/client';

const router = Router();

// All student routes require authentication
router.use(authenticate);
router.use(authorize(Role.STUDENT));

// Dashboard
router.get('/dashboard', studentController.getStudentDashboard);

// Applications
router.post('/applications', studentController.submitApplication);
router.get('/applications', studentController.getMyApplications);
router.get('/applications/:id', studentController.getApplicationById);

// Enrollments
router.get('/enrollments', studentController.getMyEnrollments);
router.get('/enrollments/:id/payment-status', studentController.getEnrollmentPaymentStatus);

// Learning
router.get('/courses/:courseId/content', studentController.getCourseContent);
router.post('/lessons/:lessonId/complete', studentController.markLessonComplete);

// Assessments
router.post('/assessments/submit', studentController.submitAssessment);
router.get('/assessments/:id', studentController.getAssessmentForStudent);
router.get('/grades', studentController.getMyGrades);

// Attendance
router.get('/attendance', studentController.getMyAttendance);

// Certificates
router.get('/certificates', studentController.getMyCertificates);
router.get('/certificates/enrollment/:enrollmentId', studentController.getCertificateForEnrollment);

// Finance
router.get('/invoices', studentController.getMyInvoices);
router.post('/payments', studentController.makePayment);
router.post('/invoices/:invoiceId/pay-balance', studentController.payRemainingBalance);

// Notifications
router.get('/notifications', studentController.getMyNotifications);
router.put('/notifications/:id/read', studentController.markNotificationRead);
router.put('/notifications/read-all', studentController.markAllNotificationsRead);

// Support
router.post('/tickets', studentController.createTicket);
router.get('/tickets', studentController.getMyTickets);

export default router;
