import { Router } from 'express';
import * as hrController from '../controllers/hr.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Role } from '@prisma/client';

const router = Router();

const hrRoles = [Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.HR_OFFICER];
const readRoles = [...hrRoles, Role.AUDITOR];

router.use(authenticate);

router.get('/summary', authorize(...readRoles), hrController.getHRSummary);

router.get('/departments', authorize(...readRoles), hrController.getDepartments);
router.post('/departments', authorize(...hrRoles), hrController.createDepartment);
router.put('/departments/:id', authorize(...hrRoles), hrController.updateDepartment);

router.get('/employees', authorize(...readRoles), hrController.getEmployees);
router.get('/employees/:id', authorize(...readRoles), hrController.getEmployeeById);
router.post('/employees', authorize(...hrRoles), hrController.createEmployee);
router.put('/employees/:id', authorize(...hrRoles), hrController.updateEmployee);
router.patch('/employees/:id/toggle-active', authorize(...hrRoles), hrController.toggleEmployeeActive);
router.delete('/employees/:id', authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER), hrController.deleteEmployee);

router.get('/leave-requests', authorize(...hrRoles), hrController.getLeaveRequests);
router.post('/leave-requests', authenticate, hrController.createLeaveRequest);
router.put('/leave-requests/:id/status', authorize(...hrRoles), hrController.updateLeaveStatus);

export default router;
