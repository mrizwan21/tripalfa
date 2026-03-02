import express, { Request, Response, Router } from "express";

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
  type: "adult" | "child" | "infant";
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
  name: "TripAlfa",
  logo: "https://tripalfa.com/logo.png",
  address: "123 Travel Street, Dubai, UAE",
  phone: "+971 4 123 4567",
  email: "support@tripalfa.com",
  website: "https://tripalfa.com",
  taxId: "TAX123456789",
  registrationNumber: "DUB2024001",
};

const DOCUMENT_THEME_COLORS = {
  textPrimary: "rgb(51, 51, 51)",
  textSecondary: "rgb(102, 102, 102)",
  brandPrimary: "rgb(0, 102, 204)",
  brandPrimaryDark: "rgb(0, 82, 163)",
  surfaceMuted: "rgb(249, 249, 249)",
  surfaceInfo: "rgb(240, 248, 255)",
  success: "rgb(40, 167, 69)",
  successDark: "rgb(32, 201, 151)",
  danger: "rgb(220, 53, 69)",
  dangerDark: "rgb(200, 35, 51)",
  warning: "rgb(253, 126, 20)",
  warningDark: "rgb(230, 126, 34)",
} as const;

// ============================================================================
// HELPER FUNCTIONS - Generate Document HTML
// ============================================================================

