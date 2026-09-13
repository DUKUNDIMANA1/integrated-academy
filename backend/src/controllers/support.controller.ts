import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated, sendNotFound } from '../utils/response';
import prisma from '../config/database';
import { generateTicketNumber } from '../utils/generators';

export const getAllTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.priority) where.priority = req.query.priority;
  if (req.query.category) where.category = req.query.category;
  if (req.query.assignedTo) where.assignedTo = req.query.assignedTo;

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where, skip, take: limit, orderBy: { createdAt: 'desc' },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
        responses: { orderBy: { createdAt: 'asc' } },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);
  sendSuccess(res, tickets, 'Tickets retrieved', 200, { total, page, limit });
};

export const getTicketById = async (req: AuthRequest, res: Response): Promise<void> => {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: req.params.id },
    include: {
      student: { include: { user: true } },
      responses: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!ticket) { sendNotFound(res, 'Ticket not found'); return; }
  sendSuccess(res, ticket);
};

export const createTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: generateTicketNumber(),
      submittedBy: req.user!.userId,
      ...req.body,
    },
  });
  sendCreated(res, ticket, 'Ticket created');
};

export const respondToTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  const { message, isInternal } = req.body;
  const response = await prisma.ticketResponse.create({
    data: {
      ticketId: req.params.id,
      responderId: req.user!.userId,
      message,
      isInternal: isInternal || false,
    },
  });

  // Update ticket status
  await prisma.supportTicket.update({
    where: { id: req.params.id },
    data: { status: 'IN_PROGRESS', updatedAt: new Date() },
  });

  sendCreated(res, response, 'Response added');
};

export const updateTicketStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, assignedTo } = req.body;
  const ticket = await prisma.supportTicket.update({
    where: { id: req.params.id },
    data: {
      status,
      assignedTo,
      resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
      closedAt: status === 'CLOSED' ? new Date() : undefined,
    },
  });
  sendSuccess(res, ticket, 'Ticket updated');
};
