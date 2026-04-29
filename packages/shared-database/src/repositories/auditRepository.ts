/**
 * Audit Repository
 * Centralized logging for all audit events across the platform.
 */

import { getBookingDb, getMasterDb } from '../index';
import { Prisma, AuditLog } from '../../generated/prisma-client';

export interface CreateAuditLogInput {
  action: string;
  entity: string;
  entityId?: string;
  actorId?: string;
  actorName?: string;
  details?: any;
  severity?: string;
  tenantId?: string;
  userId?: string;
  resource?: string;
  resourceId?: string;
}

/**
 * Creates an audit log entry.
 * Defaults to the Booking DB but can be directed elsewhere.
 */
export async function createAuditLog(
  input: CreateAuditLogInput,
  useMaster: boolean = false
): Promise<AuditLog> {
  const db = useMaster ? getMasterDb() : getBookingDb();
  
  return db.auditLog.create({
    data: {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      actorId: input.actorId,
      actorName: input.actorName,
      details: input.details ? (typeof input.details === 'string' ? input.details : JSON.stringify(input.details)) : null,
      severity: input.severity || 'INFO',
      tenantId: input.tenantId,
      userId: input.userId,
      resource: input.resource || input.entity,
      resourceId: input.resourceId || input.entityId,
    },
  });
}

export interface AuditLogFilter {
  entity?: string;
  entityId?: string;
  actorId?: string;
  severity?: string;
  tenantId?: string;
  limit?: number;
}

/**
 * Retrieves audit history based on filters.
 */
export async function findAuditLogs(
  filter: AuditLogFilter,
  useMaster: boolean = false
): Promise<AuditLog[]> {
  const db = useMaster ? getMasterDb() : getBookingDb();
  
  return db.auditLog.findMany({
    where: {
      entity: filter.entity,
      entityId: filter.entityId,
      actorId: filter.actorId,
      severity: filter.severity,
      tenantId: filter.tenantId,
    },
    orderBy: { createdAt: 'desc' },
    take: filter.limit || 100,
  });
}
