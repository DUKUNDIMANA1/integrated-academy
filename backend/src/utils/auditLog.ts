import prisma from '../config/database';

interface AuditLogParams {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
  reference?: string;
}

export const createAuditLog = async (params: AuditLogParams): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        before: params.before ? (params.before as object) : undefined,
        after: params.after ? (params.after as object) : undefined,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        reference: params.reference,
      },
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
};
