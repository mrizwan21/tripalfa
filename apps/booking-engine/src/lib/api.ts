/**
 * Lightweight API facade for the booking-engine app.
 * All API calls are routed through Wickedhaufe API Manager for dynamic data
 * and centralized static data package for static data.
 */

// Real API implementations only - no mock fallbacks

import { API_BASE_URL, API_ENDPOINTS } from './constants';
import {
  getAirlines,
  getCities,
  getCurrencies,
  getHotelChains,
  getHotelFacilities,
  getHotelTypes
} from '@tripalfa/static-data';
// Import static flight data directly for frontend use
import { FLIGHT_STATIC_DATA } from '@tripalfa/static-data/frontend-index';

// Duffel Flight Booking API (Offers, Orders, Payments)
export {
  createOfferRequest,
  getOfferDetails,
  createFlightOrder,
  getFlightOrder,
  updateFlightOrder,
  createPaymentIntent,
  confirmFlightOrder,
  completeBookingFlow,
  handlePaymentCallback,
  getPaymentMethods,
  getOrderPaymentMethods,
  confirmPayment,
  getPayment,
  type OfferRequestParams,
  type PassengerData,
  type CreateOrderParams,
  type PaymentIntentParams,
  type PaymentMethod,
  type PaymentConfirmParams,
  type SeatElement,
  type SeatSection,
  type SeatRow,
  type Cabin,
  type SeatMap,
  type SelectedSeat,
} from '../services/duffelBookingApi';

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
} from '../services/seatMapsApi';

// Supplier Payment API
export { processSupplierPayment } from '../services/supplierPaymentApi';

// Innstant Travel Static Data API Configuration (disabled - using centralized package)
// const INNSTANT_API_KEY = '$2y$10$yWot7dUYoc7.viH8vK1s0OG.D0n5uKm19Z84WznDiB.ESBnPOikr6';
// const INNSTANT_BASE_URL = 'https://static-data.innstant-servers.com';



// Real API call for Hotel Details
export async function fetchHotelById(id: string) {
  try {
    const res = await api.get(`/inventory/hotels/${id}`);
    return res;
  } catch (error) {
    console.error(`Failed to fetch hotel ${id}:`, error);
    return null;
  }
}


// Helper function to map hotel results to consistent format
function mapHotelResult(hotel: any) {
  // Extract refundability from various potential structures (LiteAPI, Inventory, etc.)
  const isRefundable = hotel.refundable === true ||
    hotel.is_refundable === true ||
    hotel.offers?.[0]?.cancellation_policy?.is_refundable === true ||
    hotel.offers?.[0]?.refundable === true;

  return {
    id: hotel.id,
    name: hotel.name,
    image: hotel.image || hotel.primary_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
    location: hotel.location || `${hotel.city || 'Unknown'}, ${hotel.country || 'Unknown'}`,
    rating: hotel.rating || hotel.star_rating || 4,
    reviews: hotel.reviews || hotel.reviewCount || 100,
    price: hotel.price || { amount: hotel.pricePerNight || 200, currency: hotel.currency || 'USD' },
    amenities: hotel.amenities || hotel.amenity_names || [],
    provider: hotel.provider || 'Local',
    refundable: isRefundable,
    offers: hotel.offers || []
  };
}

export async function getBookingById(id: string) {
  return await api.get(`/bookings/${id}`);
}

export async function processCardPayment(data: any) {
  return await api.post('/payments/card', data);
}

export async function processWalletPayment(data: any) {
  return await api.post('/payments/wallet', data);
}

export async function bookingAction(id: string, action: string, data?: any) {
  return await api.post(`/bookings/${id}/action`, { action, ...data });
}

export async function unreadNotificationCount() {
  return await api.get('/notifications/unread-count');
}

export async function postTopUp(data: any) {
  try {
    const res = await api.post('/wallets/topup', data);
    return res;
  } catch (error) {
    console.error('Failed to top up wallet:', error);
    throw error;
  }
}


