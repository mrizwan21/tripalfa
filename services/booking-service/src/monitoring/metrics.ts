import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import logger from '../utils/logger';

// Typed metrics interfaces
export interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userAgent?: string;
  ip?: string;
}

export interface ErrorMetrics {
  error: string;
  statusCode: number;
  path: string;
  method: string;
  timestamp: Date;
  stack?: string;
}

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Metrics storage
class MetricsCollector {
  private requests: RequestMetrics[] = [];
  private errors: ErrorMetrics[] = [];
  private performance: PerformanceMetrics[] = [];

  // Record request metrics
  recordRequest(metrics: RequestMetrics): void {
    this.requests.push(metrics);
    this.cleanupOldMetrics();
  }

  // Record error metrics
  recordError(metrics: ErrorMetrics): void {
    this.errors.push(metrics);
    this.cleanupOldMetrics();
  }

  // Record performance metrics
  recordPerformance(metrics: PerformanceMetrics): void {
    this.performance.push(metrics);
    this.cleanupOldMetrics();
  }

  // Get request metrics summary
  getRequestSummary(): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    statusCodes: Record<number, number>;
  } {
    const totalRequests = this.requests.length;
    const totalResponseTime = this.requests.reduce((sum, req) => sum + req.responseTime, 0);
    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
    const errors = this.requests.filter(req => req.statusCode >= 400).length;
    const errorRate = totalRequests > 0 ? (errors / totalRequests) * 100 : 0;

    const statusCodes: Record<number, number> = {};
    this.requests.forEach(req => {
      statusCodes[req.statusCode] = (statusCodes[req.statusCode] || 0) + 1;
    });

    return {
      totalRequests,
      averageResponseTime,
      errorRate,
      statusCodes,
    };
  }

  // Get error metrics summary
  getErrorSummary(): {
    totalErrors: number;
    errorTypes: Record<string, number>;
    topErrorPaths: Array<{ path: string; count: number }>;
  } {
    const totalErrors = this.errors.length;
    const errorTypes: Record<string, number> = {};
    const pathErrors: Record<string, number> = {};

    this.errors.forEach(error => {
      errorTypes[error.error] = (errorTypes[error.error] || 0) + 1;
      const pathKey = `${error.method} ${error.path}`;
      pathErrors[pathKey] = (pathErrors[pathKey] || 0) + 1;
    });

    const topErrorPaths = Object.entries(pathErrors)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors,
      errorTypes,
      topErrorPaths,
    };
  }

  // Get performance metrics summary
  getPerformanceSummary(): {
    operations: Record<string, { avgDuration: number; count: number; minDuration: number; maxDuration: number }>;
  } {
    const operations: Record<string, PerformanceMetrics[]> = {};

    this.performance.forEach(metric => {
      if (!operations[metric.operation]) {
        operations[metric.operation] = [];
      }
      operations[metric.operation].push(metric);
    });

    const summary: Record<string, { avgDuration: number; count: number; minDuration: number; maxDuration: number }> = {};

    Object.entries(operations).forEach(([operation, metrics]) => {
      const durations = metrics.map(m => m.duration);
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const minDuration = Math.min(...durations);
      const maxDuration = Math.max(...durations);

      summary[operation] = {
        avgDuration,
        count: metrics.length,
        minDuration,
        maxDuration,
      };
    });

    return { operations: summary };
  }

  // Cleanup old metrics (keep last 1000 entries)
  private cleanupOldMetrics(): void {
    const maxEntries = 1000;
    
    if (this.requests.length > maxEntries) {
      this.requests = this.requests.slice(-maxEntries);
    }
    
    if (this.errors.length > maxEntries) {
      this.errors = this.errors.slice(-maxEntries);
    }
    
    if (this.performance.length > maxEntries) {
      this.performance = this.performance.slice(-maxEntries);
    }
  }

  // Reset all metrics
  reset(): void {
    this.requests = [];
    this.errors = [];
    this.performance = [];
  }

  // Export metrics for monitoring systems
  exportMetrics(): {
    requests: RequestMetrics[];
    errors: ErrorMetrics[];
    performance: PerformanceMetrics[];
  } {
    return {
      requests: [...this.requests],
      errors: [...this.errors],
      performance: [...this.performance],
    };
  }
}

// Global metrics collector instance
export const metricsCollector = new MetricsCollector();

// Middleware to track request metrics
export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = performance.now();
  const originalSend = res.send;

  res.send = function(body: any): Response {
    const endTime = performance.now();
    const responseTime = Math.round(endTime - startTime);

    const metrics: RequestMetrics = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime,
      timestamp: new Date(),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    };

    metricsCollector.recordRequest(metrics);

    // Log slow requests
    if (responseTime > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
    }

    return originalSend.call(this, body);
  };

  next();
}

// Error tracking middleware
export function errorMetricsMiddleware(err: Error, req: Request, res: Response, next: NextFunction): void {
  const metrics: ErrorMetrics = {
    error: err.message,
    statusCode: res.statusCode,
    path: req.path,
    method: req.method,
    timestamp: new Date(),
    stack: err.stack,
  };

  metricsCollector.recordError(metrics);

  logger.error('Request error', {
    error: err.message,
    statusCode: res.statusCode,
    path: req.path,
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    stack: err.stack,
  });

  next(err);
}

