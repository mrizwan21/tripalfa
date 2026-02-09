/**
 * Hotel Search Service Factory
 * Creates instances of HotelSearchService with proper Redis integration
 */

import { PrismaClient } from '@prisma/client';
import { HotelSearchService } from './hotel-search.service.js';
import { getRedisClient, CACHE_TTL, hotelCacheKeys } from '../cache/index.js';

// Prisma client singleton
let prisma: PrismaClient | null = null;

function getPrismaClient(): PrismaClient {
    if (!prisma) {
        prisma = new PrismaClient({
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'info', 'warn', 'error']
                : ['error'],
        });
    }
    return prisma;
}

/**
 * Create a HotelSearchService with Redis caching enabled
 */
export function createHotelSearchService(): HotelSearchService {
    const prismaClient = getPrismaClient();
    const redis = getRedisClient();

    // Wrap Redis to match the interface expected by HotelSearchService
    const redisAdapter = {
        async get(key: string): Promise<string | null> {
            return redis.get(key);
        },
        async setex(key: string, seconds: number, value: string): Promise<void> {
            await redis.setex(key, seconds, value);
        },
    };

    return new HotelSearchService(prismaClient, redisAdapter);
}

/**
 * Create a HotelSearchService without caching (for testing or fallback)
 */
export function createHotelSearchServiceWithoutCache(): HotelSearchService {
    const prismaClient = getPrismaClient();
    return new HotelSearchService(prismaClient);
}

// Pre-configured instance
let hotelSearchServiceInstance: HotelSearchService | null = null;

/**
 * Get singleton instance of HotelSearchService
 */
export function getHotelSearchService(): HotelSearchService {
    if (!hotelSearchServiceInstance) {
        hotelSearchServiceInstance = createHotelSearchService();
    }
    return hotelSearchServiceInstance;
}

// Re-export types and service
export { HotelSearchService } from './hotel-search.service.js';
export type {
    HotelSearchFilters,
    HotelSearchResult,
    HotelSearchResponse
} from './hotel-search.service.js';

// Export cache utilities
// Export cache utilities
export { CACHE_TTL, hotelCacheKeys, HotelCacheService, getHotelCacheService } from '../cache/index.js';

/**
 * Graceful shutdown
 */
export async function closeConnections(): Promise<void> {
    if (prisma) {
        await prisma.$disconnect();
        prisma = null;
    }
    hotelSearchServiceInstance = null;
}
