/**
 * Flight Booking Orchestrator Routes
 *
 * End-to-end flight booking workflow:
 * 1. Hold Booking - Reserve inventory without immediate payment
 * 2. Itinerary Generation - Create travel itinerary document
 * 3. Invoice Generation - Create commercial invoice
 * 4. Retrieve Booking - Get booking details and status
 * 5. Issue Ticket - Convert hold to confirmed ticket
 * 6. Generate Receipt - Create payment receipt
 * 7. Cancel Booking - Cancel ticket/reservation
 * 8. Generate Refund Note - Create refund documentation
 *
 * Routes:
 * - POST /api/flight-booking/hold - Create hold booking (Step 1)
 * - POST /api/flight-booking/payment - Process payment (Step 2)
 * - GET /api/flight-booking/:orderId - Retrieve booking (Step 3)
 * - POST /api/flight-booking/ticket - Issue ticket (Step 4)
 * - POST /api/flight-booking/receipt - Generate receipt
 * - POST /api/flight-booking/cancel - Cancel booking (Step 5)
 * - POST /api/flight-booking/refund - Generate refund note (Step 6)
 * - GET /api/flight-booking/workflow/:workflowId - Get workflow state
 * - GET /api/flight-booking/workflows - List all workflows
 * - POST /api/flight-booking/full-flow - Execute complete flow (testing)
 */

import { Router, Request, Response, NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CacheService, CACHE_TTL } from '../cache/redis';
import { authMiddleware, optionalAuth, AuthRequest } from '../middleware/auth';
import { FlightWorkflowState } from "./flightWorkflowState";
import { generateItineraryHtml, generateInvoiceHtml, generateReceiptHtml, generateETicketHtml, generateRefundNoteHtml } from "./documentHelpers";

const router: RouterType = Router();

// In‑memory storage for flight workflow states
const flightWorkflowStates: Map<string, FlightWorkflowState> = new Map();

// ============================================================================
// WORKFLOW STATE PERSISTENCE (Redis)
// ============================================================================

const WORKFLOW_TTL = 86400; // 24 hours for workflow states

// Cache key generators for workflow states
const WorkflowKeys = {
  workflow: (workflowId: string) => `flight:workflow:${workflowId}`,
  orderWorkflow: (orderId: string) => `flight:order:workflow:${orderId}`,
  userWorkflows: (userId: string) => `flight:user:workflows:${userId}`,
};

/**
 * Store workflow state in Redis
 */
async function saveWorkflowState(state: BookingWorkflowState): Promise<void> {
  const key = WorkflowKeys.workflow(state.workflowId);
  await CacheService.set(key, state, WORKFLOW_TTL);

  // Also index by orderId for lookup
  const orderKey = WorkflowKeys.orderWorkflow(state.orderId);
  await CacheService.set(orderKey, state, WORKFLOW_TTL);
}

/**
 * Get workflow state from Redis
 */
async function getWorkflowState(workflowId: string): Promise<BookingWorkflowState | null> {
  const key = WorkflowKeys.workflow(workflowId);
  return CacheService.get<BookingWorkflowState>(key);
}

/**
 * Get workflow state by orderId
 */
async function getWorkflowByOrderId(orderId: string): Promise<BookingWorkflowState | null> {
  const key = WorkflowKeys.orderWorkflow(orderId);
  return CacheService.get<BookingWorkflowState>(key);
}

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface FlightBookingParticipant {
  title: string;
  given_name: string;
  family_name: string;
  email: string;
  phone_number: string;
  born_on: string;
  gender: string;
}

interface CreateHoldBookingRequest {
  offerId: string;
  passengers: FlightBookingParticipant[];
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  currency: string;
  isRefundable?: boolean;
}

interface PaymentRequest {
  orderId: string;
  amount: number;
  currency: string;
  paymentMethod: 'balance' | 'card';
}

interface IssueTicketRequest {
  orderId: string;
  passengers: Array<{
    passengerId: string;
    ticketNumber: string;
    seatNumber?: string;
    baggageAllowance?: string;
  }>;
}

