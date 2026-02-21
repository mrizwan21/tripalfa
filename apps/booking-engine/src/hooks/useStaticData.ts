/**
 * useStaticData — React hooks for DB-backed static reference data
 * ===============================================================
 * All data is fetched from the PostgreSQL static-data-service via /static/*.
 * Each hook falls back to in-memory static data when the service is unavailable,
 * so the UI always has something to display even during local dev without the DB.
 *
 * Usage:
 *   const { data: airports, isLoading } = useAirports();
 *   const { data: suggestions } = useSuggestions('dubai', 'flight');
 *   const { data: currencies } = useCurrencies();
 *   const { data: destinations } = usePopularDestinations(12);
 */

import { useQuery } from '@tanstack/react-query';
import {
  fetchAirports,
  fetchAirlines,
  fetchCities,
  fetchCurrencies,
  fetchCountries,
  fetchSuggestions,
  fetchHotelAmenities,
  fetchBoardTypesDB,
  fetchHotelTypesDB,
  fetchDestinationsDB,
  fetchPopularDestinationsDB,
  fetchPopularHotels,
  fetchLoyaltyPrograms,
  fetchHotelById,
} from '@/lib/api';

// ─── Stale times ──────────────────────────────────────────────────────────────
// Static reference data rarely changes — cache aggressively.
const STALE_HOUR = 60 * 60 * 1000;   // 1 hour
const STALE_DAY  = 24 * STALE_HOUR;  // 24 hours

// ─── Airports ─────────────────────────────────────────────────────────────────
export function useAirports(query?: string) {
  return useQuery({
    queryKey: ['static', 'airports', query ?? ''],
    queryFn: () => fetchAirports(query),
    staleTime: STALE_HOUR,
    gcTime: STALE_DAY,
    retry: 1,
  });
}

// ─── Airlines ─────────────────────────────────────────────────────────────────
export function useAirlines(query?: string) {
  return useQuery({
    queryKey: ['static', 'airlines', query ?? ''],
    queryFn: () => fetchAirlines(query),
    staleTime: STALE_HOUR,
    gcTime: STALE_DAY,
    retry: 1,
  });
}

// ─── Cities ───────────────────────────────────────────────────────────────────
export function useCities(query?: string) {
  return useQuery({
    queryKey: ['static', 'cities', query ?? ''],
    queryFn: () => fetchCities(query),
    staleTime: STALE_HOUR,
    gcTime: STALE_DAY,
    retry: 1,
  });
}

// ─── Currencies ───────────────────────────────────────────────────────────────
export function useCurrencies() {
  return useQuery({
    queryKey: ['static', 'currencies'],
    queryFn: fetchCurrencies,
    staleTime: STALE_DAY,
    gcTime: STALE_DAY,
    retry: 1,
  });
}

// ─── Countries ────────────────────────────────────────────────────────────────
export function useCountries(query?: string) {
  return useQuery({
    queryKey: ['static', 'countries', query ?? ''],
    queryFn: () => fetchCountries(query),
    staleTime: STALE_DAY,
    gcTime: STALE_DAY,
    retry: 1,
  });
}

// ─── Unified Suggestions (Autocomplete) ──────────────────────────────────────
export function useSuggestions(query: string, type: 'flight' | 'hotel' = 'flight') {
  return useQuery({
    queryKey: ['static', 'suggestions', type, query],
    queryFn: () => fetchSuggestions(query, type),
    enabled: typeof query === 'string' && query.length >= 2,
    staleTime: 30_000, // 30s — user may type same query soon
    gcTime: 5 * 60_000,
    retry: 0, // Don't retry suggestions — speed matters more
  });
}

// ─── Hotel Amenities ──────────────────────────────────────────────────────────
export function useHotelAmenities(params?: { category?: string; popular?: boolean }) {
  return useQuery({
    queryKey: ['static', 'hotel-amenities', params?.category ?? '', params?.popular ?? false],
    queryFn: () => fetchHotelAmenities(params),
    staleTime: STALE_DAY,
    gcTime: STALE_DAY,
    retry: 1,
  });
}

// ─── Board Types (Meal Plans) ─────────────────────────────────────────────────
export function useBoardTypes() {
  return useQuery({
    queryKey: ['static', 'board-types'],
    queryFn: fetchBoardTypesDB,
    staleTime: STALE_DAY,
    gcTime: STALE_DAY,
    retry: 1,
  });
}

// ─── Hotel Types ──────────────────────────────────────────────────────────────
export function useHotelTypes() {
  return useQuery({
    queryKey: ['static', 'hotel-types'],
    queryFn: fetchHotelTypesDB,
    staleTime: STALE_DAY,
    gcTime: STALE_DAY,
    retry: 1,
  });
}

// ─── Destinations ─────────────────────────────────────────────────────────────
export function useDestinations(params?: { type?: string; countryCode?: string; search?: string }) {
  return useQuery({
    queryKey: ['static', 'destinations', params?.type ?? '', params?.countryCode ?? '', params?.search ?? ''],
    queryFn: () => fetchDestinationsDB(params),
    staleTime: STALE_HOUR,
    gcTime: STALE_DAY,
    retry: 1,
  });
}

// ─── Popular Destinations (Homepage) ─────────────────────────────────────────
export function usePopularDestinations(limit = 12) {
  return useQuery({
    queryKey: ['static', 'popular-destinations', limit],
    queryFn: () => fetchPopularDestinationsDB(limit),
    staleTime: STALE_HOUR,
    gcTime: STALE_DAY,
    retry: 1,
  });
}

// ─── Popular Hotels (Homepage) ────────────────────────────────────────────────
export function usePopularHotels(limit = 12) {
  return useQuery({
    queryKey: ['static', 'popular-hotels', limit],
    queryFn: () => fetchPopularHotels(limit),
    staleTime: STALE_HOUR,
    gcTime: STALE_DAY,
    retry: 1,
  });
}

// ─── Loyalty Programs ─────────────────────────────────────────────────────────
export function useLoyaltyPrograms(query?: string) {
  return useQuery({
    queryKey: ['static', 'loyalty-programs', query ?? ''],
    queryFn: () => fetchLoyaltyPrograms(query),
    staleTime: STALE_HOUR,
    gcTime: STALE_DAY,
    retry: 1,
  });
}

// ─── Single Hotel ─────────────────────────────────────────────────────────────
export function useHotel(id: string | undefined) {
  return useQuery({
    queryKey: ['static', 'hotel', id],
    queryFn: () => fetchHotelById(id!),
    enabled: !!id,
    staleTime: STALE_HOUR,
    gcTime: STALE_DAY,
    retry: 1,
  });
}