// Performance tracking decorator
export function trackPerformance(operationName: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const startTime = performance.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        const metrics: PerformanceMetrics = {
          operation: `${target.constructor.name}.${propertyKey}`,
          duration,
          timestamp: new Date(),
          metadata: {
            operationName,
            argsLength: args.length,
          },
        };

        metricsCollector.recordPerformance(metrics);

        return result;
      } catch (error) {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        const metrics: PerformanceMetrics = {
          operation: `${target.constructor.name}.${propertyKey}`,
          duration,
          timestamp: new Date(),
          metadata: {
            operationName,
            argsLength: args.length,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        };

        metricsCollector.recordPerformance(metrics);
        throw error;
      }
    };

    return descriptor;
  };
}

// Performance tracking function
export function trackOperation<T>(operationName: string, operation: () => Promise<T>): Promise<T>;
export function trackOperation<T>(operationName: string, operation: () => T): T;
export function trackOperation<T>(operationName: string, operation: (() => T) | (() => Promise<T>)): T | Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = operation();
    
    if (result instanceof Promise) {
      return result.then(res => {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        const metrics: PerformanceMetrics = {
          operation: operationName,
          duration,
          timestamp: new Date(),
        };

        metricsCollector.recordPerformance(metrics);
        return res;
      }).catch(error => {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        const metrics: PerformanceMetrics = {
          operation: operationName,
          duration,
          timestamp: new Date(),
          metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        };

        metricsCollector.recordPerformance(metrics);
        throw error;
      });
    } else {
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      const metrics: PerformanceMetrics = {
        operation: operationName,
        duration,
        timestamp: new Date(),
      };

      metricsCollector.recordPerformance(metrics);
      return result;
    }
  } catch (error) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    const metrics: PerformanceMetrics = {
      operation: operationName,
      duration,
      timestamp: new Date(),
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };

    metricsCollector.recordPerformance(metrics);
    throw error;
  }
}

// Health check endpoint data
export function getHealthCheckData(): {
  uptime: number;
  memory: NodeJS.MemoryUsage;
  cpu: NodeJS.CpuUsage;
  metrics: {
    requests: number;
    errors: number;
    performance: number;
  };
} {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    metrics: {
      requests: metricsCollector.getRequestSummary().totalRequests,
      errors: metricsCollector.getErrorSummary().totalErrors,
      performance: Object.keys(metricsCollector.getPerformanceSummary().operations).length,
    },
  };
}

  // Export metrics in Prometheus format
export function exportPrometheusMetrics(): string {
  const requestSummary = metricsCollector.getRequestSummary();
  const errorSummary = metricsCollector.getErrorSummary();
  const performanceSummary = metricsCollector.getPerformanceSummary();

  let metrics = '';

  // Request metrics
  metrics += `# HELP http_requests_total Total number of HTTP requests\n`;
  metrics += `# TYPE http_requests_total counter\n`;
  metrics += `http_requests_total ${requestSummary.totalRequests}\n\n`;

  metrics += `# HELP http_request_duration_avg Average HTTP request duration in milliseconds\n`;
  metrics += `# TYPE http_request_duration_avg gauge\n`;
  metrics += `http_request_duration_avg ${requestSummary.averageResponseTime}\n\n`;

  metrics += `# HELP http_error_rate HTTP error rate percentage\n`;
  metrics += `# TYPE http_error_rate gauge\n`;
  metrics += `http_error_rate ${requestSummary.errorRate}\n\n`;

  // Error metrics
  metrics += `# HELP http_errors_total Total number of HTTP errors\n`;
  metrics += `# TYPE http_errors_total counter\n`;
  metrics += `http_errors_total ${errorSummary.totalErrors}\n\n`;

  // Performance metrics
  Object.entries(performanceSummary.operations).forEach(([operation, stats]) => {
    metrics += `# HELP operation_duration_avg Average duration of ${operation} in milliseconds\n`;
    metrics += `# TYPE operation_duration_avg gauge\n`;
    metrics += `operation_duration_avg{operation="${operation}"} ${stats.avgDuration}\n\n`;

    metrics += `# HELP operation_duration_min Minimum duration of ${operation} in milliseconds\n`;
    metrics += `# TYPE operation_duration_min gauge\n`;
    metrics += `operation_duration_min{operation="${operation}"} ${stats.minDuration}\n\n`;

    metrics += `# HELP operation_duration_max Maximum duration of ${operation} in milliseconds\n`;
    metrics += `# TYPE operation_duration_max gauge\n`;
    metrics += `operation_duration_max{operation="${operation}"} ${stats.maxDuration}\n\n`;

    metrics += `# HELP operation_calls_total Total number of calls to ${operation}\n`;
    metrics += `# TYPE operation_calls_total counter\n`;
    metrics += `operation_calls_total{operation="${operation}"} ${stats.count}\n\n`;
  });

  return metrics;
}

// Export metricsStore for use in other modules
export const metricsStore = metricsCollector;
