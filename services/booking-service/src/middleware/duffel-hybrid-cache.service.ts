import { CacheService } from '../cache/redis.js';
import { prisma } from '@tripalfa/shared-database';

// ============================================================================
// CACHE TTL CONSTANTS
// ============================================================================

export const DUFFEL_CACHE_TTL = {
  OFFER_REQUEST: 300, // 5 minutes
  OFFER: 600, // 10 minutes
  ORDER: 3600, // 1 hour
  SEAT_MAP: 1800, // 30 minutes
  AVAILABLE_SERVICES: 1800, // 30 minutes
  CANCELLATION: 900, // 15 minutes
};

// ============================================================================
// CACHE KEY GENERATOR
// ============================================================================

export const DuffelCacheKeys = {
  offerRequest: (id: string) => `duffel:offer-request:${id}`,
  offerRequestList: (params: any) => `duffel:offer-request:list:${JSON.stringify(params)}`,
  offer: (id: string) => `duffel:offer:${id}`,
  order: (id: string) => `duffel:order:${id}`,
  ordersList: (params?: any) => `duffel:orders:list:${params ? JSON.stringify(params) : '*'}`,
  seatMap: (offerId: string, orderId: string) => `duffel:seat-map:${offerId}:${orderId}`,
  availableServices: (orderId: string) => `duffel:services:${orderId}`,
  cancellation: (id: string) => `duffel:cancellation:${id}`,
  cancellationsList: (params?: any) => `duffel:cancellations:list:${params ? JSON.stringify(params) : '*'}`,
};

// ============================================================================
// CACHE UTILITY FUNCTIONS
// ============================================================================

