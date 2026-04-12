import { createServiceApp, startService } from '@tripalfa/shared-types';
import dotenv from 'dotenv';
import organizationRoutes from './routes/organization.js';
import brandingRoutes from './routes/branding.js';
import campaignsRoutes from './routes/campaigns.js';
import { setupOrganizationSwagger } from './swagger.js';

dotenv.config();

const PORT = process.env.ORGANIZATION_SERVICE_PORT || 3006;

const app = createServiceApp({
  serviceName: 'organization-service',
  port: PORT,
});

app.use('/api/organization', organizationRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/marketing/campaigns', campaignsRoutes);

setupOrganizationSwagger(app);

startService(app, PORT);

export default app;
