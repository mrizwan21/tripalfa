/**
 * Redis Cache Service for Inventory Service
 * Provides caching for hotel searches and static data
 */

import { Redis, RedisOptions } from 'ioredis'; // Changed to named import for better TS support?
// Actually for ioredis v5, `import Redis from 'ioredis'` is usually correct but let's try `import { Redis }`
// if default import causes "namespace" errors.
// Wait, if I use `import { Redis }`, I need to make sure it's exported.
// Let's try `import Redis from 'ioredis'` again but maybe `default` property?
// No, let's try `import { Redis }` as it is often safer.

// Redis configuration
const redisConfig: RedisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '1', 10), // Use DB 1 for inventory
    retryStrategy: (times) => Math.min(times * 100, 3000),
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    family: 4,
};

// Redis client instance
let redisInstance: Redis | null = null;

export function getRedisClient(): Redis {
    if (!redisInstance) {
        redisInstance = new Redis(redisConfig);

        redisInstance.on('connect', () => {
            console.log('[Redis] Connected successfully');
        });

        redisInstance.on('error', (error) => {
            console.error('[Redis] Connection error:', error.message);
        });

        redisInstance.on('ready', () => {
            console.log('[Redis] Ready for operations');
        });
    }
    return redisInstance;
}

// Cache TTL configurations (in seconds)
export const CACHE_TTL = {
    HOTEL_SEARCH: 300,        // 5 minutes - search results
    HOTEL_DETAILS: 3600,      // 1 hour - hotel details
    ROOM_RATES: 60,           // 1 minute - prices change frequently
    STATIC_DATA: 21600,       // 6 hours - chains, amenities, etc.
    POPULAR_DESTINATIONS: 21600, // 6 hours
    AGGREGATIONS: 21600,      // 6 hours - materialized view cache
};

// Cache key prefixes
export const CACHE_PREFIXES = {
    HOTEL_SEARCH: 'hotel:search:',
    HOTEL_DETAILS: 'hotel:details:',
    ROOM_RATES: 'hotel:rates:',
    STATIC: 'hotel:static:',
    POPULAR: 'hotel:popular:',
    AGG: 'hotel:agg:',
};

/**
 * Hotel Cache Service
 * Wraps Redis operations with hotel-specific logic
 */
export class HotelCacheService {
    private redisClient: Redis;

    constructor() {
        this.redisClient = getRedisClient();
    }

    /**
     * Get cached data
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const data = await this.redisClient.get(key);
            if (!data) return null;
            return JSON.parse(data);
        } catch (error) {
            console.error('[HotelCache] Get error:', key, error);
            return null;
        }
    }

    /**
     * Set cached data with TTL
     */
    async set(key: string, data: unknown, ttl: number): Promise<void> {
        try {
            const serialized = JSON.stringify(data);
            await this.redisClient.setex(key, ttl, serialized);
        } catch (error) {
            console.error('[HotelCache] Set error:', key, error);
        }
    }

    /**
     * Delete cached data
     */
    async del(key: string): Promise<void> {
        try {
            await this.redisClient.del(key);
        } catch (error) {
            console.error('[HotelCache] Del error:', key, error);
        }
    }

    /**
     * Delete by pattern
     */
    async delPattern(pattern: string): Promise<number> {
        try {
            const keys = await this.redisClient.keys(pattern);
            if (keys.length > 0) {
                await this.redisClient.del(...keys);
            }
            return keys.length;
        } catch (error) {
            console.error('[HotelCache] DelPattern error:', pattern, error);
            return 0;
        }
    }

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        try {
            const result = await this.redisClient.exists(key);
            return result === 1;
        } catch (error) {
            return false;
        }
    }

    /**
     * Invalidate all hotel search caches
     */
    async invalidateSearchCache(): Promise<number> {
        return this.delPattern(`${CACHE_PREFIXES.HOTEL_SEARCH}*`);
    }

    /**
     * Invalidate specific hotel caches
     */
    async invalidateHotel(hotelId: number): Promise<void> {
        await Promise.all([
            this.del(`${CACHE_PREFIXES.HOTEL_DETAILS}${hotelId}`),
            this.del(`${CACHE_PREFIXES.ROOM_RATES}${hotelId}`),
        ]);
    }

    /**
     * Get cache stats
     */
    async getStats(): Promise<{ connected: boolean; memory: string; keys: number }> {
        try {
            const info = await this.redisClient.info('memory');
            const dbsize = await this.redisClient.dbsize();
            return {
                connected: this.redisClient.status === 'ready',
                memory: info,
                keys: dbsize,
            };
        } catch (error) {
            return { connected: false, memory: '', keys: 0 };
        }
    }

    /**
     * Ping to check connection
     */
    async ping(): Promise<boolean> {
        try {
            await this.redisClient.ping();
            return true;
        } catch {
            return false;
        }
    }
}

// Singleton instance
let cacheServiceInstance: HotelCacheService | null = null;

export function getHotelCacheService(): HotelCacheService {
    if (!cacheServiceInstance) {
        cacheServiceInstance = new HotelCacheService();
    }
    return cacheServiceInstance;
}

// Cache key generators
export const hotelCacheKeys = {
    search: (hash: string) => `${CACHE_PREFIXES.HOTEL_SEARCH}${hash}`,
    details: (hotelId: number) => `${CACHE_PREFIXES.HOTEL_DETAILS}${hotelId}`,
    rates: (hotelId: number, checkIn: string, checkOut: string) =>
        `${CACHE_PREFIXES.ROOM_RATES}${hotelId}:${checkIn}:${checkOut}`,
    static: (type: string) => `${CACHE_PREFIXES.STATIC}${type}`,
    popular: (limit: number) => `${CACHE_PREFIXES.POPULAR}destinations:${limit}`,
    aggregations: (type: string) => `${CACHE_PREFIXES.AGG}${type}`,
};

// Graceful shutdown
export async function closeRedisConnection(): Promise<void> {
    if (redisInstance) {
        await redisInstance.quit();
        redisInstance = null;
        cacheServiceInstance = null;
    }
}

export default getHotelCacheService;
