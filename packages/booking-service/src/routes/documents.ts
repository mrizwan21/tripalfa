import express, { Request, Response, Router } from 'express';
import { prisma } from '@tripalfa/shared-database';

const router: Router = express.Router();

/**
 * Document Routes
 * Handles document generation, listing, and download for bookings.
 * Routes are: /api/documents
 */

// Import the document generation service functions from booking-engine
// In production, these would be shared via a package or duplicated

interface DocumentCompanyInfo {
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId?: string;
  registrationNumber?: string;
}

interface DocumentCustomerInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  nationality?: string;
  passportNumber?: string;
  companyName?: string;
}

interface FlightSegment {
  id: string;
  flightNumber: string;
  airline: string;
  airlineIata: string;
  aircraftType?: string;
  departureAirport: string;
  departureAirportCode: string;
  departureCity: string;
  departureTerminal?: string;
  departureTime: string;
  departureDate: string;
  arrivalAirport: string;
  arrivalAirportCode: string;
  arrivalCity: string;
  arrivalTerminal?: string;
  arrivalTime: string;
  duration?: string;
  cabinClass: string;
  seatNumber?: string;
  mealType?: string;
  baggagAllowance?: string;
}

interface DocumentPassenger {
  id: string;
  firstName: string;
  lastName: string;
  type: 'adult' | 'child' | 'infant';
  nationality?: string;
  passportNumber?: string;
}

interface FlightBooking {
  id: string;
  bookingReference: string;
  pnr?: string;
  ticketNumber?: string;
  passengers: DocumentPassenger[];
  segments: FlightSegment[];
  totalAmount: number;
  baseFare: number;
  taxes: number;
  currency: string;
}

interface HotelRoom {
  id: string;
  roomType: string;
  roomName: string;
  adults: number;
  children: number;
  checkIn: string;
  checkOut: string;
  numberOfNights: number;
  ratePerNight: number;
  totalRate: number;
  inclusions?: string[];
}

interface HotelBooking {
  id: string;
  hotelName: string;
  hotelAddress: string;
  hotelCity: string;
  hotelCountry: string;
  hotelPhone?: string;
  hotelEmail?: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfNights: number;
  rooms: HotelRoom[];
  guestName: string;
  totalGuests: number;
  voucherNumber: string;
  confirmationNumber: string;
}

interface PaymentBreakdown {
  baseFare: number;
  taxes: number;
  fees: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paidAmount: number;
}

const DEFAULT_COMPANY_INFO: DocumentCompanyInfo = {
  name: 'TripAlfa',
  logo: 'https://tripalfa.com/logo.png',
  address: '123 Travel Street, Dubai, UAE',
  phone: '+971 4 123 4567',
  email: 'support@tripalfa.com',
  website: 'https://tripalfa.com',
  taxId: 'TAX123456789',
  registrationNumber: 'DUB2024001',
};

const DOCUMENT_THEME_COLORS = {
  textPrimary: 'rgb(21, 31, 102)', // Deep Navy from brand
  textSecondary: 'rgb(102, 112, 133)', // Muted Slate
  brandPrimary: 'rgb(21, 31, 102)', // Primary Navy
  brandPrimaryDark: 'rgb(15, 22, 73)', // Darker Navy
  brandSecondary: 'rgb(237, 107, 74)', // Coral
  brandAccent: 'rgb(40, 220, 203)', // Cyan
  surfaceMuted: 'rgb(242, 244, 247)',
  surfaceInfo: 'rgb(230, 242, 255)',
  success: 'rgb(18, 183, 106)',
  successDark: 'rgb(10, 132, 78)',
  danger: 'rgb(240, 68, 56)',
  dangerDark: 'rgb(180, 35, 24)',
  warning: 'rgb(247, 144, 9)',
  warningDark: 'rgb(181, 71, 8)',
} as const;

// ============================================================================
// HELPER FUNCTIONS - Generate Document HTML
// ============================================================================

