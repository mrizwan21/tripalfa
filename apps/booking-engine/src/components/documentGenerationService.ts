/**
 * Document Generation Service
 *
 * Handles generation of all document templates:
 * - Flight & Hotel Itinerary
 * - E-ticket for flights
 * - Hotel Voucher
 * - Hotel Invoice
 * - Flight Invoice
 * - Flight Receipt
 * - Hotel Receipt
 * - Refund Note
 * - Debit Note
 */

import {
  Booking,
  Passenger,
  Pricing,
  Payment,
  Refund,
  Amendment,
} from "./enhancedBooking";
import { COLORS } from "../lib/constants/theme";

// ============================================================================
// INTERFACES - Dynamic Data Types for All Documents
// ============================================================================

export interface DocumentCompanyInfo {
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId?: string;
  registrationNumber?: string;
}

export interface DocumentCustomerInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  nationality?: string;
  passportNumber?: string;
  companyName?: string;
  companyRegistrationNumber?: string;
  taxId?: string;
}

export interface DocumentPassenger {
  id: string;
  firstName: string;
  lastName: string;
  type: "adult" | "child" | "infant";
  dateOfBirth?: string;
  nationality?: string;
  passportNumber?: string;
  passportExpiry?: string;
}

export interface FlightSegment {
  id: string;
  flightNumber: string;
  airline: string;
  airlineIata: string;
  aircraftType?: string;

  // Departure
  departureAirport: string;
  departureAirportCode: string;
  departureCity: string;
  departureTerminal?: string;
  departureTime: string;
  departureDate: string;

  // Arrival
  arrivalAirport: string;
  arrivalAirportCode: string;
  arrivalCity: string;
  arrivalTerminal?: string;
  arrivalTime: string;

  // Additional info
  duration?: string;
  cabinClass: string;
  seatNumber?: string;
  mealType?: string;
  baggagAllowance?: string;
}

export interface HotelRoom {
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

export interface HotelBooking {
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
  specialRequests?: string;
}

export interface FlightBooking {
  id: string;
  bookingReference: string;
  pnr?: string;
  ticketNumber?: string;
  airlineConfirmationNumber?: string;
  passengers: DocumentPassenger[];
  segments: FlightSegment[];
  returnSegments?: FlightSegment[];
  totalAmount: number;
  baseFare: number;
  taxes: number;
  currency: string;
}

export interface PaymentBreakdown {
  baseFare: number;
  taxes: number;
  fees: number;
  discount?: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paidAmount: number;
  pendingAmount?: number;
  walletAmount?: number;
  cardAmount?: number;
  creditAmount?: number;
}

export interface RefundDetails {
  id: string;
  refundNumber: string;
  amount: number;
  currency: string;
  reason: string;
  type: "full" | "partial";
  status: "pending" | "processing" | "completed" | "failed";
  requestedAt: string;
  processedAt?: string;
  refundedTo: "original_payment" | "wallet" | "voucher";
  originalPaymentAmount: number;
  cancellationFees?: number;
  taxRefund?: number;
}

export interface DebitNoteDetails {
  id: string;
  debitNoteNumber: string;
  referenceNumber: string;
  reason: string;
  description: string;
  amount: number;
  currency: string;
  issuedAt: string;
  dueDate: string;
  originalBookingAmount: number;
  adjustmentAmount: number;
  adjustedAmount: number;
}

// ============================================================================
// COMPANY INFO (Default - can be configured)
// ============================================================================

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

// ============================================================================
// TEMPLATE GENERATOR - FLIGHT ITINERARY
// ============================================================================

export function generateFlightItinerary(
  booking: FlightBooking,
  customer: DocumentCustomerInfo,
  companyInfo: DocumentCompanyInfo = DEFAULT_COMPANY_INFO,
): string {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const passengersHtml = booking.passengers
    .map(
      (p) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};">
        ${p.firstName} ${p.lastName}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]}; text-transform: capitalize;">
        ${p.type}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};">
        ${p.passportNumber || "-"}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};">
        ${p.nationality || "-"}
      </td>
    </tr>
  `,
    )
    .join("");

  const segmentsHtml = booking.segments
    .map(
      (segment, index) => `
    <div style="margin-bottom: 30px; padding: 20px; background-color: ${COLORS.slate[50]}; border-radius: 8px;">
      <h3 style="margin: 0 0 15px 0; color: ${COLORS.slate[700]}; font-size: 18px;">
        Flight ${index + 1}: ${segment.airline} ${segment.flightNumber}
      </h3>
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <div>
          <span style="background-color: ${COLORS.primary}; color: ${COLORS.white}; padding: 4px 12px; border-radius: 4px; font-size: 12px;">
            ${segment.cabinClass}
          </span>
        </div>
        ${
          segment.duration
            ? `
          <div style="text-align: right;">
            <span style="color: ${COLORS.slate[500]}; font-size: 14px;">Duration: ${segment.duration}</span>
          </div>
        `
            : ""
        }
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px; vertical-align: top;">
            <div style="font-size: 24px; font-weight: bold; color: ${COLORS.primary};">
              ${formatTime(segment.departureTime)}
            </div>
            <div style="font-size: 16px; font-weight: 600; color: ${COLORS.slate[700]};">
              ${segment.departureCity} (${segment.departureAirportCode})
            </div>
            <div style="font-size: 14px; color: ${COLORS.slate[500]};">
              ${formatDate(segment.departureDate)}
              ${segment.departureTerminal ? `<br>Terminal: ${segment.departureTerminal}` : ""}
            </div>
          </td>
          <td style="padding: 10px; text-align: center; vertical-align: middle;">
            <div style="color: ${COLORS.slate[400]}; font-size: 24px;">✈</div>
            <div style="color: ${COLORS.slate[400]}; font-size: 12px;">${segment.duration || ""}</div>
          </td>
          <td style="padding: 10px; vertical-align: top; text-align: right;">
            <div style="font-size: 24px; font-weight: bold; color: ${COLORS.primary};">
              ${formatTime(segment.arrivalTime)}
            </div>
            <div style="font-size: 16px; font-weight: 600; color: ${COLORS.slate[700]};">
              ${segment.arrivalCity} (${segment.arrivalAirportCode})
            </div>
            <div style="font-size: 14px; color: ${COLORS.slate[500]};">
              ${formatDate(segment.departureDate)}
              ${segment.arrivalTerminal ? `<br>Terminal: ${segment.arrivalTerminal}` : ""}
            </div>
          </td>
        </tr>
      </table>

      ${
        segment.baggagAllowance
          ? `
        <div style="margin-top: 15px; padding: 10px; background-color: rgba(59, 130, 246, 0.1); border-radius: 4px;">
          <strong>Baggage:</strong> ${segment.baggagAllowance}
        </div>
      `
          : ""
      }
      
      ${
        segment.mealType
          ? `
        <div style="margin-top: 10px; padding: 10px; background-color: rgba(59, 130, 246, 0.1); border-radius: 4px;">
          <strong>Meal:</strong> ${segment.mealType}
        </div>
      `
          : ""
      }
    </div>
  `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flight Itinerary - ${booking.bookingReference}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: ${COLORS.slate[100]}; margin: 0; padding: 20px;">
  <div style="max-width: 800px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryHover} 100%); padding: 30px 20px; text-align: center; color: ${COLORS.white};">
      <h1 style="margin: 0; font-size: 28px; font-weight: 600;">✈ Flight Itinerary</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Booking Reference: <strong>${booking.bookingReference}</strong></p>
    </div>

    <!-- Body Content -->
    <div style="padding: 30px 20px;">
      
      <!-- Company Info -->
      <div style="margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid ${COLORS.slate[200]};">
        <p style="margin: 0; font-size: 14px; color: ${COLORS.slate[500]};">
          <strong>Issued by:</strong> ${companyInfo.name}<br>
          ${companyInfo.address} | ${companyInfo.phone}<br>
          ${companyInfo.email}
        </p>
      </div>

      <!-- Customer Info -->
      <div style="margin-bottom: 25px; padding: 15px; background-color: ${COLORS.slate[50]}; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: ${COLORS.slate[700]};">Customer Information</h3>
        <p style="margin: 5px 0; font-size: 14px; color: ${COLORS.slate[500]};">
          <strong>Name:</strong> ${customer.name}<br>
          <strong>Email:</strong> ${customer.email}<br>
          <strong>Phone:</strong> ${customer.phone}
          ${customer.companyName ? `<br><strong>Company:</strong> ${customer.companyName}` : ""}
        </p>
      </div>

      <!-- Booking Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Booking Details
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};">
              <strong>Booking Reference</strong>
            </td>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};">${booking.bookingReference}</td>
          </tr>
          ${
            booking.pnr
              ? `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};"><strong>PNR</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};">${booking.pnr}</td>
          </tr>
          `
              : ""
          }
          ${
            booking.ticketNumber
              ? `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};"><strong>Ticket Number</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};">${booking.ticketNumber}</td>
          </tr>
          `
              : ""
          }
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};"><strong>Total Amount</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};">${booking.currency} ${booking.totalAmount.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Passengers -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Passengers
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: ${COLORS.slate[50]};">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid ${COLORS.primary};">Name</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid ${COLORS.primary};">Type</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid ${COLORS.primary};">Passport</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid ${COLORS.primary};">Nationality</th>
            </tr>
          </thead>
          <tbody>
            ${passengersHtml}
          </tbody>
        </table>
      </div>

      <!-- Flight Segments -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Flight Details
        </h3>
        ${segmentsHtml}
      </div>

      <!-- Fare Summary -->
      <div style="margin-bottom: 25px; padding: 15px; background-color: rgba(59, 130, 246, 0.1); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.25);">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: ${COLORS.primary};">Fare Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[300]};">Base Fare</td>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[300]}; text-align: right;">${booking.currency} ${booking.baseFare.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[300]};">Taxes & Fees</td>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[300]}; text-align: right;">${booking.currency} ${booking.taxes.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; font-weight: bold; font-size: 16px;">Total</td>
            <td style="padding: 10px 8px; font-weight: bold; font-size: 16px; text-align: right; color: ${COLORS.primary};">${booking.currency} ${booking.totalAmount.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Important Information -->
      <div style="background-color: rgba(245, 158, 11, 0.15); border-left: 4px solid ${COLORS.warning}; padding: 15px; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: ${COLORS.warning};">Important Information</h3>
        <ul style="margin: 0; padding-left: 20px; color: ${COLORS.slate[500]}; font-size: 13px;">
          <li style="margin: 5px 0;">Please arrive at the airport at least 3 hours before international flights</li>
          <li style="margin: 5px 0;">Have a valid passport that doesn't expire within 6 months of travel</li>
          <li style="margin: 5px 0;">Check in online to save time at the airport</li>
          <li style="margin: 5px 0;">Contact the airline directly for seat selection and special assistance</li>
        </ul>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: ${COLORS.slate[50]}; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.slate[200]}; font-size: 12px; color: ${COLORS.slate[400]};">
      <p style="margin: 0 0 10px 0;">
        <strong>${companyInfo.name}</strong><br>
        ${companyInfo.website}
      </p>
      <p style="margin: 0;">© ${new Date().getFullYear()} ${companyInfo.name}. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
  `;
}

