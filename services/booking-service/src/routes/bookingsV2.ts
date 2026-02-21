/**
 * Booking Management V2 Routes
 * 
 * New v2 endpoints with full workflow state machine:
 * - GET  /api/v2/admin/bookings - List bookings
 * - GET  /api/v2/admin/bookings/:id - Get booking details
 * - POST /api/v2/admin/bookings - Create booking
 * - GET  /api/v2/admin/bookings/queues - List queues
 * - POST /api/v2/admin/bookings/:id/pricing - Calculate/save pricing
 * - POST /api/v2/admin/bookings/:id/invoice - Generate invoice
 * - POST /api/v2/admin/bookings/:id/pay-wallet - Process wallet payment
 * - PUT  /api/v2/admin/bookings/:id/status - Update workflow state
 * - POST /api/v2/admin/bookings/:id/queue-action - Perform queue action
 */

import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { prisma } from '@tripalfa/shared-database';
import axios from 'axios';

const router: ExpressRouter = Router();

// Environment configuration
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004';
const BOOKING_ENGINE_URL = process.env.BOOKING_ENGINE_URL || 'http://localhost:3001';

// ============================================
// Workflow State Machine Types
// ============================================

export enum WorkflowState {
  DRAFT = 'draft',
  QUEUED = 'queued',
  PRICING = 'pricing',
  INVOICED = 'invoiced',
  PAYMENT_PENDING = 'payment_pending',
  PAYMENT_CONFIRMED = 'payment_confirmed',
  SUPPLIER_BOOKING = 'supplier_booking',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Valid state transitions
const STATE_TRANSITIONS: Record<WorkflowState, WorkflowState[]> = {
  [WorkflowState.DRAFT]: [WorkflowState.QUEUED, WorkflowState.CANCELLED],
  [WorkflowState.QUEUED]: [WorkflowState.PRICING, WorkflowState.CANCELLED],
  [WorkflowState.PRICING]: [WorkflowState.INVOICED, WorkflowState.CANCELLED],
  [WorkflowState.INVOICED]: [WorkflowState.PAYMENT_PENDING, WorkflowState.CANCELLED],
  [WorkflowState.PAYMENT_PENDING]: [WorkflowState.PAYMENT_CONFIRMED, WorkflowState.CANCELLED],
  [WorkflowState.PAYMENT_CONFIRMED]: [WorkflowState.SUPPLIER_BOOKING, WorkflowState.CANCELLED],
  [WorkflowState.SUPPLIER_BOOKING]: [WorkflowState.CONFIRMED, WorkflowState.CANCELLED],
  [WorkflowState.CONFIRMED]: [WorkflowState.COMPLETED, WorkflowState.CANCELLED],
  [WorkflowState.COMPLETED]: [],
  [WorkflowState.CANCELLED]: []
};

// ============================================
// Pricing Engine Types
// ============================================

interface PricingBreakdown {
  baseAmount: number;
  markupAmount: number;
  commissionAmount: number;
  discountAmount: number;
  taxAmount: number;
  feesAmount: number;
  finalAmount: number;
  currency: string;
  appliedRules: string[];
  isManualOverride: boolean;
}

interface PriceOverride {
  baseAmount?: number;
  markupAmount?: number;
  taxAmount?: number;
  feesAmount?: number;
  note: string;
}

// ============================================
// Service Clients
// ============================================

/**
 * Payment Service Client
 */
const paymentService = {
  async getWalletBalance(userId: string): Promise<{ balance: number; currency: string }> {
    const response = await axios.get(`${PAYMENT_SERVICE_URL}/wallet/${userId}/balance`, {
      timeout: 5000
    });
    return response.data;
  },

  async debitWallet(userId: string, amount: number, currency: string, bookingId: string) {
    const response = await axios.post(`${PAYMENT_SERVICE_URL}/wallet/debit`, {
      userId,
      amount,
      currency,
      reference: `BOOKING_${bookingId}`,
      description: `Payment for booking ${bookingId}`
    }, { timeout: 10000 });
    return response.data;
  }
};

/**
 * Notification Service Client
 */
const notificationService = {
  async sendBookingConfirmation(bookingId: string, userId: string) {
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications/send`, {
        type: 'booking_confirmation',
        userId,
        data: { bookingId }
      }, { timeout: 5000 });
    } catch (error) {
      console.error('Failed to send booking confirmation:', error);
    }
  },

  async sendPaymentReceipt(bookingId: string, userId: string, amount: number, currency: string) {
    try {
      await axios.post(`${NOTIFICATION_SERVICE_URL}/notifications/send`, {
        type: 'payment_receipt',
        userId,
        data: { bookingId, amount, currency }
      }, { timeout: 5000 });
    } catch (error) {
      console.error('Failed to send payment receipt:', error);
    }
  }
};

/**
 * Booking Engine Client (Supplier Integration)
 */
const bookingEngineClient = {
  async createSupplierBooking(params: {
    bookingId: string;
    itinerary: any;
    supplier: string;
  }) {
    const response = await axios.post(`${BOOKING_ENGINE_URL}/bookings/flight/order`, params, {
      timeout: 30000
    });
    return response.data;
  },

  async getSupplierBookingStatus(supplierRef: string) {
    const response = await axios.get(`${BOOKING_ENGINE_URL}/bookings/flight/order/${supplierRef}`, {
      timeout: 10000
    });
    return response.data;
  },

  async confirmSupplierBooking(supplierRef: string) {
    const response = await axios.post(`${BOOKING_ENGINE_URL}/bookings/flight/order/${supplierRef}/confirm`, {}, {
      timeout: 15000
    });
    return response.data;
  }
};

// ============================================
// State Machine Functions
// ============================================

function canTransition(from: WorkflowState, to: WorkflowState): boolean {
  const allowedTransitions = STATE_TRANSITIONS[from];
  return allowedTransitions?.includes(to) ?? false;
}

function validateTransition(booking: any, newState: WorkflowState): { valid: boolean; error?: string } {
  const currentState = booking.workflowState as WorkflowState;
  
  // Allow transition to cancelled from any state
  if (newState === WorkflowState.CANCELLED) {
    return { valid: true };
  }
  
  // For new bookings without workflow state, allow starting at draft
  if (!currentState && newState === WorkflowState.DRAFT) {
    return { valid: true };
  }
  
  // Check if transition is valid
  if (currentState && !canTransition(currentState, newState)) {
    return { 
      valid: false, 
      error: `Invalid state transition from ${currentState} to ${newState}` 
    };
  }
  
  return { valid: true };
}

// ============================================
// Pricing Engine Functions
// ============================================

async function calculatePricing(booking: any): Promise<PricingBreakdown> {
  const companyId = booking.companyId;
  const serviceType = booking.type || 'flight';
  
  // Load applicable markup rules
  const markupRules = await prisma.markupRule.findMany({
    where: {
      isActive: true,
      AND: [
        {
          OR: [
            { companyId: null },
            { companyId }
          ]
        },
        {
          OR: [
            { validFrom: null },
            { validFrom: { lte: new Date() } }
          ]
        },
        {
          OR: [
            { validTo: null },
            { validTo: { gte: new Date() } }
          ]
        }
      ]
    },
    orderBy: { priority: 'desc' }
  });

  // Load applicable commission rules
  const commissionRules = await prisma.commissionRule.findMany({
    where: {
      isActive: true,
      OR: [
        { companyId: null },
        { companyId }
      ]
    },
    orderBy: { priority: 'desc' }
  });

  // Calculate base price (in real implementation, get from supplier)
  const baseAmount = Number(booking.totalAmount) || 0;
  
  // Apply markup rules
  let markupAmount = 0;
  const appliedMarkupRules: string[] = [];
  
  for (const rule of markupRules) {
    if (rule.markupType === 'percentage') {
      markupAmount += Number(rule.markupValue) * baseAmount / 100;
    } else {
      markupAmount += Number(rule.markupValue);
    }
    appliedMarkupRules.push(rule.code);
  }

  // Apply commission rules
  let commissionAmount = 0;
  const appliedCommissionRules: string[] = [];
  
  for (const rule of commissionRules) {
    if (rule.commissionType === 'percentage') {
      commissionAmount += Number(rule.commissionValue) * baseAmount / 100;
    } else {
      commissionAmount += Number(rule.commissionValue);
    }
    appliedCommissionRules.push(rule.code);
  }

  // Calculate taxes (simplified)
  const taxAmount = baseAmount * 0.1; // 10% tax
  
  // Calculate final amount
  const finalAmount = baseAmount + markupAmount + taxAmount - commissionAmount;

  return {
    baseAmount,
    markupAmount,
    commissionAmount,
    discountAmount: 0,
    taxAmount,
    feesAmount: 0,
    finalAmount: Math.round(finalAmount * 100) / 100,
    currency: booking.currency || 'USD',
    appliedRules: [...appliedMarkupRules, ...appliedCommissionRules],
    isManualOverride: false
  };
}

// ============================================
// V2 Route Handlers
// ============================================

// GET /api/v2/admin/bookings - List bookings with V2 workflow
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      workflowState,
      search,
      fromDate,
      toDate,
      companyId,
      userId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = (req.query as any);

    const where: any = {};
    
    if (status) where.status = status;
    if (workflowState) where.workflowState = workflowState;
    if (companyId) where.companyId = companyId;
    if (userId) where.userId = userId;
    
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate as string);
      if (toDate) where.createdAt.lte = new Date(toDate as string);
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { [sortBy as string]: sortOrder },
        include: {
          pricingAuditLogs: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      }),
      prisma.booking.count({ where })
    ]);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching v2 bookings:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
});

// POST /api/v2/admin/bookings - Create new booking with workflow
router.post('/', async (req: Request, res: Response) => {
  try {
    const bookingData = req.body;
    const adminId = req.headers['x-admin-id'] as string || 'system';

    // Create booking in draft state
    const booking = await prisma.booking.create({
      data: {
        userId: bookingData.userId,
        status: 'pending',
        totalAmount: bookingData.totalAmount || 0,
        currency: bookingData.currency || 'USD',
        workflowState: WorkflowState.DRAFT,
        // Additional fields from request
        ...(bookingData.type && { status: bookingData.type })
      }
    });

    // Log audit
    console.log(`[BOOKING_V2] Booking created: ${booking.id} by ${adminId}`);

    res.status(201).json({
      success: true,
      data: {
        id: booking.id,
        workflowState: booking.workflowState,
        status: booking.status,
        createdAt: booking.createdAt
      }
    });
  } catch (error: any) {
    console.error('Error creating v2 booking:', error.message);
    res.status(500).json({ success: false, error: 'Failed to create booking' });
  }
});

// GET /api/v2/admin/bookings/:id - Get booking details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        pricingAuditLogs: {
          orderBy: { createdAt: 'desc' }
        },
        passengers: true,
        segments: true,
        modifications: true
      }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error: any) {
    console.error('Error fetching v2 booking:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch booking details' });
  }
});

// PUT /api/v2/admin/bookings/:id/status - Update workflow state
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { workflowState, reason } = req.body;
    const adminId = req.headers['x-admin-id'] as string || 'system';

    if (!workflowState || !Object.values(WorkflowState).includes(workflowState)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid workflow state' 
      });
    }

    const booking = await prisma.booking.findUnique({ where: { id } }) as any;
    
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Validate state transition
    const validation = validateTransition(booking, workflowState);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        error: validation.error 
      });
    }

    // Update booking state
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { 
        workflowState,
        // Update legacy status for backwards compatibility
        status: workflowState === WorkflowState.CONFIRMED ? 'confirmed' :
                workflowState === WorkflowState.COMPLETED ? 'completed' :
                workflowState === WorkflowState.CANCELLED ? 'cancelled' : booking.status
      }
    });

    console.log(`[BOOKING_V2] Booking ${id} state changed to ${workflowState} by ${adminId}`);

    res.json({
      success: true,
      data: updatedBooking
    });
  } catch (error: any) {
    console.error('Error updating v2 booking status:', error.message);
    res.status(500).json({ success: false, error: 'Failed to update booking status' });
  }
});

// POST /api/v2/admin/bookings/:id/pricing - Calculate/save pricing
router.post('/:id/pricing', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { override } = req.body;
    const adminId = Array.isArray(req.headers['x-admin-id']) ? (req.headers['x-admin-id'] as any)[0] : (req.headers['x-admin-id'] as string || 'system');

    const booking = await prisma.booking.findUnique({ where: { id } }) as any;
    
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    let pricing: PricingBreakdown;

    if (override) {
      // Manual override
      pricing = {
        baseAmount: (override.baseAmount ?? Number(booking.totalAmount)) || 0,
        markupAmount: override.markupAmount || 0,
        commissionAmount: 0,
        discountAmount: 0,
        taxAmount: override.taxAmount || 0,
        feesAmount: override.feesAmount || 0,
        finalAmount: ((override.baseAmount ?? Number(booking.totalAmount)) || 0) + 
                     (override.markupAmount || 0) + 
                     (override.taxAmount || 0) + 
                     (override.feesAmount || 0),
        currency: booking.currency || 'USD',
        appliedRules: [],
        isManualOverride: true
      };
    } else {
      // Calculate pricing using rules
      pricing = await calculatePricing(booking);
    }

    // Create pricing audit log
    const auditLog = await prisma.pricingAuditLog.create({
      data: {
        bookingId: id,
        baseAmount: pricing.baseAmount,
        markupAmount: pricing.markupAmount,
        discountAmount: pricing.discountAmount,
        commissionAmount: pricing.commissionAmount,
        finalAmount: pricing.finalAmount,
        currency: pricing.currency,
        markupRulesApplied: pricing.appliedRules,
        priceBreakdown: pricing as any
      }
    });

    // Update booking with pricing
    await prisma.booking.update({
      where: { id },
      data: {
        totalAmount: pricing.finalAmount,
        isManualPricing: pricing.isManualOverride,
        pricingAuditLogId: auditLog.id,
        workflowState: booking.workflowState || WorkflowState.DRAFT
      }
    });

    console.log(`[BOOKING_V2] Pricing calculated for booking ${id} by ${adminId}`);

    res.json({
      success: true,
      data: {
        pricing,
        auditLogId: auditLog.id
      }
    });
  } catch (error: any) {
    console.error('Error calculating pricing:', error.message);
    res.status(500).json({ success: false, error: 'Failed to calculate pricing' });
  }
});

// GET /api/v2/admin/bookings/queues - List booking queues
router.get('/queues', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      product,
      search
    } = (req.query as any);

    const where: any = {
      workflowState: {
        in: [
          WorkflowState.QUEUED,
          WorkflowState.PRICING,
          WorkflowState.INVOICED,
          WorkflowState.PAYMENT_PENDING
        ]
      }
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'asc' }
      }),
      prisma.booking.count({ where })
    ]);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    console.error('Error fetching booking queues:', error.message);
    res.status(500).json({ success: false, error: 'Failed to fetch booking queues' });
  }
});

// POST /api/v2/admin/bookings/:id/pay-wallet - Process wallet payment
router.post('/:id/pay-wallet', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { paymentMethod = 'wallet' } = req.body;
    const adminId = Array.isArray(req.headers['x-admin-id']) ? (req.headers['x-admin-id'] as any)[0] : (req.headers['x-admin-id'] as string || 'system');

    const booking = await prisma.booking.findUnique({ where: { id } }) as any;
    
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Validate state (must be invoiced)
    if (booking.workflowState !== WorkflowState.INVOICED) {
      return res.status(400).json({ 
        success: false, 
        error: 'Booking must be in invoiced state to process payment' 
      });
    }

    if (!booking.userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Booking has no associated user' 
      });
    }

    // Check wallet balance
    const walletBalance = await paymentService.getWalletBalance(booking.userId);
    
    if (walletBalance.balance < Number(booking.totalAmount)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Insufficient wallet balance',
        available: walletBalance.balance,
        required: booking.totalAmount
      });
    }

    // Process payment
    await paymentService.debitWallet(
      booking.userId, 
      Number(booking.totalAmount), 
      booking.currency,
      id
    );

    // Update booking state
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        workflowState: WorkflowState.PAYMENT_CONFIRMED,
        status: 'confirmed'
      }
    });

    // Send notification
    await notificationService.sendPaymentReceipt(
      id, 
      booking.userId, 
      Number(booking.totalAmount), 
      booking.currency
    );

    console.log(`[BOOKING_V2] Payment processed for booking ${id} by ${adminId}`);

    res.json({
      success: true,
      data: {
        bookingId: id,
        amount: booking.totalAmount,
        currency: booking.currency,
        status: 'paid'
      }
    });
  } catch (error: any) {
    console.error('Error processing payment:', error.message);
    res.status(500).json({ success: false, error: 'Failed to process payment' });
  }
});

// POST /api/v2/admin/bookings/:id/queue-action - Perform queue action
router.post('/:id/queue-action', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { action, reason } = req.body;
    const adminId = Array.isArray(req.headers['x-admin-id']) ? (req.headers['x-admin-id'] as any)[0] : (req.headers['x-admin-id'] as string || 'system');

    const booking = await prisma.booking.findUnique({ where: { id } }) as any;
    
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Map actions to workflow states
    const actionMap: Record<string, WorkflowState> = {
      'submit': WorkflowState.QUEUED,
      'price': WorkflowState.PRICING,
      'invoice': WorkflowState.INVOICED,
      'confirm_payment': WorkflowState.PAYMENT_CONFIRMED,
      'book_supplier': WorkflowState.SUPPLIER_BOOKING,
      'confirm': WorkflowState.CONFIRMED,
      'complete': WorkflowState.COMPLETED,
      'cancel': WorkflowState.CANCELLED
    };

    const newState = actionMap[action];
    
    if (!newState) {
      return res.status(400).json({ 
        success: false, 
        error: `Unknown action: ${action}` 
      });
    }

    // Validate transition
    const validation = validateTransition(booking, newState);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        error: validation.error 
      });
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        workflowState: newState,
        status: newState === WorkflowState.CONFIRMED ? 'confirmed' :
                newState === WorkflowState.COMPLETED ? 'completed' :
                newState === WorkflowState.CANCELLED ? 'cancelled' : booking.status
      }
    });

    console.log(`[BOOKING_V2] Queue action ${action} on booking ${id} by ${adminId}`);

    res.json({
      success: true,
      data: {
        bookingId: id,
        action,
        newState,
        booking: updatedBooking
      }
    });
  } catch (error: any) {
    console.error('Error performing queue action:', error.message);
    res.status(500).json({ success: false, error: 'Failed to perform queue action' });
  }
});

// POST /api/v2/admin/bookings/:id/invoice - Generate invoice
router.post('/:id/invoice', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { dueDate } = req.body;
    const adminId = Array.isArray(req.headers['x-admin-id']) ? (req.headers['x-admin-id'] as any)[0] : (req.headers['x-admin-id'] as string || 'system');

    const booking = await prisma.booking.findUnique({ 
      where: { id },
      include: { pricingAuditLogs: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });
    
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Generate invoice (simplified - in production would create proper invoice record)
    const invoiceNumber = `INV-${Date.now()}-${id.slice(-6)}`;
    
    const invoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber,
      bookingId: id,
      amount: booking.totalAmount,
      currency: booking.currency,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending',
      createdAt: new Date()
    };

    // Update booking to invoiced state if in pricing state
    if (booking.workflowState === WorkflowState.PRICING) {
      await prisma.booking.update({
        where: { id },
        data: { workflowState: WorkflowState.INVOICED }
      });
    }

    console.log(`[BOOKING_V2] Invoice generated for booking ${id} by ${adminId}`);

    res.status(201).json({
      success: true,
      data: invoice
    });
  } catch (error: any) {
    console.error('Error generating invoice:', error.message);
    res.status(500).json({ success: false, error: 'Failed to generate invoice' });
  }
});

// ============================================
// Flight Amendment Endpoints
// ============================================

// GET /api/v2/admin/bookings/:id/amendment-request - Fetch amendment request details
router.get('/:id/amendment-request', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const adminId = Array.isArray(req.headers['x-admin-id']) ? (req.headers['x-admin-id'] as any)[0] : (req.headers['x-admin-id'] as string || 'system');

    // Get booking with all details
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        passengers: true,
        segments: true,
        modifications: {
          where: { modificationType: 'flight_amendment' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    }) as any;

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Check if booking has flight segments
    const flightSegment = booking.segments.find((s: any) => s.segmentType === 'flight');
    if (!flightSegment) {
      return res.status(400).json({ 
        success: false, 
        error: 'Booking does not contain flight segments' 
      });
    }

    // Get or create amendment request
    const latestModification = booking.modifications[0];
    
    const amendmentRequest = {
      id: latestModification?.id || `amend_${id}_${Date.now()}`,
      bookingId: id,
      bookingReference: booking.bookingReference,
      traveler: booking.passengers[0]?.firstName + ' ' + booking.passengers[0]?.lastName || 'Unknown',
      currentFlight: {
        id: flightSegment.id,
        airline: flightSegment.supplier || 'Unknown',
        departure: flightSegment.departureCity || 'Unknown',
        arrival: flightSegment.arrivalCity || 'Unknown',
        departureTime: flightSegment.departureDateTime?.toISOString() || '',
        arrivalTime: flightSegment.arrivalDateTime?.toISOString() || '',
        duration: '4h 30m', // Mock - in production, calculate from times
        stops: 0,
        price: flightSegment.price || 0,
        currency: booking.currency
      },
      requestType: (latestModification?.metadata as any)?.requestType || 'date_change',
      requestedDate: (latestModification?.metadata as any)?.requestedDate,
      requestedRoute: (latestModification?.metadata as any)?.requestedRoute,
      requestReason: latestModification?.reason || 'Not specified',
      userApprovalStatus: (latestModification?.metadata as any)?.userApprovalStatus || 'pending',
      userApprovedOffer: (latestModification?.metadata as any)?.userApprovedOffer
    };

    console.log(`[AMENDMENT] Fetched amendment request for booking ${id} by ${adminId}`);

    res.json({
      success: true,
      data: amendmentRequest
    });
  } catch (error: any) {
    console.error('Error fetching amendment request:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch amendment request',
      details: error.message
    });
  }
});

// POST /api/v2/admin/bookings/:id/amendment/search-flights - Search for alternative flights
router.post('/:id/amendment/search-flights', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { requestType, requestedDate, requestedRoute } = req.body;
    const adminId = Array.isArray(req.headers['x-admin-id']) ? (req.headers['x-admin-id'] as any)[0] : (req.headers['x-admin-id'] as string || 'system');

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { segments: true, passengers: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Mock flight search - in production, call actual flight API
    const mockFlights = [
      {
        id: `flight_mock_${Date.now()}_1`,
        airline: 'Emirates',
        departure: requestedRoute?.from || 'JFK',
        arrival: requestedRoute?.to || 'LHR',
        departureTime: new Date(requestedDate || Date.now()).toISOString(),
        arrivalTime: new Date(new Date(requestedDate || Date.now()).getTime() + 4.5 * 60 * 60 * 1000).toISOString(),
        duration: '4h 30m',
        stops: 0,
        price: 580,
        currency: booking.currency
      },
      {
        id: `flight_mock_${Date.now()}_2`,
        airline: 'British Airways',
        departure: requestedRoute?.from || 'JFK',
        arrival: requestedRoute?.to || 'LHR',
        departureTime: new Date(new Date(requestedDate || Date.now()).getTime() + 2 * 60 * 60 * 1000).toISOString(),
        arrivalTime: new Date(new Date(requestedDate || Date.now()).getTime() + 6.5 * 60 * 60 * 1000).toISOString(),
        duration: '6h 30m',
        stops: 1,
        price: 450,
        currency: booking.currency
      },
      {
        id: `flight_mock_${Date.now()}_3`,
        airline: 'Lufthansa',
        departure: requestedRoute?.from || 'JFK',
        arrival: requestedRoute?.to || 'LHR',
        departureTime: new Date(new Date(requestedDate || Date.now()).getTime() + 3 * 60 * 60 * 1000).toISOString(),
        arrivalTime: new Date(new Date(requestedDate || Date.now()).getTime() + 7 * 60 * 60 * 1000).toISOString(),
        duration: '7h 00m',
        stops: 1,
        price: 520,
        currency: booking.currency
      }
    ];

    // Calculate financial impact for each option
    const currentFare = booking.baseFare || booking.totalAmount;
    const offers = mockFlights.map(flight => ({
      flight,
      financialImpact: {
        currentFarePrice: Number(currentFare),
        newFarePrice: flight.price,
        priceDifference: flight.price - Number(currentFare),
        adjustmentType: flight.price < Number(currentFare) ? 'refund' : 'charge',
        adjustmentAmount: Math.abs(flight.price - Number(currentFare)),
        currency: booking.currency
      }
    }));

    console.log(`[AMENDMENT] Searched flights for booking ${id} - found ${offers.length} options`);

    res.json({
      success: true,
      data: {
        flights: mockFlights,
        offers: offers
      }
    });
  } catch (error: any) {
    console.error('Error searching flights:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to search flights',
      details: error.message
    });
  }
});

// POST /api/v2/admin/bookings/:id/amendment/send-user-approval - Send approval email to traveler
router.post('/:id/amendment/send-user-approval', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { selectedFlight, financialImpact } = req.body;
    const adminId = Array.isArray(req.headers['x-admin-id']) ? (req.headers['x-admin-id'] as any)[0] : (req.headers['x-admin-id'] as string || 'system');

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { passengers: true }
    });

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Generate unique approval token (24-hour expiration)
    const approvalToken = `amt_${Buffer.from(`${id}_${Date.now()}_${Math.random()}`).toString('hex').substring(0, 32)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // In production: Send email via notification service
    // Here we log it for now
    const travelerEmail = booking.contactEmail;
    const travelerName = booking.passengers[0]?.firstName || 'Traveler';

    const emailContent = {
      to: travelerEmail,
      subject: `Confirm Your Flight Amendment for ${booking.bookingReference}`,
      template: 'flight_amendment_approval',
      data: {
        travelerName,
        bookingReference: booking.bookingReference,
        currentFlight: {
          departure: selectedFlight.departure,
          arrival: selectedFlight.arrival,
          departureTime: selectedFlight.departureTime,
          arrivalTime: selectedFlight.arrivalTime,
          duration: selectedFlight.duration
        },
        financialImpact: {
          adjustmentType: financialImpact.adjustmentType,
          adjustmentAmount: financialImpact.adjustmentAmount,
          message: financialImpact.adjustmentType === 'refund' 
            ? `You will receive a refund of ${financialImpact.currency} ${financialImpact.adjustmentAmount}`
            : `You will be charged ${financialImpact.currency} ${financialImpact.adjustmentAmount}`,
          currency: financialImpact.currency
        },
        approvalLink: `${process.env.BOOKING_SERVICE_URL || 'http://localhost:3002'}/api/bookings/${id}/amendment/approve?token=${approvalToken}`,
        approvalToken,
        expiresAt: expiresAt.toISOString()
      }
    };

    console.log(`[AMENDMENT] Email sent to ${travelerEmail} for booking ${id}`, emailContent);

    // Create or update modification record
    const modification = await prisma.bookingModification.create({
      data: {
        bookingId: id,
        modificationType: 'flight_amendment',
        reason: 'Traveler requested flight amendment',
        requestedBy: adminId,
        status: 'pending',
        originalDetails: {
          approval_token: approvalToken,
          expires_at: expiresAt,
          email_sent_at: new Date()
        },
        requestedChanges: {
          selected_flight: selectedFlight,
          financial_impact: financialImpact
        },
        metadata: {
          userApprovalStatus: 'sent',
          approvalToken,
          expiresAt
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        approvalId: modification.id,
        approvalToken,
        expiresAt,
        emailSent: true,
        travelerEmail
      }
    });
  } catch (error: any) {
    console.error('Error sending user approval:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send user approval',
      details: error.message
    });
  }
});

// POST /api/v2/bookings/:id/amendment/approve - Traveler approval endpoint (integrated in booking module)
router.post('/:id/amendment/approve', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { approvalToken } = req.body;

    if (!approvalToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Approval token is required' 
      });
    }

    // Get booking with amendment details
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        passengers: true,
        segments: true,
        modifications: {
          where: { modificationType: 'flight_amendment' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    }) as any;

    if (!booking) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
    }

    const latestModification = booking.modifications[0];
    if (!latestModification) {
      return res.status(400).json({ 
        success: false, 
        error: 'No active amendment request for this booking' 
      });
    }

    // Validate approval token
    const storedToken = (latestModification.metadata as any)?.approvalToken;
    const expiresAt = (latestModification.metadata as any)?.expiresAt;

    if (approvalToken !== storedToken) {
      console.warn(`[AMENDMENT] Invalid token attempt for booking ${id}`);
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid approval token' 
      });
    }

    const tokenExpiry = new Date(expiresAt);
    if (new Date() > tokenExpiry) {
      console.warn(`[AMENDMENT] Expired token attempt for booking ${id}`, { expiresAt });
      return res.status(401).json({ 
        success: false, 
        error: 'Approval token has expired. Please request a new amendment.'
      });
    }

    // Update modification to mark as traveler-approved
    const updatedModification = await prisma.bookingModification.update({
      where: { id: latestModification.id },
      data: {
        metadata: {
          ...(latestModification.metadata as any),
          userApprovalStatus: 'approved',
          traveler_approved_at: new Date().toISOString(),
          traveler_approval_ip: req.ip
        }
      }
    });

    // Send confirmation email to traveler
    try {
      const selectedFlight = (updatedModification.metadata as any)?.selectedFlight;
      const financialImpact = (updatedModification.metadata as any)?.financialImpact;
      
      if (selectedFlight && financialImpact) {
        await axios.post(`${NOTIFICATION_SERVICE_URL}/api/notifications/amendment/confirmation`, {
          bookingId: id,
          bookingReference: booking.bookingReference,
          travelerEmail: booking.email,
          travelerName: booking.customerName,
          newFlight: selectedFlight,
          financialImpact,
          approvedAt: new Date().toISOString()
        }).catch((err) => {
          console.warn(`[AMENDMENT] Failed to send confirmation email for booking ${id}:`, err.message);
          // Don't fail the approval if email fails - traveler already approved
        });
      }
    } catch (emailError: any) {
      console.warn(`[AMENDMENT] Email service error for booking ${id}:`, emailError.message);
    }

    // Return approval confirmation
    const nextSteper = {
      message: 'Amendment approved by traveler',
      approvalCode: approvalToken.substring(0, 8).toUpperCase(),
      approvedAt: new Date().toISOString(),
      nextStep: 'Admin will finalize the amendment shortly',
      contactSupport: 'If you need immediate assistance, contact support@tripalfa.com'
    };

    console.log(`[AMENDMENT] Traveler approved amendment for booking ${id}`, {
      token: approvalToken.substring(0, 8) + '...',
      expiresAt,
      modificationId: latestModification.id
    });

    res.json({
      success: true,
      data: {
        bookingId: id,
        bookingReference: booking.bookingReference,
        status: 'approved_by_traveler',
        approval: nextSteper
      }
    });
  } catch (error: any) {
    console.error('Error processing traveler approval:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process approval',
      details: error.message
    });
  }
});

