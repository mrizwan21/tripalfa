import type { Request, Response, Express } from 'express';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables (skip in tests)
if (process.env.NODE_ENV !== 'test') {
  dotenvConfig();
}

// Import database connection
// import { prisma } from './database';

// Import routes
import bookingManagementRoutes from './routes/bookingManagementRoutes.js';
import enhancedBookingRoutes from './routes/enhancedBookings.js';

// Import middleware
import { securityHeaders, corsOptions, rateLimiters } from './config/security.js';
import { errorHandler } from './middleware/enhancedErrorHandler.js';
import type { ErrorRequestHandler } from 'express';

// Import logger
import logger from './utils/logger.js';

// Import CommonJS modules using require for compatibility
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');

// Create Express app
const app: Express = express();
const PORT = parseInt(process.env.BOOKING_SERVICE_PORT || process.env.PORT || '3001', 10);

// Security middleware
app.set('trust proxy', 1);
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(compression());

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    }
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', rateLimiters.general);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'booking-service',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api', bookingManagementRoutes);
app.use('/api/bookings', rateLimiters.booking, enhancedBookingRoutes);
app.use('/bookings', rateLimiters.booking, enhancedBookingRoutes);

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use(errorHandler as ErrorRequestHandler);

if (process.env.NODE_ENV !== 'test') {
  // Start server only outside test environment
  console.log(`About to call app.listen on port ${PORT}`);
  const server = app.listen(PORT, () => {
    console.log(`Booking service started successfully on port ${PORT}`);
  });
  console.log(`app.listen called, server object:`, server ? 'created' : 'null');
}

// Graceful shutdown
// process.on('SIGINT', async () => {
//   console.log('Received SIGINT, shutting down gracefully...');
//   // await prisma.$disconnect();
//   process.exit(0);
// });

// process.on('SIGTERM', async () => {
//   console.log('Received SIGTERM, shutting down gracefully...');
//   // await prisma.$disconnect();
//   process.exit(0);
// });

export default app;