import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { LeadStatus, LeadSource, ProposalStatus, ContractStatus, ProjectStatus, TaskStatus, TaskPriority, MilestoneStatus } from '@prisma/client';

export class ConsultancyService {
  // ── LEADS ─────────────────────────────────────────────────────────────────────

  async getLeads(page = 1, limit = 20, status?: LeadStatus) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.lead.count({ where }),
    ]);
    return { leads, total };
  }

  async createLead(data: { name: string; email?: string; phone?: string; company?: string; source?: LeadSource; notes?: string; assignedTo?: string }) {
    return prisma.lead.create({ data });
  }

  async updateLead(id: string, data: Partial<{ name: string; email: string; phone: string; company: string; status: LeadStatus; notes: string; assignedTo: string }>) {
    return prisma.lead.update({ where: { id }, data });
  }

  async convertLeadToClient(leadId: string, clientData: { name: string; email: string; phone?: string; company?: string; address?: string; contactPerson?: string }) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new AppError('Lead not found', 404);

    const client = await prisma.client.create({ data: { leadId, ...clientData } });
    await prisma.lead.update({ where: { id: leadId }, data: { status: LeadStatus.WON } });
    return client;
  }

  // ── CLIENTS ───────────────────────────────────────────────────────────────────

  async getClients(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { _count: { select: { projects: true, invoices: true } } },
      }),
      prisma.client.count({ where }),
    ]);
    return { clients, total };
  }

  async getClientById(id: string) {
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        proposals: true,
        contracts: true,
        projects: true,
        invoices: true,
      },
    });
    if (!client) throw new AppError('Client not found', 404);
    return client;
  }

  async createClient(data: { name: string; email: string; phone?: string; company?: string; address?: string; contactPerson?: string }) {
    return prisma.client.create({ data });
  }

  // ── PROPOSALS ─────────────────────────────────────────────────────────────────

  async getProposals(clientId?: string) {
    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    return prisma.proposal.findMany({ where, orderBy: { createdAt: 'desc' }, include: { client: { select: { name: true } } } });
  }

  async createProposal(data: { clientId: string; title: string; description?: string; amount: number; currency?: string; validUntil?: Date }) {
    return prisma.proposal.create({ data });
  }

  async updateProposal(id: string, data: Partial<{ title: string; description: string; amount: number; status: ProposalStatus; sentAt: Date }>) {
    return prisma.proposal.update({ where: { id }, data });
  }

  // ── CONTRACTS ─────────────────────────────────────────────────────────────────

  async getContracts(clientId?: string) {
    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    return prisma.contract.findMany({ where, orderBy: { createdAt: 'desc' }, include: { client: { select: { name: true } } } });
  }

  async createContract(data: { clientId: string; title: string; description?: string; value: number; currency?: string; startDate: Date; endDate?: Date }) {
    return prisma.contract.create({ data });
  }

  async updateContract(id: string, data: Partial<{ title: string; status: ContractStatus; signedAt: Date; endDate: Date }>) {
    return prisma.contract.update({ where: { id }, data });
  }

  // ── PROJECTS ──────────────────────────────────────────────────────────────────

  async getProjects(page = 1, limit = 20, filters: { status?: ProjectStatus; clientId?: string } = {}) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.clientId) where.clientId = filters.clientId;
    const [projects, total] = await Promise.all([
      prisma.consultancyProject.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          client: { select: { name: true } },
          _count: { select: { milestones: true, tasks: true } },
        },
      }),
      prisma.consultancyProject.count({ where }),
    ]);
    return { projects, total };
  }

  async getProjectById(id: string) {
    const project = await prisma.consultancyProject.findUnique({
      where: { id },
      include: {
        client: true,
        contract: true,
        milestones: { orderBy: { dueDate: 'asc' } },
        tasks: { orderBy: { createdAt: 'desc' } },
        timesheets: { orderBy: { date: 'desc' } },
        invoices: true,
      },
    });
    if (!project) throw new AppError('Project not found', 404);
    return project;
  }

  async createProject(data: { clientId: string; contractId?: string; title: string; description?: string; budget?: number; currency?: string; startDate: Date; endDate?: Date; managerId?: string }) {
    return prisma.consultancyProject.create({ data });
  }

  async updateProject(id: string, data: Partial<{ title: string; description: string; status: ProjectStatus; endDate: Date }>) {
    return prisma.consultancyProject.update({ where: { id }, data });
  }

  // ── MILESTONES & TASKS ────────────────────────────────────────────────────────

  async createMilestone(projectId: string, data: { title: string; description?: string; dueDate?: Date }) {
    return prisma.milestone.create({ data: { projectId, ...data } });
  }

  async updateMilestone(id: string, data: Partial<{ title: string; status: MilestoneStatus; completedAt: Date }>) {
    return prisma.milestone.update({ where: { id }, data });
  }

  async createTask(projectId: string, data: { milestoneId?: string; title: string; description?: string; assignedTo?: string; dueDate?: Date; priority?: TaskPriority }) {
    return prisma.projectTask.create({ data: { projectId, ...data } });
  }

  async updateTask(id: string, data: Partial<{ title: string; status: TaskStatus; assignedTo: string; completedAt: Date }>) {
    return prisma.projectTask.update({ where: { id }, data });
  }

  // ── TIMESHEETS ────────────────────────────────────────────────────────────────

  async createTimesheet(data: { projectId: string; consultantId: string; date: Date; hoursWorked: number; description?: string; billable?: boolean }) {
    return prisma.timesheet.create({ data });
  }

  async getTimesheets(projectId?: string, consultantId?: string) {
    const where: Record<string, unknown> = {};
    if (projectId) where.projectId = projectId;
    if (consultantId) where.consultantId = consultantId;
    return prisma.timesheet.findMany({ where, orderBy: { date: 'desc' } });
  }
}

export default new ConsultancyService();
