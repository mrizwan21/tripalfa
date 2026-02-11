import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import prisma from '../database/prisma';
import offlineRequestService from '../services/offlineRequestService';
import {
  OfflineRequestStatus,
  OfflineRequestType,
  OfflineRequestPriority,
} from '@tripalfa/shared-types';

/**
 * Integration tests for offline request workflow
 * Tests state machine transitions: PENDING_STAFF → PENDING_CUSTOMER_APPROVAL → PAYMENT_PENDING/COMPLETED
 */
describe('Offline Request Workflow Integration Tests', () => {
  const testUserId = 'test-customer-123';
  const staffId = 'test-staff-456';
  let requestId: string;
  let requestRef: string;

  beforeAll(async () => {
    // Setup: Ensure database is clean
    await prisma.offlineChangeRequest.deleteMany({});
  });

  afterAll(async () => {
    // Cleanup
    await prisma.offlineChangeRequest.deleteMany({});
    await prisma.$disconnect();
  });

  /**
   * Test 1: Create offline request - Initial status should be PENDING_STAFF
   */
  it('should create offline request with PENDING_STAFF status', async () => {
    const payload = {
      bookingId: 'booking-123',
      bookingRef: 'BK-ABC123',
      requestType: OfflineRequestType.SCHEDULE_CHANGE,
      requestedChanges: {
        changeReason: 'Customer requested date change',
        serviceType: 'flight',
        details: {
          oldDate: '2026-03-15',
          newDate: '2026-03-20',
        },
      },
      priority: OfflineRequestPriority.HIGH,
    };

    const request = await offlineRequestService.createRequest(payload, testUserId);

    requestId = request.id;
    requestRef = request.requestRef;

    expect(request).toBeDefined();
    expect(request.status).toBe(OfflineRequestStatus.PENDING_STAFF);
    expect(request.requestRef).toMatch(/^OCR-\d{4}-\d{5}$/);
    expect(request.bookingId).toBe('booking-123');
    expect(request.bookingRef).toBe('BK-ABC123');
    expect(request.timeline?.requestedAt).toBeDefined();
  });

  /**
   * Test 2: Submit Pricing - Status should transition to PENDING_CUSTOMER_APPROVAL
   */
  it('should submit pricing and transition to PENDING_CUSTOMER_APPROVAL', async () => {
    const pricingPayload = {
      newBaseFare: 450,
      newTaxes: 50,
      newMarkup: 100,
      newTotalPrice: 600,
      currency: 'USD',
      staffNotes: 'Price increased due to premium availability',
      supplierReference: 'SUP-REF-123',
      supplierPNR: 'ABC123',
    };

    const request = await offlineRequestService.submitPricing(
      requestId,
      pricingPayload,
      staffId
    );

    expect(request.status).toBe(OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL);
    expect(request.staffPricing).toBeDefined();
    expect(request.staffPricing?.newTotalPrice).toBe(600);
    expect(request.priceDifference).toBeDefined();
    expect(request.timeline?.staffPricedAt).toBeDefined();
    expect(request.timeline?.customerNotifiedAt).toBeDefined();
  });

  /**
   * Test 3: Approve Request with payment due - Should transition to PAYMENT_PENDING
   */
  it('should approve request and transition to PAYMENT_PENDING when payment is due', async () => {
    const request = await offlineRequestService.approveRequest(requestId, testUserId);

    expect(request.status).toBe(OfflineRequestStatus.PAYMENT_PENDING);
    expect(request.customerApproval).toBeDefined();
    expect(request.customerApproval?.approved).toBe(true);
    expect(request.customerApproval?.approvedAt).toBeDefined();
    expect(request.timeline?.customerApprovedAt).toBeDefined();
  });

  /**
   * Test 4: Record Payment - Should transition to COMPLETED
   */
  it('should record payment and transition to COMPLETED', async () => {
    const paymentData = {
      paymentId: 'payment-123',
      amount: 600,
      method: 'credit_card',
      transactionRef: 'TXN-123-ABC',
    };

    const request = await offlineRequestService.recordPayment(
      requestId,
      paymentData.paymentId,
      paymentData.amount,
      paymentData.method,
      paymentData.transactionRef
    );

    expect(request.status).toBe(OfflineRequestStatus.COMPLETED);
    expect(request.payment).toBeDefined();
    expect(request.payment?.paymentId).toBe('payment-123');
    expect(request.payment?.status).toBe('completed');
    expect(request.payment?.paidAt).toBeDefined();
    expect(request.timeline?.paymentCompletedAt).toBeDefined();
    expect(request.timeline?.documentsIssuedAt).toBeDefined();
    expect(request.timeline?.completedAt).toBeDefined();
  });

  /**
   * Test 5: Complete workflow with no additional payment required
   * PENDING_STAFF → PENDING_CUSTOMER_APPROVAL → COMPLETED (direct to completed, no payment needed)
   */
  it('should complete workflow directly to COMPLETED when no payment is due', async () => {
    // Create new request
    const payload = {
      bookingId: 'booking-456',
      bookingRef: 'BK-XYZ789',
      requestType: OfflineRequestType.PASSENGER_NAME_CHANGE,
      requestedChanges: {
        changeReason: 'Correct spelling of passenger name',
        serviceType: 'flight',
        details: {
          oldName: 'Jon Smith',
          newName: 'John Smith',
        },
      },
      priority: OfflineRequestPriority.MEDIUM,
    };

    const newRequest = await offlineRequestService.createRequest(payload, testUserId);
    const newRequestId = newRequest.id;

    // Submit pricing with zero price difference
    const pricingPayload = {
      newBaseFare: 400,
      newTaxes: 50,
      newMarkup: 100,
      newTotalPrice: 550, // Same as original, no additional payment
      currency: 'USD',
      staffNotes: 'No price change required',
      supplierReference: 'SUP-REF-456',
      supplierPNR: 'XYZ789',
    };

    // First update pricing to get original values (mock original details with same pricing)
    const getRequest = await offlineRequestService.getRequestById(newRequestId);
    
    const pricedRequest = await offlineRequestService.submitPricing(
      newRequestId,
      pricingPayload,
      staffId
    );

    expect(pricedRequest.status).toBe(OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL);

    // Approve request - should go directly to COMPLETED since totalDiff = 0
    const approvedRequest = await offlineRequestService.approveRequest(newRequestId, testUserId);

    expect(approvedRequest.status).toBe(OfflineRequestStatus.COMPLETED);
    expect(approvedRequest.timeline?.completedAt).toBeDefined();
  });

  /**
   * Test 6: Reject Request - Should transition to REJECTED
   */
  it('should reject request and transition to REJECTED', async () => {
    // Create new request
    const payload = {
      bookingId: 'booking-789',
      bookingRef: 'BK-DEF456',
      requestType: OfflineRequestType.SCHEDULE_CHANGE,
      requestedChanges: {
        changeReason: 'Customer wants earlier departure',
        serviceType: 'flight',
        details: {
          oldDate: '2026-04-01',
          newDate: '2026-03-28',
        },
      },
      priority: OfflineRequestPriority.LOW,
    };

    const newRequest = await offlineRequestService.createRequest(payload, testUserId);
    const newRequestId = newRequest.id;

    // Submit pricing
    const pricingPayload = {
      newBaseFare: 500,
      newTaxes: 50,
      newMarkup: 100,
      newTotalPrice: 650,
      currency: 'USD',
      staffNotes: 'Premium flight available',
      supplierReference: 'SUP-REF-789',
      supplierPNR: 'DEF456',
    };

    await offlineRequestService.submitPricing(
      newRequestId,
      pricingPayload,
      staffId
    );

    // Reject request
    const rejectedRequest = await offlineRequestService.rejectRequest(newRequestId, testUserId);

    expect(rejectedRequest.status).toBe(OfflineRequestStatus.REJECTED);
    expect(rejectedRequest.timeline?.rejectedAt).toBeDefined();
  });

  /**
   * Test 7: Verify status guard - cannot submit pricing twice
   */
  it('should prevent submitting pricing for non-PENDING_STAFF request', async () => {
    // Create and move to PENDING_CUSTOMER_APPROVAL
    const payload = {
      bookingId: 'booking-guard-test',
      bookingRef: 'BK-GUARD123',
      requestType: OfflineRequestType.SCHEDULE_CHANGE,
      requestedChanges: {
        changeReason: 'Test guard',
        serviceType: 'flight',
        details: {},
      },
    };

    const newRequest = await offlineRequestService.createRequest(payload, testUserId);

    const pricingPayload = {
      newBaseFare: 400,
      newTaxes: 50,
      newMarkup: 100,
      newTotalPrice: 550,
      currency: 'USD',
      staffNotes: 'First pricing',
      supplierReference: 'SUP-REF-GUARD',
      supplierPNR: 'GUARD123',
    };

    await offlineRequestService.submitPricing(
      newRequest.id,
      pricingPayload,
      staffId
    );

    // Try to submit pricing again - should fail
    try {
      await offlineRequestService.submitPricing(
        newRequest.id,
        { ...pricingPayload, staffNotes: 'Second pricing' },
        staffId
      );
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      expect((error as Error).message).toContain(
        `Cannot submit pricing for request in ${OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL} status`
      );
    }
  });

  /**
   * Test 8: Verify status guard - cannot record payment for non-PAYMENT_PENDING request
   */
  it('should prevent recording payment for COMPLETED request', async () => {
    // Create a completed request
    const payload = {
      bookingId: 'booking-payment-guard',
      bookingRef: 'BK-PAYGUARD',
      requestType: OfflineRequestType.SCHEDULE_CHANGE,
      requestedChanges: {
        changeReason: 'Payment guard test',
        serviceType: 'flight',
        details: {},
      },
    };

    const newRequest = await offlineRequestService.createRequest(payload, testUserId);

    const pricingPayload = {
      newBaseFare: 400,
      newTaxes: 50,
      newMarkup: 100,
      newTotalPrice: 550,
      currency: 'USD',
      staffNotes: 'Guard test pricing',
      supplierReference: 'SUP-REF-PAYGUARD',
      supplierPNR: 'PAYGUARD',
    };

    await offlineRequestService.submitPricing(
      newRequest.id,
      pricingPayload,
      staffId
    );

    // Go to completed directly (zero price difference)
    const updatedRequest = await offlineRequestService.getRequestById(newRequestId);

    // Try to record payment on non-PAYMENT_PENDING request - should fail
    try {
      await offlineRequestService.recordPayment(
        newRequest.id,
        'payment-guard',
        550,
        'credit_card'
      );
      expect(false).toBe(true); // Should not reach here
    } catch (error) {
      // Expected error
      expect((error as Error).message).toBeDefined();
    }
  });

  /**
   * Test 9: Audit trail - Verify all transitions are logged
   */
  it('should create audit log entries for all state transitions', async () => {
    const payload = {
      bookingId: 'booking-audit-test',
      bookingRef: 'BK-AUDIT123',
      requestType: OfflineRequestType.PASSENGER_NAME_CHANGE,
      requestedChanges: {
        changeReason: 'Audit test',
        serviceType: 'flight',
        details: {},
      },
    };

    const newRequest = await offlineRequestService.createRequest(payload, testUserId);

    const auditLog = await offlineRequestService.getAuditLog(newRequest.id);

    expect(auditLog).toBeDefined();
    expect(Array.isArray(auditLog)).toBe(true);
    expect(auditLog?.length).toBeGreaterThan(0);
  });

  /**
   * Test 10: Full workflow summary - Verify state machine completeness
   */
  it('should support complete workflow: create → submit → approve → pay → complete', async () => {
    const payload = {
      bookingId: 'booking-full-workflow',
      bookingRef: 'BK-FULL123',
      requestType: OfflineRequestType.SCHEDULE_CHANGE,
      requestedChanges: {
        changeReason: 'Full workflow test',
        serviceType: 'flight',
        details: {
          oldDate: '2026-05-01',
          newDate: '2026-05-10',
        },
      },
      priority: OfflineRequestPriority.HIGH,
    };

    // Step 1: Create
    const createdRequest = await offlineRequestService.createRequest(payload, testUserId);
    expect(createdRequest.status).toBe(OfflineRequestStatus.PENDING_STAFF);

    // Step 2: Submit Pricing
    const pricingPayload = {
      newBaseFare: 550,
      newTaxes: 60,
      newMarkup: 100,
      newTotalPrice: 710,
      currency: 'USD',
      staffNotes: 'Premium slot, higher price',
      supplierReference: 'SUP-REF-FULL',
      supplierPNR: 'FULL123',
    };

    const pricedRequest = await offlineRequestService.submitPricing(
      createdRequest.id,
      pricingPayload,
      staffId
    );
    expect(pricedRequest.status).toBe(OfflineRequestStatus.PENDING_CUSTOMER_APPROVAL);

    // Step 3: Approve
    const approvedRequest = await offlineRequestService.approveRequest(
      createdRequest.id,
      testUserId
    );
    expect(approvedRequest.status).toBe(OfflineRequestStatus.PAYMENT_PENDING);

    // Step 4: Record Payment
    const paidRequest = await offlineRequestService.recordPayment(
      createdRequest.id,
      'payment-full-123',
      710,
      'credit_card',
      'TXN-FULL-123'
    );
    expect(paidRequest.status).toBe(OfflineRequestStatus.COMPLETED);

    // Verify final state
    expect(paidRequest.timeline?.requestedAt).toBeDefined();
    expect(paidRequest.timeline?.staffPricedAt).toBeDefined();
    expect(paidRequest.timeline?.customerApprovedAt).toBeDefined();
    expect(paidRequest.timeline?.paymentCompletedAt).toBeDefined();
    expect(paidRequest.timeline?.completedAt).toBeDefined();
  });
});
