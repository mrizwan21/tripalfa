/**
 * Duffel Flight Service
 *
 * A comprehensive service layer for Duffel flight operations.
 * Provides a clean, typed interface for flight search, booking, and management.
 *
 * Architecture:
 * Frontend → duffelFlightService → duffelApiManager → API Gateway → Booking Service → Duffel API
 */

import type { api as ApiClientInstance } from "../lib/api";

// Lazy import to avoid circular dependency
// Using require() for lazy loading - works in Vite/Webpack builds
// TODO: Replace with ESM dynamic import() when circular dependency is resolved
type ApiClient = typeof ApiClientInstance;
let api: ApiClient | undefined;
function getApi() {
  if (!api) api = require("../lib/api").api as ApiClient;
  return api;
}

import type {
  DuffelOffer,
  DuffelOfferRequest,
  DuffelOrder,
  DuffelSeatMap,
  DuffelService,
  DuffelOrderCancellation,
  FlightSearchResult,
  FlightSegment,
  FlightExtraSlice,
  CreateOfferRequestParams,
  CreateOrderParams,
  CabinClass,
} from "../types/duffel";

// ============================================================================
// TYPES
// ============================================================================

export interface SearchFlightsParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: CabinClass;
  tripType?: "roundTrip" | "oneWay" | "multiCity";
  legs?: Array<{
    origin: string;
    destination: string;
    date: string;
  }>;
  // Private fares support
  source?: "duffel" | "alliance" | "airline" | "corporate";
  payment_partner?: string;
  brand_id?: string;
  loyalty_programme_accounts?: Array<{
    airline_iata_code: string;
    account_number: string;
  }>;
}

export interface SearchFlightsResult {
  success: boolean;
  offers: FlightSearchResult[];
  offerRequestId: string;
  total: number;
  cached: boolean;
}

export interface OfferDetailsResult {
  success: boolean;
  offer: DuffelOffer | null;
  error?: string;
}

export interface CreateOrderResult {
  success: boolean;
  order: DuffelOrder | null;
  error?: string;
}

export interface SeatMapResult {
  success: boolean;
  seatMaps: DuffelSeatMap[];
  error?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse ISO 8601 duration to human-readable format
 * PT2H30M → "2h 30m"
 */
function parseDuration(isoDuration: string | null | undefined): string {
  if (!isoDuration) return "--";
  const hours = isoDuration.match(/(\d+)H/)?.[1] || "0";
  const minutes = isoDuration.match(/(\d+)M/)?.[1] || "0";
  return `${hours}h ${minutes}m`;
}

/**
 * Extract time from ISO datetime string
 * "2024-01-15T14:30:00" → "14:30"
 */
function extractTime(isoDatetime: string | null | undefined): string {
  if (!isoDatetime) return "--:--";
  return isoDatetime.split("T")[1]?.substring(0, 5) ?? "--:--";
}

/**
 * Calculate layover duration between arrival and departure
 */
function calculateLayover(arrival: string, departure: string): string {
  const arr = new Date(arrival);
  const dep = new Date(departure);
  const diffMs = dep.getTime() - arr.getTime();
  if (diffMs <= 0) return "0h 0m";

  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);
  return `${diffHrs}h ${diffMins}m`;
}

/**
 * Map Duffel offer to frontend FlightSearchResult format
 */
