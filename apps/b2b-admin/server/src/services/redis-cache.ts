import { Redis } from 'ioredis';
import { CACHE_TTL, generateSearchId } from '../utils/cache-config.js';

// Redis Cache Service for Booking Engine
export class RedisCacheService {
  private redis: Redis;

  constructor(redisUrl?: string) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');

    this.redis.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      console.log('Connected to Redis');
    });
  }

  // ===== SEARCH & AUTOCOMPLETE =====

  async getCitySuggestions(query: string, limit: number = 10): Promise<any[]> {
    const cacheKey = `autocomplete:cities:${query.toLowerCase()}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // This would be implemented with database query
    // For now, return mock data
    const suggestions = [
      { name: 'Dubai', country: 'UAE', iata: 'DXB', type: 'city' },
      { name: 'London', country: 'UK', iata: 'LHR', type: 'city' },
      { name: 'New York', country: 'USA', iata: 'NYC', type: 'city' }
    ].filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);

    await this.redis.setex(cacheKey, CACHE_TTL.autocomplete, JSON.stringify(suggestions));
    return suggestions;
  }

  async getAirportSuggestions(query: string, limit: number = 10): Promise<any[]> {
    const cacheKey = `autocomplete:airports:${query.toLowerCase()}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Mock airport data
    const suggestions = [
      { name: 'John F. Kennedy International', city: 'New York', iata: 'JFK', icao: 'KJFK' },
      { name: 'Heathrow', city: 'London', iata: 'LHR', icao: 'EGLL' },
      { name: 'Dubai International', city: 'Dubai', iata: 'DXB', icao: 'OMDB' }
    ].filter(airport =>
      airport.name.toLowerCase().includes(query.toLowerCase()) ||
      airport.city.toLowerCase().includes(query.toLowerCase()) ||
      airport.iata.toLowerCase().includes(query.toLowerCase())
    ).slice(0, limit);

    await this.redis.setex(cacheKey, CACHE_TTL.autocomplete, JSON.stringify(suggestions));
    return suggestions;
  }

  async getPopularDestinations(): Promise<any[]> {
    const cacheKey = 'popular:destinations';
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Mock popular destinations
    const destinations = [
      { name: 'Paris', country: 'France', searches: 1500, image: '🇫🇷' },
      { name: 'London', country: 'UK', searches: 1200, image: '🇬🇧' },
      { name: 'Dubai', country: 'UAE', searches: 1100, image: '🇦🇪' }
    ];

    await this.redis.setex(cacheKey, CACHE_TTL.popularDestinations, JSON.stringify(destinations));
    return destinations;
  }

  // ===== FLIGHT AVAILABILITY & PRICING =====

  async getFlightAvailability(routeId: number, date: string): Promise<any> {
    const cacheKey = `flight:availability:${routeId}:${date}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // This would query external APIs or database
    // Mock data for now
    const availability = {
      economy: 45,
      business: 8,
      first: 2,
      lastUpdated: new Date().toISOString()
    };

    await this.redis.setex(cacheKey, CACHE_TTL.flightAvailability, JSON.stringify(availability));
    return availability;
  }

  async setFlightAvailability(routeId: number, date: string, availability: any): Promise<void> {
    const cacheKey = `flight:availability:${routeId}:${date}`;
    await this.redis.setex(cacheKey, CACHE_TTL.flightAvailability, JSON.stringify(availability));
  }

  async getFlightPricing(routeId: number, date: string, cabinClass: string): Promise<any> {
    const cacheKey = `flight:price:${routeId}:${date}:${cabinClass}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Mock pricing data
    const pricing = {
      basePrice: 450,
      taxes: 50,
      markup: 25,
      finalPrice: 525,
      currency: 'USD',
      lastUpdated: new Date().toISOString()
    };

    await this.redis.setex(cacheKey, CACHE_TTL.flightPricing, JSON.stringify(pricing));
    return pricing;
  }

  async setFlightPricing(routeId: number, date: string, cabinClass: string, pricing: any): Promise<void> {
    const cacheKey = `flight:price:${routeId}:${date}:${cabinClass}`;
    await this.redis.setex(cacheKey, CACHE_TTL.flightPricing, JSON.stringify(pricing));
  }

  // ===== HOTEL AVAILABILITY & PRICING =====

  async getHotelAvailability(hotelId: number, roomTypeId: number, checkin: string, checkout: string): Promise<number> {
    const cacheKey = `hotel:availability:${hotelId}:${roomTypeId}:${checkin}:${checkout}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return parseInt(cached);
    }

    // Mock availability (would check database/external API)
    const available = Math.floor(Math.random() * 10) + 1; // 1-10 rooms

    await this.redis.setex(cacheKey, CACHE_TTL.hotelAvailability, available.toString());
    return available;
  }

  async setHotelAvailability(hotelId: number, roomTypeId: number, checkin: string, checkout: string, available: number): Promise<void> {
    const cacheKey = `hotel:availability:${hotelId}:${roomTypeId}:${checkin}:${checkout}`;
    await this.redis.setex(cacheKey, CACHE_TTL.hotelAvailability, available.toString());
  }

  async getHotelPricing(hotelId: number, roomTypeId: number, checkin: string, checkout: string): Promise<any> {
    const dateRange = `${checkin}_${checkout}`;
    const cacheKey = `hotel:price:${hotelId}:${roomTypeId}:${dateRange}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Mock pricing data
    const pricing = {
      baseRate: 180,
      occupancy: 85,
      surgeMultiplier: 1.2,
      finalRate: 216,
      currency: 'USD',
      breakfastIncluded: false,
      lastUpdated: new Date().toISOString()
    };

    await this.redis.setex(cacheKey, CACHE_TTL.hotelPricing, JSON.stringify(pricing));
    return pricing;
  }

  async setHotelPricing(hotelId: number, roomTypeId: number, checkin: string, checkout: string, pricing: any): Promise<void> {
    const dateRange = `${checkin}_${checkout}`;
    const cacheKey = `hotel:price:${hotelId}:${roomTypeId}:${dateRange}`;
    await this.redis.setex(cacheKey, CACHE_TTL.hotelPricing, JSON.stringify(pricing));
  }

  // ===== SEARCH RESULTS CACHING =====

  async getFlightSearch(searchId: string): Promise<any> {
    const cacheKey = `search:flights:${searchId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  async setFlightSearch(searchId: string, results: any): Promise<void> {
    const cacheKey = `search:flights:${searchId}`;
    const data = {
      results,
      searchId,
      cachedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + CACHE_TTL.searchResults * 1000).toISOString()
    };

    await this.redis.setex(cacheKey, CACHE_TTL.searchResults, JSON.stringify(data));
  }

  async getHotelSearch(searchId: string): Promise<any> {
    const cacheKey = `search:hotels:${searchId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  async setHotelSearch(searchId: string, results: any): Promise<void> {
    const cacheKey = `search:hotels:${searchId}`;
    const data = {
      results,
      searchId,
      cachedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + CACHE_TTL.searchResults * 1000).toISOString()
    };

    await this.redis.setex(cacheKey, CACHE_TTL.searchResults, JSON.stringify(data));
  }

  // ===== USER SESSIONS & CART =====

  async getUserSession(userId: string): Promise<any> {
    const cacheKey = `session:${userId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  async setUserSession(userId: string, sessionData: any): Promise<void> {
    const cacheKey = `session:${userId}`;
    await this.redis.setex(cacheKey, CACHE_TTL.userSession, JSON.stringify(sessionData));
  }

  async getCart(userId: string): Promise<any> {
    const cacheKey = `cart:${userId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  async setCart(userId: string, cartData: any): Promise<void> {
    const cacheKey = `cart:${userId}`;
    await this.redis.setex(cacheKey, CACHE_TTL.cartData, JSON.stringify(cartData));
  }

  async updateCartItemCount(userId: string, count: number): Promise<void> {
    const cart = await this.getCart(userId) || { items: [] };
    cart.itemCount = count;
    cart.updatedAt = new Date().toISOString();
    await this.setCart(userId, cart);
  }

  // ===== RATE LIMITING =====

  async checkRateLimit(userId: string, endpoint: string, window: string = 'minute'): Promise<boolean> {
    const key = `ratelimit:${userId}:${endpoint}:${window}`;
    const now = Date.now();
    const windowMs = window === 'minute' ? 60000 : window === 'hour' ? 3600000 : 86400000;

    // Remove old entries outside the window
    await this.redis.zremrangebyscore(key, 0, now - windowMs);

    // Count remaining requests in window
    const count = await this.redis.zcard(key);

    if (count >= 100) { // 100 requests per minute limit
      return false;
    }

    // Add current request
    await this.redis.zadd(key, now, `req_${now}`);
    await this.redis.pexpire(key, windowMs);

    return true;
  }

  // ===== CACHE INVALIDATION =====

  async invalidateFlightCache(routeId?: number, date?: string): Promise<void> {
    const keys = [];

    if (routeId && date) {
      keys.push(`flight:availability:${routeId}:${date}`);
      keys.push(`flight:price:${routeId}:${date}:*`);
    } else if (routeId) {
      // Get all keys for this route (would need SCAN in production)
      keys.push(`flight:availability:${routeId}:*`);
      keys.push(`flight:price:${routeId}:*`);
    }

    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  async invalidateHotelCache(hotelId?: number): Promise<void> {
    if (hotelId) {
      // Get all keys for this hotel (would need SCAN in production)
      const keys = await this.redis.keys(`hotel:*availability:${hotelId}:*`);
      keys.push(...await this.redis.keys(`hotel:*price:${hotelId}:*`));

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }

  async invalidateSearchCache(type?: 'flights' | 'hotels'): Promise<void> {
    if (type === 'flights') {
      const keys = await this.redis.keys('search:flights:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } else if (type === 'hotels') {
      const keys = await this.redis.keys('search:hotels:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    }
  }

  // ===== CACHE STATISTICS =====

  async getCacheStats(): Promise<any> {
    const info = await this.redis.info('memory', 'stats', 'cpu');

    const hitRate = await this.calculateHitRate();
    const memoryUsage = await this.redis.memory('USAGE', 'cache:*');

    return {
      hitRate: `${(hitRate * 100).toFixed(2)}%`,
      memoryUsage: memoryUsage ? `${(memoryUsage / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
      connectedClients: info.match(/connected_clients:(\d+)/)?.[1] || 'Unknown',
      totalKeys: await this.redis.dbsize(),
      timestamp: new Date().toISOString()
    };
  }

  // Generic helpers for modules that need simple cache operations
  async getRaw(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  async setRaw(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await this.redis.setex(key, ttlSeconds, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  async lpush(key: string, value: string): Promise<number> {
    return await this.redis.lpush(key, value);
  }

  async lrange(key: string, start = 0, stop = -1): Promise<string[]> {
    return await this.redis.lrange(key, start, stop);
  }

  async llen(key: string): Promise<number> {
    return await this.redis.llen(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await this.redis.expire(key, ttlSeconds);
  }

  private async calculateHitRate(): Promise<number> {
    // This is a simplified calculation
    // In production, you'd track hits/misses with separate counters
    try {
      const hits = parseInt(await this.redis.get('metrics:cache:hits') || '0');
      const misses = parseInt(await this.redis.get('metrics:cache:misses') || '0');
      const total = hits + misses;

      return total > 0 ? hits / total : 0;
    } catch {
      return 0;
    }
  }

  // ===== CLEANUP & MAINTENANCE =====

  async cleanupExpiredSessions(): Promise<void> {
    // Find all session keys and check expiration
    const sessionKeys = await this.redis.keys('session:*');
    for (const key of sessionKeys) {
      const ttl = await this.redis.ttl(key);
      if (ttl === -2) { // Key doesn't exist
        continue;
      }
      if (ttl === -1) { // No expiration set
        await this.redis.pexpire(key, CACHE_TTL.userSession * 1000);
      }
    }
  }

  async cleanupOldSearchResults(): Promise<void> {
    const searchKeys = [
      ...await this.redis.keys('search:flights:*'),
      ...await this.redis.keys('search:hotels:*')
    ];

    for (const key of searchKeys) {
      const ttl = await this.redis.ttl(key);
      if (ttl === -1) { // No expiration
        await this.redis.pexpire(key, CACHE_TTL.searchResults * 1000);
      }
    }
  }

  // ===== UTILITY METHODS =====

  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect();
  }

  // Get raw Redis client for advanced operations
  getClient(): Redis {
    return this.redis;
  }
}

// Export singleton instance
export const redisCache = new RedisCacheService();

export default redisCache;
