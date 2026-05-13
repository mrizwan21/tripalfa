import { Router, Request, Response } from 'express';

const router: Router = Router();

/**
 * @openapi
 * /api/v1/flight/aircraft:
 *   get:
 *     tags: [Flight]
 *     summary: List aircraft types
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema: { type: integer, default: 1 }
 *       - name: pageSize
 *         in: query
 *         schema: { type: integer, default: 50, maximum: 100 }
 *     responses:
 *       200:
 *         description: Aircraft list retrieved successfully
 */
router.get('/aircraft', async (req, res, next) => {
  try {
    res.json({ data: [], meta: { page: 1, pageSize: 50, totalItems: 0, totalPages: 0 } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/flight/airports:
 *   get:
 *     tags: [Flight]
 *     summary: List airports
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Airports list retrieved successfully
 */
router.get('/airports', async (req, res, next) => {
  try {
    res.json({ data: [], meta: { page: 1, pageSize: 50, totalItems: 0, totalPages: 0 } });
  } catch (error) {
    next(error);
  }
});

export default router;