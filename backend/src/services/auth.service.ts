import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken, signRefreshToken } from '../utils/jwt';
import { generateStudentCode } from '../utils/generators';
import { createAuditLog } from '../utils/auditLog';
import { AppError } from '../middleware/errorHandler';
import { Role } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

interface RegisterInput {
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: Role;
}

interface LoginInput {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new AppError('An account with this email already exists', 409);

    if (input.phone && input.phone.replace(/\D/g, '').length > 13) {
      throw new AppError('Phone number must not exceed 13 digits', 400);
    }

    const passwordHash = await hashPassword(input.password);
    const role = input.role || Role.STUDENT;

    const user = await prisma.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
        role,
      },
    });

    // Auto-create student profile for student role
    if (role === Role.STUDENT) {
      await prisma.student.create({
        data: {
          userId: user.id,
          studentCode: generateStudentCode(),
        },
      });
    }

    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role, email: user.email });

    await createAuditLog({ userId: user.id, action: 'REGISTER', entity: 'User', entityId: user.id });

    return {
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      token,
      refreshToken,
    };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new AppError('Invalid email or password', 401);
    if (!user.isActive) throw new AppError('Your account has been deactivated', 403);

    const valid = await comparePassword(input.password, user.passwordHash);
    if (!valid) throw new AppError('Invalid email or password', 401);

    const token = signToken({ userId: user.id, role: user.role, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role, email: user.email });

    // Save session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await prisma.session.create({
      data: { userId: user.id, token: refreshToken, ipAddress: input.ipAddress, userAgent: input.userAgent, expiresAt },
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    await createAuditLog({
      userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id,
      ipAddress: input.ipAddress, userAgent: input.userAgent,
    });

    // Get student profile if student
    let studentId: string | null = null;
    if (user.role === Role.STUDENT) {
      const student = await prisma.student.findUnique({ where: { userId: user.id } });
      studentId = student?.id || null;
    }

    return {
      user: {
        id: user.id, email: user.email, firstName: user.firstName,
        lastName: user.lastName, role: user.role, studentId,
        avatarUrl: (user as any).avatarUrl ?? null,
      },
      token,
      refreshToken,
    };
  }

  async logout(userId: string, refreshToken: string) {
    await prisma.session.deleteMany({ where: { userId, token: refreshToken } });
    await createAuditLog({ userId, action: 'LOGOUT', entity: 'User', entityId: userId });
  }

  async getProfile(userId: string) {
    try {
      const user = await (prisma as any).user.findUnique({
        where: { id: userId },
        select: {
          id: true, email: true, phone: true, firstName: true, lastName: true,
          role: true, isActive: true, isEmailVerified: true, lastLogin: true, createdAt: true,
          avatarUrl: true,
          student: { select: { id: true, studentCode: true, profilePhoto: true } },
          employee: { select: { id: true, employeeCode: true, position: true, department: { select: { name: true } } } },
        },
      });
      if (!user) throw new AppError('User not found', 404);
      return user;
    } catch (e: any) {
      // Fallback when avatarUrl column migration hasn't been applied yet
      if (String(e?.code) === 'P2022' || /avatarUrl/i.test(String(e?.message || ''))) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true, email: true, phone: true, firstName: true, lastName: true,
            role: true, isActive: true, isEmailVerified: true, lastLogin: true, createdAt: true,
            student: { select: { id: true, studentCode: true, profilePhoto: true } },
            employee: { select: { id: true, employeeCode: true, position: true, department: { select: { name: true } } } },
          },
        });
        if (!user) throw new AppError('User not found', 404);
        return { ...user, avatarUrl: null };
      }
      throw e;
    }
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; phone?: string }) {
    try {
      return await (prisma as any).user.update({
        where: { id: userId },
        data,
        select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true, avatarUrl: true },
      });
    } catch (e: any) {
      if (String(e?.code) === 'P2022' || /avatarUrl/i.test(String(e?.message || ''))) {
        return prisma.user.update({
          where: { id: userId },
          data,
          select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true },
        });
      }
      throw e;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);

    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) throw new AppError('Current password is incorrect', 400);

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await createAuditLog({ userId, action: 'CHANGE_PASSWORD', entity: 'User', entityId: userId });
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return; // Silent for security

    const resetToken = uuidv4();
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({ where: { id: user.id }, data: { resetToken, resetTokenExpiry } });
    // In production, send email with resetToken
    console.log(`Password reset token for ${email}: ${resetToken}`);
    return resetToken;
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetTokenExpiry: { gt: new Date() } },
    });
    if (!user) throw new AppError('Invalid or expired reset token', 400);

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiry: null },
    });
  }

  async getUsers(page = 1, limit = 20, search?: string, role?: Role) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isActive: true, lastLogin: true, createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async createUser(data: RegisterInput & { role: Role }) {
    return this.register(data);
  }

  async updateUser(userId: string, data: { firstName?: string; lastName?: string; phone?: string; isActive?: boolean; role?: Role }) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    if (data.phone && data.phone.replace(/\D/g, '').length > 13) {
      throw new AppError('Phone number must not exceed 13 digits', 400);
    }
    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
    });
  }

  async deleteUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('User not found', 404);
    // Soft-check: block deletion of users with active enrollments or financial records
    const enrollments = await prisma.enrollment.count({ where: { student: { userId } } });
    if (enrollments > 0) throw new AppError('Cannot delete a user with active enrollments. Deactivate instead.', 400);
    await prisma.user.delete({ where: { id: userId } });
  }
}

export default new AuthService();
