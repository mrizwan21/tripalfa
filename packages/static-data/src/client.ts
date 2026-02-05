/**
 * Centralized static data client
 * Provides a unified interface for accessing static data with caching and fallbacks
 */

import {
  Airport,
  Airline,
  Aircraft,
  Currency,
  LoyaltyProgram,
  City,
  Country,
  Nationality,
  HotelChain,
  HotelFacility,
  HotelType,
  Location,
  StaticDataResponse,
  SearchParams,
  StaticDataConfig,
  StaticDataError,
  CacheKey
} from './types';
import { cacheManager, DEFAULT_CACHE_CONFIG } from './cache';
import { generateCacheKey, sanitizeSearchParams, retryWithBackoff, shouldUseFallback } from './utils';
import { getFallbackData } from './fallbacks';

export class StaticDataClient {
  private config: StaticDataConfig;

  constructor(config?: Partial<StaticDataConfig>) {
    this.config = {
      apiBase: config?.apiBase || 'http://localhost:3000',
      cache: { ...DEFAULT_CACHE_CONFIG, ...config?.cache },
      sources: config?.sources || [
        { name: 'local-db', priority: 1, endpoint: 'http://localhost:3000', enabled: true, timeout: 5000 },
        { name: 'wicked-gateway', priority: 2, endpoint: 'http://localhost:8000', enabled: true, timeout: 10000 }
      ],
      fallbackEnabled: config?.fallbackEnabled ?? true
    };
  }

