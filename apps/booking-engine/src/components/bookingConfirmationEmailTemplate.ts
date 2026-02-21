/**
 * Booking confirmation email template with Duffel order details
 */

export interface PassengerDetails {
  name: string;
  email?: string;
  cabinClass?: string;
  seatNumber?: string;
}

export interface SegmentDetails {
  departureCity: string;
  departureAirport: string;
  departureTerminal?: string;
  departureTime: string;
  departureDate: string;
  arrivalCity: string;
  arrivalAirport: string;
  arrivalTerminal?: string;
  arrivalTime: string;
  flightNumber: string;
  airline: string;
  operatingAirline?: string;
  aircraftType?: string;
  duration?: string;
  cabinClass?: string;
}

export interface OrderDetails {
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  totalPrice: number;
  basePrice?: number;
  taxPrice?: number;
  currency: string;
  passengers: PassengerDetails[];
  segments: SegmentDetails[];
  mealInclusions?: string[];
  baggageAllowance?: {
    checked: number;
    carry: number;
  };
  paymentMethod?: string;
  bookingDate?: string;
}

/**
 * Generate booking confirmation HTML email
 */
export function generateBookingConfirmationEmail(order: OrderDetails): string {
  const segmentsHtml = order.segments
    .map(
      (segment, index) => `
    <div style="margin: 20px 0; padding: 15px; background-color: #f9f9f9; border-left: 4px solid #0066cc; border-radius: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <div>
          <strong style="font-size: 16px; color: #333;">Flight ${index + 1}</strong>
          <p style="margin: 5px 0 0 0; color: #666; font-size: 13px;">
            <strong>${segment.flightNumber}</strong> • ${segment.airline}${segment.operatingAirline && segment.operatingAirline !== segment.airline ? ` (Operated by ${segment.operatingAirline})` : ''}
          </p>
        </div>
        <div style="text-align: right;">
          ${segment.cabinClass ? `<p style="margin: 0; color: #666; font-size: 12px; background-color: #e8e8e8; padding: 4px 8px; border-radius: 3px; display: inline-block;">${segment.cabinClass}</p>` : ''}
          ${segment.duration ? `<p style="margin: 8px 0 0 0; color: #999; font-size: 12px;">Duration: ${segment.duration}</p>` : ''}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 15px; margin: 15px 0; padding: 15px 0; border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0;">
        <div style="text-align: left;">
          <p style="margin: 0; font-size: 20px; color: #0066cc; font-weight: bold;">
            ${segment.departureTime}
          </p>
          <p style="margin: 5px 0 0 0; color: #333; font-size: 13px; font-weight: 600;">
            ${segment.departureCity} (${segment.departureAirport})
          </p>
          ${segment.departureTerminal ? `<p style="margin: 3px 0 0 0; color: #999; font-size: 11px;">Terminal ${segment.departureTerminal}</p>` : ''}
          <p style="margin: 8px 0 0 0; color: #666; font-size: 11px;">${segment.departureDate}</p>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <p style="margin: 0; color: #999; font-weight: bold; font-size: 18px;">✈</p>
          <p style="margin: 8px 0; color: #999; font-size: 11px; text-align: center;">
            ${segment.duration ? segment.duration : 'See details'}
          </p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 20px; color: #0066cc; font-weight: bold;">
            ${segment.arrivalTime}
          </p>
          <p style="margin: 5px 0 0 0; color: #333; font-size: 13px; font-weight: 600;">
            ${segment.arrivalCity} (${segment.arrivalAirport})
          </p>
          ${segment.arrivalTerminal ? `<p style="margin: 3px 0 0 0; color: #999; font-size: 11px;">Terminal ${segment.arrivalTerminal}</p>` : ''}
        </div>
      </div>

      ${segment.aircraftType ? `<p style="margin: 8px 0; color: #999; font-size: 11px;">✈ Aircraft: ${segment.aircraftType}</p>` : ''}
    </div>
  `
    )
    .join('');

  const mealInclusions = order.mealInclusions && order.mealInclusions.length > 0
    ? `
    <div style="margin: 15px 0; padding: 10px; background-color: #e8f4f8; border-radius: 4px;">
      <strong style="color: #0066cc;">✓ Meals Included:</strong>
      <p style="margin: 5px 0 0 0; color: #666;">${order.mealInclusions.join(', ')}</p>
    </div>
  `
    : '';

  const baggageAllowance = order.baggageAllowance
    ? `
    <div style="margin: 15px 0; padding: 10px; background-color: #e8f4f8; border-radius: 4px;">
      <strong style="color: #0066cc;">✓ Baggage Allowance:</strong>
      <p style="margin: 5px 0 0 0; color: #666;">
        Checked: ${order.baggageAllowance.checked || 0} bag(s) • Carry-on: ${order.baggageAllowance.carry || 1} bag(s)
      </p>
    </div>
  `
    : '';

  const passengersHtml = order.passengers
    .map(
      (passenger) => `
    <div style="padding: 12px 0; border-bottom: 1px solid #eee; display: grid; grid-template-columns: 1fr auto;">
      <div>
        <p style="margin: 0; color: #333; font-weight: 600;">${passenger.name}</p>
        ${passenger.email ? `<p style="margin: 3px 0 0 0; color: #999; font-size: 12px;">${passenger.email}</p>` : ''}
      </div>
      <div style="text-align: right;">
        ${passenger.cabinClass ? `<p style="margin: 0; color: #0066cc; font-size: 11px; font-weight: 600; background-color: #e8f4ff; padding: 2px 6px; border-radius: 3px; display: inline-block;">${passenger.cabinClass}</p>` : ''}
        ${passenger.seatNumber ? `<p style="margin: 5px 0 0 0; color: #666; font-size: 12px; font-weight: 500;">Seat: <strong>${passenger.seatNumber}</strong></p>` : ''}
      </div>
    </div>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flight Booking Confirmation</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%); padding: 30px 20px; text-align: center; color: white;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 600;">✓ Booking Confirmed!</h1>
      <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your flight is booked and ready</p>
    </div>

    <!-- Body Content -->
    <div style="padding: 30px 20px;">
      
      <!-- Greeting -->
      <p style="margin: 0 0 20px 0; font-size: 16px; color: #333;">
        Hello <strong>${order.customerName}</strong>,
      </p>
      <p style="margin: 0 0 25px 0; font-size: 14px; color: #666; line-height: 1.6;">
        Thank you for booking with <strong>TripAlfa</strong>! Your flight booking is confirmed. 
        Please keep this email safe as it contains your booking reference and important information.
      </p>

      <!-- Booking Reference Section -->
      <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
        <p style="margin: 0 0 8px 0; font-size: 12px; color: #856404; text-transform: uppercase; font-weight: 600;">Your Booking Reference</p>
        <p style="margin: 0; font-size: 22px; color: #333; font-weight: bold; letter-spacing: 1px;">
          ${order.bookingReference}
        </p>
        <p style="margin: 8px 0 0 0; font-size: 11px; color: #856404;">Use this reference number for check-in and customer support</p>
      </div>

      <!-- Booking Date -->
      ${order.bookingDate ? `
      <div style="margin-bottom: 25px; padding: 10px 0; border-bottom: 1px solid #eee;">
        <p style="margin: 0; font-size: 12px; color: #999; text-transform: uppercase;">Booking Date</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #333;">${order.bookingDate}</p>
      </div>
      ` : ''}

      <!-- Flight Segments -->
      <div style="margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
          ✈️ Your Flights
        </h2>
        ${segmentsHtml}
      </div>

      <!-- Passengers Section -->
      <div style="margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
          👥 Passengers
        </h2>
        <div style="padding: 10px 0; background-color: #f9f9f9; border-radius: 4px; padding: 15px;">
          ${passengersHtml}
        </div>
      </div>

      <!-- Inclusions -->
      ${mealInclusions || baggageAllowance ? `
      <div style="margin-bottom: 25px;">
        <h2 style="margin: 0 0 15px 0; font-size: 18px; color: #333; border-bottom: 2px solid #0066cc; padding-bottom: 10px;">
          📋 What's Included
        </h2>
        ${mealInclusions}
        ${baggageAllowance}
      </div>
      ` : ''}

      <!-- Price Summary -->
      <div style="background-color: #f0f8ff; padding: 20px; border-radius: 4px; margin-bottom: 25px; border: 1px solid #cce5ff;">
        <h3 style="margin: 0 0 15px 0; font-size: 14px; color: #0066cc; font-weight: 600; text-transform: uppercase;">Your Trip Receipt</h3>
        
        ${order.basePrice ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
          <span style="color: #666; font-size: 13px;">Fare</span>
          <span style="color: #333; font-size: 13px; font-weight: 500;">${order.currency} ${order.basePrice.toFixed(2)}</span>
        </div>
        ` : ''}

        ${order.taxPrice ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #ddd;">
          <span style="color: #666; font-size: 13px;">Taxes & Fees</span>
          <span style="color: #333; font-size: 13px; font-weight: 500;">+ ${order.currency} ${order.taxPrice.toFixed(2)}</span>
        </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #333; font-size: 13px; font-weight: 600; text-transform: uppercase;">Total</span>
          <span style="color: #0066cc; font-size: 22px; font-weight: bold;">${order.currency} ${order.totalPrice.toFixed(2)}</span>
        </div>

        ${order.paymentMethod ? `<p style="margin: 12px 0 0 0; font-size: 11px; color: #999;">via ${order.paymentMethod}</p>` : ''}
      </div>

      <!-- Important Information -->
      <div style="background-color: #fff5e6; border-left: 4px solid #ff9800; padding: 15px; border-radius: 4px; margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #e65100; font-weight: 600;">📌 Important Information</h3>
        <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 13px;">
          <li style="margin: 5px 0;">Please arrive at the airport at least 3 hours before international flights</li>
          <li style="margin: 5px 0;">Have a valid passport that doesn't expire within 6 months of travel</li>
          <li style="margin: 5px 0;">Check your airline's baggage policy and any extra fees</li>
          <li style="margin: 5px 0;">Download or check your airline's mobile app for real-time updates</li>
        </ul>
      </div>

      <!-- CTA Section -->
      <div style="text-align: center; margin: 30px 0;">
        <p style="margin: 0 0 15px 0; font-size: 14px; color: #333;">Need help? We're here for you!</p>
        <a href="https://tripalfa.com/support" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 0 5px; font-size: 14px;">
          View Booking
        </a>
        <a href="https://tripalfa.com/contact" style="display: inline-block; background-color: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 0 5px; font-size: 14px;">
          Contact Support
        </a>
      </div>

      <!-- Additional Help -->
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin-bottom: 25px; font-size: 12px; color: #666; line-height: 1.6;">
        <p style="margin: 0 0 8px 0;"><strong>Need to make changes?</strong></p>
        <p style="margin: 0;">You can manage your booking, select seats, or add baggage in your TripAlfa account. Changes may be subject to airline policies and fees.</p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee; font-size: 12px; color: #999;">
      <p style="margin: 0 0 10px 0;">
        <strong>TripAlfa Bookings</strong><br>
        This is a transactional email. Please don't reply to this email.
      </p>
      <p style="margin: 0;">
        <a href="https://tripalfa.com/privacy" style="color: #0066cc; text-decoration: none; margin: 0 10px;">Privacy Policy</a> •
        <a href="https://tripalfa.com/terms" style="color: #0066cc; text-decoration: none; margin: 0 10px;">Terms of Service</a> •
        <a href="https://tripalfa.com" style="color: #0066cc; text-decoration: none; margin: 0 10px;">Visit Website</a>
      </p>
      <p style="margin: 10px 0 0 0; color: #bbb;">© 2026 TripAlfa. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text version of booking confirmation
 */
export function generateBookingConfirmationText(order: OrderDetails): string {
  const segments = order.segments
    .map(
      (s, i) =>
        `Flight ${i + 1}: ${s.flightNumber} (${s.airline})
${s.departureTime} - ${s.departureCity} (${s.departureAirport})
${s.arrivalTime} - ${s.arrivalCity} (${s.arrivalAirport})`
    )
    .join('\n\n');

  const passengers = order.passengers.map((p) => `- ${p.name}`).join('\n');

  return `FLIGHT BOOKING CONFIRMATION

Hello ${order.customerName},

Thank you for booking with TripAlfa! Your flight booking is confirmed.

BOOKING REFERENCE: ${order.bookingReference}
Total Price: ${order.currency} ${order.totalPrice.toFixed(2)}

FLIGHTS:
${segments}

PASSENGERS:
${passengers}

Please keep this email for your records. Your booking reference is required for check-in.

For more information or to make changes, visit: https://tripalfa.com/bookings

Best regards,
TripAlfa Bookings Team`;
}