function generateFlightItineraryHtml(
  booking: FlightBooking,
  customer: DocumentCustomerInfo
): string {
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  const formatTime = (time: string) =>
    new Date(time).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

  const segmentsHtml = booking.segments
    .map(
      (segment, index) => `
    <div style="margin-bottom: 30px; padding: 20px; background-color: ${DOCUMENT_THEME_COLORS.surfaceMuted}; border-radius: 12px; border-left: 4px solid ${DOCUMENT_THEME_COLORS.brandSecondary};">
      <h3 style="margin: 0 0 15px 0; color: ${DOCUMENT_THEME_COLORS.brandPrimary};">Flight ${index + 1}: ${segment.airline} ${segment.flightNumber}</h3>
      <table style="width: 100%;">
        <tr>
          <td style="padding: 10px;">
            <div style="font-size: 24px; font-weight: bold; color: ${DOCUMENT_THEME_COLORS.brandPrimary};">${formatTime(segment.departureTime)}</div>
            <div style="font-weight: 600;">${segment.departureCity} (${segment.departureAirportCode})</div>
            <div style="font-size: 12px; color: ${DOCUMENT_THEME_COLORS.textSecondary};">${formatDate(segment.departureDate)}${segment.departureTerminal ? ` - Terminal ${segment.departureTerminal}` : ''}</div>
          </td>
          <td style="padding: 10px; text-align: center; color: ${DOCUMENT_THEME_COLORS.brandSecondary};">
             <div style="font-size: 20px;">✈</div>
             <div style="font-size: 11px; font-weight: 600;">${segment.duration || ''}</div>
          </td>
          <td style="padding: 10px; text-align: right;">
            <div style="font-size: 24px; font-weight: bold; color: ${DOCUMENT_THEME_COLORS.brandPrimary};">${formatTime(segment.arrivalTime)}</div>
            <div style="font-weight: 600;">${segment.arrivalCity} (${segment.arrivalAirportCode})</div>
          </td>
        </tr>
      </table>
    </div>
  `
    )
    .join('');

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Flight Itinerary</title></head>
<body style="font-family: Arial; padding: 20px;">
  <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, ${DOCUMENT_THEME_COLORS.brandPrimary}, ${DOCUMENT_THEME_COLORS.brandPrimaryDark}); padding: 30px; color: white; text-align: center;">
      <h1 style="margin: 0;">✈ Flight Itinerary</h1>
      <p>Booking: <strong>${booking.bookingReference}</strong></p>
    </div>
    <div style="padding: 30px;">
      <h3>Passenger: ${customer.name}</h3>
      <p>Email: ${customer.email} | Phone: ${customer.phone}</p>
      ${segmentsHtml}
      <div style="margin-top: 20px; padding: 15px; background: ${DOCUMENT_THEME_COLORS.surfaceInfo}; border-radius: 8px;">
        <strong>Total:</strong> ${booking.currency} ${booking.totalAmount.toFixed(2)}
      </div>
    </div>
  </div>
</body></html>
  `;
}

function generateHotelItineraryHtml(booking: HotelBooking, customer: DocumentCustomerInfo): string {
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  const totalAmount = booking.rooms.reduce((sum, room) => sum + room.totalRate, 0);

  const roomsHtml = booking.rooms
    .map(
      room => `
    <div style="padding: 15px; background: ${DOCUMENT_THEME_COLORS.surfaceMuted}; border-radius: 12px; margin-bottom: 15px; border-left: 4px solid ${DOCUMENT_THEME_COLORS.brandSecondary};">
      <h4 style="margin: 0 0 10px 0; color: ${DOCUMENT_THEME_COLORS.brandPrimary};">${room.roomName}</h4>
      <p style="margin: 5px 0;">${room.adults} Adults, ${room.children} Children | ${room.numberOfNights} Nights</p>
      <p style="margin: 5px 0; font-weight: bold; color: ${DOCUMENT_THEME_COLORS.brandPrimary};">Total: $${room.totalRate.toFixed(2)}</p>
      ${room.inclusions?.length ? `<p style="margin: 5px 0; font-size: 12px; color: ${DOCUMENT_THEME_COLORS.brandAccent}; font-weight: 600;">✨ Inclusions: ${room.inclusions.join(', ')}</p>` : ''}
    </div>
  `
    )
    .join('');

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Hotel Itinerary</title></head>
<body style="font-family: Arial; padding: 20px;">
  <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, ${DOCUMENT_THEME_COLORS.brandPrimary}, ${DOCUMENT_THEME_COLORS.brandPrimaryDark}); padding: 30px; color: white; text-align: center;">
      <h1 style="margin: 0;">🏨 Hotel Itinerary</h1>
      <p>Confirmation: <strong>${booking.confirmationNumber}</strong></p>
    </div>
    <div style="padding: 30px;">
      <h3>${booking.hotelName}</h3>
      <p>${booking.hotelAddress}, ${booking.hotelCity}, ${booking.hotelCountry}</p>
      <p><strong>Check-in:</strong> ${formatDate(booking.checkInDate)} | <strong>Check-out:</strong> ${formatDate(booking.checkOutDate)}</p>
      <p><strong>Guest:</strong> ${booking.guestName}</p>
      <h4>Rooms:</h4>
      ${roomsHtml}
      <div style="margin-top: 20px; padding: 15px; background: ${DOCUMENT_THEME_COLORS.surfaceInfo}; border-radius: 8px;">
        <strong>Total:</strong> $${totalAmount.toFixed(2)}
      </div>
    </div>
  </div>
</body></html>
  `;
}