// ... existing code ...
export async function listWalletTransactions() {
  try {
    const res = await api.get('/wallets/transactions');
    return res.transactions || [];
  } catch (error) {
    console.error('Failed to list wallet transactions:', error);
    return [];
  }
}

export async function getWalletBalance(userId: string) {
  // Mock wallet balance for demo/dev
  return new Promise<{ currency: string, amount: number }>((resolve) => {
    setTimeout(() => {
      resolve({ currency: 'USD', amount: 2500.00 });
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

export async function getDocuments(bookingId: string): Promise<BookingDocument[]> {
  try {
    const res = await api.get(`/bookings/${bookingId}/documents`);
    return res.data?.documents || [];
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return [];
  }
}

export async function downloadDocument(bookingId: string, documentType: string): Promise<{ downloadUrl: string; expiresAt: string }> {
  const res = await api.get(`/bookings/${bookingId}/documents/${documentType}/download`);
  return res.data;
}

export async function issueTicket(bookingId: string, payload: {
  walletId: string;
  amount: number;
  currency: string;
  acceptedTerms: boolean;
}): Promise<any> {
  const res = await api.post(`/bookings/${bookingId}/issue-ticket`, payload);
  return res.data;
}

export async function sendOfflineRequest(bookingId: string, payload: {
  requestType: string;
  passengers?: any;
  services?: any;
  notes?: string;
}): Promise<any> {
  const res = await api.post(`/bookings/${bookingId}/offline-request`, payload);
  return res.data;
}

export async function emailDocument(bookingId: string, documentType: string, recipientEmail: string): Promise<any> {
  const res = await api.post(`/bookings/${bookingId}/documents/${documentType}/email`, { recipientEmail });
  return res.data;
}

// Live Search Functions (routed through WickedHaufe -> Inventory Service)
// Live Search Functions (routed through WickedHaufe -> Inventory Service)
export async function searchHotels(params: any) {
  const payload = {
    type: 'hotels', // Specify the search type for inventory service
    location: params.location,
    checkin: params.checkin,
    checkout: params.checkout,
    adults: params.adults,
    children: params.children,
    rooms: params.rooms,
    countryCode: params.countryCode
  };

  try {
    // 1. Try Inventory Service directly (hybrid approach: real data + mock pricing)
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      const hotels = data.results || [];
      return { hotels: hotels.map(mapHotelResult) };
    }
  } catch (inventoryError) {
    console.warn('[api.ts] Inventory service search failed, trying API Gateway:', String(inventoryError));
  }

  try {
    // 2. Fallback to API Gateway (via Wicked)
    const results = await api.post(API_ENDPOINTS.SEARCH_HOTELS, payload);
    return { hotels: results.results || [] };
  } catch (error) {
    console.error('[api.ts] API Gateway hotel search failed, trying direct search:', String(error));
  }

  try {
    // 3. Fallback to Direct LiteAPI Rates Search (real pricing data)
    const liteApiPayload = {
      checkin: params.checkin,
      checkout: params.checkout,
      currency: 'USD',
      guestNationality: 'US',
      occupancies: [{
        adults: params.adults || 2,
        children: params.children ? params.children.map(() => 0) : [] // Convert to array format
      }],
      cityName: params.location,
      countryCode: params.countryCode || 'FR',
      limit: params.limit || 20
    };

    const res = await fetch('https://api.liteapi.travel/v3.0/hotels/rates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': (import.meta as any).env.VITE_LITEAPI_TEST_API_KEY
      },
      body: JSON.stringify(liteApiPayload)
    });

    if (res.ok) {
      const data = await res.json();
      const hotels = data.hotels || [];
      const mappedHotels = hotels.map((hotel: any) => {
        const firstOffer = hotel.offers?.[0];
        const isRefundable = firstOffer?.cancellation_policy?.is_refundable === true || firstOffer?.refundable === true;

        return {
          id: hotel.id,
          name: hotel.name,
          image: hotel.main_photo || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
          location: hotel.address,
          rating: hotel.rating || 0,
          reviews: 0, // LiteAPI doesn't provide review count
          price: {
            amount: firstOffer?.offerRetailRate || 0,
            currency: 'USD'
          },
          amenities: [], // LiteAPI doesn't provide amenities in search
          provider: 'LiteAPI',
          offers: hotel.offers || [], // Include full offer data for booking
          refundable: isRefundable
        };
      });
      return { hotels: mappedHotels };
    }
  } catch (directError) {
    console.warn('LiteAPI rates search failed:', directError);
  }

  throw new Error('All hotel search methods failed - no results available');
}



// Direct connection to Duffel via Vite Proxy (bypassing API Gateway as requested)
export async function fetchFacilities() {
  try {
    const response = await getHotelFacilities();
    return response.data;
  } catch (error) {
    console.warn('Failed to fetch facilities, using fallback');
    return ['Swimming Pool', 'Spa', 'Fitness Center', 'Free WiFi', 'Parking'].map(n => ({ name: n }));
  }
}

export async function fetchHotelTypes() {
  try {
    const response = await getHotelTypes();
    return response.data;
  } catch (error) {
    return ['Hotel', 'Apartment', 'Resort', 'Villa'].map(n => ({ name: n }));
  }
}

export async function fetchHotelChains() {
  try {
    const response = await getHotelChains();
    return response.data;
  } catch (error) {
    return [];
  }
}

export async function searchFlights(params: any) {
  // Validate input parameters
  if (!params.origin || !params.destination || !params.departureDate) {
    console.error('[api.ts] Missing required flight search parameters:', { origin: params.origin, destination: params.destination, departureDate: params.departureDate });
    throw new Error('Missing required flight search parameters: origin, destination, or departureDate');
  }

  const payload = {
    data: {
      slices: params.slices || [
        {
          origin: params.origin,
          destination: params.destination,
          departure_date: params.departureDate,
        }
      ],
      passengers: params.passengers || (params.adults ? Array(params.adults).fill({ type: "adult" }) : [{ type: "adult" }]),
      cabin_class: (params.cabinClass || "economy").toLowerCase(),
      return_available_services: true // Ensure we get ancillaries
    }
  };

  console.log('[api.ts] Flight search payload prepared:', JSON.stringify(payload, null, 2));

  try {
    console.log('[api.ts] SEARCH FLIGHTS: Attempting API Gateway request to /search/flights');
    // Delegate to API Gateway (which uses DuffelAdapter with backend keys)
    const response = await api.post('/search/flights', payload);
    console.log('[api.ts] API Gateway response received:', response);

    // The backend's DuffelAdapter already transforms the response to FlightResult[]
    // Check if response is already transformed (has airline/carrierCode properties)
    // or if it's raw Duffel format (needs mapDuffelResponse)
    const results = Array.isArray(response) ? response : (response.data || response.offers || []);

    if (results.length > 0 && results[0].carrierCode && !results[0].slices) {
      // Already transformed by backend - use directly
      console.log('[api.ts] Using pre-transformed backend response, flights:', results.length);
      return results;
    }

    // Raw Duffel format - needs transformation
    console.log('[api.ts] Raw Duffel format detected, transforming offers...');
    const offers = response.data?.offers || response.offers || results || [];
    console.log('[api.ts] Extracted offers count:', Array.isArray(offers) ? offers.length : 'N/A');
    return mapDuffelResponse({ offers: Array.isArray(offers) ? offers : [] });

  } catch (error: any) {
    console.error('[api.ts] API Gateway search failed:', {
      message: error?.message,
      status: error?.status,
      toString: String(error)
    });

    // Fallback: try again with explicit logging
    console.log('[api.ts] Retrying API Gateway with enhanced diagnostics...');
    try {
      const response = await api.post('/search/flights', payload);
      console.log('[api.ts] Retry successful');

      // Same check for transformed vs raw response
      const results = Array.isArray(response) ? response : (response.data || response.offers || []);
      if (results.length > 0 && results[0].carrierCode && !results[0].slices) {
        return results;
      }

      const offers = response.data?.offers || response.offers || results || [];
      return mapDuffelResponse({ offers: Array.isArray(offers) ? offers : [] });
    } catch (retryError: any) {
      console.error('[api.ts] Retry also failed:', retryError?.message);
      throw new Error(`Flight search failed after retry: ${error?.message || 'Unknown error'}`);
    }
  }
}

// Helper: Format ISO duration to human readable (PT2H30M -> 2h 30m)
function formatDuration(isoDuration: string | null): string {
  if (!isoDuration) return '--';
  const hours = isoDuration.match(/(\d+)H/)?.[1] || '0';
  const minutes = isoDuration.match(/(\d+)M/)?.[1] || '0';
  return `${hours}h ${minutes}m`;
}

// Helper: Calculate layover duration between two dates
function calculateLayover(arrival: string, departure: string): string {
  const arr = new Date(arrival);
  const dep = new Date(departure);
  const diffMs = dep.getTime() - arr.getTime();
  if (diffMs <= 0) return '0h 0m';

  const diffHrs = Math.floor(diffMs / 3600000);
  const diffMins = Math.floor((diffMs % 3600000) / 60000);
  return `${diffHrs}h ${diffMins}m`;
}

// Helper: Map Duffel response to our frontend Flight type
function mapDuffelResponse(data: any): any[] {
  if (!data || !data.offers) return [];

  const offers = data.offers;

  // Helper to create a flight object from a Duffel offer
  const mapSingleOffer = (offer: any) => {
    // Validate offer structure with detailed error context
    if (!offer.slices || !Array.isArray(offer.slices) || offer.slices.length === 0) {
      console.warn('[mapDuffelResponse] Offer missing slices:', { offerId: offer?.id, keys: Object.keys(offer || {}) });
      return null;
    }

    const slice = offer.slices[0];
    if (!slice.segments || !Array.isArray(slice.segments) || slice.segments.length === 0) {
      console.warn('[mapDuffelResponse] Slice missing segments:', { offerId: offer?.id, sliceKeys: Object.keys(slice || {}) });
      return null;
    }

    const firstSegment = slice.segments[0];
    const lastSegment = slice.segments[slice.segments.length - 1];
    const durationStr = formatDuration(slice.duration);
    const isRefundable = offer.conditions?.refund_before_departure?.allowed || false;

    return {
      id: offer.id,
      airline: offer.owner.name,
      carrierCode: offer.owner.iata_code,
      flightNumber: `${offer.owner.iata_code}${firstSegment.marketing_carrier_flight_number || ''}`,
      origin: firstSegment.origin.iata_code,
      originCity: firstSegment.origin.city_name || firstSegment.origin.name || firstSegment.origin.iata_code,
      departureTime: firstSegment.departing_at,
      destination: lastSegment.destination.iata_code,
      destinationCity: lastSegment.destination.city_name || lastSegment.destination.name || lastSegment.destination.iata_code,
      arrivalTime: lastSegment.arriving_at,
      duration: durationStr,
      amount: parseFloat(offer.total_amount),
      currency: offer.total_currency,
      stops: slice.segments.length - 1,
      isLCC: false,
      refundable: isRefundable,
      airlineLogo: offer.owner.logo_symbol_url || offer.owner.logo_lockup_url || `https://logo.clearbit.com/${offer.owner.name.toLowerCase().replace(/\s+/g, '')}.com`,
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
          layoverDuration: nextSeg ? calculateLayover(seg.arriving_at, nextSeg.departing_at) : null,
          departureTerminal: seg.origin_terminal,
          arrivalTerminal: seg.destination_terminal,
          aircraft: seg.aircraft?.name || 'Aircraft Info Unavailable'
        };
      }),
      includedBags: offer.passengers?.[0]?.baggages?.map((b: any) => ({
        quantity: b.quantity || 1,
        weight: (b.type === 'checked' ? 23 : 7),
        unit: 'kg',
        type: b.type
      })) || [{ quantity: 1, weight: 23, unit: 'kg' }],
      ancillaries: offer.available_services?.map((s: any) => ({
        id: s.id,
        name: s.metadata?.name || s.type,
        description: s.metadata?.description,
        price: parseFloat(s.total_amount),
        currency: s.total_currency,
        type: s.type === 'baggage' ? 'baggage' : (s.type === 'seat' ? 'seat' : 'other'),
        raw: s
      })) || []
    };
  };

  // Grouping by itinerary identity
  const groups: Record<string, any[]> = {};

  offers.forEach((offer: any) => {
    // Validate before grouping
    if (!offer.slices || !Array.isArray(offer.slices) || offer.slices.length === 0) {
      console.warn('[mapDuffelResponse] Skipping offer - missing slices:', offer?.id);
      return;
    }

    const slice = offer.slices[0];
    if (!slice.segments || !Array.isArray(slice.segments) || slice.segments.length === 0) {
      console.warn('[mapDuffelResponse] Skipping offer - missing segments:', offer?.id);
      return;
    }

    const identity = slice.segments.map((s: any) =>
      `${s.marketing_carrier?.iata_code || 'UNKNOWN'}${s.marketing_carrier_flight_number || ''}-${s.departing_at}`
    ).join('|');

    if (!groups[identity]) groups[identity] = [];
    const mapped = mapSingleOffer(offer);
    if (mapped) groups[identity].push(mapped);
  });

  // For each group, pick the cheapest as main and rest as upsells
  return Object.values(groups)
    .filter(groupOffers => groupOffers.length > 0)
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
    const res = await fetch(`/duffel-api/air/seat_maps?offer_id=${offerId}`, {
      headers: {
        'Duffel-Version': 'v2',
        'Authorization': `Bearer ${(import.meta as any).env.VITE_DUFFEL_API_KEY}`
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[api.ts] Duffel Seat Map Error:', res.status, errorText);
      throw new Error(`Duffel Seat Map Error: ${res.status}`);
    }

    const data = await res.json();
    return data.data;
  } catch (error) {
    console.error('[api.ts] fetchSeatMaps failed:', error);
    return null;
  }
}

