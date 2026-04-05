import express, { Router, Request, Response } from 'express';
import { getCoreDb } from '../database.js';
import { visitorService } from '../services/visitor.service.js';
import { TrackVisitorSchema } from '../types/index.js';

const router: Router = express.Router();

/**
 * @swagger
 * /api/marketing/visitors/track:
 *   post:
 *     summary: Track a visitor session
 *     tags: [Visitors]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sessionId, pageUrl]
 *             properties:
 *               sessionId:
 *                 type: string
 *               pageUrl:
 *                 type: string
 *               email:
 *                 type: string
 *               deviceType:
 *                 type: string
 *               deviceOs:
 *                 type: string
 *               browserName:
 *                 type: string
 *               location:
 *                 type: object
 *                 properties:
 *                   country:
 *                     type: string
 *                   city:
 *                     type: string
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *     responses:
 *       200:
 *         description: Visitor tracked successfully
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
router.post('/track', async (req: Request, res: Response) => {
  try {
    const parsed = TrackVisitorSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const { sessionId, pageUrl, ...data } = parsed.data;
    const visitor = await visitorService.trackVisitor(sessionId as string, pageUrl as string, {
      email: data.email as string,
      deviceType: data.deviceType,
      deviceOs: data.deviceOs,
      browserName: data.browserName,
      country: data.location?.country,
      city: data.location?.city,
      latitude: data.location?.latitude,
      longitude: data.location?.longitude,
    });

    res.json(visitor);
  } catch (error: unknown) {
    console.error('Error tracking visitor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/visitors/{sessionId}/search:
 *   post:
 *     summary: Track a search event for a visitor
 *     tags: [Visitors]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Search tracked successfully
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
router.post('/:sessionId/search', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const search = await visitorService.trackSearch(sessionId, req.body);
    res.json(search);
  } catch (error: unknown) {
    console.error('Error tracking search:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/visitors/{sessionId}:
 *   get:
 *     summary: Get visitor profile by session ID
 *     tags: [Visitors]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Visitor profile
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
 *         description: Visitor not found
 *       500:
 *         description: Server error
 */
router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const sessionId = req.params.sessionId as string;
    const profile = await visitorService.getVisitorProfile(sessionId);
    if (!profile) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    res.json(profile);
  } catch (error: unknown) {
    console.error('Error fetching visitor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/visitors/admin/active:
 *   get:
 *     summary: Get list of active visitors
 *     tags: [Visitors]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: List of active visitors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get('/admin/active', async (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const visitors = await visitorService.getActiveVisitors(limit ? parseInt(limit as string) : 50);
    res.json(visitors);
  } catch (error: unknown) {
    console.error('Error fetching active visitors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/visitors/admin/analytics:
 *   get:
 *     summary: Get visitor analytics data
 *     tags: [Visitors]
 *     parameters:
 *       - in: query
 *         name: daysBack
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Visitor analytics data
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
router.get('/admin/analytics', async (req: Request, res: Response) => {
  try {
    const { daysBack } = req.query;
    const analytics = await visitorService.getVisitorAnalytics(
      daysBack ? parseInt(daysBack as string) : 7
    );
    res.json(analytics);
  } catch (error: unknown) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