function mapOfferToFlightResult(offer: DuffelOffer): FlightSearchResult | null {
  try {
    const slices = offer.slices ?? [];
    if (slices.length === 0) return null;

    // Determine trip type
    const tripType: "one-way" | "round-trip" | "multi-city" =
      slices.length === 1
        ? "one-way"
        : slices.length === 2
          ? "round-trip"
          : "multi-city";

    // Process outbound slice (first slice)
    const outSlice = slices[0];
    const outSegs = outSlice?.segments ?? [];
    if (outSegs.length === 0) return null;

    const outFirst = outSegs[0];
    const outLast = outSegs[outSegs.length - 1];

    // Process extra slices (return / multi-city legs)
    const extraSlices: FlightExtraSlice[] = slices.slice(1).map((sl) => {
      const segs = sl?.segments ?? [];
      const first = segs[0];
      const last = segs[segs.length - 1];
      return {
        origin: first?.origin?.iata_code || "--",
        originCity: first?.origin?.city_name || "",
        destination: last?.destination?.iata_code || "--",
        destCity: last?.destination?.city_name || "",
        departureTime: extractTime(first?.departing_at),
        arrivalTime: extractTime(last?.arriving_at),
        duration: parseDuration(sl?.duration),
        stops: Math.max(0, (segs.length || 1) - 1),
      };
    });

    // Map segments
    const segments: FlightSegment[] = outSegs.map((seg, idx) => {
      const nextSeg = outSegs[idx + 1];
      return {
        id: seg.id,
        origin: seg.origin?.iata_code || "--",
        originCity: seg.origin?.city_name || seg.origin?.name || "",
        destination: seg.destination?.iata_code || "--",
        destinationCity:
          seg.destination?.city_name || seg.destination?.name || "",
        departureTime: seg.departing_at,
        arrivalTime: seg.arriving_at,
        flightNumber: `${seg.marketing_carrier?.iata_code ?? ""}${seg.marketing_carrier_flight_number ?? ""}`,
        airline:
          seg.operating_carrier?.name ||
          seg.marketing_carrier?.name ||
          "Unknown",
        duration: parseDuration(seg.duration),
        layoverDuration: nextSeg
          ? calculateLayover(seg.arriving_at, nextSeg.departing_at)
          : null,
        departureTerminal: seg.origin_terminal ?? null,
        arrivalTerminal: seg.destination_terminal ?? null,
        aircraft: seg.aircraft?.name || undefined,
      };
    });

    // Check refundability
    const isRefundable =
      offer.conditions?.refund_before_departure?.allowed === true;

    // Map included baggage
    const includedBags =
      offer.passengers?.[0]?.baggages?.map((b) => ({
        quantity: b.quantity ?? 1,
        weight: b.maximum_weight_kg,
        unit: "kg",
        type: b.type,
      })) ?? [];

    return {
      id: offer.id,
      offerId: offer.id,
      tripType,
      airline:
        outFirst?.operating_carrier?.name ||
        outFirst?.marketing_carrier?.name ||
        "Unknown Airline",
      carrierCode:
        outFirst?.operating_carrier?.iata_code ||
        outFirst?.marketing_carrier?.iata_code ||
        "",
      flightNumber: `${outFirst?.marketing_carrier?.iata_code ?? ""}${outFirst?.marketing_carrier_flight_number ?? ""}`,
      departureTime: extractTime(outFirst?.departing_at),
      origin: outFirst?.origin?.iata_code || "",
      originCity: outFirst?.origin?.city_name || "",
      arrivalTime: extractTime(outLast?.arriving_at),
      destination: outLast?.destination?.iata_code || "",
      destinationCity: outLast?.destination?.city_name || "",
      duration: parseDuration(outSlice?.duration),
      stops: Math.max(0, (outSegs.length || 1) - 1),
      amount: parseFloat(offer.total_amount) || 0,
      currency: offer.total_currency || "USD",
      refundable: isRefundable,
      includedBags,
      segments,
      extraSlices,
      rawOffer: offer,
    };
  } catch (error) {
    console.error("[duffelFlightService] Error mapping offer:", error);
    return null;
  }
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class DuffelFlightService {
  private baseUrl = "/api/flights";

  /**
   * Search for flights
   * Main entry point for flight search functionality
   */
  async searchFlights(
    params: SearchFlightsParams,
  ): Promise<SearchFlightsResult> {
    try {
      // Build offer request parameters
      const offerParams: CreateOfferRequestParams =
        this.buildOfferRequestParams(params);

      console.log(
        "[duffelFlightService] Searching flights with params:",
        offerParams,
      );

      // Call API
      const apiModule = await getApi();
      const response = await apiModule.post<{
        offers: DuffelOffer[];
        id: string;
      }>(`${this.baseUrl}/offer-requests`, {
        ...offerParams,
        return_available_services: true,
      });

      // Map offers to frontend format
      const offers = (response.offers || [])
        .map(mapOfferToFlightResult)
        .filter((o): o is FlightSearchResult => o !== null);

      console.log("[duffelFlightService] Mapped offers:", offers.length);

      return {
        success: true,
        offers,
        offerRequestId: response.id || "",
        total: offers.length,
        cached: false,
      };
    } catch (error: any) {
      console.error("[duffelFlightService] Search failed:", error);
      return {
        success: false,
        offers: [],
        offerRequestId: "",
        total: 0,
        cached: false,
        error: error?.message || "Failed to search flights",
      } as SearchFlightsResult & { error: string };
    }
  }

  /**
   * Build offer request parameters from search params
   */
  private buildOfferRequestParams(
    params: SearchFlightsParams,
  ): CreateOfferRequestParams {
    // Build slices based on trip type
    let slices: CreateOfferRequestParams["slices"] = [];

    if (params.tripType === "multiCity" && params.legs?.length) {
      // Multi-city: use provided legs
      slices = params.legs.map((leg) => ({
        origin: leg.origin,
        destination: leg.destination,
        departure_date: leg.date,
      }));
    } else {
      // One-way or round-trip
      slices = [
        {
          origin: params.origin,
          destination: params.destination,
          departure_date: params.departureDate,
        },
      ];

      // Add return slice for round-trip
      if (params.returnDate && params.tripType !== "oneWay") {
        slices.push({
          origin: params.destination,
          destination: params.origin,
          departure_date: params.returnDate,
        });
      }
    }

    // Build passengers array
    const passengers: CreateOfferRequestParams["passengers"] = [];

    for (let i = 0; i < (params.adults || 1); i++) {
      passengers.push({ type: "adult" });
    }
    for (let i = 0; i < (params.children || 0); i++) {
      passengers.push({ type: "child" });
    }
    for (let i = 0; i < (params.infants || 0); i++) {
      passengers.push({ type: "infant" });
    }

    return {
      slices,
      passengers,
      cabin_class: params.cabinClass || "economy",
      // Private fares support
      ...(params.source && { source: params.source }),
      ...(params.payment_partner && {
        payment_partner: params.payment_partner,
      }),
      ...(params.brand_id && { brand_id: params.brand_id }),
      ...(params.loyalty_programme_accounts && {
        loyalty_programme_accounts: params.loyalty_programme_accounts,
      }),
    };
  }

  /**
   * Get offer details by ID
   */
  async getOfferDetails(offerId: string): Promise<OfferDetailsResult> {
    try {
      const response = await api.get<{ offer: DuffelOffer }>(
        `${this.baseUrl}/offers/${offerId}`,
      );

      return {
        success: true,
        offer: response.offer || (response as any),
      };
    } catch (error: any) {
      console.error("[duffelFlightService] Get offer details failed:", error);
      return {
        success: false,
        offer: null,
        error: error?.message || "Failed to get offer details",
      };
    }
  }

  /**
   * Create a flight order (booking)
   */
  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    try {
      console.log("[duffelFlightService] Creating order with params:", params);

      const response = await api.post<{ order: DuffelOrder }>(
        `${this.baseUrl}/orders`,
        params,
      );

      return {
        success: true,
        order: response.order || (response as any),
      };
    } catch (error: any) {
      console.error("[duffelFlightService] Create order failed:", error);
      return {
        success: false,
        order: null,
        error: error?.message || "Failed to create order",
      };
    }
  }

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<DuffelOrder | null> {
    try {
      const response = await api.get<{ order: DuffelOrder }>(
        `${this.baseUrl}/orders/${orderId}`,
      );
      return response.order || (response as any);
    } catch (error) {
      console.error("[duffelFlightService] Get order failed:", error);
      return null;
    }
  }

  /**
   * List orders
   */
  async listOrders(params?: {
    limit?: number;
    offset?: number;
  }): Promise<DuffelOrder[]> {
    try {
      const qs = new URLSearchParams();
      if (params?.limit) qs.append("limit", params.limit.toString());
      if (params?.offset) qs.append("offset", params.offset.toString());
      const query = qs.toString() ? `?${qs.toString()}` : "";

      const response = await api.get<{ orders: DuffelOrder[] }>(
        `${this.baseUrl}/orders${query}`,
      );
      return response.orders || (response as any);
    } catch (error) {
      console.error("[duffelFlightService] List orders failed:", error);
      return [];
    }
  }

  /**
   * Get seat maps for an offer or order
   */
  async getSeatMaps(
    offerId?: string,
    orderId?: string,
  ): Promise<SeatMapResult> {
    try {
      const qs = new URLSearchParams();
      if (offerId) qs.append("offer_id", offerId);
      if (orderId) qs.append("order_id", orderId);
      const query = qs.toString() ? `?${qs.toString()}` : "";

      const response = await api.get<{ data: DuffelSeatMap[] }>(
        `${this.baseUrl}/seat-maps${query}`,
      );

      return {
        success: true,
        seatMaps: response.data || (response as any),
      };
    } catch (error: any) {
      console.error("[duffelFlightService] Get seat maps failed:", error);
      return {
        success: false,
        seatMaps: [],
        error: error?.message || "Failed to get seat maps",
      };
    }
  }

  /**
   * Add services to an order (baggage, seats, meals)
   */
  async addOrderServices(
    orderId: string,
    services: DuffelService[],
  ): Promise<DuffelOrder | null> {
    try {
      const response = await api.post<{ order: DuffelOrder }>(
        `${this.baseUrl}/order-services`,
        { order_id: orderId, services },
      );
      return response.order || (response as any);
    } catch (error) {
      console.error("[duffelFlightService] Add order services failed:", error);
      return null;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<DuffelOrderCancellation | null> {
    try {
      const response = await api.post<{
        cancellation: DuffelOrderCancellation;
      }>(`${this.baseUrl}/order-cancellations`, { order_id: orderId });
      return response.cancellation || (response as any);
    } catch (error) {
      console.error("[duffelFlightService] Cancel order failed:", error);
      return null;
    }
  }

  // ============================================================================
  // Hold Orders (Book Now, Pay Later)
  // ============================================================================

  /**
   * Create a hold order (book now, pay later)
   * POST /api/flights/orders/hold
   *
   * This creates an order with type: 'hold' which reserves the booking
   * for a limited time before payment is required.
   */
  async createHoldOrder(params: {
    selected_offers: string[];
    passengers: Array<{
      id?: string;
      type: "adult" | "child" | "infant";
      given_name: string;
      family_name: string;
      email: string;
      phone_number: string;
      born_at?: string;
      gender?: "m" | "f";
      title?: "mr" | "mrs" | "ms" | "miss" | "dr" | "prof";
    }>;
    contact?: {
      email: string;
      phone: string;
    };
    userId?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    success: boolean;
    order?: DuffelOrder;
    payment_required_by?: string;
    error?: string;
  }> {
    try {
      console.log(
        "[duffelFlightService] Creating hold order with offers:",
        params.selected_offers,
      );

      const response = await api.post<{
        success: boolean;
        data: DuffelOrder;
        payment_required_by?: string;
        error?: string;
      }>(`${this.baseUrl}/orders/hold`, params);

      return {
        success: response.success,
        order: response.data || (response as any),
        payment_required_by: response.payment_required_by,
      };
    } catch (error: any) {
      console.error("[duffelFlightService] Create hold order failed:", error);
      return {
        success: false,
        error: error?.message || "Failed to create hold order",
      };
    }
  }

  /**
   * Pay for a hold order
   * POST /api/flights/orders/:id/pay
   *
   * This pays for a hold order using Duffel balance or card
   */
  async payForOrder(
    orderId: string,
    paymentMethodType: "balance" | "card" = "balance",
  ): Promise<{
    success: boolean;
    order?: DuffelOrder;
    payment_intent?: any;
    error?: string;
  }> {
    try {
      console.log("[duffelFlightService] Paying for order:", orderId);

      const response = await api.post<{
        success: boolean;
        data: {
          order_id: string;
          payment_intent: any;
          status: string;
        };
        error?: string;
      }>(`${this.baseUrl}/orders/${orderId}/pay`, {
        payment_method_type: paymentMethodType,
      });

      return {
        success: response.success,
        payment_intent: response.data?.payment_intent,
      };
    } catch (error: any) {
      console.error("[duffelFlightService] Pay for order failed:", error);
      return {
        success: false,
        error: error?.message || "Failed to pay for order",
      };
    }
  }

  /**
   * Create a payment intent for a hold order
   * POST /api/flights/payment-intents
   */
  async createPaymentIntent(params: {
    order_id: string;
    amount?: string;
    currency?: string;
    payment_method?: { type: "balance" | "card" };
  }): Promise<{
    success: boolean;
    payment_intent?: any;
    error?: string;
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        data: any;
        error?: string;
      }>(`${this.baseUrl}/payment-intents`, params);

      return {
        success: response.success,
        payment_intent: response.data,
      };
    } catch (error: any) {
      console.error(
        "[duffelFlightService] Create payment intent failed:",
        error,
      );
      return {
        success: false,
        error: error?.message || "Failed to create payment intent",
      };
    }
  }

  /**
   * Get payment intent by ID
   * GET /api/flights/payment-intents/:id
   */
  async getPaymentIntent(paymentIntentId: string): Promise<any> {
    try {
      const response = await api.get<{
        success: boolean;
        data: any;
      }>(`${this.baseUrl}/payment-intents/${paymentIntentId}`);
      return response.data || response;
    } catch (error) {
      console.error("[duffelFlightService] Get payment intent failed:", error);
      return null;
    }
  }

  /**
   * Confirm a payment intent
   * POST /api/flights/payment-intents/:id/confirm
   */
  async confirmPaymentIntent(paymentIntentId: string): Promise<{
    success: boolean;
    payment_intent?: any;
    error?: string;
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        data: any;
        error?: string;
      }>(`${this.baseUrl}/payment-intents/${paymentIntentId}/confirm`);

      return {
        success: response.success,
        payment_intent: response.data,
      };
    } catch (error: any) {
      console.error(
        "[duffelFlightService] Confirm payment intent failed:",
        error,
      );
      return {
        success: false,
        error: error?.message || "Failed to confirm payment intent",
      };
    }
  }

  /**
   * Search airports (autocomplete)
   */
  async searchAirports(query: string): Promise<any[]> {
    try {
      const response = await api.get<{ data: any[] }>(
        `/api/duffel/airports?q=${encodeURIComponent(query)}&limit=10`,
      );
      return response.data || (response as any);
    } catch (error) {
      console.error("[duffelFlightService] Search airports failed:", error);
      return [];
    }
  }

  /**
   * Find airports within a geographic area
   * Documentation: https://duffel.com/docs/guides/finding-airports-within-an-area
   *
   * Use cases:
   * - Find airports near a specific location (e.g., near Lagos, Portugal)
   * - Find nearby airports when traveling to a destination without its own airport
   * - Support "airports near me" functionality
   *
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @param radiusMeters - Search radius in meters (optional, default: 100000 = 100km)
   * @param query - Optional search string to filter results
   */
  async findAirportsWithinArea(
    latitude: number,
    longitude: number,
    radiusMeters?: number,
    query?: string,
  ): Promise<{
    success: boolean;
    places?: any[];
    searchParams?: {
      latitude: number;
      longitude: number;
      radiusMeters: number;
      query?: string;
    };
    error?: string;
  }> {
    try {
      const params = new URLSearchParams();
      params.append("lat", String(latitude));
      params.append("lng", String(longitude));

      if (radiusMeters) {
        params.append("rad", String(radiusMeters));
      }

      if (query) {
        params.append("query", query);
      }

      const response = await api.get<{
        success: boolean;
        data: any[];
        searchParams: {
          latitude: number;
          longitude: number;
          radiusMeters: number;
          query?: string;
        };
      }>(`/api/duffel/places/suggestions?${params}`);

      return {
        success: response.success,
        places: response.data,
        searchParams: response.searchParams,
      };
    } catch (error: any) {
      console.error(
        "[duffelFlightService] Find airports within area failed:",
        error,
      );
      return {
        success: false,
        error: error?.message || "Failed to find airports within area",
      };
    }
  }

  /**
   * Find nearby airports - convenience method
   * Returns only airports (not cities) near a location
   *
   * @param latitude - Latitude coordinate
   * @param longitude - Longitude coordinate
   * @param radiusKm - Search radius in kilometers (optional, default: 100)
   */
  async findNearbyAirports(
    latitude: number,
    longitude: number,
    radiusKm?: number,
  ): Promise<{
    success: boolean;
    airports?: Array<{
      id: string;
      iataCode: string;
      icaoCode?: string;
      name: string;
      cityName?: string;
      cityCode?: string;
      countryName?: string;
      countryCode?: string;
      latitude: number;
      longitude: number;
      timeZone?: string;
    }>;
    count?: number;
    searchLocation?: {
      latitude: number;
      longitude: number;
      radiusKm: number;
    };
    error?: string;
  }> {
    try {
      const params = new URLSearchParams();
      params.append("lat", String(latitude));
      params.append("lng", String(longitude));

      if (radiusKm) {
        params.append("radius", String(radiusKm));
      }

      const response = await api.get<{
        success: boolean;
        data: any[];
        count: number;
        searchLocation: {
          latitude: number;
          longitude: number;
          radiusKm: number;
        };
      }>(`/api/duffel/nearby-airports?${params}`);

      return {
        success: response.success,
        airports: response.data,
        count: response.count,
        searchLocation: response.searchLocation,
      };
    } catch (error: any) {
      console.error(
        "[duffelFlightService] Find nearby airports failed:",
        error,
      );
      return {
        success: false,
        error: error?.message || "Failed to find nearby airports",
      };
    }
  }
}

// Export singleton instance
const duffelFlightService = new DuffelFlightService();
export default duffelFlightService;

// Export class for testing
{ DuffelFlightService }
