/**
 * In-memory cache implementation for static data
 */

import { CacheEntry, CacheConfig } from './types';

export class StaticDataCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  /**
   * Get data from cache
   */
  get(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  /**
   * Set data in cache with automatic cleanup
   */
  set(key: string, data: T, source: string): void {
    // Clean up expired entries
    this.cleanup();

    // If cache is full, remove oldest entry
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      source
    });
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize
    };
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Cache manager for different data types
 */
export class CacheManager {
  private caches = new Map<string, StaticDataCache<any>>();

  /**
   * Get or create cache for a specific data type
   */
  getCache<T>(dataType: string, config: CacheConfig): StaticDataCache<T> {
    if (!this.caches.has(dataType)) {
      this.caches.set(dataType, new StaticDataCache<T>(config));
    }
    return this.caches.get(dataType) as StaticDataCache<T>;
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.caches.forEach(cache => cache.clear());
  }

  /**
   * Get statistics for all caches
   */
  getStats(): Record<string, { size: number; maxSize: number }> {
    const stats: Record<string, { size: number; maxSize: number }> = {};
    this.caches.forEach((cache, dataType) => {
      stats[dataType] = cache.getStats();
    });
    return stats;
  }
}

// Default cache configuration
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 30 * 60 * 1000, // 30 minutes
  maxSize: 1000
};

// Global cache manager instance
export const cacheManager = new CacheManager();