import { Router, Request, Response } from 'express';
import { fusionAuthSecurityService } from '../services/fusionauth-security.service.js';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth.middleware.js';

const router: Router = Router();

/**
 * Normalizes request parameters that might be strings or string arrays.
 */
const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};

/**
 * Standardized error handler for controllers.
 */
const handleControllerError = (res: Response, error: unknown, status = 500) => {
  res.status(status).json({
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
  });
};

/**
 * @swagger
 * /auth/fusionauth/security/check:
 *   post:
 *     summary: Perform security check
 *     tags: [FusionAuth Security]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ipAddress
 *             properties:
 *               userId:
 *                 type: string
 *               ipAddress:
 *                 type: string
 *               userAgent:
 *                 type: string
 *               companyId:
 *                 type: string
 *               userType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Security check result
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
 *         description: Missing IP address
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post('/security/check', async (req: Request, res: Response) => {
  try {
    const { userId, ipAddress, userAgent, companyId, userType } = req.body;

    if (!ipAddress) {
      res.status(400).json({
        success: false,
        error: 'IP address is required',
      });
      return;
    }

    const result = await fusionAuthSecurityService.performSecurityCheck({
      userId,
      ipAddress,
      userAgent,
      companyId,
      userType,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /auth/fusionauth/security/blocked/{ip}:
 *   get:
 *     summary: Check if IP is blocked
 *     tags: [FusionAuth Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ip
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: IP block status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     blocked:
 *                       type: boolean
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.get(
  '/security/blocked/:ip',
  authMiddleware as any,
  requireRole('SUPER_ADMIN', 'B2B_ADMIN') as any,
  async (req: AuthRequest, res: Response) => {
    try {
      const blocked = await fusionAuthSecurityService.isIpBlocked(
        getParam(req.params.ip),
        req.user?.sub,
        req.user?.companyId
      );

      res.json({
        success: true,
        data: { blocked },
      });
    } catch (error: unknown) {
      handleControllerError(res, error);
    }
  }
);

export default router;
