/**
 * Data Fetch Strategy for Booking Services
 *
 * Business Logic Implementation:
 *
 * LOCAL ENVIRONMENT:
 * - First, try to fetch static data for booking services
 * - If static data is not available, fall back to mock data
 *
 * PRODUCTION ENVIRONMENT:
 * - First, try to fetch from static data endpoints
 * - If no data is returned from static endpoints, fall back to API data
 */

import { API_BASE_URL } from './constants';

// Static Data API URL - bypass gateway for static data per architecture plan
const STATIC_API_URL = import.meta.env.VITE_STATIC_API_URL || 'http://localhost:3022';

// Default static data fallbacks (used when HOTEL_STATIC_DATA is not available)
const DEFAULT_AMENITIES = [
  { code: 'WIFI', name: 'Wi-Fi', is_popular: true },
  { code: 'POOL', name: 'Swimming Pool', is_popular: true },
  { code: 'GYM', name: 'Gym', is_popular: true },
];

const DEFAULT_BOARD_TYPES = [
  { code: 'RO', name: 'Room Only' },
  { code: 'BB', name: 'Bed & Breakfast', is_popular: true },
  { code: 'HB', name: 'Half Board', is_popular: true },
];

const DEFAULT_HOTEL_TYPES = [
  { code: 'HOTEL', name: 'Hotel', is_popular: true },
  { code: 'RESORT', name: 'Resort', is_popular: true },
];

const DEFAULT_ROOM_TYPES = [
  { code: 'STD', name: 'Standard Room', is_popular: true },
  { code: 'DLX', name: 'Deluxe Room', is_popular: true },
];

const DEFAULT_STAR_RATINGS = [
  { id: '3', name: '3 Star' },
  { id: '4', name: '4 Star', is_popular: true },
  { id: '5', name: '5 Star' },
];

const DEFAULT_POPULAR_DESTINATIONS = [
  { id: 'DXB', name: 'Dubai', country: 'AE', city: 'Dubai', isPopular: true },
  { id: 'NYC', name: 'New York', country: 'US', city: 'New York' },
  { id: 'LON', name: 'London', country: 'GB', city: 'London' },
];

// Environment detection - PROD when VITE_GATEWAY_URL is set and is not localhost
const isProduction = (): boolean => {
  const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || '';
  // If not set or empty, we're in development (with MSW or relative URLs)
  if (!gatewayUrl) return false;
  // If set to localhost, we're in local development
  if (gatewayUrl.includes('localhost') || gatewayUrl.includes('127.0.0.1')) return false;
  // Otherwise, it's production
  return true;
};

// Check if MSW/mocking is active (local dev with mock data)
const isMockingEnabled = (): boolean => {
  return (
    import.meta.env.MODE === 'development' ||
    import.meta.env.VITE_ENABLE_MSW === 'true' ||
    typeof window !== 'undefined' && (window as any).__MSW_ENABLED__
  );
};

/**
 * Core fetch strategy result types
 */
export interface FetchResult<T> {
  data: T | null;
  source: 'static' | 'mock' | 'api' | 'cache';
  success: boolean;
  error?: string;
}

/**
 * Fetch options for the strategy
 */
export interface FetchOptions {
  endpoint: string;
  staticPath?: string;
  mockData?: any[];
  useMockFallback?: boolean;
  ttl?: number; // cache TTL in milliseconds
}

/**
 * Static data fetch wrapper with environment-aware fallback
 */
