/**
 * Integration Tests: Offline Request Workflow
 * 
 * Tests the complete state machine transitions:
 * PENDING_STAFF → PENDING_CUSTOMER_APPROVAL → PAYMENT_PENDING → COMPLETED
 * 
 * Verifies:
 * - State machine transitions work correctly
 * - Timeline is populated at each transition
 * - Customer notifications are queued
 * - Audit logs are created
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import offlineRequestService from '../../services/offlineRequestService';
import prisma from '../../database/prisma';
import {
  OfflineRequestStatus,
  CreateOfflineRequestPayload,
  SubmitPricingPayload,
} from '@tripalfa/shared-types';

describe('Offline Request Workflow Integration Tests', () => {
  let requestId: string;
  let requestRef: string;
  const staffId = 'test-staff-12345';
  const customerId = 'test-customer-67890';
  const bookingId = 'test-booking-abc123';
  const bookingRef = 'BK-TEST-001';

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.offlineChangeRequest.deleteMany({});
    await prisma.offlineRequestAuditLog.deleteMany({});
    await prisma.offlineRequestNotificationQueue.deleteMany({});
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.offlineChangeRequest.deleteMany({});
    await prisma.offlineRequestAuditLog.deleteMany({});
    await prisma.offlineRequestNotificationQueue.deleteMany({});
  });

  it('✓ Phase 1: Create offline request in PENDING_STAFF status', async () => {
    const payload: CreateOfflineRequestPayload = {
      bookingId,
      bookingRef,
      requestType: 'hotel_change_request',
      priority: 'high',
      originalDetails: {
        hotelName: 'Grand Hotel',
        checkIn: '2026-02-20',
        checkOut: '2026-02-25',
        roomType: 'Deluxe Suite',
        pricing: {
          baseFare: 500,
          taxes: 50,
          markup: 25,
          totalPrice: 575,
        },
      },
      requestedChanges: {
        hotelName: 'Premium Resort',
        roomType: 'Presidential Suite',
      },
    };

    const request = await offlineRequestService.createRequest(payload, customerId);

    expect(request).toBeDefined();
    expect(request.status).toBe(OfflineRequestStatus.PENDING_STAFF);
    expect(request.bookingId).toBe(bookingId);
    expect(request.requestRef).toMatch(/^REQ-/);

    requestId = request.id;
    requestRef = request.requestRef;

    console.log(`✓ Created offline request: ${requestRef} (ID: ${requestId})`);
  });

  it('✓ Phase 2: Submit pricing - transitions PENDING_STAFF → PENDING_CUSTOMER_APPROVAL', async () => {
    const pricingPayload: SubmitPricingPayload = {
      newBaseFare: 550, // +50
      newTaxes: 55, // +5
      newMarkup: 30, // +5
      newTotalPrice: 635, // +60
      currency: 'USD',
      staffNotes: 'Premium room upgrade available',
    };

    const request = await offlineRequestService.submitPricing(
      requestId,
      pricingPayload,
      staffId
    );

    // Verify state machine transition
    expect(request.status).toBe(OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL);

    // Verify pricing data
    const staffPricing = request.staffPricing as any;
    expect(staffPricing.newBaseFare).toBe(550);
    expect(staffPricing.newTotalPrice).toBe(635);

    // Verify price difference calculation
    const priceDiff = request.priceDifference as any;
    expect(priceDiff.totalDiff).toBe(60);

    // Verify timeline population
    const timeline = request.timeline as any;
    expect(timeline.pricingSubmittedAt).toBeDefined();
    expect(timeline.customerNotifiedAt).toBeDefined();

    console.log(`✓ Pricing submitted. Status: ${OfflineRequestStatus.PENDING_STAFF} → ${request.status}`);
    console.log(`  Price difference: $${priceDiff.totalDiff} (Currency: ${priceDiff.currency})`);
  });

  it('✓ Phase 3: Verify customer notification was queued', async () => {
    const notifications = await prisma.offlineRequestNotificationQueue.findMany({
      where: { offlineRequestId: requestId },
    });

    expect(notifications.length).toBeGreaterThan(0);
    const pricingNotif = notifications.find(n => n.notificationType === 'pricing_submitted');
    expect(pricingNotif).toBeDefined();
    expect(pricingNotif?.status).toBe('pending');

    console.log(`✓ Customer notification queued: ${pricingNotif?.notificationType}`);
  });

  it('✓ Phase 4: Customer approves - transitions PENDING_CUSTOMER_APPROVAL → PAYMENT_PENDING', async () => {
    const request = await offlineRequestService.approveRequest(requestId, customerId);

    // Verify state machine transition (should go to PAYMENT_PENDING due to price difference)
    expect(request.status).toBe(OfflineRequestStatus.PAYMENT_PENDING);

    // Verify approval data
    const approval = request.customerApproval as any;
    expect(approval.approved).toBe(true);
    expect(approval.approvedAt).toBeDefined();

    // Verify timeline
    const timeline = request.timeline as any;
    expect(timeline.customerApprovedAt).toBeDefined();

    console.log(`✓ Request approved. Status: ${OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL} → ${request.status}`);
  });

  it('✓ Phase 5: Record payment - transitions PAYMENT_PENDING → COMPLETED', async () => {
    const request = await offlineRequestService.recordPayment(
      requestId,
      'pay-12345',
      60, // Amount matching price difference
      'credit_card',
      'txn-abc123'
    );

    // Verify state machine transition
    expect(request.status).toBe(OfflineRequestStatus.COMPLETED);

    // Verify payment data
    const payment = request.payment as any;
    expect(payment.paymentId).toBe('pay-12345');
    expect(payment.amount).toBe(60);
    expect(payment.status).toBe('completed');

    // Verify timeline fully populated
    const timeline = request.timeline as any;
    expect(timeline.paymentCompletedAt).toBeDefined();
    expect(timeline.documentsIssuedAt).toBeDefined();
    expect(timeline.completedAt).toBeDefined();

    console.log(`✓ Payment recorded. Status: ${OfflineRequestStatus.PAYMENT_PENDING} → ${request.status}`);
    console.log(`  Payment: ${payment.paymentId} ($${payment.amount} ${payment.currency})`);
  });

  it('✓ Phase 6: Verify audit trail', async () => {
    const auditLogs = await prisma.offlineRequestAuditLog.findMany({
      where: { offlineRequestId: requestId },
      orderBy: { createdAt: 'asc' },
    });

    // Should have entries for: create, pricing, approve, payment
    expect(auditLogs.length).toBeGreaterThanOrEqual(3);

    const actions = auditLogs.map(log => log.action);
    expect(actions).toContain('PRICING_SUBMITTED');
    expect(actions).toContain('APPROVED');

    console.log(`✓ Audit trail verified (${auditLogs.length} entries)`);
    auditLogs.forEach(log => {
      console.log(`  - ${log.action} by ${log.actorType} ${log.actorId}`);
    });
  });

  it('✓ Phase 7: Verify complete request retrieval and history', async () => {
    const request = await offlineRequestService.getRequestById(requestId);

    expect(request).toBeDefined();
    expect(request?.status).toBe(OfflineRequestStatus.COMPLETED);

    // Verify all data is preserved
    expect(request?.requestRef).toBe(requestRef);
    expect(request?.bookingId).toBe(bookingId);
    expect(request?.originalDetails).toBeDefined();
    expect(request?.staffPricing).toBeDefined();
    expect(request?.payment).toBeDefined();
    expect(request?.customerApproval).toBeDefined();

    console.log(`✓ Completed request retrieved: ${request?.requestRef}`);
    console.log(`  Original price: $${(request?.originalDetails as any).pricing.totalPrice}`);
    console.log(`  Final price: $${(request?.staffPricing as any).newTotalPrice}`);
  });

  it('✓ Reject workflow: Customer can reject pricing', async () => {
    // Create a new request for rejection test
    const payload: CreateOfflineRequestPayload = {
      bookingId: 'test-booking-reject',
      bookingRef: 'BK-TEST-REJ',
      requestType: 'hotel_change_request',
      priority: 'medium',
      originalDetails: { pricing: { baseFare: 300, taxes: 30, markup: 15, totalPrice: 345 } },
      requestedChanges: { roomType: 'Any available' },
    };

    const request = await offlineRequestService.createRequest(payload, customerId);
    const testRequestId = request.id;

    // Submit pricing
    await offlineRequestService.submitPricing(
      testRequestId,
      {
        newBaseFare: 400,
        newTaxes: 40,
        newMarkup: 20,
        newTotalPrice: 460,
        currency: 'USD',
      },
      staffId
    );

    // Customer rejects
    const rejectedRequest = await offlineRequestService.rejectRequest(
      testRequestId,
      customerId,
      'Price increase too high'
    );

    expect(rejectedRequest.status).toBe(OfflineRequestStatus.REJECTED);
    const approval = rejectedRequest.customerApproval as any;
    expect(approval.approved).toBe(false);
    expect(approval.rejectionReason).toBe('Price increase too high');

    console.log(`✓ Rejection workflow verified: ${rejectedRequest.requestRef} → ${rejectedRequest.status}`);
  });

  it('✓ Internal notes: Staff can add notes', async () => {
    const noteText = 'Contact hotel for room upgrade availability';
    const request = await offlineRequestService.addInternalNote(
      requestId,
      noteText,
      staffId
    );

    const internalNotes = request.internalNotes as any;
    expect(internalNotes).toContain(noteText);

    console.log(`✓ Internal note added: "${noteText}"`);
  });

  it('✓ State machine guard: Cannot submit pricing to non-PENDING_STAFF request', async () => {
    // Request is now in COMPLETED status
    expect.assertions(1);

    try {
      await offlineRequestService.submitPricing(
        requestId,
        {
          newBaseFare: 600,
          newTaxes: 60,
          newMarkup: 30,
          newTotalPrice: 690,
          currency: 'USD',
        },
        staffId
      );
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect((error as Error).message).toContain('Cannot submit pricing');
      console.log(`✓ State guard working: Cannot re-submit pricing for ${OfflineRequestStatus.COMPLETED} request`);
    }
  });

  it('✓ State machine guard: Cannot approve non-PENDING_CUSTOMER_APPROVAL request', async () => {
    // Create a request and skip to PENDING_STAFF for second attempt
    const payload: CreateOfflineRequestPayload = {
      bookingId: 'test-booking-guard',
      bookingRef: 'BK-TEST-GUARD',
      requestType: 'flight_change',
      priority: 'low',
      originalDetails: { pricing: { baseFare: 200, taxes: 20, markup: 10, totalPrice: 230 } },
      requestedChanges: { flightTime: 'Evening departure' },
    };

    const request = await offlineRequestService.createRequest(payload, customerId);

    expect.assertions(1);

    try {
      // Try to approve PENDING_STAFF request (should fail)
      await offlineRequestService.approveRequest(request.id, customerId);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect((error as Error).message).toContain('Cannot approve request');
      console.log(`✓ State guard working: Cannot approve ${OfflineRequestStatus.PENDING_STAFF} request`);
    }
  });
});