function generateFlightItineraryHtml(
  booking: FlightBooking,
  customer: DocumentCustomerInfo,
): string {
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const formatTime = (time: string) =>
    new Date(time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const segmentsHtml = booking.segments
    .map(
      (segment, index) => `
    <div style="margin-bottom: 30px; padding: 20px; background-color: ${DOCUMENT_THEME_COLORS.surfaceMuted}; border-radius: 8px;">
      <h3 style="margin: 0 0 15px 0; color: ${DOCUMENT_THEME_COLORS.textPrimary};">Flight ${index + 1}: ${segment.airline} ${segment.flightNumber}</h3>
      <table style="width: 100%;">
        <tr>
          <td style="padding: 10px;">
            <div style="font-size: 24px; font-weight: bold; color: ${DOCUMENT_THEME_COLORS.brandPrimary};">${formatTime(segment.departureTime)}</div>
            <div>${segment.departureCity} (${segment.departureAirportCode})</div>
            <div style="font-size: 12px; color: ${DOCUMENT_THEME_COLORS.textSecondary};">${formatDate(segment.departureDate)}${segment.departureTerminal ? ` - Terminal ${segment.departureTerminal}` : ""}</div>
          </td>
          <td style="padding: 10px; text-align: center;">✈ ${segment.duration || ""}</td>
          <td style="padding: 10px; text-align: right;">
            <div style="font-size: 24px; font-weight: bold; color: ${DOCUMENT_THEME_COLORS.brandPrimary};">${formatTime(segment.arrivalTime)}</div>
            <div>${segment.arrivalCity} (${segment.arrivalAirportCode})</div>
          </td>
        </tr>
      </table>
    </div>
  `,
    )
    .join("");

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

function generateHotelItineraryHtml(
  booking: HotelBooking,
  customer: DocumentCustomerInfo,
): string {
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const totalAmount = booking.rooms.reduce(
    (sum, room) => sum + room.totalRate,
    0,
  );

  const roomsHtml = booking.rooms
    .map(
      (room) => `
    <div style="padding: 15px; background: ${DOCUMENT_THEME_COLORS.surfaceMuted}; border-radius: 8px; margin-bottom: 15px;">
      <h4>${room.roomName}</h4>
      <p>${room.adults} Adults, ${room.children} Children | ${room.numberOfNights} Nights | $${room.ratePerNight}/night</p>
      <p><strong>Total: $${room.totalRate.toFixed(2)}</strong></p>
      ${room.inclusions?.length ? `<p>Inclusions: ${room.inclusions.join(", ")}</p>` : ""}
    </div>
  `,
    )
    .join("");

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

function generateFlightETicketHtml(
  booking: FlightBooking,
  customer: DocumentCustomerInfo,
): string {
  return `
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>E-Ticket</title></head>
<body style="font-family: Arial; padding: 20px;">
  <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, ${DOCUMENT_THEME_COLORS.brandPrimary}, ${DOCUMENT_THEME_COLORS.brandPrimaryDark}); padding: 30px; color: white; text-align: center;">
      <h1 style="margin: 0;">🎫 E-TICKET</h1>
      <p>Booking: <strong>${booking.bookingReference}</strong></p>
      <p>Ticket: <strong>${booking.ticketNumber || "N/A"}</strong></p>
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
      `,
        )
        .join("")}
    </div>
  </div>
</body></html>
  `;
}

function generateHotelVoucherHtml(
  booking: HotelBooking,
  customer: DocumentCustomerInfo,
): string {
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const totalAmount = booking.rooms.reduce(
    (sum, room) => sum + room.totalRate,
    0,
  );

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
      ${booking.hotelPhone ? `<p>Phone: ${booking.hotelPhone}</p>` : ""}
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
  payment: PaymentBreakdown,
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
  payment: PaymentBreakdown,
): string {
  const invoiceNumber = `INV-HT-${booking.confirmationNumber}-${Date.now()}`;
  const roomsTotal = booking.rooms.reduce(
    (sum, room) => sum + room.totalRate,
    0,
  );

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
  payment: PaymentBreakdown,
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
  payment: PaymentBreakdown,
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
  customer: DocumentCustomerInfo,
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
  customer: DocumentCustomerInfo,
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
// SAMPLE DATA GENERATORS
// ============================================================================

function getSampleFlightData(bookingId: string) {
  const customer: DocumentCustomerInfo = {
    id: "cust-001",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+971 50 123 4567",
  };

  const booking: FlightBooking = {
    id: bookingId,
    bookingReference: bookingId,
    pnr: "ABC123",
    ticketNumber: "176-2345678901",
    passengers: [
      { id: "p1", firstName: "John", lastName: "Doe", type: "adult" },
    ],
    segments: [
      {
        id: "s1",
        flightNumber: "EK2",
        airline: "Emirates",
        airlineIata: "EK",
        departureAirport: "Dubai International",
        departureAirportCode: "DXB",
        departureCity: "Dubai",
        departureTerminal: "3",
        departureTime: "2026-03-15T08:30:00",
        departureDate: "2026-03-15",
        arrivalAirport: "London Heathrow",
        arrivalAirportCode: "LHR",
        arrivalCity: "London",
        arrivalTerminal: "3",
        arrivalTime: "2026-03-15T12:45:00",
        duration: "7h 15m",
        cabinClass: "Economy",
      },
    ],
    totalAmount: 1250.0,
    baseFare: 1000.0,
    taxes: 250.0,
    currency: "USD",
  };

  const payment: PaymentBreakdown = {
    baseFare: 1000.0,
    taxes: 250.0,
    fees: 0,
    total: 1250.0,
    currency: "USD",
    paymentMethod: "credit_card",
    paidAmount: 1250.0,
  };

  return { booking, customer, payment };
}

function getSampleHotelData(bookingId: string) {
  const customer: DocumentCustomerInfo = {
    id: "cust-002",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    phone: "+971 50 987 6543",
  };

  const booking: HotelBooking = {
    id: bookingId,
    hotelName: "Grand Plaza Hotel",
    hotelAddress: "Sheikh Zayed Road",
    hotelCity: "Dubai",
    hotelCountry: "UAE",
    hotelPhone: "+971 4 123 4567",
    checkInDate: "2026-03-15",
    checkOutDate: "2026-03-18",
    numberOfNights: 3,
    rooms: [
      {
        id: "r1",
        roomType: "Deluxe King",
        roomName: "Deluxe King Room",
        adults: 2,
        children: 0,
        checkIn: "2026-03-15",
        checkOut: "2026-03-18",
        numberOfNights: 3,
        ratePerNight: 200.0,
        totalRate: 600.0,
        inclusions: ["Breakfast", "WiFi"],
      },
    ],
    guestName: "Jane Smith",
    totalGuests: 2,
    voucherNumber: `VCH-${bookingId}`,
    confirmationNumber: bookingId,
  };

  const payment: PaymentBreakdown = {
    baseFare: 600.0,
    taxes: 60.0,
    fees: 0,
    total: 660.0,
    currency: "USD",
    paymentMethod: "credit_card",
    paidAmount: 660.0,
  };

  return { booking, customer, payment };
}

// ============================================================================
// API ROUTES
// ============================================================================

/**
 * GET /api/documents/:bookingId
 * Get list of available documents for a booking
 */
router.get("/:bookingId", async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { bookingType } = req.query;
    const isHotel = bookingType === "hotel";

    // In production, fetch from database based on booking status
    const documents = isHotel
      ? [
          {
            id: `doc-itin-${bookingId}`,
            type: "itinerary",
            name: "Hotel Itinerary",
            format: "PDF",
            url: `/api/documents/${bookingId}/download/itinerary?bookingType=hotel`,
            available: true,
          },
          {
            id: `doc-inv-${bookingId}`,
            type: "invoice",
            name: "Hotel Invoice",
            format: "PDF",
            url: `/api/documents/${bookingId}/download/invoice?bookingType=hotel`,
            available: true,
          },
          {
            id: `doc-vch-${bookingId}`,
            type: "voucher",
            name: "Hotel Voucher",
            format: "PDF",
            url: `/api/documents/${bookingId}/download/voucher?bookingType=hotel`,
            available: true,
          },
          {
            id: `doc-rct-${bookingId}`,
            type: "receipt",
            name: "Payment Receipt",
            format: "PDF",
            url: `/api/documents/${bookingId}/download/receipt?bookingType=hotel`,
            available: true,
          },
          {
            id: `doc-ref-${bookingId}`,
            type: "refund",
            name: "Refund Note",
            format: "PDF",
            url: `/api/documents/${bookingId}/download/refund?bookingType=hotel`,
            available: true,
          },
          {
            id: `doc-dbt-${bookingId}`,
            type: "debit",
            name: "Debit Note",
            format: "PDF",
            url: `/api/documents/${bookingId}/download/debit?bookingType=hotel`,
            available: true,
          },
        ]
      : [
          {
            id: `doc-itin-${bookingId}`,
            type: "itinerary",
            name: "Flight Itinerary",
            format: "PDF",
            url: `/api/documents/${bookingId}/download/itinerary`,
            available: true,
          },
          {
            id: `doc-inv-${bookingId}`,
            type: "invoice",
            name: "Commercial Invoice",
            format: "PDF",
            url: `/api/documents/${bookingId}/download/invoice`,
            available: true,
          },
          {
            id: `doc-tkt-${bookingId}`,
            type: "ticket",
            name: "E-Ticket",
            format: "PDF",
            url: `/api/documents/${bookingId}/download/ticket`,
            available: false,
          },
          {
            id: `doc-rct-${bookingId}`,
            type: "receipt",
            name: "Payment Receipt",
            format: "PDF",
            url: `/api/documents/${bookingId}/download/receipt`,
            available: false,
          },
          {
            id: `doc-ref-${bookingId}`,
            type: "refund",
            name: "Refund Note",
            format: "PDF",
            url: `/api/documents/${bookingId}/download/refund`,
            available: false,
          },
          {
            id: `doc-dbt-${bookingId}`,
            type: "debit",
            name: "Debit Note",
            format: "PDF",
            url: `/api/documents/${bookingId}/download/debit`,
            available: false,
          },
        ];

    res.json({ success: true, data: { documents } });
  } catch (error: any) {
    console.error("[Documents] Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/documents/:bookingId/download/:documentType
 * Download/generate a specific document
 */
router.get(
  "/:bookingId/download/:documentType",
  async (req: Request, res: Response) => {
    try {
      const { bookingId, documentType } = req.params as {
        bookingId: string;
        documentType: string;
      };
      const { bookingType } = req.query;
      const isHotel = bookingType === "hotel";

      console.log(
        `[Documents] Generating ${documentType} for booking ${bookingId}, isHotel: ${isHotel}`,
      );

      // Get sample data (in production, fetch from database)
      const { booking, customer, payment } = isHotel
        ? getSampleHotelData(bookingId)
        : getSampleFlightData(bookingId);

      let htmlContent = "";
      let documentName = "";

      switch (documentType) {
        case "itinerary":
          documentName = isHotel ? "Hotel_Itinerary" : "Flight_Itinerary";
          htmlContent = isHotel
            ? generateHotelItineraryHtml(booking as HotelBooking, customer)
            : generateFlightItineraryHtml(booking as FlightBooking, customer);
          break;
        case "invoice":
          documentName = isHotel ? "Hotel_Invoice" : "Flight_Invoice";
          htmlContent = isHotel
            ? generateHotelInvoiceHtml(
                booking as HotelBooking,
                customer,
                payment,
              )
            : generateFlightInvoiceHtml(
                booking as FlightBooking,
                customer,
                payment,
              );
          break;
        case "ticket":
          documentName = "E-Ticket";
          htmlContent = generateFlightETicketHtml(
            booking as FlightBooking,
            customer,
          );
          break;
        case "voucher":
          documentName = "Hotel_Voucher";
          htmlContent = generateHotelVoucherHtml(
            booking as HotelBooking,
            customer,
          );
          break;
        case "receipt":
          documentName = "Payment_Receipt";
          htmlContent = isHotel
            ? generateHotelReceiptHtml(
                booking as HotelBooking,
                customer,
                payment,
              )
            : generateFlightReceiptHtml(
                booking as FlightBooking,
                customer,
                payment,
              );
          break;
        case "refund":
          documentName = "Refund_Note";
          htmlContent = generateRefundNoteHtml(
            payment.paidAmount,
            payment.currency,
            bookingId,
            customer,
          );
          break;
        case "debit":
          documentName = "Debit_Note";
          htmlContent = generateDebitNoteHtml(
            150.0,
            payment.currency,
            bookingId,
            customer,
          );
          break;
        default:
          return res.status(400).json({
            success: false,
            error: `Invalid document type: ${documentType}`,
          });
      }

      // Return HTML content
      res.setHeader("Content-Type", "text/html");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${documentName}_${bookingId}.html"`,
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
      console.error("[Documents] Download error:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

/**
 * POST /api/documents/:bookingId/email
 * Email a document to a recipient
 */
router.post("/:bookingId/email", async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params;
    const { documentType, recipientEmail } = req.body;

    if (!documentType || !recipientEmail) {
      return res.status(400).json({
        success: false,
        error: "documentType and recipientEmail are required",
      });
    }

    // In production: queue email with generated PDF attachment
    console.log(
      `[Documents] Emailing ${documentType} for booking ${bookingId} to ${recipientEmail}`,
    );

    res.json({
      success: true,
      data: {
        bookingId,
        documentType,
        recipientEmail,
        status: "queued",
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Documents] Email error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
