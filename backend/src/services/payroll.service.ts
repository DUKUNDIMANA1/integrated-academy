import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class PayrollService {
  async getPayrollPeriods(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [periods, total] = await Promise.all([
      prisma.payrollPeriod.findMany({ skip, take: limit, orderBy: { startDate: 'desc' }, include: { _count: { select: { payslips: true } } } }),
      prisma.payrollPeriod.count(),
    ]);
    return { periods, total };
  }

  async createPayrollPeriod(data: { name: string; startDate: Date; endDate: Date; payDate?: Date }) {
    return prisma.payrollPeriod.create({ data });
  }

  async processPayroll(periodId: string, processedBy: string) {
    const period = await prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new AppError('Payroll period not found', 404);

    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE', salary: { gt: 0 } },
    });

    const payslips = await Promise.all(
      employees.map(async (emp) => {
        const basicSalary = Number(emp.salary || 0);
        const grossSalary = basicSalary; // add allowances in real scenario
        const taxDeduction = grossSalary * 0.30; // 30% PAYE (configurable)
        const pensionDeduction = grossSalary * 0.03; // 3% pension (configurable)
        const netSalary = grossSalary - taxDeduction - pensionDeduction;

        return prisma.payslip.upsert({
          where: { id: `${periodId}-${emp.id}` },
          update: { basicSalary, grossSalary, taxDeduction, pensionDeduction, netSalary },
          create: {
            id: `${periodId}-${emp.id}`,
            payrollPeriodId: periodId,
            employeeId: emp.id,
            basicSalary,
            grossSalary,
            taxDeduction,
            pensionDeduction,
            netSalary,
            currency: emp.currency || 'RWF',
          },
        });
      })
    );

    await prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: 'PROCESSING', processedBy },
    });

    return { processed: payslips.length, payslips };
  }

  async getPayslips(periodId: string) {
    return prisma.payslip.findMany({
      where: { payrollPeriodId: periodId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approvePayroll(periodId: string, approvedBy: string) {
    await prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: 'APPROVED', approvedBy, approvedAt: new Date() },
    });
    await prisma.payslip.updateMany({
      where: { payrollPeriodId: periodId },
      data: { status: 'APPROVED' },
    });
    return { message: 'Payroll approved' };
  }

  async getPayrollSummary() {
    const lastPeriod = await prisma.payrollPeriod.findFirst({ orderBy: { startDate: 'desc' } });
    const [totalEmployees, totalNetSalary] = await Promise.all([
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      lastPeriod
        ? prisma.payslip.aggregate({ _sum: { netSalary: true }, where: { payrollPeriodId: lastPeriod.id } })
        : Promise.resolve({ _sum: { netSalary: null } }),
    ]);
    return { lastPeriod, totalEmployees, lastPayrollTotal: totalNetSalary._sum.netSalary || 0 };
  }
}

export default new PayrollService();
