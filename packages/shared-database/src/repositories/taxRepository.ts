import { 
  TaxRule, 
  TaxRuleAuditLog, 
  Prisma 
} from '../../generated/prisma-client';
import { getCrmDb } from '../index';

export async function findTaxRules(params: {
  where?: Prisma.TaxRuleWhereInput;
  orderBy?: Prisma.TaxRuleOrderByWithRelationInput[];
  skip?: number;
  take?: number;
}): Promise<TaxRule[]> {
  return getCrmDb().taxRule.findMany({
    where: params.where,
    orderBy: params.orderBy ?? [{ priority: 'desc' }, { createdAt: 'desc' }],
    skip: params.skip,
    take: params.take,
  });
}

export async function createTaxRule(data: Prisma.TaxRuleCreateInput): Promise<TaxRule> {
  return getCrmDb().taxRule.create({ data });
}

export async function updateTaxRule(id: string, data: Prisma.TaxRuleUpdateInput): Promise<TaxRule> {
  return getCrmDb().taxRule.update({
    where: { id },
    data,
  });
}

export async function deleteTaxRule(id: string): Promise<TaxRule> {
  return getCrmDb().taxRule.delete({
    where: { id },
  });
}

export async function findTaxRuleById(id: string): Promise<TaxRule | null> {
  return getCrmDb().taxRule.findUnique({
    where: { id },
  });
}

export async function createTaxAuditLog(data: Prisma.TaxRuleAuditLogCreateInput): Promise<TaxRuleAuditLog> {
  return getCrmDb().taxRuleAuditLog.create({ data });
}

export async function findTaxAuditLogs(params: {
  where?: Prisma.TaxRuleAuditLogWhereInput;
  orderBy?: Prisma.TaxRuleAuditLogOrderByWithRelationInput;
  skip?: number;
  take?: number;
}): Promise<TaxRuleAuditLog[]> {
  return getCrmDb().taxRuleAuditLog.findMany({
    where: params.where,
    orderBy: params.orderBy ?? { changedAt: 'desc' },
    skip: params.skip,
    take: params.take,
  });
}