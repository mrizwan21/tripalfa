import express, { Router, Request, Response } from 'express';
import { getFinanceDb } from '../database.js';

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
 * /api/marketing/crm/campaigns:
 *   get:
 *     summary: List all CRM campaigns with optional filtering and pagination
 *     tags: [CRM Campaigns]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of CRM campaigns
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
 *                 pagination:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { page = '1', limit = '20', status, type } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where: any = {};
    if (status) where.status = status as string;
    if (type) where.type = type as string;

    const [campaigns, total] = await Promise.all([
      getFinanceDb().crm_campaign.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          contacts: { select: { status: true, id: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      getFinanceDb().crm_campaign.count({ where }),
    ]);

    // Add engagement metrics to campaigns
    const campaignsWithMetrics = await Promise.all(
      (campaigns as any[]).map(async (campaign: any) => {
        const stats = {
          totalContacts: campaign.contacts?.length || 0,
          sent: campaign.contacts?.filter((c: any) => c.status === 'sent').length || 0,
          opened: campaign.contacts?.filter((c: any) => c.status === 'opened').length || 0,
          clicked: campaign.contacts?.filter((c: any) => c.status === 'clicked').length || 0,
          converted: campaign.contacts?.filter((c: any) => c.status === 'converted').length || 0,
          failed: campaign.contacts?.filter((c: any) => c.status === 'failed').length || 0,
        };
        return {
          ...campaign,
          stats,
          openRate: stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0,
          clickRate: stats.sent > 0 ? (stats.clicked / stats.sent) * 100 : 0,
          conversionRate: stats.sent > 0 ? (stats.converted / stats.sent) * 100 : 0,
        };
      })
    );

    res.json({
      data: campaignsWithMetrics,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/crm/campaigns/{id}:
 *   get:
 *     summary: Get a specific CRM campaign with detailed engagement data
 *     tags: [CRM Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign details with engagement metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const campaign = (await getFinanceDb().crm_campaign.findUnique({
      where: { id: id as string },
      include: {
        contacts: {
          include: { contact: { select: { email: true, firstName: true, lastName: true } } },
        },
      },
    })) as any;

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Calculate engagement metrics
    const stats = {
      totalContacts: campaign.contacts?.length || 0,
      sent: campaign.contacts?.filter((c: any) => c.status === 'sent').length || 0,
      opened: campaign.contacts?.filter((c: any) => c.status === 'opened').length || 0,
      clicked: campaign.contacts?.filter((c: any) => c.status === 'clicked').length || 0,
      converted: campaign.contacts?.filter((c: any) => c.status === 'converted').length || 0,
      failed: campaign.contacts?.filter((c: any) => c.status === 'failed').length || 0,
    };

    res.json({
      ...campaign,
      stats,
      openRate: stats.sent > 0 ? (stats.opened / stats.sent) * 100 : 0,
      clickRate: stats.sent > 0 ? (stats.clicked / stats.sent) * 100 : 0,
      conversionRate: stats.sent > 0 ? (stats.converted / stats.sent) * 100 : 0,
    });
  } catch (error: unknown) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/crm/campaigns:
 *   post:
 *     summary: Create a new CRM campaign
 *     tags: [CRM Campaigns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *               status:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               targetAudience:
 *                 type: string
 *               budget:
 *                 type: number
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Campaign created successfully
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name,
      description,
      type,
      status,
      startDate,
      endDate,
      targetAudience,
      budget,
      metadata,
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!type) {
      return res.status(400).json({ error: 'type is required' });
    }

    const campaign = await getFinanceDb().crm_campaign.create({
      data: {
        name,
        description: description || null,
        type,
        status: status || 'draft',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        targetAudience: targetAudience || null,
        budget: budget ? (budget.toString() as any) : null,
        metadata: metadata || null,
      },
    });

    res.status(201).json(campaign);
  } catch (error: unknown) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/crm/campaigns/{id}:
 *   patch:
 *     summary: Update a CRM campaign
 *     tags: [CRM Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check if campaign exists
    const existing = await getFinanceDb().crm_campaign.findUnique({ where: { id: id as string } });
    if (!existing) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = await getFinanceDb().crm_campaign.update({
      where: { id: id as string },
      data: updates,
    });

    res.json(campaign);
  } catch (error: unknown) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/crm/campaigns/{id}:
 *   delete:
 *     summary: Delete a CRM campaign
 *     tags: [CRM Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Check if campaign exists
    const existing = await getFinanceDb().crm_campaign.findUnique({ where: { id: id as string } });
    if (!existing) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    await getFinanceDb().crm_campaign.delete({ where: { id: id as string } });

    res.json({ message: 'Campaign deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/crm/campaigns/{id}/contacts:
 *   post:
 *     summary: Add contacts to a CRM campaign
 *     tags: [CRM Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contactIds]
 *             properties:
 *               contactIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Contacts added to campaign
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Server error
 */
router.post('/:id/contacts', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { contactIds } = req.body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'contactIds array is required' });
    }

    // Check if campaign exists
    const campaign = await getFinanceDb().crm_campaign.findUnique({ where: { id: id as string } });
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Create campaign-contact relationships
    const created = await Promise.all(
      contactIds.map(
        (contactId: string) =>
          getFinanceDb()
            .crm_campaign_contact.create({
              data: {
                campaignId: id as string,
                contactId,
                status: 'pending',
              },
            })
            .catch(() => null) // Ignore duplicates or invalid contact IDs
      )
    );

    const successful = created.filter(c => c !== null);

    res.status(201).json({
      message: `Added ${successful.length} contacts to campaign`,
      count: successful.length,
    });
  } catch (error: unknown) {
    console.error('Error adding contacts to campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
