import { createServiceApp, startService } from '@tripalfa/shared-types';
import dotenv from 'dotenv';
import ruleRoutes from './routes/rules.js';
import { setupRuleEngineSwagger } from './swagger.js';

dotenv.config();

const PORT = process.env.RULE_ENGINE_SERVICE_PORT || 3010;

const app = createServiceApp({
  serviceName: 'rule-engine-service',
  port: PORT,
});

app.use('/api/rules', ruleRoutes);

setupRuleEngineSwagger(app);

startService(app, PORT);

export default app;
