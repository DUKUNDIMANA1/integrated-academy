import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest } from '../utils/response';
import prisma from '../config/database';
import financeService from '../services/finance.service';
import paymentService from '../services/payment.service';
import academyService from '../services/academy.service';
import certificateService from '../services/certificate.service';
import { AppError } from '../middleware/errorHandler';
import { generateTicketNumber } from '../utils/generators';
import { PaymentMethod } from '@prisma/client';
import { addDays } from 'date-fns';

const getStudentByUserId = async (userId: string) => {
  const student = await prisma.student.findUnique({ where: { userId } });
  if (!student) throw new AppError('Student profile not found', 404);
  return student;
};

// ── APPLICATION ────────────────────────────────────────────────────────────────

export const submitApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);
  const { courseId, cohortId, educationBackground, workExperience, motivation } = req.body;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) { sendNotFound(res, 'Course not found'); return; }

  const existing = await prisma.studentApplication.findFirst({
    where: { studentId: student.id, courseId, status: { notIn: ['REJECTED', 'DRAFT'] } },
  });
  if (existing) { sendBadRequest(res, 'You already have an active application for this course'); return; }

  const application = await prisma.studentApplication.create({
    data: {
      studentId: student.id,
      courseId,
      cohortId,
      educationBackground,
      workExperience,
      motivation,
      status: 'PENDING',
      submittedAt: new Date(),
    },
  });
  sendCreated(res, application, 'Application submitted successfully');
};

export const getMyApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);
  const applications = await prisma.studentApplication.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: 'desc' },
    include: {
      course: { select: { title: true, code: true, fee: true, currency: true } },
      cohort: { select: { name: true, startDate: true } },
      invoice: { select: { id: true, invoiceNumber: true, status: true, totalAmount: true, outstandingBalance: true, paidAmount: true } },
    },
  });
  sendSuccess(res, applications);
};

export const getApplicationById = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);
  const app = await prisma.studentApplication.findFirst({
    where: { id: req.params.id, studentId: student.id },
    include: {
      course: true,
      cohort: true,
      invoice: { include: { payments: true, installments: true } },
    },
  });
  if (!app) { sendNotFound(res, 'Application not found'); return; }
  sendSuccess(res, app);
};

// ── ENROLLMENTS & COURSES ─────────────────────────────────────────────────────

export const getMyEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: student.id, accessStatus: { not: 'CANCELLED' } },
    include: {
      course: { select: { id: true, title: true, code: true, type: true, durationDays: true, partialPaymentLockDays: true } },
      cohort: { select: { name: true, startDate: true, endDate: true } },
    },
  });

  // Attach payment status to each enrollment
  const enriched = await Promise.all(enrollments.map(async (e) => {
    const invoice = await prisma.invoice.findFirst({ where: { applicationId: e.applicationId! } });
    const checkpointDate = e.enrolledAt
      ? addDays(e.enrolledAt, e.course.partialPaymentLockDays)
      : null;
    return {
      ...e,
      invoice: invoice ? {
        id: invoice.id,
        status: invoice.status,
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        outstandingBalance: invoice.outstandingBalance,
      } : null,
      checkpointDate,
    };
  }));

  sendSuccess(res, enriched);
};

export const getEnrollmentPaymentStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const status = await paymentService.getStudentPaymentStatus(req.params.id);
  sendSuccess(res, status);
};

// ── LEARNING ───────────────────────────────────────────────────────────────────

export const getCourseContent = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);
  const { courseId } = req.params;

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id, courseId },
  });
  if (!enrollment) { sendNotFound(res, 'Enrollment not found'); return; }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: { orderBy: { order: 'asc' } },
          assessments: { where: { isPublished: true } },
        },
      },
    },
  });

  // If locked, mask protected content
  if (enrollment.accessStatus === 'LOCKED') {
    const invoice = await prisma.invoice.findFirst({ where: { applicationId: enrollment.applicationId! } });
    const masked = {
      ...course,
      accessStatus: 'LOCKED',
      outstandingBalance: invoice?.outstandingBalance || 0,
      invoiceId: invoice?.id,
      modules: course?.modules.map((m) => ({
        ...m,
        lessons: m.lessons.map((l) => ({
          id: l.id, title: l.title, type: l.type, order: l.order, isProtected: l.isProtected,
          content: l.isProtected ? null : l.content,
          fileUrl: l.isProtected ? null : l.fileUrl,
          videoUrl: l.isProtected ? null : l.videoUrl,
          locked: l.isProtected,
        })),
      })),
    };
    sendSuccess(res, masked);
    return;
  }

  // Track progress
  const progress = await prisma.lessonProgress.findMany({ where: { enrollmentId: enrollment.id } });
  sendSuccess(res, { ...course, accessStatus: enrollment.accessStatus, progress });
};

