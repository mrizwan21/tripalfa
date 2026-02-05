import { Router, Request, Response } from 'express';

const router = Router();

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

// Mock data for demonstration
const auditLogs: AuditLog[] = [
  {
    id: 'l1',
    userId: 'u1',
    action: 'LOGIN',
    timestamp: '2026-01-20T10:15:00Z',
    details: 'User logged in',
    metadata: { ip: '192.168.1.1' },
  },
  {
    id: 'l2',
    userId: 'u2',
    action: 'UPDATE_PROFILE',
    timestamp: '2026-01-21T09:30:00Z',
    details: 'Profile updated',
    metadata: { field: 'email' },
  },
];

// GET /audit-logs - list all logs, filter by userId/action/date
router.get('/', (req: Request, res: Response) => {
  let logs = auditLogs;
  const { userId, action, from, to } = req.query;
  if (userId && typeof userId === 'string') {
    logs = logs.filter(l => l.userId === userId);
  }
  if (action && typeof action === 'string') {
    logs = logs.filter(l => l.action === action);
  }
  if (from && typeof from === 'string') {
    logs = logs.filter(l => l.timestamp >= from);
  }
  if (to && typeof to === 'string') {
    logs = logs.filter(l => l.timestamp <= to);
  }
  res.json(logs);
});

// GET /audit-logs/:id - get log details
router.get('/:id', (req: Request, res: Response) => {
  const log = auditLogs.find(l => l.id === req.params.id);
  if (!log) return res.status(404).json({ message: 'Audit log not found.' });
  res.json(log);
});

// POST /audit-logs - create new log
router.post('/', (req: Request, res: Response) => {
  const { userId, action, details, metadata } = req.body ?? {};
  if (!userId || !action) {
    return res.status(400).json({ message: 'userId and action are required.' });
  }
  const newLog: AuditLog = {
    id: String(Date.now()),
    userId,
    action,
    timestamp: new Date().toISOString(),
    details,
    metadata,
  };
  auditLogs.push(newLog);
  res.status(201).json(newLog);
});

// DELETE /audit-logs/:id - delete log
router.delete('/:id', (req: Request, res: Response) => {
  const idx = auditLogs.findIndex(l => l.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Audit log not found.' });
  }
  const deleted = auditLogs.splice(idx, 1)[0];
  res.json(deleted);
});

export default router;
