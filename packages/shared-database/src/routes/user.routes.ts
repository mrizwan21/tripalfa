import { Router, Request, Response } from 'express';

const router: Router = Router();

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: List users
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
 *         description: Users list retrieved successfully
 */
router.get('/', async (req, res, next) => {
  try {
    res.json({ data: [], meta: { page: 1, pageSize: 50, totalItems: 0, totalPages: 0 } });
  } catch (error) {
    next(error);
  }
});

export default router;