import { prisma } from '../config/database';

export class ReportService {
  async getAdminKPIs() {
    const [
      totalStudents,
      pendingApplications,
      activeEnrollments,
      publishedCourses,
      totalIncome,
      totalOutstanding,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.studentApplication.count({ where: { status: 'PENDING' } }),
      prisma.enrollment.count({ where: { accessStatus: 'ACTIVE' } }),
      prisma.course.count({ where: { status: 'PUBLISHED' } }),
      prisma.income.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { amount: true },
      }),
      prisma.invoice.aggregate({
        where: { status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] } },
        _sum: { outstandingBalance: true },
      }),
    ]);

    return {
      totalStudents,
      pendingApplications,
      activeEnrollments,
      publishedCourses,
      totalIncome: Number(totalIncome._sum.amount ?? 0),
      totalOutstanding: Number(totalOutstanding._sum.outstandingBalance ?? 0),
    };
  }

  async getStudentReport(filters: { startDate?: string; endDate?: string }) {
    const where: any = {};
    if (filters.startDate || filters.endDate) {
      where.createdAt = {
        ...(filters.startDate && { gte: new Date(filters.startDate) }),
        ...(filters.endDate && { lte: new Date(filters.endDate) }),
      };
    }

    const [students, enrollmentStats, applicationStats] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          _count: { select: { enrollments: true, applications: true } },
        },
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.enrollment.groupBy({
        by: ['accessStatus'],
        _count: true,
      }),
      prisma.studentApplication.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return { students, enrollmentStats, applicationStats };
  }

  async getFinancialReport(filters: { startDate: string; endDate: string }) {
    const startDate = new Date(filters.startDate);
    const endDate = new Date(filters.endDate);

    const [incomeByCategory, expenseByCategory, paymentSummary, monthlyTrends] = await Promise.all([
      prisma.income.groupBy({
        by: ['category'],
        where: { date: { gte: startDate, lte: endDate }, status: 'CONFIRMED' },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where: { date: { gte: startDate, lte: endDate }, status: 'PAID' },
        _sum: { amount: true },
        _count: true,
        orderBy: { _sum: { amount: 'desc' } },
      }),
      prisma.payment.groupBy({
        by: ['status', 'method'],
        where: { createdAt: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.income.findMany({
        where: { date: { gte: startDate, lte: endDate }, status: 'CONFIRMED' },
        select: { date: true, amount: true, category: true },
        orderBy: { date: 'asc' },
      }),
    ]);

    return { incomeByCategory, expenseByCategory, paymentSummary, monthlyTrends };
  }

  async getConsultancyReport() {
    const [projectStats, clientStats, proposalStats] = await Promise.all([
      prisma.consultancyProject.groupBy({
        by: ['status'],
        _count: true,
      }),
      prisma.client.count({ where: { isActive: true } }),
      prisma.proposal.groupBy({
        by: ['status'],
        _count: true,
        _sum: { amount: true },
      }),
    ]);

    return { projectStats, totalClients: clientStats, proposalStats };
  }
}

export const reportService = new ReportService();
