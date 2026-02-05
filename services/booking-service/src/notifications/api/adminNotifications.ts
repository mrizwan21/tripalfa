import express, { Router, Request, Response } from 'express';
import { Notification } from '../interfaces.js';

type CacheClient = { get: (key: string) => Promise<string | null> };

export function adminNotificationsRouter(cacheClient: CacheClient): Router {
  const r: Router = express.Router();

  // simple endpoint to list recent global notifications
  r.get('/notifications', async (req: Request, res: Response) => {
    try {
      const raw = await cacheClient.get('all_notifications');
      const list: Notification[] = raw ? JSON.parse(raw) : [];
      res.json(list.slice(-1000).reverse());
    } catch (err) {
      res.status(500).json({ error: 'failed' });
    }
  });

  return r;
}
