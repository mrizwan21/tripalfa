/**
 * Fallback data for static data when external sources are unavailable
 */

import { Airport, Airline, City, Currency, HotelChain, HotelFacility, HotelType, Location } from './types';

// Fallback airports data
export const FALLBACK_AIRPORTS: Airport[] = [
  {
    iata_code: 'LHR',
    name: 'London Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    country_code: 'GB',
    latitude: 51.4700,
    longitude: -0.4543,
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    iata_code: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States',
    country_code: 'US',
    latitude: 40.6413,
    longitude: -73.7781,
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    iata_code: 'DXB',
    name: 'Dubai International Airport',
    city: 'Dubai',
    country: 'United Arab Emirates',
    country_code: 'AE',
    latitude: 25.2532,
    longitude: 55.3657,
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    iata_code: 'SIN',
    name: 'Singapore Changi Airport',
    city: 'Singapore',
    country: 'Singapore',
    country_code: 'SG',
    latitude: 1.3644,
    longitude: 103.9915,
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    iata_code: 'HKG',
    name: 'Hong Kong International Airport',
    city: 'Hong Kong',
    country: 'Hong Kong',
    country_code: 'HK',
    latitude: 22.3080,
    longitude: 113.9185,
    is_active: true,
    updated_at: new Date().toISOString()
  }
];

// Fallback airlines data
export const FALLBACK_AIRLINES: Airline[] = [
  {
    iata_code: 'BA',
    name: 'British Airways',
    logo_url: 'https://logo.clearbit.com/britishairways.com',
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    iata_code: 'AA',
    name: 'American Airlines',
    logo_url: 'https://logo.clearbit.com/aa.com',
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    iata_code: 'EK',
    name: 'Emirates',
    logo_url: 'https://logo.clearbit.com/emirates.com',
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    iata_code: 'SQ',
    name: 'Singapore Airlines',
    logo_url: 'https://logo.clearbit.com/singaporeair.com',
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    iata_code: 'QF',
    name: 'Qantas',
    logo_url: 'https://logo.clearbit.com/qantas.com',
    is_active: true,
    updated_at: new Date().toISOString()
  }
];

// Fallback cities data
export const FALLBACK_CITIES: City[] = [
  {
    name: 'London',
    country: 'United Kingdom',
    country_code: 'GB',
    latitude: 51.5074,
    longitude: -0.1278,
    timezone: 'Europe/London',
    is_popular: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'New York',
    country: 'United States',
    country_code: 'US',
    latitude: 40.7128,
    longitude: -74.0060,
    timezone: 'America/New_York',
    is_popular: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Dubai',
    country: 'United Arab Emirates',
    country_code: 'AE',
    latitude: 25.2048,
    longitude: 55.2708,
    timezone: 'Asia/Dubai',
    is_popular: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Singapore',
    country: 'Singapore',
    country_code: 'SG',
    latitude: 1.3521,
    longitude: 103.8198,
    timezone: 'Asia/Singapore',
    is_popular: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    name: 'Tokyo',
    country: 'Japan',
    country_code: 'JP',
    latitude: 35.6762,
    longitude: 139.6503,
    timezone: 'Asia/Tokyo',
    is_popular: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Fallback currencies data
export const FALLBACK_CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', updated_at: new Date().toISOString() },
  { code: 'EUR', name: 'Euro', symbol: '€', updated_at: new Date().toISOString() },
  { code: 'GBP', name: 'British Pound', symbol: '£', updated_at: new Date().toISOString() },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', updated_at: new Date().toISOString() },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', updated_at: new Date().toISOString() },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', updated_at: new Date().toISOString() }
];

// Fallback hotel chains data
export const FALLBACK_HOTEL_CHAINS: HotelChain[] = [
  { name: 'Marriott International', code: 'MAR', updated_at: new Date().toISOString() },
  { name: 'Hilton Worldwide', code: 'HIL', updated_at: new Date().toISOString() },
  { name: 'InterContinental Hotels Group', code: 'IHG', updated_at: new Date().toISOString() },
  { name: 'Hyatt Hotels Corporation', code: 'H', updated_at: new Date().toISOString() },
  { name: 'Accor', code: 'ACC', updated_at: new Date().toISOString() }
];

// Fallback hotel facilities data
export const FALLBACK_HOTEL_FACILITIES: HotelFacility[] = [
  { name: 'Wi-Fi', category: 'Technology', updated_at: new Date().toISOString() },
  { name: 'Swimming Pool', category: 'Recreation', updated_at: new Date().toISOString() },
  { name: 'Fitness Center', category: 'Wellness', updated_at: new Date().toISOString() },
  { name: 'Restaurant', category: 'Dining', updated_at: new Date().toISOString() },
  { name: 'Bar', category: 'Dining', updated_at: new Date().toISOString() },
  { name: 'Spa', category: 'Wellness', updated_at: new Date().toISOString() },
  { name: 'Parking', category: 'Transportation', updated_at: new Date().toISOString() },
  { name: 'Room Service', category: 'Services', updated_at: new Date().toISOString() }
];

// Fallback hotel types data
export const FALLBACK_HOTEL_TYPES: HotelType[] = [
  { name: 'Hotel', updated_at: new Date().toISOString() },
  { name: 'Resort', updated_at: new Date().toISOString() },
  { name: 'Apartment', updated_at: new Date().toISOString() },
  { name: 'Villa', updated_at: new Date().toISOString() },
  { name: 'Hostel', updated_at: new Date().toISOString() },
  { name: 'Boutique Hotel', updated_at: new Date().toISOString() }
];

// Combined location data for autocomplete
export const FALLBACK_LOCATIONS: Location[] = [
  ...FALLBACK_AIRPORTS.map(a => ({
    id: a.iata_code,
    name: a.name,
    country: a.country,
    country_code: a.country_code,
    type: 'airport' as const,
    iata_code: a.iata_code,
    latitude: a.latitude,
    longitude: a.longitude
  })),
  ...FALLBACK_CITIES.map(c => ({
    id: `${c.name}-${c.country_code}`,
    name: c.name,
    country: c.country,
    country_code: c.country_code,
    type: 'city' as const,
    latitude: c.latitude,
    longitude: c.longitude
  }))
];

/**
 * Get fallback data for a specific type
 */
export function getFallbackData<T>(type: string): T[] {
  switch (type) {
    case 'airports':
      return FALLBACK_AIRPORTS as T[];
    case 'airlines':
      return FALLBACK_AIRLINES as T[];
    case 'cities':
      return FALLBACK_CITIES as T[];
    case 'currencies':
      return FALLBACK_CURRENCIES as T[];
    case 'hotelChains':
      return FALLBACK_HOTEL_CHAINS as T[];
    case 'hotelFacilities':
      return FALLBACK_HOTEL_FACILITIES as T[];
    case 'hotelTypes':
      return FALLBACK_HOTEL_TYPES as T[];
    case 'locations':
      return FALLBACK_LOCATIONS as T[];
    default:
      return [];
  }
}

/**
 * Check if fallback data should be used
 */
export function shouldUseFallback(error: Error): boolean {
  // Use fallback for network errors, timeouts, or service unavailable
  const networkErrors = [
    'ENETUNREACH',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND'
  ];

  const httpErrors = [404, 500, 502, 503, 504];

  return networkErrors.some(code => error.message.includes(code)) ||
    httpErrors.includes((error as any).status) ||
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.name === 'TypeError'; // TypeError is usually "Failed to fetch" in browser
}