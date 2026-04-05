import express, { Router, Request, Response } from 'express';
import { flyerService } from '../services/flyer.service.js';
import { UploadFlyerSchema } from '../types/index.js';

const router: Router = express.Router();

/**
 * @swagger
 * /api/marketing/flyers:
 *   post:
 *     summary: Create a new flyer
 *     tags: [Flyers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, designJson, uploadedBy]
 *             properties:
 *               title:
 *                 type: string
 *               designJson:
 *                 type: object
 *               uploadedBy:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Flyer created successfully
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
    const parsed = UploadFlyerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const flyer = await flyerService.createFlyer(
      parsed.data.title,
      parsed.data.designJson,
      parsed.data.uploadedBy,
      {
        description: parsed.data.description,
      }
    );

    res.status(201).json(flyer);
  } catch (error: unknown) {
    console.error('Error creating flyer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/flyers/{flyerId}:
 *   get:
 *     summary: Get flyer details
 *     tags: [Flyers]
 *     parameters:
 *       - in: path
 *         name: flyerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Flyer details
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
 *         description: Flyer not found
 *       500:
 *         description: Server error
 */
router.get('/:flyerId', async (req: Request, res: Response) => {
  try {
    const { flyerId } = req.params;
    const flyer = await flyerService.getFlyer(flyerId as string);
    if (!flyer) {
      return res.status(404).json({ error: 'Flyer not found' });
    }
    res.json(flyer);
  } catch (error: unknown) {
    console.error('Error fetching flyer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/flyers/share/{shareableLink}:
 *   get:
 *     summary: Get flyer by shareable link
 *     tags: [Flyers]
 *     parameters:
 *       - in: path
 *         name: shareableLink
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Flyer details
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
 *         description: Flyer not found
 *       500:
 *         description: Server error
 */
router.get('/share/:shareableLink', async (req: Request, res: Response) => {
  try {
    const { shareableLink } = req.params;
    const flyer = await flyerService.getFlyerByShareLink(shareableLink as string);
    if (!flyer) {
      return res.status(404).json({ error: 'Flyer not found' });
    }
    res.json(flyer);
  } catch (error: unknown) {
    console.error('Error fetching flyer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/flyers/{flyerId}:
 *   put:
 *     summary: Update a flyer
 *     tags: [Flyers]
 *     parameters:
 *       - in: path
 *         name: flyerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Flyer updated
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
router.put('/:flyerId', async (req: Request, res: Response) => {
  try {
    const { flyerId } = req.params;
    const flyer = await flyerService.updateFlyer(flyerId as string, req.body);
    res.json(flyer);
  } catch (error: unknown) {
    console.error('Error updating flyer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/flyers/{flyerId}/publish:
 *   post:
 *     summary: Publish a flyer
 *     tags: [Flyers]
 *     parameters:
 *       - in: path
 *         name: flyerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Flyer published
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
router.post('/:flyerId/publish', async (req: Request, res: Response) => {
  try {
    const { flyerId } = req.params;
    const flyer = await flyerService.publishFlyer(flyerId as string);
    res.json(flyer);
  } catch (error: unknown) {
    console.error('Error publishing flyer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/flyers/{flyerId}/share:
 *   post:
 *     summary: Track flyer share
 *     tags: [Flyers]
 *     parameters:
 *       - in: path
 *         name: flyerId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [platform]
 *             properties:
 *               platform:
 *                 type: string
 *     responses:
 *       200:
 *         description: Share tracked
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
 *         description: Missing platform
 *       500:
 *         description: Server error
 */
router.post('/:flyerId/share', async (req: Request, res: Response) => {
  try {
    const { flyerId } = req.params;
    const { platform } = req.body;

    if (!platform) {
      return res.status(400).json({ error: 'platform is required' });
    }

    const result = await flyerService.trackShare(flyerId as string, platform);
    res.json(result);
  } catch (error: unknown) {
    console.error('Error tracking share:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/flyers:
 *   get:
 *     summary: List all flyers
 *     tags: [Flyers]
 *     parameters:
 *       - in: query
 *         name: isPublished
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: List of flyers
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
router.get('/', async (req: Request, res: Response) => {
  try {
    const { isPublished, featured, limit, offset } = req.query;
    const result = await flyerService.listFlyers({
      isPublished: isPublished === 'true',
      featured: featured === 'true',
      limit: limit ? parseInt(limit as string) : 20,
      offset: offset ? parseInt(offset as string) : 0,
    });
    res.json(result);
  } catch (error: unknown) {
    console.error('Error listing flyers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
