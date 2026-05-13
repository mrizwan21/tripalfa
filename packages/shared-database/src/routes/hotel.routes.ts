import { Router, Request, Response } from 'express';

const router: Router = Router();

/**
 * @openapi
 * /api/v1/hotel/hotels:
 *   get:
 *     tags: [Hotel]
 *     summary: List hotels
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
 *         description: Hotels list retrieved successfully
 */
router.get('/hotels', async (req, res, next) => {
  try {
    res.json({ data: [], meta: { page: 1, pageSize: 50, totalItems: 0, totalPages: 0 } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/hotel/reviews:
 *   get:
 *     tags: [Hotel]
 *     summary: List hotel reviews
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Reviews list retrieved successfully
 */
router.get('/reviews', async (req, res, next) => {
  try {
    res.json({ data: [], meta: { page: 1, pageSize: 50, totalItems: 0, totalPages: 0 } });
  } catch (error) {
    next(error);
  }
});

export default router;