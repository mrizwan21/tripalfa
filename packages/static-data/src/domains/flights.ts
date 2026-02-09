/**
 * Flight Domain Static Data
 * 
 * All flight-related static data centralized in one place.
 * This eliminates duplication between frontend-index and fallbacks.
 */

import { Airport, Airline, Aircraft } from '../types';

// ============================================
// AIRPORTS
// ============================================

export const AIRPORTS: Airport[] = [
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
  },
  {
    iata_code: 'CDG',
    name: 'Charles de Gaulle Airport',
    city: 'Paris',
    country: 'France',
    country_code: 'FR',
    latitude: 49.0097,
    longitude: 2.5479,
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    iata_code: 'FRA',
    name: 'Frankfurt Airport',
    city: 'Frankfurt',
    country: 'Germany',
    country_code: 'DE',
    latitude: 50.0379,
    longitude: 8.5622,
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    iata_code: 'SYD',
    name: 'Sydney Kingsford Smith Airport',
    city: 'Sydney',
    country: 'Australia',
    country_code: 'AU',
    latitude: -33.9399,
    longitude: 151.1753,
    is_active: true,
    updated_at: new Date().toISOString()
  }
];

// Indexed airports for O(1) lookup
export const AIRPORTS_BY_IATA: Record<string, Airport> = AIRPORTS.reduce(
  (acc, airport) => ({ ...acc, [airport.iata_code]: airport }),
  {}
);

// ============================================
// AIRLINES
// ============================================

export const AIRLINES: Airline[] = [
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
  },
  {
    iata_code: 'LH',
    name: 'Lufthansa',
    logo_url: 'https://logo.clearbit.com/lufthansa.com',
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    iata_code: 'AF',
    name: 'Air France',
    logo_url: 'https://logo.clearbit.com/airfrance.com',
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    iata_code: 'EY',
    name: 'Etihad Airways',
    logo_url: 'https://logo.clearbit.com/etihad.com',
    is_active: true,
    updated_at: new Date().toISOString()
  }
];

// Indexed airlines for O(1) lookup
export const AIRLINES_BY_IATA: Record<string, Airline> = AIRLINES.reduce(
  (acc, airline) => ({ ...acc, [airline.iata_code]: airline }),
  {}
);

// ============================================
// AIRCRAFT
// ============================================

export const AIRCRAFT: Aircraft[] = [
  {
    id: '1',
    iata_code: '320',
    name: 'Airbus A320',
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    iata_code: '321',
    name: 'Airbus A321',
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    iata_code: '333',
    name: 'Airbus A330-300',
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    iata_code: '359',
    name: 'Airbus A350-900',
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: '5',
    iata_code: '388',
    name: 'Airbus A380-800',
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: '6',
    iata_code: '738',
    name: 'Boeing 737-800',
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: '7',
    iata_code: '77W',
    name: 'Boeing 777-300ER',
    is_active: true,
    updated_at: new Date().toISOString()
  },
  {
    id: '8',
    iata_code: '789',
    name: 'Boeing 787-9',
    is_active: true,
    updated_at: new Date().toISOString()
  }
];

// Indexed aircraft for O(1) lookup
export const AIRCRAFT_BY_IATA: Record<string, Aircraft> = AIRCRAFT.reduce(
  (acc, aircraft) => ({ ...acc, [aircraft.iata_code]: aircraft }),
  {}
);

// ============================================
// CABIN CLASSES
// ============================================

export interface CabinClass {
  value: string;
  label: string;
  display_order: number;
}

export const CABIN_CLASSES: CabinClass[] = [
  { value: 'ECONOMY', label: 'Economy', display_order: 1 },
  { value: 'PREMIUM_ECONOMY', label: 'Premium Economy', display_order: 2 },
  { value: 'BUSINESS', label: 'Business', display_order: 3 },
  { value: 'FIRST', label: 'First Class', display_order: 4 }
];

export const CABIN_CLASSES_BY_CODE: Record<string, CabinClass> = CABIN_CLASSES.reduce(
  (acc, cabin) => ({ ...acc, [cabin.value]: cabin }),
  {}
);

// ============================================
// POPULAR ROUTES
// ============================================

export interface PopularRoute {
  origin: string;
  destination: string;
  origin_city: string;
  destination_city: string;
  popularity: number;
}

export const POPULAR_ROUTES: PopularRoute[] = [
  { origin: 'JFK', destination: 'LHR', origin_city: 'New York', destination_city: 'London', popularity: 1 },
  { origin: 'LHR', destination: 'DXB', origin_city: 'London', destination_city: 'Dubai', popularity: 2 },
  { origin: 'DXB', destination: 'SIN', origin_city: 'Dubai', destination_city: 'Singapore', popularity: 3 },
  { origin: 'SIN', destination: 'HKG', origin_city: 'Singapore', destination_city: 'Hong Kong', popularity: 4 },
  { origin: 'HKG', destination: 'JFK', origin_city: 'Hong Kong', destination_city: 'New York', popularity: 5 },
  { origin: 'LHR', destination: 'JFK', origin_city: 'London', destination_city: 'New York', popularity: 6 },
  { origin: 'DXB', destination: 'LHR', origin_city: 'Dubai', destination_city: 'London', popularity: 7 },
  { origin: 'SIN', destination: 'DXB', origin_city: 'Singapore', destination_city: 'Dubai', popularity: 8 }
];

// ============================================
// LOYALTY PROGRAMS
// ============================================

