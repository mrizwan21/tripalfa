/**
 * Custom hook for accessing hotel static data
 * Provides easy access to all hotel-related static data from the centralized package.
 *
 * usePopularDestinations now fetches LIVE data from PostgreSQL via the static-data-service.
 * useHotelFilterAmenities, useHotelFilterBoardTypes, and useHotelFilterTypes delegate to 
 * React Query hooks from useStaticData.ts (DB-backed).
 * All other hooks use the fast in-memory static data package as before.
 */

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  HOTEL_STATIC_DATA,
  getHotelTypeByCode,
  getHotelAmenityByCode,
  getRoomTypeByCode,
  getBoardTypeByCode,
  getStarRatingByValue,
  getAmenitiesByCategory,
  searchHotelDestinations
} from '@tripalfa/static-data/frontend-index';
import { fetchPopularDestinationsDB } from '@/lib/api';
import { useHotelAmenities as useHotelAmenitiesDB, useBoardTypes as useBoardTypesDB, useHotelTypes as useHotelTypesDB, useDestinations } from './useStaticData';

// Types
export interface HotelType {
  code: string;
  name: string;
  description?: string;
}

export interface HotelAmenity {
  code: string;
  name: string;
  category: string;
  applies_to: 'hotel' | 'room' | 'both';
  is_popular?: boolean;
  sort_order?: number;
}

export interface HotelChain {
  code: string;
  name: string;
}

export interface StarRating {
  value: number;
  label: string;
  icon: string;
}

export interface RoomType {
  code: string;
  name: string;
  description: string;
  max_occupancy: number;
}

export interface BoardType {
  code: string;
  name: string;
  description: string;
  sort_order: number;
}

export interface ViewType {
  code: string;
  name: string;
}

export interface PaymentType {
  code: string;
  name: string;
  description: string;
}

export interface HotelDestination {
  city: string;
  country: string;
  country_code: string;
  popularity: number;
}

/**
 * Hook to access all hotel static data
 */
export function useHotelStaticData() {
  return useMemo(() => ({
    // Hotel Chains
    chains: HOTEL_STATIC_DATA.CHAINS.all as HotelChain[],
    chainsByCode: HOTEL_STATIC_DATA.CHAINS.byCode as Record<string, HotelChain>,
    
    // Hotel Types
    types: HOTEL_STATIC_DATA.TYPES.all as HotelType[],
    typesByCode: HOTEL_STATIC_DATA.TYPES.byCode as Record<string, HotelType>,
    typesByName: HOTEL_STATIC_DATA.TYPES.byName as Record<string, HotelType>,
    
    // Star Ratings
    starRatings: HOTEL_STATIC_DATA.STAR_RATINGS.all as StarRating[],
    starRatingsByValue: HOTEL_STATIC_DATA.STAR_RATINGS.byValue as Record<number, StarRating>,
    
    // Popular Destinations
    popularDestinations: HOTEL_STATIC_DATA.POPULAR_DESTINATIONS as HotelDestination[],
    
    // Amenities
    amenities: HOTEL_STATIC_DATA.AMENITIES.all as HotelAmenity[],
    amenitiesByCode: HOTEL_STATIC_DATA.AMENITIES.byCode as Record<string, HotelAmenity>,
    amenitiesByCategory: HOTEL_STATIC_DATA.AMENITIES.byCategory as Record<string, HotelAmenity[]>,
    hotelLevelAmenities: HOTEL_STATIC_DATA.AMENITIES.hotelLevel as HotelAmenity[],
    roomLevelAmenities: HOTEL_STATIC_DATA.AMENITIES.roomLevel as HotelAmenity[],
    popularAmenities: HOTEL_STATIC_DATA.AMENITIES.popular as HotelAmenity[],
    
    // Room Types
    roomTypes: HOTEL_STATIC_DATA.ROOM_TYPES.all as RoomType[],
    roomTypesByCode: HOTEL_STATIC_DATA.ROOM_TYPES.byCode as Record<string, RoomType>,
    
    // Board Types
    boardTypes: HOTEL_STATIC_DATA.BOARD_TYPES.all as BoardType[],
    boardTypesByCode: HOTEL_STATIC_DATA.BOARD_TYPES.byCode as Record<string, BoardType>,
    
    // View Types
    viewTypes: HOTEL_STATIC_DATA.VIEW_TYPES.all as ViewType[],
    viewTypesByCode: HOTEL_STATIC_DATA.VIEW_TYPES.byCode as Record<string, ViewType>,
    
    // Payment Types
    paymentTypes: HOTEL_STATIC_DATA.PAYMENT_TYPES.all as PaymentType[],
    paymentTypesByCode: HOTEL_STATIC_DATA.PAYMENT_TYPES.byCode as Record<string, PaymentType>,
  }), []);
}

/**
 * Hook to get hotel types for filter dropdowns - delegates to DB-backed version
 */
export function useHotelFilterTypes() {
  const { data, isLoading, error } = useHotelTypesDB();
  
  const hotelTypes = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }
    // Fallback to static enumeration
    return HOTEL_STATIC_DATA.TYPES.all;
  }, [data]);

  return {
    options: hotelTypes.map((t: any) => ({ value: t.code || t.id, label: t.name })),
    types: hotelTypes,
    isLoading,
    error
  };
}

/**
 * Hook to get hotel amenities for filter/display - delegates to DB-backed version
 */
export function useHotelFilterAmenities(params?: { category?: string; popular?: boolean }) {
  const { data, isLoading, error } = useHotelAmenitiesDB(params);

  const amenities = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }
    // Fallback to static enumeration
    return HOTEL_STATIC_DATA.AMENITIES.all;
  }, [data]);

  return {
    amenities,
    isLoading,
    error,
    // Options for multi-select filters
    options: amenities.map((a: any) => ({ value: a.code, label: a.name, category: a.category }))
  };
}

