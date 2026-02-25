/**
 * useLiteApiHotels Hook
 * 
 * React hook for LiteAPI hotel search with built-in state management,
 * caching, Redis hybrid approach, and error handling.
 * 
 * Architecture matches Duffel flights pattern:
 * - Frontend -> API Manager -> Booking Service -> LiteAPI
 *                                     ↓
 *                               Redis Cache
 *                                     ↓
 *                               Neon DB
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  searchHotels, 
  getHotelRates, 
  createPrebook, 
  createHotelBooking,
  type HotelSearchParams,
  type HotelRatesParams,
  type PrebookParams,
  type BookParams,
  type HotelSearchResult 
} from '../services/liteApiManager';

// ============================================================================
// TYPES
// ============================================================================

export interface UseLiteApiHotelsOptions {
  /** Auto-search on mount with initial params */
  initialParams?: HotelSearchParams;
  /** Cache results for same search params */
  enableCache?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Callback on successful search */
  onSuccess?: (results: HotelSearchResult[]) => void;
  /** Callback on search error */
  onError?: (error: string) => void;
}

export interface UseLiteApiHotelsReturn {
  /** Search results */
  hotels: HotelSearchResult[];
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Search function */
  search: (params: HotelSearchParams) => Promise<void>;
  /** Reset state */
  reset: () => void;
  /** Current search params */
  searchParams: HotelSearchParams | null;
  /** Whether results are from cache */
  isCached: boolean;
  /** Total results count */
  total: number;
  /** Refetch last search */
  refetch: () => Promise<void>;
}

export interface UseLiteApiHotelRatesOptions {
  /** Auto-fetch rates on mount */
  initialParams?: HotelRatesParams;
  /** Enable caching */
  enableCache?: boolean;
  /** Cache TTL in ms (default 30 min for rates) */
  cacheTTL?: number;
  /** Callback on success */
  onSuccess?: (rates: any[]) => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

export interface UseLiteApiHotelRatesReturn {
  /** Room rates */
  rates: any[];
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Fetch rates function */
  fetchRates: (params: HotelRatesParams) => Promise<void>;
  /** Reset state */
  reset: () => void;
  /** Current params */
  params: HotelRatesParams | null;
  /** Whether from cache */
  isCached: boolean;
  /** Refetch */
  refetch: () => Promise<void>;
}

export interface UseLiteApiBookingOptions {
  /** Callback on prebook success */
  onPrebookSuccess?: (result: { transactionId: string; expiresAt?: string }) => void;
  /** Callback on prebook error */
  onPrebookError?: (error: string) => void;
  /** Callback on booking success */
  onBookingSuccess?: (result: { confirmationId: string; bookingRef?: string }) => void;
  /** Callback on booking error */
  onBookingError?: (error: string) => void;
}

export interface UseLiteApiBookingReturn {
  /** Prebook loading */
  prebookLoading: boolean;
  /** Prebook error */
  prebookError: string | null;
  /** Current prebook transaction */
  prebookData: { transactionId: string; expiresAt?: string } | null;
  /** Create prebook */
  createPrebook: (params: PrebookParams) => Promise<void>;
  /** Booking loading */
  bookingLoading: boolean;
  /** Booking error */
  bookingError: string | null;
  /** Current booking */
  booking: { confirmationId: string; bookingRef?: string } | null;
  /** Create booking */
  book: (params: BookParams) => Promise<void>;
  /** Reset all state */
  reset: () => void;
}

// ============================================================================
// CACHE IMPLEMENTATION
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  params: string;
}

const hotelSearchCache = new Map<string, CacheEntry<HotelSearchResult[]>>();
const hotelRatesCache = new Map<string, CacheEntry<any[]>>();

function getSearchCacheKey(params: HotelSearchParams): string {
  return JSON.stringify({
    location: params.location,
    checkin: params.checkin,
    checkout: params.checkout,
    adults: params.adults,
    children: params.children,
    rooms: params.rooms,
    countryCode: params.countryCode,
  });
}

function getRatesCacheKey(params: HotelRatesParams): string {
  return JSON.stringify({
    hotelIds: params.hotelIds,
    cityName: params.cityName,
    checkin: params.checkin,
    checkout: params.checkout,
    occupancies: params.occupancies,
  });
}

function getFromCache<T>(cache: Map<string, CacheEntry<T>>, key: string, ttl: number): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > ttl) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCache<T>(cache: Map<string, CacheEntry<T>>, key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    params: key,
  });
}

