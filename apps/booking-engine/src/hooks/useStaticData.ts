/**
 * Static Data Hooks - All data fetched through centralized API manager
 * These hooks provide access to reference data (airports, airlines, countries, etc.)
 * All API calls are routed through the centralized api.ts facade.
 */

import { useQuery } from "@tanstack/react-query";
import {
  fetchPopularDestinations,
  fetchAirports,
  fetchAirlines,
  fetchCities,
  fetchCountries,
  fetchCurrencies,
  fetchNationalities,
  fetchPhoneCodes,
  fetchLoyaltyPrograms,
  fetchLoyaltyProgramsAll,
  fetchHotelAmenities,
  fetchHotelTypes,
  fetchBoardTypes,
  fetchRoomTypesDB,
  fetchSuggestions,
  queryKeys,
} from "../lib/api";

/**
 * Hook to fetch popular destinations for homepage
 */
export function usePopularDestinations(limit = 20) {
  return useQuery({
    queryKey: ["popularDestinations", limit],
    queryFn: () => fetchPopularDestinations(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch popular hotels for homepage
 * Alias for usePopularDestinations with hotel-specific context
 */
export function usePopularHotels(limit = 20) {
  return useQuery({
    queryKey: ["popularHotels", limit],
    queryFn: () => fetchPopularDestinations(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch airports with optional search query
 */
export function useAirports(query?: string) {
  return useQuery({
    queryKey: ["airports", query],
    queryFn: () => fetchAirports(query),
    enabled: !query || query.length >= 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch airlines with optional search query
 */
export function useAirlines(query?: string) {
  return useQuery({
    queryKey: ["airlines", query],
    queryFn: () => fetchAirlines(query),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to fetch cities with optional search query
 */
export function useCities(query?: string) {
  return useQuery({
    queryKey: ["cities", query],
    queryFn: () => fetchCities(query),
    enabled: !query || query.length >= 2,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch countries for dropdowns
 */
export function useCountries(query?: string) {
  return useQuery({
    queryKey: ["countries", query],
    queryFn: () => fetchCountries(query),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch currencies
 */
export function useCurrencies() {
  return useQuery({
    queryKey: ["currencies"],
    queryFn: fetchCurrencies,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch nationalities
 */
export function useNationalities(query?: string) {
  return useQuery({
    queryKey: ["nationalities", query],
    queryFn: () => fetchNationalities(query),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch phone country codes
 */
export function usePhoneCodes() {
  return useQuery({
    queryKey: ["phoneCodes"],
    queryFn: fetchPhoneCodes,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch loyalty programs
 */
export function useLoyaltyPrograms(query?: string) {
  return useQuery({
    queryKey: ["loyaltyPrograms", query],
    queryFn: () => fetchLoyaltyPrograms(query),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to fetch all loyalty programs (airline + hotel)
 */
export function useLoyaltyProgramsAll(type?: "airline" | "hotel") {
  return useQuery({
    queryKey: ["loyaltyProgramsAll", type],
    queryFn: () => fetchLoyaltyProgramsAll(type),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to fetch hotel amenities
 */
export function useHotelAmenities(params?: {
  category?: string;
  popular?: boolean;
}) {
  return useQuery({
    queryKey: ["hotelAmenities", params],
    queryFn: () => fetchHotelAmenities(params),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch hotel types
 */
export function useHotelTypes() {
  return useQuery({
    queryKey: ["hotelTypes"],
    queryFn: fetchHotelTypes,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch board types (meal plans)
 */
export function useBoardTypes() {
  return useQuery({
    queryKey: ["boardTypes"],
    queryFn: fetchBoardTypes,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch room types
 */
export function useRoomTypes(hotelId?: string) {
  return useQuery({
    queryKey: ["roomTypes", hotelId],
    queryFn: () => fetchRoomTypesDB(hotelId),
    enabled: !!hotelId,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook for autocomplete suggestions (airports, cities)
 */
export function useSuggestions(
  query: string,
  type: "flight" | "hotel" = "flight",
) {
  return useQuery({
    queryKey: ["suggestions", query, type],
    queryFn: () => fetchSuggestions(query, type),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Re-export query keys for convenience
export { queryKeys };
