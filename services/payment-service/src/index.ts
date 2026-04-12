import { createServiceApp, startService } from '@tripalfa/shared-types';
import dotenv from 'dotenv';
import paymentsRoutes from './routes/payments.js';
import virtualCardsRoutes from './routes/virtual-cards.js';
import taxRoutes from './routes/tax.js';
import { setupPaymentSwagger } from './swagger.js';

dotenv.config();

const PORT = process.env.PAYMENT_SERVICE_PORT || 3007;

const app = createServiceApp({
  serviceName: 'payment-service',
  port: PORT,
});

app.use('/api/payments', paymentsRoutes);
app.use('/api/virtual-cards', virtualCardsRoutes);
app.use('/api/tax', taxRoutes);

setupPaymentSwagger(app);

startService(app, PORT);

export default app;
