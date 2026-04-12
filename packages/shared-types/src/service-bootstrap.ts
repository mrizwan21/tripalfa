import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';

export interface ServiceConfig {
  serviceName: string;
  port: number | string;
  envPort?: string;
}

export function createServiceApp(config: ServiceConfig): Express {
  const app: Express = express();
  const PORT = config.port;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: config.serviceName });
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(`[${config.serviceName}] Error:`, err);
    res.status(500).json({
      error: 'Internal Server Error',
      message:
        process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    });
  });

  return app;
}

export function startService(app: Express, port: number | string): void {
  app.listen(port, () => {
    console.log(`Service running on port ${port}`);
  });
}

export { express };
