/**
 * Simplified Bundled Static Data Hooks
 * ====================================
 * Delegates all data fetching to React Query hooks from useStaticData.ts.
 * No custom caching, no fallbacks to hardcoded data —just delegate.
 * When DB is unavailable, each hook returns empty arrays.
 */

import { useMemo } from 'react';
import {
  useAirports,
  useAirlines,
  useCities,
  useCountries,
  useCurrencies,
  useHotelAmenities,
  useBoardTypes,
  useDestinations,
  useLoyaltyPrograms,
} from './useStaticData';

/**
 * Master hook that provides all static data.
 * Each sub-hook delegates to React Query.
 * When APIs fail, returns empty arrays (no hardcoded fallbacks).
 */
export function useBundledStaticData() {
  // Flight & Travel data - delegate to React Query hooks
  const airports = useAirports();
  const airlines = useAirlines();
  const cities = useCities();
  const countries = useCountries();
  const currencies = useCurrencies();
  
  // Nationalities are embedded in countries; extract them
  const nationalities = useMemo(() => {
    return countries.data || [];
  }, [countries.data]);
  
  // Hotel data
  const hotelAmenities = useHotelAmenities();
  const boardTypes = useBoardTypes();
  const destinations = useDestinations();
  const loyaltyPrograms = useLoyaltyPrograms();

  // Calculate overall loading and error state
  const loading = useMemo(() => 
    airports.isLoading || airlines.isLoading || cities.isLoading || countries.isLoading || 
    currencies.isLoading || hotelAmenities.isLoading || boardTypes.isLoading || 
    destinations.isLoading || loyaltyPrograms.isLoading,
    [airports.isLoading, airlines.isLoading, cities.isLoading, countries.isLoading, 
     currencies.isLoading, hotelAmenities.isLoading, boardTypes.isLoading, 
     destinations.isLoading, loyaltyPrograms.isLoading]
  );

  const error = useMemo(() => 
    airports.error || airlines.error || cities.error || countries.error || 
    currencies.error || hotelAmenities.error || boardTypes.error || 
    destinations.error || loyaltyPrograms.error,
    [airports.error, airlines.error, cities.error, countries.error, 
     currencies.error, hotelAmenities.error, boardTypes.error, 
     destinations.error, loyaltyPrograms.error]
  );

  return useMemo(() => ({
    // Flight & Travel - return the React Query result objects
    airports,
    airlines,
    cities,
    countries,
    currencies,
    nationalities: { data: nationalities, isLoading: countries.isLoading, error: countries.error },
    
    // Hotel
    hotelAmenities,
    boardTypes,
    destinations,
    loyaltyPrograms,
    
    // Overall state
    loading,
    error,
  }), [airports, airlines, cities, countries, currencies, nationalities,
       hotelAmenities, boardTypes, destinations, loyaltyPrograms, loading, error]);
}

// =====================================================================
// Old-style wrapper hooks for backward compatibility
// (e.g., PassengerDetails.tsx might call useStaticCountries() directly)
// These are thin wrappers around the React Query versions.
// =====================================================================

export function useStaticAirports() {
  const query = useAirports();
  return useMemo(() => ({
    airports: query.data || [],
    loading: query.isLoading,
    error: query.error,
    byIataCode: (query.data || []).reduce((acc, a) => ({ ...acc, [a.iata_code]: a }), {}),
    get: (code: string) => (query.data || []).find(a => a.iata_code === code),
  }), [query.data, query.isLoading, query.error]);
}

export function useStaticAirlines() {
  const query = useAirlines();
  return useMemo(() => ({
    airlines: query.data || [],
    loading: query.isLoading,
    error: query.error,
    byIataCode: (query.data || []).reduce((acc, a) => ({ ...acc, [a.iata_code]: a }), {}),
    get: (code: string) => (query.data || []).find(a => a.iata_code === code),
  }), [query.data, query.isLoading, query.error]);
}

export function useStaticCities() {
  const query = useCities();
  return useMemo(() => ({
    cities: query.data || [],
    loading: query.isLoading,
    error: query.error,
    byIataCode: (query.data || []).reduce((acc, c) => ({ ...acc, [c.iata_code]: c }), {}),
    get: (code: string) => (query.data || []).find(c => c.iata_code === code),
  }), [query.data, query.isLoading, query.error]);
}

export function useStaticCountries() {
  const query = useCountries();
  return useMemo(() => ({
    countries: query.data || [],
    loading: query.isLoading,
    error: query.error,
    byCode: (query.data || []).reduce((acc, c) => ({ ...acc, [c.code]: c }), {}),
    get: (code: string) => (query.data || []).find(c => c.code === code),
  }), [query.data, query.isLoading, query.error]);
}

export function useStaticCurrencies() {
  const query = useCurrencies();
  return useMemo(() => ({
    currencies: query.data || [],
    loading: query.isLoading,
    error: query.error,
    byCode: (query.data || []).reduce((acc, c) => ({ ...acc, [c.code]: c }), {}),
    get: (code: string) => (query.data || []).find(c => c.code === code),
  }), [query.data, query.isLoading, query.error]);
}

export function useStaticNationalities() {
  const query = useCountries(); // Nationalities are embedded in countries
  return useMemo(() => ({
    nationalities: query.data || [],
    loading: query.isLoading,
    error: query.error,
    byCode: (query.data || []).reduce((acc, n) => ({ ...acc, [n.code]: n }), {}),
    get: (code: string) => (query.data || []).find(n => n.code === code),
  }), [query.data, query.isLoading, query.error]);
}

export function useStaticHotelAmenities() {
  const query = useHotelAmenities();
  return useMemo(() => ({
    amenities: query.data || [],
    loading: query.isLoading,
    error: query.error,
  }), [query.data, query.isLoading, query.error]);
}

export function useStaticBoardTypes() {
  const query = useBoardTypes();
  return useMemo(() => ({
    boardTypes: query.data || [],
    loading: query.isLoading,
    error: query.error,
  }), [query.data, query.isLoading, query.error]);
}

export function useStaticDestinations() {
  const query = useDestinations();
  return useMemo(() => ({
    destinations: query.data || [],
    loading: query.isLoading,
    error: query.error,
  }), [query.data, query.isLoading, query.error]);
}

export function useStaticLoyaltyPrograms() {
  const query = useLoyaltyPrograms();
  return useMemo(() => ({
    programs: query.data || [],
    loading: query.isLoading,
    error: query.error,
  }), [query.data, query.isLoading, query.error]);
}

// Placeholder stubs for hooks not yet mapped (can be left empty or removed)
export function useStaticHotels() {
  return useMemo(() => ({
    hotels: [],
    loading: false,
    error: null,
  }), []);
}

export function useStaticHotelChains() {
  return useMemo(() => ({
    chains: [],
    loading: false,
    error: null,
  }), []);
}

export function useStaticHotelTypes() {
  return useMemo(() => ({
    types: [],
    loading: false,
    error: null,
  }), []);
}

export default useBundledStaticData;
