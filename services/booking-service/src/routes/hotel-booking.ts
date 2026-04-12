/**
 * Hotel Booking Orchestrator Routes
 *
 * End-to-end hotel booking workflow:
 * 1. Hold Booking - Reserve hotel room without immediate payment
 * 2. Itinerary Generation - Create hotel booking itinerary document
 * 3. Invoice Generation - Create commercial invoice
 * 4. Retrieve Booking - Get booking details and status
 * 5. Issue Voucher - Convert hold to confirmed hotel voucher
 * 6. Generate Receipt - Create payment receipt
 * 7. Cancel Booking - Cancel hotel reservation
 * 8. Generate Refund Note - Create refund documentation
 *
 * Routes:
 * - POST /api/hotel-booking/hold - Create hold booking (Step 1)
 * - POST /api/hotel-booking/payment - Process payment (Step 2)
 * - GET /api/hotel-booking/:bookingId - Retrieve booking (Step 3)
 * - POST /api/hotel-booking/voucher - Issue hotel voucher (Step 4)
 * - POST /api/hotel-booking/receipt - Generate receipt
 * - POST /api/hotel-booking/cancel - Cancel booking (Step 5)
 * - POST /api/hotel-booking/refund - Generate refund note (Step 6)
 * - GET /api/hotel-booking/workflow/:workflowId - Get workflow state
 * - GET /api/hotel-booking/workflows - List all workflows
 * - POST /api/hotel-booking/full-flow - Execute complete flow (testing)
 */

import { Router, Request, Response, NextFunction } from 'express';
import type { Router as RouterType } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { HotelWorkflowState } from "./hotelWorkflowState";
import { generateHotelItineraryHtml, generateHotelInvoiceHtml, generateHotelReceiptHtml, generateHotelVoucherHtml, generateHotelRefundNoteHtml } from "./documentHelpers";

const router: RouterType = Router();

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface HotelBookingGuest {
  title: string;
  given_name: string;
  family_name: string;
  email: string;
  phone_number: string;
}

interface CreateHoldBookingRequest {
  offerId: string;
  hotelName: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  guests: HotelBookingGuest[];
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  currency: string;
  isRefundable?: boolean;
}

interface PaymentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: 'balance' | 'card';
}

interface IssueVoucherRequest {
  bookingId: string;
  guests: Array<{
    guestId: string;
    roomNumber?: string;
  }>;
}

interface CancelBookingRequest {
  bookingId: string;
  bookingRef?: string;
  reason: string;
}

// ============================================================================
// IN-MEMORY WORKFLOW STORAGE
// ============================================================================

