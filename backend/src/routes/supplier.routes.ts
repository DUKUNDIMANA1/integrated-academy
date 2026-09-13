import { Router } from 'express';
import * as supplierController from '../controllers/supplier.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Role } from '@prisma/client';

const router = Router();

const financeRoles = [Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.FINANCE_OFFICER];
const readRoles = [...financeRoles, Role.AUDITOR];

router.use(authenticate);

router.get('/dashboard', authorize(...readRoles), supplierController.getDashboard);

// Suppliers
router.get('/', authorize(...readRoles), supplierController.getSuppliers);
router.get('/:id', authorize(...readRoles), supplierController.getSupplierById);
router.post('/', authorize(...financeRoles), supplierController.createSupplier);
router.put('/:id', authorize(...financeRoles), supplierController.updateSupplier);
router.post('/:id/approve', authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.FINANCE_OFFICER), supplierController.approveSupplier);

// Evaluations
router.post('/:id/evaluate', authorize(...financeRoles), supplierController.createEvaluation);

// Supplier Invoices
router.get('/invoices/all', authorize(...readRoles), supplierController.getSupplierInvoices);
router.post('/invoices', authorize(...financeRoles), supplierController.createSupplierInvoice);
router.post('/invoices/:id/approve', authorize(...financeRoles), supplierController.approveSupplierInvoice);

// Purchase Orders
router.get('/purchase-orders/all', authorize(...readRoles), supplierController.getPurchaseOrders);
router.post('/purchase-orders', authorize(...financeRoles), supplierController.createPurchaseOrder);
router.put('/purchase-orders/:id/status', authorize(...financeRoles), supplierController.updatePOStatus);

// Supplier Payments
router.post('/payments', authorize(...financeRoles), supplierController.createSupplierPayment);
router.post('/payments/:id/confirm', authorize(...financeRoles), supplierController.confirmSupplierPayment);

// Accounts Payable
router.get('/accounts-payable/summary', authorize(...readRoles), supplierController.getAccountsPayable);
router.get('/accounts-payable/aging', authorize(...readRoles), supplierController.getAgingReport);

// Contracts
router.get('/contracts/all', authorize(...readRoles), supplierController.getSupplierContracts);
router.post('/contracts', authorize(...financeRoles), supplierController.createSupplierContract);

export default router;
