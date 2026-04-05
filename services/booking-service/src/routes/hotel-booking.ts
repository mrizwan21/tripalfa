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

const router: RouterType = Router();

const HOTEL_DOCUMENT_COLORS = {
  textPrimary: 'rgb(51, 51, 51)',
  textMuted: 'rgb(107, 114, 128)',
  brandPrimary: 'rgb(30, 27, 75)',
  success: 'rgb(5, 150, 105)',
  danger: 'rgb(220, 38, 38)',
  border: 'rgb(229, 231, 235)',
  borderSoft: 'rgb(243, 244, 246)',
  surfaceMuted: 'rgb(249, 250, 251)',
} as const;

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

interface HotelWorkflowState {
  workflowId: string;
  bookingId: string;
  bookingReference: string;
  status: 'hold' | 'paid' | 'confirmed' | 'cancelled' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
  steps: {
    hold: { completed: boolean; timestamp?: Date; data?: any };
    payment: { completed: boolean; timestamp?: Date; data?: any };
    confirmation: { completed: boolean; timestamp?: Date; data?: any };
    cancellation: { completed: boolean; timestamp?: Date; data?: any };
    refund: { completed: boolean; timestamp?: Date; data?: any };
  };
  documents?: {
    itinerary?: string;
    invoice?: string;
    voucher?: string;
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
    hotelName: string;
    roomType: string;
    checkInDate: string;
    checkOutDate: string;
    guests: HotelBookingGuest[];
    totalAmount: number;
    currency: string;
  };
}

// ============================================================================
// IN-MEMORY WORKFLOW STORAGE
// ============================================================================

const hotelWorkflowStates: Map<string, HotelWorkflowState> = new Map();

// ============================================================================
// DOCUMENT GENERATION HELPERS
// ============================================================================

