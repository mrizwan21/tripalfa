import { Router, Request, Response } from 'express';
import { prisma } from '../database';

const router: Router = Router();

/**
 * @swagger
 * /api/analytics/tickets:
 *   get:
 *     summary: Get ticket analytics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Ticket analytics retrieved successfully
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
 *                     total:
 *                       type: integer
 *                     open:
 *                       type: integer
 *                     resolved:
 *                       type: integer
 *                     averageResolutionTime:
 *                       type: string
 *                     byPriority:
 *                       type: object
 *                     byCategory:
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
router.get('/tickets', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      total: 0,
      open: 0,
      resolved: 0,
      averageResolutionTime: '0h',
      byPriority: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },
      byCategory: {},
    },
    message: 'Ticket analytics endpoint - to be implemented',
  });
});

/**
 * @swagger
 * /api/analytics/customers:
 *   get:
 *     summary: Get customer analytics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Customer analytics retrieved successfully
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
 *                     total:
 *                       type: integer
 *                     active:
 *                       type: integer
 *                     newThisMonth:
 *                       type: integer
 *                     satisfactionScore:
 *                       type: integer
 *                     byTier:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           tier:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           totalSpent:
 *                             type: number
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
router.get('/customers', async (req: Request, res: Response) => {
  try {
    const [total, active, newThisMonth, tierStats] = await Promise.all([
      prisma.crm_contact.count(),
      prisma.crm_contact.count({
        where: {
          status: 'customer',
          lastInteractionAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
      prisma.crm_contact.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // This month
          },
        },
      }),
      prisma.crm_contact.groupBy({
        by: ['tier'],
        _count: {
          id: true,
        },
        _sum: {
          totalSpent: true,
        },
      }),
    ]);

    // Calculate average satisfaction score (placeholder logic)
    const satisfactionScore = 85; // This would come from actual ratings

    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        newThisMonth,
        satisfactionScore,
        byTier: tierStats.map((stat: any) => ({
          tier: stat.tier || 'unknown',
          count: stat._count.id,
          totalSpent: stat._sum.totalSpent || 0,
        })),
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching customer analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer analytics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/analytics/agent-performance:
 *   get:
 *     summary: Get agent performance analytics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Agent performance analytics retrieved successfully
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
router.get('/agent-performance', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: [],
    message: 'Agent performance analytics endpoint - to be implemented',
  });
});

/**
 * @swagger
 * /api/analytics/visitors:
 *   get:
 *     summary: Get visitor analytics
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for the analytics period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for the analytics period
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [hour, day, month]
 *           default: day
 *         description: Grouping interval for time series data
 *     responses:
 *       200:
 *         description: Visitor analytics retrieved successfully
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
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalSessions:
 *                           type: integer
 *                         convertedSessions:
 *                           type: integer
 *                         conversionRate:
 *                           type: number
 *                         averageDuration:
 *                           type: string
 *                         bounceRate:
 *                           type: number
 *                     byDevice:
 *                       type: array
 *                       items:
 *                         type: object
 *                     byCountry:
 *                       type: array
 *                       items:
 *                         type: object
 *                     bySource:
 *                       type: array
 *                       items:
 *                         type: object
 *                     timeSeries:
 *                       type: array
 *                       items:
 *                         type: object
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
router.get('/visitors', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get visitor session statistics
    const [totalSessions, convertedSessions, byDevice, byCountry, bySource] = await Promise.all([
      prisma.crm_visitor_session.count({
        where: {
          startTime: {
            gte: start,
            lte: end,
          },
        },
      }),
      prisma.crm_visitor_session.count({
        where: {
          startTime: {
            gte: start,
            lte: end,
          },
          converted: true,
        },
      }),
      prisma.crm_visitor_session.groupBy({
        by: ['deviceType'],
        where: {
          startTime: {
            gte: start,
            lte: end,
          },
        },
        _count: {
          id: true,
        },
      }),
      prisma.crm_visitor_session.groupBy({
        by: ['country'],
        where: {
          startTime: {
            gte: start,
            lte: end,
          },
          country: {
            not: null,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      }),
      prisma.crm_visitor_session.groupBy({
        by: ['utmSource'],
        where: {
          startTime: {
            gte: start,
            lte: end,
          },
          utmSource: {
            not: null,
          },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Calculate conversion rate
    const conversionRate = totalSessions > 0 ? (convertedSessions / totalSessions) * 100 : 0;

    // Get time series data for chart
    let timeSeriesQuery = '';
    let timeFormat = '';

    if (groupBy === 'hour') {
      timeFormat = 'YYYY-MM-DD HH24:00';
      timeSeriesQuery = `
        SELECT 
          DATE_TRUNC('hour', "startTime") as time_bucket,
          COUNT(*) as session_count,
          SUM(CASE WHEN converted THEN 1 ELSE 0 END) as converted_count
        FROM "crm_visitor_session"
        WHERE "startTime" >= $1 AND "startTime" <= $2
        GROUP BY DATE_TRUNC('hour', "startTime")
        ORDER BY time_bucket
      `;
    } else if (groupBy === 'day') {
      timeFormat = 'YYYY-MM-DD';
      timeSeriesQuery = `
        SELECT 
          DATE_TRUNC('day', "startTime") as time_bucket,
          COUNT(*) as session_count,
          SUM(CASE WHEN converted THEN 1 ELSE 0 END) as converted_count
        FROM "crm_visitor_session"
        WHERE "startTime" >= $1 AND "startTime" <= $2
        GROUP BY DATE_TRUNC('day', "startTime")
        ORDER BY time_bucket
      `;
    } else {
      timeFormat = 'YYYY-MM';
      timeSeriesQuery = `
        SELECT 
          DATE_TRUNC('month', "startTime") as time_bucket,
          COUNT(*) as session_count,
          SUM(CASE WHEN converted THEN 1 ELSE 0 END) as converted_count
        FROM "crm_visitor_session"
        WHERE "startTime" >= $1 AND "startTime" <= $2
        GROUP BY DATE_TRUNC('month', "startTime")
        ORDER BY time_bucket
      `;
    }

    const timeSeries = await prisma.$queryRawUnsafe(
      timeSeriesQuery,
      start.toISOString(),
      end.toISOString()
    );

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalSessions,
          convertedSessions,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
          averageDuration: '0m', // Would need to calculate from durationSeconds
          bounceRate: 0, // Would need to calculate from single-page sessions
        },
        byDevice: byDevice.map((d: any) => ({
          deviceType: d.deviceType || 'unknown',
          count: d._count.id,
        })),
        byCountry: byCountry.map((c: any) => ({
          country: c.country || 'unknown',
          count: c._count.id,
        })),
        bySource: bySource.map((s: any) => ({
          source: s.utmSource || 'unknown',
          count: s._count.id,
        })),
        timeSeries: timeSeries || [],
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching visitor analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch visitor analytics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/analytics/lead-scores:
 *   get:
 *     summary: Get lead score analytics
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: integer
 *         description: Minimum lead score filter
 *       - in: query
 *         name: maxScore
 *         schema:
 *           type: integer
 *         description: Maximum lead score filter
 *       - in: query
 *         name: grade
 *         schema:
 *           type: string
 *         description: Lead grade filter
 *     responses:
 *       200:
 *         description: Lead score analytics retrieved successfully
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
 *                     leadScores:
 *                       type: array
 *                       items:
 *                         type: object
 *                     gradeDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         averageScore:
 *                           type: number
 *                         averageConversionProbability:
 *                           type: number
 *                         minScore:
 *                           type: number
 *                         maxScore:
 *                           type: number
 *                         totalCount:
 *                           type: integer
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
router.get('/lead-scores', async (req: Request, res: Response) => {
  try {
    const { minScore, maxScore, grade } = req.query;

    const where: any = {};

    if (minScore) {
      where.score = {
        ...where.score,
        gte: parseInt(minScore as string, 10),
      };
    }

    if (maxScore) {
      where.score = {
        ...where.score,
        lte: parseInt(maxScore as string, 10),
      };
    }

    if (grade) {
      where.grade = grade;
    }

    const [leadScores, gradeDistribution, scoreStats] = await Promise.all([
      prisma.crm_lead_score.findMany({
        where,
        include: {
          contact: true,
        },
        orderBy: {
          score: 'desc',
        },
        take: 50,
      }),
      prisma.crm_lead_score.groupBy({
        by: ['grade'],
        _count: {
          id: true,
        },
      }),
      prisma.crm_lead_score.aggregate({
        where,
        _avg: {
          score: true,
          conversionProbability: true,
        },
        _min: {
          score: true,
        },
        _max: {
          score: true,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        leadScores,
        gradeDistribution: gradeDistribution.map((g: any) => ({
          grade: g.grade,
          count: g._count.id,
        })),
        statistics: {
          averageScore: scoreStats._avg.score || 0,
          averageConversionProbability: scoreStats._avg.conversionProbability || 0,
          minScore: scoreStats._min.score || 0,
          maxScore: scoreStats._max.score || 0,
          totalCount: leadScores.length,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching lead score analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead score analytics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/analytics/top-pages:
 *   get:
 *     summary: Get top performing pages analytics
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for the analytics period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for the analytics period
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Maximum number of pages to return
 *     responses:
 *       200:
 *         description: Top pages analytics retrieved successfully
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
 *                     topPages:
 *                       type: array
 *                       items:
 *                         type: object
 *                     pageTrend:
 *                       type: array
 *                       items:
 *                         type: object
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
router.get('/top-pages', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, limit = '10' } = req.query;

    const start = startDate
      ? new Date(startDate as string)
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();
    const limitNum = parseInt(limit as string, 10);

    // Get top pages by views
    interface TopPageResult {
      pageUrl: string;
      pageTitle: string | null;
      pageCategory: string | null;
      view_count: number;
      avg_time_on_page: number | null;
      avg_scroll_depth: number | null;
    }

    const topPages = await prisma.$queryRaw<TopPageResult[]>`
      SELECT
        "pageUrl",
        "pageTitle",
        "pageCategory",
        COUNT(*) as view_count,
        AVG("timeOnPageSeconds") as avg_time_on_page,
        AVG("scrollDepth") as avg_scroll_depth
      FROM "crm_visitor_page_view"
      WHERE "timestamp" >= ${start} AND "timestamp" <= ${end}
      GROUP BY "pageUrl", "pageTitle", "pageCategory"
      ORDER BY view_count DESC
      LIMIT ${limitNum}
    `;

    // Get page views over time for the top page
    const topPageUrl = topPages[0]?.pageUrl;
    let pageTrend: Array<{ date: Date; view_count: number }> = [];

    if (topPageUrl) {
      pageTrend = await prisma.$queryRaw<Array<{ date: Date; view_count: number }>>`
        SELECT
          DATE_TRUNC('day', "timestamp") as date,
          COUNT(*) as view_count
        FROM "crm_visitor_page_view"
        WHERE "pageUrl" = ${topPageUrl}
          AND "timestamp" >= ${start} AND "timestamp" <= ${end}
        GROUP BY DATE_TRUNC('day', "timestamp")
        ORDER BY date
      `;
    }

    res.status(200).json({
      success: true,
      data: {
        topPages,
        pageTrend,
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching top pages analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top pages analytics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
