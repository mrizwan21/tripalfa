import { sendEmail, EmailOptions } from '../services/mailjetEmailService';
import { generateEmailTemplate, type TemplateOptions, type EmailTemplateStyle } from '../templates/emailTemplateManager';
import { OrderDetails } from '../templates/bookingConfirmationEmailTemplate';
import logger from '../utils/logger';

/**
 * Extract booking confirmation details from Duffel webhook order data
 */
export function extractOrderDetails(orderData: any): OrderDetails | null {
  try {
    // Extract basic order info
    const bookingReference = orderData.id || orderData.booking_reference || 'UNKNOWN';
    const customerId = orderData.custom_metadata?.customer_id;

    // Extract customer email from passengers
    let customerEmail: string | null = null;
    let customerName = 'Traveler';

    if (orderData.passengers && orderData.passengers.length > 0) {
      const firstPassenger = orderData.passengers[0];
      customerEmail = firstPassenger.email;
      customerName = firstPassenger.name || 'Traveler';
    }

    // If no email in passengers, check order level
    if (!customerEmail && orderData.email) {
      customerEmail = orderData.email;
    }

    if (!customerEmail) {
      logger.warn('No customer email found in order data', { orderId: bookingReference, customerId });
      return null;
    }

    // Extract segments/flights
    const segments = (orderData.slices || []).flatMap((slice: any) =>
      (slice.segments || []).map((segment: any) => ({
        departureCity: segment.origin?.city_name || segment.origin?.iata_code || 'Unknown',
        departureAirport: segment.origin?.iata_code || 'N/A',
        departureTerminal: segment.origin?.icao_code ? getTerminalFromCode(segment.origin.icao_code) : segment.departure_terminal,
        departureTime: formatTime(segment.departing_at),
        departureDate: formatDate(segment.departing_at),
        arrivalCity: segment.destination?.city_name || segment.destination?.iata_code || 'Unknown',
        arrivalAirport: segment.destination?.iata_code || 'N/A',
        arrivalTerminal: segment.destination?.icao_code ? getTerminalFromCode(segment.destination.icao_code) : segment.arrival_terminal,
        arrivalTime: formatTime(segment.arriving_at),
        flightNumber: segment.operating_flight_number || segment.flight_number || 'N/A',
        airline: segment.airlines?.[0]?.name || 'Airline',
        operatingAirline: segment.operating_carrier?.name,
        aircraftType: segment.aircraft?.name,
        duration: calculateDuration(segment.departing_at, segment.arriving_at),
        cabinClass: extractCabinClass(orderData.passengers, segment.id),
      }))
    );

    // Extract passengers with cabin class and seat info
    const passengers = (orderData.passengers || []).map((p: any) => ({
      name: p.name || (p.given_name && p.family_name ? `${p.given_name} ${p.family_name}` : 'Passenger'),
      email: p.email,
      cabinClass: p.cabin_class,
      seatNumber: extractFirstSeatNumber(p),
    }));

    // Extract pricing with breakdown
    const totalPrice = parseFloat(orderData.total_price || orderData.total_amount || '0');
    const basePrice = orderData.base_amount ? parseFloat(orderData.base_amount) : undefined;
    const taxPrice = orderData.tax_amount ? parseFloat(orderData.tax_amount) : undefined;
    const currency = orderData.total_currency || 'USD';

    // Extract baggage and meals if available
    const mealInclusions = extractMealInclusions(orderData);
    const baggageAllowance = extractBaggageAllowance(orderData);
    const seatSelections = extractSeatSelections(orderData);

    // Extract payment method if available
    const paymentMethod = extractPaymentMethod(orderData);

    // Extract booking date
    const bookingDate = orderData.created_at ? formatDate(orderData.created_at) : undefined;

    return {
      bookingReference,
      customerName,
      customerEmail,
      totalPrice,
      basePrice,
      taxPrice,
      currency,
      passengers,
      segments,
      mealInclusions,
      baggageAllowance,
      paymentMethod,
      bookingDate,
    };
  } catch (error) {
    logger.error('Error extracting order details from webhook data', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(
  orderData: any,
  options?: { sendPlainText?: boolean; templateStyle?: EmailTemplateStyle; templateOptions?: TemplateOptions }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const orderDetails = extractOrderDetails(orderData);

    if (!orderDetails) {
      logger.warn('Could not extract order details for booking confirmation email');
      return { success: false, error: 'Invalid order details' };
    }

    // Generate email content using template manager
    const { html: htmlContent, text: textContent } = generateEmailTemplate(orderDetails, options?.templateOptions || {});

    // Prepare email options
    const emailOptions: EmailOptions = {
      to: orderDetails.customerEmail,
      subject: `Flight Booking Confirmation - ${orderDetails.bookingReference}`,
      htmlContent,
      textContent: options?.sendPlainText ? textContent : undefined,
      fromEmail: process.env.MAILJET_FROM_EMAIL || 'bookings@tripalfa.com',
      fromName: 'TripAlfa Bookings',
    };

    // Send via Mailjet
    const result = await sendEmail(emailOptions);

    if (result.success) {
      logger.info('Booking confirmation email sent successfully', {
        bookingReference: orderDetails.bookingReference,
        customerId: orderData.custom_metadata?.customer_id,
        messageId: result.messageId,
        recipientEmail: orderDetails.customerEmail,
        templateStyle: options?.templateStyle || 'default',
      });
    } else {
      logger.warn('Failed to send booking confirmation email', {
        bookingReference: orderDetails.bookingReference,
        error: result.error,
      });
    }

    return result;
  } catch (error) {
    logger.error('Error sending booking confirmation email', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Helper functions to extract specific data from Duffel order
 */

function extractMealInclusions(orderData: any): string[] | undefined {
  const meals: string[] = [];

  if (orderData.slices) {
    orderData.slices.forEach((slice: any) => {
      if (slice.segments) {
        slice.segments.forEach((segment: any) => {
          if (segment.passengers) {
            segment.passengers.forEach((passenger: any) => {
              if (passenger.baggages && passenger.baggages.length > 0) {
                passenger.baggages.forEach((baggage: any) => {
                  if (baggage.type === 'meal' || baggage.description?.includes('meal')) {
                    if (!meals.includes(baggage.description || 'Meal')) {
                      meals.push(baggage.description || 'Standard Meal');
                    }
                  }
                });
              }
            });
          }
        });
      }
    });
  }

  return meals.length > 0 ? meals : undefined;
}

function extractBaggageAllowance(orderData: any): { checked: number; carry: number } | undefined {
  let checked = 0;
  let carry = 1; // default carry-on

  try {
    if (orderData.slices) {
      orderData.slices.forEach((slice: any) => {
        if (slice.segments) {
          slice.segments.forEach((segment: any) => {
            if (segment.passengers) {
              segment.passengers.forEach((passenger: any) => {
                if (passenger.baggages && passenger.baggages.length > 0) {
                  passenger.baggages.forEach((baggage: any) => {
                    if (baggage.type === 'checked_bag') {
                      checked++;
                    } else if (baggage.type === 'carry_on') {
                      carry++;
                    }
                  });
                }
              });
            }
          });
        }
      });
    }

    return checked > 0 || carry > 1 ? { checked, carry } : undefined;
  } catch (error) {
    logger.warn('Error extracting baggage allowance', { error });
    return undefined;
  }
}

function extractSeatSelections(orderData: any): string[] | undefined {
  const seats: string[] = [];

  try {
    if (orderData.passengers) {
      orderData.passengers.forEach((passenger: any) => {
        if (passenger.seat_selections && passenger.seat_selections.length > 0) {
          passenger.seat_selections.forEach((seat: any) => {
            seats.push(`${passenger.name}: ${seat.seat_number}`);
          });
        }
      });
    }

    return seats.length > 0 ? seats : undefined;
  } catch (error) {
    logger.warn('Error extracting seat selections', { error });
    return undefined;
  }
}

function extractPaymentMethod(orderData: any): string | undefined {
  // This would depend on your payment processing integration
  // Common methods: credit_card, bank_transfer, wallet, etc.
  return orderData.payment_method_type || orderData.payment_method || undefined;
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return 'N/A';
  }
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

/**
 * Calculate flight duration in HH:MM format
 */
function calculateDuration(departingAt: string, arrivingAt: string): string {
  try {
    const departure = new Date(departingAt);
    const arrival = new Date(arrivingAt);
    const diffMs = arrival.getTime() - departure.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  } catch {
    return '';
  }
}

/**
 * Extract cabin class from passenger data for a specific segment
 */
function extractCabinClass(passengers: any[], segmentId: string): string | undefined {
  try {
    if (!passengers || passengers.length === 0) return undefined;
    
    // Try to find cabin_class in passenger data
    for (const passenger of passengers) {
      if (passenger.cabin_class) {
        return passenger.cabin_class;
      }
      // Try to find in segment reference
      if (passenger.segment_ids?.includes(segmentId) && passenger.cabin_class) {
        return passenger.cabin_class;
      }
    }
    return undefined;
  } catch (error) {
    logger.warn('Error extracting cabin class', { error });
    return undefined;
  }
}

/**
 * Extract first seat number from passenger
 */
function extractFirstSeatNumber(passenger: any): string | undefined {
  try {
    if (passenger.seat_designator) {
      return passenger.seat_designator;
    }
    if (passenger.seat_selections && passenger.seat_selections.length > 0) {
      return passenger.seat_selections[0].seat_number || passenger.seat_selections[0];
    }
    return undefined;
  } catch (error) {
    logger.warn('Error extracting seat number', { error });
    return undefined;
  }
}

/**
 * Get terminal from airport code (basic implementation)
 */
function getTerminalFromCode(code: string): string | undefined {
  // This is a simple implementation - in production, you might want to fetch this from an airport database
  try {
    // If the code contains terminal info, extract it
    const terminalMatch = code.match(/[A-Z]?\d{1,2}$/);
    if (terminalMatch) {
      return terminalMatch[0];
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export default {
  extractOrderDetails,
  sendBookingConfirmationEmail,
};