function generateFlightETicketHtml(booking: FlightBooking, customer: DocumentCustomerInfo): string {
  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>E-Ticket</title></head>
<body style="font-family: Arial; padding: 20px;">
  <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, ${DOCUMENT_THEME_COLORS.brandPrimary}, ${DOCUMENT_THEME_COLORS.brandPrimaryDark}); padding: 30px; color: white; text-align: center;">
      <h1 style="margin: 0;">🎫 E-TICKET</h1>
      <p>Booking: <strong>${booking.bookingReference}</strong></p>
      <p>Ticket: <strong>${booking.ticketNumber || 'N/A'}</strong></p>
    </div>
    <div style="padding: 30px;">
      <h3>Passenger: ${customer.name}</h3>
      <p>Email: ${customer.email}</p>
      ${booking.segments
        .map(
          (s, i) => `
        <div style="padding: 15px; background: ${DOCUMENT_THEME_COLORS.surfaceMuted}; border-radius: 8px; margin: 10px 0;">
          <strong>Flight ${i + 1}:</strong> ${s.airline} ${s.flightNumber}<br>
          <strong>From:</strong> ${s.departureCity} (${s.departureAirportCode}) at ${s.departureTime}<br>
          <strong>To:</strong> ${s.arrivalCity} (${s.arrivalAirportCode}) at ${s.arrivalTime}<br>
          <strong>Class:</strong> ${s.cabinClass}
        </div>
      `
        )
        .join('')}
    </div>
  </div>
</body></html>
  `;
}

function generateHotelVoucherHtml(booking: HotelBooking, customer: DocumentCustomerInfo): string {
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  const totalAmount = booking.rooms.reduce((sum, room) => sum + room.totalRate, 0);

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Hotel Voucher</title></head>
<body style="font-family: Arial; padding: 20px;">
  <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, ${DOCUMENT_THEME_COLORS.brandPrimary}, ${DOCUMENT_THEME_COLORS.brandPrimaryDark}); padding: 30px; color: white; text-align: center;">
      <h1 style="margin: 0;">🏨 HOTEL VOUCHER</h1>
      <p>Voucher: <strong>${booking.voucherNumber}</strong></p>
    </div>
    <div style="padding: 30px;">
      <h3>${booking.hotelName}</h3>
      <p>${booking.hotelAddress}, ${booking.hotelCity}, ${booking.hotelCountry}</p>
      ${booking.hotelPhone ? `<p>Phone: ${booking.hotelPhone}</p>` : ''}
      <hr>
      <p><strong>Guest:</strong> ${booking.guestName}</p>
      <p><strong>Check-in:</strong> ${formatDate(booking.checkInDate)} (from 14:00)</p>
      <p><strong>Check-out:</strong> ${formatDate(booking.checkOutDate)} (until 12:00)</p>
      <p><strong>Total Nights:</strong> ${booking.numberOfNights}</p>
      <div style="margin-top: 20px; padding: 15px; background: ${DOCUMENT_THEME_COLORS.surfaceInfo}; border-radius: 8px; text-align: center;">
        <strong>Total Amount: $${totalAmount.toFixed(2)}</strong>
      </div>
    </div>
  </div>
</body></html>
  `;
}

