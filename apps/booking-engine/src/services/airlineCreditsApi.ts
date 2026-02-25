/**
 * Airline Credits API Service
 * 
 * Handles all airline credit-related operations:
 * - Retrieving customer airline credits
 * - Checking credits for specific bookings
 * - Managing credits usage
 * - Credit balance tracking
 * 
 * Routes through centralized API Manager for consistency
 */

import { api } from '../lib/api';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AirlineCredit {
  id: string;
  airline: string;
  airlineCode: string;
  creditAmount: number;
  currency: string;
  expiryDate: string;
  creditType: 'cash' | 'voucher' | 'miles' | 'points';
  restrictions?: string[];
  applicableRoutes?: string[];
  issueDate: string;
  source?: 'cancellation' | 'downgrade' | 'promotion' | 'refund';
}

export interface CustomerCredits {
  customerId: string;
  email: string;
  totalCreditsAmount: number;
  currency: string;
  credits: AirlineCredit[];
  lastUpdated: string;
}

export interface BookingCredits {
  bookingId: string;
  orderId: string;
  applicableCredits: AirlineCredit[];
  totalApplicableAmount: number;
  currency: string;
  utilizableAmount: number;
  reason?: string;
  lastUpdated: string;
}

// ============================================================================
// CUSTOMER AIRLINE CREDITS
// ============================================================================

/**
 * Get airline credits for a specific customer
 * 
 * Returns all available credits from:
 * - Previous cancellations
 * - Downgrades
 * - Promotions
 * - Refunds
 * 
 * @param customerId - Unique customer ID
 * @param email - Customer email (for verification)
 * @returns List of all available credits with details
 */
export async function getAirlineCredits(
  customerId: string,
  email?: string
): Promise<CustomerCredits> {
  try {
    console.log('[AirlineCredits] Fetching credits for customer:', customerId);

    const queryParams = new URLSearchParams({ customerId });
    if (email) {
      queryParams.append('email', email);
    }

    const result = await api.get<any>(
      `/api/admin/customers/${customerId}/airline-credits?${queryParams.toString()}`
    );

    console.log('[AirlineCredits] Customer credits retrieved:', {
      customerId,
      creditCount: result.data?.credits?.length || 0,
      totalAmount: result.data?.totalCreditsAmount
    });

    return result.data || result;
  } catch (error) {
    console.error('[AirlineCredits] Get customer credits error:', error);
    throw error;
  }
}

// ============================================================================
// BOOKING-SPECIFIC CREDITS
// ============================================================================

/**
 * Get airline credits applicable to a specific booking
 * 
 * Filters credits based on:
 * - Booking airline and route
 * - Credit expiry date (must not be expired)
 * - Credit restrictions and terms
 * - Booking total amount
 * 
 * @param bookingId - Internal booking ID
 * @param orderId - Duffel order ID
 * @param customerId - Customer ID (optional, derived from booking if not provided)
 * @returns Credits applicable to this booking
 */
export async function getBookingAirlineCredits(
  bookingId: string,
  orderId: string,
  customerId?: string
): Promise<BookingCredits> {
  try {
    console.log('[AirlineCredits] Fetching applicable credits for booking:', bookingId);

    const result = await api.post<any>(
      '/api/admin/airline-credits/booking',
      { bookingId, orderId, customerId: customerId || undefined }
    );

    console.log('[AirlineCredits] Booking credits retrieved:', {
      bookingId,
      creditCount: result.data?.applicableCredits?.length || 0,
      totalApplicable: result.data?.totalApplicableAmount
    });

    return result.data || result;
  } catch (error) {
    console.error('[AirlineCredits] Get booking credits error:', error);
    throw error;
  }
}

// ============================================================================
// CREDIT UTILITIES
// ============================================================================

/**
 * Check if customer has sufficient credits for a booking
 * 
 * @param bookingId - Internal booking ID
 * @param orderId - Duffel order ID
 * @param requiredAmount - Amount needed to cover
 * @returns Boolean indicating if sufficient credits exist
 */
export async function hassufficientCredits(
  bookingId: string,
  orderId: string,
  requiredAmount: number
): Promise<boolean> {
  try {
    const credits = await getBookingAirlineCredits(bookingId, orderId);
    return credits.utilizableAmount >= requiredAmount;
  } catch (error) {
    console.error('[AirlineCredits] Check sufficient credits error:', error);
    return false;
  }
}

/**
 * Get total credit balance summary for customer
 * 
 * @param customerId - Customer ID
 * @param email - Customer email (optional)
 * @returns Summary object with totals and counts
 */
export async function getCreditSummary(
  customerId: string,
  email?: string
): Promise<{
  totalCredits: number;
  creditsCount: number;
  expiringWithin30Days: number;
  expiredCredits: number;
  averageExpiryDays: number;
}> {
  try {
    const credits = await getAirlineCredits(customerId, email);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let expiringWithin30Days = 0;
    let expiredCredits = 0;
    let totalExpiryDays = 0;

    credits.credits.forEach(credit => {
      const expiryDate = new Date(credit.expiryDate);
      if (expiryDate < now) {
        expiredCredits++;
      } else if (expiryDate <= thirtyDaysFromNow) {
        expiringWithin30Days++;
      }
      totalExpiryDays += Math.floor((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    });

    return {
      totalCredits: credits.totalCreditsAmount,
      creditsCount: credits.credits.length,
      expiringWithin30Days,
      expiredCredits,
      averageExpiryDays: credits.credits.length > 0 ? Math.floor(totalExpiryDays / credits.credits.length) : 0
    };
  } catch (error) {
    console.error('[AirlineCredits] Get summary error:', error);
    throw error;
  }
}

/**
 * Get credits by airline
 * 
 * @param customerId - Customer ID
 * @param airline - Airline code (optional, if provided returns only credits for that airline)
 * @returns Grouped credits by airline
 */
export async function getCreditsByAirline(
  customerId: string,
  airline?: string
): Promise<Map<string, AirlineCredit[]>> {
  try {
    const credits = await getAirlineCredits(customerId);
    
    const creditsMap = new Map<string, AirlineCredit[]>();
    
    credits.credits
      .filter(credit => !airline || credit.airlineCode === airline)
      .forEach(credit => {
        const key = credit.airlineCode;
        if (!creditsMap.has(key)) {
          creditsMap.set(key, []);
        }
        creditsMap.get(key)!.push(credit);
      });

    return creditsMap;
  } catch (error) {
    console.error('[AirlineCredits] Get by airline error:', error);
    throw error;
  }
}

/**
 * Get data for credits display
 * Filters out expired credits and groups by status
 * 
 * @param customerId - Customer ID
 * @returns Organized credits for UI display
 */
export async function getCreditsForDisplay(
  customerId: string
): Promise<{
  active: AirlineCredit[];
  expiringWithin30Days: AirlineCredit[];
  expired: AirlineCredit[];
}> {
  try {
    const credits = await getAirlineCredits(customerId);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return {
      active: credits.credits.filter(c => new Date(c.expiryDate) > thirtyDaysFromNow),
      expiringWithin30Days: credits.credits.filter(c => {
        const expiry = new Date(c.expiryDate);
        return expiry > now && expiry <= thirtyDaysFromNow;
      }),
      expired: credits.credits.filter(c => new Date(c.expiryDate) <= now)
    };
  } catch (error) {
    console.error('[AirlineCredits] Get for display error:', error);
    throw error;
  }
}
