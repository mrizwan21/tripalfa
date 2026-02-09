import { performance } from 'perf_hooks';
import { Request, Response, NextFunction } from 'express';

// Performance metrics interface
interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

interface RequestMetric {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  userAgent?: string;
  ip?: string;
}

interface DatabaseMetric {
  operation: string;
  table: string;
  duration: number;
  timestamp: number;
  success: boolean;
}

interface CacheMetric {
  operation: string;
  key: string;
  hit: boolean;
  duration: number;
  timestamp: number;
}

interface SupplierMetric {
  supplierId: string;
  supplierName: string;
  operation: string;
  duration: number;
  success: boolean;
  error?: string;
  timestamp: number;
}

// Metrics storage
class MetricsCollector {
  private metrics: PerformanceMetric[] = [];
  private requestMetrics: RequestMetric[] = [];
  private databaseMetrics: DatabaseMetric[] = [];
  private cacheMetrics: CacheMetric[] = [];
  private supplierMetrics: SupplierMetric[] = [];

  // Performance metrics
  recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags
    });
  }

  // Request metrics
  recordRequest(metric: RequestMetric): void {
    this.requestMetrics.push(metric);
  }

  // Database metrics
  recordDatabase(metric: DatabaseMetric): void {
    this.databaseMetrics.push(metric);
  }

  // Cache metrics
  recordCache(metric: CacheMetric): void {
    this.cacheMetrics.push(metric);
  }

  // Supplier metrics
  recordSupplier(metric: SupplierMetric): void {
    this.supplierMetrics.push(metric);
  }

  // Get metrics
  getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  getRequestMetrics(): RequestMetric[] {
    return this.requestMetrics;
  }

  getDatabaseMetrics(): DatabaseMetric[] {
    return this.databaseMetrics;
  }

  getCacheMetrics(): CacheMetric[] {
    return this.cacheMetrics;
  }

  getSupplierMetrics(): SupplierMetric[] {
    return this.supplierMetrics;
  }

  // Get aggregated metrics
  getAggregatedRequestMetrics(): {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    totalRequests: number;
  } {
    if (this.requestMetrics.length === 0) {
      return {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        totalRequests: 0
      };
    }

    const durations = this.requestMetrics.map(m => m.duration).sort((a, b) => a - b);
    const errors = this.requestMetrics.filter(m => m.statusCode >= 400).length;

    const avgResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    return {
      avgResponseTime,
      p95ResponseTime: durations[p95Index] || 0,
      p99ResponseTime: durations[p99Index] || 0,
      errorRate: (errors / this.requestMetrics.length) * 100,
      totalRequests: this.requestMetrics.length
    };
  }

  getAggregatedCacheMetrics(): {
    hitRate: number;
    avgHitTime: number;
    avgMissTime: number;
    totalOperations: number;
  } {
    if (this.cacheMetrics.length === 0) {
      return {
        hitRate: 0,
        avgHitTime: 0,
        avgMissTime: 0,
        totalOperations: 0
      };
    }

    const hits = this.cacheMetrics.filter(m => m.hit);
    const misses = this.cacheMetrics.filter(m => !m.hit);

    const hitRate = (hits.length / this.cacheMetrics.length) * 100;
    const avgHitTime = hits.length > 0 ? hits.reduce((a, b) => a + b.duration, 0) / hits.length : 0;
    const avgMissTime = misses.length > 0 ? misses.reduce((a, b) => a + b.duration, 0) / misses.length : 0;

    return {
      hitRate,
      avgHitTime,
      avgMissTime,
      totalOperations: this.cacheMetrics.length
    };
  }

  getAggregatedSupplierMetrics(): {
    [supplierId: string]: {
      avgResponseTime: number;
      errorRate: number;
      totalRequests: number;
      successRate: number;
    }
  } {
    const supplierStats: { [key: string]: SupplierMetric[] } = {};

    this.supplierMetrics.forEach(metric => {
      if (!supplierStats[metric.supplierId]) {
        supplierStats[metric.supplierId] = [];
      }
      supplierStats[metric.supplierId].push(metric);
    });

    const result: {
      [key: string]: {
        avgResponseTime: number;
        errorRate: number;
        totalRequests: number;
        successRate: number;
      }
    } = {};

    Object.entries(supplierStats).forEach(([supplierId, metrics]) => {
      const durations = metrics.map(m => m.duration);
      const errors = metrics.filter(m => !m.success).length;
      const avgResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;

      result[supplierId] = {
        avgResponseTime,
        errorRate: (errors / metrics.length) * 100,
        totalRequests: metrics.length,
        successRate: ((metrics.length - errors) / metrics.length) * 100
      };
    });

    return result;
  }

  // Cleanup old metrics (keep last 24 hours)
  cleanup(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);

    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
    this.requestMetrics = this.requestMetrics.filter(m => m.timestamp > cutoff);
    this.databaseMetrics = this.databaseMetrics.filter(m => m.timestamp > cutoff);
    this.cacheMetrics = this.cacheMetrics.filter(m => m.timestamp > cutoff);
    this.supplierMetrics = this.supplierMetrics.filter(m => m.timestamp > cutoff);
  }
}

