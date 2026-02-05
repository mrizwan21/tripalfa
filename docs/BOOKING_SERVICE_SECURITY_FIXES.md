# Booking Service Security Implementation Guide

This guide provides specific code implementations to address the critical security issues identified in the audit report.

## 1. Authentication Middleware Implementation

### Create JWT Authentication Middleware

Create file: `src/middleware/authenticateToken.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
      if (err) {
        logger.warn('Invalid token attempt', { 
          ip: req.ip, 
          userAgent: req.get('User-Agent'),
          path: req.path 
        });
        res.status(403).json({
          success: false,
          error: 'Invalid or expired token'
        });
        return;
      }

      req.user = user as any;
      next();
    });
  } catch (error) {
    logger.error('Authentication middleware error', { error: (error as Error).message });
    res.status(500).json({
      success: false,
      error: 'Authentication service unavailable'
    });
  }
};

export default authenticateToken;
```

### Create Role-Based Authorization Middleware

Create file: `src/middleware/authorize.ts`

```typescript
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface RoleAuthorizationOptions {
  roles: string[];
  requireOwnership?: boolean;
  ownerField?: string;
}

const authorize = (options: RoleAuthorizationOptions) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Check role permissions
    if (options.roles.length && !options.roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    // Check ownership if required
    if (options.requireOwnership && options.ownerField) {
      const resourceId = req.params.id || req.params.bookingId;
      if (resourceId && req.user.role !== 'admin') {
        // This would typically involve a database check
        // For now, we'll assume the middleware will be enhanced
        // with actual ownership verification logic
      }
    }

    next();
  };
};

export default authorize;
```

## 2. Input Validation Implementation

### Create Validation Schemas

Create file: `src/validation/schemas.ts`

```typescript
import Joi from 'joi';

// Booking validation schema
export const bookingSchema = Joi.object({
  type: Joi.string().valid('flight', 'hotel', 'package').required(),
  customerId: Joi.string().uuid().required(),
  customerType: Joi.string().valid('B2B', 'B2C').required(),
  companyId: Joi.string().uuid().optional(),
  branchId: Joi.string().uuid().optional(),
  productId: Joi.string().optional(),
  supplierId: Joi.string().optional(),
  serviceDetails: Joi.object().required(),
  passengers: Joi.array().items(Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    dateOfBirth: Joi.date().iso().optional(),
    passportNumber: Joi.string().optional(),
    nationality: Joi.string().length(2).optional()
  })).min(1).required(),
  pricing: Joi.object({
    customerPrice: Joi.number().positive().required(),
    supplierPrice: Joi.number().positive().required(),
    markup: Joi.number().min(0).required(),
    currency: Joi.string().length(3).required()
  }).required(),
  payment: Joi.object({
    method: Joi.string().valid('wallet', 'credit_card', 'supplier_credit').required(),
    amount: Joi.number().positive().required(),
    supplierPayment: Joi.object({
      method: Joi.string().required(),
      terms: Joi.string().required()
    }).optional()
  }).required(),
  bookingType: Joi.string().valid('instant', 'hold', 'request').required(),
  specialRequests: Joi.array().items(Joi.string()).optional(),
  metadata: Joi.object().optional()
});

// Search validation schema
export const searchSchema = Joi.object({
  bookingId: Joi.string().optional(),
  customerName: Joi.string().min(2).max(100).optional(),
  customerEmail: Joi.string().email().optional(),
  pnr: Joi.string().optional(),
  supplierRef: Joi.string().optional(),
  companyId: Joi.string().uuid().optional(),
  branchId: Joi.string().uuid().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  status: Joi.array().items(Joi.string()).optional(),
  type: Joi.array().items(Joi.string()).optional(),
  queueType: Joi.array().items(Joi.string()).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('ASC', 'DESC').optional()
});

// GDS import validation schema
export const gdsImportSchema = Joi.object({
  gdsType: Joi.string().valid('amadeus', 'sabre', 'travelport').required(),
  pnr: Joi.string().required(),
  supplierRef: Joi.string().required()
});
```

### Create Validation Middleware

