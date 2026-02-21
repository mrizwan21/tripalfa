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
  StaffPricing,
} from '@tripalfa/shared-types';
import prisma from '../database/prisma';
import { createLogger } from '@tripalfa/shared-utils/logger';
const logger = createLogger({ serviceName: 'booking-engine' });
import bookingService from './bookingService';
import paymentService from './paymentService';
import { DocumentGenerationService } from './documentGenerationService';
import { NotificationService } from './notificationService';
import emailService from './mailjetEmailService';
import { CacheService } from '../cache/redis';
import { BookingDocument } from '../types/enhancedBooking';

// Instantiate services
const notificationService = new NotificationService(new CacheService());

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
    // Step 1: Verify booking exists
    let booking;
    try {
      booking = await bookingService.getBookingById(payload.bookingId);
    } catch (error) {
      logger.error('Error fetching booking', { bookingId: payload.bookingId, error });
    }

    if (!booking) {
      throw new Error(`Booking not found: ${payload.bookingId}`);
    }

    // Verify customer ownership (if customer is creating the request)
    if (booking.userId !== userId && userId !== 'system') {
      throw new Error('Forbidden: You do not own this booking');
    }

    // Step 2: Check for existing active request
    const activeRequest = await prisma.offlineChangeRequest.findFirst({
      where: {
        bookingId: payload.bookingId,
        status: {
          in: [
            OfflineRequestStatus.PENDING_STAFF,
            OfflineRequestStatus.PRICING_SUBMITTED,
            OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL,
            OfflineRequestStatus.APPROVED,
            OfflineRequestStatus.PAYMENT_PENDING,
          ],
        },
      },
    });

    if (activeRequest) {
      throw new Error(
        `Active request already exists for this booking (${activeRequest.requestRef})`
      );
    }

    // Step 3: Prepare request reference and timeline
    const year = new Date().getFullYear();
    const requestRef = this.generateRequestRef(year);

    const timeline = {
      requestedAt: new Date().toISOString(),
      requestedBy: userId,
    };

    // Step 4: Populate original booking details from actual booking
    const originalDetails = {
      serviceType: payload.requestedChanges.serviceType,
      itinerary: (booking as any).itinerary || {},
      pricing: {
        baseFare: (booking as any).pricing?.baseFare || 0,
        taxes: (booking as any).pricing?.taxes || 0,
        markup: (booking as any).pricing?.markup || 0,
        totalPrice: (booking as any).pricing?.totalPrice || 0,
        currency: (booking as any).pricing?.currency || 'USD',
      },
      documents: (booking as any).documents || {},
      bookingRef: payload.bookingRef,
      customerEmail: (booking as any).customerEmail,
      customerName: (booking as any).customerName,
    };

    // Step 5: Create the offline request
    const offlineRequest = await prisma.offlineChangeRequest.create({
      data: {
        requestRef,
        bookingId: payload.bookingId,
        bookingRef: payload.bookingRef,
        requestType: payload.requestType,
        status: OfflineRequestStatus.PENDING_STAFF,
        priority: payload.priority || OfflineRequestPriority.MEDIUM,
        originalDetails,
        requestedChanges: payload.requestedChanges,
        timeline,
        tags: [],
        internalNotes: [],
      },
    });

    // Step 6: Create audit log entry
    await this.createAuditLog(
      offlineRequest.id,
      OfflineRequestAuditAction.CREATED,
      userId,
      'customer',
      undefined,
      {
        requestType: payload.requestType,
        changeReason: payload.requestedChanges.changeReason,
        bookingId: payload.bookingId,
      }
    );

    // Step 7: Send notification to customer
    await this.notifyCustomer(offlineRequest as any, 'request_created');

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
    const currentPricing = originalDetails?.pricing || {
      baseFare: 0,
      taxes: 0,
      markup: 0,
      totalPrice: 0,
    };

    // Validate required payload fields
    if (payload.newBaseFare === undefined || payload.newTaxes === undefined ||
      payload.newMarkup === undefined || payload.newTotalPrice === undefined) {
      throw new Error('Missing required pricing fields');
    }

    // Calculate price difference
    const priceDifference = {
      baseFareDiff: payload.newBaseFare - (currentPricing.baseFare || 0),
      taxesDiff: payload.newTaxes - (currentPricing.taxes || 0),
      markupDiff: payload.newMarkup - (currentPricing.markup || 0),
      totalDiff:
        payload.newTotalPrice -
        ((currentPricing.baseFare || 0) +
          (currentPricing.taxes || 0) +
          (currentPricing.markup || 0)),
      currency: payload.currency,
    } as any;

    const staffPricing: StaffPricing = {
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
        staffPricing: staffPricing as any,
        priceDifference: priceDifference as any,
        timeline,
        updatedAt: new Date(),
      },
    });

    // Notify customer via notification hook
    await this.notifyCustomer(updatedRequest as any, 'pricing_submitted');

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
        staffPricing: staffPricing as any,
        priceDifference: priceDifference as any,
      }
    );

    return this.formatOfflineRequest(updatedRequest as any);
  }

  /**
   * Customer approves the pricing
   */
  async approveRequest(
    requestId: string,
    userId: string,
    approved: boolean,
    rejectionReason?: string
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
        `Cannot approve/reject request in ${request.status} status`
      );
    }

    // Handle rejection case
    if (!approved) {
      if (!rejectionReason) {
        throw new Error('rejectionReason is required when rejecting');
      }

      const customerApproval = {
        approved: false,
        rejectionReason,
      };

      const timeline = (request.timeline || {}) as any;
      timeline.rejectedAt = new Date().toISOString();

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

      // Notify customer of rejection
      await this.notifyCustomer(updatedRequest as any, 'request_rejected');

      return this.formatOfflineRequest(updatedRequest);
    }

    // Handle approval case
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
    const isZeroAmountApproval = totalDueAmount <= 0;
    const nextStatus = totalDueAmount > 0
      ? OfflineRequestStatus.PAYMENT_PENDING
      : OfflineRequestStatus.COMPLETED;

    // If going directly to completed, execute completion workflow
    if (isZeroAmountApproval) {
      return this.finalizeRequestCompletion(requestId, userId, 'system', 0, 'none');
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
    await this.notifyCustomer(updatedRequest as any, 'request_approved');

    // Create audit log
    await this.createAuditLog(
      requestId,
      OfflineRequestAuditAction.APPROVED,
      userId,
      'customer',
      { status: request.status },
      { nextStatus }
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
    transactionRef?: string,
    paymentDetails?: Record<string, any>
  ): Promise<OfflineChangeRequest> {
    const request = await prisma.offlineChangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error('Offline request not found');
    }

    // Check if request is in valid state for payment (APPROVED or PAYMENT_PENDING)
    if (![OfflineRequestStatus.APPROVED, OfflineRequestStatus.PAYMENT_PENDING].includes(request.status as OfflineRequestStatus)) {
      throw new Error(
        `Cannot process payment for request in ${request.status} status`
      );
    }

    // Validate payment amount against price difference
    const priceDifference = (request.priceDifference as any) || {};
    const expectedAmount = priceDifference.totalDiff || 0;
    const currency = priceDifference.currency || 'USD';

    if (Math.abs(amount - expectedAmount) > 0.01) {
      throw new Error(
        `Payment amount (${amount}) does not match expected amount (${expectedAmount})`
      );
    }

    try {
      // Step 1: Process payment via payment service
      // PaymentService.processPayment(orderId, amount, currency, method) returns PaymentRecord
      const paymentRecord = await paymentService.processPayment(
        requestId, // Use requestId as orderId
        amount,
        currency,
        (method === 'wallet' ? 'balance' : 'card') as 'balance' | 'card' // Map method names
      );

      if (paymentRecord.status !== 'completed') {
        throw new Error(`Payment processing failed: ${paymentRecord.errorMessage || 'Unknown error'}`);
      }

      return this.finalizeRequestCompletion(
        requestId,
        'system',
        method,
        amount,
        paymentRecord.reference || transactionRef || paymentId,
        paymentDetails
      );
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error processing payment', { requestId, error: errorMsg });

      // Log payment failure for audit
      await this.createAuditLog(
        requestId,
        'PAYMENT_PROCESSED' as any,
        'system',
        'system',
        { status: request.status },
        { error: errorMsg, failed: true }
      );

      // Send failure notification if possible
      try {
        const failedBooking = await bookingService.getBookingById(request.bookingId);
        await notificationService.sendPaymentNotification(
          failedBooking as any,
          'failed',
          amount
        );
      } catch (notifError) {
        logger.error('Error sending payment failure notification', { requestId, error: notifError });
      }

      throw error;
    }
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
      OfflineRequestAuditAction.COMPLETED,
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

    // Create audit log\n    await this.createAuditLog(\n      requestId,\n      'NOTE_ADDED' as any,\n      staffId,\n      'staff',\n      undefined,\n      { note }\n    );

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
  /**
   * Finalize the completion of an offline request:
   * 1. Update original booking details
   * 2. Generate and send reissued documents
   * 3. Update request status to COMPLETED
   */
  private async finalizeRequestCompletion(
    requestId: string,
    userId: string,
    paymentMethod: string,
    paymentAmount: number,
    transactionRef: string,
    paymentDetails?: any
  ): Promise<OfflineChangeRequest> {
    const request = await prisma.offlineChangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) throw new Error('Offline request not found');

    const requestedChanges = (request.requestedChanges as any);
    const staffPricing = (request.staffPricing as any) as StaffPricing;
    const currentPriceDiff = (request.priceDifference as any)?.totalDiff || 0;

    // Step 1: Pre-generate documents to get new ticket/voucher numbers
    const docService = new DocumentGenerationService(emailService);
    const booking = await bookingService.getBookingById(request.bookingId);
    const generatedDocs: BookingDocument[] = [];
    const documentUrls: Array<{ type: string; url: string; number?: string }> = [];

    let newTicketNumber: string | undefined;
    let newVoucherNumber: string | undefined;

    // Generate reissued ticket/voucher
    if (booking.type === 'flight') {
      const originalTicketNumber = (request.originalDetails as any)?.itinerary?.ticketNumber || booking.ticketNumber || 'N/A';
      const reissuedTicket = await docService.generateReissuedETicket(
        originalTicketNumber,
        requestedChanges?.newItinerary,
        staffPricing,
        booking as any,
        request as any
      );
      generatedDocs.push(reissuedTicket);
      newTicketNumber = reissuedTicket.metadata?.newTicketNumber;
      documentUrls.push({
        type: 'reissued_e_ticket',
        url: reissuedTicket.fileUrl,
        number: newTicketNumber
      });
    } else if (booking.type === 'hotel') {
      const originalVoucherNumber = (request.originalDetails as any)?.itinerary?.voucherNumber || booking.voucherNumber || 'N/A';
      const reissuedVoucher = await docService.generateReissuedHotelVoucher(
        originalVoucherNumber,
        requestedChanges?.newItinerary,
        staffPricing,
        booking as any,
        request as any
      );
      generatedDocs.push(reissuedVoucher);
      newVoucherNumber = reissuedVoucher.metadata?.newVoucherNumber;
      documentUrls.push({
        type: 'reissued_hotel_voucher',
        url: reissuedVoucher.fileUrl,
        number: newVoucherNumber
      });
    }

    // Generate amendment invoice (if there was a price diff or even if zero)
    const amendmentInvoice = await docService.generateAmendmentInvoice(
      booking as any,
      currentPriceDiff,
      request as any
    );
    generatedDocs.push(amendmentInvoice);
    documentUrls.push({ type: 'amendment_invoice', url: amendmentInvoice.fileUrl });

    // Generate receipt if payment was made
    if (paymentAmount > 0) {
      const receipt = await docService.generateAdditionalPaymentReceipt(
        booking as any,
        {
          paymentId: transactionRef,
          amount: paymentAmount,
          currency: staffPricing.currency,
          method: paymentMethod,
          status: 'completed',
          paidAt: new Date().toISOString(),
          transactionRef,
          paymentDetails
        } as any,
        request as any
      );
      generatedDocs.push(receipt);
      documentUrls.push({ type: 'receipt', url: receipt.fileUrl });
    }

    // Step 2: Update original booking with new details AND new numbers
    const updatedBooking = await bookingService.updateOriginalBooking(
      request.bookingId,
      requestedChanges?.newItinerary,
      staffPricing,
      newTicketNumber,
      newVoucherNumber,
      staffPricing?.supplierPNR,
      request.requestRef,
      paymentAmount,
      requestedChanges?.changeReason
    );

    // Step 3: Send documents to customer
    const customerEmail = updatedBooking.customerEmail || updatedBooking.passengers?.[0]?.email;
    if (customerEmail) {
      await docService.sendDocuments(
        generatedDocs,
        customerEmail,
        updatedBooking.customerName || updatedBooking.passengers?.[0]?.firstName
      );
    }

    // Step 4: Update request status and store reissued documents metadata
    const payment = paymentAmount > 0 ? {
      paymentId: transactionRef,
      amount: paymentAmount,
      currency: staffPricing.currency,
      method: paymentMethod,
      status: 'completed',
      paidAt: new Date().toISOString(),
      transactionRef,
      paymentDetails,
    } : undefined;

    const timeline = (request.timeline || {}) as any;
    if (paymentAmount > 0) timeline.paymentCompletedAt = new Date().toISOString();
    timeline.customerApprovedAt = timeline.customerApprovedAt || new Date().toISOString();
    timeline.documentsIssuedAt = new Date().toISOString();
    timeline.completedAt = new Date().toISOString();

    const updatedRequest = await prisma.offlineChangeRequest.update({
      where: { id: requestId },
      data: {
        status: OfflineRequestStatus.COMPLETED,
        payment: payment || undefined,
        reissuedDocuments: documentUrls as any,
        timeline,
        updatedAt: new Date(),
      },
    });

    // Notify customer
    await this.notifyCustomer(updatedRequest as any, 'request_completed');

    // Audit log
    await this.createAuditLog(
      requestId,
      OfflineRequestAuditAction.COMPLETED,
      userId,
      userId === 'system' ? 'system' : 'staff',
      { status: request.status },
      { reissuedDocuments: documentUrls }
    );

    return this.formatOfflineRequest(updatedRequest);
  }

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
    const requestType = (record.requestType || 'other') as OfflineRequestType;
    const status = (record.status || OfflineRequestStatus.PENDING_STAFF) as OfflineRequestStatus;
    const priority = (record.priority || OfflineRequestPriority.MEDIUM) as OfflineRequestPriority;

    return {
      id: record.id,
      requestRef: record.requestRef,
      bookingId: record.bookingId,
      bookingRef: record.bookingRef,
      requestType,
      status,
      priority,
      originalDetails: record.originalDetails as any,
      requestedChanges: record.requestedChanges as any,
      staffPricing: record.staffPricing ? (record.staffPricing as StaffPricing) : undefined,
      priceDifference: record.priceDifference ? (record.priceDifference as PriceDifference) : undefined,
      customerApproval: record.customerApproval ? (record.customerApproval as any) : undefined,
      payment: record.payment ? (record.payment as any) : undefined,
      reissuedDocuments: record.reissuedDocuments ? (record.reissuedDocuments as any) : undefined,
      timeline: record.timeline as any,
      tags: record.tags || [],
      internalNotes: record.internalNotes || [],
      createdAt: record.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: record.updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  }

  /**
   * Format audit log record
   */
  private formatAuditLog(record: any): OfflineRequestAuditLog {
    return {
      id: record.id,
      offlineRequestId: record.offlineRequestId,
      action: (record.action || 'created') as OfflineRequestAuditAction,
      actorId: record.actorId,
      actorType: (record.actorType || 'system') as 'customer' | 'staff' | 'system',
      oldValues: record.oldValues,
      newValues: record.newValues,
      details: record.details,
      createdAt: record.createdAt?.toISOString?.() || new Date().toISOString(),
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
