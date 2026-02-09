/**
 * Duffel Seat Maps API Service
 * 
 * IMPORTANT: All API calls are routed through the centralized API Manager.
 * This ensures consistency, auth, rate limiting, and monitoring across all services.
 * 
 * Routes:
 * - Booking Flow: Seat selection during offer/order creation
 * - Post-Booking: Seat management for existing orders
 */

import { API_BASE_URL } from '../lib/constants';
import { SeatMap, SelectedSeat } from './duffelBookingApi';

const API_KEY = import.meta.env.VITE_API_KEY || '';

// ============================================================================
// SEAT MAP TYPES & INTERFACES
// ============================================================================

/**
 * Aircraft configuration for dynamic seat layout rendering
 */
export interface AircraftConfig {
  aircraftType: string;        // e.g., 'Boeing 777', 'Airbus A320'
  bodyType: 'narrow' | 'wide' | 'regional';  // Determines layout
  aisles: number;              // Number of aisles
  cabinLayouts: CabinLayout[]; // Layout per cabin class
}

/**
 * Cabin layout configuration
 */
export interface CabinLayout {
  cabinClass: string;          // 'economy', 'business', etc.
  seatsPerRow: number;         // Total seats in a row
  rowPattern: string;          // e.g., '3-3' for narrow body, '3-4-3' for widebody
  firstRow: number;            // First row number
  lastRow: number;             // Last row number
  seatPitch: number;           // Distance between rows in inches
  seatWidth: number;           // Seat width in inches
}

/**
 * Seat map response with aircraft info
 */
export interface SeatMapWithAircraft extends SeatMap {
  aircraft_config?: AircraftConfig;
  aircraft_type?: string;      // Aircraft type code
}

/**
 * Post-booking seat selection response
 */
export interface PostBookingSeatResponse {
  orderId: string;
  selectedSeats: SelectedSeat[];
  totalCost: number;
  currency: string;
  bookingReference?: string;
}

// ============================================================================
// COMMON TYPES FOR BOTH FLOWS
// ============================================================================

/**
 * Context for seat operations - distinguishes between booking and post-booking
 */
export type SeatOperationContext = 'booking' | 'post-booking' | 'management';

/**
 * Seat operation request with context
 */
export interface SeatOperationRequest {
  context: SeatOperationContext;
  orderId?: string;            // For post-booking operations
  offerId?: string;            // For booking flow
  provider?: string;
  environment?: string;
}

// ============================================================================
// PRE-BOOKING FLOW: Seat selection during offer/order creation
// ============================================================================

/**
 * Get seat maps for an offer during booking flow
 * Routes through: API Manager → Booking Service → Duffel API
 * 
 * @param offerId - The active offer ID
 * @param provider - API provider (default: 'duffel')
 * @param environment - Environment (default: 'test')
 * @returns Array of seat maps with aircraft configuration
 */
export async function getSeatMaps(
  offerId: string,
  provider: string = 'duffel',
  environment: string = 'test'
): Promise<SeatMapWithAircraft[]> {
  try {
    console.log('[SeatMaps] Fetching seat maps for offer (BOOKING FLOW):', offerId);

    // Route through centralized API Manager
    const response = await fetch(
      `${API_BASE_URL}/api/bookings/flight/seat-maps`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'X-Seat-Context': 'booking',  // Header to indicate booking flow
        },
        body: JSON.stringify({
          offerId,
          provider,
          environment,
          context: 'booking'
        }),
        credentials: 'include'
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch seat maps: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[SeatMaps] Seat maps retrieved (BOOKING):', result);

    return result.data || result.seatMaps || [];
  } catch (error) {
    console.error('[SeatMaps] Get seat maps error:', error);
    throw error;
  }
}

/**
 * Select seats for passengers during booking flow
 * Routes through: API Manager → Booking Service → Duffel API
 * 
 * @param offerId - The active offer ID
 * @param selectedSeats - Array of seat selections
 * @param provider - API provider (default: 'duffel')
 * @param environment - Environment (default: 'test')
 * @returns Confirmation of seat selection
 */
export async function selectSeats(
  offerId: string,
  selectedSeats: SelectedSeat[],
  provider: string = 'duffel',
  environment: string = 'test'
): Promise<any> {
  try {
    console.log('[SeatMaps] Selecting seats (BOOKING FLOW):', selectedSeats);

    // Route through centralized API Manager
    const response = await fetch(
      `${API_BASE_URL}/api/bookings/flight/seat-maps/select`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'X-Seat-Context': 'booking'
        },
        body: JSON.stringify({
          offerId,
          selectedSeats,
          provider,
          environment,
          context: 'booking'
        }),
        credentials: 'include'
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to select seats: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[SeatMaps] Seats selected successfully (BOOKING):', result);

    return result.data || result;
  } catch (error) {
    console.error('[SeatMaps] Select seats error:', error);
    throw error;
  }
}

// ============================================================================
// POST-BOOKING FLOW: Seat management after booking is made
// ============================================================================

/**
 * Get seat maps for an existing booking (post-booking seat selection/changes)
 * Routes through: API Manager → Booking Service → Duffel API
 * 
 * Allows users to:
 * - View available seat changes
 * - Add seats not selected during booking
 * - Modify previously selected seats
 * - Manage seats for all passengers
 * 
 * @param orderId - The confirmed order/booking ID
 * @param provider - API provider (default: 'duffel')
 * @param environment - Environment (default: 'test')
 * @returns Seat maps for the booking with current selections
 */
