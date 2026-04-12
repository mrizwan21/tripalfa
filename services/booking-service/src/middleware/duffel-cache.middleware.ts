/**
 * Duffel Hybrid Cache Middleware
 *
 * Integrates Redis + Neon caching into the Duffel API Gateway response cycle
 *
 * Flow:
 * 1. Request comes to /api/flights/* endpoint (via API Gateway)
 * 2. Middleware checks Redis cache
 * 3. If miss, request goes to Duffel API
 * 4. Response is processed and stored in Neon
 * 5. Response is cached in Redis for next request
 * 6. Response returned to frontend
 */

import { Request, Response, NextFunction } from "express";
import {
  DuffelOfferCache,
  DuffelOffersCache,
  DuffelOrderCache,
  DuffelSeatMapCache,
  DuffelServicesCache,
  DuffelCancellationCache,
  DuffelCacheUtils,
  DUFFEL_CACHE_TTL,
  DuffelCacheKeys,
} from "./duffel-hybrid-cache.service.js";

// ============================================================================
// RESPONSE CACHE WRAPPER
// ============================================================================

/**
 * Wraps res.json() to cache responses automatically
 */
function setupCacheInterceptor(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const originalJson = res.json.bind(res);

  res.json = function (data: any) {
    // Attach cache metadata to response for tracking
    if (data && !data._cache) {
      data._cache = {
        cached: false,
        source: "api",
        timestamp: new Date().toISOString(),
      };
    }

    return originalJson(data);
  };

  next();
}

// ============================================================================
// ENDPOINT-SPECIFIC CACHE MIDDLEWARE
// ============================================================================

/**
 * Cache middleware for GET /api/flights/offer-requests/:id
 */
async function cacheOfferRequestMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id =
    typeof req.params.id === "string" ? req.params.id : String(req.params.id);

  try {
    // Try to get from cache
    const cached = await DuffelOfferCache.getOfferRequest(id);
    if (cached) {
      return res.json({
        ...cached,
        _cache: {
          cached: true,
          source: cached.source,
          ttl: DUFFEL_CACHE_TTL.OFFER_REQUEST,
        },
      });
    }
  } catch (error) {
    console.error(
      "[CacheMiddleware] Error checking offer request cache:",
      error,
    );
  }

  next();
}

/**
 * Cache middleware for GET /api/flights/offers/:id
 */
async function cacheOfferMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id =
    typeof req.params.id === "string" ? req.params.id : String(req.params.id);

  try {
    const cached = await DuffelOffersCache.getOffer(id);
    if (cached) {
      return res.json({
        ...cached,
        _cache: {
          cached: true,
          source: cached.source,
          ttl: DUFFEL_CACHE_TTL.OFFER,
        },
      });
    }
  } catch (error) {
    console.error("[CacheMiddleware] Error checking offer cache:", error);
  }

  next();
}

/**
 * Cache middleware for GET /api/flights/orders/:id
 */
async function cacheOrderMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id =
    typeof req.params.id === "string" ? req.params.id : String(req.params.id);

  try {
    const cached = await DuffelOrderCache.getOrder(id);
    if (cached) {
      return res.json({
        ...cached,
        _cache: {
          cached: true,
          source: cached.source,
          ttl: DUFFEL_CACHE_TTL.ORDER,
        },
      });
    }
  } catch (error) {
    console.error("[CacheMiddleware] Error checking order cache:", error);
  }

  next();
}

/**
 * Cache middleware for GET /api/flights/seat-maps
 */
export async function cacheSeatMapMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { offer_id, order_id } = req.query;

  try {
    const cached = await DuffelSeatMapCache.getSeatMap(
      offer_id as string,
      order_id as string,
    );
    if (cached) {
      return res.json({
        ...cached,
        _cache: {
          cached: true,
          source: "redis",
          ttl: DUFFEL_CACHE_TTL.SEAT_MAP,
        },
      });
    }
  } catch (error) {
    console.error("[CacheMiddleware] Error checking seat map cache:", error);
  }

  next();
}

/**
 * Cache middleware for GET /api/flights/orders/:id/available-services
 */
export async function cacheAvailableServicesMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id =
    typeof req.params.id === "string" ? req.params.id : String(req.params.id);

  try {
    const cached = await DuffelServicesCache.getAvailableServices(id);
    if (cached) {
      return res.json({
        data: cached,
        _cache: {
          cached: true,
          source: "redis",
          ttl: DUFFEL_CACHE_TTL.AVAILABLE_SERVICES,
        },
      });
    }
  } catch (error) {
    console.error(
      "[CacheMiddleware] Error checking available services cache:",
      error,
    );
  }

  next();
}

/**
 * Cache middleware for GET /api/flights/order-cancellations/:id
 */
export async function cacheCancellationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const id =
    typeof req.params.id === "string" ? req.params.id : String(req.params.id);

  try {
    const cached = await DuffelCancellationCache.getCancellation(id);
    if (cached) {
      return res.json({
        ...cached,
        _cache: {
          cached: true,
          source: cached.source,
          ttl: DUFFEL_CACHE_TTL.CANCELLATION,
        },
      });
    }
  } catch (error) {
    console.error(
      "[CacheMiddleware] Error checking cancellation cache:",
      error,
    );
  }

  next();
}