  /**
   * Get airports with caching and fallback
   */
  async getAirports(params?: SearchParams): Promise<StaticDataResponse<Airport>> {
    const cacheKey = generateCacheKey('airports', params);
    const cache = cacheManager.getCache<Airport[]>('airports', this.config.cache);

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        total: cached.data.length,
        cached: true,
        source: cached.source
      };
    }

    try {
      const data = await this.fetchFromSources<Airport[]>('airports', params);
      cache.set(cacheKey, data, 'api');

      return {
        data,
        total: data.length,
        cached: false,
        source: 'api'
      };
    } catch (error) {
      if (this.config.fallbackEnabled && shouldUseFallback(error as Error, 'airports')) {
        const fallbackData = getFallbackData<Airport>('airports');
        cache.set(cacheKey, fallbackData, 'fallback');

        return {
          data: fallbackData,
          total: fallbackData.length,
          cached: false,
          source: 'fallback'
        };
      }
      throw new StaticDataError('Failed to fetch airports', 'client', error as Error);
    }
  }

  /**
   * Get airlines with caching and fallback
   */
  async getAirlines(params?: SearchParams): Promise<StaticDataResponse<Airline>> {
    const cacheKey = generateCacheKey('airlines', params);
    const cache = cacheManager.getCache<Airline[]>('airlines', this.config.cache);

    const cached = cache.get(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        total: cached.data.length,
        cached: true,
        source: cached.source
      };
    }

    try {
      const data = await this.fetchFromSources<Airline[]>('airlines', params);
      cache.set(cacheKey, data, 'api');

      return {
        data,
        total: data.length,
        cached: false,
        source: 'api'
      };
    } catch (error) {
      if (this.config.fallbackEnabled && shouldUseFallback(error as Error, 'airlines')) {
        const fallbackData = getFallbackData<Airline>('airlines');
        cache.set(cacheKey, fallbackData, 'fallback');

        return {
          data: fallbackData,
          total: fallbackData.length,
          cached: false,
          source: 'fallback'
        };
      }
      throw new StaticDataError('Failed to fetch airlines', 'client', error as Error);
    }
  }

  /**
   * Get cities with caching and fallback
   */
  async getCities(params?: SearchParams): Promise<StaticDataResponse<City>> {
    const cacheKey = generateCacheKey('cities', params);
    const cache = cacheManager.getCache<City[]>('cities', this.config.cache);

    const cached = cache.get(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        total: cached.data.length,
        cached: true,
        source: cached.source
      };
    }

    try {
      const data = await this.fetchFromSources<City[]>('cities', params);
      cache.set(cacheKey, data, 'api');

      return {
        data,
        total: data.length,
        cached: false,
        source: 'api'
      };
    } catch (error) {
      if (this.config.fallbackEnabled && shouldUseFallback(error as Error, 'cities')) {
        const fallbackData = getFallbackData<City>('cities');
        cache.set(cacheKey, fallbackData, 'fallback');

        return {
          data: fallbackData,
          total: fallbackData.length,
          cached: false,
          source: 'fallback'
        };
      }
      throw new StaticDataError('Failed to fetch cities', 'client', error as Error);
    }
  }

  /**
   * Get currencies with caching and fallback
   */
  async getCurrencies(params?: SearchParams): Promise<StaticDataResponse<Currency>> {
    const cacheKey = generateCacheKey('currencies', params);
    const cache = cacheManager.getCache<Currency[]>('currencies', this.config.cache);

    const cached = cache.get(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        total: cached.data.length,
        cached: true,
        source: cached.source
      };
    }

    try {
      const data = await this.fetchFromSources<Currency[]>('currencies', params);
      cache.set(cacheKey, data, 'api');

      return {
        data,
        total: data.length,
        cached: false,
        source: 'api'
      };
    } catch (error) {
      if (this.config.fallbackEnabled && shouldUseFallback(error as Error, 'currencies')) {
        const fallbackData = getFallbackData<Currency>('currencies');
        cache.set(cacheKey, fallbackData, 'fallback');

        return {
          data: fallbackData,
          total: fallbackData.length,
          cached: false,
          source: 'fallback'
        };
      }
      throw new StaticDataError('Failed to fetch currencies', 'client', error as Error);
    }
  }

  /**
   * Get hotel chains with caching and fallback
   */
  async getHotelChains(params?: SearchParams): Promise<StaticDataResponse<HotelChain>> {
    const cacheKey = generateCacheKey('hotelChains', params);
    const cache = cacheManager.getCache<HotelChain[]>('hotelChains', this.config.cache);

    const cached = cache.get(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        total: cached.data.length,
        cached: true,
        source: cached.source
      };
    }

    try {
      const data = await this.fetchFromSources<HotelChain[]>('hotelChains', params);
      cache.set(cacheKey, data, 'api');

      return {
        data,
        total: data.length,
        cached: false,
        source: 'api'
      };
    } catch (error) {
      if (this.config.fallbackEnabled && shouldUseFallback(error as Error, 'hotelChains')) {
        const fallbackData = getFallbackData<HotelChain>('hotelChains');
        cache.set(cacheKey, fallbackData, 'fallback');

        return {
          data: fallbackData,
          total: fallbackData.length,
          cached: false,
          source: 'fallback'
        };
      }
      throw new StaticDataError('Failed to fetch hotel chains', 'client', error as Error);
    }
  }

  /**
   * Get hotel facilities with caching and fallback
   */
  async getHotelFacilities(params?: SearchParams): Promise<StaticDataResponse<HotelFacility>> {
    const cacheKey = generateCacheKey('hotelFacilities', params);
    const cache = cacheManager.getCache<HotelFacility[]>('hotelFacilities', this.config.cache);

    const cached = cache.get(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        total: cached.data.length,
        cached: true,
        source: cached.source
      };
    }

    try {
      const data = await this.fetchFromSources<HotelFacility[]>('hotelFacilities', params);
      cache.set(cacheKey, data, 'api');

      return {
        data,
        total: data.length,
        cached: false,
        source: 'api'
      };
    } catch (error) {
      if (this.config.fallbackEnabled && shouldUseFallback(error as Error, 'hotelFacilities')) {
        const fallbackData = getFallbackData<HotelFacility>('hotelFacilities');
        cache.set(cacheKey, fallbackData, 'fallback');

        return {
          data: fallbackData,
          total: fallbackData.length,
          cached: false,
          source: 'fallback'
        };
      }
      throw new StaticDataError('Failed to fetch hotel facilities', 'client', error as Error);
    }
  }

  /**
   * Get hotel types with caching and fallback
   */
  async getHotelTypes(params?: SearchParams): Promise<StaticDataResponse<HotelType>> {
    const cacheKey = generateCacheKey('hotelTypes', params);
    const cache = cacheManager.getCache<HotelType[]>('hotelTypes', this.config.cache);

    const cached = cache.get(cacheKey);
    if (cached) {
      return {
        data: cached.data,
        total: cached.data.length,
        cached: true,
        source: cached.source
      };
    }

    try {
      const data = await this.fetchFromSources<HotelType[]>('hotelTypes', params);
      cache.set(cacheKey, data, 'api');

      return {
        data,
        total: data.length,
        cached: false,
        source: 'api'
      };
    } catch (error) {
      if (this.config.fallbackEnabled && shouldUseFallback(error as Error, 'hotelTypes')) {
        const fallbackData = getFallbackData<HotelType>('hotelTypes');
        cache.set(cacheKey, fallbackData, 'fallback');

        return {
          data: fallbackData,
          total: fallbackData.length,
          cached: false,
          source: 'fallback'
        };
      }
      throw new StaticDataError('Failed to fetch hotel types', 'client', error as Error);
    }
  }

  private suggestionCache: Map<string, { data: Location[]; timestamp: number }> = new Map();
  private readonly SUGGESTION_CACHE_TTL = 300000; // 5 minutes

  /**
   * Get locations (airports + cities + maybe hotels) for autocomplete
   */
  async getLocations(query?: string, type: 'flight' | 'hotel' = 'hotel'): Promise<Location[]> {
    if (!query || query.length < 2) return [];

    const normalizedQuery = query.toLowerCase().trim();
    const cacheKey = `${type}:${normalizedQuery}`;

    // 0. Check in-memory suggestion cache
    const cached = this.suggestionCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < this.SUGGESTION_CACHE_TTL)) {
      return cached.data;
    }

    const params = { q: query, type };

    try {
      // 1. Try unified suggestions endpoint from sources with a 2s timeout
      // No retries for suggestions to minimize latency
      const response = await this.fetchFromSources<any[]>('static/suggestions', params as any, 2000, 0);

      if (Array.isArray(response) && response.length > 0) {
        const locations = response.map(item => ({
          id: item.id || item.code,
          name: item.title,
          country: item.country,
          country_code: item.countryCode,
          type: item.type === 'HOTEL' ? 'city' : (item.type === 'AIRPORT' ? 'airport' : 'city'),
          iata_code: item.type === 'AIRPORT' ? item.code : undefined,
          latitude: item.latitude,
          longitude: item.longitude,
          subtitle: item.subtitle,
          icon: item.icon
        })) as any[];

        // Cache the result
        this.suggestionCache.set(cacheKey, { data: locations, timestamp: Date.now() });
        return locations;
      }

      // If empty but succeeded, maybe no results in DB, try local filter as fallback
      const fallbackLocations = getFallbackData<Location>('locations');
      return fallbackLocations
        .filter(l =>
          l.name.toLowerCase().includes(normalizedQuery) ||
          (l.iata_code && l.iata_code.toLowerCase().includes(normalizedQuery))
        )
        .slice(0, 20);

    } catch (error) {
      console.warn('[StaticDataClient] Remote suggestions failed, using local fallback:', error);

      // Fallback to static locations with local filtering
      const fallbackLocations = getFallbackData<Location>('locations');
      return fallbackLocations
        .filter(l =>
          l.name.toLowerCase().includes(normalizedQuery) ||
          (l.iata_code && l.iata_code.toLowerCase().includes(normalizedQuery))
        )
        .slice(0, 20);
    }
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    cacheManager.clearAll();
    this.suggestionCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): Record<string, { size: number; maxSize: number }> {
    const stats = cacheManager.getStats();
    (stats as any).suggestions = { size: this.suggestionCache.size, maxSize: 1000 }; // Arbitrary max for stats
    return stats;
  }

  /**
   * Fetch data from multiple sources with priority
   */
  private async fetchFromSources<T>(
    endpoint: string,
    params?: SearchParams,
    timeoutOverride?: number,
    retryOverride?: number
  ): Promise<T> {
    const sanitizedParams = sanitizeSearchParams(params || {});
    const sources = this.config.sources
      .filter(source => source.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const source of sources) {
      try {
        if (!source.endpoint) continue;
        const url = new URL(`${source.endpoint.replace(/\/$/, '')}/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`);
        const timeout = timeoutOverride || source.timeout;
        const retries = retryOverride !== undefined ? retryOverride : (endpoint.includes('suggestions') ? 0 : 2);

        // Add query parameters
        Object.entries(sanitizedParams).forEach(([key, value]) => {
          if (value !== undefined) {
            url.searchParams.append(key, String(value));
          }
        });

        const response = await retryWithBackoff(async () => {
          const res = await fetch(url.toString(), {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: AbortSignal.timeout(timeout)
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }

          return res.json();
        }, retries, 1000);

        return (Array.isArray(response) ? response : (response as any).data || (response as any).results || response || []) as T;
      } catch (error) {
        console.warn(`Source ${source.name} failed for ${endpoint}:`, error);
        continue; // Try next source
      }
    }

    throw new Error(`All sources failed for ${endpoint}`);
  }
}

// Default client instance
export const staticDataClient = new StaticDataClient();

// Export convenience functions
export const getAirports = (params?: SearchParams) => staticDataClient.getAirports(params);
export const getAirlines = (params?: SearchParams) => staticDataClient.getAirlines(params);
export const getCities = (params?: SearchParams) => staticDataClient.getCities(params);
export const getCurrencies = (params?: SearchParams) => staticDataClient.getCurrencies(params);
export const getHotelChains = (params?: SearchParams) => staticDataClient.getHotelChains(params);
export const getHotelFacilities = (params?: SearchParams) => staticDataClient.getHotelFacilities(params);
export const getHotelTypes = (params?: SearchParams) => staticDataClient.getHotelTypes(params);
export const getLocations = (query?: string) => staticDataClient.getLocations(query);