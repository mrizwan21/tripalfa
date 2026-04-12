/**
 * Duffel API Manager - Frontend Integration Layer
 *
 * This module provides a unified interface for all Duffel API operations
 * through the API Gateway's API Manager. All endpoints are routed through
 * the centralized gateway at `/api/flights/*` and `/api/airline-credits/*`.
 *
 * Architecture:
 * Frontend (Booking Engine) -> API Manager (Gateway) -> Booking Service -> Duffel API
 *
 * Benefits:
 * - Centralized authentication and rate limiting
 * - Consistent error handling
 * - Request/response transformation
 * - Audit logging
 * - Service versioning support
 */

import { api } from "../lib/apiClient";

// ============================================================================
// TYPE DEFINITIONS (shared with duffelBookingApi.ts)
// ============================================================================

export interface FlightSlice {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
}

export interface Passenger {
  type: "adult" | "child" | "infant";
}

export interface OfferRequestParams {
  slices: FlightSlice[];
  passengers: Passenger[];
  cabin_class?: "economy" | "business" | "first" | "premium_economy";
}

export interface PassengerData {
  id: string;
  email: string;
  type: "adult" | "child" | "infant";
  given_name: string;
  family_name: string;
  phone_number: string;
  born_at?: string;
  gender?: "M" | "F";
}

export interface CreateOrderParams {
  selectedOffers: string[];
  passengers: PassengerData[];
  orderType?: "instant" | "hold";
  paymentMethod?: {
    type: "balance" | "card";
    id?: string;
  };
}

export interface PaymentIntentParams {
  order_id: string;
  amount: {
    amount: number;
    currency: string;
  };
  return_url?: string;
}

export interface SelectedSeat {
  designator: string;
  passengerId: string;
  segmentId: string;
  serviceId?: string;
}

export interface SeatElement {
  designator: string;
  type: "seat" | "empty" | "lavatory" | "galley" | "bassinet" | "closet";
  available_services?: Array<{
    id: string;
    passenger_id?: string;
    total_amount: string;
    total_currency: string;
  }>;
  disclosures?: any[];
}

export interface SeatSection {
  elements: SeatElement[];
}

export interface SeatRow {
  sections: SeatSection[];
}

export interface Cabin {
  cabin_class: string;
  deck: number;
  aisles: number;
  rows: SeatRow[];
}

export interface SeatMap {
  id: string;
  segment_id: string;
  slice_id: string;
  cabins: Cabin[];
}

export interface GetSeatMapsResponse {
  data: SeatMap[];
}

// ============================================================================
// OFFER REQUESTS API
// ============================================================================

/**
 * Create an offer request (flight search) through the API Manager
 * POST /api/flights/offer-requests
 */
