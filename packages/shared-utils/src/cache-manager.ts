import NodeCache from 'node-cache';

export class StaticDataCacheManager {
  private cache: NodeCache;
  private readonly DEFAULT_TTL = 3600; // 1 hour
  private readonly LONG_TTL = 86400; // 24 hours

  constructor() {
    this.cache = new NodeCache({
      stdTTL: this.DEFAULT_TTL,
      checkperiod: 600,
      useClones: false,
    });
  }

  /**
   * Get countries with caching
   */
  async getCountries(fetchFn: () => Promise<any[]>): Promise<any[]> {
    const cacheKey = 'countries_list';
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log('✅ Countries from cache');
      return cached;
    }

    const data = await fetchFn();
    this.cache.set(cacheKey, data, this.LONG_TTL);
    console.log('📥 Countries cached (24h)');
    return data;
  }

  /**
   * Get languages with caching
   */
  async getLanguages(fetchFn: () => Promise<any[]>): Promise<any[]> {
    const cacheKey = 'languages_list';
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log('✅ Languages from cache');
      return cached;
    }

    const data = await fetchFn();
    this.cache.set(cacheKey, data, this.LONG_TTL);
    console.log('📥 Languages cached (24h)');
    return data;
  }

  /**
   * Get currencies with caching
   */
  async getCurrencies(fetchFn: () => Promise<any[]>): Promise<any[]> {
    const cacheKey = 'currencies_list';
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log('✅ Currencies from cache');
      return cached;
    }

    const data = await fetchFn();
    this.cache.set(cacheKey, data, this.LONG_TTL);
    console.log('📥 Currencies cached (24h)');
    return data;
  }

  /**
   * Get cities by country with caching
   */
  async getCitiesByCountry(
    countryCode: string,
    fetchFn: (code: string) => Promise<any[]>
  ): Promise<any[]> {
    const cacheKey = `cities_${countryCode}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log(`✅ Cities for ${countryCode} from cache`);
      return cached;
    }

    const data = await fetchFn(countryCode);
    this.cache.set(cacheKey, data, this.DEFAULT_TTL);
    console.log(`📥 Cities for ${countryCode} cached`);
    return data;
  }

  /**
   * Invalidate specific cache
   */
  invalidate(key: string): void {
    this.cache.del(key);
    console.log(`🗑️  Cache invalidated: ${key}`);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.flushAll();
    console.log('🗑️  All cache cleared');
  }

  /**
   * Get cache stats
   */
  getStats() {
    return this.cache.getStats();
  }
}

export const cacheManager = new StaticDataCacheManager();
