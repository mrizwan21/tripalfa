import { Router, Request, Response } from 'express';

const router: Router = Router();

interface DashboardMetrics {
  kycMetrics: {
    totalSubmissions: number;
    verifiedCount: number;
    rejectedCount: number;
    pendingCount: number;
    verificationRate: number;
  };
  systemMetrics: {
    apiLatency: number;
    syncStatus: 'SYNCED' | 'SYNCING' | 'ERROR';
    lastSyncTime: string;
    uptime: number;
  };
}

/**
 * @swagger
 * /api/crm/dashboard-sync:
 *   get:
 *     summary: Get dashboard metrics
 *     tags: [Dashboard Sync]
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
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
 *                     kycMetrics:
 *                       type: object
 *                     systemMetrics:
 *                       type: object
 *       500:
 *         description: Internal server error
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
router.get('/', (req: Request, res: Response) => {
  try {
    const metrics: DashboardMetrics = {
      kycMetrics: {
        totalSubmissions: 247,
        verifiedCount: 189,
        rejectedCount: 32,
        pendingCount: 26,
        verificationRate: 0.765,
      },
      systemMetrics: {
        apiLatency: 45,
        syncStatus: 'SYNCED',
        lastSyncTime: new Date().toISOString(),
        uptime: 0.9998,
      },
    };

    res.status(200).json({ success: true, data: metrics });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard metrics' });
  }
});

/**
 * @swagger
 * /api/crm/kyc-history:
 *   get:
 *     summary: Get KYC metrics history
 *     tags: [Dashboard Sync]
 *     responses:
 *       200:
 *         description: KYC metrics history retrieved successfully
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
 *                     properties:
 *                       timestamp: { type: string }
 *                       verified: { type: number }
 *                       pending: { type: number }
 *                       rejected: { type: number }
 *       500:
 *         description: Internal server error
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
router.get('/kyc-history', (req: Request, res: Response) => {
  try {
    const history = Array.from({ length: 30 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        timestamp: date.toISOString(),
        verified: Math.floor(Math.random() * 50) + 10,
        pending: Math.floor(Math.random() * 20) + 5,
        rejected: Math.floor(Math.random() * 15) + 2,
      };
    });

    res.status(200).json({ success: true, data: history });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

/**
 * @swagger
 * /api/crm/recent-activities:
 *   get:
 *     summary: Get recent activities
 *     tags: [Dashboard Sync]
 *     responses:
 *       200:
 *         description: Recent activities retrieved successfully
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
 *                     properties:
 *                       id: { type: string }
 *                       type: { type: string }
 *                       title: { type: string }
 *                       description: { type: string }
 *                       timestamp: { type: string }
 *       500:
 *         description: Internal server error
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
router.get('/recent-activities', (req: Request, res: Response) => {
  try {
    const activities = [
      {
        id: '1',
        type: 'KYC_VERIFIED',
        title: 'KYC Verified',
        description: 'Acme Corp verified',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        type: 'KYC_REJECTED',
        title: 'KYC Rejected',
        description: 'Invalid documentation',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '3',
        type: 'CONTACT_ADDED',
        title: 'Contact Added',
        description: 'John Doe added',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: '4',
        type: 'BOOKING_CREATED',
        title: 'Booking Created',
        description: 'NYC Hotel booking',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
      },
      {
        id: '5',
        type: 'KYC_SUBMITTED',
        title: 'KYC Submitted',
        description: 'New submission from TechCorp',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
      },
    ];

    res.status(200).json({ success: true, data: activities });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to fetch activities' });
  }
});

export default router;
