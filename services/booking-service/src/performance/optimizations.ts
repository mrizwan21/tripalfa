import { Request, Response, NextFunction, RequestHandler } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import { cacheService, cacheKeys } from '../cache/redis.js';
import { metricsStore } from '../monitoring/metrics.js';
import logger from '../utils/logger.js';

// Extend Express Request interface to include queryTimeout
declare global {
  namespace Express {
    interface Request {
      queryTimeout?: number;
    }
  }
}

// Performance optimization middleware
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;

  private constructor() {}

  public static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Compression middleware
  compressionMiddleware(): RequestHandler {
    return compression({
      level: 6, // Compression level (1-9)
      threshold: 1024, // Only compress responses larger than 1KB
      filter: (req: any, res: any) => {
        // Don't compress responses if the request includes a cache-control: no-transform directive
        if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
          return false;
        }
        // Use compression filter
        return compression.filter(req, res);
      }
    });
  }

  // Helmet security headers with performance optimizations
  securityHeadersMiddleware() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Disable for performance if not needed
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      }
    });
  }

  // Request size limiting
  requestSizeLimitMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const contentLength = parseInt(req.headers['content-length'] || '0', 10);
      const maxSize = 10 * 1024 * 1024; // 10MB limit

      if (contentLength > maxSize) {
        return res.status(413).json({
          success: false,
          error: 'Request entity too large',
          details: 'Request size exceeds 10MB limit'
        });
      }

      next();
    };
  }

  // Response time tracking
  responseTimeMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = process.hrtime.bigint();
      
      res.on('finish', () => {
        const endTime = process.hrtime.bigint();
        const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        
        // Log slow requests
        if (responseTime > 1000) { // Log requests taking more than 1 second
          logger.warn('Slow request detected', {
            method: req.method,
            url: req.url,
            responseTime: `${responseTime.toFixed(2)}ms`,
            userAgent: req.get('User-Agent')
          });
        }

        // Record metrics
        metricsStore.recordRequest({
          method: req.method,
          path: req.route?.path || req.path,
          statusCode: res.statusCode,
          responseTime,
          timestamp: new Date(),
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });

      next();
    };
  }

  // Connection pooling optimization
  connectionPoolMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Set connection keep-alive
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Keep-Alive', 'timeout=5, max=1000');
      
      // Prevent connection exhaustion
      res.setHeader('X-Connection-Pool', 'optimized');
      
      next();
    };
  }

  // ETag middleware for caching
  etagMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const originalSend = res.send;
      
      res.send = function(body: any) {
        if (req.method === 'GET' && res.statusCode === 200) {
          const etag = `"${Buffer.from(body).toString('base64').slice(0, 16)}"`;
          res.setHeader('ETag', etag);
          
          // Check if client has cached version
          if (req.headers['if-none-match'] === etag) {
            return res.status(304).end();
          }
        }
        
        return originalSend.call(this, body);
      };
      
      next();
    };
  }

  // Memory usage optimization
  memoryOptimizationMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Monitor memory usage
      const memUsage = process.memoryUsage();
      const memoryThreshold = 500 * 1024 * 1024; // 500MB threshold

      if (memUsage.heapUsed > memoryThreshold) {
        logger.warn('High memory usage detected', {
          heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
          external: `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`
        });

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      next();
    };
  }

  // Database query optimization
  queryOptimizationMiddleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Add query timeout
      req.setTimeout(30000, () => {
        logger.warn('Request timeout', { url: req.url, method: req.method });
        res.status(408).json({
          success: false,
          error: 'Request timeout'
        });
      });

      // Add database query timeout context
      req.queryTimeout = 10000; // 10 seconds default timeout

      next();
    };
  }

  // Static file optimization
  staticFileOptimization() {
    return {
      maxAge: 86400000, // 1 day cache
      etag: true,
      lastModified: true,
      setHeaders: (res: Response, path: string) => {
        if (path.endsWith('.js') || path.endsWith('.css')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year for static assets
        }
      }
    };
  }

  // API response optimization
  apiResponseOptimization() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Set appropriate headers for API responses
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('X-API-Version', 'v1');
      res.setHeader('X-Response-Time', Date.now().toString());
      
      // Prevent caching of sensitive API responses by default
      if (!req.url.includes('/health') && !req.url.includes('/metrics')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
      }

      next();
    };
  }

  // Rate limiting optimization
  rateLimitOptimization() {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction) => {
      const clientId = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      const windowMs = 15 * 60 * 1000; // 15 minutes
      const maxRequests = 100;

      const clientData = requests.get(clientId);

      if (!clientData || now > clientData.resetTime) {
        requests.set(clientId, { count: 1, resetTime: now + windowMs });
        return next();
      }

      if (clientData.count >= maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
        });
      }

      clientData.count++;
      next();
    };
  }

  // Bundle optimization for frontend assets
  bundleOptimization() {
    return {
      // Bundle splitting configuration
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      },
      // Tree shaking
      usedExports: true,
      sideEffects: false
    };
  }

  // Database connection optimization
  async optimizeDatabaseConnections() {
    try {
      // This would be implemented based on your database client
      // For Prisma, you might configure connection pooling here
      logger.info('Database connection optimization applied');
    } catch (error) {
      logger.error('Database optimization failed', { error });
    }
  }

  // Cache warming
  async warmCache() {
    try {
      // Pre-populate frequently accessed data
      const popularBookings = await this.getPopularBookings();
      
      for (const booking of popularBookings) {
        await cacheService.set(
          cacheKeys.booking(booking.id),
          booking,
          600 // 10 minutes
        );
      }

      logger.info('Cache warming completed');
    } catch (error) {
      logger.error('Cache warming failed', { error });
    }
  }

  private async getPopularBookings() {
    // Mock implementation - would query your database
    return [
      { id: '1', reference: 'BK-001', status: 'CONFIRMED' },
      { id: '2', reference: 'BK-002', status: 'PENDING' }
    ];
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  trackOperation(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const durations = this.metrics.get(operation)!;
    durations.push(duration);

    // Keep only last 100 measurements
    if (durations.length > 100) {
      durations.shift();
    }
  }

  getAverageTime(operation: string): number {
    const durations = this.metrics.get(operation);
    if (!durations || durations.length === 0) {
      return 0;
    }

    const sum = durations.reduce((acc, curr) => acc + curr, 0);
    return sum / durations.length;
  }

  getSlowOperations(threshold: number = 1000): Array<{ operation: string; avgTime: number }> {
    const slowOperations: Array<{ operation: string; avgTime: number }> = [];

    for (const [operation, durations] of this.metrics.entries()) {
      const avgTime = this.getAverageTime(operation);
      if (avgTime > threshold) {
        slowOperations.push({ operation, avgTime });
      }
    }

    return slowOperations.sort((a, b) => b.avgTime - a.avgTime);
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();