/**
 * Hook to get board types for filter/display - delegates to DB-backed version
 */
export function useHotelFilterBoardTypes() {
  const { data, isLoading, error } = useBoardTypesDB();

  const boardTypes = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }
    // Fallback to static enumeration
    return HOTEL_STATIC_DATA.BOARD_TYPES.all;
  }, [data]);

  return {
    boardTypes,
    options: boardTypes.map((b: any) => ({ value: b.code, label: b.name, description: b.description })),
    isLoading,
    error
  };
}

/**
 * Wrapper: useHotelAmenities()
 * Primary: DB-backed hook from useStaticData
 * Fallback: HOTEL_STATIC_DATA.AMENITIES.all
 * 
 * Returns amenities with optional filtering by category/popular flag.
 */
export function useHotelAmenities(params?: { category?: string; popular?: boolean }) {
  const { data, isLoading, error } = useHotelAmenitiesDB(params);

  const amenities = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }
    // Fallback to static enumeration when DB unavailable
    return HOTEL_STATIC_DATA.AMENITIES.all;
  }, [data]);

  return { amenities, isLoading, error };
}

/**
 * Wrapper: useHotelTypes()
 * Primary: DB-backed hook from useStaticData
 * Fallback: HOTEL_STATIC_DATA.TYPES.all
 * 
 * Returns hotel types for filter dropdowns.
 */
export function useHotelTypes() {
  const { data, isLoading, error } = useHotelTypesDB();

  const types = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }
    // Fallback to static enumeration when DB unavailable
    return HOTEL_STATIC_DATA.TYPES.all;
  }, [data]);

  return { types, isLoading, error };
}

/**
 * Wrapper: useBoardTypes()
 * Primary: DB-backed hook from useStaticData
 * Fallback: HOTEL_STATIC_DATA.BOARD_TYPES.all
 * 
 * Returns board types (meal plans) with options suitable for filter dropdowns.
 */
export function useBoardTypes() {
  const { data, isLoading, error } = useBoardTypesDB();

  const boardTypes = useMemo(() => {
    if (data && data.length > 0) {
      return data;
    }
    // Fallback to static enumeration when DB unavailable
    return HOTEL_STATIC_DATA.BOARD_TYPES.all;
  }, [data]);

  return { boardTypes, isLoading, error };
}

/**
 * Hook to get room types
 */
export function useRoomTypes() {
  return useMemo(() => {
    const roomTypes = HOTEL_STATIC_DATA.ROOM_TYPES.all;
    return {
      roomTypes,
      options: roomTypes.map(r => ({ 
        value: r.code, 
        label: r.name, 
        description: r.description,
        maxOccupancy: r.max_occupancy 
      }))
    };
  }, []);
}

/**
 * Hook to search hotel destinations
 */
export function useHotelDestinationSearch(query: string) {
  const [results, setResults] = useState<HotelDestination[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Use the static search function
    const searchResults = searchHotelDestinations(query);
    setResults(searchResults);
    setIsLoading(false);
  }, [query]);

  return { results, isLoading };
}

/**
 * Hook to get popular destinations for display on homepage.
 * PRIMARY: Fetches live data from PostgreSQL via static-data-service (/static/popular-destinations).
 * FALLBACK: Returns in-memory static data when DB is unavailable.
 *
 * Returns destinations in a normalised shape regardless of source:
 *   { city, country, country_code, imageUrl, hotelCount, popularityScore }
 */
export function usePopularDestinations(limit = 8) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['static', 'popular-destinations', limit],
    queryFn: () => fetchPopularDestinationsDB(limit),
    staleTime: 60 * 60 * 1000,   // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 1,
  });

  // Normalise DB rows to match the HotelDestination interface used by HotelHome
  const normalised = useMemo(() => {
    if (data && data.length > 0) {
      return data.map((d: any) => ({
        city: d.name ?? d.city ?? '',
        country: d.countryName ?? d.country ?? '',
        country_code: d.countryCode ?? d.country_code ?? '',
        popularity: d.popularityScore ?? d.popularity ?? 0,
        imageUrl: d.imageUrl ?? d.image_url ?? null,
        hotelCount: d.hotelCount ?? d.hotel_count ?? null,
        code: d.code ?? d.id ?? '',
        destinationType: d.destinationType ?? 'city',
      }));
    }
    // In-memory fallback
    const fallback = HOTEL_STATIC_DATA.POPULAR_DESTINATIONS;
    return (limit ? fallback.slice(0, limit) : fallback) as any[];
  }, [data, limit]);

  return normalised;
}

/**
 * Utility function to get amenity name by code
 */
export function useAmenityName(code: string): string {
  return useMemo(() => {
    const amenity = getHotelAmenityByCode(code);
    return amenity?.name || code;
  }, [code]);
}

/**
 * Utility function to get hotel type name by code
 */
export function useHotelTypeName(code: string): string {
  return useMemo(() => {
    const type = getHotelTypeByCode(code);
    return type?.name || code;
  }, [code]);
}

/**
 * Utility function to get board type name by code
 */
export function useBoardTypeName(code: string): string {
  return useMemo(() => {
    const boardType = getBoardTypeByCode(code);
    return boardType?.name || code;
  }, [code]);
}

/**
 * Utility function to get room type name by code
 */
export function useRoomTypeName(code: string): string {
  return useMemo(() => {
    const roomType = getRoomTypeByCode(code);
    return roomType?.name || code;
  }, [code]);
}

// Export the main hook as default
export default useHotelStaticData;