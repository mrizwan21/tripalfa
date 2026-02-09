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
 * Flight-related static data for direct frontend indexing
 */
export const FLIGHT_STATIC_DATA = {
  /**
   * Airport data indexed by IATA code for O(1) lookup
   */
  AIRPORTS: {
    byIataCode: {
      LHR: {
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
      JFK: {
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
      DXB: {
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
      SIN: {
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
      HKG: {
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
    },
    all: [
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
    ]
  },

  /**
   * Airline data indexed by IATA code for O(1) lookup
   */
  AIRLINES: {
    byIataCode: {
      BA: {
        iata_code: 'BA',
        name: 'British Airways',
        logo_url: 'https://logo.clearbit.com/britishairways.com',
        is_active: true,
        updated_at: new Date().toISOString()
      },
      AA: {
        iata_code: 'AA',
        name: 'American Airlines',
        logo_url: 'https://logo.clearbit.com/aa.com',
        is_active: true,
        updated_at: new Date().toISOString()
      },
      EK: {
        iata_code: 'EK',
        name: 'Emirates',
        logo_url: 'https://logo.clearbit.com/emirates.com',
        is_active: true,
        updated_at: new Date().toISOString()
      },
      SQ: {
        iata_code: 'SQ',
        name: 'Singapore Airlines',
        logo_url: 'https://logo.clearbit.com/singaporeair.com',
        is_active: true,
        updated_at: new Date().toISOString()
      },
      QF: {
        iata_code: 'QF',
        name: 'Qantas',
        logo_url: 'https://logo.clearbit.com/qantas.com',
        is_active: true,
        updated_at: new Date().toISOString()
      }
    },
    all: [
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
    ]
  },

  /**
   * Flight classes/cabins
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
  },

  /**
   * Popular flight routes
   */
  POPULAR_ROUTES: [
    { origin: 'JFK', destination: 'LHR', origin_city: 'New York', destination_city: 'London', popularity: 1 },
    { origin: 'LHR', destination: 'DXB', origin_city: 'London', destination_city: 'Dubai', popularity: 2 },
    { origin: 'DXB', destination: 'SIN', origin_city: 'Dubai', destination_city: 'Singapore', popularity: 3 },
    { origin: 'SIN', destination: 'HKG', origin_city: 'Singapore', destination_city: 'Hong Kong', popularity: 4 },
    { origin: 'HKG', destination: 'JFK', origin_city: 'Hong Kong', destination_city: 'New York', popularity: 5 }
  ]
} as const;

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
    byCode: {
      MAR: { name: 'Marriott International', code: 'MAR', updated_at: new Date().toISOString() },
      HIL: { name: 'Hilton Worldwide', code: 'HIL', updated_at: new Date().toISOString() },
      IHG: { name: 'InterContinental Hotels Group', code: 'IHG', updated_at: new Date().toISOString() },
      H: { name: 'Hyatt Hotels Corporation', code: 'H', updated_at: new Date().toISOString() },
      ACC: { name: 'Accor', code: 'ACC', updated_at: new Date().toISOString() }
    },
    all: [
      { name: 'Marriott International', code: 'MAR', updated_at: new Date().toISOString() },
      { name: 'Hilton Worldwide', code: 'HIL', updated_at: new Date().toISOString() },
      { name: 'InterContinental Hotels Group', code: 'IHG', updated_at: new Date().toISOString() },
      { name: 'Hyatt Hotels Corporation', code: 'H', updated_at: new Date().toISOString() },
      { name: 'Accor', code: 'ACC', updated_at: new Date().toISOString() }
    ]
  },

  /**
   * Hotel amenities indexed by code (canonical source for both hotel and room level)
   */
  AMENITIES: {
    byCode: {
      WIFI: { code: 'WIFI', name: 'Wi-Fi', category: 'Technology', applies_to: 'both' as const, is_popular: true, updated_at: new Date().toISOString() },
      SWIMMING_POOL: { code: 'SWIMMING_POOL', name: 'Swimming Pool', category: 'Recreation', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() },
      FITNESS_CENTER: { code: 'FITNESS_CENTER', name: 'Fitness Center', category: 'Wellness', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() },
      RESTAURANT: { code: 'RESTAURANT', name: 'Restaurant', category: 'Dining', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() },
      BAR: { code: 'BAR', name: 'Bar', category: 'Dining', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
      SPA: { code: 'SPA', name: 'Spa', category: 'Wellness', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() },
      PARKING: { code: 'PARKING', name: 'Parking', category: 'Transportation', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() },
      ROOM_SERVICE: { code: 'ROOM_SERVICE', name: 'Room Service', category: 'Services', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
      AIR_CONDITIONING: { code: 'AIR_CONDITIONING', name: 'Air Conditioning', category: 'Room', applies_to: 'room' as const, is_popular: true, updated_at: new Date().toISOString() },
      MINIBAR: { code: 'MINIBAR', name: 'Minibar', category: 'Room', applies_to: 'room' as const, updated_at: new Date().toISOString() }
    },
    byCategory: {
      'Technology': [
        { code: 'WIFI', name: 'Wi-Fi', category: 'Technology', applies_to: 'both' as const, is_popular: true, updated_at: new Date().toISOString() }
      ],
      'Recreation': [
        { code: 'SWIMMING_POOL', name: 'Swimming Pool', category: 'Recreation', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() }
      ],
      'Wellness': [
        { code: 'FITNESS_CENTER', name: 'Fitness Center', category: 'Wellness', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() },
        { code: 'SPA', name: 'Spa', category: 'Wellness', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() }
      ],
      'Dining': [
        { code: 'RESTAURANT', name: 'Restaurant', category: 'Dining', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() },
        { code: 'BAR', name: 'Bar', category: 'Dining', applies_to: 'hotel' as const, updated_at: new Date().toISOString() }
      ],
      'Transportation': [
        { code: 'PARKING', name: 'Parking', category: 'Transportation', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() }
      ],
      'Services': [
        { code: 'ROOM_SERVICE', name: 'Room Service', category: 'Services', applies_to: 'hotel' as const, updated_at: new Date().toISOString() }
      ],
      'Room': [
        { code: 'AIR_CONDITIONING', name: 'Air Conditioning', category: 'Room', applies_to: 'room' as const, is_popular: true, updated_at: new Date().toISOString() },
        { code: 'MINIBAR', name: 'Minibar', category: 'Room', applies_to: 'room' as const, updated_at: new Date().toISOString() }
      ]
    },
    all: [
      { code: 'WIFI', name: 'Wi-Fi', category: 'Technology', applies_to: 'both' as const, is_popular: true, updated_at: new Date().toISOString() },
      { code: 'SWIMMING_POOL', name: 'Swimming Pool', category: 'Recreation', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() },
      { code: 'FITNESS_CENTER', name: 'Fitness Center', category: 'Wellness', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() },
      { code: 'RESTAURANT', name: 'Restaurant', category: 'Dining', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() },
      { code: 'BAR', name: 'Bar', category: 'Dining', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
      { code: 'SPA', name: 'Spa', category: 'Wellness', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() },
      { code: 'PARKING', name: 'Parking', category: 'Transportation', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() },
      { code: 'ROOM_SERVICE', name: 'Room Service', category: 'Services', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
      { code: 'AIR_CONDITIONING', name: 'Air Conditioning', category: 'Room', applies_to: 'room' as const, is_popular: true, updated_at: new Date().toISOString() },
      { code: 'MINIBAR', name: 'Minibar', category: 'Room', applies_to: 'room' as const, updated_at: new Date().toISOString() }
    ],
    hotelLevel: [
      { code: 'SWIMMING_POOL', name: 'Swimming Pool', category: 'Recreation', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() },
      { code: 'FITNESS_CENTER', name: 'Fitness Center', category: 'Wellness', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() },
      { code: 'RESTAURANT', name: 'Restaurant', category: 'Dining', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() },
      { code: 'SPA', name: 'Spa', category: 'Wellness', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() },
      { code: 'PARKING', name: 'Parking', category: 'Transportation', applies_to: 'hotel' as const, is_popular: true, updated_at: new Date().toISOString() }
    ],
    roomLevel: [
      { code: 'WIFI', name: 'Wi-Fi', category: 'Technology', applies_to: 'both' as const, is_popular: true, updated_at: new Date().toISOString() },
      { code: 'AIR_CONDITIONING', name: 'Air Conditioning', category: 'Room', applies_to: 'room' as const, is_popular: true, updated_at: new Date().toISOString() },
      { code: 'MINIBAR', name: 'Minibar', category: 'Room', applies_to: 'room' as const, updated_at: new Date().toISOString() }
    ]
  },

  /**
   * @deprecated Use AMENITIES instead
   */
  FACILITIES: {
    byName: {
      'Wi-Fi': { code: 'WIFI', name: 'Wi-Fi', category: 'Technology', applies_to: 'both' as const, updated_at: new Date().toISOString() },
      'Swimming Pool': { code: 'SWIMMING_POOL', name: 'Swimming Pool', category: 'Recreation', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
      'Fitness Center': { code: 'FITNESS_CENTER', name: 'Fitness Center', category: 'Wellness', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
      'Restaurant': { code: 'RESTAURANT', name: 'Restaurant', category: 'Dining', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
      'Bar': { code: 'BAR', name: 'Bar', category: 'Dining', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
      'Spa': { code: 'SPA', name: 'Spa', category: 'Wellness', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
      'Parking': { code: 'PARKING', name: 'Parking', category: 'Transportation', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
      'Room Service': { code: 'ROOM_SERVICE', name: 'Room Service', category: 'Services', applies_to: 'hotel' as const, updated_at: new Date().toISOString() }
    },
    byCategory: {
      'Technology': [{ code: 'WIFI', name: 'Wi-Fi', category: 'Technology', applies_to: 'both' as const, updated_at: new Date().toISOString() }],
      'Recreation': [{ code: 'SWIMMING_POOL', name: 'Swimming Pool', category: 'Recreation', applies_to: 'hotel' as const, updated_at: new Date().toISOString() }],
      'Wellness': [
        { code: 'FITNESS_CENTER', name: 'Fitness Center', category: 'Wellness', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
        { code: 'SPA', name: 'Spa', category: 'Wellness', applies_to: 'hotel' as const, updated_at: new Date().toISOString() }
      ],
      'Dining': [
        { code: 'RESTAURANT', name: 'Restaurant', category: 'Dining', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
        { code: 'BAR', name: 'Bar', category: 'Dining', applies_to: 'hotel' as const, updated_at: new Date().toISOString() }
      ],
      'Transportation': [{ code: 'PARKING', name: 'Parking', category: 'Transportation', applies_to: 'hotel' as const, updated_at: new Date().toISOString() }],
      'Services': [{ code: 'ROOM_SERVICE', name: 'Room Service', category: 'Services', applies_to: 'hotel' as const, updated_at: new Date().toISOString() }]
    },
    all: [
      { code: 'WIFI', name: 'Wi-Fi', category: 'Technology', applies_to: 'both' as const, updated_at: new Date().toISOString() },
      { code: 'SWIMMING_POOL', name: 'Swimming Pool', category: 'Recreation', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
      { code: 'FITNESS_CENTER', name: 'Fitness Center', category: 'Wellness', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
      { code: 'RESTAURANT', name: 'Restaurant', category: 'Dining', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
      { code: 'BAR', name: 'Bar', category: 'Dining', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
      { code: 'SPA', name: 'Spa', category: 'Wellness', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
      { code: 'PARKING', name: 'Parking', category: 'Transportation', applies_to: 'hotel' as const, updated_at: new Date().toISOString() },
      { code: 'ROOM_SERVICE', name: 'Room Service', category: 'Services', applies_to: 'hotel' as const, updated_at: new Date().toISOString() }
    ]
  },

  /**
   * Hotel types indexed by code and name
   */
  TYPES: {
    byCode: {
      HOTEL: { code: 'HOTEL', name: 'Hotel', description: 'Standard hotel accommodation', updated_at: new Date().toISOString() },
      RESORT: { code: 'RESORT', name: 'Resort', description: 'Full-service resort with amenities', updated_at: new Date().toISOString() },
      APARTMENT: { code: 'APARTMENT', name: 'Apartment', description: 'Self-contained apartment units', updated_at: new Date().toISOString() },
      VILLA: { code: 'VILLA', name: 'Villa', description: 'Private standalone villa', updated_at: new Date().toISOString() },
      HOSTEL: { code: 'HOSTEL', name: 'Hostel', description: 'Budget accommodation with shared facilities', updated_at: new Date().toISOString() },
      BOUTIQUE: { code: 'BOUTIQUE', name: 'Boutique Hotel', description: 'Stylish, intimate hotel', updated_at: new Date().toISOString() }
    },
    byName: {
      'Hotel': { code: 'HOTEL', name: 'Hotel', description: 'Standard hotel accommodation', updated_at: new Date().toISOString() },
      'Resort': { code: 'RESORT', name: 'Resort', description: 'Full-service resort with amenities', updated_at: new Date().toISOString() },
      'Apartment': { code: 'APARTMENT', name: 'Apartment', description: 'Self-contained apartment units', updated_at: new Date().toISOString() },
      'Villa': { code: 'VILLA', name: 'Villa', description: 'Private standalone villa', updated_at: new Date().toISOString() },
      'Hostel': { code: 'HOSTEL', name: 'Hostel', description: 'Budget accommodation with shared facilities', updated_at: new Date().toISOString() },
      'Boutique Hotel': { code: 'BOUTIQUE', name: 'Boutique Hotel', description: 'Stylish, intimate hotel', updated_at: new Date().toISOString() }
    },
    all: [
      { code: 'HOTEL', name: 'Hotel', description: 'Standard hotel accommodation', updated_at: new Date().toISOString() },
      { code: 'RESORT', name: 'Resort', description: 'Full-service resort with amenities', updated_at: new Date().toISOString() },
      { code: 'APARTMENT', name: 'Apartment', description: 'Self-contained apartment units', updated_at: new Date().toISOString() },
      { code: 'VILLA', name: 'Villa', description: 'Private standalone villa', updated_at: new Date().toISOString() },
      { code: 'HOSTEL', name: 'Hostel', description: 'Budget accommodation with shared facilities', updated_at: new Date().toISOString() },
      { code: 'BOUTIQUE', name: 'Boutique Hotel', description: 'Stylish, intimate hotel', updated_at: new Date().toISOString() }
    ]
  },

  /**
   * Star ratings
   */
  STAR_RATINGS: {
    all: [
      { value: 1, label: '1 Star', icon: '★' },
      { value: 2, label: '2 Stars', icon: '★★' },
      { value: 3, label: '3 Stars', icon: '★★★' },
      { value: 4, label: '4 Stars', icon: '★★★★' },
      { value: 5, label: '5 Stars', icon: '★★★★★' }
    ]
  },

  /**
   * Popular hotel destinations
   */
  POPULAR_DESTINATIONS: [
    { city: 'Dubai', country: 'United Arab Emirates', country_code: 'AE', popularity: 1 },
    { city: 'London', country: 'United Kingdom', country_code: 'GB', popularity: 2 },
    { city: 'Paris', country: 'France', country_code: 'FR', popularity: 3 },
    { city: 'New York', country: 'United States', country_code: 'US', popularity: 4 },
    { city: 'Singapore', country: 'Singapore', country_code: 'SG', popularity: 5 }
  ]
} as const;

// ============================================
// SHARED STATIC DATA
// ============================================

/**
 * Shared static data used by both flights and hotels
 */
export const SHARED_STATIC_DATA = {
  /**
   * Currencies indexed by code
   */
  CURRENCIES: {
    byCode: {
      USD: { code: 'USD', name: 'US Dollar', symbol: '$', updated_at: new Date().toISOString() },
      EUR: { code: 'EUR', name: 'Euro', symbol: '€', updated_at: new Date().toISOString() },
      GBP: { code: 'GBP', name: 'British Pound', symbol: '£', updated_at: new Date().toISOString() },
      AED: { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', updated_at: new Date().toISOString() },
      SGD: { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', updated_at: new Date().toISOString() },
      JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', updated_at: new Date().toISOString() }
    },
    all: [
      { code: 'USD', name: 'US Dollar', symbol: '$', updated_at: new Date().toISOString() },
      { code: 'EUR', name: 'Euro', symbol: '€', updated_at: new Date().toISOString() },
      { code: 'GBP', name: 'British Pound', symbol: '£', updated_at: new Date().toISOString() },
      { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', updated_at: new Date().toISOString() },
      { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', updated_at: new Date().toISOString() },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥', updated_at: new Date().toISOString() }
    ]
  },

  /**
   * Cities indexed by name-country combination
   */
  CITIES: {
    byName: {
      'London': {
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
      'New York': {
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
      'Dubai': {
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
      'Singapore': {
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
      'Tokyo': {
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
    },
    all: [
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
    ]
  },

  /**
   * Countries indexed by code
   */
  COUNTRIES: {
    byCode: {
      US: { code: 'US', name: 'United States', status: 'active', updated_at: new Date().toISOString() },
      GB: { code: 'GB', name: 'United Kingdom', status: 'active', updated_at: new Date().toISOString() },
      AE: { code: 'AE', name: 'United Arab Emirates', status: 'active', updated_at: new Date().toISOString() },
      SG: { code: 'SG', name: 'Singapore', status: 'active', updated_at: new Date().toISOString() },
      JP: { code: 'JP', name: 'Japan', status: 'active', updated_at: new Date().toISOString() },
      FR: { code: 'FR', name: 'France', status: 'active', updated_at: new Date().toISOString() }
    },
    all: [
      { code: 'US', name: 'United States', status: 'active', updated_at: new Date().toISOString() },
      { code: 'GB', name: 'United Kingdom', status: 'active', updated_at: new Date().toISOString() },
      { code: 'AE', name: 'United Arab Emirates', status: 'active', updated_at: new Date().toISOString() },
      { code: 'SG', name: 'Singapore', status: 'active', updated_at: new Date().toISOString() },
      { code: 'JP', name: 'Japan', status: 'active', updated_at: new Date().toISOString() },
      { code: 'FR', name: 'France', status: 'active', updated_at: new Date().toISOString() }
    ]
  },

  /**
   * Locations (combined airports + cities) for autocomplete
   */
  LOCATIONS: {
    byId: {
      'LHR': { id: 'LHR', name: 'London Heathrow Airport', country: 'United Kingdom', country_code: 'GB', type: 'airport' as const, iata_code: 'LHR', latitude: 51.4700, longitude: -0.4543 },
      'JFK': { id: 'JFK', name: 'John F. Kennedy International Airport', country: 'United States', country_code: 'US', type: 'airport' as const, iata_code: 'JFK', latitude: 40.6413, longitude: -73.7781 },
      'DXB': { id: 'DXB', name: 'Dubai International Airport', country: 'United Arab Emirates', country_code: 'AE', type: 'airport' as const, iata_code: 'DXB', latitude: 25.2532, longitude: 55.3657 },
      'SIN': { id: 'SIN', name: 'Singapore Changi Airport', country: 'Singapore', country_code: 'SG', type: 'airport' as const, iata_code: 'SIN', latitude: 1.3644, longitude: 103.9915 },
      'HKG': { id: 'HKG', name: 'Hong Kong International Airport', country: 'Hong Kong', country_code: 'HK', type: 'airport' as const, iata_code: 'HKG', latitude: 22.3080, longitude: 113.9185 },
      'London-GB': { id: 'London-GB', name: 'London', country: 'United Kingdom', country_code: 'GB', type: 'city' as const, latitude: 51.5074, longitude: -0.1278 },
      'New York-US': { id: 'New York-US', name: 'New York', country: 'United States', country_code: 'US', type: 'city' as const, latitude: 40.7128, longitude: -74.0060 },
      'Dubai-AE': { id: 'Dubai-AE', name: 'Dubai', country: 'United Arab Emirates', country_code: 'AE', type: 'city' as const, latitude: 25.2048, longitude: 55.2708 },
      'Singapore-SG': { id: 'Singapore-SG', name: 'Singapore', country: 'Singapore', country_code: 'SG', type: 'city' as const, latitude: 1.3521, longitude: 103.8198 },
      'Tokyo-JP': { id: 'Tokyo-JP', name: 'Tokyo', country: 'Japan', country_code: 'JP', type: 'city' as const, latitude: 35.6762, longitude: 139.6503 }
    },
    all: [
      { id: 'LHR', name: 'London Heathrow Airport', country: 'United Kingdom', country_code: 'GB', type: 'airport' as const, iata_code: 'LHR', latitude: 51.4700, longitude: -0.4543 },
      { id: 'JFK', name: 'John F. Kennedy International Airport', country: 'United States', country_code: 'US', type: 'airport' as const, iata_code: 'JFK', latitude: 40.6413, longitude: -73.7781 },
      { id: 'DXB', name: 'Dubai International Airport', country: 'United Arab Emirates', country_code: 'AE', type: 'airport' as const, iata_code: 'DXB', latitude: 25.2532, longitude: 55.3657 },
      { id: 'SIN', name: 'Singapore Changi Airport', country: 'Singapore', country_code: 'SG', type: 'airport' as const, iata_code: 'SIN', latitude: 1.3644, longitude: 103.9915 },
      { id: 'HKG', name: 'Hong Kong International Airport', country: 'Hong Kong', country_code: 'HK', type: 'airport' as const, iata_code: 'HKG', latitude: 22.3080, longitude: 113.9185 },
      { id: 'London-GB', name: 'London', country: 'United Kingdom', country_code: 'GB', type: 'city' as const, latitude: 51.5074, longitude: -0.1278 },
      { id: 'New York-US', name: 'New York', country: 'United States', country_code: 'US', type: 'city' as const, latitude: 40.7128, longitude: -74.0060 },
      { id: 'Dubai-AE', name: 'Dubai', country: 'United Arab Emirates', country_code: 'AE', type: 'city' as const, latitude: 25.2048, longitude: 55.2708 },
      { id: 'Singapore-SG', name: 'Singapore', country: 'Singapore', country_code: 'SG', type: 'city' as const, latitude: 1.3521, longitude: 103.8198 },
      { id: 'Tokyo-JP', name: 'Tokyo', country: 'Japan', country_code: 'JP', type: 'city' as const, latitude: 35.6762, longitude: 139.6503 }
    ]
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
  shared: SHARED_STATIC_DATA,
  suppliers: SUPPLIER_STATIC_DATA
} as const;

/**
 * Type exports for all static data structures
 */
export type FlightStaticData = typeof FLIGHT_STATIC_DATA;
export type HotelStaticData = typeof HOTEL_STATIC_DATA;
export type SharedStaticData = typeof SHARED_STATIC_DATA;
export type SupplierStaticData = typeof SUPPLIER_STATIC_DATA;
export type StaticDataIndex = typeof STATIC_DATA_INDEX;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get an airport by IATA code (O(1) lookup)
 */
export function getAirportByCode(code: string) {
  return FLIGHT_STATIC_DATA.AIRPORTS.byIataCode[code as keyof typeof FLIGHT_STATIC_DATA.AIRPORTS.byIataCode] || null;
}

/**
 * Get an airline by IATA code (O(1) lookup)
 */
export function getAirlineByCode(code: string) {
  return FLIGHT_STATIC_DATA.AIRLINES.byIataCode[code as keyof typeof FLIGHT_STATIC_DATA.AIRLINES.byIataCode] || null;
}

/**
 * Get a city by name (O(1) lookup)
 */
export function getCityByName(name: string) {
  return SHARED_STATIC_DATA.CITIES.byName[name as keyof typeof SHARED_STATIC_DATA.CITIES.byName] || null;
}

/**
 * Get a currency by code (O(1) lookup)
 */
export function getCurrencyByCode(code: string) {
  return SHARED_STATIC_DATA.CURRENCIES.byCode[code as keyof typeof SHARED_STATIC_DATA.CURRENCIES.byCode] || null;
}

/**
 * Get a location by ID (O(1) lookup)
 */
export function getLocationById(id: string) {
  return SHARED_STATIC_DATA.LOCATIONS.byId[id as keyof typeof SHARED_STATIC_DATA.LOCATIONS.byId] || null;
}

/**
 * Get a hotel chain by code (O(1) lookup)
 */
export function getHotelChainByCode(code: string) {
  return HOTEL_STATIC_DATA.CHAINS.byCode[code as keyof typeof HOTEL_STATIC_DATA.CHAINS.byCode] || null;
}

/**
 * Get a hotel facility by name (O(1) lookup)
 */
export function getHotelFacilityByName(name: string) {
  return HOTEL_STATIC_DATA.FACILITIES.byName[name as keyof typeof HOTEL_STATIC_DATA.FACILITIES.byName] || null;
}

/**
 * Get a supplier by code (O(1) lookup)
 */
export function getSupplierByCode(code: string) {
  return SUPPLIER_STATIC_DATA.SUPPLIERS.byCode[code as keyof typeof SUPPLIER_STATIC_DATA.SUPPLIERS.byCode] || null;
}

/**
 * Search locations by query string (filters across airports and cities)
 */
export function searchLocations(query: string): (typeof SHARED_STATIC_DATA.LOCATIONS.all)[number][] {
  const normalizedQuery = query.toLowerCase().trim();
  return SHARED_STATIC_DATA.LOCATIONS.all.filter(location =>
    location.name.toLowerCase().includes(normalizedQuery) ||
    location.country.toLowerCase().includes(normalizedQuery) ||
    ((location as any).iata_code?.toLowerCase?.().includes(normalizedQuery) ?? false)
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

/**
 * Get all shared static data
 */
export function getAllSharedData(): SharedStaticData {
  return SHARED_STATIC_DATA;
}

// Re-export from main index for convenience
export * from './index';
