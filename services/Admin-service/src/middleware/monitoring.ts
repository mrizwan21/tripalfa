import { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';
import { AuthRequest, getUserFromRequest } from '../types/index.js';

// Metrics tracking
interface Metrics {
  requests: {
    total: number;
    byMethod: Record<string, number>;
    byEndpoint: Record<string, number>;
    byStatus: Record<string, number>;
  };
  performance: {
    avgResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
  };
  errors: {
    total: number;
    byType: Record<string, number>;
  };
}

class MetricsCollector {
  // Maximum number of response times to keep in memory (prevents unbounded growth)
  private static readonly MAX_RESPONSE_TIMES = 10000;

  private metrics: Metrics = {
    requests: {
      total: 0,
      byMethod: {},
      byEndpoint: {},
      byStatus: {},
    },
    performance: {
      avgResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
    },
    errors: {
      total: 0,
      byType: {},
    },
  };

  // Circular buffer for O(1) insertions and constant memory usage
  private responseTimes: number[] = new Array(MetricsCollector.MAX_RESPONSE_TIMES);
  private currentIndex = 0;
  private count = 0; // Number of valid entries in buffer
  private runningSum = 0; // Track sum for O(1) average calculation

  recordRequest(method: string, endpoint: string, statusCode: number, responseTime: number): void {
    this.metrics.requests.total++;

    // Track by method
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;

    // Track by endpoint
    this.metrics.requests.byEndpoint[endpoint] =
      (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;

    // Track by status
    this.metrics.requests.byStatus[statusCode] =
      (this.metrics.requests.byStatus[statusCode] || 0) + 1;

    // Circular buffer: O(1) insertion with constant memory
    if (this.count === MetricsCollector.MAX_RESPONSE_TIMES) {
      // Buffer is full: subtract the value we're about to overwrite
      this.runningSum -= this.responseTimes[this.currentIndex];
    } else {
      this.count++;
    }

    this.responseTimes[this.currentIndex] = responseTime;
    this.runningSum += responseTime;
    this.currentIndex = (this.currentIndex + 1) % MetricsCollector.MAX_RESPONSE_TIMES;

    this.metrics.performance.maxResponseTime = Math.max(
      this.metrics.performance.maxResponseTime,
      responseTime
    );
    this.metrics.performance.minResponseTime = Math.min(
      this.metrics.performance.minResponseTime,
      responseTime
    );

    // Calculate average using running sum for O(1) performance
    this.metrics.performance.avgResponseTime = this.runningSum / this.count;
  }

  recordError(errorType: string): void {
    this.metrics.errors.total++;
    this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;
  }

  getMetrics(): Metrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byEndpoint: {},
        byStatus: {},
      },
      performance: {
        avgResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: Infinity,
      },
      errors: {
        total: 0,
        byType: {},
      },
    };
    // Reset circular buffer state
    this.responseTimes = new Array(MetricsCollector.MAX_RESPONSE_TIMES);
    this.currentIndex = 0;
    this.count = 0;
    this.runningSum = 0;
  }
}

const metricsCollector = new MetricsCollector();

// Request monitoring middleware
export const monitoringMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  // Lazily start alert system on first request to avoid issues in test environments
  // where the module may be loaded but not actually used
  if (!alertIntervalStarted) {
    startAlertSystem();
  }

  const startTime = performance.now();

  // Use response 'finish' event instead of overriding res.send
  // This is safer and works with all response methods (send, json, end, etc.)
  res.on('finish', () => {
    const endTime = performance.now();
    const responseTime = endTime - startTime;

    // Record metrics
    metricsCollector.recordRequest(
      req.method,
      req.route?.path || req.path,
      res.statusCode,
      responseTime
    );

    // Log slow requests
    if (responseTime > 1000) {
      console.warn(
        `[Monitoring] Slow request: ${req.method} ${req.path} - ${responseTime.toFixed(2)}ms`
      );
    }
  });

  next();
};

// Health check endpoint with metrics
export const healthCheckWithMetrics = (req: Request, res: Response): void => {
  const metrics = metricsCollector.getMetrics();

  // Calculate uptime
  const uptime = process.uptime();

  // Calculate memory usage
  const memoryUsage = process.memoryUsage();

  // Calculate CPU usage
  const cpuUsage = process.cpuUsage();

  res.json({
    status: 'healthy',
    service: 'b2b-admin-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: uptime,
      human: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
    },
    metrics: {
      requests: metrics.requests,
      performance: {
        ...metrics.performance,
        unit: 'milliseconds',
      },
      errors: metrics.errors,
    },
    system: {
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
  });
};

// Metrics endpoint
export const metricsEndpoint = (req: Request, res: Response): void => {
  const metrics = metricsCollector.getMetrics();

  res.json({
    timestamp: new Date().toISOString(),
    metrics,
  });
};