function generateFlightInvoiceHtml(
  booking: FlightBooking,
  customer: DocumentCustomerInfo,
  payment: PaymentBreakdown
): string {
  const invoiceNumber = `INV-FL-${booking.bookingReference}-${Date.now()}`;

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice</title></head>
<body style="font-family: Arial; padding: 20px;">
  <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, ${DOCUMENT_THEME_COLORS.brandPrimary}, ${DOCUMENT_THEME_COLORS.brandPrimaryDark}); padding: 30px; color: white;">
      <h1 style="margin: 0;">INVOICE</h1>
      <p>Flight Booking</p>
    </div>
    <div style="padding: 30px;">
      <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
      <p><strong>Booking:</strong> ${booking.bookingReference}</p>
      <hr>
      <h3>Bill To</h3>
      <p>${customer.name}<br>${customer.email}<br>${customer.phone}</p>
      <hr>
      <h3>Payment Details</h3>
      <table style="width: 100%;">
        <tr><td>Base Fare</td><td style="text-align: right;">${payment.currency} ${payment.baseFare.toFixed(2)}</td></tr>
        <tr><td>Taxes & Fees</td><td style="text-align: right;">${payment.currency} ${payment.taxes.toFixed(2)}</td></tr>
        <tr><td><strong>Total</strong></td><td style="text-align: right;"><strong>${payment.currency} ${payment.total.toFixed(2)}</strong></td></tr>
        <tr><td>Paid</td><td style="text-align: right; color: green;">${payment.currency} ${payment.paidAmount.toFixed(2)}</td></tr>
      </table>
    </div>
  </div>
</body></html>
  `;
}

function generateHotelInvoiceHtml(
  booking: HotelBooking,
  customer: DocumentCustomerInfo,
  payment: PaymentBreakdown
): string {
  const invoiceNumber = `INV-HT-${booking.confirmationNumber}-${Date.now()}`;
  const roomsTotal = booking.rooms.reduce((sum, room) => sum + room.totalRate, 0);

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Invoice</title></head>
<body style="font-family: Arial; padding: 20px;">
  <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, ${DOCUMENT_THEME_COLORS.brandPrimary}, ${DOCUMENT_THEME_COLORS.brandPrimaryDark}); padding: 30px; color: white;">
      <h1 style="margin: 0;">INVOICE</h1>
      <p>Hotel Booking</p>
    </div>
    <div style="padding: 30px;">
      <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
      <p><strong>Voucher:</strong> ${booking.voucherNumber}</p>
      <hr>
      <h3>Bill To</h3>
      <p>${customer.name}<br>${customer.email}<br>${customer.phone}</p>
      <hr>
      <h3>Hotel: ${booking.hotelName}</h3>
      <p>${booking.hotelAddress}, ${booking.hotelCity}</p>
      <h3>Room Total: $${roomsTotal.toFixed(2)}</h3>
      <table style="width: 100%;">
        <tr><td><strong>Total</strong></td><td style="text-align: right;"><strong>${payment.currency} ${payment.total.toFixed(2)}</strong></td></tr>
        <tr><td>Paid</td><td style="text-align: right; color: green;">${payment.currency} ${payment.paidAmount.toFixed(2)}</td></tr>
      </table>
    </div>
  </div>
</body></html>
  `;
}

function generateFlightReceiptHtml(
  booking: FlightBooking,
  customer: DocumentCustomerInfo,
  payment: PaymentBreakdown
): string {
  const receiptNumber = `RCT-FL-${booking.bookingReference}-${Date.now()}`;

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Payment Receipt</title></head>
<body style="font-family: Arial; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, ${DOCUMENT_THEME_COLORS.success}, ${DOCUMENT_THEME_COLORS.successDark}); padding: 30px; color: white; text-align: center;">
      <div style="font-size: 48px;">✓</div>
      <h1 style="margin: 0;">PAYMENT RECEIPT</h1>
      <p>Transaction Successful</p>
    </div>
    <div style="padding: 30px;">
      <p><strong>Receipt #:</strong> ${receiptNumber}</p>
      <p><strong>Booking:</strong> ${booking.bookingReference}</p>
      <p><strong>Customer:</strong> ${customer.name}</p>
      <hr>
      <p><strong>Amount Paid:</strong> <span style="font-size: 24px; color: ${DOCUMENT_THEME_COLORS.success};">${payment.currency} ${payment.paidAmount.toFixed(2)}</span></p>
      <p><strong>Payment Method:</strong> ${payment.paymentMethod}</p>
    </div>
  </div>
</body></html>
  `;
}

function generateHotelReceiptHtml(
  booking: HotelBooking,
  customer: DocumentCustomerInfo,
  payment: PaymentBreakdown
): string {
  const receiptNumber = `RCT-HT-${booking.confirmationNumber}-${Date.now()}`;

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Payment Receipt</title></head>
<body style="font-family: Arial; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, ${DOCUMENT_THEME_COLORS.success}, ${DOCUMENT_THEME_COLORS.successDark}); padding: 30px; color: white; text-align: center;">
      <div style="font-size: 48px;">✓</div>
      <h1 style="margin: 0;">PAYMENT RECEIPT</h1>
      <p>Transaction Successful</p>
    </div>
    <div style="padding: 30px;">
      <p><strong>Receipt #:</strong> ${receiptNumber}</p>
      <p><strong>Voucher:</strong> ${booking.voucherNumber}</p>
      <p><strong>Hotel:</strong> ${booking.hotelName}</p>
      <p><strong>Guest:</strong> ${booking.guestName}</p>
      <hr>
      <p><strong>Amount Paid:</strong> <span style="font-size: 24px; color: ${DOCUMENT_THEME_COLORS.success};">${payment.currency} ${payment.paidAmount.toFixed(2)}</span></p>
    </div>
  </div>
</body></html>
  `;
}