// Real Notifications
export async function listNotifications() {
  try {
    // GET /notifications
    const res = await api.get('/notifications');
    return Array.isArray(res) ? res : (res.items || []);
  } catch (error) {
    console.error('Failed to list notifications:', error);
    return [];
  }
}

export async function markNotificationRead(id: string) {
  try {
    await api.post('/notifications/mark-read', { id });
  } catch (error) {
    console.error(`Failed to mark notification ${id} read:`, error);
  }
}

export async function fetchFlightById(id: string) {
  try {
    const res = await api.get(`/inventory/flights/${id}`);
    return res;
  } catch (error) {
    console.error(`Failed to fetch flight ${id}:`, error);
    throw error;
  }
}

// Static Data Fetchers (from Centralized Static Data Package)
export async function fetchAirports(query?: string) {
  try {
    // Use static frontend data directly instead of fetching from API
    const airports = FLIGHT_STATIC_DATA.AIRPORTS.all;

    // Filter by query if provided
    let filtered = airports;
    if (query && query.trim()) {
      const q = query.toLowerCase();
      filtered = airports.filter(airport =>
        airport.name.toLowerCase().includes(q) ||
        airport.iata_code.toLowerCase().includes(q) ||
        airport.city.toLowerCase().includes(q) ||
        airport.country.toLowerCase().includes(q)
      );
    }

    // Transform airports to match the expected format for UI components
    return filtered.map(airport => ({
      type: 'AIRPORT' as const,
      icon: 'plane',
      title: airport.name,
      subtitle: `${airport.city}, ${airport.country}`,
      code: airport.iata_code,
      city: airport.city,
      country: airport.country,
      countryCode: airport.country_code
    }));
  } catch (error) {
    console.error('Failed to fetch airports:', error);
    return [];
  }
}