export const markLessonComplete = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);
  const { lessonId } = req.params;
  const { timeSpent } = req.body;

  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) { sendNotFound(res, 'Lesson not found'); return; }

  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id, courseId: (await prisma.courseModule.findUnique({ where: { id: lesson.moduleId } }))?.courseId },
  });
  if (!enrollment) { sendNotFound(res, 'Enrollment not found'); return; }
  if (enrollment.accessStatus === 'LOCKED') { sendBadRequest(res, 'Course access is locked. Please pay the remaining balance.'); return; }

  const prog = await prisma.lessonProgress.upsert({
    where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
    update: { isCompleted: true, completedAt: new Date(), timeSpent: timeSpent || 0 },
    create: { enrollmentId: enrollment.id, lessonId, isCompleted: true, completedAt: new Date(), timeSpent: timeSpent || 0 },
  });

  // Update progress percent
  const module = await prisma.courseModule.findUnique({ where: { id: lesson.moduleId } });
  const totalLessons = await prisma.lesson.count({ where: { module: { courseId: enrollment.courseId } } });
  const completedLessons = await prisma.lessonProgress.count({ where: { enrollmentId: enrollment.id, isCompleted: true } });
  const isComplete = totalLessons > 0 && completedLessons >= totalLessons;
  const progressPercent = isComplete ? 100 : (completedLessons / totalLessons) * 100;
  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { progressPercent, ...(isComplete && { completedAt: enrollment.completedAt || new Date() }) },
  });

  sendSuccess(res, { progress: prog, progressPercent, completed: isComplete },
    isComplete ? 'All course lessons completed' : 'Lesson marked as complete');
};

// ── INVOICES & PAYMENTS ───────────────────────────────────────────────────────

export const getMyInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);
  const result = await financeService.getInvoices(1, 50, { studentId: student.id });
  sendSuccess(res, result.invoices);
};

export const makePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);
  const { invoiceId, amount, method, reference, accountId } = req.body;

  // Verify invoice belongs to student
  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, studentId: student.id } });
  if (!invoice) { sendNotFound(res, 'Invoice not found'); return; }

  const payment = await paymentService.initiatePayment({
    invoiceId, amount, method: method as PaymentMethod,
    reference, studentId: student.id, accountId,
  });

  // Auto-confirm cash payments from student (or trigger gateway)
  // For demo: auto-confirm all
  await paymentService.confirmPayment(payment.id, req.user!.userId);
  sendCreated(res, { paymentId: payment.id }, 'Payment submitted successfully');
};

export const payRemainingBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);
  const { invoiceId } = req.params;
  const { method, reference, accountId } = req.body;

  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, studentId: student.id } });
  if (!invoice) { sendNotFound(res, 'Invoice not found'); return; }

  const payment = await paymentService.initiatePayment({
    invoiceId,
    amount: Number(invoice.outstandingBalance),
    method: method as PaymentMethod,
    reference,
    studentId: student.id,
    accountId,
  });
  await paymentService.confirmPayment(payment.id, req.user!.userId);
  sendCreated(res, { paymentId: payment.id }, 'Remaining balance paid. Course access restored!');
};

// ── ASSESSMENTS ───────────────────────────────────────────────────────────────

export const submitAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);
  const { assessmentId, answers, fileUrl } = req.body;

  const assessment = await prisma.assessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) { sendNotFound(res, 'Assessment not found'); return; }
  if (!assessment.isPublished) { sendBadRequest(res, 'This assessment is not published yet'); return; }

  try {
    const result = await academyService.submitAssessmentWithGrading(
      assessmentId, student.id, (answers || {}) as Record<string, unknown>, fileUrl
    );
    const certificate = result.submission.status === 'GRADED'
      ? await certificateService.issueCertificateAfterFinalExam(student.id, assessmentId)
      : null;
    sendCreated(res, { ...result, certificate }, result.needsManualGrading
      ? 'Assessment submitted — awaiting instructor grading'
      : `Assessment auto-graded: ${result.autoScore} marks`);
  } catch (err: unknown) {
    if (err instanceof AppError) { sendBadRequest(res, err.message); return; }
    throw err;
  }
};

export const getAssessmentForStudent = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);
  const { id } = req.params;

  const assessment = await academyService.getAssessmentById(id, false);
  if (!assessment.isPublished) { sendBadRequest(res, 'This assessment is not published yet'); return; }
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: student.id, courseId: assessment.module.course.id, accessStatus: { not: 'CANCELLED' } },
  });
  if (!enrollment) { sendNotFound(res, 'Enrollment not found'); return; }
  if (enrollment.accessStatus === 'LOCKED') { sendBadRequest(res, 'Course access is locked. Please pay the remaining balance.'); return; }

  const attemptsUsed = await prisma.assessmentSubmission.count({
    where: { assessmentId: id, studentId: student.id },
  });
  const attemptsLeft = Math.max(0, assessment.attempts - attemptsUsed);
  const lastSubmission = await prisma.assessmentSubmission.findFirst({
    where: { assessmentId: id, studentId: student.id },
    orderBy: { submittedAt: 'desc' },
    select: { id: true, score: true, status: true, attemptNumber: true, submittedAt: true },
  });
  sendSuccess(res, { ...assessment, attemptsUsed, attemptsLeft, lastSubmission });
};

