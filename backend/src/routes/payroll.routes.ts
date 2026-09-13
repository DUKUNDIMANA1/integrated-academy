import { Router } from 'express';
import * as payrollController from '../controllers/payroll.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Role } from '@prisma/client';

const router = Router();
const financeRoles = [Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.FINANCE_OFFICER];
const readRoles = [...financeRoles, Role.HR_OFFICER, Role.AUDITOR];

router.use(authenticate);

router.get('/summary', authorize(...readRoles), payrollController.getPayrollSummary);
router.get('/periods', authorize(...readRoles), payrollController.getPayrollPeriods);
router.post('/periods', authorize(...financeRoles), payrollController.createPayrollPeriod);
router.post('/periods/:id/process', authorize(...financeRoles), payrollController.processPayroll);
router.post('/periods/:id/approve', authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER), payrollController.approvePayroll);
router.get('/periods/:id/payslips', authorize(...readRoles), payrollController.getPayslips);

export default router;
