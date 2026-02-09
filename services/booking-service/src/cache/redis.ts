import Redis from 'ioredis';
import logger from '../utils/logger';

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  family: 4, // Use IPv4
};

// Initialize Redis client
const redis = new Redis(redisConfig);

// Event listeners for Redis connection
redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', (error) => {
  logger.error('Redis connection error:', { error });
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

redis.on('ready', () => {
  logger.info('Redis ready for operations');
});

// Cache key prefixes
const CACHE_PREFIXES = {
  BOOKING: 'booking:',
  CUSTOMER: 'customer:',
  COMPANY: 'company:',
  BRANCH: 'branch:',
  SUPPLIER: 'supplier:',
  SEARCH: 'search:',
  STATS: 'stats:',
};

// Cache TTL configurations (in seconds)
const CACHE_TTL = {
  BOOKING: 300,      // 5 minutes
  CUSTOMER: 600,     // 10 minutes
  COMPANY: 1800,     // 30 minutes
  BRANCH: 1800,      // 30 minutes
  SUPPLIER: 3600,    // 1 hour
  SEARCH: 120,       // 2 minutes
  STATS: 300,        // 5 minutes
};

// Cache operations
export class CacheService {
  private redis: Redis;

  constructor() {
    this.redis = redis;
  }

  // Get cached data
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get(key);
      if (!data) return null;
      
      return JSON.parse(data);
    } catch (error) {
      logger.error('Cache get error:', { key, error });
      return null;
    }
  }

  // Set cached data
  async set(key: string, data: any, ttl?: number): Promise<void> {
    try {
      const serializedData = JSON.stringify(data);
      const expiration = ttl || CACHE_TTL.BOOKING;
      
      await this.redis.setex(key, expiration, serializedData);
    } catch (error) {
      logger.error('Cache set error:', { key, error });
    }
  }

  // Delete cached data
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      logger.error('Cache delete error:', { key, error });
    }
  }

  // Delete multiple keys by pattern
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      logger.error('Cache delete pattern error:', { pattern, error });
    }
  }

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', { key, error });
      return false;
    }
  }

  // Increment a counter
  async incr(key: string, ttl?: number): Promise<number> {
    try {
      const result = await this.redis.incr(key);
      if (ttl) {
        await this.redis.expire(key, ttl);
      }
      return result;
    } catch (error) {
      logger.error('Cache increment error:', { key, error });
      return 0;
    }
  }

  // Set expiration for a key
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redis.expire(key, ttl);
    } catch (error) {
      logger.error('Cache expire error:', { key, error });
    }
  }

  // Get cache statistics
  async getStats(): Promise<any> {
    try {
      const info = await this.redis.info('memory');
      const keyspace = await this.redis.info('keyspace');
      
      return {
        memory: info,
        keyspace: keyspace,
        connected: this.redis.status === 'ready'
      };
    } catch (error) {
      logger.error('Cache stats error:', { error });
      return null;
    }
  }

  // Ping Redis to check connectivity
  async ping(): Promise<void> {
    try {
      await this.redis.ping();
    } catch (error) {
      logger.error('Cache ping error:', { error });
    }
  }
}

// Cache key generators
export const cacheKeys = {
  booking: (id: string) => `${CACHE_PREFIXES.BOOKING}${id}`,
  customer: (id: string) => `${CACHE_PREFIXES.CUSTOMER}${id}`,
  company: (id: string) => `${CACHE_PREFIXES.COMPANY}${id}`,
  branch: (id: string) => `${CACHE_PREFIXES.BRANCH}${id}`,
  supplier: (id: string) => `${CACHE_PREFIXES.SUPPLIER}${id}`,
  inventory: (id: string) => `inventory:${id}`,
  search: (query: string) => `${CACHE_PREFIXES.SEARCH}${Buffer.from(query).toString('base64')}`,
  stats: (type: string) => `${CACHE_PREFIXES.STATS}${type}`,
};

// Cache service instance
export const cacheService = new CacheService();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing Redis connection...');
  await redis.quit();
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing Redis connection...');
  await redis.quit();
});

export default redis;