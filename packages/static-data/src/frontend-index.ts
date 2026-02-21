/**
 * Frontend Static Data Index
 * 
 * This file provides a unified, directly indexable interface for all static data
 * used by the frontend applications. All data is organized by domain (flights/hotels)
 * and optimized for direct import and usage.
 * 
 * Usage:
 *   import { 
 *     FLIGHT_STATIC_DATA, 
 *     HOTEL_STATIC_DATA,
 *     STATIC_DATA_INDEX 
 *   } from '@tripalfa/static-data/frontend-index';
 */

// ============================================
// FLIGHT STATIC DATA
// ============================================

/**
 * Airport data type
 */
export interface AirportData {
  iata_code: string;
  name: string;
  city: string;
  country: string;
  country_code?: string;
}

/**
 * Airline data type
 */
export interface AirlineData {
  iata_code: string;
  name: string;
  logo_url?: string;
  country?: string;
}

/**
 * Flight-related static data for direct frontend indexing
 * CABINS: Static IATA enumeration (no API call needed)
 * AIRPORTS & AIRLINES: Removed — fetch realtime from DB/API instead
 */
export const FLIGHT_STATIC_DATA = {
  /**
   * Flight classes/cabins - Static IATA enumeration (no API call needed)
   */
  CABINS: {
    byCode: {
      ECONOMY: { value: 'ECONOMY', label: 'Economy', display_order: 1 },
      PREMIUM_ECONOMY: { value: 'PREMIUM_ECONOMY', label: 'Premium Economy', display_order: 2 },
      BUSINESS: { value: 'BUSINESS', label: 'Business', display_order: 3 },
      FIRST: { value: 'FIRST', label: 'First Class', display_order: 4 }
    },
    all: [
      { value: 'ECONOMY', label: 'Economy', display_order: 1 },
      { value: 'PREMIUM_ECONOMY', label: 'Premium Economy', display_order: 2 },
      { value: 'BUSINESS', label: 'Business', display_order: 3 },
      { value: 'FIRST', label: 'First Class', display_order: 4 }
    ]
  }
} as const;

// Import additional hotel domain data
import {
  HOTEL_CHAINS,
  HOTEL_CHAINS_BY_CODE,
  HOTEL_AMENITIES,
  HOTEL_AMENITIES_BY_CODE,
  HOTEL_AMENITIES_BY_CATEGORY,
  HOTEL_LEVEL_AMENITIES,
  ROOM_LEVEL_AMENITIES,
  POPULAR_AMENITIES,
  HOTEL_TYPES,
  HOTEL_TYPES_BY_CODE,
  HOTEL_TYPES_BY_NAME,
  STAR_RATINGS,
  STAR_RATINGS_BY_VALUE,
  POPULAR_HOTEL_DESTINATIONS,
  ROOM_TYPES,
  ROOM_TYPES_BY_CODE,
  BOARD_TYPES,
  BOARD_TYPES_BY_CODE,
  PAYMENT_TYPES,
  PAYMENT_TYPES_BY_CODE,
  VIEW_TYPES,
  VIEW_TYPES_BY_CODE,
  AMENITY_ICONS,
  type StarRating,
  type HotelDestination,
  type RoomType,
  type BoardType,
  type PaymentType,
  type ViewType
} from './domains/hotels';

// ============================================
// HOTEL STATIC DATA
// ============================================

/**
 * Hotel-related static data for direct frontend indexing
 */
export const HOTEL_STATIC_DATA = {
  /**
   * Hotel chains indexed by code
   */
  CHAINS: {
    byCode: HOTEL_CHAINS_BY_CODE,
    all: HOTEL_CHAINS
  },

  /**
   * Hotel types indexed by code and name
   */
  TYPES: {
    byCode: HOTEL_TYPES_BY_CODE,
    byName: HOTEL_TYPES_BY_NAME,
    all: HOTEL_TYPES
  },

  /**
   * Star ratings
   */
  STAR_RATINGS: {
    byValue: STAR_RATINGS_BY_VALUE,
    all: STAR_RATINGS
  },

  /**
   * Popular hotel destinations
   */
  POPULAR_DESTINATIONS: POPULAR_HOTEL_DESTINATIONS,

  /**
   * Hotel amenities (unified)
   */
  AMENITIES: {
    byCode: HOTEL_AMENITIES_BY_CODE,
    byCategory: HOTEL_AMENITIES_BY_CATEGORY,
    all: HOTEL_AMENITIES,
    hotelLevel: HOTEL_LEVEL_AMENITIES,
    roomLevel: ROOM_LEVEL_AMENITIES,
    popular: POPULAR_AMENITIES
  },

  /**
   * Room types
   */
  ROOM_TYPES: {
    byCode: ROOM_TYPES_BY_CODE,
    all: ROOM_TYPES
  },

  /**
   * Board types (meal plans)
   */
  BOARD_TYPES: {
    byCode: BOARD_TYPES_BY_CODE,
    all: BOARD_TYPES
  },

  /**
   * Payment types
   */
  PAYMENT_TYPES: {
    byCode: PAYMENT_TYPES_BY_CODE,
    all: PAYMENT_TYPES
  },

  /**
   * View types (for room views)
   */
  VIEW_TYPES: {
    byCode: VIEW_TYPES_BY_CODE,
    all: VIEW_TYPES
  }
} as const;