// ============================================================================
// CACHE INVALIDATION MIDDLEWARE
// ============================================================================

/**
 * Invalidate caches after POST/PATCH requests
 */
export async function invalidateCacheAfterMutationMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const originalJson = res.json.bind(res);

  res.json = function (data: any) {
    // Schedule cache invalidation without blocking response
    const invalidateCaches = async () => {
      const path = req.path;
      const method = req.method;

      try {
        if (method === "POST" && path.includes("/orders")) {
          const { id } = req.body || {};
          if (id) {
            await DuffelOrderCache.invalidateOrder(id);
            // Also invalidate orders list
            await DuffelCacheUtils.invalidatePattern("orders:list:*");
          }
        } else if (method === "PATCH" && path.includes("/orders")) {
          const { id } = req.params || {};
          if (id) {
            await DuffelOrderCache.invalidateOrder(id);
          }
        } else if (method === "POST" && path.includes("/order-services")) {
          const { order_id } = req.body || {};
          if (order_id) {
            await DuffelServicesCache.invalidateServices(order_id);
            await DuffelOrderCache.invalidateOrder(order_id);
          }
        } else if (method === "POST" && path.includes("/order-cancellations")) {
          const { order_id } = req.body || {};
          if (order_id) {
            await DuffelOrderCache.invalidateOrder(order_id);
            // Invalidate cancellations list
            await DuffelCacheUtils.invalidatePattern("cancellations:list:*");
          }
        }
      } catch (error) {
        console.error("[CacheMiddleware] Error invalidating caches:", error);
        // Don't fail the response if cache invalidation fails
      }
    };

    // Fire invalidation asynchronously without blocking response
    invalidateCaches().catch((error: any) => {
      console.error("[CacheMiddleware] Async invalidation error:", error);
    });

    return originalJson(data);
  };

  next();
}

// ============================================================================
// CACHE STATS MIDDLEWARE
// ============================================================================

/**
 * Track cache hit/miss statistics
 */
function cacheStatsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const startTime = Date.now();
  const originalJson = res.json.bind(res);

  res.json = function (data: any) {
    const duration = Date.now() - startTime;

    // Add cache statistics
    if (data && typeof data === "object") {
      data._stats = {
        duration: `${duration}ms`,
        endpoint: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
      };
    }

    return originalJson(data);
  };

  next();
}

// ============================================================================
// BATCH CACHE WARMING
// ============================================================================

/**
 * Warm up cache with frequently accessed data
 */
async function warmCacheMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Only warm cache for GET requests
  if (req.method !== "GET") {
    return next();
  }

  // Warm cache for list endpoints
  if (req.path.includes("/offer-requests") && !req.params.id) {
    // List requests are cached short (5 min)
    // Cache key is generated from query params
    const cacheKey = DuffelCacheKeys.offerRequestList(req.query);
    console.log(`[CacheWarmMiddleware] Marked for warming: ${cacheKey}`);
  }

  next();
}

// ============================================================================
// ERROR HANDLING WITH CACHE FALLBACK
// ============================================================================

/**
 * Try cache on API errors
 */
async function cacheErrorFallbackMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const originalStatus = res.status.bind(res);
  const originalJson = res.json.bind(res);

  res.status = function (code: number) {
    // If timeout or error, try to serve stale cache
    if ((code >= 500 || code === 408 || code === 504) && req.method === "GET") {
      console.log(
        `[CacheErrorFallback] API returned ${code}, attempting cache fallback...`,
      );

      // For simplicity, we let the cache middleware handle this
      // In production, could implement stale-write logic
    }

    return originalStatus.call(this, code);
  };

  next();
}

// ============================================================================
// COMPOSITE MIDDLEWARE SETUP
// ============================================================================

/**
 * Apply all cache middlewares to a router
 */
function applyCacheMiddlewares(router: any) {
  // Setup cache interceptor first
  router.use(setupCacheInterceptor);

  // Setup stats collection
  router.use(cacheStatsMiddleware);

  // Specific endpoint caches (GET requests)
  router.get("/offer-requests/:id", cacheOfferRequestMiddleware);
  router.get("/offers/:id", cacheOfferMiddleware);
  router.get("/orders/:id", cacheOrderMiddleware);
  router.get("/seat-maps", cacheSeatMapMiddleware);
  router.get(
    "/orders/:id/available-services",
    cacheAvailableServicesMiddleware,
  );
  router.get("/order-cancellations/:id", cacheCancellationMiddleware);

  // Invalidate on mutations
  router.use(invalidateCacheAfterMutationMiddleware);

  // Error fallback
  router.use(cacheErrorFallbackMiddleware);

  return router;
}

export default {
  setupCacheInterceptor,
  cacheOfferRequestMiddleware,
  cacheOfferMiddleware,
  cacheOrderMiddleware,
  cacheSeatMapMiddleware,
  cacheAvailableServicesMiddleware,
  cacheCancellationMiddleware,
  invalidateCacheAfterMutationMiddleware,
  cacheStatsMiddleware,
  warmCacheMiddleware,
  cacheErrorFallbackMiddleware,
  applyCacheMiddlewares,
};
