/**
 * Centralized Static Data Management System
 * 
 * This package provides a unified interface for accessing static data across the entire application.
 * It eliminates duplications by centralizing data sources, caching, and fallback mechanisms.
 */

export * from './types';
export * from './client';
export * from './cache';
export * from './fallbacks';
export * from './utils';

// Re-export commonly used types and functions for convenience
export type {
  Airport,
  Airline,
  Aircraft,
  Currency,
  LoyaltyProgram,
  City,
  Country,
  Nationality,
  HotelChain,
  HotelType,
  Location,
  StaticDataResponse,
  SearchParams,
  StaticDataConfig,
  CacheKey,
  CacheEntry,
  CacheConfig,
  DataSourceConfig
} from './types';

// Re-export data types

// Re-export types from data/index
export type {
  Supplier,
  ApiVendor,
  Contract
} from './data/index';

export { StaticDataError } from './types';

export {
  StaticDataCache,
  CacheManager,
  DEFAULT_CACHE_CONFIG,
  cacheManager
} from './cache';

export {
  FALLBACK_AIRPORTS,
  FALLBACK_AIRLINES,
  FALLBACK_CITIES,
  FALLBACK_CURRENCIES,
  FALLBACK_HOTEL_CHAINS,
  FALLBACK_HOTEL_TYPES,
  FALLBACK_LOCATIONS
} from './fallbacks';

export {
  generateCacheKey,
  debounce,
  filterLocations,
  sortLocations,
  isValidIataCode,
  formatCurrency,
  getCountryName,
  isDataStale,
  mergeUnique,
  retryWithBackoff,
  sanitizeSearchParams,
  deepClone,
  deepEqual
} from './utils';

export {
  StaticDataClient,
  staticDataClient,
  getAirports,
  getAirlines,
  getCities,
  getCurrencies,
  getHotelChains,
  getHotelTypes,
  getLocations
} from './client';

// Re-export data functions
export {
  MOCK_SUPPLIERS,
  getMockSuppliers,
  MOCK_VENDORS,
  getMockVendors,
  MOCK_CONTRACTS,
  getMockContracts
} from './data/index';
