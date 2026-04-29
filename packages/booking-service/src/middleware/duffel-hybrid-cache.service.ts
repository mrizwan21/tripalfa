import { CacheService } from "../cache/redis.js";
import { prisma } from "@tripalfa/shared-database";

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
  offerRequestList: (params: any) =>
    `duffel:offer-request:list:${JSON.stringify(params)}`,
  offer: (id: string) => `duffel:offer:${id}`,
  order: (id: string) => `duffel:order:${id}`,
  ordersList: (params?: any) =>
    `duffel:orders:list:${params ? JSON.stringify(params) : "*"}`,
  seatMap: (offerId: string, orderId: string) =>
    `duffel:seat-map:${offerId}:${orderId}`,
  availableServices: (orderId: string) => `duffel:services:${orderId}`,
  cancellation: (id: string) => `duffel:cancellation:${id}`,
  cancellationsList: (params?: any) =>
    `duffel:cancellations:list:${params ? JSON.stringify(params) : "*"}`,
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
        console.log(
          `[DuffelCache] Invalidated ${count} keys matching pattern: ${pattern}`,
        );
      }
    } catch (error) {
      console.error(
        `[DuffelCache] Error invalidating pattern ${pattern}:`,
        error,
      );
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
      console.error(
        `[DuffelCache] Error deleting cache for key ${key}:`,
        error,
      );
    }
  },

  /**
   * Clear all Duffel cache keys
   */
  async clearAll(): Promise<void> {
    await DuffelCacheUtils.invalidatePattern("duffel:*");
  },
};

// ============================================================================
// DUFFEL OFFER REQUEST CACHE
// ============================================================================