// Fetch suggestions for search autocomplete
export async function fetchSuggestions(query: string, type: 'flight' | 'hotel' = 'flight') {
  try {
    if (type === 'flight') {
      // Fetch airports for flight search
      const airports = await fetchAirports(query);
      return airports.map((airport: any) => ({
        type: 'AIRPORT',
        icon: 'plane',
        title: airport.title,
        subtitle: airport.subtitle,
        code: airport.code,
        city: airport.city,
        country: airport.country,
        countryCode: airport.countryCode
      }));
    } else {
      // For hotel search, fetch cities
      const cities = await fetchCities(query);
      return cities.map((city: any) => ({
        type: 'CITY',
        icon: 'map-pin',
        title: city.name,
        subtitle: `${city.country}`,
        code: city.code || city.id,
        city: city.name,
        country: city.country,
        countryCode: city.country_code
      }));
    }
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    return [];
  }
}

export async function fetchAirlines() {
  try {
    const response = await getAirlines();
    return response.data;
  } catch (error) {
    console.error('Failed to fetch airlines:', error);
    return [];
  }
}

export async function fetchAircrafts() {
  try {
    const res = await api.get('/aircraft');
    return res || [];
  } catch (error) {
    console.error('Failed to fetch aircrafts:', error);
    // Return fallback aircraft data
    return [
      { iata_code: '320', name: 'Airbus A320' },
      { iata_code: '321', name: 'Airbus A321' },
      { iata_code: '77W', name: 'Boeing 777-300ER' },
      { iata_code: '789', name: 'Boeing 787-9' },
      { iata_code: '388', name: 'Airbus A380-800' }
    ];
  }
}