Create file: `src/middleware/validate.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { bookingSchema, searchSchema, gdsImportSchema } from '../validation/schemas';

interface ValidationOptions {
  abortEarly?: boolean;
  allowUnknown?: boolean;
}

const createValidator = (schema: any, options: ValidationOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body || req.query, { 
      abortEarly: false, 
      allowUnknown: true,
      ...options 
    });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorMessages
      });
      return;
    }
    
    next();
  };
};

export const validateBooking = createValidator(bookingSchema);
export const validateSearch = createValidator(searchSchema);
export const validateGDSImport = createValidator(gdsImportSchema);
```

## 3. Security Headers and Rate Limiting

### Create Security Configuration

Create file: `src/config/security.ts`

```typescript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://fonts.googleapis.com"],
      connectSrc: ["'self'", "https://api.example.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameAncestors: ["'none'"]
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS configuration
export const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Rate limiting configuration
const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.round((req.rateLimit as any).resetTime / 1000)
      });
    }
  });
};

// Different rate limits for different endpoints
export const rateLimiters = {
  general: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // limit each IP to 100 requests per windowMs
    'Too many requests from this IP, please try again later.'
  ),
  auth: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // limit each IP to 5 auth requests per windowMs
    'Too many authentication attempts, please try again later.'
  ),
  booking: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    20, // limit each IP to 20 booking requests per windowMs
    'Too many booking requests, please try again later.'
  )
};
```

## 4. Enhanced Error Handling

### Create Structured Error Handler

Create file: `src/middleware/enhancedErrorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public errorCode?: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, errorCode?: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const sendErrorDev = (err: AppError, req: AuthenticatedRequest, res: Response): void => {
  logger.error('Error in development mode', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(err.statusCode).json({
    success: false,
    error: err.message,
    stack: err.stack,
    details: err.details || null
  });
};

const sendErrorProd = (err: AppError, req: AuthenticatedRequest, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    logger.warn('Operational error', {
      error: err.message,
      statusCode: err.statusCode,
      url: req.url,
      method: req.method,
      ip: req.ip
    });

    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.errorCode && { errorCode: err.errorCode })
    });

  // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log error
    logger.error('Unknown error', {
      error: err.message,
      url: req.url,
      method: req.method,
      ip: req.ip
    });

    // 2) Send generic message
    res.status(500).json({
      success: false,
      error: 'Something went very wrong!'
    });
  }
};

export const errorHandler = (err: any, req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
      error = new AppError('Resource not found', 404);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
      const message = 'Duplicate field value entered';
      error = new AppError(message, 400);
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
      error = new AppError(message, 400);
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      error = new AppError('Invalid token', 401);
    }

    if (err.name === 'TokenExpiredError') {
      error = new AppError('Token expired', 401);
    }

    sendErrorProd(error, req, res);
  }
};
```

## 5. Secure Database Operations

### Create Database Security Wrapper

Create file: `src/utils/databaseSecurity.ts`

```typescript
import { Pool, PoolClient, QueryResult } from 'pg';

interface DatabaseConfig {
  connectionString: string;
  ssl?: boolean;
  max?: number;
  min?: number;
  idle?: number;
  connectionTimeoutMillis?: number;
  idleTimeoutMillis?: number;
}

class SecureDatabase {
  private pool: Pool;

  constructor(config?: DatabaseConfig) {
    const defaultConfig: DatabaseConfig = {
      connectionString: process.env.DATABASE_URL!,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      min: 2,
      idle: 10000,
      connectionTimeoutMillis: 2000,
      idleTimeoutMillis: 30000,
      ...config
    };

    this.pool = new Pool(defaultConfig);

    this.pool.on('connect', (client: PoolClient) => {
      console.log('New client connected');
    });

    this.pool.on('remove', (client: PoolClient) => {
      console.log('Client disconnected');
    });
  }

  async query<T = any>(text: string, params: any[] = []): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const res = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (err) {
      console.error('Database query error', { error: (err as Error).message, text });
      throw err;
    }
  }

  async getClient(): Promise<PoolClient> {
    const client = await this.pool.connect();
    const query = client.query;
    const release = client.release;

    // set a timeout of 5 seconds, after which we will log this client's last query
    const timeout = setTimeout(() => {
      console.error('A client has been checked out for more than 5 seconds!');
      console.error(`The last executed query on this client was: ${client.lastQuery}`);
    }, 5000);

    // monkey patch the query method to keep track of the last query executed
    client.query = (...args: any[]) => {
      (client as any).lastQuery = args;
      return query.apply(client, args);
    };
    
    client.release = () => {
      // clear our timeout
      clearTimeout(timeout);
      // set the methods back to their old un-monkey-patched version
      client.query = query;
      client.release = release;
      return release.apply(client);
    };
    
    return client;
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async end(): Promise<void> {
    await this.pool.end();
  }
}

export default new SecureDatabase();
```

