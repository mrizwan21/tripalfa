import 'dotenv/config';
import compression from 'compression';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import supportRoutes from './routes/support.js';
import companiesRouter from './routes/companies.js';
import usersRouter from './routes/users.js';
import auditLogsRouter from './routes/auditLogs.js';
import rolesRouter from './routes/roles.js';
import inventoryRouter from './routes/inventory.js';
import permissionsRouter from './routes/permissions.js';
import bookingsRouter from './routes/bookings.js';
import notificationsRouter from './routes/notifications.js';
import userPreferencesRouter from './routes/userPreferences.js';
import brandingRouter from './routes/branding.js';
import marketingRouter from './routes/marketing.js';
import pricingRouter from './routes/pricing.js';
import taxRouter from './routes/tax.js';
import paymentRouter from './routes/payments.js';
import promotionsRouter from './routes/promotions.js';
import orderManagementRouter from './routes/order-management.js';

const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..', '..');
const DEFAULT_ADMIN_DIST = path.resolve(WORKSPACE_ROOT, 'apps', 'b2b-admin', 'dist');

const app = express();

app.use(cors());

// Security and performance middleware
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

// Route registrations
app.use('/api/permissions', permissionsRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/users', usersRouter);
app.use('/api/audit-logs', auditLogsRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/user', userPreferencesRouter);
app.use('/api/branding', brandingRouter);
app.use('/api/marketing', marketingRouter);
app.use('/api/pricing', pricingRouter);
app.use('/api/tax', taxRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/promotions', promotionsRouter);
app.use('/api/order-management', orderManagementRouter);
app.use('/api/support', supportRoutes);

// Admin SPA static hosting
const adminDistPath = process.env.ADMIN_DIST_PATH || DEFAULT_ADMIN_DIST;
if (fs.existsSync(adminDistPath)) {
  // Serve static files with optimal caching
  app.use('/', express.static(adminDistPath, {
    maxAge: '1d',
    setHeaders: (res, path) => {
      if (path.includes('/assets/')) {
        // Vite assets are hashed and immutable
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(adminDistPath, 'index.html'));
  });
} else {
  console.warn(`[server] Admin SPA build not found at ${adminDistPath}. Static hosting skipped.`);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `No route found for ${req.method} ${req.originalUrl}` });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`Travel Kingdom server listening on port ${port}`);
});
