/**
 * LiteAPI Hotel Manager - Frontend Integration Layer
 *
 * This module provides a unified interface for all LiteAPI hotel operations
 * through the API Gateway's centralized API Manager.
 *
 * Full LiteAPI Reference: https://docs.liteapi.travel/reference/api-endpoints-overview
 *
 * Architecture:
 *
 * SEARCH APIs (Redis + Neon + API Manager):
 * - Hotel Search (POST /api/hotels/search)
 * - Hotel Rates (POST /api/hotels/rates)
 *
 * BOOK APIs (API Manager only - no Redis):
 * - Prebook, Book, Bookings CRUD, Guests, Loyalty, Vouchers, Static Data
 *
 * Benefits:
 * - Centralized authentication and rate limiting
 * - Consistent error handling
 * - Redis caching for fast search responses
 * - Hybrid data approach (95% DB + 5% realtime)
 */

import { api } from "../lib/api";

// ============================================================================
// TYPE DEFINITIONS - Hotel Data API
// ============================================================================

export interface HotelSearchParams {
  location: string;
  checkin: string;
  checkout: string;
  adults?: number;
  children?: number[];
  rooms?: number;
  countryCode?: string;
  limit?: number;
  currency?: string;
  guestNationality?: string;
}

export interface Occupancy {
  adults: number;
  children?: number[];
}

export interface HotelRatesParams {
  hotelIds?: string[];
  cityName?: string;
  countryCode?: string;
  checkin: string;
  checkout: string;
  currency?: string;
  guestNationality?: string;
  occupancies: Occupancy[];
  limit?: number;
}

export interface PrebookParams {
  offerId: string;
  price?: number;
  currency?: string;
  guestDetails?: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  rooms?: number;
  userId?: string;
  voucherCode?: string;
  usePaymentSdk?: boolean;
}

export interface BookParams {
  prebookId: string;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  paymentDetails?: {
    method: "ACC_CREDIT_CARD" | "TRANSACTION" | "WALLET";
    cardToken?: string;
    transactionId?: string;
  };
  voucherCode?: string;
}

export interface HotelSearchResult {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  reviews: number;
  price: {
    amount: number;
    currency: string;
  };
  amenities: string[];
  provider: string;
  offers: any[];
  refundable: boolean;
}

export interface RoomRate {
  offerId: string;
  roomTypeName?: string;
  boardBasis?: string;
  boardBasisName?: string;
  price: {
    amount: number;
    currency: string;
  };
  isRefundable: boolean;
  cancellationPolicy?: string;
  cancellationDeadline?: string;
  availableRooms?: number;
  raw?: any;
}

export interface HotelDetails {
  id: string;
  name: string;
  description?: string;
  address?: string;
  city: string;
  country: string;
  countryCode: string;
  latitude?: number;
  longitude?: number;
  starRating?: number;
  images: Array<{
    url: string;
    isPrimary: boolean;
  }>;
  amenities: any[];
  amenitiesByCategory: Record<string, any[]>;
  contacts: any[];
  checkInTime?: string;
  checkOutTime?: string;
}

// ============================================================================
// TYPE DEFINITIONS - Booking API
// ============================================================================

export interface Booking {
  id: string;
  confirmationId: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  hotelName: string;
  hotelId: string;
  checkin: string;
  checkout: string;
  guestName: string;
  totalPrice: number;
  currency: string;
  createdAt: string;
  updatedAt?: string;
  rooms?: any[];
  guestDetails?: any;
}

export interface Prebook {
  id: string;
  prebookId: string;
  offerId: string;
  status: "pending" | "confirmed" | "expired";
  expiresAt: string;
  price: number;
  currency: string;
}

// ============================================================================
// TYPE DEFINITIONS - Loyalty API
// ============================================================================

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  loyaltyPoints: number;
  cashbackEarned?: number;
  bookingsCount?: number;
  memberSince?: string;
}

export interface LoyaltySettings {
  enabled: boolean;
  cashbackRate: number;
  status: "active" | "inactive";
}

// ============================================================================
// TYPE DEFINITIONS - Vouchers API
// ============================================================================

