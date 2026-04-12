/**
 * Duffel API Manager - Response Processor
 *
 * Handles the complete request/response cycle for Duffel API endpoints
 * through the API Gateway with hybrid Redis + Neon caching
 *
 * Architecture:
 * Frontend Request
 *     ↓
 * API Gateway (/api/flights/*)
 *     ↓
 * API Manager (this module)
 *     ↓
 * Redis Cache Check
 *     ↓ MISS
 * Duffel API Request
 *     ↓
 * Response Processing
 *     ↓
 * Neon Storage + Redis Cache
 *     ↓
 * Return to Frontend
 */

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
} from "../middleware/duffel-hybrid-cache.service.js";

// ============================================================================
// API MANAGER CONFIGURATION
// ============================================================================

export interface APIManagerResponse<T = any> {
  success: boolean;
  data: T;
  cached: boolean;
  source: "redis" | "neon" | "api";
  cachedAt?: string;
  expiresAt?: string;
  stats?: {
    fetchTime?: number;
    cacheTime?: string;
  };
}

// ============================================================================
// OFFER REQUEST MANAGER
// ============================================================================

const OfferRequestManager = {
  /**
   * Process offer request response through cache layer
   */
  async processResponse(
    requestId: string,
    apiResponse: any,
  ): Promise<APIManagerResponse> {
    try {
      // Cache the offer request
      await DuffelOfferCache.setOfferRequest(requestId, apiResponse);

      // If offers included, cache them too
      if (apiResponse.offers && Array.isArray(apiResponse.offers)) {
        await Promise.all(
          apiResponse.offers.map((offer: any) =>
            DuffelOffersCache.setOffer(offer.id, offer),
          ),
        );
      }

      return {
        success: true,
        data: apiResponse,
        cached: false,
        source: "api",
        stats: {
          cacheTime: `${DUFFEL_CACHE_TTL.OFFER_REQUEST}s`,
        },
      };
    } catch (error) {
      console.error("[OfferRequestManager] Error processing response:", error);
      throw error;
    }
  },

  /**
   * Get offer request with cache awareness
   */
  async getOfferRequest(requestId: string): Promise<APIManagerResponse> {
    try {
      // Try cache first
      const cached = await DuffelOfferCache.getOfferRequest(requestId);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          source: cached.source,
          cachedAt: new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + DUFFEL_CACHE_TTL.OFFER_REQUEST * 1000,
          ).toISOString(),
        };
      }

      return {
        success: false,
        data: null,
        cached: false,
        source: "api",
      };
    } catch (error) {
      console.error(
        "[OfferRequestManager] Error getting offer request:",
        error,
      );
      throw error;
    }
  },

  /**
   * Invalidate offer request cache
   */
  async invalidate(requestId: string): Promise<boolean> {
    await DuffelOfferCache.invalidateOfferRequest(requestId);
    return true;
  },
};

// ============================================================================
// OFFER MANAGER
// ============================================================================

const OfferManager = {
  /**
   * Process offer response through cache layer
   */
  async processResponse(
    offerId: string,
    apiResponse: any,
  ): Promise<APIManagerResponse> {
    try {
      await DuffelOffersCache.setOffer(offerId, apiResponse);

      return {
        success: true,
        data: apiResponse,
        cached: false,
        source: "api",
        stats: {
          cacheTime: `${DUFFEL_CACHE_TTL.OFFER}s`,
        },
      };
    } catch (error) {
      console.error("[OfferManager] Error processing response:", error);
      throw error;
    }
  },

  /**
   * Get offer with cache awareness
   */
  async getOffer(offerId: string): Promise<APIManagerResponse> {
    try {
      const cached = await DuffelOffersCache.getOffer(offerId);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          source: cached.source,
          cachedAt: new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + DUFFEL_CACHE_TTL.OFFER * 1000,
          ).toISOString(),
        };
      }

      return {
        success: false,
        data: null,
        cached: false,
        source: "api",
      };
    } catch (error) {
      console.error("[OfferManager] Error getting offer:", error);
      throw error;
    }
  },
};

// ============================================================================
// ORDER MANAGER
// ============================================================================

