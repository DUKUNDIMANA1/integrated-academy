import prisma from '../config/database';
import { createAuditLog } from '../utils/auditLog';
import { AppError } from '../middleware/errorHandler';
import { generateInvoiceNumber, generateReceiptNumber } from '../utils/generators';
import { InvoiceStatus, PaymentMethod, IncomeCategory, ExpenseCategory, AccountType, TransactionType } from '@prisma/client';

const toNum = (v: unknown): number => Number(v ?? 0);

export class FinanceService {
  // ── ACCOUNTS ────────────────────────────────────────────────────────────────

  async getAccounts() {
    return prisma.account.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  async createAccount(data: {
    name: string; type: AccountType; currency?: string;
    openingBalance?: number; accountNumber?: string; bankName?: string;
  }) {
    const balance = data.openingBalance || 0;
    return prisma.account.create({
      data: {
        name: data.name,
        type: data.type,
        currency: data.currency || 'RWF',
        openingBalance: balance,
        currentBalance: balance,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
      },
    });
  }

  async getAccountBalance(accountId: string) {
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new AppError('Account not found', 404);
    return account;
  }

  async getBalanceSummary() {
    const accounts = await prisma.account.findMany({ where: { isActive: true } });
    const totalBalance = accounts.reduce((sum, a) => sum + toNum(a.currentBalance), 0);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthIncome, monthExpense] = await Promise.all([
      prisma.income.aggregate({ _sum: { amount: true }, where: { date: { gte: startOfMonth }, status: 'CONFIRMED' } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { date: { gte: startOfMonth }, status: 'PAID' } }),
    ]);

    const [totalIncome, totalExpense] = await Promise.all([
      prisma.income.aggregate({ _sum: { amount: true }, where: { status: 'CONFIRMED' } }),
      prisma.expense.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
    ]);

    const outstandingInvoices = await prisma.invoice.aggregate({
      _sum: { outstandingBalance: true },
      where: { status: { in: [InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE] } },
    });

    return {
      totalBalance,
      accounts,
      monthIncome: monthIncome._sum.amount || 0,
      monthExpense: monthExpense._sum.amount || 0,
      totalIncome: totalIncome._sum.amount || 0,
      totalExpense: totalExpense._sum.amount || 0,
      netResult: toNum(totalIncome._sum.amount) - toNum(totalExpense._sum.amount),
      outstandingBalance: outstandingInvoices._sum.outstandingBalance || 0,
    };
  }

  private async updateAccountBalance(accountId: string, delta: number, type: TransactionType, description: string, relatedId?: string, relatedType?: string, userId?: string) {
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new AppError('Account not found', 404);

    const balanceBefore = toNum(account.currentBalance);
    const balanceAfter = (type === TransactionType.CREDIT || type === TransactionType.TRANSFER_IN)
      ? balanceBefore + delta
      : balanceBefore - delta;

    await prisma.account.update({ where: { id: accountId }, data: { currentBalance: balanceAfter } });
    await prisma.accountTransaction.create({
      data: {
        accountId,
        type,
        amount: delta,
        balanceBefore,
        balanceAfter,
        description,
        relatedId,
        relatedType,
        createdBy: userId,
      },
    });
  }

  // ── INCOME ───────────────────────────────────────────────────────────────────

