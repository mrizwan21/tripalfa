/**
 * Flight Module Data Flow Logger
 *
 * Provides comprehensive logging for data flow monitoring across:
 * - Frontend API calls
 * - Cache operations
 * - API Gateway routing
 * - Booking Service processing
 * - External API interactions
 */

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  SUCCESS = "SUCCESS",
  WARN = "WARN",
  ERROR = "ERROR",
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  operation: string;
  stage: "frontend" | "cache" | "gateway" | "service" | "external";
  direction?: "request" | "response" | "internal";
  duration?: number;
  status?: "pending" | "success" | "error" | "cached";
  data?: any;
  error?: string;
  userId?: string;
  sessionId?: string;
}

export interface OperationMetrics {
  operationId: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  requestSize?: number;
  responseSize?: number;
  stage: string;
  status: "pending" | "success" | "error";
  cacheHit?: boolean;
}

export class FlightModuleLogger {
  private static instance: FlightModuleLogger;
  private logs: LogEntry[] = [];
  private metrics: Map<string, OperationMetrics> = new Map();
  private enableConsoleOutput =
    typeof window !== "undefined"
      ? localStorage.getItem("flight-module-debug") === "true"
      : process.env.FLIGHT_MODULE_DEBUG === "true";

  private constructor() {}

  static getInstance(): FlightModuleLogger {
    if (!FlightModuleLogger.instance) {
      FlightModuleLogger.instance = new FlightModuleLogger();
    }
    return FlightModuleLogger.instance;
  }

  /**
   * Log a data flow event
   */
  log(
    level: LogLevel,
    module: string,
    operation: string,
    data?: any,
    options?: {
      stage?: LogEntry["stage"];
      direction?: LogEntry["direction"];
      status?: LogEntry["status"];
      error?: string;
      duration?: number;
    },
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      module,
      operation,
      stage: options?.stage || "frontend",
      direction: options?.direction,
      status: options?.status,
      duration: options?.duration,
      data: this.sanitizeData(data),
      error: options?.error,
    };

    this.logs.push(entry);

    if (this.enableConsoleOutput) {
      this.printLog(entry);
    }

