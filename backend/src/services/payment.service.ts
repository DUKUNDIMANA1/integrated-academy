import prisma from '../config/database';
import { createAuditLog } from '../utils/auditLog';
import { createNotification } from '../utils/notifications';
import { AppError } from '../middleware/errorHandler';
import { generatePaymentNumber } from '../utils/generators';
import enrollmentService from './enrollment.service';
import financeService from './finance.service';
import { PaymentMethod, PaymentStatus, InvoiceStatus, IncomeCategory, NotificationType } from '@prisma/client';
import { addDays } from 'date-fns';

const toNum = (v: unknown): number => Number(v ?? 0);

export class PaymentService {
  async initiatePayment(data: {
    invoiceId: string; amount: number; method: PaymentMethod;
    reference?: string; studentId?: string; accountId?: string; notes?: string;
  }) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      include: { course: true },
    });
    if (!invoice) throw new AppError('Invoice not found', 404);
    if (invoice.status === InvoiceStatus.FULLY_PAID) throw new AppError('Invoice is already fully paid', 400);
    if (invoice.status === InvoiceStatus.CANCELLED) throw new AppError('Invoice is cancelled', 400);

    if (data.amount > Number(invoice.outstandingBalance)) {
      throw new AppError(`Amount exceeds outstanding balance of ${invoice.outstandingBalance}`, 400);
    }

    // Prevent duplicate reference
    if (data.reference) {
      const dup = await prisma.payment.findUnique({ where: { reference: data.reference } });
      if (dup) throw new AppError('Duplicate payment reference', 409);
    }

    const payment = await prisma.payment.create({
      data: {
        paymentNumber: generatePaymentNumber(),
        invoiceId: data.invoiceId,
        studentId: data.studentId,
        amount: data.amount,
        method: data.method,
        status: PaymentStatus.PENDING,
        reference: data.reference,
        accountId: data.accountId,
        notes: data.notes,
      },
    });

    return payment;
  }

  async confirmPayment(paymentId: string, processedBy?: string): Promise<void> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: { include: { course: true } } },
    });
    if (!payment) throw new AppError('Payment not found', 404);
    if (payment.status === PaymentStatus.CONFIRMED) return; // Idempotent

    const invoice = payment.invoice;
    const newPaidAmount = toNum(invoice.paidAmount) + toNum(payment.amount);
    const newOutstanding = toNum(invoice.totalAmount) - newPaidAmount;

    // Determine new invoice status
    let newInvoiceStatus: InvoiceStatus;
    if (newOutstanding <= 0) {
      newInvoiceStatus = InvoiceStatus.FULLY_PAID;
    } else {
      newInvoiceStatus = InvoiceStatus.PARTIALLY_PAID;
    }

    // Update payment
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: PaymentStatus.CONFIRMED, processedBy, processedAt: new Date() },
    });

    // Update invoice
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paidAmount: newPaidAmount,
        outstandingBalance: Math.max(0, newOutstanding),
        status: newInvoiceStatus,
      },
    });

    // Create installment record
    const installmentCount = await prisma.paymentInstallment.count({ where: { invoiceId: invoice.id } });
    const checkpointDate = invoice.course
      ? addDays(new Date(), invoice.course.partialPaymentLockDays)
      : undefined;

    await prisma.paymentInstallment.create({
      data: {
        invoiceId: invoice.id,
        paymentId,
        installmentNumber: installmentCount + 1,
        amountDue: Number(payment.amount),
        amountPaid: Number(payment.amount),
        remainingBalance: Math.max(0, newOutstanding),
        dueDate: invoice.dueDate || new Date(),
        checkpointDate: installmentCount === 0 ? checkpointDate : undefined,
        status: 'PAID',
      },
    });

    // Record income
    if (invoice.studentId) {
      await financeService.createIncome({
        category: IncomeCategory.COURSE_FEE,
        source: 'Student Payment',
        description: `Payment for invoice ${invoice.invoiceNumber}`,
        amount: Number(payment.amount),
        method: payment.method,
        accountId: payment.accountId || await this.getDefaultAccountId(),
        reference: payment.reference || payment.paymentNumber,
        studentId: invoice.studentId,
        invoiceId: invoice.id,
      });
    }

    // Create receipt
    await financeService.createReceipt(paymentId, invoice.studentId || undefined, processedBy);

    // Auto-enroll or unlock on first payment or full payment
    if (invoice.applicationId) {
      const enrollment = await prisma.enrollment.findUnique({ where: { applicationId: invoice.applicationId } });

      if (!enrollment) {
        // First time: auto-enroll
        await enrollmentService.enrollStudent(invoice.applicationId, invoice.id);
      } else if (newInvoiceStatus === InvoiceStatus.FULLY_PAID && enrollment.accessStatus === 'LOCKED') {
        // Remaining balance paid: auto-unlock
        await enrollmentService.unlockEnrollment(enrollment.id, payment.reference || payment.paymentNumber, Number(payment.amount));
      }
    }

    // Notify student
    if (invoice.studentId) {
      const student = await prisma.student.findUnique({ where: { id: invoice.studentId }, include: { user: true } });
      if (student) {
        await createNotification({
          userId: student.userId,
          type: NotificationType.PAYMENT_SUCCESS,
          title: 'Payment Confirmed',
          message: `Your payment of ${toNum(payment.amount)} RWF has been confirmed. ${newInvoiceStatus === InvoiceStatus.FULLY_PAID ? 'Your invoice is now fully paid.' : `Outstanding balance: ${Math.max(0, newOutstanding)} RWF.`}`,
          data: { paymentId, invoiceId: invoice.id, amount: toNum(payment.amount), outstandingBalance: Math.max(0, newOutstanding) },
        });
      }
    }

    await createAuditLog({
      userId: processedBy,
      action: 'CONFIRM_PAYMENT',
      entity: 'Payment',
      entityId: paymentId,
      before: { status: 'PENDING' },
      after: { status: 'CONFIRMED', amount: toNum(payment.amount), invoiceStatus: newInvoiceStatus },
    });
  }

  async handleWebhook(payload: { reference: string; status: 'success' | 'failed'; amount: number }) {
    const payment = await prisma.payment.findUnique({ where: { reference: payload.reference } });
    if (!payment) throw new AppError('Payment not found for this reference', 404);

    if (payload.status === 'success') {
      await this.confirmPayment(payment.id, 'GATEWAY_WEBHOOK');
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
    }
  }

  private async getDefaultAccountId(): Promise<string> {
    const account = await prisma.account.findFirst({ where: { isActive: true, type: 'CASH' } });
    if (!account) throw new AppError('No active account found', 500);
    return account.id;
  }

  async getPayments(page = 1, limit = 20, filters: { status?: PaymentStatus; studentId?: string } = {}) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.studentId) where.studentId = filters.studentId;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          invoice: { select: { invoiceNumber: true, totalAmount: true } },
          student: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      }),
      prisma.payment.count({ where }),
    ]);
    return { payments, total };
  }

  async getStudentPaymentStatus(enrollmentId: string) {
    return enrollmentService.getPaymentStatus(enrollmentId);
  }
}

export default new PaymentService();