// ============================================================================
// TEMPLATE GENERATOR - HOTEL ITINERARY
// ============================================================================

export function generateHotelItinerary(
  booking: HotelBooking,
  customer: DocumentCustomerInfo,
  companyInfo: DocumentCompanyInfo = DEFAULT_COMPANY_INFO,
): string {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const roomsHtml = booking.rooms
    .map(
      (room) => `
    <div style="padding: 15px; background-color: ${COLORS.slate[50]}; border-radius: 8px; margin-bottom: 15px;">
      <h4 style="margin: 0 0 10px 0; color: ${COLORS.slate[700]}; font-size: 16px;">${room.roomName}</h4>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;"><strong>Room Type:</strong></td>
          <td style="padding: 5px 0; color: ${COLORS.slate[700]}; font-size: 14px; text-align: right;">${room.roomType}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;"><strong>Guests:</strong></td>
          <td style="padding: 5px 0; color: ${COLORS.slate[700]}; font-size: 14px; text-align: right;">${room.adults} Adult${room.adults > 1 ? "s" : ""}${room.children > 0 ? `, ${room.children} Child${room.children > 1 ? "ren" : ""}` : ""}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;"><strong>Check-in:</strong></td>
          <td style="padding: 5px 0; color: ${COLORS.slate[700]}; font-size: 14px; text-align: right;">${formatDate(room.checkIn)}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;"><strong>Check-out:</strong></td>
          <td style="padding: 5px 0; color: ${COLORS.slate[700]}; font-size: 14px; text-align: right;">${formatDate(room.checkOut)}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;"><strong>Nights:</strong></td>
          <td style="padding: 5px 0; color: ${COLORS.slate[700]}; font-size: 14px; text-align: right;">${room.numberOfNights}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;"><strong>Rate:</strong></td>
          <td style="padding: 5px 0; color: ${COLORS.slate[700]}; font-size: 14px; text-align: right;">$${room.ratePerNight.toFixed(2)}/night</td>
        </tr>
        <tr>
          <td style="padding: 10px 0 5px 0; font-weight: bold; color: ${COLORS.slate[700]}; font-size: 14px;"><strong>Total:</strong></td>
          <td style="padding: 10px 0 5px 0; font-weight: bold; color: ${COLORS.primary}; font-size: 16px; text-align: right;">$${room.totalRate.toFixed(2)}</td>
        </tr>
      </table>
      ${
        room.inclusions && room.inclusions.length > 0
          ? `
        <div style="margin-top: 10px; padding: 10px; background-color: rgba(59, 130, 246, 0.1); border-radius: 4px;">
          <strong style="font-size: 12px; color: ${COLORS.primary};">Inclusions:</strong>
          <ul style="margin: 5px 0 0 0; padding-left: 20px; font-size: 13px; color: ${COLORS.slate[500]};">
            ${room.inclusions.map((i) => `<li>${i}</li>`).join("")}
          </ul>
        </div>
      `
          : ""
      }
    </div>
  `,
    )
    .join("");

  const totalAmount = booking.rooms.reduce(
    (sum, room) => sum + room.totalRate,
    0,
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hotel Itinerary - ${booking.confirmationNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: ${COLORS.slate[100]}; margin: 0; padding: 20px;">
  <div style="max-width: 800px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryHover} 100%); padding: 30px 20px; text-align: center; color: ${COLORS.white};">
      <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🏨 Hotel Itinerary</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Confirmation Number: <strong>${booking.confirmationNumber}</strong></p>
    </div>

    <!-- Body Content -->
    <div style="padding: 30px 20px;">
      
      <!-- Company Info -->
      <div style="margin-bottom: 25px; padding-bottom: 15px; border-bottom: 1px solid ${COLORS.slate[200]};">
        <p style="margin: 0; font-size: 14px; color: ${COLORS.slate[500]};">
          <strong>Issued by:</strong> ${companyInfo.name}<br>
          ${companyInfo.address} | ${companyInfo.phone}<br>
          ${companyInfo.email}
        </p>
      </div>

      <!-- Customer Info -->
      <div style="margin-bottom: 25px; padding: 15px; background-color: ${COLORS.slate[50]}; border-radius: 8px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: ${COLORS.slate[700]};">Guest Information</h3>
        <p style="margin: 5px 0; font-size: 14px; color: ${COLORS.slate[500]};">
          <strong>Name:</strong> ${booking.guestName}<br>
          <strong>Email:</strong> ${customer.email}<br>
          <strong>Phone:</strong> ${customer.phone}
        </p>
      </div>

      <!-- Hotel Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Hotel Details
        </h3>
        <div style="padding: 20px; background-color: ${COLORS.slate[50]}; border-radius: 8px;">
          <h2 style="margin: 0 0 10px 0; font-size: 24px; color: ${COLORS.slate[700]};">${booking.hotelName}</h2>
          <p style="margin: 5px 0; font-size: 14px; color: ${COLORS.slate[500]};">
            ${booking.hotelAddress}<br>
            ${booking.hotelCity}, ${booking.hotelCountry}
            ${booking.hotelPhone ? `<br>Phone: ${booking.hotelPhone}` : ""}
            ${booking.hotelEmail ? `<br>Email: ${booking.hotelEmail}` : ""}
          </p>
        </div>
      </div>

      <!-- Booking Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Booking Details
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};"><strong>Voucher Number</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};">${booking.voucherNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};"><strong>Confirmation Number</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};">${booking.confirmationNumber}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};"><strong>Check-in</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};">${formatDate(booking.checkInDate)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};"><strong>Check-out</strong></strong></td>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};">${formatDate(booking.checkOutDate)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};"><strong>Total Nights</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};">${booking.numberOfNights}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};"><strong>Total Guests</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[200]};">${booking.totalGuests}</td>
          </tr>
        </table>
      </div>

      <!-- Room Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Room Details
        </h3>
        ${roomsHtml}
      </div>

      <!-- Special Requests -->
      ${
        booking.specialRequests
          ? `
      <div style="margin-bottom: 25px; padding: 15px; background-color: rgba(245, 158, 11, 0.15); border-left: 4px solid ${COLORS.warning}; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: ${COLORS.warning};">Special Requests</h3>
        <p style="margin: 0; font-size: 14px; color: ${COLORS.slate[500]};">${booking.specialRequests}</p>
      </div>
      `
          : ""
      }

      <!-- Total -->
      <div style="margin-bottom: 25px; padding: 15px; background-color: rgba(59, 130, 246, 0.1); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.25);">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 8px; font-weight: bold; font-size: 18px;">Total Amount</td>
            <td style="padding: 10px 8px; font-weight: bold; font-size: 24px; text-align: right; color: ${COLORS.primary};">$${totalAmount.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Important Information -->
      <div style="background-color: rgba(245, 158, 11, 0.15); border-left: 4px solid ${COLORS.warning}; padding: 15px; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: ${COLORS.warning};">Important Information</h3>
        <ul style="margin: 0; padding-left: 20px; color: ${COLORS.slate[500]}; font-size: 13px;">
          <li style="margin: 5px 0;">Check-in time is usually 14:00 onwards</li>
          <li style="margin: 5px 0;">Check-out time is usually before 12:00</li>
          <li style="margin: 5px 0;">Please present a valid ID at check-in</li>
          <li style="margin: 5px 0;">Contact hotel directly for early check-in or late check-out requests</li>
        </ul>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: ${COLORS.slate[50]}; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.slate[200]}; font-size: 12px; color: ${COLORS.slate[400]};">
      <p style="margin: 0 0 10px 0;">
        <strong>${companyInfo.name}</strong><br>
        ${companyInfo.website}
      </p>
      <p style="margin: 0;">© ${new Date().getFullYear()} ${companyInfo.name}. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
  `;
}

// ============================================================================
// TEMPLATE GENERATOR - E-TICKET (FLIGHT)
// ============================================================================

export function generateFlightETicket(
  booking: FlightBooking,
  customer: DocumentCustomerInfo,
  companyInfo: DocumentCompanyInfo = DEFAULT_COMPANY_INFO,
): string {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const passengersHtml = booking.passengers
    .map(
      (p, index) => `
    <div style="margin-bottom: 20px; padding: 15px; background-color: ${COLORS.slate[50]}; border-radius: 8px;">
      <h4 style="margin: 0 0 10px 0; font-size: 16px; color: ${COLORS.slate[700]};">
        Passenger ${index + 1}: ${p.firstName} ${p.lastName}
        <span style="font-size: 12px; font-weight: normal; color: ${COLORS.slate[500]}; text-transform: capitalize;">
          (${p.type})
        </span>
      </h4>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 13px;"><strong>Ticket Number:</strong></td>
          <td style="padding: 5px 0; color: ${COLORS.slate[700]}; font-size: 13px; text-align: right; font-family: monospace;">${booking.ticketNumber || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 13px;"><strong>Passport:</strong></td>
          <td style="padding: 5px 0; color: ${COLORS.slate[700]}; font-size: 13px; text-align: right;">${p.passportNumber || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 13px;"><strong>Nationality:</strong></td>
          <td style="padding: 5px 0; color: ${COLORS.slate[700]}; font-size: 13px; text-align: right;">${p.nationality || "N/A"}</td>
        </tr>
      </table>
    </div>
  `,
    )
    .join("");

  const segmentsHtml = booking.segments
    .map(
      (segment, index) => `
    <div style="margin-bottom: 20px; padding: 20px; border: 2px solid ${COLORS.primary}; border-radius: 8px;">
      <div style="text-align: center; margin-bottom: 15px;">
        <span style="background-color: ${COLORS.primary}; color: ${COLORS.white}; padding: 5px 15px; border-radius: 4px; font-size: 14px; font-weight: bold;">
          FLIGHT ${index + 1}
        </span>
      </div>
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: ${COLORS.primary};">
            ${segment.departureAirportCode}
          </div>
          <div style="font-size: 12px; color: ${COLORS.slate[500]};">${segment.departureCity}</div>
        </div>
        <div style="text-align: center; flex: 1;">
          <div style="font-size: 20px; color: ${COLORS.slate[400]};">────── ✈ ──────</div>
          <div style="font-size: 11px; color: ${COLORS.slate[400]};">${segment.duration}</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 28px; font-weight: bold; color: ${COLORS.primary};">
            ${segment.arrivalAirportCode}
          </div>
          <div style="font-size: 12px; color: ${COLORS.slate[500]};">${segment.arrivalCity}</div>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; background-color: ${COLORS.slate[50]}; padding: 10px; border-radius: 4px;">
        <tr>
          <td style="padding: 8px; color: ${COLORS.slate[500]}; font-size: 12px;"><strong>Flight</strong></td>
          <td style="padding: 8px; color: ${COLORS.slate[700]}; font-size: 12px; text-align: right;">${segment.airline} ${segment.flightNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: ${COLORS.slate[500]}; font-size: 12px;"><strong>Date</strong></td>
          <td style="padding: 8px; color: ${COLORS.slate[700]}; font-size: 12px; text-align: right;">${formatDate(segment.departureDate)}</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: ${COLORS.slate[500]}; font-size: 12px;"><strong>Departure</strong></td>
          <td style="padding: 8px; color: ${COLORS.slate[700]}; font-size: 12px; text-align: right;">${segment.departureTime} (${segment.departureTerminal ? `Terminal ${segment.departureTerminal}` : "TBA"})</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: ${COLORS.slate[500]}; font-size: 12px;"><strong>Arrival</strong></td>
          <td style="padding: 8px; color: ${COLORS.slate[700]}; font-size: 12px; text-align: right;">${segment.arrivalTime} (${segment.arrivalTerminal ? `Terminal ${segment.arrivalTerminal}` : "TBA"})</td>
        </tr>
        <tr>
          <td style="padding: 8px; color: ${COLORS.slate[500]}; font-size: 12px;"><strong>Class</strong></td>
          <td style="padding: 8px; color: ${COLORS.slate[700]}; font-size: 12px; text-align: right;">${segment.cabinClass}</td>
        </tr>
        ${
          segment.seatNumber
            ? `
        <tr>
          <td style="padding: 8px; color: ${COLORS.slate[500]}; font-size: 12px;"><strong>Seat</strong></td>
          <td style="padding: 8px; color: ${COLORS.slate[700]}; font-size: 12px; text-align: right; font-weight: bold;">${segment.seatNumber}</td>
        </tr>
        `
            : ""
        }
        ${
          segment.baggagAllowance
            ? `
        <tr>
          <td style="padding: 8px; color: ${COLORS.slate[500]}; font-size: 12px;"><strong>Baggage</strong></td>
          <td style="padding: 8px; color: ${COLORS.slate[700]}; font-size: 12px; text-align: right;">${segment.baggagAllowance}</td>
        </tr>
        `
            : ""
        }
      </table>
    </div>
  `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E-Ticket - ${booking.bookingReference}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: ${COLORS.slate[100]}; margin: 0; padding: 20px;">
  <div style="max-width: 800px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryHover} 100%); padding: 30px 20px; text-align: center; color: ${COLORS.white};">
      <h1 style="margin: 0; font-size: 32px; font-weight: 600;">🎫 E-TICKET</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px;">Booking: <strong>${booking.bookingReference}</strong></p>
      ${booking.pnr ? `<p style="margin: 5px 0 0 0; font-size: 16px;">PNR: <strong>${booking.pnr}</strong></p>` : ""}
    </div>

    <!-- Body Content -->
    <div style="padding: 30px 20px;">
      
      <!-- Booking Reference Box -->
      <div style="margin-bottom: 25px; padding: 15px; background-color: rgba(245, 158, 11, 0.18); border-left: 4px solid ${COLORS.warning}; border-radius: 4px; text-align: center;">
        <p style="margin: 0; font-size: 14px; color: ${COLORS.slate[700]}; text-transform: uppercase; font-weight: 600;">
          ${booking.ticketNumber ? `Ticket: ${booking.ticketNumber}` : "Electronic Ticket"}
        </p>
      </div>

      <!-- Customer Info -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Passenger Information
        </h3>
        ${passengersHtml}
      </div>

      <!-- Flight Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Flight Itinerary
        </h3>
        ${segmentsHtml}
      </div>

      <!-- Fare Summary -->
      <div style="margin-bottom: 25px; padding: 15px; background-color: rgba(59, 130, 246, 0.08); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.2);">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: ${COLORS.primary};">Fare Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[300]};">Base Fare</td>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[300]}; text-align: right;">${booking.currency} ${booking.baseFare.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[300]};">Taxes & Fees</td>
            <td style="padding: 8px; border-bottom: 1px solid ${COLORS.slate[300]}; text-align: right;">${booking.currency} ${booking.taxes.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 8px; font-weight: bold; font-size: 16px;">Total</td>
            <td style="padding: 10px 8px; font-weight: bold; font-size: 20px; text-align: right; color: ${COLORS.primary};">${booking.currency} ${booking.totalAmount.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Important Notice -->
      <div style="background-color: rgba(245, 158, 11, 0.12); border-left: 4px solid ${COLORS.warning}; padding: 15px; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: ${COLORS.warning};">Important Notice</h3>
        <ul style="margin: 0; padding-left: 20px; color: ${COLORS.slate[500]}; font-size: 13px;">
          <li style="margin: 5px 0;">Please arrive at the airport at least 3 hours before international flights</li>
          <li style="margin: 5px 0;">Present this e-ticket along with valid photo ID at check-in</li>
          <li style="margin: 5px 0;">Ensure passport validity of at least 6 months from travel date</li>
          <li style="margin: 5px 0;">Contact airline for baggage allowance and restrictions</li>
        </ul>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: ${COLORS.slate[50]}; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.slate[200]}; font-size: 12px; color: ${COLORS.slate[400]};">
      <p style="margin: 0 0 10px 0;">
        <strong>${companyInfo.name}</strong> | ${companyInfo.website}<br>
        ${companyInfo.address} | ${companyInfo.phone}
      </p>
      <p style="margin: 0;">This is an electronic ticket. No signature required.</p>
      <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} ${companyInfo.name}. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
  `;
}

// ============================================================================
// TEMPLATE GENERATOR - HOTEL VOUCHER
// ============================================================================

export function generateHotelVoucher(
  booking: HotelBooking,
  customer: DocumentCustomerInfo,
  companyInfo: DocumentCompanyInfo = DEFAULT_COMPANY_INFO,
): string {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const roomsHtml = booking.rooms
    .map(
      (room) => `
    <div style="margin-bottom: 15px; padding: 15px; background-color: ${COLORS.slate[50]}; border-radius: 8px;">
      <h4 style="margin: 0 0 10px 0; color: ${COLORS.slate[700]}; font-size: 16px;">${room.roomName}</h4>
      <p style="margin: 5px 0; font-size: 14px; color: ${COLORS.slate[500]};">
        ${room.adults} Adult${room.adults > 1 ? "s" : ""}${room.children > 0 ? `, ${room.children} Child${room.children > 1 ? "ren" : ""}` : ""} | 
        ${room.numberOfNights} Night${room.numberOfNights > 1 ? "s" : ""} | 
        $${room.ratePerNight.toFixed(2)}/night
      </p>
      ${
        room.inclusions && room.inclusions.length > 0
          ? `
        <div style="margin-top: 10px;">
          <strong style="font-size: 12px; color: ${COLORS.primary};">Inclusions:</strong>
          <span style="font-size: 13px; color: ${COLORS.slate[500]};">${room.inclusions.join(", ")}</span>
        </div>
      `
          : ""
      }
    </div>
  `,
    )
    .join("");

  const totalAmount = booking.rooms.reduce(
    (sum, room) => sum + room.totalRate,
    0,
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hotel Voucher - ${booking.voucherNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: ${COLORS.slate[100]}; margin: 0; padding: 20px;">
  <div style="max-width: 800px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryHover} 100%); padding: 30px 20px; text-align: center; color: ${COLORS.white};">
      <h1 style="margin: 0; font-size: 32px; font-weight: 600;">🏨 HOTEL VOUCHER</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Voucher Number: <strong>${booking.voucherNumber}</strong></p>
    </div>

    <!-- Body Content -->
    <div style="padding: 30px 20px;">
      
      <!-- Voucher Details Box -->
      <div style="margin-bottom: 25px; padding: 20px; background-color: rgba(245, 158, 11, 0.18); border-left: 4px solid ${COLORS.warning}; border-radius: 4px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px;">
              <span style="font-size: 12px; color: ${COLORS.slate[700]}; text-transform: uppercase;">Voucher Number</span>
              <div style="font-size: 18px; font-weight: bold; color: ${COLORS.slate[700]};">${booking.voucherNumber}</div>
            </td>
            <td style="padding: 8px; text-align: right;">
              <span style="font-size: 12px; color: ${COLORS.slate[700]}; text-transform: uppercase;">Confirmation</span>
              <div style="font-size: 18px; font-weight: bold; color: ${COLORS.slate[700]};">${booking.confirmationNumber}</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Hotel Information -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Hotel Details
        </h3>
        <div style="padding: 20px; background-color: ${COLORS.slate[50]}; border-radius: 8px;">
          <h2 style="margin: 0 0 10px 0; font-size: 24px; color: ${COLORS.slate[700]};">${booking.hotelName}</h2>
          <p style="margin: 5px 0; font-size: 14px; color: ${COLORS.slate[500]}; line-height: 1.6;">
            ${booking.hotelAddress}<br>
            ${booking.hotelCity}, ${booking.hotelCountry}
          </p>
          ${
            booking.hotelPhone || booking.hotelEmail
              ? `
          <p style="margin: 10px 0 0 0; font-size: 14px; color: ${COLORS.slate[500]};">
            ${booking.hotelPhone ? `📞 ${booking.hotelPhone}` : ""}
            ${booking.hotelPhone && booking.hotelEmail ? " | " : ""}
            ${booking.hotelEmail ? `✉️ ${booking.hotelEmail}` : ""}
          </p>
          `
              : ""
          }
        </div>
      </div>

      <!-- Guest Information -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Guest Information
        </h3>
        <div style="padding: 15px; background-color: ${COLORS.slate[50]}; border-radius: 8px;">
          <p style="margin: 5px 0; font-size: 14px; color: ${COLORS.slate[500]};">
            <strong style="color: ${COLORS.slate[700]};">Guest Name:</strong> ${booking.guestName}
          </p>
          <p style="margin: 5px 0; font-size: 14px; color: ${COLORS.slate[500]};">
            <strong style="color: ${COLORS.slate[700]};">Total Guests:</strong> ${booking.totalGuests}
          </p>
        </div>
      </div>

      <!-- Stay Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Stay Details
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">
              <div style="font-size: 14px; color: ${COLORS.slate[500]};">Check-in</div>
              <div style="font-size: 16px; font-weight: bold; color: ${COLORS.slate[700]};">${formatDate(booking.checkInDate)}</div>
              <div style="font-size: 12px; color: ${COLORS.slate[400]};">From 14:00</div>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right;">
              <div style="font-size: 14px; color: ${COLORS.slate[500]};">Check-out</div>
              <div style="font-size: 16px; font-weight: bold; color: ${COLORS.slate[700]};">${formatDate(booking.checkOutDate)}</div>
              <div style="font-size: 12px; color: ${COLORS.slate[400]};">Until 12:00</div>
            </td>
          </tr>
        </table>
        <div style="margin-top: 15px; padding: 10px; background-color: rgba(59, 130, 246, 0.12); border-radius: 4px; text-align: center;">
          <span style="font-size: 16px; color: ${COLORS.primary}; font-weight: bold;">${booking.numberOfNights} Night${booking.numberOfNights > 1 ? "s" : ""}</span>
        </div>
      </div>

      <!-- Room Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 18px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Room Details
        </h3>
        ${roomsHtml}
      </div>

      <!-- Special Requests -->
      ${
        booking.specialRequests
          ? `
      <div style="margin-bottom: 25px; padding: 15px; background-color: rgba(245, 158, 11, 0.12); border-left: 4px solid ${COLORS.warning}; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: ${COLORS.warning};">Special Requests</h3>
        <p style="margin: 0; font-size: 14px; color: ${COLORS.slate[500]};">${booking.specialRequests}</p>
      </div>
      `
          : ""
      }

      <!-- Total -->
      <div style="margin-bottom: 25px; padding: 20px; background-color: rgba(59, 130, 246, 0.08); border-radius: 8px; border: 2px solid ${COLORS.primary};">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 8px; font-weight: bold; font-size: 18px; color: ${COLORS.slate[700]};">Total Amount</td>
            <td style="padding: 10px 8px; font-weight: bold; font-size: 28px; text-align: right; color: ${COLORS.primary};">$${totalAmount.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Terms & Conditions -->
      <div style="background-color: ${COLORS.slate[50]}; padding: 15px; border-radius: 8px; font-size: 12px; color: ${COLORS.slate[500]};">
        <h4 style="margin: 0 0 10px 0; font-size: 14px; color: ${COLORS.slate[700]};">Terms & Conditions</h4>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.6;">
          <li>Present this voucher along with valid photo ID at check-in</li>
          <li>Check-in time is from 14:00 onwards</li>
          <li>Check-out time is before 12:00</li>
          <li>Cancellation policy varies by hotel and booking type</li>
          <li>Early check-in and late check-out subject to availability</li>
        </ul>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: ${COLORS.slate[50]}; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.slate[200]}; font-size: 12px; color: ${COLORS.slate[400]};">
      <p style="margin: 0 0 10px 0;">
        <strong>${companyInfo.name}</strong> | ${companyInfo.website}<br>
        ${companyInfo.address} | ${companyInfo.phone}
      </p>
      <p style="margin: 0;">© ${new Date().getFullYear()} ${companyInfo.name}. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
  `;
}

// ============================================================================
// TEMPLATE GENERATOR - FLIGHT INVOICE
// ============================================================================

export function generateFlightInvoice(
  booking: FlightBooking,
  customer: DocumentCustomerInfo,
  payment: PaymentBreakdown,
  companyInfo: DocumentCompanyInfo = DEFAULT_COMPANY_INFO,
): string {
  const invoiceNumber = `INV-FL-${booking.bookingReference}-${Date.now()}`;
  const invoiceDate = new Date().toISOString();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${invoiceNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: ${COLORS.slate[100]}; margin: 0; padding: 20px;">
  <div style="max-width: 800px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryHover} 100%); padding: 30px 20px; color: ${COLORS.white};">
      <table style="width: 100%;">
        <tr>
          <td>
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">INVOICE</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Flight Booking</p>
          </td>
          <td style="text-align: right;">
            <div style="font-size: 24px; font-weight: bold;">${companyInfo.name}</div>
            <div style="font-size: 12px; opacity: 0.8;">${companyInfo.address}</div>
            <div style="font-size: 12px; opacity: 0.8;">${companyInfo.email}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body Content -->
    <div style="padding: 30px 20px;">
      
      <!-- Invoice Details -->
      <div style="margin-bottom: 25px; display: flex; justify-content: space-between;">
        <div>
          <table style="border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 20px 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Invoice Number:</td>
              <td style="padding: 5px 0; font-weight: bold; font-size: 14px;">${invoiceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 5px 20px 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Invoice Date:</td>
              <td style="padding: 5px 0; font-size: 14px;">${new Date(invoiceDate).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 5px 20px 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Booking Reference:</td>
              <td style="padding: 5px 0; font-weight: bold; font-size: 14px;">${booking.bookingReference}</td>
            </tr>
            ${
              booking.ticketNumber
                ? `
            <tr>
              <td style="padding: 5px 20px 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Ticket Number:</td>
              <td style="padding: 5px 0; font-size: 14px;">${booking.ticketNumber}</td>
            </tr>
            `
                : ""
            }
          </table>
        </div>
      </div>

      <!-- Customer Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Bill To
        </h3>
        <div style="padding: 15px; background-color: ${COLORS.slate[50]}; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: ${COLORS.slate[700]};">
            <strong>${customer.name}</strong><br>
            ${customer.email}<br>
            ${customer.phone}
            ${customer.companyName ? `<br><strong>Company:</strong> ${customer.companyName}` : ""}
            ${customer.taxId ? `<br><strong>Tax ID:</strong> ${customer.taxId}` : ""}
          </p>
        </div>
      </div>

      <!-- Flight Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Flight Details
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: ${COLORS.slate[50]};">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid ${COLORS.primary};">Route</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid ${COLORS.primary};">Flight</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid ${COLORS.primary};">Date</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid ${COLORS.primary};">Class</th>
            </tr>
          </thead>
          <tbody>
            ${booking.segments
              .map(
                (segment) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">
                ${segment.departureAirportCode} → ${segment.arrivalAirportCode}
              </td>
              <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">${segment.airline} ${segment.flightNumber}</td>
              <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">${new Date(segment.departureDate).toLocaleDateString()}</td>
              <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">${segment.cabinClass}</td>
            </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <!-- Passengers -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Passengers
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: ${COLORS.slate[50]};">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid ${COLORS.primary};">Name</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid ${COLORS.primary};">Type</th>
            </tr>
          </thead>
          <tbody>
            ${booking.passengers
              .map(
                (p) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">${p.firstName} ${p.lastName}</td>
              <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-transform: capitalize;">${p.type}</td>
            </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <!-- Payment Breakdown -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Payment Details
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Base Fare</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right;">${payment.currency} ${payment.baseFare.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Taxes & Fees</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right;">${payment.currency} ${payment.taxes.toFixed(2)}</td>
          </tr>
          ${
            payment.fees > 0
              ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Processing Fees</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right;">${payment.currency} ${payment.fees.toFixed(2)}</td>
          </tr>
          `
              : ""
          }
          ${
            payment.discount && payment.discount > 0
              ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; color: ${COLORS.success};">Discount</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right; color: ${COLORS.success};">-${payment.currency} ${payment.discount.toFixed(2)}</td>
          </tr>
          `
              : ""
          }
          <tr style="background-color: rgba(59, 130, 246, 0.1);">
            <td style="padding: 15px 10px; font-weight: bold; font-size: 18px;">Total Amount</td>
            <td style="padding: 15px 10px; font-weight: bold; font-size: 24px; text-align: right; color: ${COLORS.primary};">${payment.currency} ${payment.total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Payment Method</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right; text-transform: capitalize;">${payment.paymentMethod.replace("_", " ")}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Amount Paid</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right; color: ${COLORS.success}; font-weight: bold;">${payment.currency} ${payment.paidAmount.toFixed(2)}</td>
          </tr>
          ${
            payment.pendingAmount && payment.pendingAmount > 0
              ? `
          <tr>
            <td style="padding: 10px; color: ${COLORS.warning}; font-weight: bold;">Pending Amount</td>
            <td style="padding: 10px; text-align: right; color: ${COLORS.warning}; font-weight: bold;">${payment.currency} ${payment.pendingAmount.toFixed(2)}</td>
          </tr>
          `
              : ""
          }
        </table>
      </div>

      <!-- Company Details -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid ${COLORS.slate[200]}; font-size: 12px; color: ${COLORS.slate[500]};">
        <p style="margin: 0 0 5px 0;"><strong>${companyInfo.name}</strong></p>
        <p style="margin: 0 0 5px 0;">${companyInfo.address}</p>
        <p style="margin: 0 0 5px 0;">Phone: ${companyInfo.phone} | Email: ${companyInfo.email}</p>
        ${companyInfo.taxId ? `<p style="margin: 0 0 5px 0;">Tax ID: ${companyInfo.taxId}</p>` : ""}
        ${companyInfo.registrationNumber ? `<p style="margin: 0;">Registration: ${companyInfo.registrationNumber}</p>` : ""}
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: ${COLORS.slate[50]}; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.slate[200]}; font-size: 12px; color: ${COLORS.slate[400]};">
      <p style="margin: 0;">Thank you for your business!</p>
      <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} ${companyInfo.name}. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
  `;
}

// ============================================================================
// TEMPLATE GENERATOR - HOTEL INVOICE
// ============================================================================

export function generateHotelInvoice(
  booking: HotelBooking,
  customer: DocumentCustomerInfo,
  payment: PaymentBreakdown,
  companyInfo: DocumentCompanyInfo = DEFAULT_COMPANY_INFO,
): string {
  const invoiceNumber = `INV-HT-${booking.confirmationNumber}-${Date.now()}`;
  const invoiceDate = new Date().toISOString();

  const roomsTotal = booking.rooms.reduce(
    (sum, room) => sum + room.totalRate,
    0,
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${invoiceNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: ${COLORS.slate[100]}; margin: 0; padding: 20px;">
  <div style="max-width: 800px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.primaryHover} 100%); padding: 30px 20px; color: ${COLORS.white};">
      <table style="width: 100%;">
        <tr>
          <td>
            <h1 style="margin: 0; font-size: 28px; font-weight: 600;">INVOICE</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Hotel Booking</p>
          </td>
          <td style="text-align: right;">
            <div style="font-size: 24px; font-weight: bold;">${companyInfo.name}</div>
            <div style="font-size: 12px; opacity: 0.8;">${companyInfo.address}</div>
            <div style="font-size: 12px; opacity: 0.8;">${companyInfo.email}</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body Content -->
    <div style="padding: 30px 20px;">
      
      <!-- Invoice Details -->
      <div style="margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Invoice Number:</td>
            <td style="padding: 5px 0; font-weight: bold; font-size: 14px;">${invoiceNumber}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Invoice Date:</td>
            <td style="padding: 5px 0; font-size: 14px;">${new Date(invoiceDate).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Voucher Number:</td>
            <td style="padding: 5px 0; font-weight: bold; font-size: 14px;">${booking.voucherNumber}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Confirmation:</td>
            <td style="padding: 5px 0; font-weight: bold; font-size: 14px;">${booking.confirmationNumber}</td>
          </tr>
        </table>
      </div>

      <!-- Customer Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Bill To
        </h3>
        <div style="padding: 15px; background-color: ${COLORS.slate[50]}; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: ${COLORS.slate[700]};">
            <strong>${customer.name}</strong><br>
            ${customer.email}<br>
            ${customer.phone}
            ${customer.companyName ? `<br><strong>Company:</strong> ${customer.companyName}` : ""}
            ${customer.taxId ? `<br><strong>Tax ID:</strong> ${customer.taxId}` : ""}
          </p>
        </div>
      </div>

      <!-- Hotel Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Hotel Details
        </h3>
        <div style="padding: 15px; background-color: ${COLORS.slate[50]}; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: ${COLORS.slate[700]};">
            <strong>${booking.hotelName}</strong><br>
            ${booking.hotelAddress}<br>
            ${booking.hotelCity}, ${booking.hotelCountry}
          </p>
        </div>
      </div>

      <!-- Stay Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Stay Details
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">
              <div style="color: ${COLORS.slate[500]}; font-size: 14px;">Check-in</div>
              <div style="font-weight: bold; font-size: 14px;">${new Date(booking.checkInDate).toLocaleDateString()}</div>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">
              <div style="color: ${COLORS.slate[500]}; font-size: 14px;">Check-out</div>
              <div style="font-weight: bold; font-size: 14px;">${new Date(booking.checkOutDate).toLocaleDateString()}</div>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">
              <div style="color: ${COLORS.slate[500]}; font-size: 14px;">Nights</div>
              <div style="font-weight: bold; font-size: 14px;">${booking.numberOfNights}</div>
            </td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">
              <div style="color: ${COLORS.slate[500]}; font-size: 14px;">Guests</div>
              <div style="font-weight: bold; font-size: 14px;">${booking.totalGuests}</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Room Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Room Details
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: ${COLORS.slate[50]};">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid ${COLORS.primary};">Room Type</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid ${COLORS.primary};">Guests</th>
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid ${COLORS.primary};">Nights</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid ${COLORS.primary};">Rate/Night</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid ${COLORS.primary};">Total</th>
            </tr>
          </thead>
          <tbody>
            ${booking.rooms
              .map(
                (room) => `
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">${room.roomName}</td>
              <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">${room.adults + room.children}</td>
              <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">${room.numberOfNights}</td>
              <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right;">$${room.ratePerNight.toFixed(2)}</td>
              <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right;">$${room.totalRate.toFixed(2)}</td>
            </tr>
            `,
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr style="background-color: rgba(59, 130, 246, 0.08);">
              <td colspan="4" style="padding: 10px; font-weight: bold; text-align: right;">Total Room Cost:</td>
              <td style="padding: 10px; font-weight: bold; text-align: right;">$${roomsTotal.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Payment Breakdown -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 16px; color: ${COLORS.slate[700]}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px;">
          Payment Details
        </h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Room Total</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right;">${payment.currency} ${payment.baseFare.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Taxes & Fees</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right;">${payment.currency} ${payment.taxes.toFixed(2)}</td>
          </tr>
          ${
            payment.fees > 0
              ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Processing Fees</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right;">${payment.currency} ${payment.fees.toFixed(2)}</td>
          </tr>
          `
              : ""
          }
          ${
            payment.discount && payment.discount > 0
              ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; color: ${COLORS.success};">Discount</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right; color: ${COLORS.success};">-${payment.currency} ${payment.discount.toFixed(2)}</td>
          </tr>
          `
              : ""
          }
          <tr style="background-color: rgba(59, 130, 246, 0.08);">
            <td style="padding: 15px 10px; font-weight: bold; font-size: 18px;">Total Amount</td>
            <td style="padding: 15px 10px; font-weight: bold; font-size: 24px; text-align: right; color: ${COLORS.primary};">${payment.currency} ${payment.total.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Payment Method</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right; text-transform: capitalize;">${payment.paymentMethod.replace("_", " ")}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Amount Paid</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right; color: ${COLORS.success}; font-weight: bold;">${payment.currency} ${payment.paidAmount.toFixed(2)}</td>
          </tr>
          ${
            payment.pendingAmount && payment.pendingAmount > 0
              ? `
          <tr>
            <td style="padding: 10px; color: ${COLORS.warning}; font-weight: bold;">Pending Amount</td>
            <td style="padding: 10px; text-align: right; color: ${COLORS.warning}; font-weight: bold;">${payment.currency} ${payment.pendingAmount.toFixed(2)}</td>
          </tr>
          `
              : ""
          }
        </table>
      </div>

      <!-- Company Details -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid ${COLORS.slate[200]}; font-size: 12px; color: ${COLORS.slate[500]};">
        <p style="margin: 0 0 5px 0;"><strong>${companyInfo.name}</strong></p>
        <p style="margin: 0 0 5px 0;">${companyInfo.address}</p>
        <p style="margin: 0 0 5px 0;">Phone: ${companyInfo.phone} | Email: ${companyInfo.email}</p>
        ${companyInfo.taxId ? `<p style="margin: 0 0 5px 0;">Tax ID: ${companyInfo.taxId}</p>` : ""}
        ${companyInfo.registrationNumber ? `<p style="margin: 0;">Registration: ${companyInfo.registrationNumber}</p>` : ""}
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: ${COLORS.slate[50]}; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.slate[200]}; font-size: 12px; color: ${COLORS.slate[400]};">
      <p style="margin: 0;">Thank you for your business!</p>
      <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} ${companyInfo.name}. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
  `;
}

// ============================================================================
// TEMPLATE GENERATOR - FLIGHT RECEIPT
// ============================================================================

export function generateFlightReceipt(
  booking: FlightBooking,
  customer: DocumentCustomerInfo,
  payment: PaymentBreakdown,
  companyInfo: DocumentCompanyInfo = DEFAULT_COMPANY_INFO,
): string {
  const receiptNumber = `RCT-FL-${booking.bookingReference}-${Date.now()}`;
  const receiptDate = new Date().toISOString();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - ${receiptNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: ${COLORS.slate[100]}; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.info} 100%); padding: 30px 20px; text-align: center; color: ${COLORS.white};">
      <div style="font-size: 48px; margin-bottom: 10px;">✓</div>
      <h1 style="margin: 0; font-size: 28px; font-weight: 600;">PAYMENT RECEIPT</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Transaction Successful</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 30px 20px;">
      
      <!-- Receipt Details -->
      <div style="margin-bottom: 25px; padding: 15px; background-color: ${COLORS.slate[50]}; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Receipt Number:</td>
            <td style="padding: 5px 0; font-weight: bold; font-size: 14px; text-align: right;">${receiptNumber}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Date:</td>
            <td style="padding: 5px 0; font-size: 14px; text-align: right;">${new Date(receiptDate).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Booking Reference:</td>
            <td style="padding: 5px 0; font-weight: bold; font-size: 14px; text-align: right;">${booking.bookingReference}</td>
          </tr>
        </table>
      </div>

      <!-- Customer Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: ${COLORS.slate[500]}; text-transform: uppercase;">Customer</h3>
        <p style="margin: 0; font-size: 14px; color: ${COLORS.slate[700]};">
          <strong>${customer.name}</strong><br>
          ${customer.email}
        </p>
      </div>

      <!-- Payment Summary -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: ${COLORS.slate[500]}; text-transform: uppercase;">Payment Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Base Fare</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right;">${payment.currency} ${payment.baseFare.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Taxes & Fees</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right;">${payment.currency} ${payment.taxes.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Payment Method</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right; text-transform: capitalize;">${payment.paymentMethod.replace("_", " ")}</td>
          </tr>
          <tr>
            <td style="padding: 15px 10px; font-weight: bold; font-size: 18px;">Amount Paid</td>
            <td style="padding: 15px 10px; font-weight: bold; font-size: 24px; text-align: right; color: ${COLORS.success};">${payment.currency} ${payment.paidAmount.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Flight Info -->
      <div style="margin-bottom: 25px; padding: 15px; background-color: rgba(59, 130, 246, 0.1); border-radius: 8px;">
        <p style="margin: 0; font-size: 14px; color: ${COLORS.slate[700]};">
          <strong>Flight:</strong> ${booking.segments[0]?.airline} ${booking.segments[0]?.flightNumber || "N/A"}<br>
          <strong>Route:</strong> ${booking.segments[0]?.departureAirportCode || "-"} → ${booking.segments[booking.segments.length - 1]?.arrivalAirportCode || "-"}
        </p>
      </div>

      <!-- Footer Note -->
      <div style="text-align: center; font-size: 12px; color: ${COLORS.slate[500]};">
        <p style="margin: 0;">This is an official payment receipt.</p>
        <p style="margin: 10px 0 0 0;">Please keep this receipt for your records.</p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: ${COLORS.slate[50]}; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.slate[200]}; font-size: 12px; color: ${COLORS.slate[400]};">
      <p style="margin: 0 0 5px 0;"><strong>${companyInfo.name}</strong></p>
      <p style="margin: 0;">${companyInfo.website}</p>
    </div>

  </div>
</body>
</html>
  `;
}

// ============================================================================
// TEMPLATE GENERATOR - HOTEL RECEIPT
// ============================================================================

export function generateHotelReceipt(
  booking: HotelBooking,
  customer: DocumentCustomerInfo,
  payment: PaymentBreakdown,
  companyInfo: DocumentCompanyInfo = DEFAULT_COMPANY_INFO,
): string {
  const receiptNumber = `RCT-HT-${booking.confirmationNumber}-${Date.now()}`;
  const receiptDate = new Date().toISOString();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt - ${receiptNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: ${COLORS.slate[100]}; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${COLORS.success} 0%, ${COLORS.info} 100%); padding: 30px 20px; text-align: center; color: ${COLORS.white};">
      <div style="font-size: 48px; margin-bottom: 10px;">✓</div>
      <h1 style="margin: 0; font-size: 28px; font-weight: 600;">PAYMENT RECEIPT</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Transaction Successful</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 30px 20px;">
      
      <!-- Receipt Details -->
      <div style="margin-bottom: 25px; padding: 15px; background-color: ${COLORS.slate[50]}; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Receipt Number:</td>
            <td style="padding: 5px 0; font-weight: bold; font-size: 14px; text-align: right;">${receiptNumber}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Date:</td>
            <td style="padding: 5px 0; font-size: 14px; text-align: right;">${new Date(receiptDate).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Voucher Number:</td>
            <td style="padding: 5px 0; font-weight: bold; font-size: 14px; text-align: right;">${booking.voucherNumber}</td>
          </tr>
        </table>
      </div>

      <!-- Customer Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: ${COLORS.slate[500]}; text-transform: uppercase;">Customer</h3>
        <p style="margin: 0; font-size: 14px; color: ${COLORS.slate[700]};">
          <strong>${customer.name}</strong><br>
          ${customer.email}
        </p>
      </div>

      <!-- Hotel Info -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: ${COLORS.slate[500]}; text-transform: uppercase;">Hotel</h3>
        <p style="margin: 0; font-size: 14px; color: ${COLORS.slate[700]};">
          <strong>${booking.hotelName}</strong><br>
          ${booking.hotelCity}, ${booking.hotelCountry}<br>
          ${booking.numberOfNights} Night${booking.numberOfNights > 1 ? "s" : ""}
        </p>
      </div>

      <!-- Payment Summary -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: ${COLORS.slate[500]}; text-transform: uppercase;">Payment Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Room Total</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right;">${payment.currency} ${payment.baseFare.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Taxes & Fees</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right;">${payment.currency} ${payment.taxes.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Payment Method</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right; text-transform: capitalize;">${payment.paymentMethod.replace("_", " ")}</td>
          </tr>
          <tr>
            <td style="padding: 15px 10px; font-weight: bold; font-size: 18px;">Amount Paid</td>
            <td style="padding: 15px 10px; font-weight: bold; font-size: 24px; text-align: right; color: ${COLORS.success};">${payment.currency} ${payment.paidAmount.toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <!-- Footer Note -->
      <div style="text-align: center; font-size: 12px; color: ${COLORS.slate[500]};">
        <p style="margin: 0;">This is an official payment receipt.</p>
        <p style="margin: 10px 0 0 0;">Please keep this receipt for your records.</p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: ${COLORS.slate[50]}; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.slate[200]}; font-size: 12px; color: ${COLORS.slate[400]};">
      <p style="margin: 0 0 5px 0;"><strong>${companyInfo.name}</strong></p>
      <p style="margin: 0;">${companyInfo.website}</p>
    </div>

  </div>
</body>
</html>
  `;
}

// ============================================================================
// TEMPLATE GENERATOR - REFUND NOTE
// ============================================================================

export function generateRefundNote(
  refund: RefundDetails,
  booking: FlightBooking | HotelBooking,
  customer: DocumentCustomerInfo,
  companyInfo: DocumentCompanyInfo = DEFAULT_COMPANY_INFO,
): string {
  const isFlight = "segments" in booking;
  const bookingRef = isFlight
    ? (booking as FlightBooking).bookingReference
    : (booking as HotelBooking).confirmationNumber;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Refund Note - ${refund.refundNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: ${COLORS.slate[100]}; margin: 0; padding: 20px;">
  <div style="max-width: 700px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${COLORS.error} 0%, ${COLORS.accent} 100%); padding: 30px 20px; text-align: center; color: ${COLORS.white};">
      <div style="font-size: 48px; margin-bottom: 10px;">↩</div>
      <h1 style="margin: 0; font-size: 28px; font-weight: 600;">REFUND NOTE</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Refund Processed Successfully</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 30px 20px;">
      
      <!-- Refund Details -->
      <div style="margin-bottom: 25px; padding: 15px; background-color: ${COLORS.slate[50]}; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Refund Number:</td>
            <td style="padding: 5px 0; font-weight: bold; font-size: 14px; text-align: right;">${refund.refundNumber}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Refund Date:</td>
            <td style="padding: 5px 0; font-size: 14px; text-align: right;">
              ${refund.processedAt ? new Date(refund.processedAt).toLocaleDateString() : new Date().toLocaleDateString()}
            </td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Status:</td>
            <td style="padding: 5px 0; font-weight: bold; font-size: 14px; text-align: right; text-transform: uppercase; color: ${COLORS.success};">
              ${refund.status}
            </td>
          </tr>
        </table>
      </div>

      <!-- Customer Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: ${COLORS.slate[500]}; text-transform: uppercase;">Customer</h3>
        <p style="margin: 0; font-size: 14px; color: ${COLORS.slate[700]};">
          <strong>${customer.name}</strong><br>
          ${customer.email}<br>
          ${customer.phone}
        </p>
      </div>

      <!-- Original Booking -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: ${COLORS.slate[500]}; text-transform: uppercase;">Original Booking</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Booking Type</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right; text-transform: capitalize;">${isFlight ? "Flight" : "Hotel"}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Booking Reference</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right; font-weight: bold;">${bookingRef}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Original Amount</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right;">${refund.currency} ${refund.originalPaymentAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Refund Type</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right; text-transform: capitalize;">${refund.type} Refund</td>
          </tr>
        </table>
      </div>

      <!-- Refund Breakdown -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: ${COLORS.slate[500]}; text-transform: uppercase;">Refund Breakdown</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Refund Amount</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right; font-size: 18px; font-weight: bold; color: ${COLORS.success};">${refund.currency} ${refund.amount.toFixed(2)}</td>
          </tr>
          ${
            refund.cancellationFees
              ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; color: ${COLORS.error};">Cancellation Fees</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right; color: ${COLORS.error};">-${refund.currency} ${refund.cancellationFees.toFixed(2)}</td>
          </tr>
          `
              : ""
          }
          ${
            refund.taxRefund
              ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Tax Refund</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right;">${refund.currency} ${refund.taxRefund.toFixed(2)}</td>
          </tr>
          `
              : ""
          }
        </table>
      </div>

      <!-- Refund Reason -->
      <div style="margin-bottom: 25px; padding: 15px; background-color: rgba(245, 158, 11, 0.15); border-left: 4px solid ${COLORS.warning}; border-radius: 4px;">
        <h4 style="margin: 0 0 5px 0; font-size: 14px; color: ${COLORS.warning};">Refund Reason</h4>
        <p style="margin: 0; font-size: 14px; color: ${COLORS.slate[500]};">${refund.reason}</p>
      </div>

      <!-- Refund To -->
      <div style="margin-bottom: 25px; padding: 15px; background-color: rgba(59, 130, 246, 0.1); border-radius: 8px;">
        <p style="margin: 0; font-size: 14px; color: ${COLORS.slate[700]};">
          <strong>Refund will be processed to:</strong> 
          ${
            refund.refundedTo === "original_payment"
              ? "Original Payment Method"
              : refund.refundedTo === "wallet"
                ? "TripAlfa Wallet"
                : "Travel Voucher"
          }
        </p>
      </div>

      <!-- Processing Time -->
      <div style="text-align: center; font-size: 13px; color: ${COLORS.slate[500]}; padding: 15px; background-color: ${COLORS.slate[50]}; border-radius: 8px;">
        <p style="margin: 0;">Refund processing typically takes 5-10 business days depending on your payment provider.</p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: ${COLORS.slate[50]}; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.slate[200]}; font-size: 12px; color: ${COLORS.slate[400]};">
      <p style="margin: 0 0 5px 0;"><strong>${companyInfo.name}</strong></p>
      <p style="margin: 0;">${companyInfo.website} | ${companyInfo.email}</p>
      <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} ${companyInfo.name}. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
  `;
}

// ============================================================================
// TEMPLATE GENERATOR - DEBIT NOTE
// ============================================================================

export function generateDebitNote(
  debitNote: DebitNoteDetails,
  customer: DocumentCustomerInfo,
  companyInfo: DocumentCompanyInfo = DEFAULT_COMPANY_INFO,
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Debit Note - ${debitNote.debitNoteNumber}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: ${COLORS.slate[100]}; margin: 0; padding: 20px;">
  <div style="max-width: 700px; margin: 0 auto; background-color: ${COLORS.white}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, ${COLORS.warning} 0%, ${COLORS.accent} 100%); padding: 30px 20px; text-align: center; color: ${COLORS.white};">
      <div style="font-size: 48px; margin-bottom: 10px;">💳</div>
      <h1 style="margin: 0; font-size: 28px; font-weight: 600;">DEBIT NOTE</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px;">Additional Charges</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 30px 20px;">
      
      <!-- Debit Note Details -->
      <div style="margin-bottom: 25px; padding: 15px; background-color: ${COLORS.slate[50]}; border-radius: 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Debit Note Number:</td>
            <td style="padding: 5px 0; font-weight: bold; font-size: 14px; text-align: right;">${debitNote.debitNoteNumber}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Issue Date:</td>
            <td style="padding: 5px 0; font-size: 14px; text-align: right;">${new Date(debitNote.issuedAt).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Due Date:</td>
            <td style="padding: 5px 0; font-size: 14px; text-align: right; font-weight: bold; color: ${COLORS.error};">${new Date(debitNote.dueDate).toLocaleDateString()}</td>
          </tr>
        </table>
      </div>

      <!-- Customer Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: ${COLORS.slate[500]}; text-transform: uppercase;">Bill To</h3>
        <div style="padding: 15px; background-color: ${COLORS.slate[50]}; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: ${COLORS.slate[700]};">
            <strong>${customer.name}</strong><br>
            ${customer.email}<br>
            ${customer.phone}
            ${customer.companyName ? `<br><strong>Company:</strong> ${customer.companyName}` : ""}
            ${customer.taxId ? `<br><strong>Tax ID:</strong> ${customer.taxId}` : ""}
          </p>
        </div>
      </div>

      <!-- Reference -->
      <div style="margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Reference Number:</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right; font-weight: bold;">${debitNote.referenceNumber}</td>
          </tr>
        </table>
      </div>

      <!-- Reason & Description -->
      <div style="margin-bottom: 25px; padding: 15px; background-color: rgba(245, 158, 11, 0.15); border-left: 4px solid ${COLORS.warning}; border-radius: 4px;">
        <h4 style="margin: 0 0 5px 0; font-size: 14px; color: ${COLORS.warning};">Reason</h4>
        <p style="margin: 0 0 15px 0; font-size: 14px; color: ${COLORS.slate[500]}; font-weight: bold;">${debitNote.reason}</p>
        
        <h4 style="margin: 0 0 5px 0; font-size: 14px; color: ${COLORS.warning};">Description</h4>
        <p style="margin: 0; font-size: 14px; color: ${COLORS.slate[500]};">${debitNote.description}</p>
      </div>

      <!-- Amount Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: ${COLORS.slate[500]}; text-transform: uppercase;">Amount Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]};">Original Booking Amount</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right;">${debitNote.currency} ${debitNote.originalBookingAmount.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; color: ${COLORS.error};">Adjustment/Charge</td>
            <td style="padding: 10px; border-bottom: 1px solid ${COLORS.slate[200]}; text-align: right; color: ${COLORS.error}; font-weight: bold;">
              +${debitNote.currency} ${debitNote.adjustmentAmount.toFixed(2)}
            </td>
          </tr>
          <tr style="background-color: rgba(59, 130, 246, 0.1);">
            <td style="padding: 15px 10px; font-weight: bold; font-size: 18px;">Total Amount Due</td>
            <td style="padding: 15px 10px; font-weight: bold; font-size: 24px; text-align: right; color: ${COLORS.warning};">
              ${debitNote.currency} ${debitNote.adjustedAmount.toFixed(2)}
            </td>
          </tr>
        </table>
      </div>

      <!-- Payment Instructions -->
      <div style="margin-bottom: 25px; padding: 15px; background-color: rgba(59, 130, 246, 0.1); border-radius: 8px;">
        <h4 style="margin: 0 0 10px 0; font-size: 14px; color: ${COLORS.primary};">Payment Instructions</h4>
        <p style="margin: 0; font-size: 13px; color: ${COLORS.slate[500]}; line-height: 1.6;">
          Please ensure payment is made by <strong>${new Date(debitNote.dueDate).toLocaleDateString()}</strong> to avoid any service interruption.
        </p>
      </div>

      <!-- Company Details -->
      <div style="padding-top: 20px; border-top: 1px solid ${COLORS.slate[200]}; font-size: 12px; color: ${COLORS.slate[500]};">
        <p style="margin: 0 0 5px 0;"><strong>${companyInfo.name}</strong></p>
        <p style="margin: 0 0 5px 0;">${companyInfo.address}</p>
        <p style="margin: 0 0 5px 0;">Phone: ${companyInfo.phone} | Email: ${companyInfo.email}</p>
        ${companyInfo.taxId ? `<p style="margin: 0;">Tax ID: ${companyInfo.taxId}</p>` : ""}
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: ${COLORS.slate[50]}; padding: 20px; text-align: center; border-top: 1px solid ${COLORS.slate[200]}; font-size: 12px; color: ${COLORS.slate[400]};">
      <p style="margin: 0;">If you have any questions regarding this debit note, please contact us.</p>
      <p style="margin: 10px 0 0 0;">© ${new Date().getFullYear()} ${companyInfo.name}. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
  `;
}

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class DocumentGenerationService {
  private companyInfo: DocumentCompanyInfo;

  constructor(companyInfo?: DocumentCompanyInfo) {
    this.companyInfo = companyInfo || DEFAULT_COMPANY_INFO;
  }

  /**
   * Generate Flight Itinerary
   */
  generateFlightItinerary(
    booking: FlightBooking,
    customer: DocumentCustomerInfo,
  ): string {
    return generateFlightItinerary(booking, customer, this.companyInfo);
  }

  /**
   * Generate Hotel Itinerary
   */
  generateHotelItinerary(
    booking: HotelBooking,
    customer: DocumentCustomerInfo,
  ): string {
    return generateHotelItinerary(booking, customer, this.companyInfo);
  }

  /**
   * Generate Flight E-Ticket
   */
  generateFlightETicket(
    booking: FlightBooking,
    customer: DocumentCustomerInfo,
  ): string {
    return generateFlightETicket(booking, customer, this.companyInfo);
  }

  /**
   * Generate Hotel Voucher
   */
  generateHotelVoucher(
    booking: HotelBooking,
    customer: DocumentCustomerInfo,
  ): string {
    return generateHotelVoucher(booking, customer, this.companyInfo);
  }

  /**
   * Generate Flight Invoice
   */
  generateFlightInvoice(
    booking: FlightBooking,
    customer: DocumentCustomerInfo,
    payment: PaymentBreakdown,
  ): string {
    return generateFlightInvoice(booking, customer, payment, this.companyInfo);
  }

  /**
   * Generate Hotel Invoice
   */
  generateHotelInvoice(
    booking: HotelBooking,
    customer: DocumentCustomerInfo,
    payment: PaymentBreakdown,
  ): string {
    return generateHotelInvoice(booking, customer, payment, this.companyInfo);
  }

  /**
   * Generate Flight Receipt
   */
  generateFlightReceipt(
    booking: FlightBooking,
    customer: DocumentCustomerInfo,
    payment: PaymentBreakdown,
  ): string {
    return generateFlightReceipt(booking, customer, payment, this.companyInfo);
  }

  /**
   * Generate Hotel Receipt
   */
  generateHotelReceipt(
    booking: HotelBooking,
    customer: DocumentCustomerInfo,
    payment: PaymentBreakdown,
  ): string {
    return generateHotelReceipt(booking, customer, payment, this.companyInfo);
  }

  /**
   * Generate Refund Note
   */
  generateRefundNote(
    refund: RefundDetails,
    booking: FlightBooking | HotelBooking,
    customer: DocumentCustomerInfo,
  ): string {
    return generateRefundNote(refund, booking, customer, this.companyInfo);
  }

  /**
   * Generate Debit Note
   */
  generateDebitNote(
    debitNote: DebitNoteDetails,
    customer: DocumentCustomerInfo,
  ): string {
    return generateDebitNote(debitNote, customer, this.companyInfo);
  }
}

export default DocumentGenerationService;
