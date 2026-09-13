import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { authLimiter } from '../middleware/rateLimiter';
import { Role } from '@prisma/client';

const router = Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);

router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, authController.changePassword);

// Admin user management
router.get('/users', authenticate, authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.HR_OFFICER, Role.ACADEMY_MANAGER), authController.getUsers);
router.post('/users', authenticate, authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.HR_OFFICER), authController.createUser);
router.put('/users/:id', authenticate, authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.HR_OFFICER), authController.updateUser);
router.patch('/users/:id/toggle-active', authenticate, authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.HR_OFFICER), authController.toggleUserActive);
router.delete('/users/:id', authenticate, authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER), authController.deleteUser);

export default router;
