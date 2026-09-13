import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { EmploymentType, EmployeeStatus, LeaveType, LeaveStatus } from '@prisma/client';
import { generateEmployeeCode } from '../utils/generators';
import { hashPassword } from '../utils/password';
import { Role } from '@prisma/client';

export class HRService {
  async getDepartments() {
    return prisma.department.findMany({
      where: { isActive: true },
      include: { _count: { select: { employees: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createDepartment(data: { name: string; description?: string; managerId?: string }) {
    return prisma.department.create({ data });
  }

  async updateDepartment(id: string, data: Partial<{ name: string; description: string; managerId: string; isActive: boolean }>) {
    return prisma.department.update({ where: { id }, data });
  }

  async getEmployees(page = 1, limit = 20, filters: { status?: EmployeeStatus; departmentId?: string; search?: string } = {}) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.search) {
      where.user = { OR: [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ]};
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          department: { select: { name: true } },
        },
      }),
      prisma.employee.count({ where }),
    ]);
    return { employees, total };
  }

  async getEmployeeById(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true, phone: true, role: true } },
        department: true,
        leaveRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!employee) throw new AppError('Employee not found', 404);
    return employee;
  }

  async createEmployee(data: {
    email: string; firstName: string; lastName: string; phone?: string;
    password: string; role: Role; departmentId?: string; position?: string;
    employmentType?: EmploymentType; salary?: number; currency?: string; hireDate: Date;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError('User with this email already exists', 409);

    if (data.phone && data.phone.replace(/\D/g, '').length > 13) {
      throw new AppError('Phone number must not exceed 13 digits', 400);
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        passwordHash,
        role: data.role,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        employeeCode: generateEmployeeCode(),
        departmentId: data.departmentId,
        position: data.position,
        employmentType: data.employmentType || EmploymentType.FULL_TIME,
        salary: data.salary,
        currency: data.currency || 'RWF',
        hireDate: data.hireDate,
      },
    });

    return { user, employee };
  }

  async updateEmployee(id: string, data: Partial<{
    departmentId: string; position: string; employmentType: EmploymentType;
    salary: number; status: EmployeeStatus; endDate: Date;
  }>) {
    return prisma.employee.update({ where: { id }, data });
  }

  async toggleEmployeeActive(id: string, isActive: boolean) {
    const emp = await prisma.employee.findUnique({ where: { id } });
    if (!emp) throw new AppError('Employee not found', 404);
    const newStatus: EmployeeStatus = isActive ? EmployeeStatus.ACTIVE : EmployeeStatus.INACTIVE;
    await prisma.employee.update({ where: { id }, data: { status: newStatus } });
    return prisma.user.update({
      where: { id: emp.userId },
      data: { isActive },
      select: { id: true, firstName: true, lastName: true, isActive: true },
    });
  }

  async deleteEmployee(id: string) {
    const emp = await prisma.employee.findUnique({ where: { id }, include: { user: true } });
    if (!emp) throw new AppError('Employee not found', 404);
    // Delete employee record first (FK), then user
    await prisma.employee.delete({ where: { id } });
    await prisma.user.delete({ where: { id: emp.userId } });
  }

  // ── LEAVE REQUESTS ────────────────────────────────────────────────────────────

  async getLeaveRequests(page = 1, limit = 20, filters: { status?: LeaveStatus; employeeId?: string } = {}) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.employeeId) where.employeeId = filters.employeeId;

    const [leaves, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            include: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
      prisma.leaveRequest.count({ where }),
    ]);
    return { leaves, total };
  }

  async createLeaveRequest(data: { employeeId: string; type: LeaveType; startDate: Date; endDate: Date; reason?: string }) {
    return prisma.leaveRequest.create({ data });
  }

  async updateLeaveStatus(id: string, status: LeaveStatus, approvedBy?: string) {
    const leave = await prisma.leaveRequest.findUnique({ where: { id } });
    if (!leave) throw new AppError('Leave request not found', 404);
    return prisma.leaveRequest.update({
      where: { id },
      data: { status, approvedBy, approvedAt: status === LeaveStatus.APPROVED ? new Date() : undefined },
    });
  }

  // ── HR REPORTS ────────────────────────────────────────────────────────────────

  async getHRSummary() {
    const [totalEmployees, byDepartment, byEmploymentType, pendingLeaves] = await Promise.all([
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.employee.groupBy({ by: ['departmentId'], _count: { id: true }, where: { status: 'ACTIVE' } }),
      prisma.employee.groupBy({ by: ['employmentType'], _count: { id: true } }),
      prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
    ]);
    return { totalEmployees, byDepartment, byEmploymentType, pendingLeaves };
  }
}

export default new HRService();