  async getIncome(page = 1, limit = 20, filters: { category?: IncomeCategory; startDate?: Date; endDate?: Date } = {}) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (filters.category) where.category = filters.category;
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) (where.date as Record<string, unknown>).gte = filters.startDate;
      if (filters.endDate) (where.date as Record<string, unknown>).lte = filters.endDate;
    }

    const [income, total, sum] = await Promise.all([
      prisma.income.findMany({ where, skip, take: limit, orderBy: { date: 'desc' }, include: { account: true } }),
      prisma.income.count({ where }),
      prisma.income.aggregate({ _sum: { amount: true }, where }),
    ]);

    return { income, total, totalAmount: sum._sum.amount || 0 };
  }

  async createIncome(data: {
    category: IncomeCategory; source?: string; description?: string; amount: number;
    currency?: string; method: PaymentMethod; accountId: string; reference?: string;
    studentId?: string; invoiceId?: string; receivedBy?: string;
  }) {
    const income = await prisma.income.create({ data });
    await this.updateAccountBalance(data.accountId, data.amount, TransactionType.CREDIT, `Income: ${data.category}`, income.id, 'Income');
    return income;
  }

  // ── EXPENSES ─────────────────────────────────────────────────────────────────

  async getExpenses(page = 1, limit = 20, filters: { category?: ExpenseCategory; status?: string } = {}) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (filters.category) where.category = filters.category;
    if (filters.status) where.status = filters.status;

    const [expenses, total, sum] = await Promise.all([
      prisma.expense.findMany({ where, skip, take: limit, orderBy: { date: 'desc' }, include: { account: true } }),
      prisma.expense.count({ where }),
      prisma.expense.aggregate({ _sum: { amount: true }, where }),
    ]);

    return { expenses, total, totalAmount: sum._sum.amount || 0 };
  }

  async createExpense(data: {
    category: ExpenseCategory; description?: string; amount: number; currency?: string;
    paidTo?: string; method: PaymentMethod; accountId: string; approvedBy?: string;
  }) {
    return prisma.expense.create({ data });
  }

  async approveExpense(expenseId: string, approvedBy: string) {
    const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense) throw new AppError('Expense not found', 404);

    const updated = await prisma.expense.update({
      where: { id: expenseId },
      data: { status: 'APPROVED', approvedBy },
    });
    return updated;
  }

  async payExpense(expenseId: string) {
    const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense) throw new AppError('Expense not found', 404);
    if (expense.status !== 'APPROVED') throw new AppError('Expense must be approved before payment', 400);

    await prisma.expense.update({ where: { id: expenseId }, data: { status: 'PAID' } });
    await this.updateAccountBalance(expense.accountId, Number(expense.amount), TransactionType.DEBIT, `Expense: ${expense.category}`, expense.id, 'Expense');
    return { message: 'Expense paid' };
  }

  // ── INVOICES ─────────────────────────────────────────────────────────────────

  async getInvoices(page = 1, limit = 20, filters: { status?: InvoiceStatus; studentId?: string } = {}) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.studentId) where.studentId = filters.studentId;

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where, skip, take: limit, orderBy: { issueDate: 'desc' },
        include: { student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } }, course: { select: { title: true } }, payments: true },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { invoices, total };
  }

  async getInvoiceById(id: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        course: { select: { title: true, code: true } },
        payments: true,
        installments: true,
      },
    });
    if (!invoice) throw new AppError('Invoice not found', 404);
    return invoice;
  }

  async createInvoice(data: {
    studentId?: string; courseId?: string; applicationId?: string; clientId?: string;
    consultancyProjectId?: string; subtotal: number; discount?: number; tax?: number;
    dueDate?: Date; notes?: string; createdBy?: string;
  }) {
    const discount = data.discount || 0;
    const tax = data.tax || 0;
    const totalAmount = data.subtotal - discount + tax;

    return prisma.invoice.create({
      data: {
        invoiceNumber: generateInvoiceNumber(),
        studentId: data.studentId,
        courseId: data.courseId,
        applicationId: data.applicationId,
        clientId: data.clientId,
        consultancyProjectId: data.consultancyProjectId,
        subtotal: data.subtotal,
        discount,
        tax,
        totalAmount,
        outstandingBalance: totalAmount,
        dueDate: data.dueDate,
        notes: data.notes,
        createdBy: data.createdBy,
        status: 'UNPAID',
      },
    });
  }

  // ── TRANSFERS ────────────────────────────────────────────────────────────────

  async createTransfer(data: {
    fromAccountId: string; toAccountId: string; amount: number;
    reference?: string; description?: string; processedBy?: string;
  }) {
    const from = await prisma.account.findUnique({ where: { id: data.fromAccountId } });
    if (!from) throw new AppError('Source account not found', 404);
    if (toNum(from.currentBalance) < data.amount) throw new AppError('Insufficient balance in source account', 400);

    const transfer = await prisma.transfer.create({ data });
    // Update balances (transfers are NOT income/expense)
    await this.updateAccountBalance(data.fromAccountId, data.amount, TransactionType.TRANSFER_OUT, `Transfer out: ${data.description || ''}`, transfer.id, 'Transfer');
    await this.updateAccountBalance(data.toAccountId, data.amount, TransactionType.TRANSFER_IN, `Transfer in: ${data.description || ''}`, transfer.id, 'Transfer');

    return transfer;
  }

  async getTransfers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [transfers, total] = await Promise.all([
      prisma.transfer.findMany({ skip, take: limit, orderBy: { transferDate: 'desc' }, include: { fromAccount: true, toAccount: true } }),
      prisma.transfer.count(),
    ]);
    return { transfers, total };
  }

  // ── BUDGETS ───────────────────────────────────────────────────────────────────

  async getBudgets() {
    return prisma.budget.findMany({ orderBy: { createdAt: 'desc' }, include: { items: true } });
  }

  async createBudget(data: {
    name: string; period: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'; startDate: Date; endDate: Date;
    totalAmount: number; currency?: string; category?: string; department?: string;
    items?: Array<{ category: string; description?: string; allocatedAmount: number }>;
  }) {
    const { items, ...budgetData } = data;
    return prisma.budget.create({
      data: {
        ...budgetData,
        items: items ? { create: items.map(i => ({ ...i, variance: -i.allocatedAmount })) } : undefined,
      },
      include: { items: true },
    });
  }

  // ── RECEIPTS ──────────────────────────────────────────────────────────────────

  async createReceipt(paymentId: string, studentId?: string, issuedBy?: string) {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new AppError('Payment not found', 404);

    return prisma.receipt.create({
      data: {
        receiptNumber: generateReceiptNumber(),
        paymentId,
        studentId,
        amount: payment.amount,
        currency: payment.currency,
        issuedBy,
      },
    });
  }

  // ── REPORTS ───────────────────────────────────────────────────────────────────

  async getIncomeReport(startDate: Date, endDate: Date) {
    const [byCategory, total, daily] = await Promise.all([
      prisma.income.groupBy({
        by: ['category'],
        _sum: { amount: true },
        where: { date: { gte: startDate, lte: endDate }, status: 'CONFIRMED' },
      }),
      prisma.income.aggregate({
        _sum: { amount: true },
        where: { date: { gte: startDate, lte: endDate }, status: 'CONFIRMED' },
      }),
      prisma.income.findMany({
        where: { date: { gte: startDate, lte: endDate }, status: 'CONFIRMED' },
        orderBy: { date: 'asc' },
        include: { account: true },
      }),
    ]);
    return { byCategory, totalAmount: total._sum.amount || 0, transactions: daily };
  }

  async getExpenseReport(startDate: Date, endDate: Date) {
    const [byCategory, total, daily] = await Promise.all([
      prisma.expense.groupBy({
        by: ['category'],
        _sum: { amount: true },
        where: { date: { gte: startDate, lte: endDate }, status: 'PAID' },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { date: { gte: startDate, lte: endDate }, status: 'PAID' },
      }),
      prisma.expense.findMany({
        where: { date: { gte: startDate, lte: endDate }, status: 'PAID' },
        orderBy: { date: 'asc' },
        include: { account: true },
      }),
    ]);
    return { byCategory, totalAmount: total._sum.amount || 0, transactions: daily };
  }

  async getOutstandingInvoices() {
    return prisma.invoice.findMany({
      where: { status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] } },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        course: { select: { title: true } },
      },
      orderBy: { issueDate: 'asc' },
    });
  }

  async getCashbook(accountId: string, startDate?: Date, endDate?: Date) {
    const where: Record<string, unknown> = { accountId };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) (where.createdAt as Record<string, unknown>).gte = startDate;
      if (endDate) (where.createdAt as Record<string, unknown>).lte = endDate;
    }
    return prisma.accountTransaction.findMany({ where, orderBy: { createdAt: 'asc' } });
  }

  async getReconciliations() {
    return prisma.reconciliation.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createReconciliation(data: {
    accountId: string; period: string; externalBalance: number;
  }) {
    const account = await prisma.account.findUnique({ where: { id: data.accountId } });
    if (!account) throw new AppError('Account not found', 404);
    const systemBalance = Number(account.currentBalance);
    const difference = systemBalance - data.externalBalance;

    return prisma.reconciliation.create({
      data: {
        accountId: data.accountId,
        period: data.period,
        systemBalance,
        externalBalance: data.externalBalance,
        difference,
        status: Math.abs(difference) < 0.01 ? 'COMPLETED' : 'FLAGGED',
      },
    });
  }

  async getRefunds(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [refunds, total] = await Promise.all([
      prisma.refund.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.refund.count(),
    ]);
    return { refunds, total };
  }
}

export default new FinanceService();
