import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { AccountCOAType } from '@prisma/client';

export class LedgerService {
  // ── CHART OF ACCOUNTS ─────────────────────────────────────────────────────

  async getChartOfAccounts(type?: AccountCOAType) {
    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type;
    return prisma.chartOfAccount.findMany({
      where, orderBy: [{ type: 'asc' }, { code: 'asc' }],
      include: { children: { where: { isActive: true } } },
    });
  }

  async createAccount(data: {
    code: string; name: string; type: AccountCOAType;
    category?: string; description?: string; parentId?: string;
  }) {
    const existing = await prisma.chartOfAccount.findUnique({ where: { code: data.code } });
    if (existing) throw new AppError('Account code already exists', 409);
    return prisma.chartOfAccount.create({ data });
  }

  async updateAccount(id: string, data: Partial<{ name: string; description: string; isActive: boolean }>) {
    return prisma.chartOfAccount.update({ where: { id }, data });
  }

  // ── JOURNAL ENTRIES ────────────────────────────────────────────────────────

  async getJournalEntries(page = 1, limit = 50, startDate?: Date, endDate?: Date) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) (where.date as Record<string, unknown>).gte = startDate;
      if (endDate) (where.date as Record<string, unknown>).lte = endDate;
    }

    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where, skip, take: limit, orderBy: { date: 'desc' },
        include: { lines: { include: { account: { select: { code: true, name: true, type: true } } } } },
      }),
      prisma.journalEntry.count({ where }),
    ]);
    return { entries, total };
  }

  async createJournalEntry(data: {
    description?: string; date?: Date; createdBy?: string;
    lines: Array<{ accountId: string; description?: string; debit?: number; credit?: number }>;
  }) {
    const totalDebits = data.lines.reduce((s, l) => s + (l.debit || 0), 0);
    const totalCredits = data.lines.reduce((s, l) => s + (l.credit || 0), 0);
    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new AppError('Journal entry is not balanced: debits must equal credits', 400);
    }

    const ref = `JE-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    return prisma.journalEntry.create({
      data: {
        reference: ref,
        description: data.description,
        date: data.date || new Date(),
        createdBy: data.createdBy,
        lines: { create: data.lines.map(l => ({ accountId: l.accountId, description: l.description, debit: l.debit || 0, credit: l.credit || 0 })) },
      },
      include: { lines: { include: { account: true } } },
    });
  }

  // ── GENERAL LEDGER ─────────────────────────────────────────────────────────

  async getGeneralLedger(accountId: string, startDate?: Date, endDate?: Date) {
    const account = await prisma.chartOfAccount.findUnique({ where: { id: accountId } });
    if (!account) throw new AppError('Account not found', 404);

    const where: Record<string, unknown> = { accountId };
    if (startDate || endDate) {
      where.journal = { date: {} };
      if (startDate) ((where.journal as Record<string, unknown>).date as Record<string, unknown>).gte = startDate;
      if (endDate) ((where.journal as Record<string, unknown>).date as Record<string, unknown>).lte = endDate;
    }

    const lines = await prisma.journalEntryLine.findMany({
      where,
      include: { journal: { select: { date: true, reference: true, description: true } } },
      orderBy: { journal: { date: 'asc' } },
    });

    // Calculate running balance
    let balance = 0;
    const ledger = lines.map(line => {
      balance += Number(line.debit) - Number(line.credit);
      return { ...line, runningBalance: balance };
    });

    return { account, entries: ledger, closingBalance: balance };
  }

  async getTrialBalance(asOfDate?: Date) {
    const accounts = await prisma.chartOfAccount.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } });

    const balances = await Promise.all(
      accounts.map(async (acc) => {
        const where: Record<string, unknown> = { accountId: acc.id };
        if (asOfDate) where.journal = { date: { lte: asOfDate } };
        const agg = await prisma.journalEntryLine.aggregate({
          _sum: { debit: true, credit: true },
          where,
        });
        const debit = Number(agg._sum.debit || 0);
        const credit = Number(agg._sum.credit || 0);
        return { ...acc, totalDebit: debit, totalCredit: credit, balance: debit - credit };
      })
    );

    return balances.filter(b => b.totalDebit > 0 || b.totalCredit > 0);
  }
}

export default new LedgerService();