// ============================================
// SUPPLIER DATA (B2B Admin)
// ============================================

/**
 * Supplier and vendor static data for B2B admin
 */
export const SUPPLIER_STATIC_DATA = {
  SUPPLIERS: {
    byCode: {
      AMD: {
        id: '1',
        code: 'AMD',
        name: 'Amadeus GDS',
        type: 'GDS' as const,
        category: 'MULTI_SERVICE' as const,
        status: 'ACTIVE' as const,
        isPreferred: true,
        priority: 1,
        services: ['Flights', 'Hotels', 'Cars'],
        health: 'HEALTHY' as const
      },
      DUF: {
        id: '2',
        code: 'DUF',
        name: 'Duffel API',
        type: 'DIRECT_API' as const,
        category: 'AIRLINE' as const,
        status: 'ACTIVE' as const,
        isPreferred: true,
        priority: 2,
        services: ['Flights'],
        health: 'HEALTHY' as const
      },
      LAPI: {
        id: '3',
        code: 'LAPI',
        name: 'LiteAPI Hotels',
        type: 'DIRECT_API' as const,
        category: 'HOTEL' as const,
        status: 'ACTIVE' as const,
        isPreferred: false,
        priority: 3,
        services: ['Hotels'],
        health: 'DEGRADED' as const
      },
      'LX-DXB': {
        id: '4',
        code: 'LX-DXB',
        name: 'Local Express Dubai',
        type: 'LOCAL' as const,
        category: 'TRANSFER' as const,
        status: 'INACTIVE' as const,
        isPreferred: false,
        priority: 10,
        services: ['Transfers'],
        health: 'OFFLINE' as const
      }
    },
    all: [
      {
        id: '1',
        code: 'AMD',
        name: 'Amadeus GDS',
        type: 'GDS',
        category: 'MULTI_SERVICE',
        status: 'ACTIVE',
        isPreferred: true,
        priority: 1,
        services: ['Flights', 'Hotels', 'Cars'],
        health: 'HEALTHY'
      },
      {
        id: '2',
        code: 'DUF',
        name: 'Duffel API',
        type: 'DIRECT_API',
        category: 'AIRLINE',
        status: 'ACTIVE',
        isPreferred: true,
        priority: 2,
        services: ['Flights'],
        health: 'HEALTHY'
      },
      {
        id: '3',
        code: 'LAPI',
        name: 'LiteAPI Hotels',
        type: 'DIRECT_API',
        category: 'HOTEL',
        status: 'ACTIVE',
        isPreferred: false,
        priority: 3,
        services: ['Hotels'],
        health: 'DEGRADED'
      },
      {
        id: '4',
        code: 'LX-DXB',
        name: 'Local Express Dubai',
        type: 'LOCAL',
        category: 'TRANSFER',
        status: 'INACTIVE',
        isPreferred: false,
        priority: 10,
        services: ['Transfers'],
        health: 'OFFLINE'
      }
    ]
  },

  VENDORS: {
    byId: {
      '1': {
        id: '1',
        name: 'Amadeus Enterprise',
        type: 'GDS',
        status: 'ACTIVE',
        healthStatus: 'HEALTHY',
        lastHealthCheck: '2024-03-28T11:15:00Z',
        endpoint: 'https://api.amadeus.com/v2',
        auth: 'OAUTH2'
      },
      '2': {
        id: '2',
        name: 'Duffel Aviation',
        type: 'AGGREGATOR',
        status: 'ACTIVE',
        healthStatus: 'HEALTHY',
        lastHealthCheck: '2024-03-28T11:22:00Z',
        endpoint: 'https://api.duffel.com',
        auth: 'BEARER'
      },
      '3': {
        id: '3',
        name: 'LiteAPI Global',
        type: 'DIRECT',
        status: 'ACTIVE',
        healthStatus: 'DEGRADED',
        lastHealthCheck: '2024-03-28T11:20:00Z',
        endpoint: 'https://lite.api.travel/v1',
        auth: 'API_KEY'
      }
    },
    all: [
      {
        id: '1',
        name: 'Amadeus Enterprise',
        type: 'GDS',
        status: 'ACTIVE',
        healthStatus: 'HEALTHY',
        lastHealthCheck: '2024-03-28T11:15:00Z',
        endpoint: 'https://api.amadeus.com/v2',
        auth: 'OAUTH2'
      },
      {
        id: '2',
        name: 'Duffel Aviation',
        type: 'AGGREGATOR',
        status: 'ACTIVE',
        healthStatus: 'HEALTHY',
        lastHealthCheck: '2024-03-28T11:22:00Z',
        endpoint: 'https://api.duffel.com',
        auth: 'BEARER'
      },
      {
        id: '3',
        name: 'LiteAPI Global',
        type: 'DIRECT',
        status: 'ACTIVE',
        healthStatus: 'DEGRADED',
        lastHealthCheck: '2024-03-28T11:20:00Z',
        endpoint: 'https://lite.api.travel/v1',
        auth: 'API_KEY'
      }
    ]
  }
} as const;