function generateRefundNoteHtml(
  refundAmount: number,
  currency: string,
  bookingRef: string,
  customer: DocumentCustomerInfo
): string {
  const refundNumber = `RFN-${bookingRef}-${Date.now()}`;

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Refund Note</title></head>
<body style="font-family: Arial; padding: 20px;">
  <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, ${DOCUMENT_THEME_COLORS.danger}, ${DOCUMENT_THEME_COLORS.dangerDark}); padding: 30px; color: white; text-align: center;">
      <div style="font-size: 48px;">↩</div>
      <h1 style="margin: 0;">REFUND NOTE</h1>
      <p>Refund Processed Successfully</p>
    </div>
    <div style="padding: 30px;">
      <p><strong>Refund #:</strong> ${refundNumber}</p>
      <p><strong>Booking:</strong> ${bookingRef}</p>
      <p><strong>Customer:</strong> ${customer.name}</p>
      <hr>
      <p><strong>Refund Amount:</strong> <span style="font-size: 24px; color: ${DOCUMENT_THEME_COLORS.success};">${currency} ${refundAmount.toFixed(2)}</span></p>
      <p><strong>Status:</strong> <span style="color: ${DOCUMENT_THEME_COLORS.success}; font-weight: bold;">COMPLETED</span></p>
      <p><strong>Refunded to:</strong> Original Payment Method</p>
    </div>
  </div>
</body></html>
  `;
}

function generateDebitNoteHtml(
  amount: number,
  currency: string,
  bookingRef: string,
  customer: DocumentCustomerInfo
): string {
  const debitNoteNumber = `DBT-${bookingRef}-${Date.now()}`;

  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Debit Note</title></head>
<body style="font-family: Arial; padding: 20px;">
  <div style="max-width: 700px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, ${DOCUMENT_THEME_COLORS.warning}, ${DOCUMENT_THEME_COLORS.warningDark}); padding: 30px; color: white; text-align: center;">
      <div style="font-size: 48px;">💳</div>
      <h1 style="margin: 0;">DEBIT NOTE</h1>
      <p>Additional Charges</p>
    </div>
    <div style="padding: 30px;">
      <p><strong>Debit Note #:</strong> ${debitNoteNumber}</p>
      <p><strong>Reference:</strong> ${bookingRef}</p>
      <p><strong>Customer:</strong> ${customer.name}</p>
      <hr>
      <p><strong>Amount Due:</strong> <span style="font-size: 24px; color: ${DOCUMENT_THEME_COLORS.warning};">${currency} ${amount.toFixed(2)}</span></p>
      <p><strong>Due Date:</strong> ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
    </div>
  </div>
</body></html>
  `;
}

// ============================================================================
// DATA FETCHERS - Real-time Database Access
// ============================================================================

