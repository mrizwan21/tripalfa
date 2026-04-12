import { createServiceApp, startService } from '@tripalfa/shared-types';
import dotenv from 'dotenv';
import notificationRoutes from './routes/notifications.js';
import { setupNotificationSwagger } from './swagger.js';

dotenv.config();

const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3005;

const app = createServiceApp({
  serviceName: 'notification-service',
  port: PORT,
});

app.use('/api/notifications', notificationRoutes);

setupNotificationSwagger(app);

startService(app, PORT);

export default app;
