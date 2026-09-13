import { Router } from 'express';
import * as ledgerController from '../controllers/ledger.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Role } from '@prisma/client';

const router = Router();
const financeRoles = [Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.FINANCE_OFFICER];
const readRoles = [...financeRoles, Role.AUDITOR];

router.use(authenticate);

// Chart of Accounts
router.get('/accounts', authorize(...readRoles), ledgerController.getChartOfAccounts);
router.post('/accounts', authorize(...financeRoles), ledgerController.createAccount);
router.put('/accounts/:id', authorize(...financeRoles), ledgerController.updateAccount);

// Journal Entries
router.get('/journal', authorize(...readRoles), ledgerController.getJournalEntries);
router.post('/journal', authorize(...financeRoles), ledgerController.createJournalEntry);

// General Ledger
router.get('/ledger/:accountId', authorize(...readRoles), ledgerController.getGeneralLedger);
router.get('/trial-balance', authorize(...readRoles), ledgerController.getTrialBalance);

// Tax
router.get('/tax', authorize(...readRoles), ledgerController.getTaxRecords);
router.post('/tax', authorize(...financeRoles), ledgerController.createTaxRecord);
router.put('/tax/:id', authorize(...financeRoles), ledgerController.updateTaxRecord);

export default router;