// POST /api/v2/admin/bookings/:id/amendment/finalize - Finalize the amendment
router.post('/:id/amendment/finalize', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { selectedFlight, financialImpact, approvalToken } = req.body;
    const adminId = Array.isArray(req.headers['x-admin-id']) ? (req.headers['x-admin-id'] as any)[0] : (req.headers['x-admin-id'] as string || 'system');

    // Get booking with all details
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        passengers: true,
        segments: true,
        modifications: {
          where: { modificationType: 'flight_amendment' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    }) as any;

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    // Verify traveler approval
    const latestModification = booking.modifications[0];
    if (!latestModification) {
      return res.status(400).json({ 
        success: false, 
        error: 'No amendment request found for this booking' 
      });
    }

    const storedToken = (latestModification.metadata as any)?.approvalToken;
    const expiresAt = (latestModification.metadata as any)?.expiresAt;

    if (approvalToken !== storedToken) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid approval token' 
      });
    }

    if (new Date() > new Date(expiresAt)) {
      return res.status(401).json({ 
        success: false, 
        error: 'Approval token has expired' 
      });
    }

    // Update booking with new flight details
    const flightSegment = booking.segments.find((s: any) => s.segmentType === 'flight');
    
    if (flightSegment) {
      await prisma.bookingSegment.update({
        where: { id: flightSegment.id },
        data: {
          departureCity: selectedFlight.departure,
          arrivalCity: selectedFlight.arrival,
          departureDateTime: new Date(selectedFlight.departureTime),
          arrivalDateTime: new Date(selectedFlight.arrivalTime),
          price: selectedFlight.price,
          metadata: {
            ...flightSegment.metadata,
            amended_flight_details: selectedFlight
          }
        }
      });
    }

    // Update booking totals if there's a price difference
    let newTotalAmount = booking.totalAmount;
    if (financialImpact.adjustmentType === 'charge') {
      newTotalAmount = Number(newTotalAmount) + financialImpact.adjustmentAmount;
    } else if (financialImpact.adjustmentType === 'refund') {
      newTotalAmount = Number(newTotalAmount) - financialImpact.adjustmentAmount;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        totalAmount: newTotalAmount,
        updatedBy: adminId
      }
    });

    // Update modification status
    await prisma.bookingModification.update({
      where: { id: latestModification.id },
      data: {
        status: 'completed',
        approvedChanges: {
          selected_flight: selectedFlight,
          financial_impact: financialImpact,
          finalized_at: new Date()
        },
        processedBy: adminId,
        processedAt: new Date(),
        metadata: {
          ...(latestModification.metadata as any),
          userApprovalStatus: 'approved',
          completed_at: new Date()
        }
      }
    });

    console.log(`[AMENDMENT] Amendment finalized for booking ${id} by ${adminId}`, {
      selectedFlight,
      financialImpact,
      newTotalAmount
    });

    res.json({
      success: true,
      data: {
        bookingId: id,
        status: 'completed',
        booking: updatedBooking,
        financialImpact,
        message: 'Amendment successfully finalized'
      }
    });
  } catch (error: any) {
    console.error('Error finalizing amendment:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to finalize amendment',
      details: error.message
    });
  }
});

export default router;