function generateHotelItineraryHtml(booking: any, customer: any): string {
  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hotel Booking Itinerary - ${booking.bookingReference}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: ${HOTEL_DOCUMENT_COLORS.textPrimary}; }
    .header { background: ${HOTEL_DOCUMENT_COLORS.brandPrimary}; color: white; padding: 20px; border-radius: 8px; }
    .booking-ref { font-size: 24px; font-weight: bold; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid ${HOTEL_DOCUMENT_COLORS.border}; border-radius: 8px; }
    .hotel-info { background: ${HOTEL_DOCUMENT_COLORS.surfaceMuted}; padding: 15px; border-radius: 8px; }
    .guest { background: ${HOTEL_DOCUMENT_COLORS.surfaceMuted}; padding: 10px; margin: 5px 0; border-radius: 4px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${HOTEL_DOCUMENT_COLORS.borderSoft}; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏨 Hotel Booking Itinerary</h1>
    <div class="booking-ref">Booking Reference: ${booking.bookingReference}</div>
  </div>
  
  <div class="section hotel-info">
    <h2>${booking.hotelName}</h2>
    <div class="detail-row">
      <span>Room Type:</span>
      <strong>${booking.roomType}</strong>
    </div>
    <div class="detail-row">
      <span>Check-in:</span>
      <strong>${booking.checkInDate}</strong>
    </div>
    <div class="detail-row">
      <span>Check-out:</span>
      <strong>${booking.checkOutDate}</strong>
    </div>
    <div class="detail-row">
      <span>Number of Nights:</span>
      <strong>${nights}</strong>
    </div>
  </div>
  
  <div class="section">
    <h2>Guest Details</h2>
    ${
      booking.guests
        ?.map(
          (g: any) => `
      <div class="guest">
        <strong>${g.given_name} ${g.family_name}</strong><br>
        Email: ${g.email}<br>
        Phone: ${g.phone_number}
      </div>
    `
        )
        .join('') || ''
    }
  </div>
  
  <div class="section">
    <h2>Contact Information</h2>
    <p><strong>Email:</strong> ${customer.email}</p>
    <p><strong>Phone:</strong> ${customer.phone}</p>
  </div>
  
  <div style="margin-top: 30px; text-align: center; color: ${HOTEL_DOCUMENT_COLORS.textMuted};">
    <p>Generated by TripAlfa | ${new Date().toISOString()}</p>
  </div>
</body>
</html>`;
}

function generateHotelInvoiceHtml(booking: any, customer: any, payment: any): string {
  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const numNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const totalAmount = payment.total || booking.totalAmount || 0;
  const nightlyRate = totalAmount / Math.max(1, numNights);
  const taxes = totalAmount * 0.1;
  const baseFare = totalAmount - taxes;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hotel Invoice - ${booking.bookingReference}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: ${HOTEL_DOCUMENT_COLORS.textPrimary}; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${HOTEL_DOCUMENT_COLORS.brandPrimary}; padding-bottom: 20px; }
    .invoice-title { font-size: 32px; color: ${HOTEL_DOCUMENT_COLORS.brandPrimary}; }
    .invoice-number { font-size: 18px; color: ${HOTEL_DOCUMENT_COLORS.textMuted}; }
    .section { margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid ${HOTEL_DOCUMENT_COLORS.border}; }
    th { background: ${HOTEL_DOCUMENT_COLORS.surfaceMuted}; }
    .total-row { font-weight: bold; font-size: 18px; background: ${HOTEL_DOCUMENT_COLORS.brandPrimary}; color: white; }
    .footer { margin-top: 40px; text-align: center; color: ${HOTEL_DOCUMENT_COLORS.textMuted}; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="invoice-title">HOTEL INVOICE</div>
      <div class="invoice-number">Invoice #INV-${Date.now()}</div>
    </div>
    <div>
      <strong>TripAlfa Travel</strong><br>
      Dubai, UAE<br>
      info@tripalfa.com
    </div>
  </div>
  
  <div class="section">
    <h3>Hotel: ${booking.hotelName}</h3>
    <p><strong>Room:</strong> ${booking.roomType}</p>
    <p><strong>Check-in:</strong> ${booking.checkInDate} | <strong>Check-out:</strong> ${booking.checkOutDate}</p>
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
          <td>Room Charges (${booking.roomType})</td>
          <td>${payment.currency || 'USD'} ${baseFare.toFixed(2)}</td>
        </tr>
        <tr>
          <td>Taxes & Fees (10%)</td>
          <td>${payment.currency || 'USD'} ${taxes.toFixed(2)}</td>
        </tr>
        <tr class="total-row">
          <td>Total</td>
          <td>${payment.currency || 'USD'} ${totalAmount.toFixed(2)}</td>
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

function generateHotelReceiptHtml(booking: any, customer: any, payment: any): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hotel Payment Receipt - ${booking.bookingReference}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: ${HOTEL_DOCUMENT_COLORS.textPrimary}; }
    .header { background: ${HOTEL_DOCUMENT_COLORS.success}; color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .amount { font-size: 36px; font-weight: bold; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid ${HOTEL_DOCUMENT_COLORS.border}; border-radius: 8px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${HOTEL_DOCUMENT_COLORS.borderSoft}; }
    .detail-row:last-child { border-bottom: none; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✅ Payment Received</h1>
    <div class="amount">${payment.currency || 'USD'} ${(payment.total || 0).toFixed(2)}</div>
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
      <span>Hotel:</span>
      <strong>${booking.hotelName}</strong>
    </div>
    <div class="detail-row">
      <span>Payment Method:</span>
      <strong>${payment.paymentMethod || 'Card'}</strong>
    </div>
    <div class="detail-row">
      <span>Payment Date:</span>
      <strong>${new Date().toLocaleString()}</strong>
    </div>
  </div>
  
  <div class="section">
    <h3>Guest Information</h3>
    <p><strong>${customer.name}</strong><br>
    ${customer.email}</p>
  </div>
  
  <div style="margin-top: 30px; text-align: center; color: ${HOTEL_DOCUMENT_COLORS.textMuted};">
    <p>Thank you for your payment! | Generated by TripAlfa</p>
  </div>
</body>
</html>`;
}

