import { Router, type Request, type Response, type Express } from 'express';
import type { Router as RouterType } from 'express';

const router: RouterType = Router();

router.get('/calls', (req: Request, res: Response) => {
  res.json({
    calls: [
      { id: 'c-1', callerNumber: '+973 17123456', callerName: 'Ahmed Hassan', agentId: 'a-1', agentName: 'Ahmed Khan', status: 'COMPLETED', startTime: new Date(Date.now() - 3600000).toISOString(), duration: 180 },
      { id: 'c-2', callerNumber: '+973 17234567', callerName: 'Fatima Ali', agentId: 'a-2', agentName: 'Fatima Ali', status: 'IN_PROGRESS', startTime: new Date(Date.now() - 900000).toISOString(), duration: 15 },
      { id: 'c-3', callerNumber: '+973 17345678', callerName: 'Omar Mahmoud', agentId: 'a-3', agentName: 'Omar Hassan', status: 'COMPLETED', startTime: new Date(Date.now() - 7200000).toISOString(), duration: 300 },
      { id: 'c-4', callerNumber: '+973 17456789', callerName: 'Sarah Johnson', status: 'WAITING', startTime: new Date(Date.now() - 120000).toISOString() },
      { id: 'c-5', callerNumber: '+973 17567890', callerName: 'David Williams', agentId: 'a-1', agentName: 'Ahmed Khan', status: 'COMPLETED', startTime: new Date(Date.now() - 14400000).toISOString(), duration: 240 },
    ],
    stats: { total: 5, avgDuration: 210 },
    total: 5,
  });
});

router.get('/queues', (req: Request, res: Response) => {
  res.json({
    queues: [
      { id: 'q-1', name: 'General Support', status: 'ACTIVE', waiting: 5, avgWait: 120, agents: 3 },
      { id: 'q-2', name: 'Sales', status: 'ACTIVE', waiting: 2, avgWait: 60, agents: 2 },
      { id: 'q-3', name: 'Complaints', status: 'ACTIVE', waiting: 1, avgWait: 90, agents: 1 },
    ],
  });
});

router.get('/stats', (req: Request, res: Response) => {
  res.json({ totalCalls: 50, avgWait: 90, resolved: 45 });
});

export default router;