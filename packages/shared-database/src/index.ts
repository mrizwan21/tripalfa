// ============================================================
// DATABASE REST API - MAIN ENTRY POINT
// ============================================================
// OpenAPI-compliant REST API for TripAlfa PostgreSQL databases
// ============================================================

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { setupSwagger, createSwaggerSpec } from '@tripalfa/shared-openapi';

// Import route handlers
import flightRoutes from './routes/flight.routes.js';
import hotelRoutes from './routes/hotel.routes.js';
import userRoutes from './routes/user.routes.js';
import authRoutes from './routes/auth.routes.js';
import b2bRoutes from './routes/b2b.routes.js';
import callCenterRoutes from './routes/call-center.routes.js';

// Import middleware
import { authenticateToken } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { requestLogger } from './middleware/logging.middleware.js';
import { prisma, PrismaClient } from './database/prisma.js';

export { prisma, PrismaClient };

// Make prisma accessible for side effects (DB initialization)
void prisma;
void PrismaClient;

// EXPRESS APP SETUP
// ============================================================

export function createDatabaseApp(): Express {
  const app: Express = express();
  const PORT = process.env.DB_API_PORT || 3002;

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS - Cross-origin resource sharing
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
}));

// Rate limiting - Prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'rate_limit_exceeded',
    message: 'Too many requests from this IP, please try again later',
    requestId: crypto.randomUUID(),
  },
});
app.use('/api/', limiter);

// ============================================================
// BODY PARSING MIDDLEWARE
// ============================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// REQUEST LOGGING
// ============================================================

app.use(requestLogger);

// ============================================================
// HEALTH CHECK ENDPOINT
// ============================================================

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Health check endpoint
 *     description: Returns the health status of the API server
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: healthy }
 *                 timestamp: { type: string, format: date-time }
 *                 uptime: { type: number }
 *                 version: { type: string }
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         tripalfa_local: { type: string, example: connected }
 *                         tripalfa_core: { type: string, example: connected }
 *                         tripalfa_finance: { type: string, example: connected }
 */
app.get('/health', async (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    services: {
      database: {
        tripalfa_local: 'connected',
        tripalfa_core: 'connected',
        tripalfa_finance: 'connected',
      },
    },
  };

  res.json(health);
});

// ============================================================
// API ROUTES
// ============================================================

/**
 * @openapi
 * /api/v1:
 *   get:
 *     tags: [System]
 *     summary: API information
 *     description: Returns information about the TripAlfa Database REST API
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name: { type: string, example: TripAlfa Database REST API }
 *                 version: { type: string, example: 1.0.0 }
 *                 description: { type: string }
 *                 databases:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name: { type: string }
 *                       tables: { type: integer }
 *                       size: { type: string }
 *                 endpoints:
 *                   type: array
 *                   items: { type: string }
 *                 documentation: { type: string, format: uri }
 */
app.get('/api/v1', (req: Request, res: Response) => {
  res.json({
    name: 'TripAlfa Database REST API',
    version: '1.0.0',
    description: 'Comprehensive REST API layer built on top of PostgreSQL database infrastructure',
    databases: [
      { name: 'tripalfa_local', tables: 118, size: '39 GB' },
      { name: 'tripalfa_core', tables: 76, size: '12 MB' },
      { name: 'tripalfa_finance', tables: 49, size: '12 MB' },
    ],
    totalTables: 197,
    totalRows: '~48 million',
    endpoints: [
      'GET /api/v1/flight/aircraft - List aircraft types',
      'GET /api/v1/flight/airports - List airports',
      'GET /api/v1/hotel/hotels - List hotels',
      'GET /api/v1/hotel/reviews - List hotel reviews',
      'GET /api/v1/users - List users',
      'GET /api/v1/bookings - List bookings',
      'POST /api/v1/auth/login - Authenticate',
    ],
    documentation: `${req.protocol}://${req.get('host')}/api-docs`,
  });
});

// Mount API routes
app.use('/api/v1/flight', authenticateToken, flightRoutes);
app.use('/api/v1/hotel', authenticateToken, hotelRoutes);
app.use('/api/v1/users', authenticateToken, userRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/b2b', authenticateToken, b2bRoutes);
app.use('/api/call-center', authenticateToken, callCenterRoutes);

// ============================================================
// SWAGGER/OPENAPI DOCUMENTATION
// ============================================================

const openApiSpec = createSwaggerSpec({
  serviceName: 'TripAlfa Database REST API',
  serviceVersion: '1.0.0',
  description: `
    Comprehensive REST API layer built on top of PostgreSQL database infrastructure.
    
    ## Database Statistics
    - **Total Tables**: 197
    - **Total Rows**: ~48 million
    - **Total Data Size**: ~40 GB
    
    ## Operational Databases
    1. **tripalfa_local** (39 GB, 118 tables) - Flight/hotel reference data
    2. **tripalfa_core** (12 MB, 76 tables) - Core application data
    3. **tripalfa_finance** (12 MB, 49 tables) - Financial operations
    
    ## Modules
    - Flight Reference Data
    - Hotel Reference Data
    - User Management & Authentication
    - Role-Based Access Control (RBAC)
    - B2B Portal
    - Call Center
    - Booking Management
    - Financial Operations
    - Audit Logging
  `,
  port: PORT,
});

setupSwagger(app, openApiSpec, '/api-docs');

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req: Request, res: Response, next: NextFunction) => {
  const error: any = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(errorHandler);

  return app;
}

// ============================================================
// START SERVER (only when run directly or env var is set)
// ============================================================

if (process.env.START_DB_API === 'true' || process.argv[1]?.includes('shared-database')) {
  const PORT = process.env.DB_API_PORT || 3002;
  const app = createDatabaseApp();
  app.listen(PORT, () => {
    console.log(`\n================================================`);
    console.log(`🚀 TripAlfa Database REST API`);
    console.log(`================================================`);
    console.log(`📍 Server running on port ${PORT}`);
    console.log(`📖 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log(`================================================\n`);
  });
}
