import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import ruleRoutes from './routes/rules.js';
import { setupRuleEngineSwagger } from './swagger.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.RULE_ENGINE_SERVICE_PORT || 3010;

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
  res.json({ status: 'healthy', service: 'rule-engine-service' });
});

// API Routes
app.use('/api/rules', ruleRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[RuleEngineService] Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'Unknown error',
  });
});

// Start server
setupRuleEngineSwagger(app);
app.listen(PORT, () => {
  console.log(`🚀 Rule Engine Service running on port ${PORT}`);
});

export default app;
