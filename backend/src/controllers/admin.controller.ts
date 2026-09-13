import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated, sendNotFound, sendBadRequest } from '../utils/response';
import prisma from '../config/database';
import financeService from '../services/finance.service';
import { createAuditLog } from '../utils/auditLog';
import { createNotification } from '../utils/notifications';
import { NotificationType } from '@prisma/client';

// ── APPLICATIONS MANAGEMENT ───────────────────────────────────────────────────

export const getAllApplications = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.student = {
      user: {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      },
    };
  }

  const [applications, total] = await Promise.all([
    prisma.studentApplication.findMany({
      where, skip, take: limit, orderBy: { createdAt: 'desc' },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } },
        course: { select: { title: true, code: true, fee: true, currency: true } },
        cohort: { select: { name: true, startDate: true } },
      },
    }),
    prisma.studentApplication.count({ where }),
  ]);

  sendSuccess(res, applications, 'Applications retrieved', 200, { total, page, limit });
};

export const getApplicationById = async (req: AuthRequest, res: Response): Promise<void> => {
  const app = await prisma.studentApplication.findUnique({
    where: { id: req.params.id },
    include: {
      student: { include: { user: true } },
      course: true,
      cohort: true,
      invoice: { include: { payments: true } },
      enrollment: true,
    },
  });
  if (!app) { sendNotFound(res, 'Application not found'); return; }
  sendSuccess(res, app);
};

export const confirmApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const app = await prisma.studentApplication.findUnique({
    where: { id },
    include: { student: { include: { user: true } }, course: true },
  });
  if (!app) { sendNotFound(res, 'Application not found'); return; }
  if (app.status !== 'PENDING') { sendBadRequest(res, `Cannot confirm application in ${app.status} status`); return; }

  // Update application status
  await prisma.studentApplication.update({
    where: { id },
    data: { status: 'CONFIRMED', reviewedBy: req.user!.userId, reviewedAt: new Date() },
  });

  // Auto-generate invoice
  const invoice = await financeService.createInvoice({
    studentId: app.studentId,
    courseId: app.courseId,
    applicationId: id,
    subtotal: Number(app.course.fee),
    dueDate: app.course.endDate || undefined,
    createdBy: req.user!.userId,
    notes: `Course fee for ${app.course.title}`,
  });

  // Notify student
  await createNotification({
    userId: app.student.userId,
    type: NotificationType.APPLICATION_CONFIRMED,
    title: 'Application Approved!',
    message: `Your application for "${app.course.title}" has been approved. Invoice #${invoice.invoiceNumber} has been created. Please proceed with payment.`,
    data: { applicationId: id, invoiceId: invoice.id, courseId: app.courseId },
  });

  await createAuditLog({
    userId: req.user!.userId, action: 'CONFIRM_APPLICATION',
    entity: 'StudentApplication', entityId: id,
    before: { status: 'PENDING' }, after: { status: 'CONFIRMED', invoiceId: invoice.id },
  });

  sendSuccess(res, { application: { id, status: 'CONFIRMED' }, invoice }, 'Application confirmed and invoice generated');
};

export const rejectApplication = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { reason } = req.body;
  if (!reason) { sendBadRequest(res, 'Rejection reason is required'); return; }

  const app = await prisma.studentApplication.findUnique({
    where: { id },
    include: { student: { include: { user: true } }, course: true },
  });
  if (!app) { sendNotFound(res, 'Application not found'); return; }
  if (!['PENDING', 'CONFIRMED'].includes(app.status)) {
    sendBadRequest(res, `Cannot reject application in ${app.status} status`); return;
  }

  await prisma.studentApplication.update({
    where: { id },
    data: { status: 'REJECTED', rejectionReason: reason, reviewedBy: req.user!.userId, reviewedAt: new Date() },
  });

  await createNotification({
    userId: app.student.userId,
    type: NotificationType.APPLICATION_REJECTED,
    title: 'Application Update',
    message: `Your application for "${app.course.title}" was not approved. Reason: ${reason}`,
    data: { applicationId: id, reason },
  });

  await createAuditLog({
    userId: req.user!.userId, action: 'REJECT_APPLICATION',
    entity: 'StudentApplication', entityId: id,
    before: { status: app.status }, after: { status: 'REJECTED', reason },
  });

  sendSuccess(res, null, 'Application rejected');
};

// ── ADMIN DASHBOARD ───────────────────────────────────────────────────────────

export const getAdminDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalStudents, totalCourses, pendingApplications, activeEnrollments,
    monthlyIncome, monthlyExpense, outstandingBalance,
    recentApplications, lockedEnrollments
  ] = await Promise.all([
    prisma.student.count(),
    prisma.course.count({ where: { status: 'PUBLISHED' } }),
    prisma.studentApplication.count({ where: { status: 'PENDING' } }),
    prisma.enrollment.count({ where: { accessStatus: 'ACTIVE' } }),
    prisma.income.aggregate({ _sum: { amount: true }, where: { date: { gte: startOfMonth }, status: 'CONFIRMED' } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: startOfMonth }, status: 'PAID' } }),
    prisma.invoice.aggregate({ _sum: { outstandingBalance: true }, where: { status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] } } }),
    prisma.studentApplication.findMany({
      take: 10, orderBy: { createdAt: 'desc' },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        course: { select: { title: true } },
      },
    }),
    prisma.enrollment.count({ where: { accessStatus: 'LOCKED' } }),
  ]);

  sendSuccess(res, {
    stats: {
      totalStudents, totalCourses, pendingApplications, activeEnrollments, lockedEnrollments,
      monthlyIncome: monthlyIncome._sum.amount || 0,
      monthlyExpense: monthlyExpense._sum.amount || 0,
      outstandingBalance: outstandingBalance._sum.outstandingBalance || 0,
    },
    recentApplications,
  });
};

// ── AUDIT LOGS ────────────────────────────────────────────────────────────────

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;
  const entity = req.query.entity as string | undefined;
  const userId = req.query.userId as string | undefined;

  const where: Record<string, unknown> = {};
  if (entity) where.entity = entity;
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where, skip, take: limit, orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  sendSuccess(res, logs, 'Audit logs retrieved', 200, { total, page, limit });
};

// ── SETTINGS ──────────────────────────────────────────────────────────────────

export const getSystemStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const [users, students, courses, enrollments, invoices, tickets] = await Promise.all([
    prisma.user.count(),
    prisma.student.count(),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.invoice.count(),
    prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
  ]);
  sendSuccess(res, { users, students, courses, enrollments, invoices, openTickets: tickets });
};
