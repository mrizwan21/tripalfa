/**
 * Redis Cache Service for LITEAPI Data
 *
 * Implements caching strategy for real-time hotel data:
 * - Hotel search results (TTL: 15 min)
 * - Room rates (TTL: 30 min)
 * - Prebook sessions (TTL: 60 min)
 * - Static data (TTL: 24 hours)
 */

import { createClient, RedisClientType } from "redis";

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  HOTEL_SEARCH: 900, // 15 minutes
  HOTEL_RATES: 1800, // 30 minutes
  PREBOOK_SESSION: 3600, // 60 minutes
  RATE_LOCK: 600, // 10 minutes
  GUEST_DATA: 300, // 5 minutes
  MEDIUM: 3600, // 1 hour (reviews)
  LONG: 86400, // 24 hours (static data like languages)
} as const;

// Cache key generators
export const CacheKeys = {
  hotelSearch: (params: Record<string, any>) => {
    const hash = Buffer.from(JSON.stringify(params)).toString("base64");
    return `hotel:search:${hash}`;
  },
  hotelRates: (hotelId: string, checkin: string, checkout: string) =>
    `hotel:rates:${hotelId}:${checkin}:${checkout}`,
  prebookSession: (sessionId: string) => `prebook:${sessionId}`,
  rateLock: (offerId: string) => `rate:lock:${offerId}`,
  guestData: (guestId: string) => `guest:${guestId}`,
};

// Redis client singleton
let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error("[Redis] Max reconnection attempts reached");
            return new Error("Max reconnection attempts reached");
          }
          console.log(`[Redis] Reconnecting... attempt ${retries}`);
          return Math.min(retries * 100, 3000);
        },
      },
    });

    redisClient.on("error", (err) => {
      console.error("[Redis] Client error:", err);
    });

    redisClient.on("connect", () => {
      console.log("[Redis] Connected to Redis");
    });

    await redisClient.connect();
  }

  return redisClient;
}

/**
 * Cache Service
 * Provides high-level caching operations for LITEAPI data
 */
export const CacheService = {
  /**
   * Get cached data by key
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await getRedisClient();
      const data = await client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`[Cache] Error getting key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set cache with TTL
   */
  async set(key: string, data: any, ttlSeconds: number): Promise<boolean> {
    try {
      const client = await getRedisClient();
      await client.setEx(key, ttlSeconds, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`[Cache] Error setting key ${key}:`, error);
      return false;
    }
  },

  /**
   * Delete cache by key
   */
  async delete(key: string): Promise<boolean> {
    try {
      const client = await getRedisClient();
      await client.del(key);
      return true;
    } catch (error) {
      console.error(`[Cache] Error deleting key ${key}:`, error);
      return false;
    }
  },

  /**
   * Delete all keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      const client = await getRedisClient();
      const keys = await client.keys(pattern);
      if (keys.length === 0) return 0;
      await client.del(keys);
      return keys.length;
    } catch (error) {
      console.error(`[Cache] Error deleting pattern ${pattern}:`, error);
      return 0;
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const client = await getRedisClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`[Cache] Error checking key ${key}:`, error);
      return false;
    }
  },

  /**
   * Get or set pattern - fetches from cache or executes fetcher and caches result
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number,
  ): Promise<T> {
    // Try to get from cache first
    const cached = await this.get(key);
    if (cached !== null) {
      console.log(`[Cache] HIT: ${key}`);
      return cached;
    }

    // Fetch fresh data
    console.log(`[Cache] MISS: ${key}`);
    const data = await fetcher();

    // Cache the result (don't await, fire and forget)
    this.set(key, data, ttlSeconds).catch((err) =>
      console.error(`[Cache] Failed to cache ${key}:`, err),
    );

    return data;
  },

  /**
   * Lock a rate for booking session
   */
  async lockRate(offerId: string, userId: string): Promise<boolean> {
    try {
      const client = await getRedisClient();
      const key = CacheKeys.rateLock(offerId);
      const result = await client.setNX(
        key,
        JSON.stringify({ userId, lockedAt: new Date() }),
      );
      if (result) {
        await client.expire(key, CACHE_TTL.RATE_LOCK);
      }
      return result;
    } catch (error) {
      console.error(`[Cache] Error locking rate ${offerId}:`, error);
      return false;
    }
  },

  /**
   * Unlock a rate
   */
  async unlockRate(offerId: string): Promise<boolean> {
    return this.delete(CacheKeys.rateLock(offerId));
  },

  /**
   * Check if rate is locked
   */
  async isRateLocked(
    offerId: string,
  ): Promise<{ locked: boolean; userId?: string }> {
    try {
      const client = await getRedisClient();
      const key = CacheKeys.rateLock(offerId);
      const data = await client.get(key);
      if (!data) return { locked: false };
      const parsed = JSON.parse(data);
      return { locked: true, userId: parsed.userId };
    } catch (error) {
      console.error(`[Cache] Error checking rate lock ${offerId}:`, error);
      return { locked: false };
    }
  },
};

// Graceful shutdown
async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log("[Redis] Connection closed");
  }
}

export default CacheService;
