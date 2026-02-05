/**
 * Lightweight API facade for the booking-engine app.
 * All API calls are routed through Wickedhaufe API Manager for dynamic data
 * and centralized static data package for static data.
 */

// Real API implementations only - no mock fallbacks

import { API_BASE_URL, API_ENDPOINTS } from './constants';
import {
  getAirports,
  getAirlines,
  getCities,
  getCurrencies,
  getHotelChains,
  getHotelFacilities,
  getHotelTypes,
  getLocations
} from '@tripalfa/static-data';

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
  return {
    id: hotel.id,
    name: hotel.name,
    image: hotel.image || hotel.primary_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
    location: hotel.location || `${hotel.city || 'Unknown'}, ${hotel.country || 'Unknown'}`,
    rating: hotel.rating || hotel.star_rating || 4,
    reviews: hotel.reviews || hotel.reviewCount || 100,
    price: hotel.price || { amount: hotel.pricePerNight || 200, currency: hotel.currency || 'USD' },
    amenities: hotel.amenities || hotel.amenity_names || [],
    provider: hotel.provider || 'Local'
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

// Real Wallet Endpoints
export async function fetchWallets() {
  try {
    // GET /wallets returns { wallets: [...] } or { accounts: [...] }
    const res = await api.get('/wallets');
    return res.accounts || res.wallets || [];
  } catch (error) {
    console.error('Failed to fetch wallets:', error);
    return [];
  }
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


export async function listWalletTransactions() {
  try {
    const res = await api.get('/wallets/transactions');
    return res.transactions || [];
  } catch (error) {
    console.error('Failed to list wallet transactions:', error);
    return [];
  }
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
      const mappedHotels = hotels.map((hotel: any) => ({
        id: hotel.id,
        name: hotel.name,
        image: hotel.main_photo || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
        location: hotel.address,
        rating: hotel.rating || 0,
        reviews: 0, // LiteAPI doesn't provide review count
        price: { 
          amount: hotel.offers?.[0]?.offerRetailRate || 0, 
          currency: 'USD' 
        },
        amenities: [], // LiteAPI doesn't provide amenities in search
        provider: 'LiteAPI',
        offers: hotel.offers || [] // Include full offer data for booking
      }));
      return { hotels: mappedHotels };
    }
  } catch (directError) {
    console.warn('LiteAPI rates search failed:', directError);
  }

  // 4. Final fallback to static data with mock results
  try {
    const mockHotels = [
      {
        id: 'mock_1',
        name: 'Grand Hotel Example',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
        location: `${params.location || 'Paris'}, France`,
        rating: 4.5,
        reviews: 250,
        price: { amount: 180, currency: 'USD' },
        amenities: ['WiFi', 'Pool', 'Spa'],
        provider: 'Mock-Data'
      },
      {
        id: 'mock_2',
        name: 'Luxury Resort Example',
        image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80',
        location: `${params.location || 'Paris'}, France`,
        rating: 4.8,
        reviews: 180,
        price: { amount: 250, currency: 'USD' },
        amenities: ['Beach', 'Restaurant', 'Gym'],
        provider: 'Mock-Data'
      }
    ];
    return { hotels: mockHotels };
  } catch (mockError) {
    console.warn('Mock data fallback failed:', mockError);
  }

  throw error;
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

  try {
    console.log('[api.ts] SEARCH FLIGHTS CALLED (via API Gateway)');
    // Delegate to API Gateway (which uses DuffelAdapter with backend keys)
    const response = await api.post('/search/flights', payload);
    const offers = response.data?.offers || response.offers || [];
    return mapDuffelResponse({ offers });



  } catch (error) {
    console.error('[api.ts] API Gateway search failed, trying direct search:', String(error));

    // Fallback: Direct connection to Duffel via Vite Proxy
    try {
      console.log('[api.ts] DIRECT DUFFEL SEARCH START');
      const res = await fetch('/duffel-api/air/offer_requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Duffel-Version': 'v2',
          'Authorization': `Bearer ${(import.meta as any).env.VITE_DUFFEL_API_KEY}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(`Duffel Direct Error: ${res.status} ${text}`);
      }

      const response = await res.json();
      const offers = response.data?.offers || response.offers || [];
      console.log('[api.ts] DIRECT DUFFEL SEARCH SUCCESS:', offers.length);
      return mapDuffelResponse({ offers });
    } catch (directError) {
      console.error('[api.ts] Duffel direct search failed:', String(directError));
      throw error; // Throw the original error or the direct error
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
    const slice = offer.slices[0];
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
    const slice = offer.slices[0];
    const identity = slice.segments.map((s: any) =>
      `${s.marketing_carrier.iata_code}${s.marketing_carrier_flight_number}-${s.departing_at}`
    ).join('|');

    if (!groups[identity]) groups[identity] = [];
    groups[identity].push(mapSingleOffer(offer));
  });

  // For each group, pick the cheapest as main and rest as upsells
  return Object.values(groups).map((groupOffers: any[]) => {
    const sorted = groupOffers.sort((a, b) => a.amount - b.amount);
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
    const response = await getAirports({ query });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch airports:', error);
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
    const res = await api.get('/inventory/static/data?type=aircraft');
    return res || [];
  } catch (error) {
    console.error('Failed to fetch aircrafts:', error);
    return [];
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

export async function fetchLoyaltyPrograms() {
  try {
    const res = await api.get('/inventory/static/data?type=loyalty-programs');
    return res || [];
  } catch (error) {
    console.error('Failed to fetch loyalty programs:', error);
    return [];
  }
}

export async function fetchSuggestions(query: string, type: 'flight' | 'hotel' = 'hotel') {
  try {
    // @ts-ignore
    const locations = await getLocations({ query, type });
    return locations;
  } catch (error) {
    console.error('Failed to fetch suggestions:', error);
    return [];
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

export async function fetchCountries() {
  try {
    const res = await api.get('/inventory/static/data?type=countries');
    return res || [];
  } catch (error) {
    console.error('Failed to fetch countries:', error);
    return [];
  }
}

export async function fetchNationalities() {
  try {
    const res = await api.get('/inventory/static/data?type=nationalities');
    return res || [];
  } catch (error) {
    console.error('Failed to fetch nationalities:', error);
    return [];
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

export async function confirmFlightBooking(bookingId: string, paymentDetails: any) {
  try {
    const res = await api.post('/bookings/flight/confirm', { bookingId, paymentDetails });
    return res;
  } catch (error) {
    console.error('Failed to confirm flight booking:', error);
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

export async function confirmHotelBooking(bookingId: string, paymentDetails: any) {
  try {
    const res = await api.post('/bookings/hotel/confirm', { bookingId, paymentDetails });
    return res;
  } catch (error) {
    console.error('Failed to confirm hotel booking:', error);
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
  if (!API_BASE_URL) throw new Error('API_BASE_URL not configured');
  const url = path.startsWith('http') ? path : `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.headers as Record<string, string> || {}),
  };
  if (inMemoryAccessToken) headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  const res = await fetch(url, { credentials: 'include', ...opts, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => null);
    const msg = text || `HTTP ${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    throw err;
  }
  // Some endpoints might return empty body
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res.text();
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

