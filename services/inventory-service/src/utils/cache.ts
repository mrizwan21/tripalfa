import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';

// Cache configuration
const CACHE_CONFIG = {
  // Supplier configuration cache - 10 minutes
  SUPPLIER_CONFIG_TTL: 600,
  // Pricing rules cache - 5 minutes
  PRICING_RULES_TTL: 300,
  // Search results cache - 2 minutes
  SEARCH_RESULTS_TTL: 120,
  // API vendor cache - 15 minutes
  API_VENDOR_TTL: 900,
  // Default cache TTL - 1 hour
  DEFAULT_TTL: 3600
};

// Initialize caches with different TTLs for different data types
const supplierCache = new NodeCache({
  stdTTL: CACHE_CONFIG.SUPPLIER_CONFIG_TTL,
  checkperiod: 60,
  useClones: false
});

const pricingCache = new NodeCache({
  stdTTL: CACHE_CONFIG.PRICING_RULES_TTL,
  checkperiod: 30,
  useClones: false
});

const searchCache = new NodeCache({
  stdTTL: CACHE_CONFIG.SEARCH_RESULTS_TTL,
  checkperiod: 10,
  useClones: false
});

const apiVendorCache = new NodeCache({
  stdTTL: CACHE_CONFIG.API_VENDOR_TTL,
  checkperiod: 120,
  useClones: false
});

// Cache keys
const CACHE_KEYS = {
  ACTIVE_SUPPLIERS: 'active_suppliers',
  SUPPLIER_BY_ID: (id: string) => `supplier:${id}`,
  PRICING_RULES: 'pricing_rules',
  PRICING_RULES_BY_TARGET: (targetType: string, targetId?: string) =>
    `pricing_rules:${targetType}:${targetId || 'global'}`,
  SEARCH_FLIGHTS: (params: Record<string, unknown>) => `search:flights:${JSON.stringify(params)}`,
  SEARCH_HOTELS: (params: Record<string, unknown>) => `search:hotels:${JSON.stringify(params)}`,
  API_VENDOR_BY_ID: (id: string) => `api_vendor:${id}`,
  API_VENDOR_MAPPINGS: (vendorId: string) => `api_vendor_mappings:${vendorId}`
};

export class CacheService {
  // Supplier configuration caching
  static async getActiveSuppliers(): Promise<unknown[] | null> {
    return supplierCache.get(CACHE_KEYS.ACTIVE_SUPPLIERS);
  }

  static async setActiveSuppliers(suppliers: unknown[]): Promise<void> {
    supplierCache.set(CACHE_KEYS.ACTIVE_SUPPLIERS, suppliers);
  }

  static async getSupplierById(id: string): Promise<unknown | null> {
    return supplierCache.get(CACHE_KEYS.SUPPLIER_BY_ID(id));
  }

  static async setSupplierById(id: string, supplier: unknown): Promise<void> {
    supplierCache.set(CACHE_KEYS.SUPPLIER_BY_ID(id), supplier);
  }

  static invalidateSupplierCache(supplierId?: string): void {
    if (supplierId) {
      supplierCache.del(CACHE_KEYS.SUPPLIER_BY_ID(supplierId));
    }
    supplierCache.del(CACHE_KEYS.ACTIVE_SUPPLIERS);
  }

  // Pricing rules caching
  static async getPricingRules(): Promise<unknown[] | null> {
    return pricingCache.get(CACHE_KEYS.PRICING_RULES);
  }

  static async setPricingRules(rules: unknown[]): Promise<void> {
    pricingCache.set(CACHE_KEYS.PRICING_RULES, rules);
  }

  static async getPricingRulesByTarget(targetType: string, targetId?: string): Promise<unknown[] | null> {
    return pricingCache.get(CACHE_KEYS.PRICING_RULES_BY_TARGET(targetType, targetId));
  }

  static async setPricingRulesByTarget(targetType: string, targetId: string | undefined, rules: unknown[]): Promise<void> {
    pricingCache.set(CACHE_KEYS.PRICING_RULES_BY_TARGET(targetType, targetId), rules);
  }

  static invalidatePricingCache(targetType?: string, targetId?: string): void {
    if (targetType && targetId) {
      pricingCache.del(CACHE_KEYS.PRICING_RULES_BY_TARGET(targetType, targetId));
    }
    pricingCache.del(CACHE_KEYS.PRICING_RULES);
  }

  // Search results caching
  static async getSearchResults(key: string): Promise<unknown | null> {
    return searchCache.get(key);
  }

  static async setSearchResults(key: string, results: unknown): Promise<void> {
    searchCache.set(key, results);
  }

  static invalidateSearchCache(): void {
    searchCache.flushAll();
  }

  // API vendor caching
  static async getApiVendorById(id: string): Promise<unknown | null> {
    return apiVendorCache.get(CACHE_KEYS.API_VENDOR_BY_ID(id));
  }

  static async setApiVendorById(id: string, vendor: unknown): Promise<void> {
    apiVendorCache.set(CACHE_KEYS.API_VENDOR_BY_ID(id), vendor);
  }

  static async getApiVendorMappings(vendorId: string): Promise<unknown[] | null> {
    return apiVendorCache.get(CACHE_KEYS.API_VENDOR_MAPPINGS(vendorId));
  }

