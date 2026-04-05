import express, { Router, Request, Response } from 'express';
import { subscriberService } from '../services/subscriber.service.js';
import { SubscribeEmailSchema } from '../types/index.js';

const router: Router = express.Router();

/**
 * @swagger
 * /api/marketing/subscribers:
 *   post:
 *     summary: Subscribe a new email subscriber
 *     tags: [Subscribers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *               source:
 *                 type: string
 *               utmSource:
 *                 type: string
 *               utmMedium:
 *                 type: string
 *               utmCampaign:
 *                 type: string
 *     responses:
 *       201:
 *         description: Subscriber created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = SubscribeEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const subscriber = await subscriberService.subscribe(parsed.data.email, {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      interests: parsed.data.interests,
      source: parsed.data.source,
      utmSource: parsed.data.utmSource,
      utmMedium: parsed.data.utmMedium,
      utmCampaign: parsed.data.utmCampaign,
    });

    res.status(201).json(subscriber);
  } catch (error: unknown) {
    console.error('Error subscribing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/subscribers/{email}:
 *   get:
 *     summary: Get subscriber details
 *     tags: [Subscribers]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscriber details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Subscriber not found
 *       500:
 *         description: Server error
 */
router.get('/:email', async (req: Request, res: Response) => {
  try {
    const email = req.params.email as string;
    const subscriber = await subscriberService.getSubscriber(email);
    if (!subscriber) {
      return res.status(404).json({ error: 'Subscriber not found' });
    }
    res.json(subscriber);
  } catch (error: unknown) {
    console.error('Error fetching subscriber:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/subscribers/{email}/unsubscribe:
 *   post:
 *     summary: Unsubscribe a subscriber
 *     tags: [Subscribers]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subscriber unsubscribed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/:email/unsubscribe', async (req: Request, res: Response) => {
  try {
    const email = req.params.email as string;
    const subscriber = await subscriberService.unsubscribe(email);
    res.json(subscriber);
  } catch (error: unknown) {
    console.error('Error unsubscribing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/subscribers/admin/stats:
 *   get:
 *     summary: Get subscriber statistics
 *     tags: [Subscribers]
 *     responses:
 *       200:
 *         description: Subscriber stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/admin/stats', async (req: Request, res: Response) => {
  try {
    const stats = await subscriberService.getSubscriberStats();
    res.json(stats);
  } catch (error: unknown) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/subscribers/admin/hot-leads:
 *   get:
 *     summary: Get hot leads from subscribers
 *     tags: [Subscribers]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of hot leads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       500:
 *         description: Server error
 */
router.get('/admin/hot-leads', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const leads = await subscriberService.getHotLeads(limit ? parseInt(limit as string) : 50);
    res.json(leads);
  } catch (error: unknown) {
    console.error('Error fetching hot leads:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