// ============================================================================
// HOTEL SEARCH HOOK
// ============================================================================

export function useLiteApiHotels(options: UseLiteApiHotelsOptions = {}): UseLiteApiHotelsReturn {
  const {
    initialParams,
    enableCache = true,
    cacheTTL = 15 * 60 * 1000, // 15 min for hotel search
    onSuccess,
    onError,
  } = options;

  // State
  const [hotels, setHotels] = useState<HotelSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<HotelSearchParams | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [total, setTotal] = useState(0);

  // Refs
  const lastSearchParams = useRef<HotelSearchParams | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  // Search function
  const search = useCallback(async (params: HotelSearchParams) => {
    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    // Check cache (Redis-backed via API)
    const cacheKey = getSearchCacheKey(params);
    if (enableCache) {
      const cachedResults = getFromCache(hotelSearchCache, cacheKey, cacheTTL);
      if (cachedResults) {
        console.log('[useLiteApiHotels] Using cached results');
        setHotels(cachedResults);
        setSearchParams(params);
        lastSearchParams.current = params;
        setIsCached(true);
        setTotal(cachedResults.length);
        onSuccess?.(cachedResults);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setIsCached(false);
    setSearchParams(params);
    lastSearchParams.current = params;

    try {
      const result = await searchHotels(params);

      if (!result.hotels) {
        throw new Error('Search failed');
      }

      setHotels(result.hotels);
      setTotal(result.hotels.length);
      setIsCached(result.cached || false);

      // Cache results
      if (enableCache && result.hotels.length > 0) {
        setCache(hotelSearchCache, cacheKey, result.hotels);
      }

      onSuccess?.(result.hotels);
    } catch (err: any) {
      // Ignore abort errors
      if (err.name === 'AbortError') return;

      const errorMessage = err?.message || 'Failed to search hotels';
      console.error('[useLiteApiHotels] Search error:', errorMessage);
      setError(errorMessage);
      setHotels([]);
      setTotal(0);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [enableCache, cacheTTL, onSuccess, onError]);

  // Reset function
  const reset = useCallback(() => {
    setHotels([]);
    setLoading(false);
    setError(null);
    setSearchParams(null);
    setIsCached(false);
    setTotal(0);
    lastSearchParams.current = null;
  }, []);

  // Refetch function
  const refetch = useCallback(async () => {
    if (lastSearchParams.current) {
      const cacheKey = getSearchCacheKey(lastSearchParams.current);
      hotelSearchCache.delete(cacheKey);
      await search(lastSearchParams.current);
    }
  }, [search]);

  // Auto-search on mount if initial params provided
  useEffect(() => {
    if (initialParams && !hotels.length && !loading) {
      search(initialParams);
    }
  }, []);

  return {
    hotels,
    loading,
    error,
    search,
    reset,
    searchParams,
    isCached,
    total,
    refetch,
  };
}

// ============================================================================
// HOTEL RATES HOOK
// ============================================================================

export function useLiteApiHotelRates(options: UseLiteApiHotelRatesOptions = {}): UseLiteApiHotelRatesReturn {
  const {
    initialParams,
    enableCache = true,
    cacheTTL = 30 * 60 * 1000, // 30 min for rates
    onSuccess,
    onError,
  } = options;

  const [rates, setRates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<HotelRatesParams | null>(null);
  const [isCached, setIsCached] = useState(false);

  const lastParams = useRef<HotelRatesParams | null>(null);
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  const fetchRates = useCallback(async (newParams: HotelRatesParams) => {
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    const cacheKey = getRatesCacheKey(newParams);
    if (enableCache) {
      const cached = getFromCache(hotelRatesCache, cacheKey, cacheTTL);
      if (cached) {
        console.log('[useLiteApiHotelRates] Using cached rates');
        setRates(cached);
        setParams(newParams);
        lastParams.current = newParams;
        setIsCached(true);
        onSuccess?.(cached);
        return;
      }
    }

    setLoading(true);
    setError(null);
    setIsCached(false);
    setParams(newParams);
    lastParams.current = newParams;

    try {
      const result = await getHotelRates(newParams);
      const ratesData = result.hotels || [];
      
      setRates(ratesData);
      setIsCached(result.cached || false);

      if (enableCache && ratesData.length > 0) {
        setCache(hotelRatesCache, cacheKey, ratesData);
      }

      onSuccess?.(ratesData);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      
      const errorMessage = err?.message || 'Failed to fetch hotel rates';
      console.error('[useLiteApiHotelRates] Error:', errorMessage);
      setError(errorMessage);
      setRates([]);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [enableCache, cacheTTL, onSuccess, onError]);

  const reset = useCallback(() => {
    setRates([]);
    setLoading(false);
    setError(null);
    setParams(null);
    setIsCached(false);
    lastParams.current = null;
  }, []);

  const refetch = useCallback(async () => {
    if (lastParams.current) {
      const cacheKey = getRatesCacheKey(lastParams.current);
      hotelRatesCache.delete(cacheKey);
      await fetchRates(lastParams.current);
    }
  }, [fetchRates]);

  useEffect(() => {
    if (initialParams && !rates.length && !loading) {
      fetchRates(initialParams);
    }
  }, []);

  return {
    rates,
    loading,
    error,
    fetchRates,
    reset,
    params,
    isCached,
    refetch,
  };
}

// ============================================================================
// BOOKING HOOK (Prebook + Book)
// ============================================================================

export function useLiteApiBooking(options: UseLiteApiBookingOptions = {}): UseLiteApiBookingReturn {
  const {
    onPrebookSuccess,
    onPrebookError,
    onBookingSuccess,
    onBookingError,
  } = options;

  // Prebook state
  const [prebookLoading, setPrebookLoading] = useState(false);
  const [prebookError, setPrebookError] = useState<string | null>(null);
  const [prebook, setPrebook] = useState<{ transactionId: string; expiresAt?: string } | null>(null);

  // Booking state
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [booking, setBooking] = useState<{ confirmationId: string; bookingRef?: string } | null>(null);

  // Create prebook
  const createPrebookSession = useCallback(async (params: PrebookParams) => {
    setPrebookLoading(true);
    setPrebookError(null);

    try {
      const result = await createPrebook(params);
      setPrebook(result);
      onPrebookSuccess?.(result);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to create prebook';
      setPrebookError(errorMessage);
      onPrebookError?.(errorMessage);
    } finally {
      setPrebookLoading(false);
    }
  }, [onPrebookSuccess, onPrebookError]);

  // Create booking
  const createBooking = useCallback(async (params: BookParams) => {
    setBookingLoading(true);
    setBookingError(null);

    try {
      const result = await createHotelBooking(params);
      setBooking(result);
      onBookingSuccess?.(result);
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to create booking';
      setBookingError(errorMessage);
      onBookingError?.(errorMessage);
    } finally {
      setBookingLoading(false);
    }
  }, [onBookingSuccess, onBookingError]);

  // Reset all state
  const reset = useCallback(() => {
    setPrebookLoading(false);
    setPrebookError(null);
    setPrebook(null);
    setBookingLoading(false);
    setBookingError(null);
    setBooking(null);
  }, []);

  return {
    prebookLoading,
    prebookError,
    prebookData: prebook,
    createPrebook: createPrebookSession,
    bookingLoading,
    bookingError,
    booking,
    book: createBooking,
    reset,
  };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for hotel search with rates
 */
export function useHotelSearch() {
  return useLiteApiHotels();
}

/**
 * Hook for hotel room rates
 */
export function useHotelRates() {
  return useLiteApiHotelRates();
}

/**
 * Hook for complete hotel booking flow
 */
export function useHotelBooking() {
  return useLiteApiBooking();
}

/**
 * Hook for hotel price tracking
 */
export function useHotelPriceTracker(
  location: string,
  checkin: string,
  checkout: string
) {
  const [lowestPrice, setLowestPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<Array<{ price: number; date: string }>>([]);
  
  const { search, loading, hotels } = useLiteApiHotels({
    onSuccess: (results) => {
      if (results.length > 0) {
        const prices = results.map(h => h.price?.amount || 0);
        const minPrice = Math.min(...prices.filter(p => p > 0));
        setLowestPrice(minPrice);
        setPriceHistory(prev => [
          ...prev,
          { price: minPrice, date: new Date().toISOString() }
        ]);
      }
    },
  });

  useEffect(() => {
    if (location && checkin && checkout) {
      search({
        location,
        checkin,
        checkout,
        adults: 2,
        rooms: 1,
      });
    }
  }, [location, checkin, checkout, search]);

  return {
    lowestPrice,
    priceHistory,
    loading,
    hotels,
    refresh: () => search({
      location,
      checkin,
      checkout,
      adults: 2,
      rooms: 1,
    }),
  };
}

export default useLiteApiHotels;
