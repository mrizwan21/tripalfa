/**
 * cache.ts
 * --------
 * Simple in-memory cache for API responses with optional JSON persistence.
 */

import * as fs from 'fs';
import * as path from 'path';

interface CacheEntry<T> {
  value: T;
  expires: number;
}

export class ApiCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private cacheDir: string | null = null;
  private ttlMs: number; // time to live in milliseconds

  constructor(ttlSeconds = 3600) {
    this.ttlMs = ttlSeconds * 1000;
    // Optional file-based cache directory in /tmp
    const tmpCacheDir = process.env.API_CACHE_DIR;
    if (tmpCacheDir) {
      try {
        if (!fs.existsSync(tmpCacheDir)) {
          fs.mkdirSync(tmpCacheDir, { recursive: true });
        }
        this.cacheDir = tmpCacheDir;
      } catch {
        // Fall back to in-memory only if directory creation fails
      }
    }
  }

  private getCacheKey(endpoint: string, params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) {
      return `cache:${endpoint}`;
    }
    const paramStr = JSON.stringify(params);
    return `cache:${endpoint}:${paramStr}`;
  }

  private getFileCachePath(key: string): string {
    const hash = Buffer.from(key).toString('base64').replace(/\//g, '_').replace(/\+/g, '-');
    return path.join(this.cacheDir!, `${hash}.json`);
  }

  get<T>(endpoint: string, params?: Record<string, unknown>): T | null {
    const key = this.getCacheKey(endpoint, params);
    const now = Date.now();

    // Check memory cache first
    const memEntry = this.cache.get(key);
    if (memEntry && memEntry.expires > now) {
      return memEntry.value as T;
    }
    this.cache.delete(key);

    // Check file cache if available
    if (this.cacheDir) {
      try {
        const filePath = this.getFileCachePath(key);
        if (fs.existsSync(filePath)) {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          if (data.expires > now) {
            // Restore to memory cache
            this.cache.set(key, data);
            return data.value as T;
          }
          // Expired file cache
          fs.unlinkSync(filePath);
        }
      } catch {
        // Ignore file cache read errors
      }
    }

    return null;
  }

  set<T>(endpoint: string, value: T, params?: Record<string, unknown>): void {
    const key = this.getCacheKey(endpoint, params);
    const entry: CacheEntry<T> = {
      value,
      expires: Date.now() + this.ttlMs,
    };

    this.cache.set(key, entry);

    // Persist to file cache if available
    if (this.cacheDir) {
      try {
        const filePath = this.getFileCachePath(key);
        fs.writeFileSync(filePath, JSON.stringify(entry), 'utf-8');
      } catch {
        // Ignore file cache write errors (in-memory cache is sufficient)
      }
    }
  }

  clear(): void {
    this.cache.clear();
    // Note: file cache is not cleared to preserve across runs
  }

  getStats(): { memorySize: number; ttlSeconds: number } {
    return {
      memorySize: this.cache.size,
      ttlSeconds: this.ttlMs / 1000,
    };
  }
}

export const cache = new ApiCache();
