import express, { type Request, type Response, type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { healthCheck } from './database';
import contactRoutes from './routes/contacts';
import activityRoutes from './routes/activities';
import preferenceRoutes from './routes/preferences';

const app: Express = express();
const PORT = process.env.PORT || 3025;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.API_GATEWAY_URL || 'http://localhost:3030',
    credentials: true,
  })
);
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  try {
    const healthy = await healthCheck();
    if (healthy) {
      res.json({ status: 'ok', service: 'contact-service' });
    } else {
      res.status(503).json({ status: 'unhealthy', service: 'contact-service' });
    }
  } catch (error: unknown) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

// Routes
app.use('/api/contacts', contactRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/preferences', preferenceRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: Request, res: Response) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

import { setupContactSwagger } from './swagger.js';

// Start server
setupContactSwagger(app);
app.listen(PORT, () => {
  console.log(`Contact Service running on port ${PORT}`);
});

export default app;