export interface Voucher {
  id: string;
  voucherCode: string;
  discountType: "percentage";
  discountValue: number;
  minimumSpend?: number;
  maximumDiscountAmount?: number;
  validityStart?: string;
  validityEnd?: string;
  usagesLimit?: number;
  usagesUsed?: number;
  status: "active" | "inactive";
  termsAndConditions?: string;
  createdAt?: string;
}

export interface CreateVoucherParams {
  voucherCode: string;
  discountType?: "percentage";
  discountValue: number;
  minimumSpend?: number;
  maximumDiscountAmount?: number;
  validityStart?: string;
  validityEnd?: string;
  usagesLimit?: number;
  status?: "active" | "inactive";
  termsAndConditions?: string;
}

export interface UpdateVoucherParams extends Partial<CreateVoucherParams> {
  id: string;
}

// ============================================================================
// TYPE DEFINITIONS - Hotel Data API Responses
// ============================================================================

export interface Country {
  code: string;
  name: string;
}

export interface City {
  code: string;
  name: string;
  countryCode: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol?: string;
}

export interface IATACode {
  code: string;
  type: "airport" | "city";
  name: string;
  cityName?: string;
  countryCode: string;
}

export interface HotelFacility {
  code: string;
  name: string;
}

export interface HotelType {
  code: string;
  name: string;
}

export interface HotelChain {
  code: string;
  name: string;
}

// ============================================================================
// HOTEL SEARCH API (Redis + Neon + API Manager)
// ============================================================================

/**
 * Search for hotels - routed through Redis, Neon, and API Manager
 * POST /api/hotels/search
 *
 * Caching: 15 min TTL in Redis
 */