// Reset metrics endpoint (for testing/debugging)
export const resetMetricsEndpoint = (req: AuthRequest, res: Response): void => {
  // Require authentication first
  const { user, isAdmin } = getUserFromRequest(req);

  if (!user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  // Require admin authorization to prevent abuse
  if (!isAdmin) {
    res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
    return;
  }

  metricsCollector.reset();

  res.json({
    success: true,
    message: 'Metrics reset successfully',
    timestamp: new Date().toISOString(),
  });
};

// Alert system for monitoring
class AlertSystem {
  private thresholds = {
    responseTime: 2000, // ms
    errorRate: 0.05, // 5%
    requestRate: 100, // requests per minute
  };

  private lastCheck = Date.now();
  private requestCount = 0;
  private errorCount = 0;

  checkAlerts(metrics: Metrics): void {
    const now = Date.now();
    const timeDiff = (now - this.lastCheck) / 1000 / 60; // minutes

    if (timeDiff >= 1) {
      // Check response time
      if (metrics.performance.maxResponseTime > this.thresholds.responseTime) {
        this.sendAlert('HIGH_RESPONSE_TIME', {
          maxResponseTime: metrics.performance.maxResponseTime,
          threshold: this.thresholds.responseTime,
        });
      }

      // Check error rate
      const totalRequests = metrics.requests.total;
      const errorRate = totalRequests > 0 ? metrics.errors.total / totalRequests : 0;

      if (errorRate > this.thresholds.errorRate) {
        this.sendAlert('HIGH_ERROR_RATE', {
          errorRate: errorRate * 100,
          threshold: this.thresholds.errorRate * 100,
          totalRequests,
          totalErrors: metrics.errors.total,
        });
      }

      // Check request rate
      const requestRate = totalRequests / timeDiff;
      if (requestRate > this.thresholds.requestRate) {
        this.sendAlert('HIGH_REQUEST_RATE', {
          requestRate,
          threshold: this.thresholds.requestRate,
        });
      }

      this.lastCheck = now;
      this.requestCount = 0;
      this.errorCount = 0;
    }
  }

  private async sendAlert(type: string, data: any): Promise<void> {
    const alert = {
      type,
      timestamp: new Date().toISOString(),
      data,
      severity: this.getSeverity(type),
      service: 'b2b-admin-service',
      environment: process.env.NODE_ENV || 'unknown',
    };

    // Sanitize alert log to prevent potential secret exposure
    // Webhook URL might contain credentials in some configurations
    console.error(`[ALERT] ${type}:`, {
      ...alert,
      webhookConfigured: !!process.env.ALERT_WEBHOOK_URL,
    });

    // Send to configured webhook if available (e.g., Slack, PagerDuty, Datadog)
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        // Use AbortController for timeout to prevent hanging requests
        const controller = new AbortController();
        const parsedTimeout = parseInt(process.env.ALERT_WEBHOOK_TIMEOUT_MS || '10000', 10);
        const timeoutMs = Number.isNaN(parsedTimeout) ? 10000 : parsedTimeout;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(process.env.ALERT_WEBHOOK_SECRET && {
              Authorization: `Bearer ${process.env.ALERT_WEBHOOK_SECRET}`,
            }),
          },
          body: JSON.stringify(alert),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.error(
            `[ALERT] Webhook request timed out after ${process.env.ALERT_WEBHOOK_TIMEOUT_MS || '10000'}ms`
          );
        } else {
          console.error('[ALERT] Failed to send webhook alert:', error);
        }
      }
    }
  }

  private getSeverity(type: string): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
      case 'HIGH_RESPONSE_TIME':
        return 'medium';
      case 'HIGH_ERROR_RATE':
        return 'high';
      case 'HIGH_REQUEST_RATE':
        return 'low';
      default:
        return 'low';
    }
  }
}

const alertSystem = new AlertSystem();

// Periodic monitoring check - lazily initialized to avoid issues in tests
let alertInterval: NodeJS.Timeout | null = null;
let alertIntervalStarted = false;

/**
 * Start the alert system interval for periodic monitoring checks.
 * This is called automatically by monitoringMiddleware on first request,
 * or can be called manually during application startup.
 */
function startAlertSystem(): void {
  if (alertIntervalStarted) return;

  alertIntervalStarted = true;
  alertInterval = setInterval(() => {
    const metrics = metricsCollector.getMetrics();
    alertSystem.checkAlerts(metrics);
  }, 60000); // Check every minute
}

/**
 * Stop the alert system interval. Call this during graceful shutdown or in tests.
 */
function stopAlertSystem(): void {
  if (alertInterval) {
    clearInterval(alertInterval);
    alertInterval = null;
    alertIntervalStarted = false;
  }
}

export { metricsCollector, alertSystem };
