import { Router, Request, Response } from 'express';
import redisCache from '../services/redis-cache.js';

const router = Router();

interface Notification {
  id: string;
  userId?: string;
  title?: string;
  message: string;
  type?: string;
  priority?: string;
  status?: string;
  createdAt: string;
}

const USER_NOTIFICATIONS_KEY = (userId: string) => `user_notifications:${userId}`;
const GLOBAL_NOTIFICATIONS_KEY = 'all_notifications';
const PREFS_KEY = (userId: string) => `prefs:${userId}`;

// GET /notifications - List notifications, optionally filtered by userId
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string | undefined;
    if (userId) {
      const raw = await redisCache.lrange(USER_NOTIFICATIONS_KEY(userId), 0, -1);
      const parsed = raw.map(r => JSON.parse(r));
      // sort descending by createdAt
      parsed.sort((a: Notification, b: Notification) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return res.json(parsed.slice(0, 50));
    }

    // return last 100 global notifications
    const global = await redisCache.lrange(GLOBAL_NOTIFICATIONS_KEY, 0, 999);
    const parsedGlobal = global.map(g => JSON.parse(g));
    return res.json(parsedGlobal.slice(0, 100));
  } catch (err) {
    console.error('[notifications] list error', err);
    res.status(500).json({ error: 'failed' });
  }
});

// GET /notifications/unread?userId= - returns unread count
router.get('/unread', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const raw = await redisCache.lrange(USER_NOTIFICATIONS_KEY(userId), 0, -1);
    const parsed = raw.map(r => JSON.parse(r) as Notification);
    const count = parsed.filter(n => n.status === 'pending' || n.status === 'unread' || !n.status).length;
    res.json({ count });
  } catch (err) {
    console.error('[notifications] unread error', err);
    res.status(500).json({ error: 'failed' });
  }
});

// POST /notifications - create/send a notification (stores in redis lists)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, title, message, type, priority } = req.body ?? {};
    if (!message) return res.status(400).json({ error: 'message required' });
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const notification: Notification = {
      id,
      userId,
      title,
      message,
      type: type || 'info',
      priority: priority || 'medium',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    if (userId) {
      await redisCache.lpush(USER_NOTIFICATIONS_KEY(userId), JSON.stringify(notification));
      await redisCache.expire(USER_NOTIFICATIONS_KEY(userId), 86400 * 7);
    }

    // add to global list
    await redisCache.lpush(GLOBAL_NOTIFICATIONS_KEY, JSON.stringify(notification));
    await redisCache.expire(GLOBAL_NOTIFICATIONS_KEY, 86400 * 30);

    res.status(201).json(notification);
  } catch (err) {
    console.error('[notifications] create error', err);
    res.status(500).json({ error: 'failed' });
  }
});

export default router;
