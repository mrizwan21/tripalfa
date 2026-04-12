import express, { Express, ErrorRequestHandler } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import middleware
import { requestLogger, requestId, errorHandler } from './middleware/error-handler.js';
import {
  monitoringMiddleware,
  healthCheckWithMetrics,
  metricsEndpoint,
  resetMetricsEndpoint,
} from './middleware/monitoring.js';

// Import routes
import companiesRoutes from './routes/companies.js';
import usersRoutes from './routes/users.js';
import bookingsRoutes from './routes/bookings.js';
import financeRoutes from './routes/finance.js';
import suppliersRoutes from './routes/suppliers.js';
import rulesRoutes from './routes/rules.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.B2B_ADMIN_SERVICE_PORT || process.env.PORT || 3020;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enhanced middleware
app.use(requestId);
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'b2b-admin-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Enhanced health check with metrics
app.get('/health/metrics', healthCheckWithMetrics);

// API version info
app.get('/api', (req, res) => {
  res.json({
    name: 'TripAlfa B2B Admin API',
    version: '1.0.0',
    endpoints: {
      companies: '/api/companies',
      users: '/api/users',
      bookings: '/api/bookings',
      finance: '/api/finance',
      suppliers: '/api/suppliers',
      rules: '/api/rules',
      metrics: '/metrics',
      resetMetrics: '/metrics/reset',
    },
  });
});

// Metrics endpoints
app.get('/metrics', metricsEndpoint);
app.post('/metrics/reset', resetMetricsEndpoint);

// API Routes
app.use('/api/companies', companiesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/rules', rulesRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    path: req.path,
  });
});

// Use enhanced error handler
app.use(errorHandler);

import { setupB2BAdminSwagger } from './swagger.js';

// Start server
setupB2BAdminSwagger(app);
app.listen(PORT, () => {
  console.log(`🚀 B2B Admin Service running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API info: http://localhost:${PORT}/api`);
});

export default app;
