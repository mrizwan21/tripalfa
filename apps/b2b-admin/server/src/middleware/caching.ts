import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import crypto from 'crypto';
import zlib from 'zlib';

// Cache configuration
export interface CacheConfig {
  ttl: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
  skipCache?: (req: Request) => boolean;
}

// Redis connection
let redisClient: Redis | null = null;

export const initializeRedis = (redisUrl?: string) => {
  try {
    redisClient = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    
    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });

    return redisClient;
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    return null;
  }
};

// Cache middleware factory
export const createCacheMiddleware = (config: CacheConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching if Redis is not available
    if (!redisClient) {
      return next();
    }

    // Check if caching should be skipped
    if (config.skipCache && config.skipCache(req)) {
      return next();
    }

    // Generate cache key
    const cacheKey = config.keyGenerator 
      ? config.keyGenerator(req)
      : generateDefaultKey(req);

    try {
      // Try to get cached response
      const cachedResponse = await redisClient.get(cacheKey);
      
      if (cachedResponse) {
        console.log(`🎯 Cache hit for key: ${cacheKey}`);
        const response = JSON.parse(cachedResponse);
        
        // Set cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey
        });

        return res.status(response.statusCode || 200).json(response.data);
      }

      console.log(`❌ Cache miss for key: ${cacheKey}`);

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data: unknown) {
        // Cache the response
        const responseToCache = {
          statusCode: res.statusCode,
          data: data
        };

        redisClient?.setex(cacheKey, config.ttl, JSON.stringify(responseToCache))
          .then(() => {
            console.log(`💾 Response cached for key: ${cacheKey}`);
          })
          .catch((err) => {
            console.error('Failed to cache response:', err);
          });

        // Set cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey
        });

        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Cache invalidation
export const invalidateCache = async (pattern: string): Promise<void> => {
  if (!redisClient) return;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      console.log(`🗑️  Invalidated ${keys.length} cache entries for pattern: ${pattern}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

// Cache warming
export const warmCache = async (key: string, data: unknown, ttl: number): Promise<void> => {
  if (!redisClient) return;

  try {
    await redisClient.setex(key, ttl, JSON.stringify({
      statusCode: 200,
      data: data
    }));
    console.log(`🔥 Cache warmed for key: ${key}`);
  } catch (error) {
    console.error('Cache warming error:', error);
  }
};

// Default cache key generator
const generateDefaultKey = (req: Request): string => {
  const method = req.method.toLowerCase();
  const path = req.path;
  const query = JSON.stringify(req.query);
  const userAgent = req.get('User-Agent') || 'unknown';
  
  // Create a hash of the request for uniqueness
  const hash = crypto.createHash('md5')
    .update(`${method}:${path}:${query}:${userAgent}`)
    .digest('hex');

  return `cache:${hash}`;
};

// Cache strategies for different endpoints
export const cacheStrategies = {
  // User data - 5 minutes
  user: createCacheMiddleware({
    ttl: 300, // 5 minutes
    keyGenerator: (req) => `user:${req.params.id}`,
    skipCache: (req) => req.method !== 'GET'
  }),

  // Company data - 10 minutes
  company: createCacheMiddleware({
    ttl: 600, // 10 minutes
    keyGenerator: (req) => `company:${req.params.id}`,
    skipCache: (req) => req.method !== 'GET'
  }),

  // Search results - 2 minutes
  search: createCacheMiddleware({
    ttl: 120, // 2 minutes
    keyGenerator: (req) => {
      const queryHash = crypto.createHash('md5')
        .update(JSON.stringify(req.query))
        .digest('hex');
      return `search:${req.path}:${queryHash}`;
    },
    skipCache: (req) => req.method !== 'GET'
  }),

  // Static data - 1 hour
  static: createCacheMiddleware({
    ttl: 3600, // 1 hour
    keyGenerator: (req) => `static:${req.path}`,
    skipCache: (req) => req.method !== 'GET'
  })
};

// Response compression middleware
export const compressionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Check if client accepts gzip
  const acceptEncoding = req.get('Accept-Encoding');
  
  if (!acceptEncoding || !acceptEncoding.includes('gzip')) {
    return next();
  }

  // Override res.json to compress response
  const originalJson = res.json;
  res.json = function(data: unknown) {
    const jsonData = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Only compress if response is large enough
    if (jsonData.length > 1024) {
      const compressed = zlib.gzipSync(jsonData);
      
      res.set({
        'Content-Encoding': 'gzip',
        'Content-Length': compressed.length
      });

      return res.send(compressed);
    }

    return originalJson.call(this, data);
  };

  next();
};

// Request/response logging with performance metrics
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`📥 ${req.method} ${req.path} - ${req.ip}`);

  // Override res.json to log response time
  const originalJson = res.json;
  res.json = function(data: unknown) {
    const responseTime = Date.now() - startTime;
    
    // Log response
    console.log(`📤 ${req.method} ${req.path} - ${res.statusCode} - ${responseTime}ms`);
    
    // Log slow requests
    if (responseTime > 1000) {
      console.warn(`⚠️  Slow request: ${req.method} ${req.path} took ${responseTime}ms`);
    }

    return originalJson.call(this, data);
  };

  next();
};

// Memory usage monitoring
export const memoryMonitoring = () => {
  setInterval(() => {
    const usage = process.memoryUsage();
    const memoryInfo = {
      rss: Math.round(usage.rss / 1024 / 1024) + ' MB', // Resident Set Size
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB', // Total Heap Allocated
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB', // Heap Actually Used
      external: Math.round(usage.external / 1024 / 1024) + ' MB' // External Memory Usage
    };

    console.log('📊 Memory Usage:', memoryInfo);

    // Alert if memory usage is high
    if (usage.heapUsed > 500 * 1024 * 1024) { // 500MB
      console.warn('⚠️  High memory usage detected!');
    }
  }, 30000); // Check every 30 seconds
};

export default {
  initializeRedis,
  createCacheMiddleware,
  invalidateCache,
  warmCache,
  cacheStrategies,
  compressionMiddleware,
  performanceMiddleware,
  memoryMonitoring
};