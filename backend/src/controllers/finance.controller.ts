import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated, sendNotFound } from '../utils/response';
import financeService from '../services/finance.service';
import paymentService from '../services/payment.service';
import { IncomeCategory, ExpenseCategory, AccountType, PaymentMethod, InvoiceStatus, PaymentStatus } from '@prisma/client';

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

export const getFinanceDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const summary = await financeService.getBalanceSummary();
  sendSuccess(res, summary);
};

// ── ACCOUNTS ─────────────────────────────────────────────────────────────────

export const getAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  const accounts = await financeService.getAccounts();
  sendSuccess(res, accounts);
};

export const createAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const account = await financeService.createAccount(req.body);
  sendCreated(res, account, 'Account created');
};

export const getAccountBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  const account = await financeService.getAccountBalance(req.params.id);
  sendSuccess(res, account);
};

export const getCashbook = async (req: AuthRequest, res: Response): Promise<void> => {
  const { accountId } = req.params;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  const entries = await financeService.getCashbook(accountId, startDate, endDate);
  sendSuccess(res, entries);
};

// ── INCOME ────────────────────────────────────────────────────────────────────

export const getIncome = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const category = req.query.category as IncomeCategory | undefined;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  const result = await financeService.getIncome(page, limit, { category, startDate, endDate });
  sendSuccess(res, result.income, 'Income retrieved', 200, { total: result.total, totalAmount: result.totalAmount });
};

export const createIncome = async (req: AuthRequest, res: Response): Promise<void> => {
  const income = await financeService.createIncome({ ...req.body, receivedBy: req.user!.userId });
  sendCreated(res, income, 'Income recorded');
};

// ── EXPENSES ──────────────────────────────────────────────────────────────────

export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const category = req.query.category as ExpenseCategory | undefined;
  const status = req.query.status as string | undefined;
  const result = await financeService.getExpenses(page, limit, { category, status });
  sendSuccess(res, result.expenses, 'Expenses retrieved', 200, { total: result.total, totalAmount: result.totalAmount });
};

export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  const expense = await financeService.createExpense(req.body);
  sendCreated(res, expense, 'Expense recorded');
};

export const approveExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  const expense = await financeService.approveExpense(req.params.id, req.user!.userId);
  sendSuccess(res, expense, 'Expense approved');
};

export const payExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await financeService.payExpense(req.params.id);
  sendSuccess(res, result, 'Expense paid');
};

// ── INVOICES ──────────────────────────────────────────────────────────────────

export const getInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as InvoiceStatus | undefined;
  const studentId = req.query.studentId as string | undefined;
  const result = await financeService.getInvoices(page, limit, { status, studentId });
  sendSuccess(res, result.invoices, 'Invoices retrieved', 200, { total: result.total, page, limit });
};

export const getInvoiceById = async (req: AuthRequest, res: Response): Promise<void> => {
  const invoice = await financeService.getInvoiceById(req.params.id);
  sendSuccess(res, invoice);
};

export const createInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  const invoice = await financeService.createInvoice({ ...req.body, createdBy: req.user!.userId });
  sendCreated(res, invoice, 'Invoice created');
};

export const getOutstandingInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  const invoices = await financeService.getOutstandingInvoices();
  sendSuccess(res, invoices);
};

// ── PAYMENTS ──────────────────────────────────────────────────────────────────

export const getPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const status = req.query.status as PaymentStatus | undefined;
  const studentId = req.query.studentId as string | undefined;
  const result = await paymentService.getPayments(page, limit, { status, studentId });
  sendSuccess(res, result.payments, 'Payments retrieved', 200, { total: result.total, page, limit });
};

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const payment = await paymentService.initiatePayment(req.body);
  sendCreated(res, payment, 'Payment initiated');
};

export const confirmPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  await paymentService.confirmPayment(req.params.id, req.user!.userId);
  sendSuccess(res, null, 'Payment confirmed');
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  await paymentService.handleWebhook(req.body);
  sendSuccess(res, null, 'Webhook processed');
};

// ── TRANSFERS ─────────────────────────────────────────────────────────────────

export const getTransfers = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await financeService.getTransfers(page, limit);
  sendSuccess(res, result.transfers, 'Transfers retrieved', 200, { total: result.total });
};

export const createTransfer = async (req: AuthRequest, res: Response): Promise<void> => {
  const transfer = await financeService.createTransfer({ ...req.body, processedBy: req.user!.userId });
  sendCreated(res, transfer, 'Transfer completed');
};

// ── BUDGETS ───────────────────────────────────────────────────────────────────

export const getBudgets = async (req: AuthRequest, res: Response): Promise<void> => {
  const budgets = await financeService.getBudgets();
  sendSuccess(res, budgets);
};

export const createBudget = async (req: AuthRequest, res: Response): Promise<void> => {
  const budget = await financeService.createBudget(req.body);
  sendCreated(res, budget, 'Budget created');
};

// ── RECONCILIATION ────────────────────────────────────────────────────────────

export const getReconciliations = async (req: AuthRequest, res: Response): Promise<void> => {
  const recons = await financeService.getReconciliations();
  sendSuccess(res, recons);
};

export const createReconciliation = async (req: AuthRequest, res: Response): Promise<void> => {
  const recon = await financeService.createReconciliation(req.body);
  sendCreated(res, recon, 'Reconciliation created');
};

// ── REFUNDS ───────────────────────────────────────────────────────────────────

export const getRefunds = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await financeService.getRefunds(page, limit);
  sendSuccess(res, result.refunds, 'Refunds retrieved', 200, { total: result.total });
};

// ── REPORTS ───────────────────────────────────────────────────────────────────

export const getIncomeReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const startDate = new Date(req.query.startDate as string || new Date(new Date().getFullYear(), 0, 1));
  const endDate = new Date(req.query.endDate as string || new Date());
  const report = await financeService.getIncomeReport(startDate, endDate);
  sendSuccess(res, report);
};

export const getExpenseReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const startDate = new Date(req.query.startDate as string || new Date(new Date().getFullYear(), 0, 1));
  const endDate = new Date(req.query.endDate as string || new Date());
  const report = await financeService.getExpenseReport(startDate, endDate);
  sendSuccess(res, report);
};

export const getFinancialSummaryReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const startDate = new Date(req.query.startDate as string || new Date(new Date().getFullYear(), 0, 1));
  const endDate = new Date(req.query.endDate as string || new Date());

  const [incomeReport, expenseReport, outstanding] = await Promise.all([
    financeService.getIncomeReport(startDate, endDate),
    financeService.getExpenseReport(startDate, endDate),
    financeService.getOutstandingInvoices(),
  ]);

  const netResult = Number(incomeReport.totalAmount) - Number(expenseReport.totalAmount);
  const totalOutstanding = outstanding.reduce((sum, inv) => sum + Number(inv.outstandingBalance), 0);

  sendSuccess(res, {
    period: { startDate, endDate },
    totalIncome: incomeReport.totalAmount,
    totalExpenses: expenseReport.totalAmount,
    netResult,
    totalOutstanding,
    incomeByCategory: incomeReport.byCategory,
    expenseByCategory: expenseReport.byCategory,
  });
};
