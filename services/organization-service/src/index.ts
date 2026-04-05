import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import organizationRoutes from './routes/organization.js';
import brandingRoutes from './routes/branding.js';
import campaignsRoutes from './routes/campaigns.js';
import { setupOrganizationSwagger } from './swagger.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.ORGANIZATION_SERVICE_PORT || 3006;

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
  res.json({ status: 'healthy', service: 'organization-service' });
});

// API Routes
app.use('/api/organization', organizationRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/marketing/campaigns', campaignsRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[OrganizationService] Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Unknown error',
  });
});

// Start server
setupOrganizationSwagger(app);
app.listen(PORT, () => {
  console.log(`🚀 Organization Service running on port ${PORT}`);
});

export default app;
