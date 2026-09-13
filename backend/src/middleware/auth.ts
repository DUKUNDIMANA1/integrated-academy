import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import prisma from '../config/database';
import { sendUnauthorized } from '../utils/response';

export interface AuthRequest extends Request {
  user?: JwtPayload & { isActive: boolean };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) {
      sendUnauthorized(res, 'Account not found or deactivated');
      return;
    }

    req.user = { ...decoded, isActive: user.isActive };
    next();
  } catch {
    sendUnauthorized(res, 'Invalid or expired token');
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      req.user = { ...decoded, isActive: true };
    }
    next();
  } catch {
    next();
  }
};
