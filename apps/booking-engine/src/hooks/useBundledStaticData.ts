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
  usePopularDestinations,
  useLoyaltyPrograms,
} from './useStaticData';

/**
 * Master hook that provides all static data.
 * Each sub-hook delegates to React Query.
 * When APIs fail, returns empty arrays (no hardcoded fallbacks).
 */
export function useBundledStaticData() {
  // Flight & Travel data - delegate to React Query hooks
  const airportsQuery = useAirports();
  const airlinesQuery = useAirlines();
  const citiesQuery = useCities();
  const countriesQuery = useCountries();
  const currenciesQuery = useCurrencies();
  
  // Nationalities are embedded in countries; extract them
  const nationalities = useMemo(() => {
    return countriesQuery.data || [];
  }, [countriesQuery.data]);
  
  // Hotel data
  const hotelAmenitiesQuery = useHotelAmenities();
  const boardTypesQuery = useBoardTypes();
  const destinationsQuery = usePopularDestinations();
  const loyaltyProgramsQuery = useLoyaltyPrograms();

  // Calculate overall loading and error state
  const loading = useMemo(() => 
    airportsQuery.isLoading || airlinesQuery.isLoading || citiesQuery.isLoading || countriesQuery.isLoading || 
    currenciesQuery.isLoading || hotelAmenitiesQuery.isLoading || boardTypesQuery.isLoading || 
    destinationsQuery.isLoading || loyaltyProgramsQuery.isLoading,
    [airportsQuery.isLoading, airlinesQuery.isLoading, citiesQuery.isLoading, countriesQuery.isLoading, 
     currenciesQuery.isLoading, hotelAmenitiesQuery.isLoading, boardTypesQuery.isLoading, 
     destinationsQuery.isLoading, loyaltyProgramsQuery.isLoading]
  );

  const error = useMemo(() => 
    airportsQuery.error || airlinesQuery.error || citiesQuery.error || countriesQuery.error || 
    currenciesQuery.error || hotelAmenitiesQuery.error || boardTypesQuery.error || 
    destinationsQuery.error || loyaltyProgramsQuery.error,
    [airportsQuery.error, airlinesQuery.error, citiesQuery.error, countriesQuery.error, 
     currenciesQuery.error, hotelAmenitiesQuery.error, boardTypesQuery.error, 
     destinationsQuery.error, loyaltyProgramsQuery.error]
  );

  return useMemo(() => ({
    // Flight & Travel - return normalized arrays with metadata
    airports: { data: airportsQuery.data || [], isLoading: airportsQuery.isLoading, error: airportsQuery.error },
    airlines: { data: airlinesQuery.data || [], isLoading: airlinesQuery.isLoading, error: airlinesQuery.error },
    cities: { data: citiesQuery.data || [], isLoading: citiesQuery.isLoading, error: citiesQuery.error },
    countries: { data: countriesQuery.data || [], isLoading: countriesQuery.isLoading, error: countriesQuery.error },
    currencies: { data: currenciesQuery.data || [], isLoading: currenciesQuery.isLoading, error: currenciesQuery.error },
    nationalities: { data: nationalities, isLoading: countriesQuery.isLoading, error: countriesQuery.error },
    
    // Hotel
    hotelAmenities: { data: hotelAmenitiesQuery.data || [], isLoading: hotelAmenitiesQuery.isLoading, error: hotelAmenitiesQuery.error },
    boardTypes: { data: boardTypesQuery.data || [], isLoading: boardTypesQuery.isLoading, error: boardTypesQuery.error },
    destinations: { data: destinationsQuery.data || [], isLoading: destinationsQuery.isLoading, error: destinationsQuery.error },
    loyaltyPrograms: { data: loyaltyProgramsQuery.data || [], isLoading: loyaltyProgramsQuery.isLoading, error: loyaltyProgramsQuery.error },
    
    // Overall state
    loading,
    error,
  }), [airportsQuery.data, airportsQuery.isLoading, airportsQuery.error,
       airlinesQuery.data, airlinesQuery.isLoading, airlinesQuery.error,
       citiesQuery.data, citiesQuery.isLoading, citiesQuery.error,
       countriesQuery.data, countriesQuery.isLoading, countriesQuery.error,
       currenciesQuery.data, currenciesQuery.isLoading, currenciesQuery.error,
       hotelAmenitiesQuery.data, hotelAmenitiesQuery.isLoading, hotelAmenitiesQuery.error,
       boardTypesQuery.data, boardTypesQuery.isLoading, boardTypesQuery.error,
       destinationsQuery.data, destinationsQuery.isLoading, destinationsQuery.error,
       loyaltyProgramsQuery.data, loyaltyProgramsQuery.isLoading, loyaltyProgramsQuery.error,
       nationalities, loading, error]);
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
  const query = usePopularDestinations();
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
