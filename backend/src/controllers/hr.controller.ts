import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated } from '../utils/response';
import hrService from '../services/hr.service';
import { LeaveStatus } from '@prisma/client';

export const getDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  const departments = await hrService.getDepartments();
  sendSuccess(res, departments);
};

export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  const dept = await hrService.createDepartment(req.body);
  sendCreated(res, dept, 'Department created');
};

export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  const dept = await hrService.updateDepartment(req.params.id, req.body);
  sendSuccess(res, dept, 'Department updated');
};

export const getEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await hrService.getEmployees(
    parseInt(req.query.page as string) || 1,
    parseInt(req.query.limit as string) || 20,
    { status: req.query.status as any, departmentId: req.query.departmentId as string, search: req.query.search as string }
  );
  sendSuccess(res, result.employees, 'Employees retrieved', 200, { total: result.total });
};

export const getEmployeeById = async (req: AuthRequest, res: Response): Promise<void> => {
  const employee = await hrService.getEmployeeById(req.params.id);
  sendSuccess(res, employee);
};

export const createEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await hrService.createEmployee(req.body);
  sendCreated(res, result, 'Employee created');
};

export const updateEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  const employee = await hrService.updateEmployee(req.params.id, req.body);
  sendSuccess(res, employee, 'Employee updated');
};

export const toggleEmployeeActive = async (req: AuthRequest, res: Response): Promise<void> => {
  const { isActive } = req.body;
  const employee = await hrService.toggleEmployeeActive(req.params.id, isActive);
  sendSuccess(res, employee, isActive ? 'Employee activated' : 'Employee deactivated');
};

export const deleteEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  await hrService.deleteEmployee(req.params.id);
  sendSuccess(res, null, 'Employee deleted');
};

export const getLeaveRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await hrService.getLeaveRequests(
    parseInt(req.query.page as string) || 1,
    parseInt(req.query.limit as string) || 20,
    { status: req.query.status as any, employeeId: req.query.employeeId as string }
  );
  sendSuccess(res, result.leaves, 'Leave requests retrieved', 200, { total: result.total });
};

export const createLeaveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const leave = await hrService.createLeaveRequest(req.body);
  sendCreated(res, leave, 'Leave request submitted');
};

export const updateLeaveStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.body;
  const leave = await hrService.updateLeaveStatus(req.params.id, status as LeaveStatus, req.user!.userId);
  sendSuccess(res, leave, 'Leave status updated');
};

export const getHRSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  const summary = await hrService.getHRSummary();
  sendSuccess(res, summary);
};