export const DuffelOfferCache = {
  /**
   * Get offer request from cache (Redis first, then Neon)
   */
  async getOfferRequest(id: string): Promise<any | null> {
    const cacheKey = DuffelCacheKeys.offerRequest(id);

    // Try Redis first
    const redisCache = await DuffelCacheUtils.getCache(cacheKey);
    if (redisCache) {
      return Object.assign({}, redisCache, { source: "redis" });
    }

    // Try Neon database
    try {
      const dbCache = await prisma.duffelOfferRequestCache.findUnique({
        where: { cacheKey },
      });

      if (dbCache && new Date(dbCache.expiresAt) > new Date()) {
        // Restore to Redis
        await DuffelCacheUtils.setCache(
          cacheKey,
          dbCache.requestData,
          DUFFEL_CACHE_TTL.OFFER_REQUEST,
        );
        const data =
          typeof dbCache.requestData === "object" &&
          dbCache.requestData !== null
            ? dbCache.requestData
            : {};
        return Object.assign({}, data, { source: "neon" });
      }
    } catch (error) {
      console.error(`[DuffelOfferCache] Error fetching from Neon:`, error);
    }

    return null;
  },

  /**
   * Set offer request cache (Redis + Neon)
   */
  async setOfferRequest(id: string, data: any): Promise<void> {
    const cacheKey = DuffelCacheKeys.offerRequest(id);

    // Set in Redis
    await DuffelCacheUtils.setCache(
      cacheKey,
      data,
      DUFFEL_CACHE_TTL.OFFER_REQUEST,
    );

    // Set in Neon
    try {
      await prisma.duffelOfferRequestCache.upsert({
        where: { cacheKey },
        update: {
          requestData: data,
          expiresAt: new Date(
            Date.now() + DUFFEL_CACHE_TTL.OFFER_REQUEST * 1000,
          ),
        },
        create: {
          cacheKey,
          requestData: data,
          expiresAt: new Date(
            Date.now() + DUFFEL_CACHE_TTL.OFFER_REQUEST * 1000,
          ),
        },
      });
    } catch (error) {
      console.error(`[DuffelOfferCache] Error upserting to Neon:`, error);
    }
  },

  /**
   * Invalidate offer request cache
   */
  async invalidateOfferRequest(id: string): Promise<void> {
    const cacheKey = DuffelCacheKeys.offerRequest(id);
    await DuffelCacheUtils.deleteCache(cacheKey);

    try {
      await prisma.duffelOfferRequestCache
        .delete({
          where: { cacheKey },
        })
        .catch(() => {}); // Ignore if not found
    } catch (error) {
      console.error(`[DuffelOfferCache] Error deleting from Neon:`, error);
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
      return Object.assign({}, redisCache, { source: "redis" });
    }

    // Try Neon
    try {
      const dbCache = await prisma.duffelOfferCache.findUnique({
        where: { cacheKey },
      });

      if (dbCache && new Date(dbCache.expiresAt) > new Date()) {
        await DuffelCacheUtils.setCache(
          cacheKey,
          dbCache.offerData,
          DUFFEL_CACHE_TTL.OFFER,
        );
        const data =
          typeof dbCache.offerData === "object" && dbCache.offerData !== null
            ? dbCache.offerData
            : {};
        return Object.assign({}, data, { source: "neon" });
      }
    } catch (error) {
      console.error(`[DuffelOffersCache] Error fetching from Neon:`, error);
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
        where: { cacheKey },
        update: {
          offerData: data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.OFFER * 1000),
        },
        create: {
          cacheKey,
          offerId: id,
          offerData: data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.OFFER * 1000),
        },
      });
    } catch (error) {
      console.error(`[DuffelOffersCache] Error upserting to Neon:`, error);
    }
  },

  /**
   * Invalidate offer cache
   */
  async invalidateOffer(id: string): Promise<void> {
    const cacheKey = DuffelCacheKeys.offer(id);
    await DuffelCacheUtils.deleteCache(cacheKey);

    try {
      await prisma.duffelOfferCache
        .delete({
          where: { cacheKey },
        })
        .catch(() => {});
    } catch (error) {
      console.error(`[DuffelOffersCache] Error deleting from Neon:`, error);
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
      return Object.assign({}, redisCache, { source: "redis" });
    }

    try {
      const dbCache = await prisma.duffelOrderCache.findUnique({
        where: { cacheKey },
      });

      if (dbCache && new Date(dbCache.expiresAt) > new Date()) {
        await DuffelCacheUtils.setCache(
          cacheKey,
          dbCache.orderData,
          DUFFEL_CACHE_TTL.ORDER,
        );
        const data =
          typeof dbCache.orderData === "object" && dbCache.orderData !== null
            ? dbCache.orderData
            : {};
        return Object.assign({}, data, { source: "neon" });
      }
    } catch (error) {
      console.error(`[DuffelOrderCache] Error fetching from Neon:`, error);
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
        where: { cacheKey },
        update: {
          orderData: data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.ORDER * 1000),
        },
        create: {
          cacheKey,
          orderData: data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.ORDER * 1000),
        },
      });
    } catch (error) {
      console.error(`[DuffelOrderCache] Error upserting to Neon:`, error);
    }
  },

  /**
   * Invalidate order cache
   */
  async invalidateOrder(id: string): Promise<void> {
    const cacheKey = DuffelCacheKeys.order(id);
    await DuffelCacheUtils.deleteCache(cacheKey);

    try {
      await prisma.duffelOrderCache
        .delete({
          where: { cacheKey },
        })
        .catch(() => {});
    } catch (error) {
      console.error(`[DuffelOrderCache] Error deleting from Neon:`, error);
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
  async getSeatMap(offerId?: string, orderId?: string): Promise<any | null> {
    const safeOfferId = offerId || "none";
    const safeOrderId = orderId || "none";
    const cacheKey = DuffelCacheKeys.seatMap(safeOfferId, safeOrderId);

    const redisCache = await DuffelCacheUtils.getCache(cacheKey);
    if (redisCache) {
      return Object.assign({}, redisCache, { source: "redis" });
    }

    try {
      const dbCache = await prisma.duffelSeatMapCache.findUnique({
        where: { cacheKey },
      });

      if (dbCache && new Date(dbCache.expiresAt) > new Date()) {
        await DuffelCacheUtils.setCache(
          cacheKey,
          dbCache.seatData,
          DUFFEL_CACHE_TTL.SEAT_MAP,
        );
        const data =
          typeof dbCache.seatData === "object" && dbCache.seatData !== null
            ? dbCache.seatData
            : {};
        return Object.assign({}, data, { source: "neon" });
      }
    } catch (error) {
      console.error(`[DuffelSeatMapCache] Error fetching from Neon:`, error);
    }

    return null;
  },

  /**
   * Set seat map cache
   */
  async setSeatMap(offerId: string, orderId: string, data: any): Promise<void> {
    const safeOfferId = offerId || "none";
    const safeOrderId = orderId || "none";
    const cacheKey = DuffelCacheKeys.seatMap(safeOfferId, safeOrderId);

    await DuffelCacheUtils.setCache(cacheKey, data, DUFFEL_CACHE_TTL.SEAT_MAP);

    try {
      await prisma.duffelSeatMapCache.upsert({
        where: { cacheKey },
        update: {
          seatData: data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.SEAT_MAP * 1000),
        },
        create: {
          cacheKey,
          seatData: data,
          expiresAt: new Date(Date.now() + DUFFEL_CACHE_TTL.SEAT_MAP * 1000),
        },
      });
    } catch (error) {
      console.error(`[DuffelSeatMapCache] Error upserting to Neon:`, error);
    }
  },

  /**
   * Invalidate seat map cache
   */
  async invalidateSeatMap(offerId?: string, orderId?: string): Promise<void> {
    const safeOfferId = offerId || "none";
    const safeOrderId = orderId || "none";
    const cacheKey = DuffelCacheKeys.seatMap(safeOfferId, safeOrderId);
    await DuffelCacheUtils.deleteCache(cacheKey);

    try {
      await prisma.duffelSeatMapCache
        .delete({
          where: { cacheKey },
        })
        .catch(() => {});
    } catch (error) {
      console.error(`[DuffelSeatMapCache] Error deleting from Neon:`, error);
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
        where: { cacheKey },
      });

      if (dbCache && new Date(dbCache.expiresAt) > new Date()) {
        await DuffelCacheUtils.setCache(
          cacheKey,
          dbCache.servicesData,
          DUFFEL_CACHE_TTL.AVAILABLE_SERVICES,
        );
        return Array.isArray(dbCache.servicesData) ? dbCache.servicesData : [];
      }
    } catch (error) {
      console.error(`[DuffelServicesCache] Error fetching from Neon:`, error);
    }

    return null;
  },

  /**
   * Set available services cache
   */
  async setAvailableServices(orderId: string, data: any[]): Promise<void> {
    const cacheKey = DuffelCacheKeys.availableServices(orderId);

    await DuffelCacheUtils.setCache(
      cacheKey,
      data,
      DUFFEL_CACHE_TTL.AVAILABLE_SERVICES,
    );

    try {
      await prisma.duffelServicesCache.upsert({
        where: { cacheKey },
        update: {
          servicesData: data,
          expiresAt: new Date(
            Date.now() + DUFFEL_CACHE_TTL.AVAILABLE_SERVICES * 1000,
          ),
        },
        create: {
          cacheKey,
          servicesData: data,
          expiresAt: new Date(
            Date.now() + DUFFEL_CACHE_TTL.AVAILABLE_SERVICES * 1000,
          ),
        },
      });
    } catch (error) {
      console.error(`[DuffelServicesCache] Error upserting to Neon:`, error);
    }
  },

  /**
   * Invalidate services cache
   */
  async invalidateServices(orderId: string): Promise<void> {
    const cacheKey = DuffelCacheKeys.availableServices(orderId);
    await DuffelCacheUtils.deleteCache(cacheKey);

    try {
      await prisma.duffelServicesCache
        .delete({
          where: { cacheKey },
        })
        .catch(() => {});
    } catch (error) {
      console.error(`[DuffelServicesCache] Error deleting from Neon:`, error);
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
      return Object.assign({}, redisCache, { source: "redis" });
    }

    try {
      const dbCache = await prisma.duffelCancellationCache.findUnique({
        where: { cacheKey },
      });

      if (dbCache && new Date(dbCache.expiresAt) > new Date()) {
        await DuffelCacheUtils.setCache(
          cacheKey,
          dbCache.cancellationData,
          DUFFEL_CACHE_TTL.CANCELLATION,
        );
        const data =
          typeof dbCache.cancellationData === "object" &&
          dbCache.cancellationData !== null
            ? dbCache.cancellationData
            : {};
        return Object.assign({}, data, { source: "neon" });
      }
    } catch (error) {
      console.error(
        `[DuffelCancellationCache] Error fetching from Neon:`,
        error,
      );
    }

    return null;
  },

  /**
   * Set cancellation cache
   */
  async setCancellation(id: string, data: any): Promise<void> {
    const cacheKey = DuffelCacheKeys.cancellation(id);

    await DuffelCacheUtils.setCache(
      cacheKey,
      data,
      DUFFEL_CACHE_TTL.CANCELLATION,
    );

    try {
      await prisma.duffelCancellationCache.upsert({
        where: { cacheKey },
        update: {
          cancellationData: data,
          expiresAt: new Date(
            Date.now() + DUFFEL_CACHE_TTL.CANCELLATION * 1000,
          ),
        },
        create: {
          cacheKey,
          cancellationData: data,
          expiresAt: new Date(
            Date.now() + DUFFEL_CACHE_TTL.CANCELLATION * 1000,
          ),
        },
      });
    } catch (error) {
      console.error(
        `[DuffelCancellationCache] Error upserting to Neon:`,
        error,
      );
    }
  },

  /**
   * Invalidate cancellation cache
   */
  async invalidateCancellation(id: string): Promise<void> {
    const cacheKey = DuffelCacheKeys.cancellation(id);
    await DuffelCacheUtils.deleteCache(cacheKey);

    try {
      await prisma.duffelCancellationCache
        .delete({
          where: { cacheKey },
        })
        .catch(() => {});
    } catch (error) {
      console.error(
        `[DuffelCancellationCache] Error deleting from Neon:`,
        error,
      );
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