export const getMyGrades = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);
  const grades = await prisma.assessmentSubmission.findMany({
    where: { studentId: student.id, status: 'GRADED' },
    include: { assessment: { select: { title: true, totalMarks: true, passMark: true, type: true } } },
    orderBy: { gradedAt: 'desc' },
  });
  sendSuccess(res, grades);
};

// ── ATTENDANCE ────────────────────────────────────────────────────────────────

export const getMyAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);
  const attendance = await prisma.attendance.findMany({
    where: { studentId: student.id },
    orderBy: { date: 'desc' },
    include: { cohort: { select: { name: true } } },
  });
  sendSuccess(res, attendance);
};

// ── CERTIFICATES ──────────────────────────────────────────────────────────────

export const getMyCertificates = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);
  const certificates = await prisma.certificate.findMany({
    where: { studentId: student.id },
    orderBy: { issuedAt: 'desc' },
  });
  const courses = await prisma.course.findMany({
    where: { id: { in: certificates.map(certificate => certificate.courseId) } },
    select: { id: true, title: true },
  });
  const courseTitles = new Map(courses.map(course => [course.id, course.title]));
  sendSuccess(res, certificates.map(certificate => ({
    ...certificate,
    courseTitle: courseTitles.get(certificate.courseId) || 'Completed Course',
  })));
};

export const getCertificateForEnrollment = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);
  const enrollment = await prisma.enrollment.findFirst({
    where: { id: req.params.enrollmentId, studentId: student.id },
  });
  if (!enrollment) { sendNotFound(res, 'Enrollment not found'); return; }
  const certificate = await prisma.certificate.findFirst({
    where: { studentId: student.id, enrollmentId: enrollment.id },
  });
  if (!certificate) {
    sendBadRequest(res, 'Pass the final examination and complete all course lessons before requesting a certificate');
    return;
  }
  sendSuccess(res, certificate);
};

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

export const getMyNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user!.userId },
      skip, take: limit, orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where: { userId: req.user!.userId } }),
  ]);
  sendSuccess(res, notifications, 'Notifications retrieved', 200, { total, page, limit });
};

export const markNotificationRead = async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, id: req.params.id },
    data: { isRead: true, readAt: new Date() },
  });
  sendSuccess(res, null, 'Notification marked as read');
};

export const markAllNotificationsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, isRead: false },
    data: { isRead: true, readAt: new Date() },
  });
  sendSuccess(res, null, 'All notifications marked as read');
};

// ── SUPPORT TICKETS ───────────────────────────────────────────────────────────

export const createTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);
  const { category, priority, subject, description } = req.body;

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: generateTicketNumber(),
      studentId: student.id,
      submittedBy: req.user!.userId,
      category, priority: priority || 'MEDIUM', subject, description,
    },
  });
  sendCreated(res, ticket, 'Support ticket created');
};

export const getMyTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);
  const tickets = await prisma.supportTicket.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: 'desc' },
    include: { responses: { orderBy: { createdAt: 'asc' } } },
  });
  sendSuccess(res, tickets);
};

export const getStudentDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const student = await getStudentByUserId(req.user!.userId);

  const [enrollments, recentNotifications, pendingApplications] = await Promise.all([
    prisma.enrollment.findMany({
      where: { studentId: student.id, accessStatus: { not: 'CANCELLED' } },
      include: { course: { select: { title: true, code: true, type: true } } },
    }),
    prisma.notification.findMany({
      where: { userId: req.user!.userId, isRead: false },
      take: 5, orderBy: { createdAt: 'desc' },
    }),
    prisma.studentApplication.count({ where: { studentId: student.id, status: 'PENDING' } }),
  ]);

  // Outstanding balances
  const outstandingInvoices = await prisma.invoice.findMany({
    where: { studentId: student.id, status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] } },
    select: { id: true, invoiceNumber: true, outstandingBalance: true, status: true, courseId: true },
  });

  const lockedEnrollments = enrollments.filter(e => e.accessStatus === 'LOCKED');

  sendSuccess(res, {
    student,
    enrollments,
    lockedEnrollments,
    outstandingInvoices,
    pendingApplications,
    unreadNotifications: recentNotifications.length,
    recentNotifications,
  });
};