function generateHotelVoucherHtml(booking: any, customer: any, voucherInfo: any): string {
  const checkIn = new Date(booking.checkInDate);
  const checkOut = new Date(booking.checkOutDate);
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hotel Voucher - ${booking.bookingReference}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: ${HOTEL_DOCUMENT_COLORS.textPrimary}; }
    .header { background: ${HOTEL_DOCUMENT_COLORS.brandPrimary}; color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .voucher-number { font-size: 24px; font-weight: bold; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid ${HOTEL_DOCUMENT_COLORS.border}; border-radius: 8px; }
    .hotel-info { background: ${HOTEL_DOCUMENT_COLORS.surfaceMuted}; padding: 15px; border-radius: 8px; text-align: center; }
    .guest-info { background: ${HOTEL_DOCUMENT_COLORS.surfaceMuted}; padding: 15px; border-radius: 8px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${HOTEL_DOCUMENT_COLORS.borderSoft}; }
    .qr-placeholder { width: 120px; height: 120px; background: ${HOTEL_DOCUMENT_COLORS.borderSoft}; margin: 20px auto; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏨 Hotel Confirmation Voucher</h1>
    <div class="voucher-number">Voucher #: ${voucherInfo.voucherNumber}</div>
  </div>
  
  <div class="hotel-info">
    <h2>${booking.hotelName}</h2>
    <p><strong>Confirmation Number:</strong> ${booking.bookingReference}</p>
  </div>
  
  <div class="section">
    <h3>Stay Details</h3>
    <div class="detail-row">
      <span>Check-in:</span>
      <strong>${booking.checkInDate} (After 2:00 PM)</strong>
    </div>
    <div class="detail-row">
      <span>Check-out:</span>
      <strong>${booking.checkOutDate} (Before 12:00 PM)</strong>
    </div>
    <div class="detail-row">
      <span>Room Type:</span>
      <strong>${booking.roomType}</strong>
    </div>
    <div class="detail-row">
      <span>Number of Nights:</span>
      <strong>${nights}</strong>
    </div>
    <div class="detail-row">
      <span>Guests:</span>
      <strong>${booking.guests?.length || 1}</strong>
    </div>
  </div>
  
  <div class="section guest-info">
    <h3>Guest Information</h3>
    <p><strong>Primary Guest:</strong> ${customer.name}</p>
    <p><strong>Email:</strong> ${customer.email}</p>
    <p><strong>Phone:</strong> ${customer.phone}</p>
  </div>
  
  <div class="section">
    <h3>Important Information</h3>
    <ul>
      <li>Please present this voucher along with a valid photo ID at check-in</li>
      <li>Early check-in and late check-out are subject to availability</li>
      <li>Review cancellation policy at time of booking</li>
      <li>Contact hotel directly for special requests (extra bed, airport transfer, etc.)</li>
    </ul>
  </div>
  
  <div class="qr-placeholder">
    QR Code
  </div>
  
  <div style="margin-top: 30px; text-align: center; color: ${HOTEL_DOCUMENT_COLORS.textMuted};">
    <p>Generated by TripAlfa | ${new Date().toISOString()}</p>
  </div>
</body>
</html>`;
}

function generateHotelRefundNoteHtml(booking: any, customer: any, refund: any): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hotel Refund Note - ${booking.bookingReference}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: ${HOTEL_DOCUMENT_COLORS.textPrimary}; }
    .header { background: ${HOTEL_DOCUMENT_COLORS.danger}; color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .refund-amount { font-size: 36px; font-weight: bold; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid ${HOTEL_DOCUMENT_COLORS.border}; border-radius: 8px; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid ${HOTEL_DOCUMENT_COLORS.borderSoft}; }
  </style>
</head>
<body>
  <div class="header">
    <h1>💰 Hotel Booking Refund</h1>
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
      <span>Hotel:</span>
      <strong>${booking.hotelName}</strong>
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
      <strong style="color: ${HOTEL_DOCUMENT_COLORS.success};">COMPLETED</strong>
    </div>
  </div>
  
  <div class="section">
    <h3>Refund To</h3>
    <p><strong>${customer.name}</strong><br>
    ${customer.email}</p>
  </div>
  
  <div style="margin-top: 30px; text-align: center; color: ${HOTEL_DOCUMENT_COLORS.textMuted};">
    <p>Generated by TripAlfa | ${new Date().toISOString()}</p>
  </div>
</body>
</html>`;
}

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
      {
        bookingReference,
        hotelName,
        roomType,
        checkInDate,
        checkOutDate,
        guests,
      },
      customer
    );
    workflowState.documents!.invoice = generateHotelInvoiceHtml(
      {
        bookingReference,
        hotelName,
        roomType,
        checkInDate,
        checkOutDate,
        totalAmount,
      },
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
 *         description: Missing required fields or invalid status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
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
      data: {
        paymentReference,
        amount,
        currency,
        paymentMethod: paymentMethod || 'card',
      },
    };

    workflowState.documents!.receipt = generateHotelReceiptHtml(
      {
        bookingReference: workflowState.bookingReference,
        hotelName: workflowState.booking!.hotelName,
      },
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
      documents: {
        receipt: workflowState.documents!.receipt,
      },
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
 *         description: The booking ID
 *       - in: query
 *         name: workflowId
 *         schema:
 *           type: string
 *         description: Optional workflow ID
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
 *         description: Booking ID is required
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
router.get('/:bookingId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { bookingId } = req.params;
    if (Array.isArray(bookingId)) bookingId = bookingId[0];
    const { workflowId } = req.query;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: 'Booking ID is required',
      });
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
 *         description: Missing required fields or invalid status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
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
router.post('/voucher', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId, workflowId, guests } = req.body;

    if (!bookingId || !workflowId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: bookingId, workflowId',
      });
    }

    const workflowState = hotelWorkflowStates.get(workflowId);
    if (!workflowState) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
      });
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
      data: {
        voucherNumber,
        issuedAt: new Date(),
      },
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
      documents: {
        voucher: workflowState.documents!.voucher,
      },
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
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
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
router.post('/cancel', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bookingId, workflowId, reason } = req.body;

    if (!bookingId || !reason || !workflowId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: bookingId, reason, workflowId',
      });
    }

    const workflowState = hotelWorkflowStates.get(workflowId);
    if (!workflowState) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found',
      });
    }

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
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
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
      return res.status(400).json({
        success: false,
        error: 'Booking must be cancelled before generating refund note',
      });
    }

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
        reason,
        processedAt: new Date(),
      },
    };

    workflowState.documents!.refundNote = generateHotelRefundNoteHtml(
      {
        bookingReference: workflowState.bookingReference,
        hotelName: workflowState.booking!.hotelName,
      },
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
      documents: {
        refundNote: workflowState.documents!.refundNote,
      },
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
 *         description: Missing required fields or booking not cancelled
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
router.get('/workflow/:workflowId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workflowId } = req.params;

    const workflowState = hotelWorkflowStates.get(workflowId);
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
 *         description: Missing required fields or booking not cancelled
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
router.get('/workflows', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const workflows = Array.from(hotelWorkflowStates.values());

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
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
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
router.post('/full-flow', async (req: Request, res: Response, next: NextFunction) => {
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
      paymentMethod,
      cancelAfterConfirmation,
      refundAmount,
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
        error: 'Missing required booking fields',
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
      {
        bookingReference,
        hotelName,
        roomType,
        checkInDate,
        checkOutDate,
        guests,
      },
      customer
    );
    workflowState.documents!.invoice = generateHotelInvoiceHtml(
      {
        bookingReference,
        hotelName,
        roomType,
        checkInDate,
        checkOutDate,
        totalAmount,
      },
      customer,
      { total: totalAmount, currency }
    );

    const results: any = { steps: {} };

    results.steps.hold = {
      success: true,
      workflowId,
      bookingId,
      bookingReference,
      documents: {
        itinerary: workflowState.documents!.itinerary,
        invoice: workflowState.documents!.invoice,
      },
    };

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

      workflowState.documents!.receipt = generateHotelReceiptHtml(
        { bookingReference, hotelName },
        customer,
        { total: totalAmount, currency, paymentMethod }
      );

      results.steps.payment = {
        success: true,
        workflowId,
        paymentReference,
        paymentStatus: 'paid',
        documents: {
          receipt: workflowState.documents!.receipt,
        },
      };

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
          bookingReference,
          hotelName,
          roomType,
          checkInDate,
          checkOutDate,
          guests,
        },
        customer,
        { voucherNumber }
      );

      results.steps.confirmation = {
        success: true,
        workflowId,
        voucherNumber,
        status: 'confirmed',
        documents: {
          voucher: workflowState.documents!.voucher,
        },
      };

      if (cancelAfterConfirmation) {
        const cancellationReason =
          cancelAfterConfirmation.reason || 'Customer requested cancellation';

        workflowState.status = 'cancelled';
        workflowState.updatedAt = new Date();
        workflowState.steps.cancellation = {
          completed: true,
          timestamp: new Date(),
          data: { reason: cancellationReason, cancelledAt: new Date() },
        };

        results.steps.cancellation = {
          success: true,
          workflowId,
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

          workflowState.documents!.refundNote = generateHotelRefundNoteHtml(
            { bookingReference, hotelName },
            customer,
            {
              refundNumber,
              amount: refundAmount,
              currency,
              reason: cancellationReason,
            }
          );

          results.steps.refund = {
            success: true,
            workflowId,
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

    hotelWorkflowStates.set(workflowId, workflowState);

    res.status(200).json({
      success: true,
      workflowId,
      bookingId,
      bookingReference,
      status: workflowState.status,
      flowCompleted: cancelAfterConfirmation ? true : false,
      results: results,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
