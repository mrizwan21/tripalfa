/**
 * Fallback data for static data when external sources are unavailable
 * 
 * NOTE: This file previously contained hardcoded fallback data for development.
 * As per project guidelines, all static data should come from the database.
 * This file is kept for backward compatibility but returns empty arrays.
 */

import { Airport, Airline, City, Currency, HotelChain, HotelType, Location, HotelAmenity } from './types';

// Empty fallback arrays for backward compatibility
// These are intentionally empty - data should come from database
export const FALLBACK_AIRPORTS: Airport[] = [];
export const FALLBACK_AIRLINES: Airline[] = [];
export const FALLBACK_CITIES: City[] = [];
export const FALLBACK_CURRENCIES: Currency[] = [];
export const FALLBACK_HOTEL_CHAINS: HotelChain[] = [];
export const FALLBACK_HOTEL_TYPES: HotelType[] = [];
export const FALLBACK_LOCATIONS: Location[] = [];

// All fallback data has been removed - use database only
// These functions now return empty arrays to enforce database-only data

