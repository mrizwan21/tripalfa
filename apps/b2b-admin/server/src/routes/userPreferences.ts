import { Router, Request, Response } from 'express';
import redisCache from '../services/redis-cache.js';

const router = Router();

// GET /:userId/preferences
router.get('/:userId/preferences', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const raw = await redisCache.getRaw(`prefs:${userId}`);
    if (!raw) return res.json(null);
    return res.json(JSON.parse(raw));
  } catch (err) {
    console.error('[prefs] get error', err);
    res.status(500).json({ error: 'failed' });
  }
});

// POST /:userId/preferences
router.post('/:userId/preferences', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const prefs = req.body;
    await redisCache.setRaw(`prefs:${userId}`, JSON.stringify(prefs));
    res.json({ ok: true });
  } catch (err) {
    console.error('[prefs] set error', err);
    res.status(500).json({ error: 'failed' });
  }
});

export default router;