  static async setApiVendorMappings(vendorId: string, mappings: unknown[]): Promise<void> {
    apiVendorCache.set(CACHE_KEYS.API_VENDOR_MAPPINGS(vendorId), mappings);
  }

  static invalidateApiVendorCache(vendorId?: string): void {
    if (vendorId) {
      apiVendorCache.del(CACHE_KEYS.API_VENDOR_BY_ID(vendorId));
      apiVendorCache.del(CACHE_KEYS.API_VENDOR_MAPPINGS(vendorId));
    } else {
      apiVendorCache.flushAll();
    }
  }

  // Cache statistics
  static getStats(): {
    supplier: unknown;
    pricing: unknown;
    search: unknown;
    apiVendor: unknown;
  } {
    return {
      supplier: supplierCache.getStats(),
      pricing: pricingCache.getStats(),
      search: searchCache.getStats(),
      apiVendor: apiVendorCache.getStats()
    };
  }

  // Cache cleanup
  static flushAll(): void {
    supplierCache.flushAll();
    pricingCache.flushAll();
    searchCache.flushAll();
    apiVendorCache.flushAll();
  }

  static flushExpired(): void {
    supplierCache.flushAll();
    pricingCache.flushAll();
    searchCache.flushAll();
    apiVendorCache.flushAll();
  }
}

// Cache middleware for Express
export function cacheMiddleware(ttl: number = CACHE_CONFIG.DEFAULT_TTL) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.method}:${req.originalUrl}:${JSON.stringify(req.body || {})}`;

    // Try to get cached response
    const cachedResponse = searchCache.get(key);
    if (cachedResponse) {
      res.set('X-Cache', 'HIT');
      return res.json(cachedResponse);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function (body: unknown) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        searchCache.set(key, body, ttl);
        res.set('X-Cache', 'MISS');
      }
      return originalJson.call(this, body);
    };

    next();
  };
}

// Cache warming functions
export class CacheWarmer {
  static async warmSupplierCache(prisma: unknown): Promise<void> {
    try {
      const activeSuppliers = await prisma.supplier.findMany({
        where: { isActive: true },
        include: {
          vendor: { include: { mappings: { where: { isActive: true } } } },
          contracts: { where: { status: 'ACTIVE' } }
        }
      });

      await CacheService.setActiveSuppliers(activeSuppliers);

      // Cache individual suppliers
      for (const supplier of activeSuppliers) {
        await CacheService.setSupplierById(supplier.id, supplier);
      }
    } catch (error) {
      console.error('Failed to warm supplier cache:', error);
    }
  }

  static async warmPricingCache(prisma: unknown): Promise<void> {
    try {
      const rules = await prisma.pricingRule.findMany({
        orderBy: { priority: 'desc' }
      });

      await CacheService.setPricingRules(rules);

      // Cache rules by target type
      const groupedRules = groupBy(rules, 'targetType');
      for (const [targetType, rulesForType] of Object.entries(groupedRules)) {
        const groupedByTargetId = groupBy(rulesForType, 'targetId');
        for (const [targetId, rulesForTarget] of Object.entries(groupedByTargetId)) {
          // Explicit cast or ensure type compatibility if needed, using 'as string' for key
          await CacheService.setPricingRulesByTarget(targetType, targetId || undefined, rulesForTarget);
        }
      }
    } catch (error) {
      console.error('Failed to warm pricing cache:', error);
    }
  }

  static async warmApiVendorCache(prisma: unknown): Promise<void> {
    try {
      const vendors = await prisma.apiVendor.findMany({
        include: { mappings: { where: { isActive: true } } }
      });

      for (const vendor of vendors) {
        await CacheService.setApiVendorById(vendor.id, vendor);
        await CacheService.setApiVendorMappings(vendor.id, vendor.mappings);
      }
    } catch (error) {
      console.error('Failed to warm API vendor cache:', error);
    }
  }

  static async warmAllCaches(prisma: unknown): Promise<void> {
    await Promise.all([
      this.warmSupplierCache(prisma),
      this.warmPricingCache(prisma),
      this.warmApiVendorCache(prisma)
    ]);
  }
}

// Helper function to group array by key
function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const groupKey = String(item[key]);
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

// Cache invalidation strategies
export class CacheInvalidation {
  static async invalidateOnSupplierChange(supplierId: string, prisma: unknown): Promise<void> {
    // Invalidate supplier cache
    CacheService.invalidateSupplierCache(supplierId);

    // Re-warm the cache
    await CacheWarmer.warmSupplierCache(prisma);
  }

  static async invalidateOnPricingRuleChange(prisma: unknown, targetType: string, targetId?: string): Promise<void> {
    // Invalidate pricing cache
    CacheService.invalidatePricingCache(targetType, targetId);

    // Re-warm the cache
    await CacheWarmer.warmPricingCache(prisma);
  }

  static async invalidateOnApiVendorChange(vendorId: string, prisma: unknown): Promise<void> {
    // Invalidate API vendor cache
    CacheService.invalidateApiVendorCache(vendorId);

    // Re-warm the cache
    await CacheWarmer.warmApiVendorCache(prisma);
  }
}

export { CACHE_CONFIG, CACHE_KEYS };