async function getBookingData(bookingId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      bookingSegments: true,
      bookingPassengers: true,
      invoices: {
        include: {
          payments: true,
        },
      },
    },
  });

  if (!booking) return null;

  // Fetch or map customer info
  // For now, use data from booking metadata or fallback
  const metadata = (booking.metadata as any) || {};
  const customer: DocumentCustomerInfo = {
    id: booking.userId,
    name: metadata.customerName || booking.customerEmail || 'Guest',
    email: booking.customerEmail || 'guest@example.com',
    phone: booking.customerPhone || 'N/A',
  };

  // Map to Document types
  const isHotel = booking.serviceType.toLowerCase() === 'hotel';

  if (isHotel) {
    const hotelSegment = booking.bookingSegments[0]; // Assume first segment for simple voucher
    const hotelBooking: HotelBooking = {
      id: booking.id,
      hotelName: hotelSegment?.hotelName || 'Hotel',
      hotelAddress: metadata.hotelAddress || 'Address',
      hotelCity: metadata.hotelCity || 'City',
      hotelCountry: metadata.hotelCountry || 'Country',
      checkInDate: hotelSegment?.checkInDate?.toISOString() || '',
      checkOutDate: hotelSegment?.checkOutDate?.toISOString() || '',
      numberOfNights: hotelSegment
        ? Math.ceil(
            (hotelSegment.checkOutDate!.getTime() - hotelSegment.checkInDate!.getTime()) /
              (1000 * 3600 * 24)
          )
        : 0,
      rooms: [
        {
          id: hotelSegment?.id || 'room-1',
          roomType: hotelSegment?.roomType || 'Standard',
          roomName: hotelSegment?.roomType || 'Standard Room',
          adults: metadata.adults || 1,
          children: metadata.children || 0,
          checkIn: hotelSegment?.checkInDate?.toISOString() || '',
          checkOut: hotelSegment?.checkOutDate?.toISOString() || '',
          numberOfNights: hotelSegment
            ? Math.ceil(
                (hotelSegment.checkOutDate!.getTime() - hotelSegment.checkInDate!.getTime()) /
                  (1000 * 3600 * 24)
              )
            : 0,
          ratePerNight: Number(booking.baseAmount) / (metadata.nights || 1),
          totalRate: Number(booking.baseAmount),
        },
      ],
      guestName: customer.name,
      totalGuests: (metadata.adults || 0) + (metadata.children || 0),
      voucherNumber: metadata.voucherNumber || booking.bookingRef,
      confirmationNumber: booking.bookingRef,
    };

    const latestInvoice = booking.invoices[0];
    const latestPayment = latestInvoice?.payments[0];

    const payment: PaymentBreakdown = {
      baseFare: Number(booking.baseAmount),
      taxes: Number(booking.taxAmount),
      fees: Number(booking.markupAmount),
      total: Number(booking.totalAmount),
      currency: booking.currency,
      paymentMethod: latestPayment?.paymentMethod || metadata.paymentMethod || 'Credit Card',
      paidAmount: latestPayment ? Number(latestPayment.amount) : Number(booking.totalAmount),
    };

    return { booking: hotelBooking, customer, payment, isHotel: true };
  } else {
    // Flight mapping
    const flightBooking: FlightBooking = {
      id: booking.id,
      bookingReference: booking.bookingRef,
      pnr: metadata.pnr || booking.bookingRef,
      ticketNumber: metadata.ticketNumber,
      passengers: booking.bookingPassengers.map(p => ({
        id: p.id,
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        type: (p.passengerType as any) || 'adult',
      })),
      segments: booking.bookingSegments.map(s => ({
        id: s.id,
        flightNumber: s.flightNumber || '',
        airline: s.airline || '',
        airlineIata: metadata.airlineCode || '',
        departureAirport: s.departureAirport || '',
        departureAirportCode: metadata.departureCode || s.departureAirport || '',
        departureCity: metadata.departureCity || '',
        departureTime: s.departureTime?.toISOString() || '',
        departureDate: s.departureTime?.toISOString().split('T')[0] || '',
        arrivalAirport: s.arrivalAirport || '',
        arrivalAirportCode: metadata.arrivalCode || s.arrivalAirport || '',
        arrivalCity: metadata.arrivalCity || '',
        arrivalTime: s.arrivalTime?.toISOString() || '',
        duration: metadata.duration,
        cabinClass: metadata.cabinClass || 'Economy',
      })),
      totalAmount: Number(booking.totalAmount),
      baseFare: Number(booking.baseAmount),
      taxes: Number(booking.taxAmount),
      currency: booking.currency,
    };

    const latestInvoice = booking.invoices[0];
    const latestPayment = latestInvoice?.payments[0];

    const payment: PaymentBreakdown = {
      baseFare: Number(booking.baseAmount),
      taxes: Number(booking.taxAmount),
      fees: Number(booking.markupAmount),
      total: Number(booking.totalAmount),
      currency: booking.currency,
      paymentMethod: latestPayment?.paymentMethod || metadata.paymentMethod || 'Credit Card',
      paidAmount: latestPayment ? Number(latestPayment.amount) : Number(booking.totalAmount),
    };

    return { booking: flightBooking, customer, payment, isHotel: false };
  }
}

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * @swagger
 * /api/documents/{bookingId}:
 *   get:
 *     summary: Get list of available documents for a booking
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking ID
 *       - in: query
 *         name: bookingType
 *         schema:
 *           type: string
 *         description: Type of booking (e.g., hotel)
 *     responses:
 *       200:
 *         description: List of available documents
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     documents:
 *                       type: array
 *                       items:
 *                         type: object
 *       500:
 *         description: Server error
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
router.get('/:bookingId', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { bookingType } = req.query;
    const isHotel = bookingType === 'hotel';

    // In production, fetch from database based on booking status
    const documents = isHotel
      ? [
          {
            id: `doc-itin-${bookingId}`,
            type: 'itinerary',
            name: 'Hotel Itinerary',
            format: 'PDF',
            url: `/api/documents/${bookingId}/download/itinerary?bookingType=hotel`,
            available: true,
          },
          {
            id: `doc-inv-${bookingId}`,
            type: 'invoice',
            name: 'Hotel Invoice',
            format: 'PDF',
            url: `/api/documents/${bookingId}/download/invoice?bookingType=hotel`,
            available: true,
          },
          {
            id: `doc-vch-${bookingId}`,
            type: 'voucher',
            name: 'Hotel Voucher',
            format: 'PDF',
            url: `/api/documents/${bookingId}/download/voucher?bookingType=hotel`,
            available: true,
          },
          {
            id: `doc-rct-${bookingId}`,
            type: 'receipt',
            name: 'Payment Receipt',
            format: 'PDF',
            url: `/api/documents/${bookingId}/download/receipt?bookingType=hotel`,
            available: true,
          },
          {
            id: `doc-ref-${bookingId}`,
            type: 'refund',
            name: 'Refund Note',
            format: 'PDF',
            url: `/api/documents/${bookingId}/download/refund?bookingType=hotel`,
            available: true,
          },
          {
            id: `doc-dbt-${bookingId}`,
            type: 'debit',
            name: 'Debit Note',
            format: 'PDF',
            url: `/api/documents/${bookingId}/download/debit?bookingType=hotel`,
            available: true,
          },
        ]
      : [
          {
            id: `doc-itin-${bookingId}`,
            type: 'itinerary',
            name: 'Flight Itinerary',
            format: 'PDF',
            url: `/api/documents/${bookingId}/download/itinerary`,
            available: true,
          },
          {
            id: `doc-inv-${bookingId}`,
            type: 'invoice',
            name: 'Commercial Invoice',
            format: 'PDF',
            url: `/api/documents/${bookingId}/download/invoice`,
            available: true,
          },
          {
            id: `doc-tkt-${bookingId}`,
            type: 'ticket',
            name: 'E-Ticket',
            format: 'PDF',
            url: `/api/documents/${bookingId}/download/ticket`,
            available: false,
          },
          {
            id: `doc-rct-${bookingId}`,
            type: 'receipt',
            name: 'Payment Receipt',
            format: 'PDF',
            url: `/api/documents/${bookingId}/download/receipt`,
            available: false,
          },
          {
            id: `doc-ref-${bookingId}`,
            type: 'refund',
            name: 'Refund Note',
            format: 'PDF',
            url: `/api/documents/${bookingId}/download/refund`,
            available: false,
          },
          {
            id: `doc-dbt-${bookingId}`,
            type: 'debit',
            name: 'Debit Note',
            format: 'PDF',
            url: `/api/documents/${bookingId}/download/debit`,
            available: false,
          },
        ];

    res.json({ success: true, data: { documents } });
  } catch (error: any) {
    console.error('[Documents] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/documents/{bookingId}/download/{documentType}:
 *   get:
 *     summary: Download/generate a specific document
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking ID
 *       - in: path
 *         name: documentType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [itinerary, invoice, ticket, voucher, receipt, refund, debit]
 *         description: The type of document to download
 *       - in: query
 *         name: bookingType
 *         schema:
 *           type: string
 *         description: Type of booking (e.g., hotel)
 *     responses:
 *       200:
 *         description: Generated document content
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingId:
 *                       type: string
 *                     documentType:
 *                       type: string
 *                     documentName:
 *                       type: string
 *                     content:
 *                       type: string
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *                 error:
 *                   type: string
 *       400:
 *         description: Invalid document type
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
 *         description: Booking not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
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
router.get('/:bookingId/download/:documentType', async (req: Request, res: Response) => {
  try {
    const { bookingId, documentType } = req.params as {
      bookingId: string;
      documentType: string;
    };
    const { bookingType } = req.query;
    const isHotel = bookingType === 'hotel';

    console.log(
      `[Documents] Generating ${documentType} for booking ${bookingId}, isHotel: ${isHotel}`
    );

    // Get real data from database
    const result = await getBookingData(bookingId);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
      });
    }

    const { booking, customer, payment } = result;

    let htmlContent = '';
    let documentName = '';

    switch (documentType) {
      case 'itinerary':
        documentName = isHotel ? 'Hotel_Itinerary' : 'Flight_Itinerary';
        htmlContent = isHotel
          ? generateHotelItineraryHtml(booking as HotelBooking, customer)
          : generateFlightItineraryHtml(booking as FlightBooking, customer);
        break;
      case 'invoice':
        documentName = isHotel ? 'Hotel_Invoice' : 'Flight_Invoice';
        htmlContent = isHotel
          ? generateHotelInvoiceHtml(booking as HotelBooking, customer, payment)
          : generateFlightInvoiceHtml(booking as FlightBooking, customer, payment);
        break;
      case 'ticket':
        documentName = 'E-Ticket';
        htmlContent = generateFlightETicketHtml(booking as FlightBooking, customer);
        break;
      case 'voucher':
        documentName = 'Hotel_Voucher';
        htmlContent = generateHotelVoucherHtml(booking as HotelBooking, customer);
        break;
      case 'receipt':
        documentName = 'Payment_Receipt';
        htmlContent = isHotel
          ? generateHotelReceiptHtml(booking as HotelBooking, customer, payment)
          : generateFlightReceiptHtml(booking as FlightBooking, customer, payment);
        break;
      case 'refund':
        documentName = 'Refund_Note';
        htmlContent = generateRefundNoteHtml(
          payment.paidAmount,
          payment.currency,
          bookingId,
          customer
        );
        break;
      case 'debit':
        documentName = 'Debit_Note';
        htmlContent = generateDebitNoteHtml(150.0, payment.currency, bookingId, customer);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Invalid document type: ${documentType}`,
        });
    }

    // Return HTML content
    res.setHeader('Content-Type', 'text/html');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${documentName}_${bookingId}.html"`
    );

    res.json({
      success: true,
      data: {
        bookingId,
        documentType,
        documentName,
        content: htmlContent,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Documents] Download error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/documents/{bookingId}/email:
 *   post:
 *     summary: Email a document to a recipient
 *     tags: [Documents]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - documentType
 *               - recipientEmail
 *             properties:
 *               documentType:
 *                 type: string
 *                 description: The type of document to email
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *                 description: The recipient email address
 *     responses:
 *       200:
 *         description: Document email queued successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingId:
 *                       type: string
 *                     documentType:
 *                       type: string
 *                     recipientEmail:
 *                       type: string
 *                     status:
 *                       type: string
 *                     sentAt:
 *                       type: string
 *                       format: date-time
 *                 error:
 *                   type: string
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
 *       500:
 *         description: Server error
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
router.post('/:bookingId/email', async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { documentType, recipientEmail } = req.body;

    if (!documentType || !recipientEmail) {
      return res.status(400).json({
        success: false,
        error: 'documentType and recipientEmail are required',
      });
    }

    // In production: queue email with generated PDF attachment
    console.log(
      `[Documents] Emailing ${documentType} for booking ${bookingId} to ${recipientEmail}`
    );

    res.json({
      success: true,
      data: {
        bookingId,
        documentType,
        recipientEmail,
        status: 'queued',
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Documents] Email error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