export async function createOfferRequest(
  params: OfferRequestParams,
): Promise<any> {
  try {
    const response = await api.post("/api/flights/offer-requests", {
      slices: params.slices,
      passengers: params.passengers,
      cabin_class: params.cabin_class || "economy",
      return_available_services: true,
    });
    return response;
  } catch (error) {
    console.error(
      "[Duffel API Manager] Offer request error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get offer request by ID
 * GET /api/flights/offer-requests/:id
 */
export async function getOfferRequest(id: string): Promise<any> {
  try {
    return await api.get(`/api/flights/offer-requests/${id}`);
  } catch (error) {
    console.error(
      "[Duffel API Manager] Get offer request error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * List all offer requests
 * GET /api/flights/offer-requests
 */
export async function listOfferRequests(params?: {
  limit?: number;
  offset?: number;
}): Promise<any> {
  try {
    const qs = new URLSearchParams();
    if (params?.limit) qs.append("limit", params.limit.toString());
    if (params?.offset) qs.append("offset", params.offset.toString());
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return await api.get(`/api/flights/offer-requests${query}`);
  } catch (error) {
    console.error(
      "[Duffel API Manager] List offer requests error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get offer details (from offer request)
 * Note: This endpoint is derived from offer request id
 */
export async function getOfferDetails(offerId: string): Promise<any> {
  try {
    // Get offer request to retrieve offer details
    return await api.get(`/api/flights/offer-requests/${offerId}`);
  } catch (error) {
    console.error(
      "[Duffel API Manager] Get offer details error:",
      (error as any)?.message,
    );
    throw error;
  }
}

// ============================================================================
// ORDERS API
// ============================================================================

/**
 * Create a flight order from selected offers
 * POST /api/flights/orders
 */
export async function createFlightOrder(
  params: CreateOrderParams,
): Promise<any> {
  try {
    console.log("[Duffel API Manager] Creating flight order:", params);
    return await api.post("/api/flights/orders", {
      selectedOffers: params.selectedOffers,
      passengers: params.passengers,
      orderType: params.orderType || "instant",
      paymentMethod: params.paymentMethod,
    });
  } catch (error) {
    console.error(
      "[Duffel API Manager] Create order error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get order by ID
 * GET /api/flights/orders/:id
 */
export async function getFlightOrder(orderId: string): Promise<any> {
  try {
    return await api.get(`/api/flights/orders/${orderId}`);
  } catch (error) {
    console.error(
      "[Duffel API Manager] Get order error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * List all orders
 * GET /api/flights/orders
 */
export async function listFlightOrders(params?: {
  limit?: number;
  offset?: number;
}): Promise<any> {
  try {
    const qs = new URLSearchParams();
    if (params?.limit) qs.append("limit", params.limit.toString());
    if (params?.offset) qs.append("offset", params.offset.toString());
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return await api.get(`/api/flights/orders${query}`);
  } catch (error) {
    console.error(
      "[Duffel API Manager] List orders error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Update order details
 * PATCH /api/flights/orders/:id
 */
export async function updateFlightOrder(
  orderId: string,
  data: any,
): Promise<any> {
  try {
    return await api.patch(`/api/flights/orders/${orderId}`, data);
  } catch (error) {
    console.error(
      "[Duffel API Manager] Update order error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get available services for an order
 * GET /api/flights/orders/:id/available-services
 */
export async function getOrderAvailableServices(orderId: string): Promise<any> {
  try {
    return await api.get(`/api/flights/orders/${orderId}/available-services`);
  } catch (error) {
    console.error(
      "[Duffel API Manager] Get available services error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Price an order
 * POST /api/flights/orders/:id/price
 */
export async function priceFlightOrder(
  orderId: string,
  paymentMethod?: any,
): Promise<any> {
  try {
    return await api.post(`/api/flights/orders/${orderId}/price`, {
      paymentMethod,
    });
  } catch (error) {
    console.error(
      "[Duffel API Manager] Price order error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Add services to order (baggage, meals, seats)
 * POST /api/flights/order-services
 */
export async function addOrderServices(data: any): Promise<any> {
  try {
    return await api.post("/api/flights/order-services", data);
  } catch (error) {
    console.error(
      "[Duffel API Manager] Add order services error:",
      (error as any)?.message,
    );
    throw error;
  }
}

// ============================================================================
// SEAT MAPS API
// ============================================================================

// Re-export types from the new types file for backward compatibility
export type {
  DuffelSeatMap,
  DuffelSeatService,
  DuffelSeatElement,
  DuffelCabinRowSectionElement,
  DuffelCabinClass,
  DuffelCabin,
  DuffelCabinRow,
  DuffelCabinRowSection,
  DuffelWingPosition,
  DuffelGetSeatMapsResponse,
  FlattenedSeat,
  ProcessedSeatMap,
  SelectedSeatForBooking,
  SeatSelectionPayload,
} from "../types/duffel-seat-maps";

import type {
  DuffelSeatMap,
  DuffelGetSeatMapsResponse,
  ProcessedSeatMap,
  FlattenedSeat,
  SelectedSeatForBooking,
  SeatSelectionPayload,
} from "../types/duffel-seat-maps";

// Import the new service
import { duffelSeatMapsService } from "./duffelSeatMapsService";

/**
 * Get seat map for an offer or order
 * GET /api/flights/seat-maps
 *
 * @param offerId - The offer ID to get seat maps for (booking flow)
 * @param orderId - The order ID to get seat maps for (post-booking flow)
 * @returns Raw Duffel seat maps response
 */
export async function getSeatMap(
  offerId?: string,
  orderId?: string,
): Promise<DuffelGetSeatMapsResponse> {
  try {
    const qs = new URLSearchParams();
    if (offerId) qs.append("offer_id", offerId);
    if (orderId) qs.append("order_id", orderId);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return await api.get(`/api/flights/seat-maps${query}`);
  } catch (error) {
    console.error(
      "[Duffel API Manager] Get seat map error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get processed seat maps for an offer (ready for UI rendering)
 *
 * @param offerId - The offer ID to get seat maps for
 * @returns Processed seat maps with flattened seats
 */
async function getProcessedSeatMapsForOffer(offerId: string): Promise<{
  success: boolean;
  data?: {
    seatMaps: ProcessedSeatMap[];
    rawSeatMaps: DuffelSeatMap[];
    offerId?: string;
    orderId?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}> {
  const result = await duffelSeatMapsService.getSeatMapsForOffer(offerId);
  return result as any;
}

/**
 * Get processed seat maps for an order (post-booking flow)
 *
 * @param orderId - The order ID to get seat maps for
 * @returns Processed seat maps with current seat assignments
 */
async function getProcessedSeatMapsForOrder(orderId: string): Promise<{
  success: boolean;
  data?: {
    seatMaps: ProcessedSeatMap[];
    rawSeatMaps: DuffelSeatMap[];
    offerId?: string;
    orderId?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}> {
  const result = await duffelSeatMapsService.getSeatMapsForOrder(orderId);
  return result as any;
}

/**
 * Select seats for an order
 *
 * @param payload - Seat selection payload
 * @returns Confirmation of seat selection
 */
async function selectSeatsForOrder(
  payload: SeatSelectionPayload,
): Promise<{
  success: boolean;
  data?: {
    selectedSeats: SelectedSeatForBooking[];
    totalCost: number;
    currency: string;
  };
  error?: {
    code: string;
    message: string;
  };
}> {
  return duffelSeatMapsService.selectSeats(payload);
}

/**
 * Get available seats from a processed seat map
 */
function getAvailableSeatsFromMap(
  seatMap: ProcessedSeatMap,
): FlattenedSeat[] {
  return seatMap.seats.filter((seat) => seat.available);
}

/**
 * Calculate total cost for selected seats
 */
function calculateSeatsTotalCost(seats: FlattenedSeat[]): {
  total: number;
  currency: string | null;
} {
  const total = seats.reduce((sum, seat) => sum + (seat.price ?? 0), 0);
  const currency = seats[0]?.currency ?? null;
  return { total, currency };
}

// ============================================================================
// ORDER CANCELLATIONS API
// ============================================================================

/**
 * Create order cancellation request
 * POST /api/flights/order-cancellations
 */
export async function createOrderCancellation(orderId: string): Promise<any> {
  try {
    return await api.post("/api/flights/order-cancellations", {
      order_id: orderId,
    });
  } catch (error) {
    console.error(
      "[Duffel API Manager] Create cancellation error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get cancellation by ID
 * GET /api/flights/order-cancellations/:id
 */
export async function getOrderCancellation(
  cancellationId: string,
): Promise<any> {
  try {
    return await api.get(`/api/flights/order-cancellations/${cancellationId}`);
  } catch (error) {
    console.error(
      "[Duffel API Manager] Get cancellation error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * List all cancellations
 * GET /api/flights/order-cancellations
 */
export async function listOrderCancellations(params?: {
  limit?: number;
  offset?: number;
}): Promise<any> {
  try {
    const qs = new URLSearchParams();
    if (params?.limit) qs.append("limit", params.limit.toString());
    if (params?.offset) qs.append("offset", params.offset.toString());
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return await api.get(`/api/flights/order-cancellations${query}`);
  } catch (error) {
    console.error(
      "[Duffel API Manager] List cancellations error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Confirm cancellation
 * POST /api/flights/order-cancellations/:id/confirm
 */
export async function confirmOrderCancellation(
  cancellationId: string,
): Promise<any> {
  try {
    return await api.post(
      `/api/flights/order-cancellations/${cancellationId}/confirm`,
      {},
    );
  } catch (error) {
    console.error(
      "[Duffel API Manager] Confirm cancellation error:",
      (error as any)?.message,
    );
    throw error;
  }
}

// ============================================================================
// ORDER CHANGES API
// ============================================================================

/**
 * Create order change request
 * POST /api/flights/order-change-requests
 */
export async function createOrderChangeRequest(
  orderId: string,
  changeData: any,
): Promise<any> {
  try {
    return await api.post("/api/flights/order-change-requests", {
      order_id: orderId,
      ...changeData,
    });
  } catch (error) {
    console.error(
      "[Duffel API Manager] Create change request error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get change request by ID
 * GET /api/flights/order-change-requests/:id
 */
export async function getOrderChangeRequest(
  changeRequestId: string,
): Promise<any> {
  try {
    return await api.get(
      `/api/flights/order-change-requests/${changeRequestId}`,
    );
  } catch (error) {
    console.error(
      "[Duffel API Manager] Get change request error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * List change offers for a request
 * GET /api/flights/order-change-offers
 */
export async function listOrderChangeOffers(
  changeRequestId: string,
): Promise<any> {
  try {
    const qs = new URLSearchParams();
    qs.append("order_change_request_id", changeRequestId);
    return await api.get(`/api/flights/order-change-offers?${qs.toString()}`);
  } catch (error) {
    console.error(
      "[Duffel API Manager] List change offers error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get change offer by ID
 * GET /api/flights/order-change-offers/:id
 */
export async function getOrderChangeOffer(offerId: string): Promise<any> {
  try {
    return await api.get(`/api/flights/order-change-offers/${offerId}`);
  } catch (error) {
    console.error(
      "[Duffel API Manager] Get change offer error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Create pending order change
 * POST /api/flights/order-changes
 */
export async function createOrderChange(data: any): Promise<any> {
  try {
    return await api.post("/api/flights/order-changes", data);
  } catch (error) {
    console.error(
      "[Duffel API Manager] Create order change error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Confirm order change
 * POST /api/flights/order-changes/confirm
 */
export async function confirmOrderChange(offerData: any): Promise<any> {
  try {
    return await api.post("/api/flights/order-changes/confirm", offerData);
  } catch (error) {
    console.error(
      "[Duffel API Manager] Confirm order change error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get order change by ID
 * GET /api/flights/order-changes/:id
 */
export async function getOrderChange(changeId: string): Promise<any> {
  try {
    return await api.get(`/api/flights/order-changes/${changeId}`);
  } catch (error) {
    console.error(
      "[Duffel API Manager] Get order change error:",
      (error as any)?.message,
    );
    throw error;
  }
}

// ============================================================================
// AIRLINE CREDITS API
// ============================================================================

/**
 * List airline credits
 * GET /api/airline-credits
 */
export async function listAirlineCredits(params?: {
  limit?: number;
  offset?: number;
}): Promise<any> {
  try {
    const qs = new URLSearchParams();
    if (params?.limit) qs.append("limit", params.limit.toString());
    if (params?.offset) qs.append("offset", params.offset.toString());
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return await api.get(`/api/airline-credits${query}`);
  } catch (error) {
    console.error(
      "[Duffel API Manager] List airline credits error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Get airline credit by ID
 * GET /api/airline-credits/:id
 */
export async function getAirlineCredit(creditId: string): Promise<any> {
  try {
    return await api.get(`/api/airline-credits/${creditId}`);
  } catch (error) {
    console.error(
      "[Duffel API Manager] Get airline credit error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Create airline credit
 * POST /api/airline-credits
 */
export async function createAirlineCredit(data: any): Promise<any> {
  try {
    return await api.post("/api/airline-credits", data);
  } catch (error) {
    console.error(
      "[Duffel API Manager] Create airline credit error:",
      (error as any)?.message,
    );
    throw error;
  }
}

/**
 * Update airline credit
 * PATCH /api/airline-credits/:id
 */
export async function updateAirlineCredit(
  creditId: string,
  data: any,
): Promise<any> {
  try {
    return await api.patch(`/api/airline-credits/${creditId}`, data);
  } catch (error) {
    console.error(
      "[Duffel API Manager] Update airline credit error:",
      (error as any)?.message,
    );
    throw error;
  }
}

// ============================================================================
// HELPER ENDPOINTS
// ============================================================================

/**
 * Search airports/cities
 * GET /api/duffel/airports
 */
export async function searchAirports(query: string): Promise<any> {
  try {
    const qs = new URLSearchParams();
    qs.append("q", query);
    return await api.get(`/api/duffel/airports?${qs.toString()}`);
  } catch (error) {
    console.error(
      "[Duffel API Manager] Search airports error:",
      (error as any)?.message,
    );
    throw error;
  }
}
// ============================================================================
// LITEAPI HOTEL CANCELLATIONS
// ============================================================================

/**
 * Cancel a hotel booking (LiteAPI)
 * PUT /api/booking/bookings/:id
 */
export async function cancelHotelBooking(
  bookingId: string,
  reason?: string,
): Promise<any> {
  try {
    return await api.put(`/api/booking/bookings/${bookingId}`, {
      status: "cancelled",
      cancellationReason: reason || "User requested cancellation",
    });
  } catch (error) {
    console.error(
      "[Hotel API Manager] Cancel hotel booking error:",
      (error as any)?.message,
    );
    throw error;
  }
}
/**
 * Download a specific document
 * GET /api/bookings/:bookingId/documents/:documentType/download
 */
export async function downloadDocument(
  bookingId: string,
  documentType: string,
): Promise<{ downloadUrl: string; expiresAt: string }> {
  try {
    const res = await api.get<{
      data: { downloadUrl: string; expiresAt: string };
    }>(`/api/bookings/${bookingId}/documents/${documentType}/download`);
    return (res as any).data;
  } catch (error) {
    console.error(
      `[API Manager] Download document error (${documentType}):`,
      (error as any)?.message,
    );
    throw error;
  }
}
