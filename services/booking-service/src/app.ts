import type { Request, Response, Express } from 'express';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables (skip in tests)
if (process.env.NODE_ENV !== 'test') {
  dotenvConfig();
}

// Import database connection
// import { prisma } from './database';

// Import routes
import bookingManagementRoutes from './routes/bookingManagementRoutes';
import enhancedBookingRoutes from './routes/enhancedBookings';
import seatMapsRoutes from './routes/seatMapsRoutes';
import ancillaryServicesRoutes from './routes/ancillaryServicesRoutes';
import holdOrdersRoutes from './routes/holdOrdersRoutes';
import paymentWalletRoutes from './routes/paymentWalletRoutes';
import combinedPaymentRoutes from './routes/combinedPaymentRoutes';
import webhookRoutes from './routes/webhookRoutes';
import notificationRoutes from './routes/notificationRoutes';

// Import middleware
import { securityHeaders, corsOptions, rateLimiters } from './config/security';
import { errorHandler } from './middleware/enhancedErrorHandler';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import type { ErrorRequestHandler } from 'express';

// Import logger
import logger from './utils/logger';

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
app.use('/api/notifications', rateLimiters.general, notificationRoutes);
app.use('/api/bookings', rateLimiters.booking, enhancedBookingRoutes);
app.use('/api/bookings', rateLimiters.booking, combinedPaymentRoutes);
app.use('/api/webhooks', webhookRoutes); // Webhooks without rate limiting (supplier->service)
app.use('/bookings', rateLimiters.booking, holdOrdersRoutes);
app.use('/bookings', rateLimiters.booking, seatMapsRoutes);
app.use('/bookings', rateLimiters.booking, ancillaryServicesRoutes);
app.use('/bookings', rateLimiters.booking, enhancedBookingRoutes);
app.use('/bookings', rateLimiters.booking, paymentWalletRoutes);

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