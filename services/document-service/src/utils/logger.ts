/**
 * Logging Utility
 * Structured logging for the Document Service
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  message: string;
  data?: any;
  requestId?: string;
  error?: any;
}

/**
 * Create a logger instance for a service/module
 */
export function createLogger(service: string) {
  const logLevel = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
  const logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  const shouldLog = (level: LogLevel): boolean => {
    return logLevels[level] >= logLevels[logLevel];
  };

  const formatMessage = (entry: LogEntry): string => {
    const { timestamp, level, service: svc, message, data, requestId, error } = entry;
    const requestIdStr = requestId ? ` [${requestId}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    const errorStr = error ? ` ERROR: ${error.message || error}` : '';

    return `[${timestamp}] [${level.toUpperCase()}] [${svc}]${requestIdStr} ${message}${dataStr}${errorStr}`;
  };

  return {
    debug: (message: string, data?: any, requestId?: string) => {
      if (shouldLog('debug')) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'debug',
          service,
          message,
          data,
          requestId,
        };
        console.log(formatMessage(entry));
      }
    },

    info: (message: string, data?: any, requestId?: string) => {
      if (shouldLog('info')) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'info',
          service,
          message,
          data,
          requestId,
        };
        console.log(formatMessage(entry));
      }
    },

    warn: (message: string, data?: any, requestId?: string) => {
      if (shouldLog('warn')) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'warn',
          service,
          message,
          data,
          requestId,
        };
        console.warn(formatMessage(entry));
      }
    },

    error: (message: string, error?: any, data?: any, requestId?: string) => {
      if (shouldLog('error')) {
        const entry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'error',
          service,
          message,
          data,
          requestId,
          error,
        };
        console.error(formatMessage(entry));
      }
    },
  };
}

/**
 * Logger middleware for Express
 */
export function loggerMiddleware(req: any, res: any, next: any) {
  const requestId = req.get('x-request-id') || generateRequestId();
  req.requestId = requestId;

  const logger = createLogger('HTTP');

  const startTime = Date.now();

  // Log request
  logger.info(`${req.method} ${req.path}`, { query: req.query }, requestId);

  // Log response
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.path} ${res.statusCode}`, { duration: `${duration}ms` }, requestId);

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