// ============================================
// MASTER INDEX
// ============================================

/**
 * Master index of all static data for direct frontend access
 * Organized by domain for easy navigation and tree-shaking
 */
export const STATIC_DATA_INDEX = {
  flights: FLIGHT_STATIC_DATA,
  hotels: HOTEL_STATIC_DATA,
  suppliers: SUPPLIER_STATIC_DATA
} as const;

/**
 * Type exports for all static data structures
 */
export type FlightStaticData = typeof FLIGHT_STATIC_DATA;
export type HotelStaticData = typeof HOTEL_STATIC_DATA;
export type SupplierStaticData = typeof SUPPLIER_STATIC_DATA;
export type StaticDataIndex = typeof STATIC_DATA_INDEX;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get a hotel chain by code (O(1) lookup)
 */
export function getHotelChainByCode(code: string) {
  return HOTEL_STATIC_DATA.CHAINS.byCode[code as keyof typeof HOTEL_STATIC_DATA.CHAINS.byCode] || null;
}

/**
 * Get a supplier by code (O(1) lookup)
 */
export function getSupplierByCode(code: string) {
  return SUPPLIER_STATIC_DATA.SUPPLIERS.byCode[code as keyof typeof SUPPLIER_STATIC_DATA.SUPPLIERS.byCode] || null;
}

/**
 * Get a hotel type by code (O(1) lookup)
 */
export function getHotelTypeByCode(code: string) {
  return HOTEL_STATIC_DATA.TYPES.byCode[code as keyof typeof HOTEL_STATIC_DATA.TYPES.byCode] || null;
}

/**
 * Get a hotel amenity by code (O(1) lookup)
 */
export function getHotelAmenityByCode(code: string) {
  return HOTEL_STATIC_DATA.AMENITIES.byCode[code as keyof typeof HOTEL_STATIC_DATA.AMENITIES.byCode] || null;
}

/**
 * Get a room type by code (O(1) lookup)
 */
export function getRoomTypeByCode(code: string) {
  return HOTEL_STATIC_DATA.ROOM_TYPES.byCode[code as keyof typeof HOTEL_STATIC_DATA.ROOM_TYPES.byCode] || null;
}

/**
 * Get a board type by code (O(1) lookup)
 */
export function getBoardTypeByCode(code: string) {
  return HOTEL_STATIC_DATA.BOARD_TYPES.byCode[code as keyof typeof HOTEL_STATIC_DATA.BOARD_TYPES.byCode] || null;
}

/**
 * Get a star rating by value (O(1) lookup)
 */
export function getStarRatingByValue(value: number) {
  return HOTEL_STATIC_DATA.STAR_RATINGS.byValue[value as keyof typeof HOTEL_STATIC_DATA.STAR_RATINGS.byValue] || null;
}

/**
 * Get hotel amenities by category
 */
export function getAmenitiesByCategory(category: string) {
  return HOTEL_STATIC_DATA.AMENITIES.byCategory[category as keyof typeof HOTEL_STATIC_DATA.AMENITIES.byCategory] || [];
}

/**
 * Search hotels by destination query
 */
export function searchHotelDestinations(query: string) {
  const normalizedQuery = query.toLowerCase().trim();
  return HOTEL_STATIC_DATA.POPULAR_DESTINATIONS.filter(dest =>
    dest.city.toLowerCase().includes(normalizedQuery) ||
    dest.country.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Get all flight-related static data
 */
export function getAllFlightData(): FlightStaticData {
  return FLIGHT_STATIC_DATA;
}

/**
 * Get all hotel-related static data
 */
export function getAllHotelData(): HotelStaticData {
  return HOTEL_STATIC_DATA;
}

// Re-export from main index is removed to avoid circular dependency
// export * from './index';