    // Send to monitoring service if available
    this.sendToMonitoring(entry);
  }

  /**
   * Start tracking an operation
   */
  startOperation(operationId: string, operation: string, stage: string): void {
    const metrics: OperationMetrics = {
      operationId,
      operation,
      startTime: Date.now(),
      duration: undefined,
      stage,
      status: "pending",
    };
    this.metrics.set(operationId, metrics);

    this.log(
      LogLevel.DEBUG,
      "operation",
      `Started: ${operation}`,
      { operationId },
      { stage: stage as any, direction: "internal", status: "pending" },
    );
  }

  /**
   * End tracking an operation
   */
  endOperation(
    operationId: string,
    success: boolean,
    data?: any,
    error?: string,
  ): OperationMetrics | undefined {
    const metrics = this.metrics.get(operationId);
    if (!metrics) return undefined;

    metrics.endTime = Date.now();
    metrics.duration = metrics.endTime - metrics.startTime;
    metrics.status = success ? "success" : "error";

    this.log(
      success ? LogLevel.SUCCESS : LogLevel.ERROR,
      "operation",
      `Completed: ${metrics.operation}`,
      {
        duration: `${metrics.duration}ms`,
        ...data,
      },
      {
        stage: metrics.stage as any,
        direction: "internal",
        status: metrics.status,
        duration: metrics.duration,
        error,
      },
    );

    return metrics;
  }

  /**
   * Log API request
   */
  logRequest(
    module: string,
    method: string,
    endpoint: string,
    data?: any,
    operationId?: string,
  ): string {
    const id = operationId || this.generateOperationId();
    this.startOperation(id, `${method} ${endpoint}`, "gateway");

    this.log(
      LogLevel.INFO,
      module,
      `${method} ${endpoint}`,
      { operationId: id, requestSize: this.estimateSize(data) },
      {
        stage: "gateway",
        direction: "request",
        status: "pending",
      },
    );

    return id;
  }

  /**
   * Log API response
   */
  logResponse(
    module: string,
    operationId: string,
    statusCode: number,
    data?: any,
    cachedFromLayer?: string,
  ): void {
    const isCached = !!cachedFromLayer;
    const metrics = this.endOperation(operationId, statusCode < 400, {
      statusCode,
      responseSize: this.estimateSize(data),
      cacheHit: isCached,
    });

    const level = statusCode < 400 ? LogLevel.SUCCESS : LogLevel.ERROR;
    this.log(
      level,
      module,
      `Response ${statusCode}`,
      {
        operationId,
        cachedFrom: cachedFromLayer,
        duration: `${metrics?.duration}ms`,
      },
      {
        stage: isCached ? "cache" : "gateway",
        direction: "response",
        status: isCached ? "cached" : "success",
        duration: metrics?.duration,
      },
    );
  }

  /**
   * Log cache operations
   */
  logCache(
    operation: "hit" | "miss" | "set" | "clear",
    key: string,
    ttl?: number,
  ): void {
    const icon =
      operation === "hit" ? "✓" : operation === "miss" ? "✗" : operation;

    this.log(
      operation === "hit" ? LogLevel.SUCCESS : LogLevel.DEBUG,
      "cache",
      `Cache ${operation.toUpperCase()}: ${key}`,
      { key, ttl },
      { stage: "cache", status: operation === "hit" ? "cached" : "pending" },
    );
  }

  /**
   * Get logs for a specific module
   */
  getModuleLogs(module: string): LogEntry[] {
    return this.logs.filter((log) => log.module === module);
  }

  /**
   * Get all logs
   */
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get performance metrics
   */
  getMetrics(): OperationMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get average operation duration
   */
  getAverageDuration(operation?: string): number {
    let metrics = Array.from(this.metrics.values());
    if (operation) {
      metrics = metrics.filter((m) => m.operation.includes(operation));
    }

    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return total / metrics.length;
  }

  /**
   * Get cache hit rate
   */
  getCacheHitRate(): number {
    const cacheLogs = this.logs.filter(
      (log) => log.stage === "cache" && log.data?.cachedFrom,
    );
    if (cacheLogs.length === 0) return 0;

    const hits = cacheLogs.filter((log) => log.status === "cached").length;
    return (hits / cacheLogs.length) * 100;
  }

  /**
   * Generate a performance report
   */
  generateReport() {
    const metrics = this.getMetrics();
    const cachedOperations = metrics.filter((m) => m.cacheHit);
    const failedOperations = metrics.filter((m) => m.status === "error");

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalOperations: metrics.length,
        successfulOperations: metrics.filter((m) => m.status === "success")
          .length,
        failedOperations: failedOperations.length,
        cachedOperations: cachedOperations.length,
        averageDuration: `${this.getAverageDuration().toFixed(2)}ms`,
        cacheHitRate: `${this.getCacheHitRate().toFixed(1)}%`,
      },
      slowestOperations: metrics
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .slice(0, 5)
        .map((m) => ({
          operation: m.operation,
          duration: `${m.duration}ms`,
        })),
      failedOperations: failedOperations.map((m) => ({
        operation: m.operation,
        stage: m.stage,
      })),
      operationsByStage: Array.from(
        new Set(metrics.map((m) => m.stage)),
      ).reduce(
        (acc, stage) => {
          acc[stage] = metrics.filter((m) => m.stage === stage).length;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  /**
   * Clear all logs and metrics
   */
  clear(): void {
    this.logs = [];
    this.metrics.clear();
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(
      {
        logs: this.logs,
        metrics: Array.from(this.metrics.values()),
        report: this.generateReport(),
      },
      null,
      2,
    );
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private printLog(entry: LogEntry): void {
    const color = this.getLevelColor(entry.level);
    const prefix = `[${entry.timestamp}] [${entry.level}] [${entry.module}]`;

    console.log(
      `%c${prefix} ${entry.operation}`,
      `color: ${color}; font-weight: bold`,
    );

    if (entry.data) {
      console.table(entry.data);
    }

    if (entry.error) {
      console.error(`Error: ${entry.error}`);
    }
  }

  private getLevelColor(level: LogLevel): string {
    const colors: Record<LogLevel, string> = {
      DEBUG: "gray",
      INFO: "blue",
      SUCCESS: "green",
      WARN: "orange",
      ERROR: "red",
    };
    return colors[level] || "black";
  }

  private sanitizeData(data: any): any {
    if (!data) return undefined;

    // Remove sensitive data
    const sensitiveKeys = [
      "token",
      "apiKey",
      "password",
      "secret",
      "credit_card",
      "ssn",
    ];

    const sanitized = JSON.parse(JSON.stringify(data));

    const remove = (obj: any) => {
      for (const key in obj) {
        if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
          obj[key] = "[REDACTED]";
        } else if (typeof obj[key] === "object") {
          remove(obj[key]);
        }
      }
    };

    remove(sanitized);
    return sanitized;
  }

  private estimateSize(data: any): number {
    if (!data) return 0;
    return JSON.stringify(data).length;
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendToMonitoring(entry: LogEntry): void {
    // Implement based on your monitoring service
    // e.g., Sentry, Datadog, New Relic, etc.
    if (
      typeof window !== "undefined" &&
      (window as any).__FLIGHT_MODULE_MONITORING__
    ) {
      (window as any).__FLIGHT_MODULE_MONITORING__(entry);
    }
  }
}

// Export singleton instance
export const flightLogger = FlightModuleLogger.getInstance();

// Helper functions for common operations
export function logFlightSearch(
  origin: string,
  destination: string,
  operationId?: string,
): string {
  const id = flightLogger.logRequest(
    "duffelFlightService",
    "POST",
    "/offer-requests",
    { origin, destination },
    operationId,
  );
  return id;
}

export function logBookingFlow(
  offerId: string,
  stage: "search" | "hold" | "pay" | "ticket" | "cancel",
  operationId?: string,
): string {
  const id = flightLogger.logRequest(
    "flightBookingOrchestrator",
    "POST",
    `/booking/${stage}`,
    { offerId },
    operationId,
  );
  return id;
}
