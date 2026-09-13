import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { sendForbidden } from '../utils/response';
import { Role } from '@prisma/client';

export const authorize = (...roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendForbidden(res, 'Authentication required');
      return;
    }

    if (!roles.includes(req.user.role as Role)) {
      sendForbidden(res, 'You do not have permission to perform this action');
      return;
    }

    next();
  };
};

export const authorizeOwnerOrAdmin = (getOwnerId: (req: AuthRequest) => string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendForbidden(res, 'Authentication required');
      return;
    }

    const adminRoles: Role[] = [
      Role.SUPER_ADMIN,
      Role.GENERAL_MANAGER,
      Role.ACADEMY_MANAGER,
      Role.FINANCE_OFFICER,
    ];

    if (adminRoles.includes(req.user.role as Role)) {
      next();
      return;
    }

    const ownerId = getOwnerId(req);
    if (req.user.userId !== ownerId) {
      sendForbidden(res, 'Access denied');
      return;
    }

    next();
  };
};
