/**
 * Hook for fetching hotel facilities (amenities) from LiteAPI
 * 
 * Uses GET /data/facilities to retrieve facility IDs for filtering hotels.
 * Facilities are cached in localStorage for 24 hours to reduce API calls.
 */

import { useState, useEffect, useCallback } from 'react';
import hotelApi, { HotelFacility } from '../api/hotelApi';

const CACHE_KEY = 'hotel_facilities_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface CachedFacilities {
  data: HotelFacility[];
  timestamp: number;
}

interface UseFacilitiesResult {
  facilities: HotelFacility[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Get popular facilities that are commonly used for filtering
 */
export function getPopularFacilities(facilities: HotelFacility[]): HotelFacility[] {
  const popularCodes = [
    'WIFI', 'PARKING', 'POOL', 'GYM', 'SPA', 
    'RESTAURANT', 'BAR', 'ROOM_SERVICE', 'AC', 
    'BEACH', 'KIDS_CLUB', 'BUSINESS_CENTER'
  ];
  
  return facilities.filter(f => 
    popularCodes.includes(f.code.toUpperCase()) ||
    popularCodes.includes(f.code)
  );
}

/**
 * Hook to fetch and cache hotel facilities
 */
export function useFacilities(): UseFacilitiesResult {
  const [facilities, setFacilities] = useState<HotelFacility[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchFacilities = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check localStorage cache first
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedFacilities = JSON.parse(cached);
        const now = Date.now();
        
        // Use cache if still valid
        if (now - parsed.timestamp < CACHE_TTL && parsed.data.length > 0) {
          setFacilities(parsed.data);
          setIsLoading(false);
          return;
        }
      }

      // Fetch from API
      const data = await hotelApi.getFacilities();
      setFacilities(data);

      // Cache the results
      const cacheData: CachedFacilities = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      console.error('[useFacilities] Failed to fetch facilities:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch facilities'));
      
      // Try to use stale cache if available
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CachedFacilities = JSON.parse(cached);
        if (parsed.data.length > 0) {
          setFacilities(parsed.data);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacilities();
  }, [fetchFacilities]);

  return {
    facilities,
    isLoading,
    error,
    refetch: fetchFacilities,
  };
}

export default useFacilities;