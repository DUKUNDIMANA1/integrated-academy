import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated } from '../utils/response';
import ledgerService from '../services/ledger.service';
import { AccountCOAType } from '@prisma/client';
import prisma from '../config/database';

export const getChartOfAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  const accounts = await ledgerService.getChartOfAccounts(req.query.type as AccountCOAType);
  sendSuccess(res, accounts);
};

export const createAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const account = await ledgerService.createAccount(req.body);
  sendCreated(res, account, 'Account created');
};

export const updateAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  const account = await ledgerService.updateAccount(req.params.id, req.body);
  sendSuccess(res, account, 'Account updated');
};

export const getJournalEntries = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  const result = await ledgerService.getJournalEntries(page, limit, startDate, endDate);
  sendSuccess(res, result.entries, 'Journal entries retrieved', 200, { total: result.total });
};

export const createJournalEntry = async (req: AuthRequest, res: Response): Promise<void> => {
  const entry = await ledgerService.createJournalEntry({ ...req.body, createdBy: req.user!.userId });
  sendCreated(res, entry, 'Journal entry created');
};

export const getGeneralLedger = async (req: AuthRequest, res: Response): Promise<void> => {
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  const data = await ledgerService.getGeneralLedger(req.params.accountId, startDate, endDate);
  sendSuccess(res, data);
};

export const getTrialBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : undefined;
  const data = await ledgerService.getTrialBalance(asOfDate);
  sendSuccess(res, data);
};

export const getTaxRecords = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const [records, total] = await Promise.all([
    prisma.taxRecord.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.taxRecord.count(),
  ]);
  sendSuccess(res, records, 'Tax records retrieved', 200, { total });
};

export const createTaxRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  const record = await prisma.taxRecord.create({ data: { ...req.body, createdBy: req.user!.userId } });
  sendCreated(res, record, 'Tax record created');
};

export const updateTaxRecord = async (req: AuthRequest, res: Response): Promise<void> => {
  const record = await prisma.taxRecord.update({ where: { id: req.params.id }, data: req.body });
  sendSuccess(res, record, 'Tax record updated');
};