export async function searchHotels(
  params: HotelSearchParams,
): Promise<{ searchId?: string; total?: number; hotels?: HotelSearchResult[]; cached?: boolean }> {
  try {
    const payload = {
      location: params.location,
      checkin: params.checkin,
      checkout: params.checkout,
      adults: params.adults || 2,
      children: params.children,
      rooms: params.rooms || 1,
      countryCode: params.countryCode,
      limit: params.limit || 20,
      currency: params.currency || "USD",
      guestNationality: params.guestNationality || "US",
    };

    console.log("[LiteAPI Manager] Searching hotels init:", payload);
    const response = await api.post("/api/search/hotels", payload);

    return {
      searchId: response.searchId,
      total: response.total,
      hotels: response.results || [],
      cached: response.cached || false,
    };
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Hotel search error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Fetch narrowed hotel results from an existing Redis session
 * POST /api/search/hotels/results/:searchId
 */
export async function fetchHotelResults(
  searchId: string,
  params: any = {}
): Promise<{ results: HotelSearchResult[]; total: number; cached?: boolean }> {
  try {
    const response = await api.post(`/api/search/hotels/results/${searchId}`, params);
    return {
      results: response.results || [],
      total: response.total || 0,
      cached: response.cached || false,
    };
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Hotel results error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get room rates for specific hotels through the API Manager with Redis caching
 * POST /api/hotels/rates
 *
 * Caching: 30 min TTL in Redis
 */
export async function getHotelRates(
  params: HotelRatesParams,
): Promise<{ hotels: any[]; cached?: boolean }> {
  try {
    const payload = {
      hotelIds: params.hotelIds,
      cityName: params.cityName,
      countryCode: params.countryCode,
      checkin: params.checkin,
      checkout: params.checkout,
      currency: params.currency || "USD",
      guestNationality: params.guestNationality || "US",
      occupancies: params.occupancies,
      limit: params.limit || 20,
    };

    console.log("[LiteAPI Manager] Getting hotel rates:", payload);
    const response = await api.post("/api/hotels/rates", payload);

    return {
      hotels: response.hotels || response.data?.hotels || [],
      cached: response.cached || false,
    };
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Hotel rates error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get minimum rates for multiple hotels
 * GET /api/hotels/min-rates
 *
 * Caching: 30 min TTL in Redis
 */
export async function getMinRates(
  hotelIds: string[],
  checkin: string,
  checkout: string,
  currency?: string,
): Promise<any> {
  try {
    const params = new URLSearchParams();
    hotelIds.forEach((id) => params.append("hotelIds", id));
    params.append("checkin", checkin);
    params.append("checkout", checkout);
    if (currency) params.append("currency", currency);

    return await api.get(`/api/hotels/min-rates?${params.toString()}`);
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Min rates error:",
      (error as any)?.message,
    );
    throw error;
  }
}

// ============================================================================
// HOTEL DETAILS API (API Manager only - Static Data from DB)
// ============================================================================

/**
 * Get hotel details - static data from PostgreSQL via API Manager
 * GET /api/hotels/:hotelId
 *
 * Uses static data from PostgreSQL (95%) with realtime rates (5%)
 * No Redis caching - data comes from database
 */
export async function getHotelDetails(
  hotelId: string,
): Promise<HotelDetails | null> {
  try {
    // First try to get from static data service
    const response = await api.get(`/static/hotels/${hotelId}/full`);
    return response.data || null;
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Hotel details error:",
      (error as any)?.message,
    );
    // Fallback to LiteAPI direct
    try {
      return await api.get(`/api/hotels/${hotelId}`);
    } catch {
      return null;
    }
  }
}

// ============================================================================
// PREBOOK & BOOKING API (API Manager only - no Redis)
// ============================================================================

/**
 * Create a prebook session - through API Manager only
 * POST /api/hotels/prebook
 *
 * No Redis caching - direct API call
 */
export async function createPrebook(
  params: PrebookParams,
): Promise<{ transactionId: string; expiresAt?: string; cached?: boolean }> {
  try {
    const payload = {
      offerId: params.offerId,
      price: params.price,
      currency: params.currency || "USD",
      guestDetails: params.guestDetails,
      rooms: params.rooms || 1,
      userId: params.userId,
    };

    console.log("[LiteAPI Manager] Creating prebook:", payload);
    const response = await api.post("/api/rates/prebook", payload);

    return {
      transactionId: response.transactionId || response.prebookId,
      expiresAt: response.expiresAt,
      cached: response.cached || false,
    };
  } catch (error) {
    console.error("[LiteAPI Manager] Prebook error:", (error as any)?.message);
    throw error;
  }
}

/**
 * Get prebook details
 * GET /api/hotels/prebooks/:prebookId
 */
export async function getPrebook(prebookId: string): Promise<any> {
  try {
    return await api.get(`/api/prebooks/${prebookId}`);
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Get prebook error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Complete a hotel booking through the API Manager
 * POST /api/hotels/book
 */
export async function createHotelBooking(
  params: BookParams,
): Promise<{ confirmationId: string; bookingRef?: string }> {
  try {
    const payload = {
      prebookId: params.prebookId,
      guest: params.guestDetails,
      payment: params.paymentDetails,
    };

    console.log("[LiteAPI Manager] Creating hotel booking:", payload);
    const response = await api.post("/api/rates/book", payload);

    return {
      confirmationId:
        response.confirmationId || response.bookingId || response.id,
      bookingRef: response.bookingRef,
    };
  } catch (error) {
    console.error("[LiteAPI Manager] Booking error:", (error as any)?.message);
    throw error;
  }
}

// ============================================================================
// BOOKING MANAGEMENT API
// ============================================================================

/**
 * List hotel bookings through the API Manager
 * GET /api/hotels/bookings
 */
export async function listHotelBookings(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ bookings: any[]; total: number }> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set("status", params.status);
    if (params?.limit) queryParams.set("limit", String(params.limit));
    if (params?.offset) queryParams.set("offset", String(params.offset));

    const response = await api.get(`/api/bookings?${queryParams}`);
    return {
      bookings: response.bookings || [],
      total: response.total || response.bookings?.length || 0,
    };
  } catch (error) {
    console.error(
      "[LiteAPI Manager] List bookings error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get hotel booking details
 * GET /api/hotels/bookings/:bookingId
 */
export async function getHotelBooking(bookingId: string): Promise<any> {
  try {
    return await api.get(`/api/bookings/${bookingId}`);
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Get booking error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Cancel a hotel booking
 * PUT /api/hotels/bookings/:bookingId
 */
export async function cancelHotelBooking(
  bookingId: string,
  reason?: string,
): Promise<any> {
  try {
    return await api.put(`/api/bookings/${bookingId}`, {
      status: "cancelled",
      cancellationReason: reason,
    });
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Cancel booking error:",
      (error as any)?.message,
    );
    throw error;
  }
}

// ============================================================================
// DESTINATIONS API
// ============================================================================

/**
 * Search hotel destinations (cities)
 * GET /api/hotels/destinations
 */
export async function searchDestinations(
  query: string,
  limit?: number,
): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    params.set("q", query);
    if (limit) params.set("limit", String(limit));

    const response = await api.get(
      `/api/liteapi/hotels/destinations?${params.toString()}`,
    );
    return response.data || [];
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Search destinations error:",
      (error as any)?.message,
    );
    throw error;
  }
}

// ============================================================================
// LOYALTY API (Optional Integration)
// ============================================================================

/**
 * Get loyalty program settings
 * GET /api/loyalties
 */
export async function getLoyaltySettings(): Promise<any> {
  try {
    return await api.get("/api/loyalties");
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Get loyalty settings error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get guest loyalty points
 * GET /api/guests/:guestId/loyalty-points
 */
export async function getGuestLoyaltyPoints(guestId: string): Promise<any> {
  try {
    return await api.get(`/api/guests/${guestId}/loyalty-points`);
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Get loyalty points error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Redeem guest loyalty points
 * POST /api/guests/:guestId/loyalty-points/redeem
 */
export async function redeemLoyaltyPoints(
  guestId: string,
  points: number,
): Promise<any> {
  try {
    return await api.post(`/api/guests/${guestId}/loyalty-points/redeem`, {
      points,
    });
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Redeem points error:",
      (error as any)?.message,
    );
    throw error;
  }
}

// ============================================================================
// HOTEL DATA API (Static Data)
// ============================================================================

/**
 * Get list of hotels from LiteAPI
 * GET /api/data/hotels
 */
export async function listHotels(params?: {
  countryCode?: string;
  cityName?: string;
  limit?: number;
  offset?: number;
}): Promise<any[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.countryCode) queryParams.set("countryCode", params.countryCode);
    if (params?.cityName) queryParams.set("cityName", params.cityName);
    if (params?.limit) queryParams.set("limit", String(params.limit));
    if (params?.offset) queryParams.set("offset", String(params.offset));

    const response = await api.get(`/api/liteapi/data/hotels?${queryParams}`);
    return response.data || [];
  } catch (error) {
    console.error(
      "[LiteAPI Manager] List hotels error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get hotel reviews
 * GET /api/data/reviews?hotelId=xxx
 */
export async function getHotelReviews(
  hotelId: string,
  limit?: number,
): Promise<any[]> {
  try {
    const params = new URLSearchParams();
    params.set("hotelId", hotelId);
    if (limit) params.set("limit", String(limit));

    const response = await api.get(`/api/liteapi/data/reviews?${params}`);
    return response.data || [];
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Get reviews error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get cities by country
 * GET /api/data/cities?countryCode=xxx
 */
export async function getCities(
  countryCode?: string,
  limit?: number,
): Promise<City[]> {
  try {
    const params = new URLSearchParams();
    if (countryCode) params.set("countryCode", countryCode);
    if (limit) params.set("limit", String(limit));

    const response = await api.get(`/api/liteapi/data/cities?${params}`);
    return response.data || [];
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Get cities error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get all countries
 * GET /api/data/countries
 */
export async function getCountries(limit?: number): Promise<Country[]> {
  try {
    const params = new URLSearchParams();
    if (limit) params.set("limit", String(limit));

    const response = await api.get(`/api/liteapi/data/countries?${params}`);
    return response.data || [];
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Get countries error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get supported currencies
 * GET /api/data/currencies
 */
export async function getCurrencies(): Promise<Currency[]> {
  try {
    const response = await api.get("/api/liteapi/data/currencies");
    return response.data || [];
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Get currencies error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get IATA codes
 * GET /api/data/iataCodes
 */
export async function getIATACodes(params?: {
  type?: string;
  countryCode?: string;
  q?: string;
}): Promise<IATACode[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.set("type", params.type);
    if (params?.countryCode) queryParams.set("countryCode", params.countryCode);
    if (params?.q) queryParams.set("q", params.q);

    const response = await api.get(
      `/api/liteapi/data/iataCodes?${queryParams}`,
    );
    return response.data || [];
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Get IATA codes error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get hotel facilities
 * GET /api/data/facilities
 */
export async function getHotelFacilities(): Promise<HotelFacility[]> {
  try {
    const response = await api.get("/api/liteapi/data/facilities");
    return response.data || [];
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Get facilities error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get hotel types
 * GET /api/data/hotelTypes
 */
export async function getHotelTypes(): Promise<HotelType[]> {
  try {
    const response = await api.get("/api/liteapi/data/hotelTypes");
    return response.data || [];
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Get hotel types error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get hotel chains
 * GET /api/data/chains
 */
export async function getHotelChains(): Promise<HotelChain[]> {
  try {
    const response = await api.get("/api/liteapi/data/chains");
    return response.data || [];
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Get hotel chains error:",
      (error as any)?.message,
    );
    throw error;
  }
}

// ============================================================================
// VOUCHERS API
// ============================================================================

/**
 * Create a new voucher
 * POST /api/vouchers
 */
export async function createVoucher(
  params: CreateVoucherParams,
): Promise<Voucher> {
  try {
    const response = await api.post("/api/vouchers", params);
    return response.data || response;
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Create voucher error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Update an existing voucher
 * PUT /api/vouchers/:id
 */
export async function updateVoucher(
  params: UpdateVoucherParams,
): Promise<Voucher> {
  try {
    const { id, ...body } = params;
    const response = await api.put(`/api/vouchers/${id}`, body);
    return response.data || response;
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Update voucher error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get voucher by ID
 * GET /api/vouchers/:id
 */
export async function getVoucher(voucherId: string): Promise<Voucher> {
  try {
    const response = await api.get(`/api/vouchers/${voucherId}`);
    return response.data || response;
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Get voucher error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get all vouchers
 * GET /api/vouchers
 */
export async function getAllVouchers(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<Voucher[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set("status", params.status);
    if (params?.limit) queryParams.set("limit", String(params.limit));
    if (params?.offset) queryParams.set("offset", String(params.offset));

    const response = await api.get(`/api/vouchers?${queryParams}`);
    return response.data || [];
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Get all vouchers error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Validate a voucher code
 * GET /api/vouchers/validate?code=xxx
 */
export async function validateVoucher(
  code: string,
): Promise<{ valid: boolean; voucher?: Voucher; discount?: number }> {
  try {
    const response = await api.get(
      `/api/vouchers/validate?code=${encodeURIComponent(code)}`,
    );
    return response.data || response;
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Validate voucher error:",
      (error as any)?.message,
    );
    throw error;
  }
}

// ============================================================================
// GUEST & LOYALTY API
// ============================================================================

/**
 * Get all guests
 * GET /api/guests
 */
export async function getAllGuests(params?: {
  limit?: number;
  offset?: number;
}): Promise<Guest[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set("limit", String(params.limit));
    if (params?.offset) queryParams.set("offset", String(params.offset));

    const response = await api.get(`/api/guests?${queryParams}`);
    return response.data || [];
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Get all guests error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get specific guest details
 * GET /api/guests/:guestId
 */
export async function getGuest(guestId: string): Promise<Guest> {
  try {
    const response = await api.get(`/api/guests/${guestId}`);
    return response.data || response;
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Get guest error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get guest bookings
 * GET /api/guests/:guestId/bookings
 */
export async function getGuestBookings(
  guestId: string,
  params?: { status?: string; limit?: number },
): Promise<any[]> {
  try {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set("status", params.status);
    if (params?.limit) queryParams.set("limit", String(params.limit));

    const response = await api.get(
      `/api/guests/${guestId}/bookings?${queryParams}`,
    );
    return response.data || [];
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Get guest bookings error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Enable loyalty program
 * POST /api/loyalties
 */
export async function enableLoyaltyProgram(params: {
  enabled: boolean;
  cashbackRate: number;
  programName?: string;
}): Promise<LoyaltySettings> {
  try {
    const response = await api.post("/api/loyalties", params);
    return response.data || response;
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Enable loyalty error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Update loyalty program settings
 * PUT /api/loyalties
 */
export async function updateLoyaltyProgram(
  params: Partial<LoyaltySettings>,
): Promise<LoyaltySettings> {
  try {
    const response = await api.put("/api/loyalties", params);
    return response.data || response;
  } catch (error) {
    console.error(
      "[LiteAPI Manager] Update loyalty error:",
      (error as any)?.message,
    );
    throw error;
  }
}
