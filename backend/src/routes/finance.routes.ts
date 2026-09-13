import { Router } from 'express';
import * as financeController from '../controllers/finance.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { paymentLimiter } from '../middleware/rateLimiter';
import { Role } from '@prisma/client';

const router = Router();

const financeRoles = [Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.FINANCE_OFFICER];
const readRoles = [...financeRoles, Role.AUDITOR];

// Webhook (no auth – validated by signature)
router.post('/payments/webhook', financeController.handleWebhook);

router.use(authenticate);

// Dashboard
router.get('/dashboard', authorize(...readRoles), financeController.getFinanceDashboard);

// Accounts
router.get('/accounts', authorize(...readRoles), financeController.getAccounts);
router.post('/accounts', authorize(...financeRoles), financeController.createAccount);
router.get('/accounts/:id/balance', authorize(...readRoles), financeController.getAccountBalance);
router.get('/accounts/:accountId/cashbook', authorize(...readRoles), financeController.getCashbook);

// Income
router.get('/income', authorize(...readRoles), financeController.getIncome);
router.post('/income', authorize(...financeRoles), financeController.createIncome);

// Expenses
router.get('/expenses', authorize(...readRoles), financeController.getExpenses);
router.post('/expenses', authorize(...financeRoles), financeController.createExpense);
router.post('/expenses/:id/approve', authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.FINANCE_OFFICER), financeController.approveExpense);
router.post('/expenses/:id/pay', authorize(...financeRoles), financeController.payExpense);

// Invoices
router.get('/invoices', authorize(...readRoles), financeController.getInvoices);
router.post('/invoices', authorize(...financeRoles), financeController.createInvoice);
router.get('/invoices/outstanding', authorize(...readRoles), financeController.getOutstandingInvoices);
router.get('/invoices/:id', authorize(...readRoles), financeController.getInvoiceById);

// Payments
router.get('/payments', authorize(...readRoles), financeController.getPayments);
router.post('/payments', paymentLimiter, authorize(...financeRoles), financeController.createPayment);
router.post('/payments/:id/confirm', authorize(...financeRoles), financeController.confirmPayment);

// Transfers
router.get('/transfers', authorize(...readRoles), financeController.getTransfers);
router.post('/transfers', authorize(...financeRoles), financeController.createTransfer);

// Budgets
router.get('/budgets', authorize(...readRoles), financeController.getBudgets);
router.post('/budgets', authorize(...financeRoles), financeController.createBudget);

// Reconciliation
router.get('/reconciliations', authorize(...readRoles), financeController.getReconciliations);
router.post('/reconciliations', authorize(...financeRoles), financeController.createReconciliation);

// Refunds
router.get('/refunds', authorize(...readRoles), financeController.getRefunds);

// Reports
router.get('/reports/income', authorize(...readRoles), financeController.getIncomeReport);
router.get('/reports/expenses', authorize(...readRoles), financeController.getExpenseReport);
router.get('/reports/summary', authorize(...readRoles), financeController.getFinancialSummaryReport);

export default router;
