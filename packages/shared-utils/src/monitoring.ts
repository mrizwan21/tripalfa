/**
 * Monitoring & Logging Service
 * Centralized logging with Winston and health monitoring
 */

import * as winston from 'winston';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

// Logger Configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...rest }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        ...rest,
      });
    })
  ),
  defaultMeta: { service: 'tripalfa' },
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, ...rest }) =>
            `${timestamp} [${level}] ${message}${
              Object.keys(rest).length > 0
                ? ' ' + JSON.stringify(rest, null, 2)
                : ''
            }`
        )
      ),
    }),
    // File outputs
    new winston.transports.File({
      filename: process.env.LOG_FILE || 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
    new winston.transports.File({
      filename: process.env.LOG_FILE || 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
});

// Metrics collector
export interface ServiceMetrics {
  service: string;
  timestamp: string;
  uptime: number;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  requests: {
    total: number;
    perSecond: number;
  };
  errors: {
    total: number;
    perSecond: number;
  };
  responseTime: {
    min: number;
    max: number;
    average: number;
  };
  dependencies: {
    database: {
      status: string;
      latency: number;
    };
    cache: {
      status: string;
      latency: number;
    };
  };
}

class MetricsCollector {
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];

  recordRequest(responseTime: number, error?: boolean) {
    this.requestCount++;
    if (error) this.errorCount++;
    this.responseTimes.push(responseTime);
    // Keep last 1000 response times
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }
  }

  getMetrics(): Partial<ServiceMetrics> {
    const uptime = Date.now() - this.startTime;
    const memory = process.memoryUsage();
    const avgResponseTime =
      this.responseTimes.reduce((a, b) => a + b, 0) /
        this.responseTimes.length || 0;

    return {
      uptime,
      memory: {
        rss: memory.rss,
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
      },
      requests: {
        total: this.requestCount,
        perSecond: this.requestCount / (uptime / 1000),
      },
      errors: {
        total: this.errorCount,
        perSecond: this.errorCount / (uptime / 1000),
      },
      responseTime: {
        min: Math.min(...this.responseTimes),
        max: Math.max(...this.responseTimes),
        average: avgResponseTime,
      },
    };
  }

  reset() {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
  }
}

// Request logging middleware
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (data) {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else {
      logger.debug('Request completed', logData);
    }

    return originalSend.call(this, data);
  };

  next();
}

// Error logging middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    statusCode: 500,
    message: 'Internal server error',
    traceID: req.headers['x-trace-id'] || 'unknown',
  });
}

// Health check endpoint
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: Record<string, { status: string; latency: number }>;
  metrics: Partial<ServiceMetrics>;
}

const metricsCollector = new MetricsCollector();

export async function checkHealth(): Promise<HealthStatus> {
  const services: Record<string, { status: string; latency: number }> = {};
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  // Check database
  try {
    const dbStart = Date.now();
    // TODO: Implement actual database health check
    const dbLatency = Date.now() - dbStart;
    services.database = { status: 'up', latency: dbLatency };
  } catch {
    services.database = { status: 'down', latency: -1 };
    overallStatus = 'degraded';
  }

  // Check cache
  try {
    const cacheStart = Date.now();
    // TODO: Implement actual cache health check
    const cacheLatency = Date.now() - cacheStart;
    services.cache = { status: 'up', latency: cacheLatency };
  } catch {
    services.cache = { status: 'down', latency: -1 };
    overallStatus = 'degraded';
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    services,
    metrics: {
      ...metricsCollector.getMetrics(),
      service: process.env.SERVICE_NAME || 'unknown',
      timestamp: new Date().toISOString(),
    },
  };
}

export { logger, metricsCollector };