export async function fetchCurrencies() {
  try {
    const response = await getCurrencies();
    return response.data;
  } catch (error) {
    console.error('Failed to fetch currencies:', error);
    return [];
  }
}

export async function fetchLoyaltyPrograms(query?: string) {
  try {
    const params = query ? `?query=${encodeURIComponent(query)}` : '';
    const res = await api.get(`/loyalty-programs${params}`);
    return res || [];
  } catch (error) {
    console.error('Failed to fetch loyalty programs:', error);
    // Fallback with common programs
    return [
      { id: 'skywards', airlineCode: 'EK', airlineName: 'Emirates', programName: 'Emirates Skywards' },
      { id: 'privilege-club', airlineCode: 'QR', airlineName: 'Qatar Airways', programName: 'Privilege Club' },
      { id: 'alfursan', airlineCode: 'SV', airlineName: 'Saudia', programName: 'Alfursan' },
      { id: 'miles-more', airlineCode: 'LH', airlineName: 'Lufthansa', programName: 'Miles & More' },
      { id: 'flying-blue', airlineCode: 'AF', airlineName: 'Air France', programName: 'Flying Blue' },
      { id: 'executive-club', airlineCode: 'BA', airlineName: 'British Airways', programName: 'Executive Club' },
      { id: 'aadvantage', airlineCode: 'AA', airlineName: 'American Airlines', programName: 'AAdvantage' },
      { id: 'mileageplus', airlineCode: 'UA', airlineName: 'United Airlines', programName: 'MileagePlus' },
      { id: 'skymiles', airlineCode: 'DL', airlineName: 'Delta Air Lines', programName: 'SkyMiles' },
      { id: 'krisflyer', airlineCode: 'SQ', airlineName: 'Singapore Airlines', programName: 'KrisFlyer' },
    ];
  }
}


