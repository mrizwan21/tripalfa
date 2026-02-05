import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tenantsRouter from './routes/tenants';
import notificationsRouter from './routes/notifications';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/v1/tenants', tenantsRouter);
app.use('/v1/notifications', notificationsRouter);

// global error handler (must be after routes)
app.use(errorHandler);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(port, () => {
   
  console.log(`superadmin-api listening on ${port}`);
});