export const OrderManager = {
  /**
   * Process order response through cache layer
   */
  async processResponse(
    orderId: string,
    apiResponse: any,
    userId?: string,
  ): Promise<APIManagerResponse> {
    try {
      const orderData = {
        externalId: apiResponse.id || orderId,
        status: apiResponse.status || "pending",
        type: apiResponse.type,
        slices: apiResponse.slices,
        passengers: apiResponse.passengers,
        baseAmount: apiResponse.base_amount,
        taxAmount: apiResponse.tax_amount || 0,
        totalAmount: apiResponse.total_amount,
        currency: apiResponse.total_currency || "USD",
        confirmedAt: apiResponse.confirmed_at
          ? new Date(apiResponse.confirmed_at)
          : null,
        createdAt: new Date(),
        ...apiResponse,
      };

      await DuffelOrderCache.setOrder(orderId, orderData);

      return {
        success: true,
        data: apiResponse,
        cached: false,
        source: "api",
        stats: {
          cacheTime: `${DUFFEL_CACHE_TTL.ORDER}s`,
        },
      };
    } catch (error) {
      console.error("[OrderManager] Error processing response:", error);
      throw error;
    }
  },

  /**
   * Get order with cache awareness
   */
  async getOrder(orderId: string): Promise<APIManagerResponse> {
    try {
      const cached = await DuffelOrderCache.getOrder(orderId);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          source: cached.source,
          cachedAt: new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + DUFFEL_CACHE_TTL.ORDER * 1000,
          ).toISOString(),
        };
      }

      return {
        success: false,
        data: null,
        cached: false,
        source: "api",
      };
    } catch (error) {
      console.error("[OrderManager] Error getting order:", error);
      throw error;
    }
  },

  /**
   * Invalidate order cache after update
   */
  async invalidate(orderId: string, userId?: string): Promise<boolean> {
    await DuffelOrderCache.invalidateOrder(orderId, userId);
    return true;
  },
};

// ============================================================================
// SEAT MAP MANAGER
// ============================================================================

export const SeatMapManager = {
  /**
   * Process seat map response through cache layer
   */
  async processResponse(
    seatMapData: any,
    offerId?: string,
    orderId?: string,
  ): Promise<APIManagerResponse> {
    try {
      await DuffelSeatMapCache.setSeatMap(
        offerId || "none",
        orderId || "none",
        seatMapData,
      );

      return {
        success: true,
        data: seatMapData,
        cached: false,
        source: "api",
        stats: {
          cacheTime: `${DUFFEL_CACHE_TTL.SEAT_MAP}s`,
        },
      };
    } catch (error) {
      console.error("[SeatMapManager] Error processing response:", error);
      throw error;
    }
  },

  /**
   * Get seat map with cache awareness
   */
  async getSeatMap(
    offerId?: string,
    orderId?: string,
  ): Promise<APIManagerResponse> {
    try {
      const cached = await DuffelSeatMapCache.getSeatMap(offerId, orderId);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          source: "redis",
          cachedAt: new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + DUFFEL_CACHE_TTL.SEAT_MAP * 1000,
          ).toISOString(),
        };
      }

      return {
        success: false,
        data: null,
        cached: false,
        source: "api",
      };
    } catch (error) {
      console.error("[SeatMapManager] Error getting seat map:", error);
      throw error;
    }
  },

  /**
   * Invalidate seat map cache
   */
  async invalidate(offerId?: string, orderId?: string): Promise<boolean> {
    await DuffelSeatMapCache.invalidateSeatMap(offerId, orderId);
    return true;
  },
};

// ============================================================================
// AVAILABLE SERVICES MANAGER
// ============================================================================