// Global metrics collector instance
export const metricsCollector = new MetricsCollector();

// Performance monitoring decorators and utilities
export function measurePerformance(name: string, unit: string = 'ms') {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: unknown[]) {
      const start = performance.now();

      const result = originalMethod.apply(this, args);

      // Handle both sync and async methods
      if (result && typeof result.then === 'function') {
        return result.then((value: unknown) => {
          const end = performance.now();
          const duration = end - start;
          metricsCollector.recordMetric(name, duration, unit);
          return value;
        });
      } else {
        const end = performance.now();
        const duration = end - start;
        metricsCollector.recordMetric(name, duration, unit);
        return result;
      }
    };

    return descriptor;
  };
}

// Request timing middleware
export function timingMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = performance.now();

    // Override res.end to capture timing
    const originalEnd = res.end;
    (res as any).end = function (...args: any[]) {
      const end = performance.now();
      const duration = end - start;

      const metric: RequestMetric = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        timestamp: Date.now(),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      };

      metricsCollector.recordRequest(metric);

      // Add timing header
      res.set('X-Response-Time', `${duration.toFixed(2)}ms`);

      originalEnd.apply(this, args);
    };

    next();
  };
}

// Database operation timing
export class DatabaseMetrics {
  static async trackOperation<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    let success = false;

    try {
      const result = await fn();
      success = true;
      return result;
    } finally {
      const end = performance.now();
      const duration = end - start;

      const metric: DatabaseMetric = {
        operation,
        table,
        duration,
        timestamp: Date.now(),
        success
      };

      metricsCollector.recordDatabase(metric);
    }
  }
}

// Cache operation timing
export class CacheMetrics {
  static async trackOperation<T>(
    operation: string,
    key: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    let hit = false;

    try {
      const result = await fn();
      hit = true; // Assume hit if no error
      return result;
    } finally {
      const end = performance.now();
      const duration = end - start;

      const metric: CacheMetric = {
        operation,
        key,
        hit,
        duration,
        timestamp: Date.now()
      };

      metricsCollector.recordCache(metric);
    }
  }
}

// Supplier operation timing
export class SupplierMetrics {
  static async trackOperation<T>(
    supplierId: string,
    supplierName: string,
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    let success = false;
    let error: string | undefined;

    try {
      const result = await fn();
      success = true;
      return result;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      const end = performance.now();
      const duration = end - start;

      const metric: SupplierMetric = {
        supplierId,
        supplierName,
        operation,
        duration,
        success,
        error,
        timestamp: Date.now()
      };

      metricsCollector.recordSupplier(metric);
    }
  }
}

// Health check metrics
export function getHealthMetrics() {
  const requestStats = metricsCollector.getAggregatedRequestMetrics();
  const cacheStats = metricsCollector.getAggregatedCacheMetrics();
  const supplierStats = metricsCollector.getAggregatedSupplierMetrics();

  return {
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    requests: requestStats,
    cache: cacheStats,
    suppliers: supplierStats,
    activeMetrics: {
      requests: metricsCollector.getRequestMetrics().length,
      cache: metricsCollector.getCacheMetrics().length,
      suppliers: metricsCollector.getSupplierMetrics().length
    }
  };
}

// Memory usage monitoring
export function getMemoryMetrics() {
  const usage = process.memoryUsage();

  return {
    rss: usage.rss,
    heapTotal: usage.heapTotal,
    heapUsed: usage.heapUsed,
    external: usage.external,
    arrayBuffers: (usage as { arrayBuffers?: number }).arrayBuffers || 0,
    timestamp: Date.now()
  };
}