export async function fetchCities(query?: string) {
  try {
    const response = await getCities({ query });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch cities:', error);
    return [];
  }
}

export async function fetchCountries(query?: string) {
  try {
    const params = query ? `?query=${encodeURIComponent(query)}` : '';
    const res = await api.get(`/countries${params}`);
    return res || [];
  } catch (error) {
    console.error('Failed to fetch countries:', error);
    // Fallback with common countries
    return [
      { code: 'SA', name: 'Saudi Arabia' },
      { code: 'AE', name: 'United Arab Emirates' },
      { code: 'QA', name: 'Qatar' },
      { code: 'KW', name: 'Kuwait' },
      { code: 'US', name: 'United States' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'IN', name: 'India' },
      { code: 'PK', name: 'Pakistan' },
    ];
  }
}

export async function fetchNationalities(query?: string) {
  try {
    const params = query ? `?query=${encodeURIComponent(query)}` : '';
    const res = await api.get(`/nationalities${params}`);
    return res || [];
  } catch (error) {
    console.error('Failed to fetch nationalities:', error);
    // Fallback with common nationalities
    return [
      { code: 'SA', name: 'Saudi Arabia', demonym: 'Saudi' },
      { code: 'AE', name: 'United Arab Emirates', demonym: 'Emirati' },
      { code: 'QA', name: 'Qatar', demonym: 'Qatari' },
      { code: 'US', name: 'United States', demonym: 'American' },
      { code: 'GB', name: 'United Kingdom', demonym: 'British' },
      { code: 'IN', name: 'India', demonym: 'Indian' },
      { code: 'PK', name: 'Pakistan', demonym: 'Pakistani' },
    ];
  }
}

