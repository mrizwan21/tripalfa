/**
 * Lightweight API facade for the booking-engine app.
 *
 * Data Flow Architecture:
 *
 * 1. STATIC DATA (airports, airlines, hotels, destinations, etc.):
 *    - In-memory fallback data from packages/static-data (HOTEL_STATIC_DATA, etc.)
 *    - Formerly from static-data-service at port 3002 (now deleted)
 *    - Functions automatically fall back to in-memory data when service unavailable
 *
 * 2. REAL-TIME SEARCH DATA (flights, hotels):
 *    - Routed through API Manager → Backend Services
 *    - Hybrid processing: Redis (caching/sorting) + Neon DB (filtering)
 *    - Flight search: /search/flights → Duffel API → Redis/Neon processing
 *    - Hotel search: /search/hotels → LiteAPI → Redis/Neon processing
 *
 * 3. TRANSACTIONAL DATA (bookings, payments, wallet):
 *    - Routed through API Manager → Backend Services
 *    - All mutations go through api.post/put/delete methods
 */

import { API_BASE_URL, API_ENDPOINTS } from "./constants";

// ============================================================================
// STATIC DATA - Direct PostgreSQL Access (Not through API Manager)
// ============================================================================
// Hotel static data - imported from centralized constants
// Primary source: PostgreSQL static-data-service running in Docker container
// Frontend fetches directly from /static/* endpoint (no API manager routing)
import {
  HOTEL_STATIC_DATA,
  searchHotelDestinations,
} from "./constants/hotel-static-data";

/**
 * Static data service endpoint (DEPRECATED - static-data-service deleted).
 *
 * The /static/* calls now fail and trigger in-memory fallbacks.
 * Static data comes from packages/static-data constants (HOTEL_STATIC_DATA, etc.)
 *
 * @deprecated - kept for reference, actual data from in-memory fallbacks
 */
const STATIC_SVC = "/static";

