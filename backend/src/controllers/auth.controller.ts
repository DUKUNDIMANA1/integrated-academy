import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated, sendError } from '../utils/response';
import { Role } from '@prisma/client';

export const register = async (req: Request, res: Response): Promise<void> => {
  const { email, phone, firstName, lastName, password } = req.body;
  const result = await authService.register({ email, phone, firstName, lastName, password });
  sendCreated(res, result, 'Account created successfully');
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const result = await authService.login({
    email, password,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  sendSuccess(res, result, 'Login successful');
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  const refreshToken = req.body.refreshToken || '';
  await authService.logout(req.user!.userId, refreshToken);
  sendSuccess(res, null, 'Logged out successfully');
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const profile = await authService.getProfile(req.user!.userId);
  sendSuccess(res, profile);
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { firstName, lastName, phone } = req.body;
  const updated = await authService.updateProfile(req.user!.userId, { firstName, lastName, phone });
  sendSuccess(res, updated, 'Profile updated');
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.userId, currentPassword, newPassword);
  sendSuccess(res, null, 'Password changed successfully');
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  sendSuccess(res, null, 'If an account exists, a reset link has been sent');
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body;
  await authService.resetPassword(token, newPassword);
  sendSuccess(res, null, 'Password reset successfully');
};

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string | undefined;
  const role = req.query.role as Role | undefined;
  const result = await authService.getUsers(page, limit, search, role);
  sendSuccess(res, result.users, 'Users retrieved', 200, { total: result.total, page, limit });
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const result = await authService.createUser(req.body);
  sendCreated(res, result, 'User created successfully');
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const updated = await authService.updateUser(id, req.body);
  sendSuccess(res, updated, 'User updated');
};

export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (id === req.user!.userId) { sendError(res, 'Cannot delete your own account', 400); return; }
  await authService.deleteUser(id);
  sendSuccess(res, null, 'User deleted');
};

export const toggleUserActive = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  if (id === req.user!.userId) { sendError(res, 'Cannot deactivate your own account', 400); return; }
  const { isActive } = req.body;
  const updated = await authService.updateUser(id, { isActive });
  sendSuccess(res, updated, isActive ? 'User activated' : 'User deactivated');
};