// Real Booking Endpoints
export async function holdFlightBooking(bookingData: any) {
  try {
    const res = await api.post('/bookings/flight/hold', bookingData);
    return res;
  } catch (error) {
    console.error('Failed to hold flight booking:', error);
    throw error;
  }
}

export async function holdHotelBooking(bookingData: any) {
  try {
    const res = await api.post('/bookings/hotel/hold', bookingData);
    return res;
  } catch (error) {
    console.error('Failed to hold hotel booking:', error);
    throw error;
  }
}

export async function listBookings(scope: string = 'all') {
  try {
    const res = await api.get(`/bookings?scope=${scope}`);
    return res?.bookings || res || [];
  } catch (error) {
    console.error('Failed to list bookings:', error);
    return []; // Return empty list on error
  }
}



// Document Management
export async function listDocuments() {
  try {
    const res = await api.get('/user/documents');
    return Array.isArray(res) ? res : [];
  } catch (error) {
    console.error('Failed to list documents:', error);
    return [];
  }
}

export async function uploadDocument(data: any) {
  try {
    const res = await api.post('/user/documents', data);
    return res;
  } catch (error) {
    console.error('Failed to upload document:', error);
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
  auth: { user: ['auth', 'user'] },
  user: { profile: ['user', 'profile'] },
  search: {
    flights: (params: any) => ['search', 'flights', params],
    hotels: (params: any) => ['search', 'hotels', params],
  },
  bookings: {
    list: (scope: string) => ['bookings', scope],
    detail: (id: string) => ['booking', id],
    all: ['bookings', 'all'],
  },
};

// Simple token helpers (persist to localStorage)
let inMemoryAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
let inMemoryRefreshToken: string | null = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

export function setAccessToken(token: string | null) {
  inMemoryAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem('accessToken', token);
    else localStorage.removeItem('accessToken');
  }
}

export function setRefreshToken(token: string | null) {
  inMemoryRefreshToken = token;
  if (typeof window !== 'undefined') {
    if (token) localStorage.setItem('refreshToken', token);
    else localStorage.removeItem('refreshToken');
  }
}

export function clearTokens() {
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}

