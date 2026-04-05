import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import localAuthRoutes from './routes/local-auth.routes.js';
import fusionAuthRoutes from './routes/fusionauth.routes.js';
import fusionAuthUserRoutes from './routes/fusionauth-user.routes.js';
import fusionAuthSecurityRoutes from './routes/fusionauth-security.routes.js';
import fusionAuthEnhancedRoutes from './routes/fusionauth-enhanced.routes.js';
import { setupAuthSwagger } from './swagger.js';

dotenv.config();

const app: Express = express();
const PORT = process.env.AUTH_SERVICE_PORT || process.env.PORT || 3003;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'auth-service' });
});

app.use('/auth/local', localAuthRoutes);
app.use('/auth/fusionauth', fusionAuthRoutes);
app.use('/auth/fusionauth/user', fusionAuthUserRoutes);
app.use('/auth/fusionauth/security', fusionAuthSecurityRoutes);
app.use('/auth/fusionauth/enhanced', fusionAuthEnhancedRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[AuthService] Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

setupAuthSwagger(app);

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});

export default app;
