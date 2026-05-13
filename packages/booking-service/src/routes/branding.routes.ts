import { Router, Request, Response } from 'express';
import { prisma } from "@tripalfa/shared-database";

const router: Router = Router();

/**
 * @swagger
 * /api/branding/settings:
 *   get:
 *     summary: Get tenant branding settings
 *     tags: [Branding]
 *     responses:
 *       200:
 *         description: Branding settings retrieved successfully
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
 *                     appName:
 *                       type: string
 *                     logoUrl:
 *                       type: string
 *                     primaryColor:
 *                       type: string
 *                     secondaryColor:
 *                       type: string
 *                     fontFamily:
 *                       type: string
 *                     features:
 *                       type: object
 */
router.get('/settings', async (_req: Request, res: Response) => {
  try {
    // Fetch default system config for appName
    const [appNameConfig, theme] = await Promise.all([
      prisma.systemConfig.findUnique({
        where: { key: 'app_name' },
      }),
      prisma.whiteLabelTheme.findFirst({
        where: { tenantId: { not: undefined } },
      }).catch(() => null),
    ]);

    const appName = appNameConfig?.value as string || 'TripAlfa';

    return res.json({
      success: true,
      data: {
        appName,
        logoUrl: theme?.logoUrl || '/logo.png',
        primaryColor: theme?.primaryColor || '#000000',
        secondaryColor: theme?.secondaryColor || '#ffffff',
        fontFamily: theme?.fontFamily || 'Inter',
        features: theme?.featureFlags as Record<string, unknown> || {},
      },
    });
  } catch (error: any) {
    console.error('[Branding] Get settings error:', error.message);
    // Return default settings on error
    return res.json({
      success: true,
      data: {
        appName: 'TripAlfa',
        logoUrl: '/logo.png',
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
        fontFamily: 'Inter',
        features: {},
      },
    });
  }
});

/**
 * @swagger
 * /api/branding/colors:
 *   get:
 *     summary: Get tenant branding colors
 *     tags: [Branding]
 *     responses:
 *       200:
 *         description: Branding colors retrieved successfully
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
 *                     primaryColor:
 *                       type: string
 *                     secondaryColor:
 *                       type: string
 */
router.get('/colors', async (_req: Request, res: Response) => {
  try {
    const theme = await prisma.whiteLabelTheme.findFirst({
      where: { tenantId: { not: undefined } },
    }).catch(() => null);

    return res.json({
      success: true,
      data: {
        primaryColor: theme?.primaryColor || '#000000',
        secondaryColor: theme?.secondaryColor || '#ffffff',
      },
    });
  } catch (error: any) {
    console.error('[Branding] Get colors error:', error.message);
    return res.json({
      success: true,
      data: {
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
      },
    });
  }
});

export default router;