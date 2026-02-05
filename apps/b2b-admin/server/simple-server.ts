import 'dotenv/config';
import express from 'express';

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

const staffRouter = express.Router();
staffRouter.post('/', (req: express.Request, res: express.Response) => {
  const { fullName, businessEmail } = (req.body ?? {}) as { fullName?: string; businessEmail?: string };
  if (!fullName || !businessEmail) {
    return res.status(400).json({ message: 'fullName and businessEmail are required' });
  }

  return res.status(201).json({
    message: 'Staff profile request received',
    referenceId: `STAFF-${Date.now()}`,
  });
});
app.use('/api/b2b/staff', staffRouter);

const port = Number(process.env.PORT || 5000);
app.listen(port, () => {
  console.log(`Travel Kingdom server listening on port ${port}`);
});
