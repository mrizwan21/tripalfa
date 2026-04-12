import { createServiceApp, startService } from '@tripalfa/shared-types';
import fusionAuthRoutes from './routes/fusionauth.routes.js';
import fusionAuthUserRoutes from './routes/fusionauth-user.routes.js';
import fusionAuthSecurityRoutes from './routes/fusionauth-security.routes.js';
import fusionAuthEnhancedRoutes from './routes/fusionauth-enhanced.routes.js';
import { setupAuthSwagger } from './swagger.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.AUTH_SERVICE_PORT || process.env.PORT || 3003;

const app = createServiceApp({
  serviceName: 'auth-service',
  port: PORT,
});

app.use('/auth/fusionauth', fusionAuthRoutes);
app.use('/auth/fusionauth/user', fusionAuthUserRoutes);
app.use('/auth/fusionauth/security', fusionAuthSecurityRoutes);
app.use('/auth/fusionauth/enhanced', fusionAuthEnhancedRoutes);

setupAuthSwagger(app);

startService(app, PORT);

export default app;
