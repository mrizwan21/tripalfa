/**
 * Utility functions for the static data system
 */

import { Location, SearchParams } from './types';

/**
 * Generate cache key for a specific data type and parameters
 */
export function generateCacheKey(dataType: string, params?: SearchParams): string {
  const baseKey = `static-data:${dataType}`;
  
  if (!params || Object.keys(params).length === 0) {
    return baseKey;
  }

  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key as keyof SearchParams]}`)
    .join('|');

  return `${baseKey}:${sortedParams}`;
}

/**
 * Debounce function to limit API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Filter locations by search query
 */
export function filterLocations(locations: Location[], query: string): Location[] {
  if (!query || query.length < 2) {
    return locations.slice(0, 20); // Return first 20 if no query
  }

  const lowerQuery = query.toLowerCase();
  
  return locations
    .filter(location => {
      const nameMatch = location.name.toLowerCase().includes(lowerQuery);
      const countryMatch = location.country?.toLowerCase().includes(lowerQuery);
      const codeMatch = location.iata_code?.toLowerCase().includes(lowerQuery);
      
      return nameMatch || countryMatch || codeMatch;
    })
    .slice(0, 20); // Limit results
}

/**
 * Sort locations by type (airports first, then cities)
 */
export function sortLocations(locations: Location[]): Location[] {
  return locations.sort((a, b) => {
    if (a.type === 'airport' && b.type === 'city') return -1;
    if (a.type === 'city' && b.type === 'airport') return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Validate IATA code format
 */
export function isValidIataCode(code: string): boolean {
  return /^[A-Z0-9]{3}$/.test(code);
}

/**
 * Format currency display
 */
export function formatCurrency(code: string, amount: number): string {
  const currencySymbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'د.إ',
    SGD: 'S$',
    JPY: '¥'
  };

  const symbol = currencySymbols[code] || code;
  return `${symbol}${amount.toLocaleString()}`;
}

/**
 * Get country name from country code
 */
export function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    US: 'United States',
    GB: 'United Kingdom',
    AE: 'United Arab Emirates',
    SG: 'Singapore',
    JP: 'Japan',
    DE: 'Germany',
    FR: 'France',
    ES: 'Spain',
    IT: 'Italy',
    AU: 'Australia'
  };

  return countryNames[countryCode] || countryCode;
}

/**
 * Check if data is stale based on last update time
 */
export function isDataStale(lastUpdated: string, maxAgeHours: number = 24): boolean {
  const lastUpdate = new Date(lastUpdated);
  const now = new Date();
  const hoursDiff = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
  
  return hoursDiff > maxAgeHours;
}

/**
 * Merge and deduplicate arrays of objects by a specific key
 */
export function mergeUnique<T>(arrays: T[][], key: keyof T): T[] {
  const seen = new Set();
  const result: T[] = [];

  for (const array of arrays) {
    for (const item of array) {
      const keyValue = item[key];
      if (!seen.has(keyValue)) {
        seen.add(keyValue);
        result.push(item);
      }
    }
  }

  return result;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i === maxRetries) {
        throw lastError;
      }

      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Validate and sanitize search parameters
 */
export function sanitizeSearchParams(params: SearchParams): SearchParams {
  const sanitized: SearchParams = {};

  if (params.query && typeof params.query === 'string') {
    sanitized.query = params.query.trim().slice(0, 100); // Limit query length
  }

  if (params.limit && typeof params.limit === 'number' && params.limit > 0) {
    sanitized.limit = Math.min(params.limit, 1000); // Cap limit at 1000
  }

  if (params.offset && typeof params.offset === 'number' && params.offset >= 0) {
    sanitized.offset = params.offset;
  }

  if (params.type && typeof params.type === 'string') {
    sanitized.type = params.type.trim();
  }

  return sanitized;
}

/**
 * Create a deep clone of an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if two objects are deeply equal
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

/**
 * Determine if fallback data should be used based on error type and configuration
 */
export function shouldUseFallback(error: any, dataType: string): boolean {
  // Don't use fallback for authentication errors
  if (error?.status === 401 || error?.status === 403) {
    return false;
  }

  // Don't use fallback for client errors (4xx)
  if (error?.status >= 400 && error?.status < 500) {
    return false;
  }

  // Use fallback for network errors, timeouts, and server errors (5xx)
  return true;
}
