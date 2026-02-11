import { Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  OfflineChangeRequest,
  OfflineRequestStatus,
  OfflineRequestType,
  OfflineRequestPriority,
  OfflineRequestAuditAction,
  CreateOfflineRequestPayload,
  SubmitPricingPayload,
  OfflineRequestAuditLog,
  PriceDifference,
} from '@tripalfa/shared-types';
import prisma from '../database/prisma';

/**
 * OfflineRequestService
 * Manages offline booking modification requests that require staff intervention
 */
class OfflineRequestService {
  /**
   * Generate unique request reference
   * Format: OCR-YYYY-XXXXX where XXXXX is incremental ID
   */
  private generateRequestRef(year: number): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `OCR-${year}-${random}`;
  }

  /**
   * Create a new offline change request
   */
  async createRequest(
    payload: CreateOfflineRequestPayload,
    userId: string
  ): Promise<OfflineChangeRequest> {
    // Fetch the original booking details from the database
    // Note: In production, you'd fetch from the bookings table
    // For now, we'll structure the data as per the specification

    const year = new Date().getFullYear();
    const requestRef = this.generateRequestRef(year);

    const timeline = {
      requestedAt: new Date().toISOString(),
      requestedBy: userId,
    };

    const offlineRequest = await prisma.offlineChangeRequest.create({
      data: {
        requestRef,
        bookingId: payload.bookingId,
        bookingRef: payload.bookingRef,
        requestType: payload.requestType,
        status: OfflineRequestStatus.PENDING_STAFF,
        priority: payload.priority || OfflineRequestPriority.MEDIUM,
        originalDetails: {
          // These would be populated from actual booking data
          // For now, this is a placeholder
          serviceType: payload.requestedChanges.serviceType,
          itinerary: {} as any,
          pricing: {
            baseFare: 0,
            taxes: 0,
            markup: 0,
            totalPrice: 0,
            currency: 'USD',
          },
          documents: {},
        },
        requestedChanges: payload.requestedChanges,
        timeline,
        tags: [],
        internalNotes: [],
      },
    });

    // Create audit log entry
    await this.createAuditLog(
      offlineRequest.id,
      OfflineRequestAuditAction.CREATED,
      userId,
      'customer',
      undefined,
      {
        requestType: payload.requestType,
        changeReason: payload.requestedChanges.changeReason,
      }
    );

    return this.formatOfflineRequest(offlineRequest);
  }

  /**
   * Get offline request by ID
   */
  async getRequestById(requestId: string): Promise<OfflineChangeRequest | null> {
    const request = await prisma.offlineChangeRequest.findUnique({
      where: { id: requestId },
    });

    return request ? this.formatOfflineRequest(request) : null;
  }

  /**
   * Get offline request by request reference
   */
  async getRequestByRef(requestRef: string): Promise<OfflineChangeRequest | null> {
    const request = await prisma.offlineChangeRequest.findUnique({
      where: { requestRef },
    });

    return request ? this.formatOfflineRequest(request) : null;
  }

  /**
   * Get offline requests for a booking
   */
  async getRequestsByBooking(bookingId: string): Promise<OfflineChangeRequest[]> {
    const requests = await prisma.offlineChangeRequest.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map(req => this.formatOfflineRequest(req));
  }

  /**
   * Get customer's offline requests
   */
  async getCustomerRequests(
    bookingId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    total: number;
    requests: OfflineChangeRequest[];
  }> {
    const [requests, total] = await Promise.all([
      prisma.offlineChangeRequest.findMany({
        where: { bookingId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.offlineChangeRequest.count({
        where: { bookingId },
      }),
    ]);

    return {
      total,
      requests: requests.map(req => this.formatOfflineRequest(req)),
    };
  }

  /**
   * Get pending staff queue
   */
  async getStaffQueue(
    status: OfflineRequestStatus = OfflineRequestStatus.PENDING_STAFF,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    total: number;
    items: OfflineChangeRequest[];
  }> {
    const [requests, total] = await Promise.all([
      prisma.offlineChangeRequest.findMany({
        where: { status },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        take: limit,
        skip: offset,
      }),
      prisma.offlineChangeRequest.count({
        where: { status },
      }),
    ]);

    return {
      total,
      items: requests.map(req => this.formatOfflineRequest(req)),
    };
  }

  /**
   * Submit pricing from staff
   */
  async submitPricing(
    requestId: string,
    payload: SubmitPricingPayload,
    staffId: string
  ): Promise<OfflineChangeRequest> {
    const request = await prisma.offlineChangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Offline request not found');
    }

    if (request.status !== OfflineRequestStatus.PENDING_STAFF) {
      throw new Error(
        `Cannot submit pricing for request in ${request.status} status`
      );
    }

    const originalDetails = request.originalDetails as any;
    const currentPricing = originalDetails.pricing || {
      baseFare: 0,
      taxes: 0,
      markup: 0,
      totalPrice: 0,
    };

    // Calculate price difference
    const priceDifference: PriceDifference = {
      baseFareDiff: payload.newBaseFare - currentPricing.baseFare,
      taxesDiff: payload.newTaxes - currentPricing.taxes,
      markupDiff: payload.newMarkup - currentPricing.markup,
      totalDiff:
        payload.newTotalPrice -
        (currentPricing.baseFare +
          currentPricing.taxes +
          currentPricing.markup),
      currency: payload.currency,
    };

    const staffPricing = {
      newBaseFare: payload.newBaseFare,
      newTaxes: payload.newTaxes,
      newMarkup: payload.newMarkup,
      newTotalPrice: payload.newTotalPrice,
      currency: payload.currency,
      supplierReference: payload.supplierReference,
      supplierPNR: payload.supplierPNR,
      staffNotes: payload.staffNotes,
      pricedAt: new Date().toISOString(),
      pricedBy: staffId,
    };

    const timeline = (request.timeline || {}) as any;
    timeline.staffPricedAt = new Date().toISOString();
    timeline.customerNotifiedAt = new Date().toISOString();

    const updatedRequest = await prisma.offlineChangeRequest.update({
      where: { id: requestId },
      data: {
        status: OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL,
        staffPricing,
        priceDifference,
        timeline,
        updatedAt: new Date(),
      },
    });

    // Notify customer via notification hook
    await this.notifyCustomer(updatedRequest, 'pricing_submitted');

    // Create audit log
    await this.createAuditLog(
      requestId,
      OfflineRequestAuditAction.PRICING_SUBMITTED,
      staffId,
      'staff',
      {
        status: request.status,
        staffPricing: request.staffPricing,
        priceDifference: request.priceDifference,
      },
      {
        staffPricing,
        priceDifference,
      }
    );

    return this.formatOfflineRequest(updatedRequest);
  }

  /**
   * Customer approves the pricing
   */
  async approveRequest(
    requestId: string,
    userId: string
  ): Promise<OfflineChangeRequest> {
    const request = await prisma.offlineChangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Offline request not found');
    }

    if (
      request.status !== OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL
    ) {
      throw new Error(
        `Cannot approve request in ${request.status} status`
      );
    }

    const customerApproval = {
      approved: true,
      approvedAt: new Date().toISOString(),
    };

    const timeline = (request.timeline || {}) as any;
    timeline.customerApprovedAt = new Date().toISOString();

    // Determine next status: if no additional payment is due, go directly to COMPLETED
    // Otherwise, transition to PAYMENT_PENDING
    const priceDifference = (request.priceDifference as any) || {};
    const totalDueAmount = priceDifference.totalDiff || 0;
    const nextStatus = totalDueAmount > 0 
      ? OfflineRequestStatus.PAYMENT_PENDING 
      : OfflineRequestStatus.COMPLETED;

    // If going directly to completed, set completion timeline
    if (nextStatus === OfflineRequestStatus.COMPLETED) {
      timeline.completedAt = new Date().toISOString();
    }

    const updatedRequest = await prisma.offlineChangeRequest.update({
      where: { id: requestId },
      data: {
        status: nextStatus,
        customerApproval,
        timeline,
        updatedAt: new Date(),
      },
    });

    // Notify customer of approval
    await this.notifyCustomer(updatedRequest, 'request_approved');

    // Create audit log
    await this.createAuditLog(
      requestId,
      OfflineRequestAuditAction.APPROVED,
      userId,
      'customer',
      { status: request.status },
      { customerApproval }
    );

    return this.formatOfflineRequest(updatedRequest);
  }

  /**
   * Customer rejects the pricing
   */
  async rejectRequest(
    requestId: string,
    userId: string,
    rejectionReason: string
  ): Promise<OfflineChangeRequest> {
    const request = await prisma.offlineChangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Offline request not found');
    }

    if (
      request.status !== OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL
    ) {
      throw new Error(
        `Cannot reject request in ${request.status} status`
      );
    }

    const customerApproval = {
      approved: false,
      rejectionReason,
    };

    const timeline = (request.timeline || {}) as any;

    const updatedRequest = await prisma.offlineChangeRequest.update({
      where: { id: requestId },
      data: {
        status: OfflineRequestStatus.REJECTED,
        customerApproval,
        timeline,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await this.createAuditLog(
      requestId,
      OfflineRequestAuditAction.REJECTED,
      userId,
      'customer',
      { status: request.status },
      { rejectionReason }
    );

    return this.formatOfflineRequest(updatedRequest);
  }

  /**
   * Record payment for approved request
   */
  async recordPayment(
    requestId: string,
    paymentId: string,
    amount: number,
    method: string,
    transactionRef?: string
  ): Promise<OfflineChangeRequest> {
    const request = await prisma.offlineChangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Offline request not found');
    }

    if (request.status !== OfflineRequestStatus.PAYMENT_PENDING) {
      throw new Error(
        `Cannot process payment for request in ${request.status} status`
      );
    }

    const payment = {
      paymentId,
      amount,
      currency: (request.priceDifference as any)?.currency || 'USD',
      method,
      status: 'completed',
      paidAt: new Date().toISOString(),
      transactionRef,
    };

    const timeline = (request.timeline || {}) as any;
    timeline.paymentCompletedAt = new Date().toISOString();
    timeline.documentsIssuedAt = new Date().toISOString();
    timeline.completedAt = new Date().toISOString();

    const updatedRequest = await prisma.offlineChangeRequest.update({
      where: { id: requestId },
      data: {
        status: OfflineRequestStatus.COMPLETED,
        payment,
        timeline,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await this.createAuditLog(
      requestId,
      OfflineRequestAuditAction.PAYMENT_PROCESSED,
      'system',
      'system',
      { status: request.status },
      { payment }
    );

    return this.formatOfflineRequest(updatedRequest);
  }

  /**
   * Mark request as completed
   */
  async completeRequest(
    requestId: string,
    documentUrls: string[] = []
  ): Promise<OfflineChangeRequest> {
    const request = await prisma.offlineChangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Offline request not found');
    }

    const reissuedDocuments = {
      documentUrls,
      issuedAt: new Date().toISOString(),
    };

    const timeline = (request.timeline || {}) as any;
    timeline.documentsIssuedAt = new Date().toISOString();
    timeline.completedAt = new Date().toISOString();

    const updatedRequest = await prisma.offlineChangeRequest.update({
      where: { id: requestId },
      data: {
        status: OfflineRequestStatus.COMPLETED,
        reissuedDocuments,
        timeline,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await this.createAuditLog(
      requestId,
      OfflineRequestAuditAction.DOCUMENTS_ISSUED,
      'system',
      'system',
      { status: request.status },
      { reissuedDocuments }
    );

    return this.formatOfflineRequest(updatedRequest);
  }

  /**
   * Cancel request
   */
  async cancelRequest(
    requestId: string,
    userId: string,
    reason: string
  ): Promise<OfflineChangeRequest> {
    const request = await prisma.offlineChangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Offline request not found');
    }

    const allowedStates = [
      OfflineRequestStatus.PENDING_STAFF,
      OfflineRequestStatus.PRICING_SUBMITTED,
      OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL,
    ];

    if (!allowedStates.includes(request.status as OfflineRequestStatus)) {
      throw new Error(
        `Cannot cancel request in ${request.status} status`
      );
    }

    const timeline = (request.timeline || {}) as any;

    const updatedRequest = await prisma.offlineChangeRequest.update({
      where: { id: requestId },
      data: {
        status: OfflineRequestStatus.CANCELLED,
        timeline,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await this.createAuditLog(
      requestId,
      OfflineRequestAuditAction.CANCELLED,
      userId,
      'customer',
      { status: request.status },
      { reason }
    );

    return this.formatOfflineRequest(updatedRequest);
  }

  /**
   * Add internal note to request
   */
  async addInternalNote(
    requestId: string,
    note: string,
    staffId: string
  ): Promise<OfflineChangeRequest> {
    const request = await prisma.offlineChangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Offline request not found');
    }

    const internalNotes = request.internalNotes || [];
    internalNotes.push(`[${new Date().toISOString()}] ${staffId}: ${note}`);

    const updatedRequest = await prisma.offlineChangeRequest.update({
      where: { id: requestId },
      data: {
        internalNotes,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await this.createAuditLog(
      requestId,
      OfflineRequestAuditAction.NOTE_ADDED,
      staffId,
      'staff',
      undefined,
      { note }
    );

    return this.formatOfflineRequest(updatedRequest);
  }

  /**
   * Get audit log for request
   */
  async getAuditLog(
    requestId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{
    total: number;
    logs: OfflineRequestAuditLog[];
  }> {
    const [logs, total] = await Promise.all([
      prisma.offlineRequestAuditLog.findMany({
        where: { offlineRequestId: requestId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.offlineRequestAuditLog.count({
        where: { offlineRequestId: requestId },
      }),
    ]);

    return {
      total,
      logs: logs.map(log => this.formatAuditLog(log)),
    };
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    offlineRequestId: string,
    action: OfflineRequestAuditAction,
    actorId: string,
    actorType: 'customer' | 'staff' | 'system',
    oldValues?: any,
    newValues?: any
  ): Promise<void> {
    await prisma.offlineRequestAuditLog.create({
      data: {
        offlineRequestId,
        action,
        actorId,
        actorType,
        oldValues,
        newValues,
      },
    });
  }

  /**
   * Format database record to API response
   */
  private formatOfflineRequest(record: any): OfflineChangeRequest {
    return {
      id: record.id,
      requestRef: record.requestRef,
      bookingId: record.bookingId,
      bookingRef: record.bookingRef,
      requestType: record.requestType as OfflineRequestType,
      status: record.status as OfflineRequestStatus,
      priority: record.priority as OfflineRequestPriority,
      originalDetails: record.originalDetails,
      requestedChanges: record.requestedChanges,
      staffPricing: record.staffPricing || undefined,
      priceDifference: record.priceDifference || undefined,
      customerApproval: record.customerApproval || undefined,
      payment: record.payment || undefined,
      reissuedDocuments: record.reissuedDocuments || undefined,
      timeline: record.timeline,
      tags: record.tags,
      internalNotes: record.internalNotes,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  /**
   * Format audit log record
   */
  private formatAuditLog(record: any): OfflineRequestAuditLog {
    return {
      id: record.id,
      offlineRequestId: record.offlineRequestId,
      action: record.action as OfflineRequestAuditAction,
      actorId: record.actorId,
      actorType: record.actorType as any,
      oldValues: record.oldValues,
      newValues: record.newValues,
      details: record.details,
      createdAt: record.createdAt.toISOString(),
    };
  }

  /**
   * Send customer notification via queue
   * This integrates with the notification system to inform customers of status changes
   */
  private async notifyCustomer(request: OfflineChangeRequest, notificationType: string): Promise<void> {
    try {
      // Create notification queue entry
      await prisma.offlineRequestNotificationQueue.create({
        data: {
          offlineRequestId: request.id,
          status: 'pending',
          notificationType,
          recipientIds: [], // Populated by notification service
          content: {
            requestRef: request.requestRef,
            bookingRef: request.bookingRef,
            requestType: request.requestType,
            status: request.status,
            eventTime: new Date().toISOString(),
          },
          attemptCount: 0,
          maxAttempts: 5,
        },
      });
    } catch (error) {
      // Log but don't throw - notification failures shouldn't block the workflow
      console.error('Failed to queue notification:', error);
    }
  }
}

export default new OfflineRequestService();
