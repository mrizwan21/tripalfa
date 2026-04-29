/**
 * Offline Request Repository
 * Manages specialized offline change requests, audit logs, and notification queues.
 */

import { 
  OfflineChangeRequest, 
  OfflineRequestAuditLog, 
  Prisma, 
  OfflineRequestNotificationQueue 
} from '../../generated/prisma-client';
import { getBookingDb } from '../index';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateOfflineRequestInput {
  requestRef: string;
  bookingId: string;
  bookingRef: string;
  requestType: string;
  priority?: string;
  submittedBy?: string;
  requestDetails?: any;
}

export interface FindOfflineRequestsInput {
  page?: number;
  limit?: number;
  status?: string;
  requestType?: string;
  priority?: string;
  search?: string;
}

// ─── Create ───────────────────────────────────────────────────────────────────

/**
 * Creates an offline request along with an initial audit log entry.
 */
export async function createOfflineRequest(
  input: CreateOfflineRequestInput,
  tx?: Prisma.TransactionClient
): Promise<OfflineChangeRequest> {
  const createOperation = async (prisma: Prisma.TransactionClient) => {
    const request = await prisma.offlineChangeRequest.create({
      data: {
        requestRef: input.requestRef,
        bookingId: input.bookingId,
        bookingRef: input.bookingRef,
        requestType: input.requestType,
        priority: input.priority || 'medium',
        submittedBy: input.submittedBy || 'customer',
        requestDetails: input.requestDetails || {},
        status: 'pending_staff',
      },
    });

    await prisma.offlineRequestAuditLog.create({
      data: {
        requestId: request.id,
        action: 'created',
        performedBy: input.submittedBy || 'customer',
        role: 'customer',
        newStatus: request.status,
        details: request as any,
      },
    });

    return request;
  };

  if (tx) {
    // Already inside a transaction, execute directly
    return createOperation(tx);
  } else {
    // Start a new transaction
    return getBookingDb().$transaction(createOperation, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function findOfflineRequests(input: FindOfflineRequestsInput) {
  const db = getBookingDb();
  const page = input.page || 1;
  const limit = input.limit || 20;

  const where: Prisma.OfflineChangeRequestWhereInput = {};

  if (input.status) where.status = input.status;
  if (input.requestType) where.requestType = input.requestType;
  if (input.priority) where.priority = input.priority;

  if (input.search) {
    where.OR = [
      { requestRef: { contains: input.search, mode: 'insensitive' } },
      { bookingRef: { contains: input.search, mode: 'insensitive' } },
    ];
  }

  const [data, total] = await Promise.all([
    db.offlineChangeRequest.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        auditLogs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    db.offlineChangeRequest.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOfflineRequestById(id: string) {
  return getBookingDb().offlineChangeRequest.findUnique({
    where: { id },
    include: {
      auditLogs: {
        orderBy: { createdAt: 'desc' },
      },
      notifications: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function submitPricing(
  id: string,
  input: { 
    staffId: string; 
    staffPricing: any; 
    priceDifference: number; 
    staffNotes?: string; 
  }
): Promise<OfflineChangeRequest> {
  const db = getBookingDb();

  return db.$transaction(async (prisma: Prisma.TransactionClient) => {
    const existing = await prisma.offlineChangeRequest.findUnique({ where: { id } });
    if (!existing) throw new Error('Offline request not found');

    const updated = await prisma.offlineChangeRequest.update({
      where: { id },
      data: {
        resolutionData: {
          ...(existing.resolutionData as any || {}),
          staffPricing: input.staffPricing,
          priceDifference: input.priceDifference,
          staffPricedAt: new Date().toISOString(),
          staffId: input.staffId,
        },
        status: 'pricing_submitted',
        internalRemarks: input.staffNotes,
      },
    });

    await prisma.offlineRequestAuditLog.create({
      data: {
        requestId: id,
        action: 'pricing_submitted',
        performedBy: input.staffId,
        role: 'staff',
        oldStatus: existing.status,
        newStatus: 'pricing_submitted',
        details: { staffPricing: input.staffPricing, priceDifference: input.priceDifference },
      },
    });

    const requestDetails = (existing.requestDetails as any) || {};
    await prisma.offlineRequestNotificationQueue.create({
      data: {
        requestId: id,
        status: 'PENDING',
        type: 'offline_request_priced',
        recipient: requestDetails?.customerId || 'customer',
        payload: {
          requestRef: existing.requestRef,
          priceDifference: input.priceDifference,
        },
      },
    });

    return updated;
  });
}

export async function processApproval(
  id: string,
  input: { 
    approved: boolean; 
    customerId: string; 
    rejectionReason?: string; 
  }
): Promise<OfflineChangeRequest> {
  const db = getBookingDb();

  return db.$transaction(async (prisma: Prisma.TransactionClient) => {
    const existing = await prisma.offlineChangeRequest.findUnique({ where: { id } });
    if (!existing) throw new Error('Offline request not found');

    const finalStatus = input.approved ? 'payment_pending' : 'rejected';
    
    const updated = await prisma.offlineChangeRequest.update({
      where: { id },
      data: {
        status: finalStatus,
        resolutionData: {
          ...(existing.resolutionData as any || {}),
          customerApproval: {
            approved: input.approved,
            approvalDate: new Date().toISOString(),
            rejectionReason: input.approved ? null : input.rejectionReason,
          },
        },
      },
    });

    await prisma.offlineRequestAuditLog.create({
      data: {
        requestId: id,
        action: input.approved ? 'approved' : 'rejected',
        performedBy: input.customerId,
        role: 'customer',
        oldStatus: existing.status,
        newStatus: finalStatus,
        details: { approved: input.approved },
      },
    });

    return updated;
  });
}

export async function processPayment(
  id: string,
  input: {
    paymentId: string;
    amount: number;
    method: string;
    transactionRef?: string;
  }
): Promise<OfflineChangeRequest> {
  const db = getBookingDb();

  return db.$transaction(async (prisma: Prisma.TransactionClient) => {
    const existing = await prisma.offlineChangeRequest.findUnique({ where: { id } });
    if (!existing) throw new Error('Offline request not found');

    const updated = await prisma.offlineChangeRequest.update({
      where: { id },
      data: {
        resolutionData: {
          ...(existing.resolutionData as any || {}),
          payment: {
            paymentId: input.paymentId,
            amount: input.amount,
            method: input.method,
            transactionRef: input.transactionRef,
            status: 'completed',
            paidAt: new Date().toISOString(),
          },
        },
        status: 'completed',
      },
    });

    await prisma.offlineRequestAuditLog.create({
      data: {
        requestId: id,
        action: 'payment_processed',
        performedBy: 'system',
        role: 'system',
        oldStatus: existing.status,
        newStatus: 'completed',
        details: { paymentId: input.paymentId, amount: input.amount, method: input.method, transactionRef: input.transactionRef },
      },
    });

    return updated;
  });
}

export async function issueDocuments(
  id: string,
  input: {
    ticketNumbers?: string[];
    voucherNumbers?: string[];
    invoiceId?: string;
    documentUrls?: string[];
  }
): Promise<OfflineChangeRequest> {
  const db = getBookingDb();

  return db.$transaction(async (prisma: Prisma.TransactionClient) => {
    const existing = await prisma.offlineChangeRequest.findUnique({ where: { id } });
    if (!existing) throw new Error('Offline request not found');

    const updated = await prisma.offlineChangeRequest.update({
      where: { id },
      data: {
        resolutionData: {
          ...(existing.resolutionData as any || {}),
          reissuedDocuments: {
            ...input,
            issuedAt: new Date().toISOString(),
          },
        },
      },
    });

    await prisma.offlineRequestAuditLog.create({
      data: {
        requestId: id,
        action: 'documents_issued',
        performedBy: 'system',
        role: 'system',
        details: input as any,
      },
    });

    return updated;
  });
}

export async function getAuditLogs(id: string): Promise<OfflineRequestAuditLog[]> {
  return getBookingDb().offlineRequestAuditLog.findMany({
    where: { requestId: id },
    orderBy: { createdAt: 'desc' },
  });
}
