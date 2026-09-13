import { Router } from 'express';
import * as consultancyController from '../controllers/consultancy.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Role } from '@prisma/client';

const router = Router();

const consultancyRoles = [Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.CONSULTANT, Role.SALES_ADMISSIONS];

router.use(authenticate);

// Leads
router.get('/leads', authorize(...consultancyRoles), consultancyController.getLeads);
router.post('/leads', authorize(...consultancyRoles), consultancyController.createLead);
router.put('/leads/:id', authorize(...consultancyRoles), consultancyController.updateLead);
router.post('/leads/:id/convert', authorize(...consultancyRoles), consultancyController.convertLead);

// Clients
router.get('/clients', authorize(...consultancyRoles), consultancyController.getClients);
router.get('/clients/:id', authorize(...consultancyRoles), consultancyController.getClientById);
router.post('/clients', authorize(...consultancyRoles), consultancyController.createClient);

// Proposals
router.get('/proposals', authorize(...consultancyRoles), consultancyController.getProposals);
router.post('/proposals', authorize(...consultancyRoles), consultancyController.createProposal);
router.put('/proposals/:id', authorize(...consultancyRoles), consultancyController.updateProposal);

// Contracts
router.get('/contracts', authorize(...consultancyRoles), consultancyController.getContracts);
router.post('/contracts', authorize(...consultancyRoles), consultancyController.createContract);
router.put('/contracts/:id', authorize(...consultancyRoles), consultancyController.updateContract);

// Projects
router.get('/projects', authorize(...consultancyRoles), consultancyController.getProjects);
router.get('/projects/:id', authorize(...consultancyRoles), consultancyController.getProjectById);
router.post('/projects', authorize(...consultancyRoles), consultancyController.createProject);
router.put('/projects/:id', authorize(...consultancyRoles), consultancyController.updateProject);

// Milestones
router.post('/projects/:projectId/milestones', authorize(...consultancyRoles), consultancyController.createMilestone);
router.put('/milestones/:id', authorize(...consultancyRoles), consultancyController.updateMilestone);

// Tasks
router.post('/projects/:projectId/tasks', authorize(...consultancyRoles), consultancyController.createTask);
router.put('/tasks/:id', authorize(...consultancyRoles), consultancyController.updateTask);

// Timesheets
router.get('/timesheets', authorize(...consultancyRoles), consultancyController.getTimesheets);
router.post('/timesheets', authorize(...consultancyRoles), consultancyController.createTimesheet);

export default router;
