import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated } from '../utils/response';
import payrollService from '../services/payroll.service';

export const getPayrollPeriods = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await payrollService.getPayrollPeriods(page, limit);
  sendSuccess(res, result.periods, 'Payroll periods retrieved', 200, { total: result.total });
};

export const createPayrollPeriod = async (req: AuthRequest, res: Response): Promise<void> => {
  const period = await payrollService.createPayrollPeriod(req.body);
  sendCreated(res, period, 'Payroll period created');
};

export const processPayroll = async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await payrollService.processPayroll(req.params.id, req.user!.userId);
  sendSuccess(res, result, 'Payroll processed');
};

export const getPayslips = async (req: AuthRequest, res: Response): Promise<void> => {
  const payslips = await payrollService.getPayslips(req.params.id);
  sendSuccess(res, payslips);
};

export const approvePayroll = async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await payrollService.approvePayroll(req.params.id, req.user!.userId);
  sendSuccess(res, result, 'Payroll approved');
};

export const getPayrollSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  const summary = await payrollService.getPayrollSummary();
  sendSuccess(res, summary);
};
