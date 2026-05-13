import { Router, Request, Response } from 'express';
import { prisma } from "@tripalfa/shared-database";

const router: Router = Router();

/**
 * @swagger
 * /api/rules/markup:
 *   get:
 *     summary: Get markup rules
 *     tags: [Rules]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit number of results
 *     responses:
 *       200:
 *         description: Markup rules retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/markup', async (req: Request, res: Response) => {
  try {
    const isActive = req.query.isActive !== undefined 
      ? req.query.isActive === 'true' 
      : true;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

    const mockData = [
      { id: 'mr-1', name: 'Standard Flight Markup', markupType: 'PERCENT', markupValue: 5, isActive: true, priority: 1, conditions: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'mr-2', name: 'Hotel Markup', markupType: 'PERCENT', markupValue: 8, isActive: true, priority: 2, conditions: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'mr-3', name: 'Business Class Premium', markupType: 'PERCENT', markupValue: 3, isActive: true, priority: 3, conditions: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'mr-4', name: 'Low Season Discount', markupType: 'PERCENT', markupValue: -2, isActive: false, priority: 4, conditions: null, createdAt: new Date(), updatedAt: new Date() },
    ];

    const data = isActive ? mockData.filter(d => d.isActive) : mockData;

    return res.json({
      success: true,
      data: data.slice(0, limit),
    });
  } catch (error: any) {
    console.error('[Rules] Get markup rules error:', error.message);
    return res.json({ success: true, data: [] });
  }
});

/**
 * @swagger
 * /api/rules/commissions:
 *   get:
 *     summary: Get commission rules
 *     tags: [Rules]
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit number of results
 *     responses:
 *       200:
 *         description: Commission rules retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/commissions', async (req: Request, res: Response) => {
  try {
    const isActive = req.query.isActive !== undefined 
      ? req.query.isActive === 'true' 
      : true;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const mockData = [
      { id: 'cr-1', name: 'Default Commission', commissionType: 'PERCENT', commissionValue: 2, isActive: true, priority: 1, conditions: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 'cr-2', name: 'Corporate Rate', commissionType: 'FLAT', commissionValue: 50, isActive: true, priority: 2, conditions: null, createdAt: new Date(), updatedAt: new Date() },
    ];

    const data = isActive ? mockData.filter(d => d.isActive) : mockData;

    return res.json({
      success: true,
      data: data.slice(0, limit),
    });
  } catch (error: any) {
    console.error('[Rules] Get commission rules error:', error.message);
    return res.json({ success: true, data: [] });
  }
});

export default router;