export const AvailableServicesManager = {
  /**
   * Process available services response through cache layer
   */
  async processResponse(
    orderId: string,
    apiResponse: any,
  ): Promise<APIManagerResponse> {
    try {
      await DuffelServicesCache.setAvailableServices(
        orderId,
        apiResponse.services || apiResponse.data || [],
      );

      return {
        success: true,
        data: apiResponse,
        cached: false,
        source: "api",
        stats: {
          cacheTime: `${DUFFEL_CACHE_TTL.AVAILABLE_SERVICES}s`,
        },
      };
    } catch (error) {
      console.error(
        "[AvailableServicesManager] Error processing response:",
        error,
      );
      throw error;
    }
  },

  /**
   * Get available services with cache awareness
   */
  async getAvailableServices(orderId: string): Promise<APIManagerResponse> {
    try {
      const cached = await DuffelServicesCache.getAvailableServices(orderId);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          source: "redis",
          cachedAt: new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + DUFFEL_CACHE_TTL.AVAILABLE_SERVICES * 1000,
          ).toISOString(),
        };
      }

      return {
        success: false,
        data: null,
        cached: false,
        source: "api",
      };
    } catch (error) {
      console.error(
        "[AvailableServicesManager] Error getting available services:",
        error,
      );
      throw error;
    }
  },

  /**
   * Invalidate services cache
   */
  async invalidate(orderId: string): Promise<boolean> {
    await DuffelServicesCache.invalidateServices(orderId);
    return true;
  },
};

// ============================================================================
// CANCELLATION MANAGER
// ============================================================================

export const CancellationManager = {
  /**
   * Process cancellation response through cache layer
   */
  async processResponse(
    cancellationId: string,
    apiResponse: any,
  ): Promise<APIManagerResponse> {
    try {
      const cancellationData = {
        externalId: apiResponse.id || cancellationId,
        orderId: apiResponse.order_id,
        status: apiResponse.status,
        refundAmount: apiResponse.refund_amount,
        refundCurrency: apiResponse.refund_currency,
        reason: apiResponse.reason,
        ...apiResponse,
      };

      await DuffelCancellationCache.setCancellation(
        cancellationId,
        cancellationData,
      );

      return {
        success: true,
        data: apiResponse,
        cached: false,
        source: "api",
        stats: {
          cacheTime: `${DUFFEL_CACHE_TTL.CANCELLATION}s`,
        },
      };
    } catch (error) {
      console.error("[CancellationManager] Error processing response:", error);
      throw error;
    }
  },

  /**
   * Get cancellation with cache awareness
   */
  async getCancellation(cancellationId: string): Promise<APIManagerResponse> {
    try {
      const cached =
        await DuffelCancellationCache.getCancellation(cancellationId);
      if (cached) {
        return {
          success: true,
          data: cached,
          cached: true,
          source: cached.source,
          cachedAt: new Date().toISOString(),
          expiresAt: new Date(
            Date.now() + DUFFEL_CACHE_TTL.CANCELLATION * 1000,
          ).toISOString(),
        };
      }

      return {
        success: false,
        data: null,
        cached: false,
        source: "api",
      };
    } catch (error) {
      console.error("[CancellationManager] Error getting cancellation:", error);
      throw error;
    }
  },

  /**
   * Invalidate cancellation cache
   */
  async invalidate(cancellationId: string): Promise<boolean> {
    await DuffelCancellationCache.invalidateCancellation(cancellationId);
    return true;
  },
};

// ============================================================================
// BULK CACHE OPERATIONS
// ============================================================================

const CacheBulkOperations = {
  /**
   * Invalidate all Duffel caches for a user
   */
  async invalidateUserData(userId: string): Promise<boolean> {
    await DuffelCacheUtils.invalidatePattern(`*:user:${userId}`);
    return true;
  },

  /**
   * Invalidate all offer-related caches
   */
  async invalidateOffers(): Promise<boolean> {
    await DuffelCacheUtils.invalidatePattern("offer*");
    return true;
  },

  /**
   * Invalidate all order-related caches
   */
  async invalidateOrders(): Promise<boolean> {
    await DuffelCacheUtils.invalidatePattern("order*");
    return true;
  },

  /**
   * Clear entire Duffel cache (use sparingly!)
   */
  async clearAll(): Promise<boolean> {
    await DuffelCacheUtils.clearAll();
    console.warn("[CacheBulkOperations] All Duffel caches cleared");
    return true;
  },

  /**
   * Get cache statistics (for monitoring)
   */
  async getStats(): Promise<{
    service: string;
    timestamp: string;
    note: string;
  }> {
    return {
      service: "duffel-api-manager",
      timestamp: new Date().toISOString(),
      note: "Cache stats available through Redis monitoring tools (redis-cli INFO stats)",
    };
  },
};

export default {
  OfferRequestManager,
  OfferManager,
  OrderManager,
  SeatMapManager,
  AvailableServicesManager,
  CancellationManager,
  CacheBulkOperations,
};
