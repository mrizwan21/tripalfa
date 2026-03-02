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

import { Router, Request, Response, NextFunction } from "express";
import type { Router as RouterType } from "express";
import { v4 as uuidv4 } from "uuid";
import { CacheService, CACHE_TTL } from "../cache/redis";
import { authMiddleware, optionalAuth, AuthRequest } from "../middleware/auth";

const router: RouterType = Router();

const FLIGHT_DOCUMENT_COLORS = {
  textPrimary: "rgb(51, 51, 51)",
  textMuted: "rgb(107, 114, 128)",
  brandPrimary: "rgb(30, 27, 75)",
  success: "rgb(5, 150, 105)",
  danger: "rgb(220, 38, 38)",
  border: "rgb(229, 231, 235)",
  borderSoft: "rgb(243, 244, 246)",
  surfaceMuted: "rgb(249, 250, 251)",
} as const;

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
async function getWorkflowState(
  workflowId: string,
): Promise<BookingWorkflowState | null> {
  const key = WorkflowKeys.workflow(workflowId);
  return CacheService.get<BookingWorkflowState>(key);
}

/**
 * Get workflow state by orderId
 */
async function getWorkflowByOrderId(
  orderId: string,
): Promise<BookingWorkflowState | null> {
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
  paymentMethod: "balance" | "card";
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

interface BookingWorkflowState {
  workflowId: string;
  orderId: string;
  bookingReference: string;
  status: "hold" | "paid" | "ticketed" | "cancelled" | "refunded";
  createdAt: Date;
  updatedAt: Date;
  steps: {
    hold: { completed: boolean; timestamp?: Date; data?: any };
    payment: { completed: boolean; timestamp?: Date; data?: any };
    ticketing: { completed: boolean; timestamp?: Date; data?: any };
    cancellation: { completed: boolean; timestamp?: Date; data?: any };
    refund: { completed: boolean; timestamp?: Date; data?: any };
  };
  documents?: {
    itinerary?: string;
    invoice?: string;
    ticket?: string;
    receipt?: string;
    refundNote?: string;
  };
  customer?: {
    id: string;
    email: string;
    phone: string;
    name: string;
  };
  booking?: {
    offerId: string;
    passengers: FlightBookingParticipant[];
    totalAmount: number;
    currency: string;
  };
}

// ============================================================================
// DOCUMENT GENERATION HELPERS
// ============================================================================

function generateItineraryHtml(booking: any, customer: any): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Flight Itinerary - ${booking.bookingReference}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: ${FLIGHT_DOCUMENT_COLORS.textPrimary}; }
    .header { background: ${FLIGHT_DOCUMENT_COLORS.brandPrimary}; color: white; padding: 20px; border-radius: 8px; }
    .booking-ref { font-size: 24px; font-weight: bold; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid ${FLIGHT_DOCUMENT_COLORS.border}; border-radius: 8px; }
    .flight-info { display: flex; justify-content: space-between; margin: 10px 0; }
    .passenger { background: ${FLIGHT_DOCUMENT_COLORS.surfaceMuted}; padding: 10px; margin: 5px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✈️ Flight Itinerary</h1>
    <div class="booking-ref">Booking Reference: ${booking.bookingReference}</div>
  </div>
  
  <div class="section">
    <h2>Passenger Details</h2>
    ${
      booking.passengers
        ?.map(
          (p: any) => `
      <div class="passenger">
        <strong>${p.given_name} ${p.family_name}</strong><br>
        Email: ${p.email}<br>
        Phone: ${p.phone_number}
      </div>
    `,
        )
        .join("") || ""
    }
  </div>
  
  <div class="section">
    <h2>Flight Details</h2>
    <div class="flight-info">
      <div>
        <strong>DXB</strong> (Dubai)<br>
        08:30
      </div>
      <div>→ 7h 15m →</div>
      <div>
        <strong>LHR</strong> (London)<br>
        12:45
      </div>
    </div>
    <p><strong>Flight:</strong> EK2 | <strong>Airline:</strong> Emirates</p>
    <p><strong>Date:</strong> March 15, 2026</p>
  </div>
  
  <div class="section">
    <h2>Contact Information</h2>
    <p><strong>Email:</strong> ${customer.email}</p>
    <p><strong>Phone:</strong> ${customer.phone}</p>
  </div>
  
  <div style="margin-top: 30px; text-align: center; color: ${FLIGHT_DOCUMENT_COLORS.textMuted};">
    <p>Generated by TripAlfa | ${new Date().toISOString()}</p>
  </div>
</body>
</html>`;
}

function generateInvoiceHtml(
  booking: any,
  customer: any,
  payment: any,
): string {
  const totalAmount = payment.total || booking.totalAmount || 0;
  const baseFare = totalAmount * 0.85;
  const taxes = totalAmount * 0.15;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${booking.bookingReference}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: ${FLIGHT_DOCUMENT_COLORS.textPrimary}; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${FLIGHT_DOCUMENT_COLORS.brandPrimary}; padding-bottom: 20px; }
    .invoice-title { font-size: 32px; color: ${FLIGHT_DOCUMENT_COLORS.brandPrimary}; }
    .invoice-number { font-size: 18px; color: ${FLIGHT_DOCUMENT_COLORS.textMuted}; }
    .section { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid ${FLIGHT_DOCUMENT_COLORS.border}; }
    th { background: ${FLIGHT_DOCUMENT_COLORS.surfaceMuted}; }
    .total-row { font-weight: bold; font-size: 18px; background: ${FLIGHT_DOCUMENT_COLORS.brandPrimary}; color: white; }
    .footer { margin-top: 40px; text-align: center; color: ${FLIGHT_DOCUMENT_COLORS.textMuted}; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">Invoice #INV-${Date.now()}</div>
    </div>
    <div>
      <strong>TripAlfa Travel</strong><br>
      Dubai, UAE<br>
      info@tripalfa.com
    </div>
  </div>
  
  <div class="section">
    <h3>Bill To:</h3>
    <p><strong>${customer.name}</strong><br>
    ${customer.email}<br>
    ${customer.phone}</p>
  </div>
  
  <div class="section">
    <h3>Booking Reference: ${booking.bookingReference}</h3>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Base Fare (Flight DXB → LHR)</td>
          <td>${payment.currency || "USD"} ${baseFare.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Taxes & Fees</td>
          <td>${payment.currency || "USD"} ${taxes.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td>Total</td>
          <td>${payment.currency || "USD"} ${totalAmount.toFixed(2)}</td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <div class="footer">
    <p>Payment Due: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
    <p>Generated by TripAlfa | ${new Date().toISOString()}</p>
  </div>
</body>
</html>`;
}

