// src/app.ts
// Main Express server for wallet service

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config.js';

// // import { logger } from './utils/logger.js';
import { pool } from './config/db.js';
import transferRoute from './routes/transferRoute.js';
import customerPurchaseRoute from './routes/customerPurchaseRoute.js';
import settlementRoute from './routes/settlementRoute.js';

const PORT = process.env.PORT || 3008;
const app: Express = express();

console.log('Starting wallet service...');
console.log('PORT:', PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

// ============================================================================
// MIDDLEWARE
// ============================================================================

// app.use(helmet());
// app.use(cors());
// app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'wallet-service' });
});

app.get('/ready', async (req, res) => {
  try {
    // await pool.query('SELECT 1');
    res.json({ ready: true });
  } catch (err) {
    res.status(503).json({ ready: false, error: (err as Error).message });
  }
});

// ============================================================================
// ROUTES
// ============================================================================

import walletRoutes from './routes/walletRoutes.js';

app.use(transferRoute);
app.use(customerPurchaseRoute);
app.use(settlementRoute);
app.use('/api/v1/ledger', walletRoutes);

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use(
  (err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error', err);
    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ============================================================================
// SERVER START
// ============================================================================

const server = app.listen(PORT, () => {
  console.log(`Wallet service running on port ${PORT}`);
});

console.log('Server object created, about to listen...');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await pool.end();
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(async () => {
    await pool.end();
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
