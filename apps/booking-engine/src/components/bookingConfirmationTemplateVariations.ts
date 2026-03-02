/**
 * Email Template Variations
 * Multiple design styles for booking confirmation emails
 */

import type { OrderDetails } from "./bookingConfirmationEmailTemplate";
import type { TemplateOptions } from "./emailTemplateManager";
import { COLORS } from "../lib/constants/theme";

/**
 * Modern Minimal Template - Clean, minimalist design
 */
export function generateModernMinimalTemplate(
  order: OrderDetails,
  options: TemplateOptions = {},
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed - ${order.bookingReference}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background: ${COLORS.slate[50]}; margin: 0; padding: 0; }
    .container { max-width: 580px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, ${COLORS.info} 0%, ${COLORS.primary} 100%); color: ${COLORS.white}; padding: 40px 20px; text-align: center; }
    .header h1 { margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 1px; }
    .content { padding: 40px 20px; }
    .reference-card { background: ${COLORS.slate[100]}; border-left: 4px solid ${COLORS.info}; padding: 20px; margin: 30px 0; text-align: center; }
    .reference-code { font-size: 28px; font-weight: bold; color: ${COLORS.slate[700]}; letter-spacing: 2px; font-family: monospace; }
    .flight-block { margin: 30px 0; padding-bottom: 30px; border-bottom: 1px solid ${COLORS.slate[200]}; }
    .flight-header { font-size: 13px; text-transform: uppercase; color: ${COLORS.slate[400]}; margin-bottom: 15px; font-weight: 600; }
    .route { display: grid; grid-template-columns: 1fr auto 1fr; gap: 20px; align-items: center; margin: 20px 0; }
    .airport { text-align: center; }
    .airport-code { font-size: 20px; font-weight: bold; color: ${COLORS.slate[700]}; }
    .airport-city { font-size: 12px; color: ${COLORS.slate[500]}; margin-top: 5px; }
    .time-container { font-size: 24px; font-weight: bold; color: ${COLORS.info}; }
    .arrow { color: ${COLORS.slate[300]}; font-size: 28px; }
    .flight-info { font-size: 12px; color: ${COLORS.slate[500]}; margin-top: 15px; }
    .passenger-list { margin: 20px 0; }
    .passenger-item { padding: 10px 0; font-size: 13px; color: ${COLORS.slate[700]}; }
    .price-section { background: ${COLORS.slate[50]}; padding: 20px; border-radius: 8px; margin: 30px 0; text-align: center; }
    .price-total { font-size: 32px; font-weight: bold; color: ${COLORS.slate[700]}; margin: 10px 0; }
    .price-currency { font-size: 14px; color: ${COLORS.slate[400]}; }
    .button { display: inline-block; background: ${COLORS.info}; color: ${COLORS.white}; padding: 12px 30px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 600; margin: 20px 5px; }
    .footer { background: ${COLORS.slate[50]}; padding: 30px 20px; text-align: center; font-size: 12px; color: ${COLORS.slate[400]}; border-top: 1px solid ${COLORS.slate[200]}; }
    @media (max-width: 600px) { .content { padding: 20px; } .route { gap: 10px; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓</h1>
      <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Booking Confirmed</p>
    </div>

    <div class="content">
      <p style="margin: 0 0 20px 0; color: ${COLORS.slate[500]}; font-size: 14px;">Hello <strong>${order.customerName}</strong>,</p>

      <div class="reference-card">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: ${COLORS.slate[400]}; text-transform: uppercase;">Reference</p>
        <div class="reference-code">${order.bookingReference}</div>
      </div>

      ${order.segments
        .map(
          (segment, i) => `
        <div class="flight-block">
          <div class="flight-header">Flight ${i + 1}</div>
          <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600;">
            ${segment.flightNumber} • ${segment.airline}
            ${options.includeDuration && segment.duration ? ` • ${segment.duration}` : ""}
          </p>
          <div class="route">
            <div class="airport">
              <div class="time-container">${segment.departureTime}</div>
              <div class="airport-code">${segment.departureAirport}</div>
              <div class="airport-city">${segment.departureCity}</div>
            </div>
            <div class="arrow">✈</div>
            <div class="airport">
              <div class="time-container">${segment.arrivalTime}</div>
              <div class="airport-code">${segment.arrivalAirport}</div>
              <div class="airport-city">${segment.arrivalCity}</div>
            </div>
          </div>
          <div class="flight-info">${segment.departureDate}${options.includeOperatingAirline && segment.operatingAirline ? ` • Operated by ${segment.operatingAirline}` : ""}</div>
        </div>
      `,
        )
        .join("")}

      <div style="margin: 30px 0; padding-top: 30px; border-top: 1px solid ${COLORS.slate[200]};">
        <h3 style="margin: 0 0 15px 0; font-size: 14px; color: ${COLORS.slate[700]}; text-transform: uppercase;">Passengers</h3>
        <div class="passenger-list">
          ${order.passengers
            .map(
              (p) => `
            <div class="passenger-item">
              ${p.name}
              ${options.includeSeatInfo && p.seatNumber ? ` • Seat ${p.seatNumber}` : ""}
              ${options.includeSeatInfo && p.cabinClass ? ` • ${p.cabinClass}` : ""}
            </div>
          `,
            )
            .join("")}
        </div>
      </div>

      <div class="price-section">
        <span class="price-currency">${options.includePricingBreakdown && order.basePrice ? "Your total" : "Total amount"}</span>
        <div class="price-total">${order.currency} ${order.totalPrice.toFixed(2)}</div>
        ${options.includePricingBreakdown && order.basePrice ? `<p style="margin: 10px 0 0 0; font-size: 11px; color: ${COLORS.slate[400]};">Fare: ${order.currency} ${order.basePrice.toFixed(2)} + ${order.currency} ${(order.taxPrice || 0).toFixed(2)} taxes</p>` : ""}
      </div>

      <div style="text-align: center;">
        <a href="https://tripalfa.com/bookings/${order.bookingReference}" class="button">View Booking</a>
        <a href="https://tripalfa.com/support" class="button" style="background: ${COLORS.slate[300]};">Get Help</a>
      </div>
    </div>

    <div class="footer">
      <p style="margin: 0;">© 2026 TripAlfa. All rights reserved.</p>
      <p style="margin: 5px 0 0 0;">This is a transactional email. <a href="#" style="color: ${COLORS.info}; text-decoration: none;">Manage preferences</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Compact Template - Space-efficient for quick scanning
 */
export function generateCompactTemplate(
  order: OrderDetails,
  options: TemplateOptions = {},
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmed</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; background: ${COLORS.slate[100]}; margin: 0; padding: 15px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    
    <!-- Compact Header -->
    <div style="background: ${COLORS.primary}; color: ${COLORS.white}; padding: 25px 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 24px;">✓ Booking Confirmed</h1>
      <p style="margin: 5px 0 0 0; font-size: 13px; color: ${COLORS.slate[300]};">${order.bookingReference}</p>
    </div>

    <div style="padding: 25px 20px;">
      <!-- Quick Reference -->
      <table style="width: 100%; margin-bottom: 20px; font-size: 12px;">
        <tr>
          <td style="padding: 5px 0; color: ${COLORS.slate[400]};">Name:</td>
          <td style="padding: 5px 0; text-align: right; font-weight: 600;">${order.customerName}</td>
        </tr>
        <tr>
          <td style="padding: 5px 0; color: ${COLORS.slate[400]};">Total:</td>
          <td style="padding: 5px 0; text-align: right; font-weight: 600;">${order.currency} ${order.totalPrice.toFixed(2)}</td>
        </tr>
      </table>

      <!-- Flights in compact format -->
      <div style="margin: 20px 0; padding-top: 20px; border-top: 1px solid ${COLORS.slate[200]};">
        ${order.segments
          .map(
            (s, i) => `
          <div style="margin-bottom: 12px; padding: 10px; background: ${COLORS.slate[50]}; border-radius: 4px; font-size: 12px;">
            <strong>${i + 1}. ${s.flightNumber}</strong> ${s.airline}
            <br/>
            <span style="color: ${COLORS.info}; font-weight: 600;">${s.departureAirport}</span> 
            ${s.departureTime} → 
            <span style="color: ${COLORS.info}; font-weight: 600;">${s.arrivalAirport}</span> 
            ${s.arrivalTime}
            ${options.includeSeatInfo && s.cabinClass ? `<br/><span style="color: ${COLORS.slate[400]};">${s.cabinClass}</span>` : ""}
          </div>
        `,
          )
          .join("")}
      </div>

      <!-- Passengers -->
      <div style="font-size: 12px; margin-top: 15px; padding-top: 15px; border-top: 1px solid ${COLORS.slate[200]};">
        <strong>Passengers (${order.passengers.length})</strong>
        <ul style="margin: 5px 0; padding-left: 16px; color: ${COLORS.slate[500]};">
          ${order.passengers.map((p) => `<li>${p.name}${options.includeSeatInfo && p.seatNumber ? ` • ${p.seatNumber}` : ""}</li>`).join("")}
        </ul>
      </div>

      <!-- Actions -->
      <div style="text-align: center; margin-top: 20px;">
        <a href="https://tripalfa.com/bookings/${order.bookingReference}" style="display: inline-block; background: ${COLORS.primary}; color: ${COLORS.white}; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: 600;">View Booking</a>
      </div>
    </div>

    <div style="background: ${COLORS.slate[50]}; padding: 15px 20px; text-align: center; font-size: 11px; color: ${COLORS.slate[400]}; border-top: 1px solid ${COLORS.slate[200]};">
      <p style="margin: 0;">© 2026 TripAlfa</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Detailed Template - Comprehensive with all information
 */
export function generateDetailedTemplate(
  order: OrderDetails,
  options: TemplateOptions = {},
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, sans-serif; background: ${COLORS.slate[100]}; margin: 0; padding: 20px;">
  <div style="max-width: 640px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(to right, ${COLORS.info} 0%, ${COLORS.primary} 100%); color: ${COLORS.white}; padding: 40px 20px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; font-weight: 300;">Flight Booking Confirmation</h1>
      <p style="margin: 15px 0 0 0; font-size: 14px; opacity: 0.9;">Reference: <strong>${order.bookingReference}</strong></p>
    </div>

    <div style="padding: 30px 20px;">
      
      <!-- Booking Details Card -->
      <div style="background: ${COLORS.slate[100]}; border: 1px solid ${COLORS.info}; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 13px;">
          <div>
            <p style="margin: 0 0 5px 0; color: ${COLORS.slate[500]}; text-transform: uppercase; font-size: 11px;">Passenger</p>
            <p style="margin: 0; font-weight: 600;">${order.customerName}</p>
          </div>
          <div>
            <p style="margin: 0 0 5px 0; color: ${COLORS.slate[500]}; text-transform: uppercase; font-size: 11px;">Booking Date</p>
            <p style="margin: 0; font-weight: 600;">${order.bookingDate || new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <!-- Detailed Flight Information -->
      ${order.segments
        .map(
          (segment, index) => `
        <div style="margin-bottom: 25px; padding-bottom: 25px; border-bottom: 1px solid ${COLORS.slate[200]};">
          <h3 style="margin: 0 0 15px 0; font-size: 14px; color: ${COLORS.slate[700]}; text-transform: uppercase;">Flight ${index + 1}</h3>
          
          <table style="width: 100%; font-size: 12px; margin-bottom: 15px;">
            <tr>
              <td style="padding: 8px 0; color: ${COLORS.slate[500]};">Flight Number</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600;">${segment.flightNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${COLORS.slate[500]};">Airline</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600;">
                ${segment.airline}
                ${options.includeOperatingAirline && segment.operatingAirline ? ` <br/><span style="font-size: 11px; color: ${COLORS.slate[400]};">(Operated by ${segment.operatingAirline})</span>` : ""}
              </td>
            </tr>
            <tr style="border-top: 1px solid ${COLORS.slate[200]};">
              <td style="padding: 8px 0; color: ${COLORS.slate[500]};">Departure</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600;">
                ${segment.departureTime} - ${segment.departureAirport}
                ${options.includeTerminals && segment.departureTerminal ? ` (T${segment.departureTerminal})` : ""}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: ${COLORS.slate[500]};">Arrival</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600;">
                ${segment.arrivalTime} - ${segment.arrivalAirport}
                ${options.includeTerminals && segment.arrivalTerminal ? ` (T${segment.arrivalTerminal})` : ""}
              </td>
            </tr>
            ${
              options.includeDuration && segment.duration
                ? `
            <tr>
              <td style="padding: 8px 0; color: ${COLORS.slate[500]};">Duration</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600;">${segment.duration}</td>
            </tr>
            `
                : ""
            }
            ${
              segment.aircraftType
                ? `
            <tr>
              <td style="padding: 8px 0; color: ${COLORS.slate[500]};">Aircraft</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600;">${segment.aircraftType}</td>
            </tr>
            `
                : ""
            }
            ${
              segment.cabinClass
                ? `
            <tr>
              <td style="padding: 8px 0; color: ${COLORS.slate[500]};">Class</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600;">${segment.cabinClass}</td>
            </tr>
            `
                : ""
            }
          </table>
        </div>
      `,
        )
        .join("")}

      <!-- Passenger Details -->
      <div style="margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 14px; color: ${COLORS.slate[700]}; text-transform: uppercase;">Passengers</h3>
        <table style="width: 100%; font-size: 12px;">
          ${order.passengers
            .map(
              (p) => `
            <tr style="border-bottom: 1px solid ${COLORS.slate[200]};">
              <td style="padding: 10px 0; color: ${COLORS.slate[700]};">${p.name}</td>
              <td style="padding: 10px 0; text-align: right; color: ${COLORS.slate[400]};">
                ${options.includeSeatInfo && p.cabinClass ? `${p.cabinClass}` : ""}
                ${options.includeSeatInfo && p.seatNumber ? ` • Seat ${p.seatNumber}` : ""}
              </td>
            </tr>
          `,
            )
            .join("")}
        </table>
      </div>

      <!-- Price Breakdown -->
      <div style="background: ${COLORS.slate[100]}; padding: 20px; border-radius: 6px; margin-bottom: 25px;">
        <h3 style="margin: 0 0 15px 0; font-size: 13px; color: ${COLORS.slate[700]}; text-transform: uppercase;">Your Trip Receipt</h3>
        <table style="width: 100%; font-size: 12px;">
          ${
            options.includePricingBreakdown && order.basePrice
              ? `
            <tr>
              <td style="padding: 5px 0; color: ${COLORS.slate[500]};">Fare</td>
              <td style="padding: 5px 0; text-align: right;">${order.currency} ${order.basePrice.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: ${COLORS.slate[500]};">Taxes & Fees</td>
              <td style="padding: 5px 0; text-align: right;">+ ${order.currency} ${(order.taxPrice || 0).toFixed(2)}</td>
            </tr>
            <tr style="border-top: 2px solid ${COLORS.info}; font-weight: bold; font-size: 13px;">
              <td style="padding: 8px 0;">TOTAL</td>
              <td style="padding: 8px 0; text-align: right; color: ${COLORS.info};">${order.currency} ${order.totalPrice.toFixed(2)}</td>
            </tr>
          `
              : `
            <tr style="border-top: 2px solid ${COLORS.info}; font-weight: bold; font-size: 13px;">
              <td style="padding: 8px 0;">TOTAL PAID</td>
              <td style="padding: 8px 0; text-align: right; color: ${COLORS.info};">${order.currency} ${order.totalPrice.toFixed(2)}</td>
            </tr>
          `
          }
        </table>
      </div>

      <!-- Important Info -->
      <div style="background: rgba(245, 158, 11, 0.12); border-left: 4px solid ${COLORS.warning}; padding: 15px; border-radius: 4px; margin-bottom: 25px; font-size: 12px; color: ${COLORS.slate[500]};">
        <strong style="color: ${COLORS.warning};">📌 Important Information</strong>
        <ul style="margin: 8px 0 0 0; padding-left: 18px;">
          <li>Arrive at airport 3 hours before international flights</li>
          <li>Keep your booking reference: <strong>${order.bookingReference}</strong></li>
          <li>Check airline baggage policies for restrictions</li>
        </ul>
      </div>

      <!-- Action Buttons -->
      <div style="text-align: center;">
        <a href="https://tripalfa.com/bookings/${order.bookingReference}" style="display: inline-block; background: ${COLORS.info}; color: ${COLORS.white}; padding: 12px 30px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 600; margin: 5px;">View Booking</a>
        <a href="https://tripalfa.com/support" style="display: inline-block; background: ${COLORS.slate[200]}; color: ${COLORS.slate[700]}; padding: 12px 30px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 600; margin: 5px;">Get Support</a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: ${COLORS.slate[50]}; padding: 20px; text-align: center; font-size: 11px; color: ${COLORS.slate[400]}; border-top: 1px solid ${COLORS.slate[200]};">
      <p style="margin: 0;">© 2026 TripAlfa Bookings</p>
      <p style="margin: 5px 0 0 0;">
        <a href="#" style="color: ${COLORS.info}; text-decoration: none;">Privacy</a> • 
        <a href="#" style="color: ${COLORS.info}; text-decoration: none;">Terms</a> • 
        <a href="#" style="color: ${COLORS.info}; text-decoration: none;">Manage Preferences</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}
