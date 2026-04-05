import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import ticketRoutes from './routes/tickets';
import customerRoutes from './routes/customers';
import analyticsRoutes from './routes/analytics';
import tasksRoutes from './routes/tasks';
import calendarRoutes from './routes/calendar';
import notesRoutes from './routes/notes';
import opportunitiesRoutes from './routes/opportunities';
import workflowsRoutes from './routes/workflows';
import integrationsRoutes from './routes/integrations';
import documentsRoutes from './routes/documents';
import blocklistRoutes from './routes/blocklist';
import favoritesRoutes from './routes/favorites';
import contactFormsRoutes from './routes/contact-forms';
import duplicatesRoutes from './routes/duplicates';
import dashboardSyncRoutes from './routes/dashboard-sync';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

const app: Express = express();
const PORT = process.env.PORT || 3015;

// CORS configuration - allow API gateway and local development
const corsOrigin = process.env.API_GATEWAY_URL || 'http://localhost:3030';
const allowedOrigins = [
  corsOrigin,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
].filter(Boolean);

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow no-origin (server-to-server, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }
      // Allow any localhost variant
      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }
      // Default allow for development
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  })
);
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'crm-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/tickets', ticketRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/crm/tasks', tasksRoutes);
app.use('/api/crm/calendar', calendarRoutes);
app.use('/api/crm/notes', notesRoutes);
app.use('/api/crm/opportunities', opportunitiesRoutes);
app.use('/api/crm/workflows', workflowsRoutes);
app.use('/api/crm/integrations', integrationsRoutes);
app.use('/api/crm/documents', documentsRoutes);
app.use('/api/crm/blocklist', blocklistRoutes);
app.use('/api/crm/favorites', favoritesRoutes);
app.use('/api/crm/contact-forms', contactFormsRoutes);
app.use('/api/crm/duplicates', duplicatesRoutes);
app.use('/api/crm/dashboard-sync', dashboardSyncRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

import { setupCRMSwagger } from './swagger.js';

// Start server
setupCRMSwagger(app);
app.listen(PORT, () => {
  console.log(`CRM Service running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
