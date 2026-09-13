import prisma from '../config/database';
import { createAuditLog } from '../utils/auditLog';
import { createNotification } from '../utils/notifications';
import { AppError } from '../middleware/errorHandler';
import { AccessStatus, NotificationType, PaymentAccessEventType } from '@prisma/client';
import { addDays } from 'date-fns';

export class EnrollmentService {
  async enrollStudent(applicationId: string, invoiceId: string): Promise<void> {
    const application = await prisma.studentApplication.findUnique({
      where: { id: applicationId },
      include: { student: { include: { user: true } }, course: true, cohort: true },
    });
    if (!application) throw new AppError('Application not found', 404);

    // Avoid duplicate enrollment
    const existing = await prisma.enrollment.findUnique({ where: { applicationId } });
    if (existing) return;

    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: application.studentId,
        courseId: application.courseId,
        cohortId: application.cohortId,
        applicationId,
        accessStatus: AccessStatus.ACTIVE,
      },
    });

    // Update application status
    await prisma.studentApplication.update({
      where: { id: applicationId },
      data: { status: 'ENROLLED' },
    });

    // Log access event
    await prisma.paymentAccessEvent.create({
      data: {
        enrollmentId: enrollment.id,
        studentId: application.studentId,
        courseId: application.courseId,
        eventType: PaymentAccessEventType.ENROLLED,
        previousStatus: AccessStatus.ACTIVE,
        newStatus: AccessStatus.ACTIVE,
        notes: 'Student enrolled after successful payment',
      },
    });

    await createNotification({
      userId: application.student.userId,
      type: NotificationType.APPLICATION_CONFIRMED,
      title: 'Enrollment Confirmed!',
      message: `You have been successfully enrolled in ${application.course.title}. Start learning now!`,
      data: { courseId: application.courseId, enrollmentId: enrollment.id },
    });

    await createAuditLog({
      userId: application.student.userId,
      action: 'ENROLL',
      entity: 'Enrollment',
      entityId: enrollment.id,
      after: { courseId: application.courseId, status: 'ENROLLED' },
    });
  }

  async lockEnrollment(enrollmentId: string, reason = 'Outstanding balance unpaid at checkpoint'): Promise<void> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: { include: { user: true } }, course: true },
    });
    if (!enrollment) throw new AppError('Enrollment not found', 404);
    if (enrollment.accessStatus === AccessStatus.LOCKED) return; // Already locked – idempotent

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        accessStatus: AccessStatus.LOCKED,
        accessLockedAt: new Date(),
        lockReason: reason,
      },
    });

    await prisma.paymentAccessEvent.create({
      data: {
        enrollmentId,
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        eventType: PaymentAccessEventType.LOCKED,
        previousStatus: AccessStatus.ACTIVE,
        newStatus: AccessStatus.LOCKED,
        notes: reason,
      },
    });

    // Get outstanding balance
    const invoice = await prisma.invoice.findFirst({
      where: { applicationId: enrollment.applicationId! },
    });

    await createNotification({
      userId: enrollment.student.userId,
      type: NotificationType.COURSE_ACCESS_LOCKED,
      title: 'Course Access Locked',
      message: `Your access to "${enrollment.course.title}" has been temporarily locked due to an unpaid balance of ${invoice?.outstandingBalance || 0} RWF. Please pay to continue.`,
      data: {
        courseId: enrollment.courseId,
        enrollmentId,
        outstandingBalance: invoice?.outstandingBalance,
        invoiceId: invoice?.id,
      },
    });

    await createAuditLog({
      action: 'LOCK_ACCESS',
      entity: 'Enrollment',
      entityId: enrollmentId,
      before: { accessStatus: 'ACTIVE' },
      after: { accessStatus: 'LOCKED', reason },
    });
  }

  async unlockEnrollment(enrollmentId: string, paymentReference?: string, amount?: number): Promise<void> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: { include: { user: true } }, course: true },
    });
    if (!enrollment) throw new AppError('Enrollment not found', 404);

    const prevStatus = enrollment.accessStatus;

    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        accessStatus: AccessStatus.ACTIVE,
        accessUnlockedAt: new Date(),
        lockReason: null,
      },
    });

    await prisma.paymentAccessEvent.create({
      data: {
        enrollmentId,
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        eventType: PaymentAccessEventType.UNLOCKED,
        previousStatus: prevStatus,
        newStatus: AccessStatus.ACTIVE,
        paymentReference,
        amount: amount ? amount : undefined,
        notes: 'Access restored after full payment',
      },
    });

    await createNotification({
      userId: enrollment.student.userId,
      type: NotificationType.COURSE_ACCESS_UNLOCKED,
      title: 'Course Access Restored!',
      message: `Your access to "${enrollment.course.title}" has been fully restored. Continue learning!`,
      data: { courseId: enrollment.courseId, enrollmentId, paymentReference },
    });

    await createAuditLog({
      action: 'UNLOCK_ACCESS',
      entity: 'Enrollment',
      entityId: enrollmentId,
      before: { accessStatus: prevStatus },
      after: { accessStatus: 'ACTIVE', paymentReference },
    });
  }

  async sendPaymentReminder(enrollmentId: string, daysUntilCheckpoint: number): Promise<void> {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { student: { include: { user: true } }, course: true },
    });
    if (!enrollment) return;

    const invoice = await prisma.invoice.findFirst({
      where: { applicationId: enrollment.applicationId! },
    });
    if (!invoice || Number(invoice.outstandingBalance) <= 0) return;

    // Idempotency: check if reminder already sent today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingReminder = await prisma.paymentAccessEvent.findFirst({
      where: {
        enrollmentId,
        eventType: PaymentAccessEventType.REMINDER_SENT,
        createdAt: { gte: today },
        notes: { contains: `${daysUntilCheckpoint} day` },
      },
    });
    if (existingReminder) return; // Already sent

    await createNotification({
      userId: enrollment.student.userId,
      type: NotificationType.PAYMENT_REMINDER,
      title: 'Payment Reminder',
      message: `Your course "${enrollment.course.title}" has an outstanding balance of ${invoice.outstandingBalance} RWF. You have ${daysUntilCheckpoint} day(s) remaining before your access is locked.`,
      data: {
        courseId: enrollment.courseId,
        enrollmentId,
        outstandingBalance: invoice.outstandingBalance,
        invoiceId: invoice.id,
        daysUntilLock: daysUntilCheckpoint,
      },
    });

    await prisma.paymentAccessEvent.create({
      data: {
        enrollmentId,
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        eventType: PaymentAccessEventType.REMINDER_SENT,
        previousStatus: enrollment.accessStatus,
        newStatus: enrollment.accessStatus,
        notes: `${daysUntilCheckpoint} day reminder sent`,
      },
    });
  }

  async checkAccess(enrollmentId: string): Promise<{ hasAccess: boolean; status: AccessStatus; lockReason?: string | null }> {
    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) throw new AppError('Enrollment not found', 404);
    return {
      hasAccess: enrollment.accessStatus === AccessStatus.ACTIVE,
      status: enrollment.accessStatus,
      lockReason: enrollment.lockReason,
    };
  }

  async getPaymentStatus(enrollmentId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: true },
    });
    if (!enrollment) throw new AppError('Enrollment not found', 404);

    const invoice = await prisma.invoice.findFirst({
      where: { applicationId: enrollment.applicationId! },
      include: { installments: true },
    });

    const installment = invoice?.installments[0];
    const checkpointDate = enrollment.enrolledAt
      ? addDays(enrollment.enrolledAt, enrollment.course.partialPaymentLockDays)
      : null;

    return {
      enrollmentId,
      courseId: enrollment.courseId,
      accessStatus: enrollment.accessStatus,
      paidAmount: invoice?.paidAmount || 0,
      totalAmount: invoice?.totalAmount || 0,
      outstandingBalance: invoice?.outstandingBalance || 0,
      invoiceStatus: invoice?.status,
      invoiceId: invoice?.id,
      checkpointDate,
      enrolledAt: enrollment.enrolledAt,
    };
  }

  /**
   * Run daily: check all ACTIVE partial-pay enrollments for overdue checkpoints
   * This method is IDEMPOTENT – safe to run multiple times
   */
  async runDailyCheckpointCheck(): Promise<{ locked: number; reminded: number }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all ACTIVE enrollments with a partial-pay invoice
    const activeEnrollments = await prisma.enrollment.findMany({
      where: { accessStatus: AccessStatus.ACTIVE },
      include: { course: true, student: { include: { user: true } } },
    });

    let locked = 0;
    let reminded = 0;

    for (const enrollment of activeEnrollments) {
      if (!enrollment.applicationId) continue;

      const invoice = await prisma.invoice.findFirst({
        where: { applicationId: enrollment.applicationId },
      });

      if (!invoice || Number(invoice.outstandingBalance) <= 0) continue;

      const checkpointDate = addDays(enrollment.enrolledAt, enrollment.course.partialPaymentLockDays);
      const daysUntilCheckpoint = Math.ceil((checkpointDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilCheckpoint <= 0) {
        // Checkpoint passed – lock access
        await this.lockEnrollment(enrollment.id);
        // Update installment status
        await prisma.paymentInstallment.updateMany({
          where: { invoiceId: invoice.id, status: { not: 'PAID' } },
          data: { status: 'OVERDUE' },
        });
        // Mark invoice as OVERDUE if still PARTIALLY_PAID
        if (invoice.status === 'PARTIALLY_PAID') {
          await prisma.invoice.update({ where: { id: invoice.id }, data: { status: 'OVERDUE' } });
        }
        locked++;
      } else if (daysUntilCheckpoint <= 2) {
        // Day 13 / Day 14 reminder
        await this.sendPaymentReminder(enrollment.id, daysUntilCheckpoint);
        reminded++;
      }
    }

    return { locked, reminded };
  }
}

export default new EnrollmentService();
