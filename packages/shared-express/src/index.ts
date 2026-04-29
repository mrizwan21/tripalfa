// ============================================================
// OTA PLATFORM - SHARED EXPRESS
// ============================================================
// Common Express.js middleware factories and utilities
// ============================================================

import express, { Request, Response, NextFunction, Application, ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// ============================================================
// INTERFACES
// ============================================================

export interface MiddlewareConfig {
  corsOrigin?: string | string[];
  corsCredentials?: boolean;
  morganFormat?: string;
  jsonLimit?: string;
  urlencodedLimit?: string;
}

export interface AsyncHandler {
  (fn: (req: Request, res: Response) => Promise<any>): (req: Request, res: Response, next: NextFunction) => void;
}

export interface HealthCheckOptions {
  serviceName: string;
  healthCheckFn?: () => Promise<boolean>;
  includeTimestamp?: boolean;
}

// ============================================================
// MIDDLEWARE SETUP FACTORY
// ============================================================

/**
 * Creates and configures an Express app with standard middleware
 * @param config - Middleware configuration options
 * @returns Configured Express application
 */
export function createExpressApp(config: MiddlewareConfig = {}): Application {
  const {
    corsOrigin = process.env.API_GATEWAY_URL || 'http://localhost:3030',
    corsCredentials = true,
    morganFormat = 'combined',
  } = config;

  const app = express();

  // Request tracing
  app.use((req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || 
                         req.headers['x-request-id'] || 
                         Math.random().toString(36).substring(2, 15);
    
    req.headers['x-correlation-id'] = correlationId as string;
    res.setHeader('x-correlation-id', correlationId);
    next();
  });

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: corsOrigin,
    credentials: corsCredentials,
  }));

  // Request logging
  morgan.token('correlation-id', (req: Request) => req.headers['x-correlation-id'] as string);
  app.use(morgan(':correlation-id :method :url :status :res[content-length] - :response-time ms'));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  return app;
}

// ============================================================
// ASYNC HANDLER WRAPPER
// ============================================================

/**
 * Wraps async route handlers to automatically catch errors and forward to next()
 * Eliminates need for try/catch blocks in route handlers
 * 
 * @param fn - Async route handler function
 * @returns Express route handler with error handling
 * 
 * @example
 * app.get('/api/data', asyncHandler(async (req, res) => {
 *   const data = await fetchData();
 *   res.json(data);
 * }));
 */
export const asyncHandler: AsyncHandler = (fn) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

// ============================================================
// HEALTH CHECK FACTORY
// ============================================================

/**
 * Creates a health check endpoint for the service
 * @param options - Health check configuration
 * @returns Express route handler for /health endpoint
 * 
 * @example
 * app.get('/health', createHealthCheck({
 *   serviceName: 'my-service',
 *   healthCheckFn: () => healthCheck(getDatabase()),
 * }));
 */
export function createHealthCheck(options: HealthCheckOptions) {
  const { serviceName, healthCheckFn, includeTimestamp = true } = options;

  return async (req: Request, res: Response) => {
    try {
      if (healthCheckFn) {
        const isHealthy = await healthCheckFn();
        if (!isHealthy) {
          res.status(503).json({
            status: 'unhealthy',
            service: serviceName,
            ...(includeTimestamp && { timestamp: new Date().toISOString() }),
          });
          return;
        }
      }

      res.json({
        status: 'ok',
        service: serviceName,
        ...(includeTimestamp && { timestamp: new Date().toISOString() }),
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        service: serviceName,
        error: error instanceof Error ? error.message : 'Unknown error',
        ...(includeTimestamp && { timestamp: new Date().toISOString() }),
      });
    }
  };
}

// ============================================================
// ERROR HANDLER
// ============================================================

/**
 * Standard error handling middleware for Express
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] as string;
  
  // Structured logging
  console.error({
    timestamp: new Date().toISOString(),
    correlationId,
    path: req.originalUrl,
    method: req.method,
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    }
  });

  if (err.name === 'UnauthorizedError') {
    res.status(401).json({ success: false, error: 'Invalid or expired token', correlationId });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({ success: false, error: 'Validation error', details: err.message, correlationId });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    correlationId
  });
};

// ============================================================
// SERVICE BOOTSTRAP
// ============================================================

export interface ServiceBootstrapConfig {
  serviceName: string;
  serviceVersion: string;
  description: string;
  portEnvVar?: string;
  defaultPort?: number;
  createOpenApiSpec: (config: any) => object;
  setupSwagger: (app: any, spec: object) => void;
  healthCheckFn?: () => Promise<boolean>;
  routesSetup?: (app: Application) => void;
}

/**
 * Bootstraps a service with standard configuration, middleware, and startup
 * @param config - Service bootstrap configuration
 * @returns Configured Express application
 */
export function bootstrapService(config: ServiceBootstrapConfig): Application {
  const {
    serviceName,
    serviceVersion,
    description,
    portEnvVar,
    defaultPort,
    createOpenApiSpec,
    setupSwagger,
    healthCheckFn,
    routesSetup,
  } = config;

  // Create app with standard middleware
  const app = createExpressApp();

  // Setup custom routes
  if (routesSetup) {
    routesSetup(app);
  }

  // Health check endpoint
  app.get('/health', createHealthCheck({
    serviceName: serviceName.toLowerCase().replace(/\s+/g, '-'),
    healthCheckFn,
  }));

  // Standard Error Handling (MUST be last)
  app.use(errorHandler);

  // Swagger documentation
  const PORT = process.env[portEnvVar || `${serviceName.toUpperCase().replace(/\s+/g, '_')}_PORT`] || defaultPort || 3000;
  const spec = createOpenApiSpec({
    serviceName,
    serviceVersion,
    description,
    port: PORT,
  });
  setupSwagger(app, spec);

  // Start server
  app.listen(PORT, () => {
    console.log(`✅ ${serviceName} running on port ${PORT}`);
  });

  return app;
}

// ============================================================
// EXPORTS
// ============================================================

export { express, cors, helmet, morgan };
export type { Application, Request, Response, NextFunction, ErrorRequestHandler };
export * from './requestUtils.js';
export * from './middleware/channelContext.js';