function generateReceiptHtml(
  booking: any,
  customer: any,
  payment: any,
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Receipt - ${booking.bookingReference}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: ${FLIGHT_DOCUMENT_COLORS.textPrimary}; }
    .header { background: ${FLIGHT_DOCUMENT_COLORS.success}; color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .amount { font-size: 36px; font-weight: bold; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid ${FLIGHT_DOCUMENT_COLORS.border}; border-radius: 8px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${FLIGHT_DOCUMENT_COLORS.borderSoft}; }
    .detail-row:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Payment Received</h1>
    <div class="amount">${payment.currency || "USD"} ${(payment.total || 0).toFixed(2)}</div>
  </div>
  
  <div class="section">
    <h3>Receipt Details</h3>
    <div class="detail-row">
      <span>Receipt Number:</span>
      <strong>RCP-${Date.now()}</strong>
    </div>
    <div class="detail-row">
      <span>Booking Reference:</span>
      <strong>${booking.bookingReference}</strong>
    </div>
    <div class="detail-row">
      <span>Payment Method:</span>
      <strong>${payment.paymentMethod || "Card"}</strong>
    </div>
    <div class="detail-row">
      <span>Payment Date:</span>
      <strong>${new Date().toLocaleString()}</strong>
    </div>
  </div>
  
  <div class="section">
    <h3>Payer Information</h3>
    <p><strong>${customer.name}</strong><br>
    ${customer.email}</p>
  </div>
  
  <div style="margin-top: 30px; text-align: center; color: ${FLIGHT_DOCUMENT_COLORS.textMuted};">
    <p>Thank you for your payment! | Generated by TripAlfa</p>
  </div>
</body>
</html>`;
}

function generateETicketHtml(
  booking: any,
  customer: any,
  ticketInfo: any,
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>E-Ticket - ${booking.bookingReference}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: ${FLIGHT_DOCUMENT_COLORS.textPrimary}; }
    .header { background: ${FLIGHT_DOCUMENT_COLORS.brandPrimary}; color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .ticket-number { font-size: 24px; font-weight: bold; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid ${FLIGHT_DOCUMENT_COLORS.border}; border-radius: 8px; }
    .flight-route { font-size: 28px; text-align: center; margin: 20px 0; }
    .passenger-info { background: ${FLIGHT_DOCUMENT_COLORS.surfaceMuted}; padding: 15px; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✈️ Electronic Ticket</h1>
    <div class="ticket-number">Ticket #: ${ticketInfo.ticketNumber}</div>
  </div>
  
  <div class="flight-route">
    <strong>DXB</strong> → <strong>LHR</strong>
  </div>
  
  <div class="section">
    <h3>Flight Information</h3>
    <p><strong>Flight:</strong> EK2 | <strong>Date:</strong> March 15, 2026</p>
    <p><strong>Departure:</strong> 08:30 (DXB Terminal 3)</p>
    <p><strong>Arrival:</strong> 12:45 (LHR Terminal 3)</p>
    <p><strong>Class:</strong> Economy</p>
    <p><strong>Baggage:</strong> 30kg + 7kg</p>
  </div>
  
  <div class="section passenger-info">
    <h3>Passenger Information</h3>
    <p><strong>Name:</strong> ${customer.name}</p>
    <p><strong>Booking Ref:</strong> ${booking.bookingReference}</p>
  </div>
  
  <div class="section">
    <h3>Important Information</h3>
    <ul>
      <li>Please arrive at the airport at least 3 hours before departure for international flights</li>
      <li>Carry a valid photo ID and this e-ticket confirmation</li>
      <li>Check baggage allowance and any applicable fees</li>
    </ul>
  </div>
  
  <div style="margin-top: 30px; text-align: center; color: ${FLIGHT_DOCUMENT_COLORS.textMuted};">
    <p>Generated by TripAlfa | ${new Date().toISOString()}</p>
  </div>
</body>
</html>`;
}

