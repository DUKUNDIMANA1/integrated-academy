import { Router } from 'express';
import * as supportController from '../controllers/support.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Role } from '@prisma/client';

const router = Router();

const supportRoles = [Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.SUPPORT_OFFICER];

router.use(authenticate);

router.get('/tickets', authorize(...supportRoles), supportController.getAllTickets);
router.get('/tickets/:id', supportController.getTicketById);
router.post('/tickets', supportController.createTicket);
router.post('/tickets/:id/respond', supportController.respondToTicket);
router.put('/tickets/:id/status', authorize(...supportRoles), supportController.updateTicketStatus);

export default router;
