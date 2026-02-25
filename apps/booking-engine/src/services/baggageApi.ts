/**
 * Baggage Management API Service
 * 
 * Handles all baggage-related operations:
 * - Eligibility checking for baggage services
 * - Baggage availability and pricing
 * - Baggage booking and management
 * - Booked baggage retrieval and modifications
 * 
 * Routes through centralized API for consistency
 */

import { api } from '../lib/api';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BaggageEligibility {
  offerId: string;
  isEligible: boolean;
  maxBags?: number;
  maxWeight?: number;
  maxDimensions?: string;
  restrictions?: string[];
  reason?: string;
}

export interface BaggageService {
  id: string;
  type: 'checked' | 'carry-on' | 'personal';
  quantity: number;
  weight: number;
  price: number;
  currency: string;
  airline: string;
  restrictions?: string[];
}

export interface AvailableBaggageServices {
  offerId: string;
  services: BaggageService[];
  totalPrice: number;
  currency: string;
  maxSelectableQuantity: number;
}

export interface BookedBaggage {
  orderId: string;
  services: BaggageService[];
  passengers: Array<{
    passengerId: string;
    baggageItems: Array<{
      type: 'checked' | 'carry-on' | 'personal';
      quantity: number;
      weight: number;
    }>;
  }>;
  totalCost: number;
  currency: string;
}

// ============================================================================
// BAGGAGE ELIGIBILITY CHECK
// ============================================================================

/**
 * Check if baggage services are available for a specific offer
 * 
 * Determines eligibility based on:
 * - Airline policies
 * - Route restrictions
 * - Passenger type
 * 
 * @param offerId - Flight offer ID
 * @param selectedPassengers - Array of passenger IDs (optional)
 * @returns Eligibility status with restrictions
 */
export async function checkBaggageEligibility(
  offerId: string,
  selectedPassengers?: string[]
): Promise<BaggageEligibility> {
  try {
    console.log('[Baggage] Checking baggage eligibility for offer:', offerId);

    const result = await api.post<any>(
      '/api/bookings/baggage/eligibility',
      { offerId, selectedPassengers: selectedPassengers || [] }
    );

    console.log('[Baggage] Eligibility check completed:', result);
    return result.data || result;
  } catch (error) {
    console.error('[Baggage] Eligibility check error:', error);
    throw error;
  }
}

// ============================================================================
// AVAILABLE BAGGAGE SERVICES
// ============================================================================

/**
 * Get all available baggage services for an offer
 * 
 * Returns:
 * - Available baggage types (checked, carry-on, etc.)
 * - Pricing for each service
 * - Quantity limits
 * - Airline-specific restrictions
 * 
 * @param offerId - Flight offer ID
 * @param passengers - Array of passenger IDs to get services for
 * @returns Available baggage options with pricing
 */
export async function getAvailableBaggage(
  offerId: string,
  passengers: string[] = []
): Promise<AvailableBaggageServices> {
  try {
    console.log('[Baggage] Fetching available baggage services for offer:', offerId);

    const result = await api.get<any>(
      `/api/bookings/orders/${offerId}/available-baggage?passengers=${passengers.join(',')}`
    );

    console.log('[Baggage] Services retrieved:', result);
    return result.data || result;
  } catch (error) {
    console.error('[Baggage] Get services error:', error);
    throw error;
  }
}

// ============================================================================
// BOOK BAGGAGE
// ============================================================================

/**
 * Book baggage services for passengers
 * 
 * Adds baggage to the booking with:
 * - Selected baggage quantities
 * - Per-passenger assignments
 * - Price confirmation
 * 
 * @param offerId - Flight offer ID
 * @param baggageSelections - Baggage choices per passenger
 * @returns Booking confirmation with total price
 */
export async function bookBaggage(
  offerId: string,
  baggageSelections: Array<{
    passengerId: string;
    baggageType: 'checked' | 'carry-on' | 'personal';
    quantity: number;
  }>
): Promise<BookedBaggage> {
  try {
    console.log('[Baggage] Booking baggage services:', { offerId, selections: baggageSelections });

    const result = await api.post<any>(
      `/api/bookings/orders/${offerId}/book-baggage`,
      { offerId, baggageSelections }
    );

    console.log('[Baggage] Baggage booked successfully:', result);
    return result.data || result;
  } catch (error) {
    console.error('[Baggage] Book baggage error:', error);
    throw error;
  }
}

// ============================================================================
// GET BOOKED BAGGAGE
// ============================================================================

/**
 * Retrieve current booked baggage for an order
 * 
 * Shows all baggage items currently associated with:
 * - Specific passengers
 * - Specific order
 * - Total cost breakdown
 * 
 * @param orderId - Duffel order ID
 * @returns Booked baggage details
 */
export async function getBookedBaggage(
  orderId: string
): Promise<BookedBaggage> {
  try {
    console.log('[Baggage] Fetching booked baggage for order:', orderId);

    const result = await api.get<any>(
      `/api/bookings/orders/${orderId}/baggage-services`
    );

    console.log('[Baggage] Booked baggage retrieved:', result);
    return result.data || result;
  } catch (error) {
    console.error('[Baggage] Get booked baggage error:', error);
    throw error;
  }
}

/**
 * Get baggage information for all passengers in an order
 * 
 * @param orderId - Duffel order ID
 * @returns Array of baggage details per passenger
 */
export async function getBaggageByPassenger(
  orderId: string
): Promise<Map<string, BaggageService[]>> {
  try {
    const booked = await getBookedBaggage(orderId);
    
    const baggageMap = new Map<string, BaggageService[]>();
    booked.passengers.forEach(passenger => {
      const services = passenger.baggageItems.map(item => ({
        id: `${passenger.passengerId}-${item.type}`,
        type: item.type,
        quantity: item.quantity,
        weight: item.weight,
        price: 0, // Calculated at booking time
        currency: booked.currency,
        airline: 'Unknown'
      }));
      baggageMap.set(passenger.passengerId, services);
    });

    return baggageMap;
  } catch (error) {
    console.error('[Baggage] Get baggage by passenger error:', error);
    throw error;
  }
}
