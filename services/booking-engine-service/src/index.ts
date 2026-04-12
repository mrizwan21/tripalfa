import { createServiceApp } from '@tripalfa/shared-types';
import dotenv from 'dotenv';
import express, { ErrorRequestHandler } from 'express';

import flightsRoutes from './routes/flights.js';
import hotelsRoutes from './routes/hotels.js';
import offlineRequestsRoutes from './routes/offline-requests.js';
import staticDataRoutes from './routes/static-data.js';
import { setupBookingEngineSwagger } from './swagger.js';

dotenv.config();

const PORT = process.env.BOOKING_ENGINE_SERVICE_PORT || process.env.PORT || 3021;

const app = createServiceApp({
  serviceName: 'booking-engine-service',
  port: PORT,
});

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

app.use('/api/flights', flightsRoutes);
app.use('/api/hotels', hotelsRoutes);
app.use('/api/offline-requests', offlineRequestsRoutes);
app.use('/api/static', staticDataRoutes);

const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  console.error('[BookingEngineService] Error:', err);

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

setupBookingEngineSwagger(app);

app.listen(PORT, () => {
  console.log(`Booking Engine Service running on port ${PORT}`);
});

export default app;