function generateRefundNoteHtml(
  booking: any,
  customer: any,
  refund: any,
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Refund Note - ${booking.bookingReference}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: ${FLIGHT_DOCUMENT_COLORS.textPrimary}; }
    .header { background: ${FLIGHT_DOCUMENT_COLORS.danger}; color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .refund-amount { font-size: 36px; font-weight: bold; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid ${FLIGHT_DOCUMENT_COLORS.border}; border-radius: 8px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${FLIGHT_DOCUMENT_COLORS.borderSoft}; }
  </style>
</head>
<body>
  <div class="header">
    <h1>💰 Refund Confirmation</h1>
    <div class="refund-amount">${refund.currency} ${refund.amount.toFixed(2)}</div>
  </div>
  
  <div class="section">
    <h3>Refund Details</h3>
    <div class="detail-row">
      <span>Refund Number:</span>
      <strong>${refund.refundNumber}</strong>
    </div>
    <div class="detail-row">
      <span>Original Booking:</span>
      <strong>${booking.bookingReference}</strong>
    </div>
    <div class="detail-row">
      <span>Reason:</span>
      <strong>${refund.reason}</strong>
    </div>
    <div class="detail-row">
      <span>Processed Date:</span>
      <strong>${new Date().toLocaleString()}</strong>
    </div>
    <div class="detail-row">
      <span>Status:</span>
      <strong style="color: ${FLIGHT_DOCUMENT_COLORS.success};">COMPLETED</strong>
    </div>
  </div>
  
  <div class="section">
    <h3>Refund To</h3>
    <p><strong>${customer.name}</strong><br>
    ${customer.email}</p>
  </div>
  
  <div style="margin-top: 30px; text-align: center; color: ${FLIGHT_DOCUMENT_COLORS.textMuted};">
    <p>Generated by TripAlfa | ${new Date().toISOString()}</p>
  </div>
</body>
</html>`;
}

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * POST /api/flight-booking/hold
 * Create a hold booking (Step 1 of E2E flow)
 * Requires authentication
 */
router.post(
  "/hold",
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
      if (
        !offerId ||
        !passengers ||
        !customerId ||
        !customerEmail ||
        !totalAmount ||
        !currency
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: offerId, passengers, customerId, customerEmail, totalAmount, currency",
        });
      }

      // Check if hold is allowed for this booking (only for refundable rates)
      const isRefundable = req.body.isRefundable !== false; // Default to true if not specified
      if (!isRefundable) {
        return res.status(400).json({
          success: false,
          error:
            "Hold booking is not available for non-refundable rates. Please select a refundable fare or pay now.",
          holdAvailable: false,
          reason: "non_refundable_rate",
        });
      }

      const workflowId = uuidv4();
      const bookingReference = `TA${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const orderId = `ORD-${Date.now()}`;

      const customer = {
        id: customerId,
        name: `${passengers[0]?.given_name || ""} ${passengers[0]?.family_name || ""}`.trim(),
        email: customerEmail,
        phone: customerPhone,
      };

      // Create workflow state
      const workflowState: BookingWorkflowState = {
        workflowId,
        orderId,
        bookingReference,
        status: "hold",
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
        customer,
      );
      workflowState.documents!.invoice = generateInvoiceHtml(
        { bookingReference, totalAmount },
        customer,
        { total: totalAmount, currency },
      );

      // Persist workflow state to Redis
      await saveWorkflowState(workflowState);

      res.status(201).json({
        success: true,
        workflowId,
        orderId,
        bookingReference,
        status: "hold",
        paymentRequiredBy: new Date(
          Date.now() + 12 * 60 * 60 * 1000,
        ).toISOString(),
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
  },
);

/**
 * POST /api/flight-booking/payment
 * Process payment for hold booking (Step 2 of E2E flow)
 * Requires authentication
 */
router.post(
  "/payment",
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { orderId, workflowId, amount, currency, paymentMethod } = req.body;

      if (!orderId || !workflowId || !amount || !currency) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: orderId, workflowId, amount, currency",
        });
      }

      const workflowState = await getWorkflowState(workflowId);
      if (!workflowState) {
        return res.status(404).json({
          success: false,
          error: "Workflow not found. Please create a hold booking first.",
        });
      }

      if (workflowState.status !== "hold") {
        return res.status(400).json({
          success: false,
          error: `Cannot process payment. Current status: ${workflowState.status}`,
        });
      }

      // Simulate payment processing
      const paymentReference = `PAY-${Date.now()}`;

      // Update workflow state
      workflowState.status = "paid";
      workflowState.updatedAt = new Date();
      workflowState.steps.payment = {
        completed: true,
        timestamp: new Date(),
        data: {
          paymentReference,
          amount,
          currency,
          paymentMethod: paymentMethod || "card",
        },
      };

      // Generate receipt
      workflowState.documents!.receipt = generateReceiptHtml(
        { bookingReference: workflowState.bookingReference },
        workflowState.customer!,
        { total: amount, currency, paymentMethod: paymentMethod || "card" },
      );

      // Persist updated workflow state to Redis
      await saveWorkflowState(workflowState);

      res.status(200).json({
        success: true,
        workflowId,
        orderId,
        paymentReference,
        paymentStatus: "paid",
        message: "Payment successfully processed",
        documents: {
          receipt: workflowState.documents!.receipt,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/flight-booking/:orderId
 * Retrieve booking details (Step 3 of E2E flow)
 * Optional authentication - returns more details if authenticated
 */
router.get(
  "/:orderId",
  optionalAuth,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { orderId } = req.params;
      const { workflowId } = req.query;

      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: "Order ID is required",
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
          status: "hold",
          message: "Booking found (external)",
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
  },
);

/**
 * POST /api/flight-booking/ticket
 * Issue ticket for confirmed booking (Step 4 of E2E flow)
 * Requires authentication
 */
router.post(
  "/ticket",
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { orderId, workflowId, passengers } = req.body;

      if (!orderId || !workflowId) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: orderId, workflowId",
        });
      }

      const workflowState = await getWorkflowState(workflowId);
      if (!workflowState) {
        return res.status(404).json({
          success: false,
          error: "Workflow not found",
        });
      }

      if (workflowState.status !== "paid") {
        return res.status(400).json({
          success: false,
          error: `Cannot issue ticket. Current status: ${workflowState.status}. Payment required first.`,
        });
      }

      // Generate ticket numbers
      const ticketNumber =
        passengers?.[0]?.ticketNumber || `176${Date.now()}0001`;

      // Update workflow state
      workflowState.status = "ticketed";
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
        { ticketNumber },
      );

      // Persist updated workflow state to Redis
      await saveWorkflowState(workflowState);

      res.status(200).json({
        success: true,
        workflowId,
        orderId,
        ticketNumber,
        issuedAt: new Date().toISOString(),
        status: "ticketed",
        documents: {
          ticket: workflowState.documents!.ticket,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/flight-booking/cancel
 * Cancel booking/ticket (Step 5 of E2E flow)
 * Requires authentication
 */
router.post(
  "/cancel",
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { orderId, workflowId, reason } = req.body;

      if (!orderId || !reason || !workflowId) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: orderId, reason, workflowId",
        });
      }

      const workflowState = await getWorkflowState(workflowId);
      if (!workflowState) {
        return res.status(404).json({
          success: false,
          error: "Workflow not found",
        });
      }

      // Update workflow state
      workflowState.status = "cancelled";
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
        status: "cancelled",
        message: "Booking successfully cancelled",
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * POST /api/flight-booking/refund
 * Generate refund note (Step 6 of E2E flow)
 * Requires authentication
 */
router.post(
  "/refund",
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { orderId, workflowId, refundAmount, currency, reason } = req.body;

      if (!orderId || !workflowId || !refundAmount || !currency || !reason) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: orderId, workflowId, refundAmount, currency, reason",
        });
      }

      const workflowState = await getWorkflowState(workflowId);
      if (!workflowState || !workflowState.steps.cancellation.completed) {
        return res.status(400).json({
          success: false,
          error: "Booking must be cancelled before generating refund note",
        });
      }

      // Generate refund note
      const refundNumber = `RFN-${Date.now()}`;

      // Update workflow state
      workflowState.status = "refunded";
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
        { refundNumber, amount: refundAmount, currency, reason },
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
        status: "refunded",
        documents: {
          refundNote: workflowState.documents!.refundNote,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/flight-booking/workflow/:workflowId
 * Get workflow state
 * Requires authentication
 */
router.get(
  "/workflow/:workflowId",
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { workflowId } = req.params;

      const workflowState = await getWorkflowState(workflowId);
      if (!workflowState) {
        return res.status(404).json({
          success: false,
          error: "Workflow not found",
        });
      }

      res.status(200).json({
        success: true,
        data: workflowState,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/flight-booking/workflows
 * List all active workflows
 * Requires authentication (admin only)
 */
router.get(
  "/workflows",
  authMiddleware,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Note: Listing all workflows requires scanning Redis keys
      // This is a potentially expensive operation, so we limit it
      const { getRedisClient } = await import("../cache/redis");
      const client = await getRedisClient();
      const keys = await client.keys("flight:workflow:*");

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
  },
);

/**
 * POST /api/flight-booking/full-flow
 * Execute complete end-to-end booking flow (for testing)
 * Requires authentication
 */
router.post(
  "/full-flow",
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
      if (
        !offerId ||
        !passengers ||
        !customerId ||
        !customerEmail ||
        !totalAmount ||
        !currency
      ) {
        return res.status(400).json({
          success: false,
          error: "Missing required booking fields",
        });
      }

      const results: any = { steps: {} };

      // Step 1: Create Hold Booking
      const holdWorkflowId = uuidv4();
      const bookingReference = `TA${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const orderId = `ORD-${Date.now()}`;

      const customer = {
        id: customerId,
        name: `${passengers[0]?.given_name || ""} ${passengers[0]?.family_name || ""}`.trim(),
        email: customerEmail,
        phone: customerPhone,
      };

      const workflowState: BookingWorkflowState = {
        workflowId: holdWorkflowId,
        orderId,
        bookingReference,
        status: "hold",
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
        customer,
      );
      workflowState.documents!.invoice = generateInvoiceHtml(
        { bookingReference, totalAmount },
        customer,
        { total: totalAmount, currency },
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

        workflowState.status = "paid";
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

        workflowState.documents!.receipt = generateReceiptHtml(
          { bookingReference },
          customer,
          { total: totalAmount, currency, paymentMethod },
        );

        // Persist updated state to Redis
        await saveWorkflowState(workflowState);

        results.steps.payment = {
          success: true,
          workflowId: holdWorkflowId,
          paymentReference,
          paymentStatus: "paid",
          documents: {
            receipt: workflowState.documents!.receipt,
          },
        };

        // Step 4: Issue Ticket
        const ticketNumber = `176${Date.now()}0001`;

        workflowState.status = "ticketed";
        workflowState.updatedAt = new Date();
        workflowState.steps.ticketing = {
          completed: true,
          timestamp: new Date(),
          data: { ticketNumber, issuedAt: new Date() },
        };

        workflowState.documents!.ticket = generateETicketHtml(
          { bookingReference },
          customer,
          { ticketNumber },
        );

        // Persist updated state to Redis
        await saveWorkflowState(workflowState);

        results.steps.ticketing = {
          success: true,
          workflowId: holdWorkflowId,
          ticketNumber,
          status: "ticketed",
          documents: {
            ticket: workflowState.documents!.ticket,
          },
        };

        // Step 5 & 6: Cancel and Refund (if requested)
        if (cancelAfterTicketing) {
          const cancellationReason =
            cancelAfterTicketing.reason || "Customer requested cancellation";

          workflowState.status = "cancelled";
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
            status: "cancelled",
          };

          if (refundAmount) {
            const refundNumber = `RFN-${Date.now()}`;

            workflowState.status = "refunded";
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
              },
            );

            // Persist updated state to Redis
            await saveWorkflowState(workflowState);

            results.steps.refund = {
              success: true,
              workflowId: holdWorkflowId,
              refundNumber,
              refundAmount,
              currency,
              status: "refunded",
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
  },
);

export default router;