export async function getSeatMapsForBooking(
  orderId: string,
  provider: string = 'duffel',
  environment: string = 'test'
): Promise<SeatMapWithAircraft[]> {
  try {
    console.log('[SeatMaps] Fetching seat maps for booking (POST-BOOKING FLOW):', orderId);

    // Route through centralized API Manager
    const response = await fetch(
      `${API_BASE_URL}/api/bookings/flight/seat-maps/booking/${orderId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'X-Seat-Context': 'post-booking'
        },
        body: JSON.stringify({
          orderId,
          provider,
          environment,
          context: 'post-booking'
        }),
        credentials: 'include'
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch seat maps for booking: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[SeatMaps] Seat maps retrieved (POST-BOOKING):', result);

    return result.data || result.seatMaps || [];
  } catch (error) {
    console.error('[SeatMaps] Get seat maps for booking error:', error);
    throw error;
  }
}

/**
 * Update seat selections for an existing booking
 * Routes through: API Manager → Booking Service → Duffel API
 * 
 * Allows modifying seat selections after booking is confirmed.
 * May involve:
 * - Seat change fees
 * - Seat upgrade charges
 * - Refunds if downgrading
 * 
 * @param orderId - The confirmed order/booking ID
 * @param selectedSeats - Array of seat selections to update/add
 * @param provider - API provider (default: 'duffel')
 * @param environment - Environment (default: 'test')
 * @returns Updated seat selections with cost changes
 */
export async function updateBookingSeats(
  orderId: string,
  selectedSeats: SelectedSeat[],
  provider: string = 'duffel',
  environment: string = 'test'
): Promise<PostBookingSeatResponse> {
  try {
    console.log('[SeatMaps] Updating seats for booking (POST-BOOKING):', orderId, selectedSeats);

    // Route through centralized API Manager
    const response = await fetch(
      `${API_BASE_URL}/api/bookings/flight/update-seats/${orderId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'X-Seat-Context': 'post-booking'
        },
        body: JSON.stringify({
          orderId,
          selectedSeats,
          provider,
          environment,
          context: 'post-booking'
        }),
        credentials: 'include'
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update booking seats: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[SeatMaps] Booking seats updated successfully:', result);

    return result.data || result;
  } catch (error) {
    console.error('[SeatMaps] Update booking seats error:', error);
    throw error;
  }
}

/**
 * Get seat selection history for a booking
 * Useful for displaying what changes were made and when
 */
export async function getBookingSeatHistory(
  orderId: string,
  provider: string = 'duffel',
  environment: string = 'test'
): Promise<any[]> {
  try {
    console.log('[SeatMaps] Fetching seat history for booking (POST-BOOKING):', orderId);

    const response = await fetch(
      `${API_BASE_URL}/api/bookings/flight/seat-history/${orderId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          'X-Seat-Context': 'post-booking'
        },
        credentials: 'include'
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch seat history: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('[SeatMaps] Seat history retrieved:', result);

    return result.data || [];
  } catch (error) {
    console.error('[SeatMaps] Get seat history error:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS (Used by both flows)
// ============================================================================

/**
 * Get seat map for a specific segment
 * Works with both booking and post-booking contexts
 */
export async function getSeatMapForSegment(
  {offerId, orderId, segmentId, context}: 
  {
    offerId?: string;
    orderId?: string;
    segmentId: string;
    context: SeatOperationContext;
  },
  provider: string = 'duffel',
  environment: string = 'test'
): Promise<SeatMapWithAircraft | null> {
  try {
    console.log(`[SeatMaps] Fetching seat map for segment (${context}):`, segmentId);

    let seatMaps: SeatMapWithAircraft[];

    if (context === 'booking' && offerId) {
      seatMaps = await getSeatMaps(offerId, provider, environment);
    } else if ((context === 'post-booking' || context === 'management') && orderId) {
      seatMaps = await getSeatMapsForBooking(orderId, provider, environment);
    } else {
      throw new Error(`Invalid context or missing parameters for context: ${context}`);
    }

    const segmentMap = seatMaps.find(map => map.segment_id === segmentId);

    if (!segmentMap) {
      console.log(`[SeatMaps] No seat map available for segment (${context}):`, segmentId);
      return null;
    }

    return segmentMap;
  } catch (error) {
    console.error('[SeatMaps] Get seat map for segment error:', error);
    throw error;
  }
}

/**
 * Determine cabin layout based on aircraft configuration
 * Used for dynamic seat grid rendering
 * 
 * Returns layout pattern for rendering seats dynamically
 */
export function getAircraftLayout(aircraft: AircraftConfig): CabinLayout | null {
  if (!aircraft) return null;

  const cabinClass = 'economy'; // Default to economy
  return aircraft.cabinLayouts.find(c => c.cabinClass === cabinClass) || null;
}

/**
 * Parse seat row pattern and return seat arrangement
 * e.g., '3-3' -> [3, 3]
 * e.g., '3-4-3' -> [3, 4, 3]
 */
export function parseSeatPattern(pattern: string): number[] {
  return pattern.split('-').map(n => parseInt(n, 10));
}

/**
 * Generate seat designators based on aircraft layout
 * Useful for dynamic rendering without relying on API response
 */
export function generateSeatDesignators(
  rowNumber: number,
  seatPattern: number[]
): string[] {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const totalSeats = seatPattern.reduce((a, b) => a + b, 0);
  
  return Array.from({ length: totalSeats }, (_, i) => 
    `${rowNumber}${letters[i]}`
  );
}