const hotelWorkflowStates: Map<string, HotelWorkflowState> = new Map();

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * @swagger
 * /api/hotel-booking/hold:
 *   post:
 *     summary: Create a hold booking for a hotel
 *     tags: [Hotel Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [offerId, hotelName, checkInDate, checkOutDate, guests, customerId, customerEmail, totalAmount, currency]
 *             properties:
 *               offerId:
 *                 type: string
 *               hotelName:
 *                 type: string
 *               roomType:
 *                 type: string
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *               guests:
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
 *       400:
 *         description: Missing required fields or non-refundable rate
 */
router.post('/hold', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      offerId,
      hotelName,
      roomType,
      checkInDate,
      checkOutDate,
      guests,
      customerId,
      customerEmail,
      customerPhone,
      totalAmount,
      currency,
    } = req.body;

    if (
      !offerId ||
      !hotelName ||
      !checkInDate ||
      !checkOutDate ||
      !guests ||
      !customerId ||
      !customerEmail ||
      !totalAmount ||
      !currency
    ) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Check if hold is allowed for this booking (only for refundable rates)
    const isRefundable = req.body.isRefundable !== false;
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
    const bookingReference = `HT${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const bookingId = `HBK-${Date.now()}`;

    const customer = {
      id: customerId,
      name: `${guests[0]?.given_name || ''} ${guests[0]?.family_name || ''}`.trim(),
      email: customerEmail,
      phone: customerPhone,
    };

    const workflowState: HotelWorkflowState = {
      workflowId,
      bookingId,
      bookingReference,
      status: 'hold',
      createdAt: new Date(),
      updatedAt: new Date(),
      steps: {
        hold: { completed: true, timestamp: new Date() },
        payment: { completed: false },
        confirmation: { completed: false },
        cancellation: { completed: false },
        refund: { completed: false },
      },
      customer,
      booking: {
        offerId,
        hotelName,
        roomType,
        checkInDate,
        checkOutDate,
        guests,
        totalAmount,
        currency,
      },
      documents: {},
    };

    workflowState.documents!.itinerary = generateHotelItineraryHtml(
      { bookingReference, hotelName, roomType, checkInDate, checkOutDate, guests },
      customer
    );
    workflowState.documents!.invoice = generateHotelInvoiceHtml(
      { bookingReference, hotelName, roomType, checkInDate, checkOutDate, totalAmount },
      customer,
      { total: totalAmount, currency }
    );

    hotelWorkflowStates.set(workflowId, workflowState);

    res.status(201).json({
      success: true,
      workflowId,
      bookingId,
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
});

/**
 * @swagger
 * /api/hotel-booking/payment:
 *   post:
 *     summary: Process payment for hold booking
 *     tags: [Hotel Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, workflowId, amount, currency]
 *             properties:
 *               bookingId:
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
 *       400:
 *         description: Missing required fields or invalid status
 *       404:
 *         description: Workflow not found
 */
router.post('/payment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId, workflowId, amount, currency, paymentMethod } = req.body;

    if (!bookingId || !workflowId || !amount || !currency) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: bookingId, workflowId, amount, currency',
      });
    }

    const workflowState = hotelWorkflowStates.get(workflowId);
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

    const paymentReference = `PAY-${Date.now()}`;

    workflowState.status = 'paid';
    workflowState.updatedAt = new Date();
    workflowState.steps.payment = {
      completed: true,
      timestamp: new Date(),
      data: { paymentReference, amount, currency, paymentMethod: paymentMethod || 'card' },
    };

    workflowState.documents!.receipt = generateHotelReceiptHtml(
      { bookingReference: workflowState.bookingReference, hotelName: workflowState.booking!.hotelName },
      workflowState.customer!,
      { total: amount, currency, paymentMethod: paymentMethod || 'card' }
    );

    hotelWorkflowStates.set(workflowId, workflowState);

    res.status(200).json({
      success: true,
      workflowId,
      bookingId,
      paymentReference,
      paymentStatus: 'paid',
      message: 'Payment successfully processed',
      documents: { receipt: workflowState.documents!.receipt },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/hotel-booking/{bookingId}:
 *   get:
 *     summary: Retrieve hotel booking details
 *     tags: [Hotel Booking]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: workflowId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
 *       400:
 *         description: Booking ID is required
 */
router.get('/:bookingId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { bookingId } = req.params;
    if (Array.isArray(bookingId)) bookingId = bookingId[0];
    const { workflowId } = req.query;

    if (!bookingId) {
      return res.status(400).json({ success: false, error: 'Booking ID is required' });
    }

    let workflowState: HotelWorkflowState | undefined;
    const workflowIdStr = Array.isArray(workflowId) ? workflowId[0] : workflowId;
    if (workflowIdStr) {
      workflowState = hotelWorkflowStates.get(workflowIdStr);
    } else {
      for (const [_, state] of hotelWorkflowStates) {
        if (state.bookingId === bookingId) {
          workflowState = state;
          break;
        }
      }
    }

    if (!workflowState) {
      return res.status(200).json({
        success: true,
        bookingId,
        bookingReference: `HT${bookingId.slice(-6)}`,
        status: 'hold',
        message: 'Booking found (external)',
      });
    }

    res.status(200).json({
      success: true,
      workflowId: workflowState.workflowId,
      bookingId: workflowState.bookingId,
      bookingReference: workflowState.bookingReference,
      status: workflowState.status,
      hotelName: workflowState.booking?.hotelName,
      roomType: workflowState.booking?.roomType,
      checkInDate: workflowState.booking?.checkInDate,
      checkOutDate: workflowState.booking?.checkOutDate,
      totalAmount: workflowState.booking?.totalAmount,
      currency: workflowState.booking?.currency,
      guests: workflowState.booking?.guests,
      customer: workflowState.customer,
      createdAt: workflowState.createdAt,
      updatedAt: workflowState.updatedAt,
      steps: workflowState.steps,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/hotel-booking/voucher:
 *   post:
 *     summary: Issue hotel voucher for confirmed booking
 *     tags: [Hotel Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, workflowId]
 *             properties:
 *               bookingId:
 *                 type: string
 *               workflowId:
 *                 type: string
 *               guests:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Voucher issued successfully
 *       400:
 *         description: Missing required fields or invalid status
 *       404:
 *         description: Workflow not found
 */
router.post('/voucher', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId, workflowId, guests } = req.body;

    if (!bookingId || !workflowId) {
      return res.status(400).json({ success: false, error: 'Missing required fields: bookingId, workflowId' });
    }

    const workflowState = hotelWorkflowStates.get(workflowId);
    if (!workflowState) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    if (workflowState.status !== 'paid') {
      return res.status(400).json({
        success: false,
        error: `Cannot issue voucher. Current status: ${workflowState.status}. Payment required first.`,
      });
    }

    const voucherNumber = `VOU${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    workflowState.status = 'confirmed';
    workflowState.updatedAt = new Date();
    workflowState.steps.confirmation = {
      completed: true,
      timestamp: new Date(),
      data: { voucherNumber, issuedAt: new Date() },
    };

    workflowState.documents!.voucher = generateHotelVoucherHtml(
      {
        bookingReference: workflowState.bookingReference,
        hotelName: workflowState.booking!.hotelName,
        roomType: workflowState.booking!.roomType,
        checkInDate: workflowState.booking!.checkInDate,
        checkOutDate: workflowState.booking!.checkOutDate,
        guests: workflowState.booking!.guests,
      },
      workflowState.customer!,
      { voucherNumber }
    );

    hotelWorkflowStates.set(workflowId, workflowState);

    res.status(200).json({
      success: true,
      workflowId,
      bookingId,
      voucherNumber,
      issuedAt: new Date().toISOString(),
      status: 'confirmed',
      documents: { voucher: workflowState.documents!.voucher },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/hotel-booking/cancel:
 *   post:
 *     summary: Cancel hotel booking
 *     tags: [Hotel Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, workflowId, reason]
 *             properties:
 *               bookingId:
 *                 type: string
 *               workflowId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Workflow not found
 */
router.post('/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId, workflowId, reason } = req.body;

    if (!bookingId || !reason || !workflowId) {
      return res.status(400).json({ success: false, error: 'Missing required fields: bookingId, reason, workflowId' });
    }

    const workflowState = hotelWorkflowStates.get(workflowId);
    if (!workflowState) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    workflowState.status = 'cancelled';
    workflowState.updatedAt = new Date();
    workflowState.steps.cancellation = {
      completed: true,
      timestamp: new Date(),
      data: { reason, cancelledAt: new Date() },
    };

    hotelWorkflowStates.set(workflowId, workflowState);

    res.status(200).json({
      success: true,
      workflowId,
      bookingId,
      bookingReference: workflowState.bookingReference,
      cancellationId: `CNL-${Date.now()}`,
      cancelledAt: new Date().toISOString(),
      status: 'cancelled',
      message: 'Hotel booking successfully cancelled',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/hotel-booking/refund:
 *   post:
 *     summary: Generate refund note for cancelled booking
 *     tags: [Hotel Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, workflowId, refundAmount, currency, reason]
 *             properties:
 *               bookingId:
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
 *       400:
 *         description: Missing required fields or booking not cancelled
 */
router.post('/refund', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId, workflowId, refundAmount, currency, reason } = req.body;

    if (!bookingId || !workflowId || !refundAmount || !currency || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: bookingId, workflowId, refundAmount, currency, reason',
      });
    }

    const workflowState = hotelWorkflowStates.get(workflowId);
    if (!workflowState || !workflowState.steps.cancellation.completed) {
      return res.status(400).json({ success: false, error: 'Booking must be cancelled before generating refund note' });
    }

    const refundNumber = `RFN-${Date.now()}`;

    workflowState.status = 'refunded';
    workflowState.updatedAt = new Date();
    workflowState.steps.refund = {
      completed: true,
      timestamp: new Date(),
      data: { refundNumber, amount: refundAmount, currency, reason, processedAt: new Date() },
    };

    workflowState.documents!.refundNote = generateHotelRefundNoteHtml(
      { bookingReference: workflowState.bookingReference, hotelName: workflowState.booking!.hotelName },
      workflowState.customer!,
      { refundNumber, amount: refundAmount, currency, reason }
    );

    hotelWorkflowStates.set(workflowId, workflowState);

    res.status(200).json({
      success: true,
      workflowId,
      bookingId,
      refundNumber,
      refundAmount,
      currency,
      processedAt: new Date().toISOString(),
      status: 'refunded',
      documents: { refundNote: workflowState.documents!.refundNote },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/hotel-booking/workflow/{workflowId}:
 *   get:
 *     summary: Get workflow state by workflow ID
 *     tags: [Hotel Booking]
 *     parameters:
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow state retrieved successfully
 *       404:
 *         description: Workflow not found
 */
router.get('/workflow/:workflowId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workflowId } = req.params;
    const workflowState = hotelWorkflowStates.get(workflowId);
    if (!workflowState) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }
    res.status(200).json({ success: true, data: workflowState });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/hotel-booking/workflows:
 *   get:
 *     summary: List all hotel booking workflows
 *     tags: [Hotel Booking]
 *     responses:
 *       200:
 *         description: List of workflows retrieved successfully
 */
router.get('/workflows', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const workflows = Array.from(hotelWorkflowStates.values());
    res.status(200).json({ success: true, data: workflows, meta: { total: workflows.length } });
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/hotel-booking/full-flow:
 *   post:
 *     summary: Execute complete end-to-end hotel booking flow (testing)
 *     tags: [Hotel Booking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [offerId, hotelName, checkInDate, checkOutDate, guests, customerId, customerEmail, totalAmount, currency]
 *             properties:
 *               offerId:
 *                 type: string
 *               hotelName:
 *                 type: string
 *               roomType:
 *                 type: string
 *               checkInDate:
 *                 type: string
 *               checkOutDate:
 *                 type: string
 *               guests:
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
 *               cancelAfterConfirmation:
 *                 type: object
 *               refundAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Full flow executed successfully
 *       400:
 *         description: Missing required booking fields
 */
router.post('/full-flow', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      offerId, hotelName, roomType, checkInDate, checkOutDate, guests,
      customerId, customerEmail, customerPhone, totalAmount, currency,
      paymentMethod, cancelAfterConfirmation, refundAmount,
    } = req.body;

    if (!offerId || !hotelName || !checkInDate || !checkOutDate || !guests || !customerId || !customerEmail || !totalAmount || !currency) {
      return res.status(400).json({ success: false, error: 'Missing required booking fields' });
    }

    const workflowId = uuidv4();
    const bookingReference = `HT${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const bookingId = `HBK-${Date.now()}`;

    const customer = {
      id: customerId,
      name: `${guests[0]?.given_name || ''} ${guests[0]?.family_name || ''}`.trim(),
      email: customerEmail,
      phone: customerPhone,
    };

    const workflowState: HotelWorkflowState = {
      workflowId, bookingId, bookingReference,
      status: 'hold',
      createdAt: new Date(), updatedAt: new Date(),
      steps: {
        hold: { completed: true, timestamp: new Date() },
        payment: { completed: false },
        confirmation: { completed: false },
        cancellation: { completed: false },
        refund: { completed: false },
      },
      customer,
      booking: { offerId, hotelName, roomType, checkInDate, checkOutDate, guests, totalAmount, currency },
      documents: {},
    };

    workflowState.documents!.itinerary = generateHotelItineraryHtml(
      { bookingReference, hotelName, roomType, checkInDate, checkOutDate, guests }, customer
    );
    workflowState.documents!.invoice = generateHotelInvoiceHtml(
      { bookingReference, hotelName, roomType, checkInDate, checkOutDate, totalAmount }, customer, { total: totalAmount, currency }
    );

    const results: any = { steps: {} };
    results.steps.hold = {
      success: true, workflowId, bookingId, bookingReference,
      documents: { itinerary: workflowState.documents!.itinerary, invoice: workflowState.documents!.invoice },
    };

    if (paymentMethod) {
      const paymentReference = `PAY-${Date.now()}`;
      workflowState.status = 'paid';
      workflowState.updatedAt = new Date();
      workflowState.steps.payment = {
        completed: true, timestamp: new Date(),
        data: { paymentReference, amount: totalAmount, currency, paymentMethod },
      };
      workflowState.documents!.receipt = generateHotelReceiptHtml(
        { bookingReference, hotelName }, customer, { total: totalAmount, currency, paymentMethod }
      );
      results.steps.payment = {
        success: true, workflowId, paymentReference, paymentStatus: 'paid',
        documents: { receipt: workflowState.documents!.receipt },
      };

      const voucherNumber = `VOU${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      workflowState.status = 'confirmed';
      workflowState.updatedAt = new Date();
      workflowState.steps.confirmation = {
        completed: true, timestamp: new Date(),
        data: { voucherNumber, issuedAt: new Date() },
      };
      workflowState.documents!.voucher = generateHotelVoucherHtml(
        { bookingReference, hotelName, roomType, checkInDate, checkOutDate, guests }, customer, { voucherNumber }
      );
      results.steps.confirmation = {
        success: true, workflowId, voucherNumber, status: 'confirmed',
        documents: { voucher: workflowState.documents!.voucher },
      };

      if (cancelAfterConfirmation) {
        const cancellationReason = cancelAfterConfirmation.reason || 'Customer requested cancellation';
        workflowState.status = 'cancelled';
        workflowState.updatedAt = new Date();
        workflowState.steps.cancellation = {
          completed: true, timestamp: new Date(),
          data: { reason: cancellationReason, cancelledAt: new Date() },
        };
        results.steps.cancellation = {
          success: true, workflowId, cancellationId: `CNL-${Date.now()}`, status: 'cancelled',
        };

        if (refundAmount) {
          const refundNumber = `RFN-${Date.now()}`;
          workflowState.status = 'refunded';
          workflowState.updatedAt = new Date();
          workflowState.steps.refund = {
            completed: true, timestamp: new Date(),
            data: { refundNumber, amount: refundAmount, currency, reason: cancellationReason, processedAt: new Date() },
          };
          workflowState.documents!.refundNote = generateHotelRefundNoteHtml(
            { bookingReference, hotelName }, customer,
            { refundNumber, amount: refundAmount, currency, reason: cancellationReason }
          );
          results.steps.refund = {
            success: true, workflowId, refundNumber, refundAmount, currency, status: 'refunded',
            documents: { refundNote: workflowState.documents!.refundNote },
          };
        }
      }
    }

    hotelWorkflowStates.set(workflowId, workflowState);

    res.status(200).json({
      success: true, workflowId, bookingId, bookingReference,
      status: workflowState.status,
      flowCompleted: cancelAfterConfirmation ? true : false,
      results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;