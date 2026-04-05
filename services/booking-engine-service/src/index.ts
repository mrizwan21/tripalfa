import express, { Express, ErrorRequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import flightsRoutes from './routes/flights.js';
import hotelsRoutes from './routes/hotels.js';
import offlineRequestsRoutes from './routes/offline-requests.js';
import staticDataRoutes from './routes/static-data.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.BOOKING_ENGINE_SERVICE_PORT || process.env.PORT || 3021;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'booking-engine-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API version info
app.get('/api', (req, res) => {
  res.json({
    name: 'TripAlfa Booking Engine API',
    version: '1.0.0',
    endpoints: {
      flights: '/api/flights',
      hotels: '/api/hotels',
      offlineRequests: '/api/offline-requests',
      staticData: '/api/static',
    },
  });
});

// API Routes
app.use('/api/flights', flightsRoutes);
app.use('/api/hotels', hotelsRoutes);
app.use('/api/offline-requests', offlineRequestsRoutes);
app.use('/api/static', staticDataRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    path: req.path,
  });
});

// Error Handler
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('[BookingEngineService] Error:', err);

  // Handle specific error types
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
    return;
  }

  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
};

app.use(errorHandler);

import { setupBookingEngineSwagger } from './swagger.js';

// Start server
setupBookingEngineSwagger(app);
app.listen(PORT, () => {
  console.log(`🚀 Booking Engine Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API info: http://localhost:${PORT}/api`);
});

export default app;
