/**
 * Approval Repository
 * Handles corporate approval workflows and history tracking.
 */

import { Approval, ApprovalHistory, Prisma } from '../../generated/prisma-client';
import { getBookingDb } from '../index';

export async function createApproval(data: Prisma.ApprovalCreateInput): Promise<Approval> {
  return getBookingDb().approval.create({ data });
}

export async function findApprovals(where: Prisma.ApprovalWhereInput): Promise<Approval[]> {
  return getBookingDb().approval.findMany({ where });
}

export async function updateApprovals(params: {
  where: Prisma.ApprovalWhereInput;
  data: Prisma.ApprovalUpdateManyMutationInput;
}): Promise<Prisma.BatchPayload> {
  return getBookingDb().approval.updateMany({
    where: params.where,
    data: params.data,
  });
}

export async function createApprovalHistory(data: Prisma.ApprovalHistoryCreateInput): Promise<ApprovalHistory> {
  return getBookingDb().approvalHistory.create({ data });
}

export async function updateApprovalHistory(params: {
  where: Prisma.ApprovalHistoryWhereInput;
  data: Prisma.ApprovalHistoryUpdateManyMutationInput;
}): Promise<Prisma.BatchPayload> {
  return getBookingDb().approvalHistory.updateMany({
    where: params.where,
    data: params.data,
  });
}

export async function findApprovalHistory(where: Prisma.ApprovalHistoryWhereInput): Promise<ApprovalHistory[]> {
  return getBookingDb().approvalHistory.findMany({ where });
}
