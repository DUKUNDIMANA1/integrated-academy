import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated } from '../utils/response';
import consultancyService from '../services/consultancy.service';

// LEADS
export const getLeads = async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await consultancyService.getLeads(
    parseInt(req.query.page as string) || 1,
    parseInt(req.query.limit as string) || 20,
    req.query.status as any
  );
  sendSuccess(res, result.leads, 'Leads retrieved', 200, { total: result.total });
};

export const createLead = async (req: AuthRequest, res: Response): Promise<void> => {
  const lead = await consultancyService.createLead({ ...req.body, assignedTo: req.user!.userId });
  sendCreated(res, lead, 'Lead created');
};

export const updateLead = async (req: AuthRequest, res: Response): Promise<void> => {
  const lead = await consultancyService.updateLead(req.params.id, req.body);
  sendSuccess(res, lead, 'Lead updated');
};

export const convertLead = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await consultancyService.convertLeadToClient(req.params.id, req.body);
  sendCreated(res, client, 'Lead converted to client');
};

// CLIENTS
export const getClients = async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await consultancyService.getClients(
    parseInt(req.query.page as string) || 1,
    parseInt(req.query.limit as string) || 20,
    req.query.search as string
  );
  sendSuccess(res, result.clients, 'Clients retrieved', 200, { total: result.total });
};

export const getClientById = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await consultancyService.getClientById(req.params.id);
  sendSuccess(res, client);
};

export const createClient = async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await consultancyService.createClient(req.body);
  sendCreated(res, client, 'Client created');
};

// PROPOSALS
export const getProposals = async (req: AuthRequest, res: Response): Promise<void> => {
  const proposals = await consultancyService.getProposals(req.query.clientId as string);
  sendSuccess(res, proposals);
};

export const createProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  const proposal = await consultancyService.createProposal(req.body);
  sendCreated(res, proposal, 'Proposal created');
};

export const updateProposal = async (req: AuthRequest, res: Response): Promise<void> => {
  const proposal = await consultancyService.updateProposal(req.params.id, req.body);
  sendSuccess(res, proposal, 'Proposal updated');
};

// CONTRACTS
export const getContracts = async (req: AuthRequest, res: Response): Promise<void> => {
  const contracts = await consultancyService.getContracts(req.query.clientId as string);
  sendSuccess(res, contracts);
};

export const createContract = async (req: AuthRequest, res: Response): Promise<void> => {
  const contract = await consultancyService.createContract(req.body);
  sendCreated(res, contract, 'Contract created');
};

export const updateContract = async (req: AuthRequest, res: Response): Promise<void> => {
  const contract = await consultancyService.updateContract(req.params.id, req.body);
  sendSuccess(res, contract, 'Contract updated');
};

// PROJECTS
export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await consultancyService.getProjects(
    parseInt(req.query.page as string) || 1,
    parseInt(req.query.limit as string) || 20,
    { status: req.query.status as any, clientId: req.query.clientId as string }
  );
  sendSuccess(res, result.projects, 'Projects retrieved', 200, { total: result.total });
};

export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
  const project = await consultancyService.getProjectById(req.params.id);
  sendSuccess(res, project);
};

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  const project = await consultancyService.createProject({ ...req.body, managerId: req.user!.userId });
  sendCreated(res, project, 'Project created');
};

export const updateProject = async (req: AuthRequest, res: Response): Promise<void> => {
  const project = await consultancyService.updateProject(req.params.id, req.body);
  sendSuccess(res, project, 'Project updated');
};

// MILESTONES
export const createMilestone = async (req: AuthRequest, res: Response): Promise<void> => {
  const milestone = await consultancyService.createMilestone(req.params.projectId, req.body);
  sendCreated(res, milestone, 'Milestone created');
};

export const updateMilestone = async (req: AuthRequest, res: Response): Promise<void> => {
  const milestone = await consultancyService.updateMilestone(req.params.id, req.body);
  sendSuccess(res, milestone, 'Milestone updated');
};

// TASKS
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const task = await consultancyService.createTask(req.params.projectId, req.body);
  sendCreated(res, task, 'Task created');
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const task = await consultancyService.updateTask(req.params.id, req.body);
  sendSuccess(res, task, 'Task updated');
};

// TIMESHEETS
export const createTimesheet = async (req: AuthRequest, res: Response): Promise<void> => {
  const sheet = await consultancyService.createTimesheet({ ...req.body, consultantId: req.user!.userId });
  sendCreated(res, sheet, 'Timesheet recorded');
};

export const getTimesheets = async (req: AuthRequest, res: Response): Promise<void> => {
  const sheets = await consultancyService.getTimesheets(req.query.projectId as string);
  sendSuccess(res, sheets);
};
