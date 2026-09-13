import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated } from '../utils/response';
import supplierService from '../services/supplier.service';
import { SupplierStatus, POStatus, SupplierInvoiceStatus, PaymentMethod } from '@prisma/client';

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await supplierService.getSupplierDashboard();
  sendSuccess(res, data);
};

export const getSuppliers = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await supplierService.getSuppliers(page, limit, {
    status: req.query.status as SupplierStatus,
    search: req.query.search as string,
    category: req.query.category as string,
  });
  sendSuccess(res, result.suppliers, 'Suppliers retrieved', 200, { total: result.total, page, limit });
};

export const getSupplierById = async (req: AuthRequest, res: Response): Promise<void> => {
  const supplier = await supplierService.getSupplierById(req.params.id);
  sendSuccess(res, supplier);
};

export const createSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  const supplier = await supplierService.createSupplier({ ...req.body, createdBy: req.user!.userId });
  sendCreated(res, supplier, 'Supplier created successfully');
};

export const updateSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  const supplier = await supplierService.updateSupplier(req.params.id, req.body);
  sendSuccess(res, supplier, 'Supplier updated');
};

export const approveSupplier = async (req: AuthRequest, res: Response): Promise<void> => {
  const supplier = await supplierService.approveSupplier(req.params.id, req.user!.userId);
  sendSuccess(res, supplier, 'Supplier approved');
};

export const getSupplierInvoices = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await supplierService.getSupplierInvoices(page, limit, {
    supplierId: req.query.supplierId as string,
    status: req.query.status as SupplierInvoiceStatus,
  });
  sendSuccess(res, result.invoices, 'Invoices retrieved', 200, { total: result.total });
};

export const createSupplierInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  const invoice = await supplierService.createSupplierInvoice(req.body);
  sendCreated(res, invoice, 'Supplier invoice created');
};

export const approveSupplierInvoice = async (req: AuthRequest, res: Response): Promise<void> => {
  const invoice = await supplierService.approveSupplierInvoice(req.params.id, req.user!.userId);
  sendSuccess(res, invoice, 'Invoice approved');
};

export const getPurchaseOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await supplierService.getPurchaseOrders(page, limit, {
    supplierId: req.query.supplierId as string,
    status: req.query.status as POStatus,
  });
  sendSuccess(res, result.orders, 'Purchase orders retrieved', 200, { total: result.total });
};

export const createPurchaseOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const po = await supplierService.createPurchaseOrder({ ...req.body, createdBy: req.user!.userId });
  sendCreated(res, po, 'Purchase order created');
};

export const updatePOStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const po = await supplierService.updatePOStatus(req.params.id, req.body.status as POStatus, req.user!.userId);
  sendSuccess(res, po, 'Purchase order status updated');
};

export const createSupplierPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const payment = await supplierService.createSupplierPayment({ ...req.body, approvedBy: req.user!.userId });
  sendCreated(res, payment, 'Payment recorded');
};

export const confirmSupplierPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const payment = await supplierService.confirmSupplierPayment(req.params.id, req.user!.userId);
  sendSuccess(res, payment, 'Payment confirmed');
};

export const getAccountsPayable = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await supplierService.getAccountsPayable();
  sendSuccess(res, data);
};

export const getAgingReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const data = await supplierService.getAgingReport();
  sendSuccess(res, data);
};

export const getSupplierContracts = async (req: AuthRequest, res: Response): Promise<void> => {
  const contracts = await supplierService.getSupplierContracts(req.query.supplierId as string);
  sendSuccess(res, contracts);
};

export const createSupplierContract = async (req: AuthRequest, res: Response): Promise<void> => {
  const contract = await supplierService.createSupplierContract(req.body);
  sendCreated(res, contract, 'Contract created');
};

export const createEvaluation = async (req: AuthRequest, res: Response): Promise<void> => {
  const evaluation = await supplierService.createEvaluation({ ...req.body, evaluatedBy: req.user!.userId });
  sendCreated(res, evaluation, 'Evaluation submitted');
};