async function staticFetch<T = any>(path: string): Promise<{ data?: T; error?: string }> {
  try {
    const res = await fetch(`${STATIC_API_URL}${path}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const json = await res.json();

    // Handle case where service returns 200 OK with { error: "Not found" }
    if (json && typeof json === 'object' && 'error' in json && !('data' in json)) {
      throw new Error(json.error);
    }

    return json;
  } catch (error) {
    console.warn(`[staticFetch] Failed for ${path}:`, error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Core data fetcher implementing the business logic
 *
 * LOCAL ENVIRONMENT: static -> mock
 * PRODUCTION ENVIRONMENT: static -> api
 */
export async function fetchWithStrategy<T>(
  options: FetchOptions
): Promise<FetchResult<T>> {
  const { endpoint, staticPath, mockData, useMockFallback = true } = options;
  const production = isProduction();
  const mocking = isMockingEnabled();

  // Step 1: Try static data endpoint
  if (staticPath) {
    try {
      const result = await staticFetch<T>(staticPath);

      if (result.data) {
        return {
          data: result.data,
          source: 'static',
          success: true,
        };
      }
    } catch (error) {
      console.debug(`[fetchWithStrategy] Static fetch failed for ${staticPath}`);
    }
  }

  // Step 2: Local environment - use mock data as fallback
  if (mocking && useMockFallback && mockData) {
    console.debug(`[fetchWithStrategy] Using mock data for ${endpoint}`);
    return {
      data: mockData as T,
      source: 'mock',
      success: true,
    };
  }

  // Step 3: Production environment - try API data as fallback
  if (production && !mocking) {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data || json) {
          return {
            data: json.data || json,
            source: 'api',
            success: true,
          };
        }
      }
    } catch (error) {
      console.warn(`[fetchWithStrategy] API fetch failed for ${endpoint}:`, error);
    }
  }

  // No data available
  return {
    data: null,
    source: 'cache',
    success: false,
    error: 'No data available from any source',
  };
}

// ============================================================================
// Specific Fetch Functions for Static Data Types
// ============================================================================

/**
 * Fetch airports/hotels/flights destinations
 */
export async function fetchDestinations(params?: { type?: string; limit?: number }): Promise<FetchResult<any[]>> {
  const qs = new URLSearchParams();
  if (params?.type) qs.set('type', params.type);
  if (params?.limit) qs.set('limit', params.limit.toString());

  return fetchWithStrategy<any[]>({
    endpoint: '/api/static/destinations',
    staticPath: `/destinations${qs.toString() ? '?' + qs : ''}`,
    mockData: [
      { id: 'DXB', name: 'Dubai', city: 'Dubai', country: 'AE', code: 'DXB', isPopular: true },
      { id: 'JFK', name: 'New York', city: 'New York', country: 'US', code: 'JFK' },
      { id: 'LON', name: 'London', city: 'London', country: 'GB', code: 'LON' },
    ],
  });
}

/**
 * Fetch airports
 */
export async function fetchAirports(query?: string): Promise<FetchResult<any[]>> {
  const qs = query ? `?q=${encodeURIComponent(query)}&limit=20` : '?limit=20';

  return fetchWithStrategy<any[]>({
    endpoint: '/api/static/airports',
    staticPath: `/airports${qs}`,
    mockData: [
      { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'US' },
      { code: 'LHR', name: 'London Heathrow', city: 'London', country: 'GB' },
      { code: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'AE' },
    ],
  });
}

/**
 * Fetch countries
 */
export async function fetchCountries(query?: string): Promise<FetchResult<any[]>> {
  const qs = query ? `?q=${encodeURIComponent(query)}` : '';

  return fetchWithStrategy<any[]>({
    endpoint: '/api/static/countries',
    staticPath: `/countries${qs}`,
    mockData: [
      { code: 'US', name: 'United States' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'AE', name: 'United Arab Emirates' },
    ],
  });
}

/**
 * Fetch airlines
 */
export async function fetchAirlines(query?: string): Promise<FetchResult<any[]>> {
  const qs = query ? `?q=${encodeURIComponent(query)}&limit=100` : '?limit=200';

  return fetchWithStrategy<any[]>({
    endpoint: '/api/static/airlines',
    staticPath: `/airlines${qs}`,
    mockData: [
      { code: 'EK', name: 'Emirates' },
      { code: 'AA', name: 'American Airlines' },
      { code: 'BA', name: 'British Airways' },
    ],
  });
}

/**
 * Fetch amenities
 */
export async function fetchAmenities(params?: { category?: string; popular?: boolean }): Promise<FetchResult<any[]>> {
  const qs = new URLSearchParams();
  if (params?.category) qs.set('category', params.category);
  if (params?.popular) qs.set('popular', 'true');

  return fetchWithStrategy<any[]>({
    endpoint: '/api/static/amenities',
    staticPath: `/hotel-amenities${qs.toString() ? '?' + qs : ''}`,
    mockData: DEFAULT_AMENITIES.map((a) => ({
      code: a.code,
      name: a.name,
      is_popular: a.is_popular || false,
    })),
  });
}

/**
 * Fetch currencies
 */
export async function fetchCurrencies(): Promise<FetchResult<any[]>> {
  return fetchWithStrategy<any[]>({
    endpoint: '/api/static/currencies',
    staticPath: '/currencies',
    mockData: [
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    ],
  });
}

/**
 * Fetch popular destinations
 */
export async function fetchPopularDestinations(limit = 10): Promise<FetchResult<any[]>> {
  return fetchWithStrategy<any[]>({
    endpoint: `/api/static/destinations?popular=true&limit=${limit}`,
    staticPath: `/popular-destinations?limit=${limit}`,
    mockData: DEFAULT_POPULAR_DESTINATIONS.slice(0, limit),
  });
}

/**
 * Fetch board types
 */
export async function fetchBoardTypes(): Promise<FetchResult<any[]>> {
  return fetchWithStrategy<any[]>({
    endpoint: '/api/static/board-types',
    staticPath: '/board-types',
    mockData: DEFAULT_BOARD_TYPES.map((b) => ({
      code: b.code,
      name: b.name,
      is_popular: b.is_popular || false,
    })),
  });
}

/**
 * Fetch hotel types
 */
export async function fetchHotelTypes(): Promise<FetchResult<any[]>> {
  return fetchWithStrategy<any[]>({
    endpoint: '/api/static/hotel-types',
    staticPath: '/hotel-types',
    mockData: DEFAULT_HOTEL_TYPES.map((t) => ({
      code: t.code,
      name: t.name,
    })),
  });
}

/**
 * Fetch room types
 */
export async function fetchRoomTypes(): Promise<FetchResult<any[]>> {
  return fetchWithStrategy<any[]>({
    endpoint: '/api/static/room-types',
    staticPath: '/room-types',
    mockData: DEFAULT_ROOM_TYPES.map((r) => ({
      code: r.code,
      name: r.name,
      is_popular: r.is_popular || false,
    })),
  });
}

/**
 * Fetch star ratings
 */
export async function fetchStarRatings(): Promise<FetchResult<any[]>> {
  return fetchWithStrategy<any[]>({
    endpoint: '/api/static/star-ratings',
    staticPath: '/star-ratings',
    mockData: DEFAULT_STAR_RATINGS.map((s) => ({
      id: s.id,
      name: s.name,
    })),
  });
}

/**
 * Fetch loyalty programs
 */
export async function fetchLoyaltyPrograms(): Promise<FetchResult<any[]>> {
  return fetchWithStrategy<any[]>({
    endpoint: '/api/static/loyalty-programs',
    staticPath: '/loyalty-programs',
    mockData: [
      { id: 'lp1', name: 'TripAlfa Rewards' },
      { id: 'lp2', name: 'SkyTeam' },
    ],
  });
}

// ============================================================================
// Utility functions
// ============================================================================

/**
 * Get current environment info
 */
export function getEnvironmentInfo() {
  return {
    isProduction: isProduction(),
    isMocking: isMockingEnabled(),
    gatewayUrl: import.meta.env.VITE_GATEWAY_URL || 'default',
  };
}