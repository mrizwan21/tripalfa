/**
 * useDuffelFlights Hook
 *
 * React hook for Duffel flight search with built-in state management,
 * caching, and error handling.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import duffelFlightService, {
  SearchFlightsParams,
  SearchFlightsResult,
} from "../services/duffelFlightService";
import type { FlightSearchResult, CabinClass } from "../types/duffel";

// ============================================================================
// TYPES
// ============================================================================

export interface UseDuffelFlightsOptions {
  /** Auto-search on mount with initial params */
  initialParams?: SearchFlightsParams;
  /** Cache results for same search params */
  enableCache?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
  /** Callback on successful search */
  onSuccess?: (results: FlightSearchResult[]) => void;
  /** Callback on search error */
  onError?: (error: string) => void;
}

export interface UseDuffelFlightsReturn {
  /** Search results */
  flights: FlightSearchResult[];
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Search function */
  search: (params: SearchFlightsParams) => Promise<void>;
  /** Reset state */
  reset: () => void;
  /** Current search params */
  searchParams: SearchFlightsParams | null;
  /** Whether results are from cache */
  isCached: boolean;
  /** Total results count */
  total: number;
  /** Refetch last search */
  refetch: () => Promise<void>;
}

// ============================================================================
// CACHE IMPLEMENTATION
// ============================================================================

interface CacheEntry {
  results: FlightSearchResult[];
  timestamp: number;
  params: string;
}

const flightCache = new Map<string, CacheEntry>();

function getCacheKey(params: SearchFlightsParams): string {
  return JSON.stringify({
    origin: params.origin,
    destination: params.destination,
    departureDate: params.departureDate,
    returnDate: params.returnDate,
    adults: params.adults,
    children: params.children,
    infants: params.infants,
    cabinClass: params.cabinClass,
    tripType: params.tripType,
    legs: params.legs,
  });
}

function getFromCache(key: string, ttl: number): FlightSearchResult[] | null {
  const entry = flightCache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > ttl) {
    flightCache.delete(key);
    return null;
  }

  return entry.results;
}

function setCache(key: string, results: FlightSearchResult[]): void {
  flightCache.set(key, {
    results,
    timestamp: Date.now(),
    params: key,
  });
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useDuffelFlights(
  options: UseDuffelFlightsOptions = {},
): UseDuffelFlightsReturn {
  const {
    initialParams,
    enableCache = true,
    cacheTTL = 5 * 60 * 1000, // 5 minutes default
    onSuccess,
    onError,
  } = options;

  // State
  const [flights, setFlights] = useState<FlightSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<SearchFlightsParams | null>(
    null,
  );
  const [isCached, setIsCached] = useState(false);
  const [total, setTotal] = useState(0);

  // Refs
  const lastSearchParams = useRef<SearchFlightsParams | null>(null);
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
  const search = useCallback(
    async (params: SearchFlightsParams) => {
      // Cancel previous request
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      // Check cache
      const cacheKey = getCacheKey(params);
      if (enableCache) {
        const cachedResults = getFromCache(cacheKey, cacheTTL);
        if (cachedResults) {
          console.log("[useDuffelFlights] Using cached results");
          setFlights(cachedResults);
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
        const result: SearchFlightsResult =
          await duffelFlightService.searchFlights(params);

        if (!result.success) {
          throw new Error((result as any).error || "Search failed");
        }

        setFlights(result.offers);
        setTotal(result.total);
        setIsCached(result.cached);

        // Cache results
        if (enableCache && result.offers.length > 0) {
          setCache(cacheKey, result.offers);
        }

        onSuccess?.(result.offers);
      } catch (err: any) {
        // Ignore abort errors
        if (err.name === "AbortError") return;

        const errorMessage = err?.message || "Failed to search flights";
        console.error("[useDuffelFlights] Search error:", errorMessage);
        setError(errorMessage);
        setFlights([]);
        setTotal(0);
        onError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [enableCache, cacheTTL, onSuccess, onError],
  );

  // Reset function
  const reset = useCallback(() => {
    setFlights([]);
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
      // Invalidate cache for this search
      const cacheKey = getCacheKey(lastSearchParams.current);
      flightCache.delete(cacheKey);

      await search(lastSearchParams.current);
    }
  }, [search]);

  // Auto-search on mount if initial params provided
  useEffect(() => {
    if (initialParams && !flights.length && !loading) {
      search(initialParams);
    }
  }, []);

  return {
    flights,
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
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for one-way flight search
 */
export function useOneWayFlightSearch() {
  return useDuffelFlights();
}

/**
 * Hook for round-trip flight search
 */
export function useRoundTripFlightSearch() {
  return useDuffelFlights();
}

/**
 * Hook for multi-city flight search
 */
export function useMultiCityFlightSearch() {
  return useDuffelFlights();
}

/**
 * Hook for flight price tracking
 * Returns the lowest price for a route
 */
export function useFlightPriceTracker(
  origin: string,
  destination: string,
  departureDate: string,
  cabinClass: CabinClass = "economy",
) {
  const [lowestPrice, setLowestPrice] = useState<number | null>(null);
  const [priceHistory, setPriceHistory] = useState<
    Array<{ price: number; date: string }>
  >([]);

  const { search, loading, flights } = useDuffelFlights({
    onSuccess: (results) => {
      if (results.length > 0) {
        const prices = results.map((f) => f.amount);
        const minPrice = Math.min(...prices);
        setLowestPrice(minPrice);
        setPriceHistory((prev) => [
          ...prev,
          { price: minPrice, date: new Date().toISOString() },
        ]);
      }
    },
  });

  useEffect(() => {
    if (origin && destination && departureDate) {
      search({
        origin,
        destination,
        departureDate,
        cabinClass,
        adults: 1,
        tripType: "oneWay",
      });
    }
  }, [origin, destination, departureDate, cabinClass, search]);

  return {
    lowestPrice,
    priceHistory,
    loading,
    flights,
    refresh: () =>
      search({
        origin,
        destination,
        departureDate,
        cabinClass,
        adults: 1,
        tripType: "oneWay",
      }),
  };
}

export default useDuffelFlights;