interface CancelBookingRequest {
  orderId: string;
  bookingId?: string;
  reason: string;
}
// Use the shared FlightWorkflowState type defined in flightWorkflowState.ts
type BookingWorkflowState = FlightWorkflowState;

// ============================================================================
// DOCUMENT GENERATION HELPERS
// ============================================================================

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

 * /api/flight-booking/hold:
 *   post:
 *     summary: Create a hold booking for a flight
 *     tags: [Flight Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [offerId, passengers, customerId, customerEmail, totalAmount, currency]
 *             properties:
 *               offerId:
 *                 type: string
 *               passengers:
 *                 type: array
 *                 items:
 *                   type: object
 *               customerId:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *               currency:
 *                 type: string
 *               isRefundable:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Hold booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing required fields or non-refundable rate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
/**
 * @swagger
 * /api/flight-booking/hold:
 *   post:
 *     summary: Create a hold booking for a flight
 *     tags: [Flight Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [offerId, passengers, customerId, customerEmail, totalAmount, currency]
 *             properties:
 *               offerId:
 *                 type: string
 *               passengers:
 *                 type: array
 *                 items:
 *                   type: object
 *               customerId:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *               currency:
 *                 type: string
 *               isRefundable:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Hold booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing required fields or non-refundable rate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post(
  '/hold',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const {
        offerId,
        passengers,
        customerId,
        customerEmail,
        customerPhone,
        totalAmount,
        currency,
      } = req.body;

      // Validate required fields
      if (!offerId || !passengers || !customerId || !customerEmail || !totalAmount || !currency) {
        return res.status(400).json({
          success: false,
          error:
            'Missing required fields: offerId, passengers, customerId, customerEmail, totalAmount, currency',
        });
      }

      // Check if hold is allowed for this booking (only for refundable rates)
      const isRefundable = req.body.isRefundable !== false; // Default to true if not specified
      if (!isRefundable) {
        return res.status(400).json({
          success: false,
          error:
            'Hold booking is not available for non-refundable rates. Please select a refundable fare or pay now.',
          holdAvailable: false,
          reason: 'non_refundable_rate',
        });
      }

      const workflowId = uuidv4();
      const bookingReference = `TA${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const orderId = `ORD-${Date.now()}`;

      const customer = {
        id: customerId,
        name: `${passengers[0]?.given_name || ''} ${passengers[0]?.family_name || ''}`.trim(),
        email: customerEmail,
        phone: customerPhone,
      };

      // Create workflow state
      const workflowState: BookingWorkflowState = {
        workflowId,
        orderId,
        bookingReference,
        status: 'hold',
        createdAt: new Date(),
        updatedAt: new Date(),
        steps: {
          hold: { completed: true, timestamp: new Date() },
          payment: { completed: false },
          ticketing: { completed: false },
          cancellation: { completed: false },
          refund: { completed: false },
        },
        customer,
        booking: {
          offerId,
          passengers,
          totalAmount,
          currency,
        },
        documents: {},
      };

      // Generate itinerary and invoice
      workflowState.documents!.itinerary = generateItineraryHtml(
        { bookingReference, passengers },
        customer
      );
      workflowState.documents!.invoice = generateInvoiceHtml(
        { bookingReference, totalAmount },
        customer,
        { total: totalAmount, currency }
      );

      // Persist workflow state to Redis
      await saveWorkflowState(workflowState);

      res.status(201).json({
        success: true,
        workflowId,
        orderId,
        bookingReference,
        status: 'hold',
        paymentRequiredBy: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        totalAmount,
        currency,
        documents: {
          itinerary: workflowState.documents!.itinerary,
          invoice: workflowState.documents!.invoice,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

 * /api/flight-booking/payment:
 *   post:
 *     summary: Process payment for hold booking
 *     tags: [Flight Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, workflowId, amount, currency]
 *             properties:
 *               orderId:
 *                 type: string
 *               workflowId:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [balance, card]
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing fields or invalid status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post(
  '/payment',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { orderId, workflowId, amount, currency, paymentMethod } = req.body;

      if (!orderId || !workflowId || !amount || !currency) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: orderId, workflowId, amount, currency',
        });
      }

      const workflowState = await getWorkflowState(workflowId);
      if (!workflowState) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found. Please create a hold booking first.',
        });
      }

      if (workflowState.status !== 'hold') {
        return res.status(400).json({
          success: false,
          error: `Cannot process payment. Current status: ${workflowState.status}`,
        });
      }

      // Simulate payment processing
      const paymentReference = `PAY-${Date.now()}`;

      // Update workflow state
      workflowState.status = 'paid';
      workflowState.updatedAt = new Date();
      workflowState.steps.payment = {
        completed: true,
        timestamp: new Date(),
        data: {
          paymentReference,
          amount,
          currency,
          paymentMethod: paymentMethod || 'card',
        },
      };

      // Generate receipt
      workflowState.documents!.receipt = generateReceiptHtml(
        { bookingReference: workflowState.bookingReference },
        workflowState.customer!,
        { total: amount, currency, paymentMethod: paymentMethod || 'card' }
      );

      // Persist updated workflow state to Redis
      await saveWorkflowState(workflowState);

      res.status(200).json({
        success: true,
        workflowId,
        orderId,
        paymentReference,
        paymentStatus: 'paid',
        message: 'Payment successfully processed',
        documents: {
          receipt: workflowState.documents!.receipt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

 * /api/flight-booking/{orderId}:
 *   get:
 *     summary: Retrieve flight booking details
 *     tags: [Flight Booking]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID
 *       - in: query
 *         name: workflowId
 *         schema:
 *           type: string
 *         description: The workflow ID
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Order ID is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
/**
 * @swagger
 * /api/flight-booking/{orderId}:
 *   get:
 *     summary: Retrieve flight booking details
 *     tags: [Flight Booking]
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The order ID
 *       - in: query
 *         name: workflowId
 *         schema:
 *           type: string
 *         description: The workflow ID
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Order ID is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.get(
  '/:orderId',
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const { workflowId } = req.query;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: 'Order ID is required',
        });
      }

      // Try to find workflow by orderId or workflowId from Redis
      let workflowState: BookingWorkflowState | null = null;

      if (workflowId) {
        workflowState = await getWorkflowState(workflowId as string);
      } else {
        workflowState = await getWorkflowByOrderId(orderId);
      }

      if (!workflowState) {
        // Return mock data for external orders
        return res.status(200).json({
          success: true,
          orderId,
          bookingReference: `TA${orderId.slice(-6)}`,
          status: 'hold',
          message: 'Booking found (external)',
        });
      }

      res.status(200).json({
        success: true,
        workflowId: workflowState.workflowId,
        orderId: workflowState.orderId,
        bookingReference: workflowState.bookingReference,
        status: workflowState.status,
        totalAmount: workflowState.booking?.totalAmount,
        currency: workflowState.booking?.currency,
        passengers: workflowState.booking?.passengers,
        customer: workflowState.customer,
        createdAt: workflowState.createdAt,
        updatedAt: workflowState.updatedAt,
        steps: workflowState.steps,
      });
    } catch (error) {
      next(error);
    }
  }
);

 * /api/flight-booking/ticket:
 *   post:
 *     summary: Issue ticket for confirmed booking
 *     tags: [Flight Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, workflowId]
 *             properties:
 *               orderId:
 *                 type: string
 *               workflowId:
 *                 type: string
 *               passengers:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Ticket issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing fields or payment not completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
/**
 * @swagger
 * /api/flight-booking/ticket:
 *   post:
 *     summary: Issue ticket for confirmed booking
 *     tags: [Flight Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, workflowId]
 *             properties:
 *               orderId:
 *                 type: string
 *               workflowId:
 *                 type: string
 *               passengers:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Ticket issued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing fields or payment not completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post(
  '/ticket',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { orderId, workflowId, passengers } = req.body;

      if (!orderId || !workflowId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: orderId, workflowId',
        });
      }

      const workflowState = await getWorkflowState(workflowId);
      if (!workflowState) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found',
        });
      }

      if (workflowState.status !== 'paid') {
        return res.status(400).json({
          success: false,
          error: `Cannot issue ticket. Current status: ${workflowState.status}. Payment required first.`,
        });
      }

      // Generate ticket numbers
      const ticketNumber = passengers?.[0]?.ticketNumber || `176${Date.now()}0001`;

      // Update workflow state
      workflowState.status = 'ticketed';
      workflowState.updatedAt = new Date();
      workflowState.steps.ticketing = {
        completed: true,
        timestamp: new Date(),
        data: {
          ticketNumber,
          issuedAt: new Date(),
        },
      };

      // Generate e-ticket
      workflowState.documents!.ticket = generateETicketHtml(
        { bookingReference: workflowState.bookingReference },
        workflowState.customer!,
        { ticketNumber }
      );

      // Persist updated workflow state to Redis
      await saveWorkflowState(workflowState);

      res.status(200).json({
        success: true,
        workflowId,
        orderId,
        ticketNumber,
        issuedAt: new Date().toISOString(),
        status: 'ticketed',
        documents: {
          ticket: workflowState.documents!.ticket,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

 * /api/flight-booking/cancel:
 *   post:
 *     summary: Cancel flight booking
 *     tags: [Flight Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, workflowId, reason]
 *             properties:
 *               orderId:
 *                 type: string
 *               workflowId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post(
  '/cancel',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { orderId, workflowId, reason } = req.body;

      if (!orderId || !reason || !workflowId) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: orderId, reason, workflowId',
        });
      }

      const workflowState = await getWorkflowState(workflowId);
      if (!workflowState) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found',
        });
      }

      // Update workflow state
      workflowState.status = 'cancelled';
      workflowState.updatedAt = new Date();
      workflowState.steps.cancellation = {
        completed: true,
        timestamp: new Date(),
        data: {
          reason,
          cancelledAt: new Date(),
        },
      };

      // Persist updated workflow state to Redis
      await saveWorkflowState(workflowState);

      res.status(200).json({
        success: true,
        workflowId,
        orderId,
        bookingReference: workflowState.bookingReference,
        cancellationId: `CNL-${Date.now()}`,
        cancelledAt: new Date().toISOString(),
        status: 'cancelled',
        message: 'Booking successfully cancelled',
      });
    } catch (error) {
      next(error);
    }
  }
);

 * /api/flight-booking/refund:
 *   post:
 *     summary: Generate refund note for cancelled booking
 *     tags: [Flight Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, workflowId, refundAmount, currency, reason]
 *             properties:
 *               orderId:
 *                 type: string
 *               workflowId:
 *                 type: string
 *               refundAmount:
 *                 type: number
 *               currency:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund note generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing fields or booking not cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
/**
 * @swagger
 * /api/flight-booking/refund:
 *   post:
 *     summary: Generate refund note for cancelled booking
 *     tags: [Flight Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderId, workflowId, refundAmount, currency, reason]
 *             properties:
 *               orderId:
 *                 type: string
 *               workflowId:
 *                 type: string
 *               refundAmount:
 *                 type: number
 *               currency:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Refund note generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing fields or booking not cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post(
  '/refund',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { orderId, workflowId, refundAmount, currency, reason } = req.body;

      if (!orderId || !workflowId || !refundAmount || !currency || !reason) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: orderId, workflowId, refundAmount, currency, reason',
        });
      }

      const workflowState = await getWorkflowState(workflowId);
      if (!workflowState || !workflowState.steps.cancellation.completed) {
        return res.status(400).json({
          success: false,
          error: 'Booking must be cancelled before generating refund note',
        });
      }

      // Generate refund note
      const refundNumber = `RFN-${Date.now()}`;

      // Update workflow state
      workflowState.status = 'refunded';
      workflowState.updatedAt = new Date();
      workflowState.steps.refund = {
        completed: true,
        timestamp: new Date(),
        data: {
          refundNumber,
          amount: refundAmount,
          currency,
          reason,
          processedAt: new Date(),
        },
      };

      workflowState.documents!.refundNote = generateRefundNoteHtml(
        { bookingReference: workflowState.bookingReference },
        workflowState.customer!,
        { refundNumber, amount: refundAmount, currency, reason }
      );

      // Persist updated workflow state to Redis
      await saveWorkflowState(workflowState);

      res.status(200).json({
        success: true,
        workflowId,
        orderId,
        refundNumber,
        refundAmount,
        currency,
        processedAt: new Date().toISOString(),
        status: 'refunded',
        documents: {
          refundNote: workflowState.documents!.refundNote,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

 * /api/flight-booking/workflow/{workflowId}:
 *   get:
 *     summary: Get workflow state by workflow ID
 *     tags: [Flight Booking]
 *     parameters:
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema:
 *           type: string
 *         description: The workflow ID
 *     responses:
 *       200:
 *         description: Workflow state retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Workflow not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.get(
  '/workflow/:workflowId',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { workflowId } = req.params;

      const workflowState = await getWorkflowState(workflowId);
      if (!workflowState) {
        return res.status(404).json({
          success: false,
          error: 'Workflow not found',
        });
      }

      res.status(200).json({
        success: true,
        data: workflowState,
      });
    } catch (error) {
      next(error);
    }
  }
);

 * /api/flight-booking/workflows:
 *   get:
 *     summary: List all active flight booking workflows
 *     tags: [Flight Booking]
 *     responses:
 *       200:
 *         description: List of workflows retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
/**
 * @swagger
 * /api/flight-booking/workflows:
 *   get:
 *     summary: List all active flight booking workflows
 *     tags: [Flight Booking]
 *     responses:
 *       200:
 *         description: List of workflows retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get(
  '/workflows',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Note: Listing all workflows requires scanning Redis keys
      // This is a potentially expensive operation, so we limit it
      const { getRedisClient } = await import('../cache/redis');
      const client = await getRedisClient();
      const keys = await client.keys('flight:workflow:*');

      const workflows: BookingWorkflowState[] = [];
      for (const key of keys.slice(0, 100)) {
        // Limit to 100 workflows
        const data = await client.get(key);
        if (data) {
          workflows.push(JSON.parse(data) as BookingWorkflowState);
        }
      }

      res.status(200).json({
        success: true,
        data: workflows,
        meta: {
          total: workflows.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

 * /api/flight-booking/full-flow:
 *   post:
 *     summary: Execute complete end-to-end flight booking flow (testing)
 *     tags: [Flight Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [offerId, passengers, customerId, customerEmail, totalAmount, currency]
 *             properties:
 *               offerId:
 *                 type: string
 *               passengers:
 *                 type: array
 *                 items:
 *                   type: object
 *               customerId:
 *                 type: string
 *               customerEmail:
 *                 type: string
 *               customerPhone:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *               currency:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *               cancelAfterTicketing:
 *                 type: object
 *               refundAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Full flow executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing required booking fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post(
  '/full-flow',
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const {
        offerId,
        passengers,
        customerId,
        customerEmail,
        customerPhone,
        totalAmount,
        currency,
        paymentMethod,
        cancelAfterTicketing,
        refundAmount,
      } = req.body;

      // Validate required fields
      if (!offerId || !passengers || !customerId || !customerEmail || !totalAmount || !currency) {
        return res.status(400).json({
          success: false,
          error: 'Missing required booking fields',
        });
      }

      const results: any = { steps: {} };

      // Step 1: Create Hold Booking
      const holdWorkflowId = uuidv4();
      const bookingReference = `TA${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const orderId = `ORD-${Date.now()}`;

      const customer = {
        id: customerId,
        name: `${passengers[0]?.given_name || ''} ${passengers[0]?.family_name || ''}`.trim(),
        email: customerEmail,
        phone: customerPhone,
      };

      const workflowState: BookingWorkflowState = {
        workflowId: holdWorkflowId,
        orderId,
        bookingReference,
        status: 'hold',
        createdAt: new Date(),
        updatedAt: new Date(),
        steps: {
          hold: { completed: true, timestamp: new Date() },
          payment: { completed: false },
          ticketing: { completed: false },
          cancellation: { completed: false },
          refund: { completed: false },
        },
        customer,
        booking: {
          offerId,
          passengers,
          totalAmount,
          currency,
        },
        documents: {},
      };

      // Generate itinerary and invoice
      workflowState.documents!.itinerary = generateItineraryHtml(
        { bookingReference, passengers },
        customer
      );
      workflowState.documents!.invoice = generateInvoiceHtml(
        { bookingReference, totalAmount },
        customer,
        { total: totalAmount, currency }
      );

      // Persist workflow state to Redis
      await saveWorkflowState(workflowState);

      results.steps.hold = {
        success: true,
        workflowId: holdWorkflowId,
        orderId,
        bookingReference,
        documents: {
          itinerary: workflowState.documents!.itinerary,
          invoice: workflowState.documents!.invoice,
        },
      };

      // Step 2: Process Payment (if requested)
      if (paymentMethod) {
        const paymentReference = `PAY-${Date.now()}`;

        workflowState.status = 'paid';
        workflowState.updatedAt = new Date();
        workflowState.steps.payment = {
          completed: true,
          timestamp: new Date(),
          data: {
            paymentReference,
            amount: totalAmount,
            currency,
            paymentMethod,
          },
        };

        workflowState.documents!.receipt = generateReceiptHtml({ bookingReference }, customer, {
          total: totalAmount,
          currency,
          paymentMethod,
        });

        // Persist updated state to Redis
        await saveWorkflowState(workflowState);

        results.steps.payment = {
          success: true,
          workflowId: holdWorkflowId,
          paymentReference,
          paymentStatus: 'paid',
          documents: {
            receipt: workflowState.documents!.receipt,
          },
        };

        // Step 4: Issue Ticket
        const ticketNumber = `176${Date.now()}0001`;

        workflowState.status = 'ticketed';
        workflowState.updatedAt = new Date();
        workflowState.steps.ticketing = {
          completed: true,
          timestamp: new Date(),
          data: { ticketNumber, issuedAt: new Date() },
        };

        workflowState.documents!.ticket = generateETicketHtml({ bookingReference }, customer, {
          ticketNumber,
        });

        // Persist updated state to Redis
        await saveWorkflowState(workflowState);

        results.steps.ticketing = {
          success: true,
          workflowId: holdWorkflowId,
          ticketNumber,
          status: 'ticketed',
          documents: {
            ticket: workflowState.documents!.ticket,
          },
        };

        // Step 5 & 6: Cancel and Refund (if requested)
        if (cancelAfterTicketing) {
          const cancellationReason =
            cancelAfterTicketing.reason || 'Customer requested cancellation';

          workflowState.status = 'cancelled';
          workflowState.updatedAt = new Date();
          workflowState.steps.cancellation = {
            completed: true,
            timestamp: new Date(),
            data: { reason: cancellationReason, cancelledAt: new Date() },
          };

          // Persist updated state to Redis
          await saveWorkflowState(workflowState);

          results.steps.cancellation = {
            success: true,
            workflowId: holdWorkflowId,
            cancellationId: `CNL-${Date.now()}`,
            status: 'cancelled',
          };

          if (refundAmount) {
            const refundNumber = `RFN-${Date.now()}`;

            workflowState.status = 'refunded';
            workflowState.updatedAt = new Date();
            workflowState.steps.refund = {
              completed: true,
              timestamp: new Date(),
              data: {
                refundNumber,
                amount: refundAmount,
                currency,
                reason: cancellationReason,
                processedAt: new Date(),
              },
            };

            workflowState.documents!.refundNote = generateRefundNoteHtml(
              { bookingReference },
              customer,
              {
                refundNumber,
                amount: refundAmount,
                currency,
                reason: cancellationReason,
              }
            );

            // Persist updated state to Redis
            await saveWorkflowState(workflowState);

            results.steps.refund = {
              success: true,
              workflowId: holdWorkflowId,
              refundNumber,
              refundAmount,
              currency,
              status: 'refunded',
              documents: {
                refundNote: workflowState.documents!.refundNote,
              },
            };
          }
        }
      }

      res.status(200).json({
        success: true,
        workflowId: holdWorkflowId,
        orderId,
        bookingReference,
        status: workflowState.status,
        flowCompleted: cancelAfterTicketing ? true : false,
        results: results,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