/** Thin fetch wrapper for the static-data-service */
async function staticFetch<T = any>(path: string): Promise<T> {
  const res = await fetch(`${STATIC_SVC}${path}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`static-svc ${res.status} for ${path}`);
  const json = await res.json();
  // Handle case where service returns 200 OK with { error: "Not found" }
  if (
    json &&
    typeof json === "object" &&
    "error" in json &&
    !("data" in json)
  ) {
    throw new Error(`static-svc error: ${json.error}`);
  }
  return json as Promise<T>;
}

// Duffel Flight Booking API - New API Manager (routes through gateway)
export {
  createOfferRequest,
  getOfferRequest,
  listOfferRequests,
  getOfferDetails,
  createFlightOrder,
  getFlightOrder,
  listFlightOrders,
  updateFlightOrder,
  getOrderAvailableServices,
  priceFlightOrder,
  addOrderServices,
  getSeatMap,
  createOrderCancellation,
  getOrderCancellation,
  listOrderCancellations,
  confirmOrderCancellation,
  createOrderChangeRequest,
  getOrderChangeRequest,
  listOrderChangeOffers,
  getOrderChangeOffer,
  createOrderChange,
  confirmOrderChange,
  getOrderChange,
  listAirlineCredits,
  getAirlineCredit,
  createAirlineCredit,
  updateAirlineCredit,
  searchAirports,
  type OfferRequestParams,
  type PassengerData,
  type CreateOrderParams,
  type PaymentIntentParams,
  type SelectedSeat,
  type SeatElement,
  type SeatSection,
  type SeatRow,
  type Cabin,
  type SeatMap,
  type GetSeatMapsResponse,
} from "../services/duffelApiManager";

// Legacy Duffel Flight Booking API (Offers, Orders, Payments) - for backward compatibility
export {
  createPaymentIntent,
  confirmFlightOrder,
  completeBookingFlow,
  handlePaymentCallback,
  getPaymentMethods,
  getOrderPaymentMethods,
  confirmPayment,
  getPayment,
  type PaymentMethod,
  type PaymentConfirmParams,
} from "../services/duffelBookingApi";

// Seat Maps API
export {
  getSeatMaps,
  getSeatMapsForBooking,
  selectSeats,
  getSeatMapForSegment,
  updateBookingSeats,
  getBookingSeatHistory,
  getAircraftLayout,
  parseSeatPattern,
  generateSeatDesignators,
  type SeatMapWithAircraft,
  type AircraftConfig,
  type CabinLayout,
  type PostBookingSeatResponse,
  type SeatOperationContext,
  type SeatOperationRequest,
} from "../services/seatMapsApi";

// Supplier Payment API
export { processSupplierPayment } from "../services/supplierPaymentApi";

// Innstant Travel Static Data API Configuration (disabled - using centralized package)
// const INNSTANT_API_KEY = '$2y$10$yWot7dUYoc7.viH8vK1s0OG.D0n5uKm19Z84WznDiB.ESBnPOikr6';
// const INNSTANT_BASE_URL = 'https://static-data.innstant-servers.com';

// ============================================================================
// Static Data Service Functions — fetch directly from PostgreSQL via /static/*
// All functions gracefully fall back to in-memory static data on DB error.
// ============================================================================

/**
 * Fetch a single hotel by id/canonicalCode from PostgreSQL.
 * Falls back to the legacy inventory endpoint if unavailable.
 */
export async function fetchHotelById(id: string) {
  // 1. Try PostgreSQL static-data-service
  try {
    const res = await staticFetch<{ data?: any }>(`/hotels/${id}`);
    if (res?.data) return res.data;
  } catch (e) {
    console.warn(`[fetchHotelById] static-svc failed for ${id}:`, e);
  }
  // 2. Fallback: inventory service
  try {
    const res = await api.get<{ data?: any }>(`/inventory/hotels/${id}`);
    return (res as any)?.data ?? res;
  } catch (error) {
    console.error(`[fetchHotelById] All sources failed for ${id}:`, error);
    return null;
  }
}

/**
 * Fetch FULL hotel detail (static 95%) from PostgreSQL in one call.
 * Returns: hotel base info + images + amenities (by category) + descriptions + contacts + reviews + rooms (static structure only).
 * Note: room.rates[] is always empty here — pricing comes from fetchHotelRates() (realtime API).
 *
 * Data availability in local DB:
 *   - CanonicalHotel  : 658K hotels ✅
 *   - HotelImage      : 8M images  ✅
 *   - HotelAmenityMapping: 8.5M   ✅
 *   - HotelDescription: 610K      ✅
 *   - HotelRoomType   : 0 (not yet ingested — rooms come from realtime API)
 *   - HotelReview     : 0 (not yet ingested — placeholder reviews shown)
 */
export async function fetchHotelFullStatic(id: string): Promise<{
  hotel: any;
  images: any[];
  amenities: any[];
  amenitiesByCategory: Record<string, any[]>;
  descriptions: any[];
  contacts: any[];
  reviews: any[];
  rooms: any[]; // static room structures (no prices yet)
  stats: { reviewCount: number; ratingAvg: number | null };
} | null> {
  try {
    const res = await staticFetch<{ data: any }>(`/hotels/${id}/full`);
    if (!res?.data) return null;

    const {
      hotel,
      images,
      amenities,
      descriptions,
      contacts,
      reviews,
      rooms,
      stats,
    } = res.data;

    // Group amenities by category for easy rendering in Facilities component
    const amenitiesByCategory: Record<string, any[]> = {};
    for (const a of amenities ?? []) {
      const cat = a.category || "General";
      if (!amenitiesByCategory[cat]) amenitiesByCategory[cat] = [];
      amenitiesByCategory[cat].push(a);
    }

    return {
      hotel,
      images: images ?? [],
      amenities: amenities ?? [],
      amenitiesByCategory,
      descriptions: descriptions ?? [],
      contacts: contacts ?? [],
      reviews: reviews ?? [],
      rooms: rooms ?? [],
      stats: stats ?? { reviewCount: 0, ratingAvg: null },
    };
  } catch (e) {
    console.warn(`[fetchHotelFullStatic] failed for ${id}:`, e);
    return null;
  }
}

/**
 * Fetch hotel amenities from PostgreSQL.
 * Falls back to LiteAPI, then to in-memory HOTEL_STATIC_DATA.AMENITIES.
 */
async function fetchLiteAPIAmenities(params?: {
  category?: string;
  popular?: boolean;
}) {
  try {
    console.debug("[fetchLiteAPIAmenities] Attempting LiteAPI amenities fetch");
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.popular) qs.set("popular", "true");
    const res = await api.get<{ success: boolean; data: any[] }>(
      `/hotels/amenities${qs.toString() ? "?" + qs : ""}`,
    );

    if (res && res.success && Array.isArray(res.data)) {
      console.debug(
        `[fetchLiteAPIAmenities] LiteAPI returned ${res.data.length} amenities`,
      );
      return res.data;
    }
  } catch (e) {
    console.warn("[fetchLiteAPIAmenities] LiteAPI fetch failed:", e);
  }
  return [];
}

export async function fetchHotelAmenities(params?: {
  category?: string;
  popular?: boolean;
}) {
  try {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.popular) qs.set("popular", "true");
    const res = await staticFetch<{ data: any[] }>(
      `/hotel-amenities${qs.toString() ? "?" + qs : ""}`,
    );
    const data = res?.data ?? [];
    if (data.length > 0) return data;
  } catch (e) {
    console.warn(
      "[fetchHotelAmenities] DB fetch failed, attempting LiteAPI fallback:",
      e,
    );
  }
  // Fallback to LiteAPI
  const liteAPIData = await fetchLiteAPIAmenities(params);
  if (liteAPIData.length > 0) return liteAPIData;

  // Final fallback to static data
  return HOTEL_STATIC_DATA.AMENITIES.all as any[];
}

/**
 * LiteAPI board types fallback - called when PostgreSQL is unavailable.
 * Fetches meal plans/board basis from LiteAPI via backend proxy.
 */
async function fetchLiteAPIBoardTypes() {
  try {
    console.debug(
      "[fetchLiteAPIBoardTypes] Attempting LiteAPI board types fetch",
    );
    const res = await api.get<{ success: boolean; data: any[] }>(
      `/hotels/board-types`,
    );

    if (res && res.success && Array.isArray(res.data)) {
      console.debug(
        `[fetchLiteAPIBoardTypes] LiteAPI returned ${res.data.length} board types`,
      );
      return res.data;
    }
  } catch (e) {
    console.warn("[fetchLiteAPIBoardTypes] LiteAPI fetch failed:", e);
  }
  return [];
}

/**
 * Fetch board types (meal plans) from PostgreSQL.
 * Falls back to LiteAPI, then to in-memory HOTEL_STATIC_DATA.BOARD_TYPES.
 */
export async function fetchBoardTypesDB() {
  try {
    const res = await staticFetch<{ data: any[] }>("/board-types");
    const data = res?.data ?? [];
    if (data.length > 0) return data;
  } catch (e) {
    console.warn(
      "[fetchBoardTypesDB] DB fetch failed, attempting LiteAPI fallback:",
      e,
    );
  }
  // Fallback to LiteAPI
  const liteAPIData = await fetchLiteAPIBoardTypes();
  if (liteAPIData.length > 0) return liteAPIData;

  // Final fallback to static data
  return HOTEL_STATIC_DATA.BOARD_TYPES.all as any[];
}

/**
 * LiteAPI hotel types fallback - called when PostgreSQL is unavailable.
 * Fetches hotel property types from LiteAPI via backend proxy.
 */
async function fetchLiteAPIHotelTypes() {
  try {
    console.debug(
      "[fetchLiteAPIHotelTypes] Attempting LiteAPI hotel types fetch",
    );
    const res = await api.get<{ success: boolean; data: any[] }>(
      `/hotels/types`,
    );

    if (res && res.success && Array.isArray(res.data)) {
      console.debug(
        `[fetchLiteAPIHotelTypes] LiteAPI returned ${res.data.length} hotel types`,
      );
      return res.data;
    }
  } catch (e) {
    console.warn("[fetchLiteAPIHotelTypes] LiteAPI fetch failed:", e);
  }
  return [];
}

/**
 * Fetch hotel types from PostgreSQL via /static/hotel-types.
 * Falls back to LiteAPI, then to HOTEL_STATIC_DATA.TYPES.
 */
export async function fetchHotelTypesDB() {
  try {
    const res = await staticFetch<{ data: any[] }>("/hotel-types");
    const data = res?.data ?? [];
    if (data.length > 0) return data;
  } catch (e) {
    console.warn(
      "[fetchHotelTypesDB] DB fetch failed, attempting LiteAPI fallback:",
      e,
    );
  }
  // Fallback to LiteAPI
  const liteAPIData = await fetchLiteAPIHotelTypes();
  if (liteAPIData.length > 0) return liteAPIData;

  // Final fallback to static data
  return HOTEL_STATIC_DATA.TYPES.all as any[];
}

/**
 * Fetch room types from PostgreSQL. No static fallback (hotel-specific data).
 */
export async function fetchRoomTypesDB(hotelId?: string) {
  try {
    const qs = hotelId ? `?hotelId=${hotelId}` : "";
    const res = await staticFetch<{ data: any[] }>(`/room-types${qs}`);
    return res?.data ?? [];
  } catch (e) {
    console.warn("[fetchRoomTypesDB] DB fetch failed:", e);
    return [];
  }
}

/**
 * LiteAPI destinations fallback - called when PostgreSQL is unavailable.
 * Fetches city/destination data from LiteAPI via backend proxy.
 */
async function fetchLiteAPIDestinations(params?: {
  type?: string;
  countryCode?: string;
  search?: string;
}) {
  try {
    if (!params?.search || params.search.length < 2) {
      return [];
    }
    console.debug(
      `[fetchLiteAPIDestinations] Attempting LiteAPI search for "${params.search}"`,
    );
    const res = await api.get<{ success: boolean; data: any[] }>(
      `/hotels/destinations?q=${encodeURIComponent(params.search)}&limit=20`,
    );

    if (res && res.success && Array.isArray(res.data)) {
      console.debug(
        `[fetchLiteAPIDestinations] LiteAPI returned ${res.data.length} results`,
      );
      return res.data.map((item: any) => ({
        id: item.id || item.code,
        name: item.name,
        city: item.name,
        country: item.country || "",
        countryCode: item.countryCode || "",
        latitude: item.latitude,
        longitude: item.longitude,
        type: "city",
      }));
    }
  } catch (e) {
    console.warn("[fetchLiteAPIDestinations] LiteAPI fetch failed:", e);
  }
  return [];
}

/**
 * Fetch destinations from PostgreSQL.
 * Falls back to LiteAPI when DB is unavailable.
 */
export async function fetchDestinationsDB(params?: {
  type?: string;
  countryCode?: string;
  search?: string;
}) {
  try {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.countryCode) qs.set("countryCode", params.countryCode);
    if (params?.search) qs.set("q", params.search);
    const res = await staticFetch<{ data: any[] }>(
      `/destinations${qs.toString() ? "?" + qs : ""}`,
    );
    const data = res?.data ?? [];
    if (data.length > 0) return data;
  } catch (e) {
    console.warn(
      "[fetchDestinationsDB] DB fetch failed, attempting LiteAPI fallback:",
      e,
    );
  }
  // Fallback to LiteAPI for destinations
  return await fetchLiteAPIDestinations(params);
}

/**
 * LiteAPI popular destinations fallback - called when PostgreSQL is unavailable.
 * Fetches popular hotel destinations from LiteAPI via backend proxy.
 */
async function fetchLiteAPIPopularDestinations(limit = 12) {
  try {
    console.debug(
      "[fetchLiteAPIPopularDestinations] Attempting LiteAPI popular destinations fetch",
    );
    const res = await api.get<{ success: boolean; data: any[] }>(
      `/hotels/popular-destinations?limit=${limit}`,
    );

    if (res && res.success && Array.isArray(res.data)) {
      console.debug(
        `[fetchLiteAPIPopularDestinations] LiteAPI returned ${res.data.length} destinations`,
      );
      return res.data.map((item: any) => ({
        id: item.id || item.code,
        name: item.name,
        city: item.name,
        country: item.country || "",
        countryCode: item.countryCode || "",
        imageUrl: item.imageUrl || item.image,
        latitude: item.latitude,
        longitude: item.longitude,
        hotelCount: item.hotelCount || 0,
      }));
    }
  } catch (e) {
    console.warn("[fetchLiteAPIPopularDestinations] LiteAPI fetch failed:", e);
  }
  return [];
}

/**
 * Fetch popular destinations for homepage from PostgreSQL.
 * Falls back to LiteAPI, then to in-memory static data.
 */
export async function fetchPopularDestinationsDB(limit = 12) {
  try {
    const res = await staticFetch<{ data: any[] }>(
      `/popular-destinations?limit=${limit}`,
    );
    if (res?.data && res.data.length > 0) return res.data;
  } catch (e) {
    console.warn(
      "[fetchPopularDestinationsDB] DB fetch failed, attempting LiteAPI fallback:",
      e,
    );
  }
  // Fallback to LiteAPI
  const liteAPIData = await fetchLiteAPIPopularDestinations(limit);
  if (liteAPIData.length > 0) return liteAPIData;

  // Final fallback to static data
  console.debug("[fetchPopularDestinationsDB] Using static fallback data");
  return HOTEL_STATIC_DATA.POPULAR_DESTINATIONS.slice(0, limit) as any[];
}

/**
 * Fetch popular hotels from PostgreSQL (for homepage cards).
 */
export async function fetchPopularHotels(limit = 12) {
  try {
    const res = await staticFetch<{ data: any[] }>(
      `/hotels/popular?limit=${limit}`,
    );
    return res?.data ?? [];
  } catch (e) {
    console.warn("[fetchPopularHotels] DB fetch failed:", e);
    return [];
  }
}

// ============================================================================
// Supplier Mapping Functions — canonical entity to supplier mappings
// ============================================================================

export interface SupplierMapping {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  supplierType: string;
  supplierHotelId?: string;
  supplierHotelCode?: string;
  matchType: "auto" | "manual" | "giata";
  matchConfidence: number | null;
  matchVerifiedAt: string | null;
  lastSyncedAt: string | null;
  syncStatus: "pending" | "synced" | "error";
  isActive: boolean;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  type: string;
  status: boolean;
  apiBaseUrl?: string;
  features?: Record<string, any>;
}

/**
 * Fetch supplier mappings for a canonical hotel.
 * Returns all suppliers that have this hotel in their inventory.
 */
export async function fetchHotelSuppliers(
  hotelId: string,
): Promise<SupplierMapping[]> {
  try {
    const res = await staticFetch<{ data: SupplierMapping[] }>(
      `/hotels/${hotelId}/suppliers`,
    );
    return res?.data ?? [];
  } catch (e) {
    console.warn("[fetchHotelSuppliers] DB fetch failed:", e);
    return [];
  }
}

/**
 * Fetch all active suppliers.
 * @param type - Filter by supplier type: 'hotel' | 'flight'
 */
export async function fetchSuppliers(
  type?: "hotel" | "flight",
): Promise<Supplier[]> {
  try {
    const qs = type ? `?type=${type}` : "";
    const res = await staticFetch<{ data: Supplier[] }>(`/suppliers${qs}`);
    return res?.data ?? [];
  } catch (e) {
    console.warn("[fetchSuppliers] DB fetch failed:", e);
    // Return hardcoded fallback
    return [
      {
        id: "hotelbeds",
        code: "HOTELBEDS",
        name: "Hotelbeds",
        type: "hotel",
        status: true,
      },
      {
        id: "liteapi",
        code: "LITEAPI",
        name: "LITEAPI",
        type: "hotel",
        status: true,
      },
      {
        id: "innstant",
        code: "INNSTANT",
        name: "Innstant Travel",
        type: "hotel",
        status: true,
      },
      {
        id: "duffel",
        code: "DUFFEL",
        name: "Duffel",
        type: "flight",
        status: true,
      },
      {
        id: "amadeus",
        code: "AMADEUS",
        name: "Amadeus",
        type: "flight",
        status: true,
      },
      {
        id: "giata",
        code: "GIATA",
        name: "GIATA",
        type: "hotel",
        status: true,
      },
    ];
  }
}

/**
 * Fetch supplier mappings for a destination.
 */
export async function fetchDestinationSuppliers(
  destinationId: string,
): Promise<any[]> {
  try {
    const res = await staticFetch<{ data: any[] }>(
      `/destinations/${destinationId}/suppliers`,
    );
    return res?.data ?? [];
  } catch (e) {
    console.warn("[fetchDestinationSuppliers] DB fetch failed:", e);
    return [];
  }
}

/**
 * Get hotel with supplier information included.
 * Combines hotel detail with supplier mappings in one call.
 */
export async function fetchHotelWithSuppliers(id: string) {
  try {
    const [hotelData, suppliers] = await Promise.all([
      fetchHotelFullStatic(id),
      fetchHotelSuppliers(id),
    ]);

    return hotelData ? { ...hotelData, suppliers } : null;
  } catch (e) {
    console.warn("[fetchHotelWithSuppliers] Failed:", e);
    return null;
  }
}

// Helper function to map hotel results to consistent format
function mapHotelResult(hotel: any) {
  // Extract refundability from various potential structures (LiteAPI, Inventory, etc.)
  const isRefundable =
    hotel.refundable === true ||
    hotel.is_refundable === true ||
    hotel.offers?.[0]?.cancellation_policy?.is_refundable === true ||
    hotel.offers?.[0]?.refundable === true;

  return {
    id: hotel.id,
    name: hotel.name,
    image:
      hotel.image ||
      hotel.primary_image ||
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80",
    location:
      hotel.location ||
      `${hotel.city || "Unknown"}, ${hotel.country || "Unknown"}`,
    rating: hotel.rating || hotel.star_rating || 4,
    reviews: hotel.reviews || hotel.reviewCount || 100,
    price: hotel.price || {
      amount: hotel.pricePerNight || 200,
      currency: hotel.currency || "USD",
    },
    amenities: hotel.amenities || hotel.amenity_names || [],
    provider: hotel.provider || "Local",
    refundable: isRefundable,
    offers: hotel.offers || [],
  };
}

export async function getBookingById(id: string) {
  return await api.get(`/bookings/${id}`);
}

export async function processCardPayment(data: any) {
  return await api.post("/payments/card", data);
}

export async function processWalletPayment(data: any) {
  return await api.post("/payments/wallet", data);
}

export async function bookingAction(id: string, action: string, data?: any) {
  return await api.post(`/bookings/${id}/action`, { action, ...data });
}

export async function unreadNotificationCount() {
  return await api.get("/notifications/unread-count");
}

export async function postTopUp(data: any) {
  try {
    const res = await api.post("/wallets/topup", data);
    return res;
  } catch (error) {
    console.error("Failed to top up wallet:", error);
    throw error;
  }
}

// ... existing code ...
export async function listWalletTransactions() {
  try {
    const res = await api.get("/wallets/transactions");
    return res.transactions || [];
  } catch (error) {
    console.error("Failed to list wallet transactions:", error);
    return [];
  }
}

export async function getWalletBalance(userId: string) {
  // Mock wallet balance for demo/dev
  return new Promise<{ currency: string; amount: number }>((resolve) => {
    setTimeout(() => {
      resolve({ currency: "USD", amount: 2500.0 });
    }, 500);
  });
}

// ============================================================================
// Document & Ticketing API Functions
// ============================================================================

export interface BookingDocument {
  id: string;
  bookingId: string;
  type: string;
  name: string;
  format: string;
  generatedAt: string;
  url: string;
  available: boolean;
}

export async function getDocuments(
  bookingId: string,
): Promise<BookingDocument[]> {
  try {
    const res = await apiGetWithRetry<{
      data?: { documents?: BookingDocument[] };
    }>(`/bookings/${bookingId}/documents`);
    const docs = (res as any)?.data?.documents;
    return Array.isArray(docs) ? docs : [];
  } catch (error) {
    console.error("Failed to fetch documents:", error);
    return [];
  }
}

export async function downloadDocument(
  bookingId: string,
  documentType: string,
): Promise<{ downloadUrl: string; expiresAt: string }> {
  const res = await api.get<{
    data: { downloadUrl: string; expiresAt: string };
  }>(`/bookings/${bookingId}/documents/${documentType}/download`);
  return (res as any).data;
}

export async function issueTicket(
  bookingId: string,
  payload: {
    walletId: string;
    amount: number;
    currency: string;
    acceptedTerms: boolean;
  },
): Promise<any> {
  const res = await api.post<{ data: any }>(
    `/bookings/${bookingId}/issue-ticket`,
    payload,
  );
  return (res as any).data ?? res;
}

export async function sendOfflineRequest(
  bookingId: string,
  payload: {
    requestType: string;
    passengers?: any;
    services?: any;
    notes?: string;
  },
): Promise<any> {
  const res = await api.post<{ data: any }>(
    `/bookings/${bookingId}/offline-request`,
    payload,
  );
  return (res as any).data ?? res;
}

export async function emailDocument(
  bookingId: string,
  documentType: string,
  recipientEmail: string,
): Promise<any> {
  const res = await api.post<{ data: any }>(
    `/bookings/${bookingId}/documents/${documentType}/email`,
    { recipientEmail },
  );
  return (res as any).data ?? res;
}

// Live Search Functions (routed through WickedHaufe -> Inventory Service)
// Live Search Functions (routed through WickedHaufe -> Inventory Service)
export async function searchHotels(params: any) {
  const payload = {
    type: "hotels", // Specify the search type for inventory service
    location: params.location,
    checkin: params.checkin,
    checkout: params.checkout,
    adults: params.adults,
    children: params.children,
    rooms: params.rooms,
    countryCode: params.countryCode,
  };

  try {
    // 1. Try Inventory Service directly (hybrid approach: real data + mock pricing)
    const response = await fetch("/api/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const data = await response.json();
      const hotels = data.results || [];
      return { hotels: hotels.map(mapHotelResult) };
    }
  } catch (inventoryError) {
    console.warn(
      "[api.ts] Inventory service search failed, trying API Gateway:",
      String(inventoryError),
    );
  }

  try {
    // 2. Fallback to API Gateway (via Wicked)
    const results = await api.post(API_ENDPOINTS.SEARCH_HOTELS, payload);
    return { hotels: results.results || [] };
  } catch (error) {
    console.error(
      "[api.ts] API Gateway hotel search failed, trying direct search:",
      String(error),
    );
  }

  // Removed direct LiteAPI fallback to avoid exposing provider keys in frontend

  throw new Error("All hotel search methods failed - no results available");
}

// ============================================
// Hotel Static Data Functions (from centralized package)
// ============================================

/**
 * Fetch hotel facilities/amenities from static data
 */
export async function fetchFacilities() {
  try {
    // Use static hotel amenities data
    return HOTEL_STATIC_DATA.AMENITIES.all.map((amenity) => ({
      code: amenity.code,
      name: amenity.name,
      category: amenity.category,
      is_popular: amenity.is_popular || false,
    }));
  } catch (error) {
    console.error("Failed to fetch facilities:", error);
    // Fallback to basic amenities
    return [
      "Swimming Pool",
      "Spa",
      "Fitness Center",
      "Free WiFi",
      "Parking",
    ].map((n) => ({ name: n }));
  }
}

/**
 * Fetch hotel types from static data
 */
export async function fetchHotelTypes() {
  try {
    // Use static hotel types data
    return HOTEL_STATIC_DATA.TYPES.all.map((type) => ({
      code: type.code,
      name: type.name,
      description: type.description,
    }));
  } catch (error) {
    console.error("Failed to fetch hotel types:", error);
    return ["Hotel", "Apartment", "Resort", "Villa"].map((n) => ({ name: n }));
  }
}

/**
 * Fetch hotel chains from static data
 */
export async function fetchHotelChains() {
  try {
    // Use static hotel chains data
    return HOTEL_STATIC_DATA.CHAINS.all.map((chain) => ({
      code: chain.code,
      name: chain.name,
    }));
  } catch (error) {
    console.error("Failed to fetch hotel chains:", error);
    return [];
  }
}

/**
 * Fetch popular hotel destinations from PostgreSQL (via static-data-service).
 * Falls back to in-memory static data on error.
 */
export async function fetchPopularDestinations(limit = 20) {
  try {
    const res = await staticFetch<{ data: any[] }>(
      `/popular-destinations?limit=${limit}`,
    );
    if (res?.data && res.data.length > 0) return res.data;
  } catch (error) {
    console.warn(
      "[fetchPopularDestinations] DB fetch failed, using static fallback:",
      error,
    );
  }
  return HOTEL_STATIC_DATA.POPULAR_DESTINATIONS;
}

/**
 * Fetch star ratings from static data
 */
export async function fetchStarRatings() {
  try {
    return HOTEL_STATIC_DATA.STAR_RATINGS.all;
  } catch (error) {
    console.error("Failed to fetch star ratings:", error);
    return [
      { value: 1, label: "1 Star", icon: "★" },
      { value: 2, label: "2 Stars", icon: "★★" },
      { value: 3, label: "3 Stars", icon: "★★★" },
      { value: 4, label: "4 Stars", icon: "★★★★" },
      { value: 5, label: "5 Stars", icon: "★★★★★" },
    ];
  }
}

/**
 * Fetch room types from static data
 */
export async function fetchRoomTypes() {
  try {
    return HOTEL_STATIC_DATA.ROOM_TYPES.all;
  } catch (error) {
    console.error("Failed to fetch room types:", error);
    return [];
  }
}

/**
 * Fetch board types (meal plans) from static data
 */
export async function fetchBoardTypes() {
  try {
    return HOTEL_STATIC_DATA.BOARD_TYPES.all;
  } catch (error) {
    console.error("Failed to fetch board types:", error);
    return [];
  }
}

/**
 * Fetch view types from static data
 */
export async function fetchViewTypes() {
  try {
    return HOTEL_STATIC_DATA.VIEW_TYPES.all;
  } catch (error) {
    console.error("Failed to fetch view types:", error);
    return [];
  }
}

/**
 * Fetch payment types from static data
 */
export async function fetchPaymentTypes() {
  try {
    return HOTEL_STATIC_DATA.PAYMENT_TYPES.all;
  } catch (error) {
    console.error("Failed to fetch payment types:", error);
    return [];
  }
}

/**
 * Search hotel destinations by query
 */
export async function searchHotelDestinationsAPI(query: string) {
  try {
    return searchHotelDestinations(query);
  } catch (error) {
    console.error("Failed to search hotel destinations:", error);
    return [];
  }
}

/**
 * Fetch addon prices from static data service (e.g., travel insurance, refund protection, baggage trace)
 * Falls back to empty prices if endpoint unavailable
 */
export async function fetchAddonPrices() {
  try {
    const data = await staticFetch<{
      data: {
        travelInsurance: number;
        refundProtect: number;
        baggageTrace: number;
        [key: string]: number;
      };
    }>("/addon-prices");
    return data.data || {};
  } catch (error) {
    console.warn("Failed to fetch addon prices, using empty prices:", error);
    return {};
  }
}

export async function searchFlights(params: any) {
  // Validate input parameters
  if (!params.origin || !params.destination || !params.departureDate) {
    console.error("[api.ts] Missing required flight search parameters:", {
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
    });
    throw new Error(
      "Missing required flight search parameters: origin, destination, or departureDate",
    );
  }

  const payload = {
    data: {
      slices: params.slices || [
        {
          origin: params.origin,
          destination: params.destination,
          departure_date: params.departureDate,
        },
      ],
      passengers:
        params.passengers ||
        (params.adults
          ? Array(params.adults).fill({ type: "adult" })
          : [{ type: "adult" }]),
      cabin_class: (params.cabinClass || "economy").toLowerCase(),
      return_available_services: true, // Ensure we get ancillaries
    },
  };

  console.log(
    "[api.ts] Flight search payload prepared:",
    JSON.stringify(payload, null, 2),
  );

  try {
    console.log(
      "[api.ts] SEARCH FLIGHTS: Attempting API Gateway request to /search/flights",
    );
    // Delegate to API Gateway (which uses DuffelAdapter with backend keys)
    const response = await api.post("/search/flights", payload);
    console.log("[api.ts] API Gateway response received:", response);

    // The backend's DuffelAdapter already transforms the response to FlightResult[]
    // Check if response is already transformed (has airline/carrierCode properties)
    // or if it's raw Duffel format (needs mapDuffelResponse)
    const results = Array.isArray(response)
      ? response
      : response.data || response.offers || [];

    if (results.length > 0 && results[0].carrierCode && !results[0].slices) {
      // Already transformed by backend - use directly
      console.log(
        "[api.ts] Using pre-transformed backend response, flights:",
        results.length,
      );
      return results;
    }

    // Raw Duffel format - needs transformation
    console.log("[api.ts] Raw Duffel format detected, transforming offers...");
    const offers = response.data?.offers || response.offers || results || [];
    console.log(
      "[api.ts] Extracted offers count:",
      Array.isArray(offers) ? offers.length : "N/A",
    );
    return mapDuffelResponse({ offers: Array.isArray(offers) ? offers : [] });
  } catch (error: any) {
    console.error("[api.ts] API Gateway search failed:", {
      message: error?.message,
      status: error?.status,
      toString: String(error),
    });

    // Fallback: try again with explicit logging
    console.log("[api.ts] Retrying API Gateway with enhanced diagnostics...");
    try {
      const response = await api.post("/search/flights", payload);
      console.log("[api.ts] Retry successful");

      // Same check for transformed vs raw response
      const results = Array.isArray(response)
        ? response
        : response.data || response.offers || [];
      if (results.length > 0 && results[0].carrierCode && !results[0].slices) {
        return results;
      }

      const offers = response.data?.offers || response.offers || results || [];
      return mapDuffelResponse({ offers: Array.isArray(offers) ? offers : [] });
    } catch (retryError: any) {
      console.error("[api.ts] Retry also failed:", retryError?.message);
      throw new Error(
        `Flight search failed after retry: ${error?.message || "Unknown error"}`,
      );
    }
  }
}

// Helper: Format ISO duration to human readable (PT2H30M -> 2h 30m)
function formatDuration(isoDuration: string | null): string {
  if (!isoDuration) return "--";
  const hours = isoDuration.match(/(\d+)H/)?.[1] || "0";
  const minutes = isoDuration.match(/(\d+)M/)?.[1] || "0";
  return `${hours}h ${minutes}m`;
}

// Helper: Calculate layover duration between two dates
function calculateLayover(arrival: string, departure: string): string {
  const arr = new Date(arrival);
  const dep = new Date(departure);
  const diffMs = dep.getTime() - arr.getTime();
  if (diffMs <= 0) return "0h 0m";

  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);
  return `${diffHrs}h ${diffMins}m`;
}

// Types for mapped flight results used by UI
export interface FlightSegmentResult {
  id: string;
  origin: string;
  originCity?: string;
  destination: string;
  destinationCity?: string;
  departureTime: string;
  arrivalTime: string;
  flightNumber: string;
  airline: string;
  duration: string;
  layoverDuration?: string | null;
  departureTerminal?: string | null;
  arrivalTerminal?: string | null;
  aircraft?: string;
}

export interface FlightResult {
  id: string;
  airline: string;
  carrierCode: string;
  flightNumber: string;
  origin: string;
  originCity?: string;
  departureTime: string;
  destination: string;
  destinationCity?: string;
  arrivalTime: string;
  duration: string;
  amount: number;
  currency: string;
  stops: number;
  isLCC: boolean;
  refundable: boolean;
  airlineLogo?: string;
  segments: FlightSegmentResult[];
  includedBags: Array<{
    quantity: number;
    weight: number;
    unit: string;
    type?: string;
  }>;
  ancillaries: Array<{
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    type: string;
    raw?: any;
  }>;
  upsells?: FlightResult[];
}

function getAirlineLogo(carrierCode?: string, owner?: any): string | undefined {
  const provided = owner?.logo_symbol_url || owner?.logo_lockup_url;
  if (provided) return provided;
  return undefined;
}

// Helper: Map Duffel response to our frontend Flight type
function mapDuffelResponse(data: any): FlightResult[] {
  if (!data || !data.offers) return [];

  const offers = data.offers;

  // Helper to create a flight object from a Duffel offer
  const mapSingleOffer = (offer: any) => {
    // Validate offer structure with detailed error context
    if (
      !offer.slices ||
      !Array.isArray(offer.slices) ||
      offer.slices.length === 0
    ) {
      console.warn("[mapDuffelResponse] Offer missing slices:", {
        offerId: offer?.id,
        keys: Object.keys(offer || {}),
      });
      return null;
    }

    const slice = offer.slices[0];
    if (
      !slice.segments ||
      !Array.isArray(slice.segments) ||
      slice.segments.length === 0
    ) {
      console.warn("[mapDuffelResponse] Slice missing segments:", {
        offerId: offer?.id,
        sliceKeys: Object.keys(slice || {}),
      });
      return null;
    }

    const firstSegment = slice.segments[0];
    const lastSegment = slice.segments[slice.segments.length - 1];
    const durationStr = formatDuration(slice.duration);
    const isRefundable =
      offer.conditions?.refund_before_departure?.allowed || false;

    return {
      id: offer.id,
      airline: offer.owner.name,
      carrierCode: offer.owner.iata_code,
      flightNumber: `${offer.owner.iata_code}${firstSegment.marketing_carrier_flight_number || ""}`,
      origin: firstSegment.origin.iata_code,
      originCity:
        firstSegment.origin.city_name ||
        firstSegment.origin.name ||
        firstSegment.origin.iata_code,
      departureTime: firstSegment.departing_at,
      destination: lastSegment.destination.iata_code,
      destinationCity:
        lastSegment.destination.city_name ||
        lastSegment.destination.name ||
        lastSegment.destination.iata_code,
      arrivalTime: lastSegment.arriving_at,
      duration: durationStr,
      amount: parseFloat(offer.total_amount),
      currency: offer.total_currency,
      stops: slice.segments.length - 1,
      isLCC: false,
      refundable: isRefundable,
      airlineLogo: getAirlineLogo(offer.owner?.iata_code, offer.owner),
      segments: slice.segments.map((seg: any, idx: number) => {
        const nextSeg = slice.segments[idx + 1];
        return {
          id: seg.id,
          origin: seg.origin.iata_code,
          originCity: seg.origin.city_name || seg.origin.name,
          destination: seg.destination.iata_code,
          destinationCity: seg.destination.city_name || seg.destination.name,
          departureTime: seg.departing_at,
          arrivalTime: seg.arriving_at,
          flightNumber: `${seg.marketing_carrier.iata_code}${seg.marketing_carrier_flight_number}`,
          airline: seg.marketing_carrier.name,
          duration: formatDuration(seg.duration),
          layoverDuration: nextSeg
            ? calculateLayover(seg.arriving_at, nextSeg.departing_at)
            : null,
          departureTerminal: seg.origin_terminal,
          arrivalTerminal: seg.destination_terminal,
          aircraft: seg.aircraft?.name || "Aircraft Info Unavailable",
        };
      }),
      // Included bags – use actual values from Duffel (no hardcoded fallback weights)
      includedBags:
        offer.passengers?.[0]?.baggages?.map((b: any) => ({
          quantity: b.quantity || 1,
          // Use actual Duffel bag weight if provided, otherwise leave undefined
          maximum_weight_kg: b.maximum_weight_kg ?? undefined,
          weight: b.maximum_weight_kg ?? undefined,
          unit: "kg",
          type: b.type, // 'checked' | 'carry_on'
        })) || [],
      // Available ancillary services from Duffel – preserve full raw object
      // so FlightAddons.tsx can read metadata (dimensions, max_quantity, etc.)
      ancillaries:
        offer.available_services?.map((s: any) => ({
          id: s.id,
          name: s.metadata?.name || s.type,
          description: s.metadata?.description,
          price: parseFloat(s.total_amount || "0"),
          currency: s.total_currency,
          type:
            s.type === "baggage"
              ? "baggage"
              : s.type === "seat"
                ? "seat"
                : "other",
          // Keep full raw service so FlightAddons can access maximum_quantity, metadata, etc.
          raw: s,
        })) || [],
    };
  };

  // Grouping by itinerary identity
  const groups: Record<string, any[]> = {};

  offers.forEach((offer: any) => {
    // Validate before grouping
    if (
      !offer.slices ||
      !Array.isArray(offer.slices) ||
      offer.slices.length === 0
    ) {
      console.warn(
        "[mapDuffelResponse] Skipping offer - missing slices:",
        offer?.id,
      );
      return;
    }

    const slice = offer.slices[0];
    if (
      !slice.segments ||
      !Array.isArray(slice.segments) ||
      slice.segments.length === 0
    ) {
      console.warn(
        "[mapDuffelResponse] Skipping offer - missing segments:",
        offer?.id,
      );
      return;
    }

    const identity = slice.segments
      .map(
        (s: any) =>
          `${s.marketing_carrier?.iata_code || "UNKNOWN"}${s.marketing_carrier_flight_number || ""}-${s.departing_at}`,
      )
      .join("|");

    if (!groups[identity]) groups[identity] = [];
    const mapped = mapSingleOffer(offer);
    if (mapped) groups[identity].push(mapped);
  });

  // For each group, pick the cheapest as main and rest as upsells
  return Object.values(groups)
    .filter((groupOffers) => groupOffers.length > 0)
    .map((groupOffers: any[]) => {
      const sorted = groupOffers.sort((a: any, b: any) => a.amount - b.amount);
      const bestOffer = sorted[0];
      bestOffer.upsells = sorted.slice(1);
      return bestOffer;
    });
}

// Fetch Seat Maps from Duffel
export async function fetchSeatMaps(offerId: string) {
  try {
    // Route through backend proxy; do not expose provider keys in frontend
    const data = await api.get<{ data: any }>(
      `/duffel/seat-maps?offer_id=${encodeURIComponent(offerId)}`,
    );
    return (data as any)?.data ?? data;
  } catch (error) {
    console.error("[api.ts] fetchSeatMaps failed:", error);
    return null;
  }
}

// Re-export from new Duffel seat maps service
export {
  duffelSeatMapsService,
  groupSeatsByRow,
  getSeatPattern,
  getAvailableSeats,
  calculateTotalSeatCost,
  isSeatElement,
  type SeatMapServiceResponse,
  type SeatSelectionResponse,
} from "../services/duffelSeatMapsService";

// Re-export types
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

// Real Notifications
export async function listNotifications() {
  try {
    const res = await apiGetWithRetry<any>("/notifications");
    return Array.isArray(res) ? res : res?.items || [];
  } catch (error) {
    console.error("Failed to list notifications:", error);
    return [];
  }
}

export async function markNotificationRead(id: string) {
  try {
    await api.post("/notifications/mark-read", { id });
  } catch (error) {
    console.error(`Failed to mark notification ${id} read:`, error);
  }
}

export async function fetchFlightById(id: string) {
  try {
    const res = await apiGetWithRetry<any>(`/inventory/flights/${id}`);
    return res;
  } catch (error) {
    console.error(`Failed to fetch flight ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// Reference Data Fetchers — all backed by PostgreSQL via /static/*
// In-memory fallbacks are used when the DB service is unavailable.
// ============================================================================

/**
 * Fetch airports from PostgreSQL, formatted for the SearchAutocomplete component.
 * Falls back to Duffel API for live airport data to ensure users always get results.
 */
export async function fetchAirports(query?: string) {
  try {
    const qs = query ? `?q=${encodeURIComponent(query)}&limit=20` : "?limit=20";
    const res = await staticFetch<{ data: any[] }>(`/airports${qs}`);
    const rows = res?.data ?? [];
    if (rows.length > 0) {
      return rows.map((a: any) => ({
        type: "AIRPORT" as const,
        icon: "plane",
        title: a.name,
        subtitle: `${a.city}, ${a.country}`,
        code: a.iata_code,
        city: a.city,
        country: a.country,
        countryCode: a.country_code,
        latitude: a.latitude,
        longitude: a.longitude,
      }));
    }
  } catch (e) {
    console.warn("[fetchAirports] DB fetch failed:", e);
  }

  // Fallback to Duffel API for live airport suggestions
  if (query) {
    console.debug(
      "[fetchAirports] Falling back to fetchDuffelSuggestions for query:",
      query,
    );
    const duffelResults = await fetchDuffelSuggestions(query);
    // Map Duffel results to the airport shape
    return duffelResults.map((a: any) => ({
      type: "AIRPORT" as const,
      icon: "plane",
      title: a.title || a.name,
      subtitle: a.subtitle || `${a.city}, ${a.country}`,
      code: a.code || a.iata_code,
      city: a.city,
      country: a.country,
      countryCode: a.countryCode || a.country_code,
      latitude: a.latitude,
      longitude: a.longitude,
    }));
  }

  // No query and DB empty → return empty state (no hardcoding)
  return [];
}

/**
 * Unified suggestions autocomplete — calls /static/suggestions?q=&type=flight|hotel.
 * Returns data in the shape expected by SearchAutocomplete.
 * Falls back to Duffel/LiteAPI search when DB is unavailable.
 */

export async function fetchSuggestions(
  query: string,
  type: "flight" | "hotel" = "flight",
) {
  if (!query || query.length < 2) return [];

  // Helper to map an API item to the standard Suggestion shape
  const mapItem = (item: any) => ({
    type: (item.type === "AIRPORT" ? "AIRPORT" : "CITY") as "AIRPORT" | "CITY",
    icon: item.icon || (item.type === "AIRPORT" ? "plane" : "map-pin"),
    title: item.title,
    subtitle: item.subtitle || item.country || "",
    code: item.code,
    city: item.city || item.title,
    country: item.country || "",
    countryCode: item.countryCode || "",
    latitude: item.latitude,
    longitude: item.longitude,
  });

  // 1. Try the PostgreSQL static-data-service (proxied via /static)
  try {
    const qs = `?q=${encodeURIComponent(query)}&type=${type}&limit=10`;
    console.debug(
      `[fetchSuggestions] Attempting DB fetch for "${query}" (type: ${type})`,
    );

    // Use a short 1.5s timeout for autocomplete — fast fallback is better than slow waiting
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`${STATIC_SVC}/suggestions${qs}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer));

    if (res.ok) {
      try {
        const json: { data: any[] } = await res.json();
        const rows = json?.data ?? [];
        if (rows.length > 0) {
          console.debug(
            `[fetchSuggestions] DB returned ${rows.length} results`,
          );
          return rows.map(mapItem);
        }
      } catch (e) {
        console.warn(
          "[fetchSuggestions] Failed to parse DB JSON (expected if backend is down)",
          e,
        );
      }
    }
    console.info(
      `[fetchSuggestions] DB returned no results for "${query}", falling back to API search.`,
    );
  } catch (e) {
    console.warn(
      `[fetchSuggestions] Backend unavailable for "${query}", using API fallback:`,
      e,
    );
  }

  // 2. Fallback to Duffel API for flights or LiteAPI for hotels
  if (type === "flight") {
    const duffelResults = await fetchDuffelSuggestions(query);
    return duffelResults.map(mapItem);
  } else {
    const liteApiResults = await fetchLiteAPISuggestions(query);
    return liteApiResults.map(mapItem);
  }
}

/**
 * Fallback suggestions from Duffel API for flights
 * Uses backend-proxied endpoint to avoid exposing API keys in frontend
 */
async function fetchDuffelSuggestions(query: string) {
  try {
    console.debug(
      `[fetchDuffelSuggestions] Attempting Duffel search for "${query}" via backend proxy`,
    );
    // Use backend-proxied endpoint instead of direct Duffel API
    const res = await api.get<{ success: boolean; data: any[] }>(
      `/duffel/airports?q=${encodeURIComponent(query)}&limit=10`,
    );

    if (res && res.success && Array.isArray(res.data)) {
      console.debug(
        `[fetchDuffelSuggestions] Backend proxy returned ${res.data.length} results`,
      );
      return res.data;
    }
  } catch (e) {
    console.warn("[fetchDuffelSuggestions] Backend proxy failed:", e);
  }

  // If backend proxy fails, return empty state (no hardcoded fallback)
  console.warn(
    `[fetchDuffelSuggestions] All API sources exhausted for "${query}"`,
  );
  return [];
}

/**
 * Fallback suggestions from LiteAPI for hotels
 * Uses backend-proxied endpoint to avoid exposing API keys in frontend
 */
async function fetchLiteAPISuggestions(query: string) {
  try {
    console.debug(
      `[fetchLiteAPISuggestions] Attempting LiteAPI search for "${query}" via backend proxy`,
    );
    // Use backend-proxied endpoint instead of direct LiteAPI
    const res = await api.get<{ success: boolean; data: any[] }>(
      `/hotels/destinations?q=${encodeURIComponent(query)}&limit=10`,
    );

    if (res && res.success && Array.isArray(res.data)) {
      console.debug(
        `[fetchLiteAPISuggestions] Backend proxy returned ${res.data.length} results`,
      );
      return res.data;
    }
  } catch (e) {
    console.warn("[fetchLiteAPISuggestions] Backend proxy failed:", e);
  }

  // If backend proxy fails, return empty state (no hardcoded fallback)
  console.warn(
    `[fetchLiteAPISuggestions] All API sources exhausted for "${query}"`,
  );
  return [];
}

/**
 * Duffel airlines fallback - called when PostgreSQL is unavailable.
 * Note: Duffel doesn't expose airline list directly; airlines come from search results.
 * This returns a cached common airlines list from backend.
 */
async function fetchDuffelAirlines(query?: string) {
  try {
    console.debug(
      "[fetchDuffelAirlines] Attempting Duffel airlines fetch via backend proxy",
    );
    // Use backend-proxied endpoint to avoid exposing API keys in frontend
    const qs = query
      ? `?q=${encodeURIComponent(query)}&limit=100`
      : "?limit=200";
    const res = await api.get<{
      success: boolean;
      data: Array<{
        iata_code: string;
        name: string;
        logo_url?: string;
        country?: string;
      }>;
    }>(`/duffel/airlines${qs}`);

    if (res && res.success && Array.isArray(res.data)) {
      console.debug(
        `[fetchDuffelAirlines] Backend proxy returned ${res.data.length} airlines`,
      );
      return res.data;
    }
  } catch (e) {
    console.warn("[fetchDuffelAirlines] Backend proxy failed:", e);
  }
  // Return empty array if all sources fail
  return [];
}

/**
 * Fetch airlines from PostgreSQL.
 * Falls back to Duffel API when DB is unavailable.
 */
export async function fetchAirlines(query?: string): Promise<
  Array<{
    iata_code: string;
    name: string;
    logo_url?: string;
    country?: string;
  }>
> {
  try {
    const qs = query
      ? `?q=${encodeURIComponent(query)}&limit=100`
      : "?limit=200";
    const res = await staticFetch<{
      data: Array<{
        iata_code: string;
        name: string;
        logo_url?: string;
        country?: string;
      }>;
    }>(`/airlines${qs}`);
    const data = res?.data ?? [];
    if (data.length > 0) return data;
  } catch (e) {
    console.warn(
      "[fetchAirlines] DB fetch failed, attempting Duffel fallback:",
      e,
    );
  }
  // Fallback to Duffel API for airlines
  return await fetchDuffelAirlines(query);
}

export async function fetchAircrafts() {
  try {
    const res = await api.get("/aircraft");
    return res || [];
  } catch (error) {
    console.error("Failed to fetch aircrafts:", error);
    return [
      { iata_code: "320", name: "Airbus A320" },
      { iata_code: "321", name: "Airbus A321" },
      { iata_code: "77W", name: "Boeing 777-300ER" },
      { iata_code: "789", name: "Boeing 787-9" },
      { iata_code: "388", name: "Airbus A380-800" },
    ];
  }
}

/**
 * Fetch currencies from PostgreSQL.
 * Falls back to common currency list when DB unavailable.
 */
export async function fetchCurrencies() {
  try {
    const res = await staticFetch<{ data: any[] }>("/currencies");
    return res?.data ?? [];
  } catch (e) {
    console.warn("[fetchCurrencies] DB fetch failed, using fallback:", e);
    return [
      { code: "USD", name: "US Dollar", symbol: "$" },
      { code: "EUR", name: "Euro", symbol: "€" },
      { code: "GBP", name: "British Pound", symbol: "£" },
      { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
      { code: "SAR", name: "Saudi Riyal", symbol: "ر.س" },
    ];
  }
}

/**
 * Fetch cities from PostgreSQL.
 * Falls back to empty array on error.
 */
export async function fetchCities(query?: string) {
  try {
    const qs = query ? `?q=${encodeURIComponent(query)}&limit=20` : "?limit=20";
    const res = await staticFetch<{ data: any[] }>(`/cities${qs}`);
    return res?.data ?? [];
  } catch (e) {
    console.warn("[fetchCities] DB fetch failed:", e);
    return [];
  }
}

/**
 * LiteAPI countries fallback - called when PostgreSQL is unavailable.
 * Fetches country/nationality data from LiteAPI via backend proxy.
 */
async function fetchLiteAPICountries(query?: string) {
  try {
    console.debug("[fetchLiteAPICountries] Attempting LiteAPI countries fetch");
    const qs = query
      ? `?q=${encodeURIComponent(query)}&limit=250`
      : "?limit=250";
    const res = await api.get<{ success: boolean; data: any[] }>(
      `/hotels/countries${qs}`,
    );

    if (res && res.success && Array.isArray(res.data)) {
      console.debug(
        `[fetchLiteAPICountries] LiteAPI returned ${res.data.length} countries`,
      );
      return res.data;
    }
  } catch (e) {
    console.warn("[fetchLiteAPICountries] LiteAPI fetch failed:", e);
  }
  return [];
}

/**
 * Fetch countries from PostgreSQL.
 * Falls back to LiteAPI when DB is unavailable.
 *
 * NOTE: For React components, use the `useCountries()` hook from useStaticData.ts instead.
 * This function is for legacy non-React contexts.
 */
export async function fetchCountries(query?: string) {
  try {
    const qs = query
      ? `?q=${encodeURIComponent(query)}&limit=250`
      : "?limit=250";
    const res = await staticFetch<{ data: any[] }>(`/countries${qs}`);
    const data = res?.data ?? [];
    if (data.length > 0) return data;
  } catch (e) {
    console.warn(
      "[fetchCountries] DB fetch failed, attempting LiteAPI fallback:",
      e,
    );
  }
  // Fallback to LiteAPI for countries
  return await fetchLiteAPICountries(query);
}

/**
 * Fetch phone country codes — country names from PostgreSQL merged with ITU prefix table.
 * Returns: { code, name, phonePrefix }[]
 * This is the correct source for the phone country code dropdown.
 */
/**
 * Fetch phone country codes from PostgreSQL Country table.
 * Data sourced from Kaggle dataset: migeruj/country-2iso3un-digit-code-and-dialing-code
 * Returns: { alpha2, alpha3, numericCode, name, phonePrefix, currency }[]
 *   alpha2      — ISO 3166-1 alpha-2 (e.g. "AE")
 *   alpha3      — ISO 3166-1 alpha-3 (e.g. "ARE")
 *   numericCode — UN M49 numeric code (e.g. 784)
 *   phonePrefix — ITU dialling prefix (e.g. "+971")
 */
export async function fetchPhoneCodes() {
  try {
    const res = await staticFetch<{ data: any[] }>("/phone-codes");
    if (res?.data && res.data.length > 0) return res.data;
  } catch (e) {
    console.warn(
      "[fetchPhoneCodes] DB fetch failed, using static fallback:",
      e,
    );
  }
  // Hardcoded fallback with alpha3 + numericCode
  return [
    {
      alpha2: "AE",
      alpha3: "ARE",
      numericCode: 784,
      name: "United Arab Emirates",
      phonePrefix: "+971",
    },
    {
      alpha2: "SA",
      alpha3: "SAU",
      numericCode: 682,
      name: "Saudi Arabia",
      phonePrefix: "+966",
    },
    {
      alpha2: "QA",
      alpha3: "QAT",
      numericCode: 634,
      name: "Qatar",
      phonePrefix: "+974",
    },
    {
      alpha2: "KW",
      alpha3: "KWT",
      numericCode: 414,
      name: "Kuwait",
      phonePrefix: "+965",
    },
    {
      alpha2: "BH",
      alpha3: "BHR",
      numericCode: 48,
      name: "Bahrain",
      phonePrefix: "+973",
    },
    {
      alpha2: "OM",
      alpha3: "OMN",
      numericCode: 512,
      name: "Oman",
      phonePrefix: "+968",
    },
    {
      alpha2: "US",
      alpha3: "USA",
      numericCode: 840,
      name: "United States",
      phonePrefix: "+1",
    },
    {
      alpha2: "GB",
      alpha3: "GBR",
      numericCode: 826,
      name: "United Kingdom",
      phonePrefix: "+44",
    },
    {
      alpha2: "IN",
      alpha3: "IND",
      numericCode: 356,
      name: "India",
      phonePrefix: "+91",
    },
    {
      alpha2: "PK",
      alpha3: "PAK",
      numericCode: 586,
      name: "Pakistan",
      phonePrefix: "+92",
    },
  ];
}

/**
 * Fetch all loyalty programs from PostgreSQL LoyaltyProgram table.
 * Used in the passenger form for frequent flyer number section.
 * @param type - 'airline' | 'hotel' | '' (all)
 */
export async function fetchLoyaltyProgramsAll(type?: "airline" | "hotel") {
  try {
    const qs = type ? `?type=${type}&limit=300` : "?limit=300";
    const res = await staticFetch<{ data: any[] }>(
      `/loyalty-programs/all${qs}`,
    );
    return res?.data ?? [];
  } catch (e) {
    console.warn(
      "[fetchLoyaltyProgramsAll] DB fetch failed, using static fallback:",
      e,
    );
    return [
      {
        id: "skywards",
        name: "Emirates Skywards",
        programType: "airline",
        providerCode: "EK",
      },
      {
        id: "privilege-club",
        name: "Qatar Airways Privilege Club",
        programType: "airline",
        providerCode: "QR",
      },
      {
        id: "alfursan",
        name: "Saudia Alfursan",
        programType: "airline",
        providerCode: "SV",
      },
      {
        id: "aadvantage",
        name: "AAdvantage",
        programType: "airline",
        providerCode: "AA",
      },
      {
        id: "miles-more",
        name: "Miles & More",
        programType: "airline",
        providerCode: "LH",
      },
      {
        id: "flying-blue",
        name: "Flying Blue",
        programType: "airline",
        providerCode: "AF",
      },
      {
        id: "executive-club",
        name: "British Airways Executive Club",
        programType: "airline",
        providerCode: "BA",
      },
    ];
  }
}

export async function fetchNationalities(query?: string) {
  try {
    const qs = query
      ? `?q=${encodeURIComponent(query)}&limit=250`
      : "?limit=250";
    const res = await staticFetch<{ data: any[] }>(`/countries${qs}`);
    const rows = res?.data ?? [];
    // Derive nationalities from countries list
    return rows.map((c: any) => ({
      code: c.code,
      name: c.name,
      demonym: c.demonym || c.name,
    }));
  } catch (e) {
    console.warn(
      "[fetchNationalities] DB fetch failed, using static fallback:",
      e,
    );
    return [
      { code: "SA", name: "Saudi Arabia", demonym: "Saudi" },
      { code: "AE", name: "United Arab Emirates", demonym: "Emirati" },
      { code: "QA", name: "Qatar", demonym: "Qatari" },
      { code: "US", name: "United States", demonym: "American" },
      { code: "GB", name: "United Kingdom", demonym: "British" },
      { code: "IN", name: "India", demonym: "Indian" },
      { code: "PK", name: "Pakistan", demonym: "Pakistani" },
    ];
  }
}

/**
 * Fetch loyalty programs from PostgreSQL.
 * Falls back to a hardcoded list of common airline loyalty programs on error.
 */
export async function fetchLoyaltyPrograms(query?: string) {
  try {
    const qs = query
      ? `?active=true&q=${encodeURIComponent(query)}`
      : "?active=true";
    const res = await staticFetch<{ data: any[] }>(`/loyalty-programs${qs}`);
    const rows = res?.data ?? [];
    if (rows.length > 0) return rows;
  } catch (e) {
    console.warn(
      "[fetchLoyaltyPrograms] DB fetch failed, using static fallback:",
      e,
    );
  }
  // Hardcoded fallback
  return [
    {
      id: "skywards",
      airlineCode: "EK",
      airlineName: "Emirates",
      programName: "Emirates Skywards",
    },
    {
      id: "privilege-club",
      airlineCode: "QR",
      airlineName: "Qatar Airways",
      programName: "Privilege Club",
    },
    {
      id: "alfursan",
      airlineCode: "SV",
      airlineName: "Saudia",
      programName: "Alfursan",
    },
    {
      id: "miles-more",
      airlineCode: "LH",
      airlineName: "Lufthansa",
      programName: "Miles & More",
    },
    {
      id: "flying-blue",
      airlineCode: "AF",
      airlineName: "Air France",
      programName: "Flying Blue",
    },
    {
      id: "executive-club",
      airlineCode: "BA",
      airlineName: "British Airways",
      programName: "Executive Club",
    },
    {
      id: "aadvantage",
      airlineCode: "AA",
      airlineName: "American Airlines",
      programName: "AAdvantage",
    },
    {
      id: "mileageplus",
      airlineCode: "UA",
      airlineName: "United Airlines",
      programName: "MileagePlus",
    },
    {
      id: "skymiles",
      airlineCode: "DL",
      airlineName: "Delta Air Lines",
      programName: "SkyMiles",
    },
    {
      id: "krisflyer",
      airlineCode: "SQ",
      airlineName: "Singapore Airlines",
      programName: "KrisFlyer",
    },
  ];
}

// Real Booking Endpoints - Using the new orchestrator routes with isRefundable validation
export async function holdFlightBooking(bookingData: any) {
  try {
    // Use the new flight-booking orchestrator with isRefundable validation
    const res = await api.post("/api/flight-booking/hold", bookingData);
    return res;
  } catch (error) {
    console.error("Failed to hold flight booking:", error);
    throw error;
  }
}

export async function holdHotelBooking(bookingData: any) {
  try {
    // Use the new hotel-booking orchestrator with isRefundable validation
    const res = await api.post("/api/hotel-booking/hold", bookingData);
    return res;
  } catch (error) {
    console.error("Failed to hold hotel booking:", error);
    throw error;
  }
}

export async function listBookings(scope: string = "all") {
  try {
    const res = await apiGetWithRetry<any>(`/bookings?scope=${scope}`);
    return res?.bookings || res || [];
  } catch (error) {
    console.error("Failed to list bookings:", error);
    return []; // Return empty list on error
  }
}

// Document Management
export async function listDocuments() {
  try {
    const res = await api.get("/user/documents");
    return Array.isArray(res) ? res : [];
  } catch (error) {
    console.error("Failed to list documents:", error);
    return [];
  }
}

export async function uploadDocument(data: any) {
  try {
    const res = await api.post("/user/documents", data);
    return res;
  } catch (error) {
    console.error("Failed to upload document:", error);
    throw error;
  }
}

export async function deleteDocument(id: string) {
  try {
    await api.post(`/user/documents/${id}/delete`); // or DELETE method if supported by api object
    return true;
  } catch (error) {
    console.error(`Failed to delete document ${id}:`, error);
    throw error;
  }
}

// Minimal query key helpers used across hooks/pages
export const queryKeys = {
  auth: { user: ["auth", "user"] },
  user: { profile: ["user", "profile"] },
  search: {
    flights: (params: any) => ["search", "flights", params],
    hotels: (params: any) => ["search", "hotels", params],
  },
  bookings: {
    list: (scope: string) => ["bookings", scope],
    detail: (id: string) => ["booking", id],
    all: ["bookings", "all"],
  },
};

// Simple token helpers (persist to localStorage)
let inMemoryAccessToken: string | null =
  typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
let inMemoryRefreshToken: string | null =
  typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (typeof window !== "undefined") {
    if (token) localStorage.setItem("accessToken", token);
    else localStorage.removeItem("accessToken");
  }
}

export function setRefreshToken(token: string | null) {
  inMemoryRefreshToken = token;
  if (typeof window !== "undefined") {
    if (token) localStorage.setItem("refreshToken", token);
    else localStorage.removeItem("refreshToken");
  }
}

export function clearTokens() {
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }
}

// Helper to join base and path with exactly one slash
function joinBase(base: string, path: string): string {
  const b = (base || "").replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

// Safe logger that redacts tokens and reduces noise in production
const isProd =
  typeof import.meta !== "undefined" &&
  (import.meta as any).env?.MODE === "production";
function safeLog(...args: any[]) {
  if (isProd) return; // no-op in prod
  try {
    console.log(...args);
  } catch {}
}
function safeError(...args: any[]) {
  try {
    console.error(...args);
  } catch {}
}

// Helper to call real backend; returns parsed JSON or throws, with timeout and normalization
async function remoteFetch(path: string, opts: RequestInit = {}) {
  if (API_BASE_URL === null || typeof API_BASE_URL === "undefined") {
    throw new Error("API_BASE_URL not configured");
  }
  const url = path.startsWith("http") ? path : joinBase(API_BASE_URL, path);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((opts.headers as Record<string, string>) || {}),
  };
  if (inMemoryAccessToken) headers["Authorization"] = `Bearer [REDACTED]`;

  safeLog(`[remoteFetch] Request: ${opts.method || "GET"} ${url}`);
  try {
    const res = await fetch(url, {
      credentials: "include",
      ...opts,
      headers,
      signal: controller.signal,
    });
    safeLog(
      `[remoteFetch] Response: ${res.status} ${res.statusText} from ${url}`,
    );

    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      let msg = raw;
      try {
        const j = JSON.parse(raw);
        msg = j.message || j.error || raw;
      } catch {}
      const err: any = new Error(msg || `HTTP ${res.status}`);
      err.status = res.status;
      err.statusText = res.statusText;
      throw err;
    }

    const contentType = res.headers.get("content-type") || "";
    const result = contentType.includes("application/json")
      ? await res.json()
      : await res.text();
    return result;
  } catch (error: any) {
    safeError(`[remoteFetch] Exception:`, {
      message: error?.message,
      name: error?.name,
    });
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Real API object - no mock fallbacks
export const api = {
  async get<T = any>(path: string): Promise<T> {
    return await remoteFetch(path, { method: "GET" });
  },
  async post<T = any>(path: string, data?: unknown): Promise<T> {
    return await remoteFetch(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  async put<T = any>(path: string, data?: unknown): Promise<T> {
    return await remoteFetch(path, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  async patch<T = any>(path: string, data?: unknown): Promise<T> {
    return await remoteFetch(path, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  },
  async delete<T = any>(path: string): Promise<T> {
    return await remoteFetch(path, { method: "DELETE" });
  },
};

// Retry helper for idempotent GETs only
function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
async function apiGetWithRetry<T = any>(
  path: string,
  maxRetries = 2,
  baseDelay = 300,
): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await remoteFetch(path, { method: "GET" });
    } catch (err: any) {
      const status = err?.status;
      const retriable = !status || (status >= 500 && status < 600);
      if (attempt >= maxRetries || !retriable) throw err;
      const jitter = Math.random() * baseDelay;
      const delay = baseDelay * Math.pow(2, attempt) + jitter;
      await sleep(delay);
      attempt += 1;
    }
  }
}

// Booking API functions
export async function confirmFlightBooking(
  bookingId: string,
  paymentDetails: any,
) {
  try {
    const result = await api.post(
      `/bookings/flight/confirm/${bookingId}`,
      paymentDetails,
    );
    return result;
  } catch (error) {
    console.error("Failed to confirm flight booking:", error);
    throw error;
  }
}

export async function confirmHotelBooking(
  bookingId: string,
  paymentDetails: any,
) {
  try {
    const result = await api.post(
      `/bookings/hotel/confirm/${bookingId}`,
      paymentDetails,
    );
    return result;
  } catch (error) {
    console.error("Failed to confirm hotel booking:", error);
    throw error;
  }
}

export async function fetchWallets() {
  try {
    const result = await api.get("/wallets");
    return result;
  } catch (error) {
    console.error("Failed to fetch wallets:", error);
    throw error;
  }
}

// --- Real-time LiteAPI Handlers ---

export async function fetchHotelRates(params: {
  hotelIds: string[];
  checkin: string;
  checkout: string;
  currency?: string;
  guestNationality?: string;
  occupancies: Array<{ adults: number; children?: number[] }>;
}) {
  try {
    // LITEAPI routes are mounted at /api in booking-service
    return await api.post("/api/hotels/rates", params);
  } catch (error) {
    console.error("fetchHotelRates failed:", error);
    throw error;
  }
}

export async function prebookHotel(params: {
  offerId: string;
  price: number;
  currency: string;
}) {
  try {
    // LITEAPI routes are mounted at /api in booking-service
    return await api.post("/api/rates/prebook", params);
  } catch (error) {
    console.error("prebookHotel failed:", error);
    throw error;
  }
}

export async function bookHotel(params: {
  prebookId: string;
  guestDetails: any;
  paymentDetails?: any;
}) {
  try {
    // LITEAPI routes are mounted at /api in booking-service
    return await api.post("/api/rates/book", params);
  } catch (error) {
    console.error("bookHotel failed:", error);
    throw error;
  }
}

// --- Loyalty API Handlers ---

export async function fetchLoyaltySettings() {
  try {
    return await api.get("/loyalty/loyalties");
  } catch (error) {
    console.error("fetchLoyaltySettings failed:", error);
    throw error;
  }
}

export async function updateLoyaltySettings(settings: any) {
  try {
    return await api.put("/loyalty/loyalties", settings);
  } catch (error) {
    console.error("updateLoyaltySettings failed:", error);
    throw error;
  }
}

export async function fetchGuests() {
  try {
    return await api.get("/loyalty/guests");
  } catch (error) {
    console.error("fetchGuests failed:", error);
    throw error;
  }
}

export async function fetchGuestDetail(guestId: string) {
  try {
    return await api.get(`/loyalty/guests/${guestId}`);
  } catch (error) {
    console.error(`fetchGuestDetail failed for ${guestId}:`, error);
    throw error;
  }
}

// --- LITEAPI Booking API (List, Retrieve, Cancel) ---

export async function listHotelBookings() {
  try {
    return await api.get("/bookings");
  } catch (error) {
    console.error("listHotelBookings failed:", error);
    throw error;
  }
}

export async function getHotelBooking(bookingId: string) {
  try {
    return await api.get(`/bookings/${bookingId}`);
  } catch (error) {
    console.error(`getHotelBooking failed for ${bookingId}:`, error);
    throw error;
  }
}

export async function cancelHotelBooking(bookingId: string, reason?: string) {
  try {
    return await api.put(`/bookings/${bookingId}`, {
      status: "cancelled",
      cancellationReason: reason,
    });
  } catch (error) {
    console.error(`cancelHotelBooking failed for ${bookingId}:`, error);
    throw error;
  }
}

// --- LITEAPI Loyalty API (Guest Bookings, Enable Loyalty) ---

export async function fetchGuestBookings(guestId: string) {
  try {
    return await api.get(`/guests/${guestId}/bookings`);
  } catch (error) {
    console.error(`fetchGuestBookings failed for ${guestId}:`, error);
    throw error;
  }
}

export async function enableLoyaltyProgram(settings: {
  enabled: boolean;
  cashbackRate: number;
  programName?: string;
}) {
  try {
    return await api.post("/loyalties", settings);
  } catch (error) {
    console.error("enableLoyaltyProgram failed:", error);
    throw error;
  }
}

export async function getBookingHistory(id: string) {
  try {
    const res = await api.get(`/bookings/${id}/history`);
    return res.history || res || [];
  } catch (error) {
    console.error(`Failed to fetch history for ${id}:`, error);
    // Return dummy history for now if endpoint fails (for dev/demo)
    return [
      {
        id: "1",
        action: "Booking Created",
        date: new Date().toISOString(),
        type: "system",
        description: "Booking created successfully",
        user: "System",
      },
      {
        id: "2",
        action: "Payment Processed",
        date: new Date().toISOString(),
        type: "payment",
        description: "Payment received via Credit Card",
        user: "Admin",
      },
      {
        id: "3",
        action: "User Login",
        date: new Date(Date.now() - 3600000).toISOString(),
        type: "login",
        description: "User accessed booking details",
        user: "Customer",
      },
    ];
  }
}

export async function addBookingTransaction(id: string, transaction: any) {
  try {
    const res = await api.post(`/bookings/${id}/transactions`, transaction);
    return res;
  } catch (error) {
    console.error(`Failed to add transaction for ${id}:`, error);
    throw error;
  }
}
