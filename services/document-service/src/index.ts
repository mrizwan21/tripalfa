/**
 * Document Service Entry Point
 * Express app initialization and startup
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';

import config from './config';
import { createLogger } from './utils/logger';
import { DocumentController } from './controllers/DocumentController';
import { TemplateController } from './controllers/TemplateController';
import { StatisticsController } from './controllers/StatisticsController';
import { DocumentService } from './services/document-service';
import { TemplateProvider, createDefaultTemplates } from './services/template-provider';
import { getPDFGenerator, initializePDFGenerator } from './services/pdf-generator';
import { createStorageProvider } from './models/storage-provider';
import { createAPIv1Routes } from './routes/api-v1';
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  validateContentType,
  sanitizeRequest,
} from './middleware/error-handler';


const logger = createLogger('DocumentService');

/**
 * Initialize and configure Express app
 */
export async function createApp(): Promise<Express> {
  const app = express();

  // Initialize Prisma
  const prisma = new PrismaClient();

  // Initialize Redis (optional, for caching)
  const redis = createClient({ url: config.redisUrl });
  redis.on('error', (err) => {
    if (config.cacheEnabled) {
      logger.error('Redis error', err);
    }
  });

  try {
    await redis.connect();
    logger.info('Redis connected for caching');
  } catch (error) {
    if (config.cacheEnabled) {
      logger.error('Failed to connect to Redis', error);
    }
  }

  // Initialize PDF Generator
  const pdfGenerator = getPDFGenerator(
    parseInt(process.env.PDF_TIMEOUT_MS || '30000'),
    parseInt(process.env.MAX_CONCURRENT_PDF_GENERATIONS || '5'),
  );

  // Initialize providers
  const templateProvider = new TemplateProvider(prisma);
  const storageProvider = createStorageProvider(
    (process.env.STORAGE_PROVIDER || 'local') as 'local' | 's3' | string,
    {
      bucketName: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      basePath: process.env.STORAGE_LOCAL_PATH,
    },
  );

  // Initialize services
  const documentService = new DocumentService(
    prisma,
    templateProvider,
    pdfGenerator,
    storageProvider,
  );

  // Initialize controllers
  const documentController = new DocumentController(documentService, templateProvider);
  const templateController = new TemplateController(templateProvider);
  const statisticsController = new StatisticsController(prisma);

  // Store controllers in app locals for route access
  (app as any).locals = {
    documentController,
    templateController,
    statisticsController,
    documentService,
    templateProvider,
    prisma,
    redis,
  };

  // ===== MIDDLEWARE =====

  // CORS
  app.use(cors({
    origin: (process.env.CORS_ORIGINS || '*').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Request logging
  app.use(requestLogger);

  // Request validation
  app.use(sanitizeRequest);
  app.use(validateContentType);

  // ===== ROUTES =====

  // Health check (before routes)
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      success: true,
      status: 'healthy',
      service: 'document-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Service info endpoint
  app.get('/api/v1/info', (_req: Request, res: Response) => {
    res.json({
      success: true,
      service: 'Document Service',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        health: '/health',
        documents: '/api/v1/documents',
        templates: '/api/v1/templates',
        statistics: '/api/v1/system/stats',
      },
    });
  });

  // API v1 routes (includes all controllers)
  const apiV1Router = createAPIv1Routes(documentController, templateController, statisticsController);
  app.use('/api/v1', apiV1Router);

  // Legacy routes (for backward compatibility)
  // Redirect to new API structure
  app.all('/documents*', (req: Request, res: Response) => {
    const newPath = `/api/v1/documents${req.path.substring('/documents'.length)}`;
    res.redirect(307, newPath);
  });

  app.all('/templates*', (req: Request, res: Response) => {
    const newPath = `/api/v1/templates${req.path.substring('/templates'.length)}`;
    res.redirect(307, newPath);
  });

  // ===== ERROR HANDLING =====

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  // ===== GRACEFUL SHUTDOWN =====

  const gracefulShutdown = async () => {
    console.log('[App] Shutting down gracefully...');

    try {
      await prisma.$disconnect();
      console.log('[App] Database disconnected');
    } catch (error) {
      console.error('[App] Error disconnecting database:', error);
    }

    process.exit(0);
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);

  return app;
}

/**
 * Initialize all services and start the server
 */
export async function startServer(): Promise<void> {
  try {
    const prisma = new PrismaClient();

    logger.info('Initializing Document Service...');

    // Verify database connection
    logger.info('Connecting to database...');
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Initialize PDF Generator
    logger.info('Initializing PDF generator...');
    await initializePDFGenerator();
    logger.info('PDF generator initialized');

    // Create default templates
    logger.info('Creating default templates...');
    await createDefaultTemplates(prisma);
    logger.info('Default templates created');

    // Create and start app
    logger.info('Creating Express application...');
    const app = await createApp();

    // Start listening on configured port
    const port = config.port || 3100;
    app.listen(port, '0.0.0.0', () => {
      logger.info(`Document Service running on port ${port}`, {
        environment: config.nodeEnv,
        port,
        databaseUrl: config.databaseUrl ? config.databaseUrl.substring(0, 20) + '...' : 'not set',
        redisUrl: config.redisUrl ? config.redisUrl.substring(0, 20) + '...' : 'not set',
        storageType: process.env.STORAGE_PROVIDER || 'local',
      });

      // Print available endpoints
      console.log('\n=== Available Endpoints ===');
      console.log(`GET  http://localhost:${port}/health`);
      console.log(`GET  http://localhost:${port}/api/v1/info`);
      console.log(`GET  http://localhost:${port}/api/v1/documents`);
      console.log(`GET  http://localhost:${port}/api/v1/templates`);
      console.log(`GET  http://localhost:${port}/api/v1/system/stats/summary`);
      console.log('===========================\n');
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      await prisma.$disconnect();
      logger.info('Shutdown complete');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      await prisma.$disconnect();
      logger.info('Shutdown complete');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Start if run directly
if (require.main === module) {
  startServer();
}