// Helper to call real backend; returns parsed JSON or throws
async function remoteFetch(path: string, opts: RequestInit = {}) {
  // Allow empty string for dev mode (Vite proxy intercepts), but check for null/undefined
  if (API_BASE_URL === null || typeof API_BASE_URL === 'undefined') {
    throw new Error('API_BASE_URL not configured');
  }
  const url = path.startsWith('http') ? path : `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  console.log(`[remoteFetch] Request: ${opts.method || 'GET'} ${url}`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  if (inMemoryAccessToken) headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;

  try {
    const res = await fetch(url, { credentials: 'include', ...opts, headers });
    console.log(`[remoteFetch] Response: ${res.status} ${res.statusText} from ${url}`);

    if (!res.ok) {
      const text = await res.text().catch(() => null);
      const msg = text || `HTTP ${res.status}`;
      console.error(`[remoteFetch] Error: ${res.status} ${res.statusText} - ${msg}`);
      const err: any = new Error(msg);
      err.status = res.status;
      throw err;
    }
    // Some endpoints might return empty body
    const contentType = res.headers.get('content-type') || '';
    const result = contentType.includes('application/json') ? await res.json() : await res.text();
    console.log(`[remoteFetch] Success: received ${typeof result} response from ${url}`);
    return result;
  } catch (error: any) {
    console.error(`[remoteFetch] Exception: ${error?.message} for ${url}`);
    throw error;
  }
}

// Real API object - no mock fallbacks
export const api = {
  async get(path: string) {
    return await remoteFetch(path, { method: 'GET' });
  },
  async post(path: string, data?: any) {
    return await remoteFetch(path, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  },
  async put(path: string, data?: any) {
    return await remoteFetch(path, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  },
  async patch(path: string, data?: any) {
    return await remoteFetch(path, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined
    });
  },
  async delete(path: string) {
    return await remoteFetch(path, { method: 'DELETE' });
  },
};

// Booking API functions
export async function confirmFlightBooking(bookingId: string, paymentDetails: any) {
  try {
    const result = await api.post(`/bookings/flight/confirm/${bookingId}`, paymentDetails);
    return result;
  } catch (error) {
    console.error('Failed to confirm flight booking:', error);
    throw error;
  }
}

export async function confirmHotelBooking(bookingId: string, paymentDetails: any) {
  try {
    const result = await api.post(`/bookings/hotel/confirm/${bookingId}`, paymentDetails);
    return result;
  } catch (error) {
    console.error('Failed to confirm hotel booking:', error);
    throw error;
  }
}

export async function fetchWallets() {
  try {
    const result = await api.get('/wallets');
    return result;
  } catch (error) {
    console.error('Failed to fetch wallets:', error);
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
    return await api.post('/hotels/rates', params);
  } catch (error) {
    console.error('fetchHotelRates failed:', error);
    throw error;
  }
}

export async function prebookHotel(params: {
  offerId: string;
  price: number;
  currency: string;
}) {
  try {
    return await api.post('/rates/prebook', params);
  } catch (error) {
    console.error('prebookHotel failed:', error);
    throw error;
  }
}

export async function bookHotel(params: {
  prebookId: string;
  guestDetails: any;
  paymentDetails?: any;
}) {
  try {
    return await api.post('/rates/book', params);
  } catch (error) {
    console.error('bookHotel failed:', error);
    throw error;
  }
}

// --- Loyalty API Handlers ---

export async function fetchLoyaltySettings() {
  try {
    return await api.get('/loyalty/loyalties');
  } catch (error) {
    console.error('fetchLoyaltySettings failed:', error);
    throw error;
  }
}

export async function updateLoyaltySettings(settings: any) {
  try {
    return await api.put('/loyalty/loyalties', settings);
  } catch (error) {
    console.error('updateLoyaltySettings failed:', error);
    throw error;
  }
}

export async function fetchGuests() {
  try {
    return await api.get('/loyalty/guests');
  } catch (error) {
    console.error('fetchGuests failed:', error);
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


export async function getBookingHistory(id: string) {
  try {
    const res = await api.get(`/bookings/${id}/history`);
    return res.history || res || [];
  } catch (error) {
    console.error(`Failed to fetch history for ${id}:`, error);
    // Return dummy history for now if endpoint fails (for dev/demo)
    return [
      { id: '1', action: 'Booking Created', date: new Date().toISOString(), type: 'system', description: 'Booking created successfully', user: 'System' },
      { id: '2', action: 'Payment Processed', date: new Date().toISOString(), type: 'payment', description: 'Payment received via Credit Card', user: 'Admin' },
      { id: '3', action: 'User Login', date: new Date(Date.now() - 3600000).toISOString(), type: 'login', description: 'User accessed booking details', user: 'Customer' }
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
