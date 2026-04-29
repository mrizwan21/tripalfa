import { 
  MarkupRule, 
  MarkupRuleAuditLog, 
  Prisma 
} from '../../generated/prisma-client';
import { getCrmDb } from '../index';

export async function findMarkupRules(params: {
  where?: Prisma.MarkupRuleWhereInput;
  orderBy?: Prisma.MarkupRuleOrderByWithRelationInput[];
  skip?: number;
  take?: number;
}): Promise<MarkupRule[]> {
  return getCrmDb().markupRule.findMany({
    where: params.where,
    orderBy: params.orderBy ?? [{ priority: 'desc' }, { createdAt: 'desc' }],
    skip: params.skip,
    take: params.take,
  });
}

export async function createMarkupRule(data: Prisma.MarkupRuleCreateInput): Promise<MarkupRule> {
  return getCrmDb().markupRule.create({ data });
}

export async function updateMarkupRule(id: string, data: Prisma.MarkupRuleUpdateInput): Promise<MarkupRule> {
  return getCrmDb().markupRule.update({
    where: { id },
    data,
  });
}

export async function createMarkupAuditLog(data: Prisma.MarkupRuleAuditLogCreateInput): Promise<MarkupRuleAuditLog> {
  return getCrmDb().markupRuleAuditLog.create({ data });
}

export async function findMarkupAuditLogs(params: {
  where?: Prisma.MarkupRuleAuditLogWhereInput;
  orderBy?: Prisma.MarkupRuleAuditLogOrderByWithRelationInput;
  skip?: number;
  take?: number;
}): Promise<MarkupRuleAuditLog[]> {
  return getCrmDb().markupRuleAuditLog.findMany({
    where: params.where,
    orderBy: params.orderBy ?? { changedAt: 'desc' },
    skip: params.skip,
    take: params.take,
  });
}

export async function countMarkupAuditLogs(where?: Prisma.MarkupRuleAuditLogWhereInput): Promise<number> {
  return getCrmDb().markupRuleAuditLog.count({ where });
}
