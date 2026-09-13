import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Role } from '@prisma/client';

const router = Router();

const adminRoles = [Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.ACADEMY_MANAGER, Role.SALES_ADMISSIONS];
const financeAdminRoles = [Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.FINANCE_OFFICER];
const superAdminRoles = [Role.SUPER_ADMIN, Role.GENERAL_MANAGER];

router.use(authenticate);

router.get('/dashboard', authorize(...adminRoles), adminController.getAdminDashboard);
router.get('/stats', authorize(...superAdminRoles), adminController.getSystemStats);

// Applications
router.get('/applications', authorize(...adminRoles), adminController.getAllApplications);
router.get('/applications/:id', authorize(...adminRoles), adminController.getApplicationById);
router.post('/applications/:id/confirm', authorize(Role.SUPER_ADMIN, Role.ACADEMY_MANAGER, Role.SALES_ADMISSIONS), adminController.confirmApplication);
router.post('/applications/:id/reject', authorize(Role.SUPER_ADMIN, Role.ACADEMY_MANAGER, Role.SALES_ADMISSIONS), adminController.rejectApplication);

// Audit
router.get('/audit-logs', authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.AUDITOR), adminController.getAuditLogs);

export default router;
