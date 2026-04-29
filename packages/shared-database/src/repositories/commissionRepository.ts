import { 
  CommissionRule, 
  CommissionSharingRule, 
  CommissionTransaction, 
  Prisma 
} from '../../generated/prisma-client';
import { getCrmDb } from '../index';

export async function findCommissionRules(params: {
  where?: Prisma.CommissionRuleWhereInput;
  orderBy?: Prisma.CommissionRuleOrderByWithRelationInput[];
  skip?: number;
  take?: number;
}): Promise<CommissionRule[]> {
  return getCrmDb().commissionRule.findMany({
    where: params.where,
    orderBy: params.orderBy ?? [{ baseCommission: 'desc' }, { createdAt: 'desc' }],
    skip: params.skip,
    take: params.take,
  });
}

export async function createCommissionRule(data: Prisma.CommissionRuleCreateInput): Promise<CommissionRule> {
  return getCrmDb().commissionRule.create({ data });
}

export async function updateCommissionRule(id: string, data: Prisma.CommissionRuleUpdateInput): Promise<CommissionRule> {
  return getCrmDb().commissionRule.update({
    where: { id },
    data,
  });
}

export async function findSharingRules(params: {
  where?: Prisma.CommissionSharingRuleWhereInput;
  orderBy?: Prisma.CommissionSharingRuleOrderByWithRelationInput[];
}): Promise<CommissionSharingRule[]> {
  return getCrmDb().commissionSharingRule.findMany({
    where: params.where,
    orderBy: params.orderBy ?? [{ priority: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function createCommissionTransaction(data: Prisma.CommissionTransactionCreateInput): Promise<CommissionTransaction> {
  return getCrmDb().commissionTransaction.create({ data });
}

export async function findCommissionTransactions(params: {
  where?: Prisma.CommissionTransactionWhereInput;
  orderBy?: Prisma.CommissionTransactionOrderByWithRelationInput;
  skip?: number;
  take?: number;
  include?: Prisma.CommissionTransactionInclude;
}): Promise<CommissionTransaction[]> {
  return getCrmDb().commissionTransaction.findMany({
    where: params.where,
    orderBy: params.orderBy ?? { createdAt: 'desc' },
    skip: params.skip,
    take: params.take,
    include: params.include,
  });
}

export async function countCommissionTransactions(where?: Prisma.CommissionTransactionWhereInput): Promise<number> {
  return getCrmDb().commissionTransaction.count({ where });
}

export async function updateCommissionTransaction(id: string, data: Prisma.CommissionTransactionUpdateInput): Promise<CommissionTransaction> {
  return getCrmDb().commissionTransaction.update({
    where: { id },
    data,
  });
}

export async function findCommissionTransactionById(id: string): Promise<CommissionTransaction | null> {
  return getCrmDb().commissionTransaction.findUnique({
    where: { id },
  });
}