export const DuffelCacheUtils = {
  /**
   * Invalidate cache keys matching a pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const count = await CacheService.deletePattern(pattern);
      if (count > 0) {
        console.log(`[DuffelCache] Invalidated ${count} keys matching pattern: ${pattern}`);
      }
    } catch (error) {
      console.error(`[DuffelCache] Error invalidating pattern ${pattern}:`, error);
    }
  },

  /**
   * Set cache with TTL
   */
  async setCache(key: string, value: any, ttl: number): Promise<void> {
    try {
      await CacheService.set(key, value, ttl);
    } catch (error) {
      console.error(`[DuffelCache] Error setting cache for key ${key}:`, error);
    }
  },

  /**
   * Get cache
   */
  async getCache(key: string): Promise<any | null> {
    try {
      const cached = await CacheService.get(key);
      return cached || null;
    } catch (error) {
      console.error(`[DuffelCache] Error getting cache for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Delete cache key
   */
  async deleteCache(key: string): Promise<void> {
    try {
      await CacheService.delete(key);
    } catch (error) {
      console.error(`[DuffelCache] Error deleting cache for key ${key}:`, error);
    }
  },
};

// ============================================================================
// DUFFEL OFFER REQUEST CACHE
// ============================================================================

export const DuffelOfferCache = {
  /**
   * Get offer request from cache (Redis first, then NEON)
   */
  async getOfferRequest(id: string): Promise<any | null> {
    const cacheKey = DuffelCacheKeys.offerRequest(id);

    // Try Redis first
    const redisCache = await DuffelCacheUtils.getCache(cacheKey);
    if (redisCache) {
      return Object.assign({}, redisCache, { source: 'redis' });
    }

    // Try NEON database
    try {
      const dbCache = await prisma.duffelOfferRequestCache.findUnique({
        where: { offerId: id },
      });

      if (dbCache && new Date(dbCache.expiresAt) > new Date()) {
        // Restore to Redis
        await DuffelCacheUtils.setCache(cacheKey, dbCache.data, DUFFEL_CACHE_TTL.OFFER_REQUEST);
        const data = typeof dbCache.data === 'object' && dbCache.data !== null ? dbCache.data : {};
        return Object.assign({}, data, { source: 'neon' });
      }
    } catch (error) {
      console.error(`[DuffelOfferCache] Error fetching from NEON:`, error);
    }

    return null;
  },

  /**
   * Set offer request cache (Redis + NEON)
   */
  async setOfferRequest(id: string, data: any): Promise<void> {
    const cacheKey = DuffelCacheKeys.offerRequest(id);

    // Set in Redis
    await DuffelCacheUtils.setCache(cacheKey, data, DUFFEL_CACHE_TTL.OFFER_REQUEST);

    // Set in NEON
    try {
      await prisma.duffelOfferRequestCache.upsert({
        where: { offerId: id },
        update: {
          data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.OFFER_REQUEST * 1000),
        },
        create: {
          offerId: id,
          data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.OFFER_REQUEST * 1000),
        },
      });
    } catch (error) {
      console.error(`[DuffelOfferCache] Error upserting to NEON:`, error);
    }
  },

  /**
   * Invalidate offer request cache
   */
  async invalidateOfferRequest(id: string): Promise<void> {
    const cacheKey = DuffelCacheKeys.offerRequest(id);
    await DuffelCacheUtils.deleteCache(cacheKey);

    try {
      await prisma.duffelOfferRequestCache.delete({
        where: { offerId: id },
      }).catch(() => {}); // Ignore if not found
    } catch (error) {
      console.error(`[DuffelOfferCache] Error deleting from NEON:`, error);
    }
  },
};

// ============================================================================
// DUFFEL OFFERS CACHE
// ============================================================================

export const DuffelOffersCache = {
  /**
   * Get offer from cache
   */
  async getOffer(id: string): Promise<any | null> {
    const cacheKey = DuffelCacheKeys.offer(id);

    // Try Redis
    const redisCache = await DuffelCacheUtils.getCache(cacheKey);
    if (redisCache) {
      return Object.assign({}, redisCache, { source: 'redis' });
    }

    // Try NEON
    try {
      const dbCache = await prisma.duffelOfferCache.findUnique({
        where: { offerId: id },
      });

      if (dbCache && new Date(dbCache.expiresAt) > new Date()) {
        await DuffelCacheUtils.setCache(cacheKey, dbCache.data, DUFFEL_CACHE_TTL.OFFER);
        const data = typeof dbCache.data === 'object' && dbCache.data !== null ? dbCache.data : {};
        return Object.assign({}, data, { source: 'neon' });
      }
    } catch (error) {
      console.error(`[DuffelOffersCache] Error fetching from NEON:`, error);
    }

    return null;
  },

  /**
   * Set offer cache
   */
  async setOffer(id: string, data: any): Promise<void> {
    const cacheKey = DuffelCacheKeys.offer(id);

    await DuffelCacheUtils.setCache(cacheKey, data, DUFFEL_CACHE_TTL.OFFER);

    try {
      await prisma.duffelOfferCache.upsert({
        where: { offerId: id },
        update: {
          data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.OFFER * 1000),
        },
        create: {
          offerId: id,
          data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.OFFER * 1000),
        },
      });
    } catch (error) {
      console.error(`[DuffelOffersCache] Error upserting to NEON:`, error);
    }
  },

  /**
   * Invalidate offer cache
   */
  async invalidateOffer(id: string): Promise<void> {
    const cacheKey = DuffelCacheKeys.offer(id);
    await DuffelCacheUtils.deleteCache(cacheKey);

    try {
      await prisma.duffelOfferCache.delete({
        where: { offerId: id },
      }).catch(() => {});
    } catch (error) {
      console.error(`[DuffelOffersCache] Error deleting from NEON:`, error);
    }
  },
};

// ============================================================================
// DUFFEL ORDER CACHE
// ============================================================================

export const DuffelOrderCache = {
  /**
   * Get order from cache
   */
  async getOrder(id: string): Promise<any | null> {
    const cacheKey = DuffelCacheKeys.order(id);

    const redisCache = await DuffelCacheUtils.getCache(cacheKey);
    if (redisCache) {
      return Object.assign({}, redisCache, { source: 'redis' });
    }

    try {
      const dbCache = await prisma.duffelOrderCache.findUnique({
        where: { orderId: id },
      });

      if (dbCache && new Date(dbCache.expiresAt) > new Date()) {
        await DuffelCacheUtils.setCache(cacheKey, dbCache.data, DUFFEL_CACHE_TTL.ORDER);
        const data = typeof dbCache.data === 'object' && dbCache.data !== null ? dbCache.data : {};
        return Object.assign({}, data, { source: 'neon' });
      }
    } catch (error) {
      console.error(`[DuffelOrderCache] Error fetching from NEON:`, error);
    }

    return null;
  },

  /**
   * Set order cache
   */
  async setOrder(id: string, data: any): Promise<void> {
    const cacheKey = DuffelCacheKeys.order(id);

    await DuffelCacheUtils.setCache(cacheKey, data, DUFFEL_CACHE_TTL.ORDER);

    try {
      await prisma.duffelOrderCache.upsert({
        where: { orderId: id },
        update: {
          data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.ORDER * 1000),
        },
        create: {
          orderId: id,
          data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.ORDER * 1000),
        },
      });
    } catch (error) {
      console.error(`[DuffelOrderCache] Error upserting to NEON:`, error);
    }
  },

  /**
   * Invalidate order cache
   */
  async invalidateOrder(id: string): Promise<void> {
    const cacheKey = DuffelCacheKeys.order(id);
    await DuffelCacheUtils.deleteCache(cacheKey);

    try {
      await prisma.duffelOrderCache.delete({
        where: { orderId: id },
      }).catch(() => {});
    } catch (error) {
      console.error(`[DuffelOrderCache] Error deleting from NEON:`, error);
    }
  },
};

// ============================================================================
// DUFFEL SEAT MAP CACHE
// ============================================================================

export const DuffelSeatMapCache = {
  /**
   * Get seat map from cache
   */
  async getSeatMap(offerId: string, orderId: string): Promise<any | null> {
    const cacheKey = DuffelCacheKeys.seatMap(offerId, orderId);

    const redisCache = await DuffelCacheUtils.getCache(cacheKey);
    if (redisCache) {
      return Object.assign({}, redisCache, { source: 'redis' });
    }

    try {
      const dbCache = await prisma.duffelSeatMapCache.findUnique({
        where: { seatMapKey: `${offerId}:${orderId}` },
      });

      if (dbCache && new Date(dbCache.expiresAt) > new Date()) {
        await DuffelCacheUtils.setCache(cacheKey, dbCache.data, DUFFEL_CACHE_TTL.SEAT_MAP);
        const data = typeof dbCache.data === 'object' && dbCache.data !== null ? dbCache.data : {};
        return Object.assign({}, data, { source: 'neon' });
      }
    } catch (error) {
      console.error(`[DuffelSeatMapCache] Error fetching from NEON:`, error);
    }

    return null;
  },

  /**
   * Set seat map cache
   */
  async setSeatMap(offerId: string, orderId: string, data: any): Promise<void> {
    const cacheKey = DuffelCacheKeys.seatMap(offerId, orderId);

    await DuffelCacheUtils.setCache(cacheKey, data, DUFFEL_CACHE_TTL.SEAT_MAP);

    try {
      await prisma.duffelSeatMapCache.upsert({
        where: { seatMapKey: `${offerId}:${orderId}` },
        update: {
          data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.SEAT_MAP * 1000),
        },
        create: {
          seatMapKey: `${offerId}:${orderId}`,
          offerId,
          orderId,
          data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.SEAT_MAP * 1000),
        },
      });
    } catch (error) {
      console.error(`[DuffelSeatMapCache] Error upserting to NEON:`, error);
    }
  },

  /**
   * Invalidate seat map cache
   */
  async invalidateSeatMap(offerId: string, orderId: string): Promise<void> {
    const cacheKey = DuffelCacheKeys.seatMap(offerId, orderId);
    await DuffelCacheUtils.deleteCache(cacheKey);

    try {
      await prisma.duffelSeatMapCache.delete({
        where: { seatMapKey: `${offerId}:${orderId}` },
      }).catch(() => {});
    } catch (error) {
      console.error(`[DuffelSeatMapCache] Error deleting from NEON:`, error);
    }
  },
};

// ============================================================================
// DUFFEL SERVICES CACHE
// ============================================================================

export const DuffelServicesCache = {
  /**
   * Get available services from cache
   */
  async getAvailableServices(orderId: string): Promise<any[] | null> {
    const cacheKey = DuffelCacheKeys.availableServices(orderId);

    const redisCache = await DuffelCacheUtils.getCache(cacheKey);
    if (redisCache) {
      return Array.isArray(redisCache) ? redisCache : [];
    }

    try {
      const dbCache = await prisma.duffelServicesCache.findUnique({
        where: { orderId },
      });

      if (dbCache && new Date(dbCache.expiresAt) > new Date()) {
        await DuffelCacheUtils.setCache(cacheKey, dbCache.data, DUFFEL_CACHE_TTL.AVAILABLE_SERVICES);
        return Array.isArray(dbCache.data) ? dbCache.data : [];
      }
    } catch (error) {
      console.error(`[DuffelServicesCache] Error fetching from NEON:`, error);
    }

    return null;
  },

  /**
   * Set available services cache
   */
  async setAvailableServices(orderId: string, data: any[]): Promise<void> {
    const cacheKey = DuffelCacheKeys.availableServices(orderId);

    await DuffelCacheUtils.setCache(cacheKey, data, DUFFEL_CACHE_TTL.AVAILABLE_SERVICES);

    try {
      await prisma.duffelServicesCache.upsert({
        where: { orderId },
        update: {
          data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.AVAILABLE_SERVICES * 1000),
        },
        create: {
          orderId,
          data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.AVAILABLE_SERVICES * 1000),
        },
      });
    } catch (error) {
      console.error(`[DuffelServicesCache] Error upserting to NEON:`, error);
    }
  },

  /**
   * Invalidate services cache
   */
  async invalidateServices(orderId: string): Promise<void> {
    const cacheKey = DuffelCacheKeys.availableServices(orderId);
    await DuffelCacheUtils.deleteCache(cacheKey);

    try {
      await prisma.duffelServicesCache.delete({
        where: { orderId },
      }).catch(() => {});
    } catch (error) {
      console.error(`[DuffelServicesCache] Error deleting from NEON:`, error);
    }
  },
};

// ============================================================================
// DUFFEL CANCELLATION CACHE
// ============================================================================

export const DuffelCancellationCache = {
  /**
   * Get cancellation from cache
   */
  async getCancellation(id: string): Promise<any | null> {
    const cacheKey = DuffelCacheKeys.cancellation(id);

    const redisCache = await DuffelCacheUtils.getCache(cacheKey);
    if (redisCache) {
      return Object.assign({}, redisCache, { source: 'redis' });
    }

    try {
      const dbCache = await prisma.duffelCancellationCache.findUnique({
        where: { cancellationId: id },
      });

      if (dbCache && new Date(dbCache.expiresAt) > new Date()) {
        await DuffelCacheUtils.setCache(cacheKey, dbCache.data, DUFFEL_CACHE_TTL.CANCELLATION);
        const data = typeof dbCache.data === 'object' && dbCache.data !== null ? dbCache.data : {};
        return Object.assign({}, data, { source: 'neon' });
      }
    } catch (error) {
      console.error(`[DuffelCancellationCache] Error fetching from NEON:`, error);
    }

    return null;
  },

  /**
   * Set cancellation cache
   */
  async setCancellation(id: string, data: any): Promise<void> {
    const cacheKey = DuffelCacheKeys.cancellation(id);

    await DuffelCacheUtils.setCache(cacheKey, data, DUFFEL_CACHE_TTL.CANCELLATION);

    try {
      await prisma.duffelCancellationCache.upsert({
        where: { cancellationId: id },
        update: {
          data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.CANCELLATION * 1000),
        },
        create: {
          cancellationId: id,
          data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.CANCELLATION * 1000),
        },
      });
    } catch (error) {
      console.error(`[DuffelCancellationCache] Error upserting to NEON:`, error);
    }
  },

  /**
   * Invalidate cancellation cache
   */
  async invalidateCancellation(id: string): Promise<void> {
    const cacheKey = DuffelCacheKeys.cancellation(id);
    await DuffelCacheUtils.deleteCache(cacheKey);

    try {
      await prisma.duffelCancellationCache.delete({
        where: { cancellationId: id },
      }).catch(() => {});
    } catch (error) {
      console.error(`[DuffelCancellationCache] Error deleting from NEON:`, error);
    }
  },
};

export default {
  DuffelOfferCache,
  DuffelOffersCache,
  DuffelOrderCache,
  DuffelSeatMapCache,
  DuffelServicesCache,
  DuffelCancellationCache,
  DuffelCacheUtils,
  DuffelCacheKeys,
  DUFFEL_CACHE_TTL,
};