## 6. Implementation in Main Application

### Update Main App File

Update `src/app.ts` with security implementations:

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import { securityHeaders, corsOptions, rateLimiters } from './config/security';
import authenticateToken from './middleware/authenticateToken';
import { validateBooking, validateSearch } from './middleware/validate';
import { errorHandler, AppError } from './middleware/enhancedErrorHandler';
import logger from './utils/logger';
import { createBooking, searchBookings, updateBooking } from './controllers/enhancedBookingController';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3001', 10);

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/auth', rateLimiters.auth);
app.use('/api/bookings', rateLimiters.booking);
app.use('/api/', rateLimiters.general);

// Protected routes
app.use('/api/bookings', authenticateToken);

// Booking routes with validation
app.post('/api/bookings', validateBooking, createBooking);
app.get('/api/bookings', validateSearch, searchBookings);
app.put('/api/bookings/:id', validateBooking, updateBooking);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Booking service running on port ${PORT}`);
});

export default app;
```

## 7. Environment Configuration

### Create Environment Variables Template

Create file: `.env.example`

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/booking_service
DATABASE_SSL=true

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Redis Configuration (for caching and rate limiting)
REDIS_URL=redis://localhost:6379

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log

# GDS API Keys
AMADEUS_CLIENT_ID=your-amadeus-client-id
AMADEUS_CLIENT_SECRET=your-amadeus-client-secret
AMADEUS_API_URL=https://test.api.amadeus.com

SABRE_CLIENT_ID=your-sabre-client-id
SABRE_CLIENT_SECRET=your-sabre-client-secret
SABRE_API_URL=https://api.sabre.com

TRAVELPORT_CLIENT_ID=your-travelport-client-id
TRAVELPORT_CLIENT_SECRET=your-travelport-client-secret
TRAVELPORT_API_URL=https://api.travelport.com

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment Configuration
STRIPE_SECRET_KEY=your-stripe-secret-key
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# Monitoring
ENABLE_REQUEST_LOGGING=true
ENABLE_PERFORMANCE_MONITORING=true
```

## 8. Testing the Security Implementation

### Create Security Tests

Create file: `tests/security.test.ts`

```typescript
import request from 'supertest';
import app from '../src/app';

describe('Security Middleware', () => {
  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Access token required');
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', 'Bearer invalid-token')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });

  describe('Input Validation', () => {
    it('should reject booking with invalid data', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', 'Bearer valid-token')
        .send({
          type: 'invalid-type',
          customerId: 'invalid-uuid'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('Rate Limiting', () => {
    it('should limit requests after threshold', async () => {
      // Make multiple requests to trigger rate limiting
      const requests = Array(10).fill().map(() => 
        request(app).get('/api/bookings').set('Authorization', 'Bearer valid-token')
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);

      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app).get('/health');
      
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });
});
```

## 9. Deployment Checklist

### Security Deployment Checklist

- [ ] Set strong JWT_SECRET in production
- [ ] Configure ALLOWED_ORIGINS for CORS
- [ ] Enable SSL/TLS for all connections
- [ ] Set up proper database credentials
- [ ] Configure Redis for caching and rate limiting
- [ ] Set up monitoring and alerting
- [ ] Enable structured logging
- [ ] Configure firewall rules
- [ ] Set up backup and recovery procedures
- [ ] Test all security measures
- [ ] Review and update dependencies
- [ ] Implement security scanning in CI/CD

This implementation guide provides concrete steps to address the critical security issues identified in the audit. Each component can be implemented incrementally, starting with authentication and validation, then moving to rate limiting and enhanced error handling.