import express, { Router, Request, Response } from 'express';
import { prisma } from '../database.js';

const router: Router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    companyId: string;
  };
}

/**
 * @swagger
 * /api/marketing/crm/metrics:
 *   get:
 *     summary: Get aggregated CRM metrics for the dashboard
 *     tags: [CRM Metrics]
 *     parameters:
 *       - in: query
 *         name: range
 *         schema:
 *           type: string
 *           enum: [week, month, quarter]
 *           default: month
 *     responses:
 *       200:
 *         description: CRM metrics data
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
 *                     contacts:
 *                       type: object
 *                     campaigns:
 *                       type: object
 *                     activities:
 *                       type: object
 *                     engagement:
 *                       type: object
 *                     chartData:
 *                       type: array
 *                     topCampaigns:
 *                       type: array
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { range = 'month' } = req.query;
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'month':
      default:
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    // Get contact statistics
    const totalContacts = await prisma.crm_contact.count();
    const activeContacts = await prisma.crm_contact.count({
      where: { status: { in: ['prospect', 'customer'] } },
    });
    const leads = await prisma.crm_contact.count({
      where: { status: 'lead' },
    });

    // Get new contacts this month vs last month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(currentMonthStart.getTime() - 1);

    const newContactsThisMonth = await prisma.crm_contact.count({
      where: { createdAt: { gte: currentMonthStart } },
    });

    const newContactsLastMonth = await prisma.crm_contact.count({
      where: {
        createdAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    });

    // Get campaign statistics
    const totalCampaigns = await prisma.crm_campaign.count();
    const activeCampaigns = await prisma.crm_campaign.count({
      where: { status: 'active' },
    });

    // Get campaign engagement rates
    const campaignStats = await prisma.crm_campaign_contact.groupBy({
      by: ['status'],
      _count: true,
    });

    const totalCampaignContacts = campaignStats.reduce((sum, stat) => sum + stat._count, 0);
    const openedCount = campaignStats.find(s => s.status === 'opened')?._count || 0;
    const clickedCount = campaignStats.find(s => s.status === 'clicked')?._count || 0;
    const convertedCount = campaignStats.find(s => s.status === 'converted')?._count || 0;

    const campaignOpenRate =
      totalCampaignContacts > 0 ? (openedCount / totalCampaignContacts) * 100 : 0;
    const campaignClickRate =
      totalCampaignContacts > 0 ? (clickedCount / totalCampaignContacts) * 100 : 0;
    const campaignConversionRate =
      totalCampaignContacts > 0 ? (convertedCount / totalCampaignContacts) * 100 : 0;

    // Get activity statistics
    const totalActivities = await prisma.crm_activity.count();
    const pendingActivities = await prisma.crm_activity.count({
      where: { status: 'pending' },
    });
    const completedActivities = await prisma.crm_activity.count({
      where: { status: 'completed' },
    });

    // Get hot leads (prospects with many recent activities)
    const hotLeads = await prisma.crm_contact.findMany({
      where: {
        status: 'prospect',
        lastInteractionAt: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        activities: {
          where: { createdAt: { gte: startDate } },
        },
      },
      take: 10,
    });

    const hotLeadsCount = hotLeads.length;

    // Calculate average engagement score (simplified: based on activity frequency)
    const avgEngagementScore =
      totalContacts > 0 ? Math.min(100, (totalActivities / totalContacts) * 10) : 0;

    // Get chart data (daily breakdown for the past 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayContacts = await prisma.crm_contact.count({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
      });

      const dayCampaignEngagements = await prisma.crm_campaign_contact.count({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
      });

      const dayActivities = await prisma.crm_activity.count({
        where: { createdAt: { gte: dayStart, lte: dayEnd } },
      });

      chartData.push({
        date: dateStr,
        contacts: dayContacts,
        campaigns: dayCampaignEngagements,
        activities: dayActivities,
      });
    }

    // Get top campaigns by engagement
    const topCampaigns = await prisma.crm_campaign.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        contacts: { select: { status: true } },
      },
    });

    const topCampaignsWithMetrics = topCampaigns.map(campaign => {
      const total = campaign.contacts.length;
      const opened = campaign.contacts.filter(c => c.status === 'opened').length;
      const clicked = campaign.contacts.filter(c => c.status === 'clicked').length;
      const converted = campaign.contacts.filter(c => c.status === 'converted').length;

      return {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        totalContacts: total,
        openRate: total > 0 ? (opened / total) * 100 : 0,
        clickRate: total > 0 ? (clicked / total) * 100 : 0,
        conversionRate: total > 0 ? (converted / total) * 100 : 0,
      };
    });

    // Source breakdown
    const contactsBySource = await prisma.crm_contact.groupBy({
      by: ['source'],
      _count: true,
      where: { source: { not: null } },
    });

    const sourceBreakdown = contactsBySource.map(group => ({
      source: group.source,
      count: group._count,
    }));

    res.json({
      contacts: {
        total: totalContacts,
        active: activeContacts,
        leads,
        newThisMonth: newContactsThisMonth,
        newLastMonth: newContactsLastMonth,
        bySource: sourceBreakdown,
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
        openRate: Math.round(campaignOpenRate * 100) / 100,
        clickRate: Math.round(campaignClickRate * 100) / 100,
        conversionRate: Math.round(campaignConversionRate * 100) / 100,
      },
      activities: {
        total: totalActivities,
        pending: pendingActivities,
        completed: completedActivities,
      },
      engagement: {
        hotLeadsCount,
        avgEngagementScore: Math.round(avgEngagementScore * 100) / 100,
      },
      chartData,
      topCampaigns: topCampaignsWithMetrics,
    });
  } catch (error: unknown) {
    console.error('Error fetching CRM metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
