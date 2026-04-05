import { Router, Request, Response } from 'express';
import { prisma } from '../database';
import { tierService } from '../services/tierService';
import { TierUpdateJob, tierUpdateJob } from '../services/tierUpdateJob';
import { tierNotificationService } from '../services/tierNotificationService';

const router: Router = Router();

/**
 * @swagger
 * /api/crm/customers:
 *   get:
 *     summary: List customers with filtering and pagination
 *     tags: [Customers]
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
 *         name: tier
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      tier,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (tier) {
      where.tier = tier;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder;

    // Fetch customers with pagination
    const [customers, total] = await Promise.all([
      prisma.crm_contact.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          leadScore: true,
          activities: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
      }),
      prisma.crm_contact.count({ where }),
    ]);

    res.status(200).json({
      success: true,
      data: customers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/crm/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.crm_contact.findUnique({
      where: { id },
      include: {
        leadScore: true,
        activities: {
          orderBy: { createdAt: 'desc' },
        },
        campaigns: {
          include: {
            campaign: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error: unknown) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/crm/customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               company:
 *                 type: string
 *               status:
 *                 type: string
 *                 default: lead
 *               source:
 *                 type: string
 *               tier:
 *                 type: string
 *                 default: bronze
 *               totalBookings:
 *                 type: integer
 *                 default: 0
 *               totalSpent:
 *                 type: number
 *                 default: 0
 *               bookingsCount:
 *                 type: integer
 *                 default: 0
 *               openTicketsCount:
 *                 type: integer
 *                 default: 0
 *               location:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Created
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
 *         description: Bad request
 *       409:
 *         description: Conflict
 *       500:
 *         description: Server error
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      company,
      status = 'lead',
      source,
      tier = 'bronze',
      totalBookings = 0,
      totalSpent = 0,
      bookingsCount = 0,
      openTicketsCount = 0,
      location,
      metadata,
    } = req.body;

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Check if customer already exists
    const existingCustomer = await prisma.crm_contact.findUnique({
      where: { email },
    });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: `Customer with email ${email} already exists`,
      });
    }

    const customer = await prisma.crm_contact.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        company,
        status,
        source,
        tier,
        totalBookings,
        totalSpent,
        bookingsCount,
        openTicketsCount,
        location,
        metadata,
        lastInteractionAt: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully',
    });
  } catch (error: unknown) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/crm/customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
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
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.email;
    delete updateData.createdAt;

    // Update lastInteractionAt if any meaningful field is being updated
    if (Object.keys(updateData).length > 0) {
      updateData.lastInteractionAt = new Date();
    }

    const customer = await prisma.crm_contact.update({
      where: { id },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      data: customer,
      message: 'Customer updated successfully',
    });
  } catch (error: unknown) {
    console.error('Error updating customer:', error);

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${req.params.id} not found`,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/crm/customers/{id}:
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.crm_contact.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error: unknown) {
    console.error('Error deleting customer:', error);

    if (error instanceof Error && error.message.includes('Record to delete not found')) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${id} not found`,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/crm/customers/{id}/lead-score:
 *   get:
 *     summary: Get lead score for customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/:id/lead-score', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const leadScore = await prisma.crm_lead_score.findUnique({
      where: { contactId: id },
    });

    if (!leadScore) {
      return res.status(404).json({
        success: false,
        message: `Lead score not found for customer ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: leadScore,
    });
  } catch (error: unknown) {
    console.error('Error fetching lead score:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lead score',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/crm/customers/{id}/lead-score:
 *   post:
 *     summary: Create or update lead score
 *     tags: [Customers]
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
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.post('/:id/lead-score', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const leadScoreData = req.body;

    // Get customer to ensure it exists
    const customer = await prisma.crm_contact.findUnique({
      where: { id },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${id} not found`,
      });
    }

    // Upsert lead score
    const leadScore = await prisma.crm_lead_score.upsert({
      where: { contactId: id },
      update: {
        ...leadScoreData,
        lastCalculatedAt: new Date(),
        updatedAt: new Date(),
      },
      create: {
        contactId: id,
        email: customer.email,
        ...leadScoreData,
        lastCalculatedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      data: leadScore,
      message: 'Lead score updated successfully',
    });
  } catch (error: unknown) {
    console.error('Error updating lead score:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lead score',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/crm/customers/stats/tiers:
 *   get:
 *     summary: Get customer tier statistics
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: Success
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
 *         description: Server error
 */
router.get('/stats/tiers', async (req: Request, res: Response) => {
  try {
    const tierStats = await prisma.crm_contact.groupBy({
      by: ['tier'],
      _count: {
        id: true,
      },
      _sum: {
        totalSpent: true,
        totalBookings: true,
      },
    });

    // Format the response
    const formattedStats = tierStats.map(stat => ({
      tier: stat.tier || 'unknown',
      customerCount: stat._count.id,
      totalSpent: stat._sum.totalSpent || 0,
      totalBookings: stat._sum.totalBookings || 0,
    }));

    res.status(200).json({
      success: true,
      data: formattedStats,
    });
  } catch (error: unknown) {
    console.error('Error fetching tier stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tier statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/crm/customers/{id}/tier-analysis:
 *   get:
 *     summary: Get detailed tier analysis for a customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.get('/:id/tier-analysis', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const tierScore = await tierService.calculateTierForCustomer(id);

    res.status(200).json({
      success: true,
      data: tierScore,
    });
  } catch (error: unknown) {
    console.error('Error calculating tier analysis:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${req.params.id} not found`,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to calculate tier analysis',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/crm/customers/{id}/update-tier:
 *   post:
 *     summary: Manually update customer tier
 *     tags: [Customers]
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
 *             properties:
 *               tier:
 *                 type: string
 *               sendNotification:
 *                 type: boolean
 *                 default: false
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
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
 *         description: Bad request
 *       404:
 *         description: Not found
 *       500:
 *         description: Server error
 */
router.post('/:id/update-tier', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tier, sendNotification = false, reason } = req.body;

    // Validate tier if provided
    if (tier) {
      const tierDef = tierService.getTierDefinition(tier);
      if (!tierDef) {
        return res.status(400).json({
          success: false,
          message: `Invalid tier: ${tier}. Valid tiers are: ${tierService
            .getAllTierDefinitions()
            .map(t => t.name)
            .join(', ')}`,
        });
      }
    }

    // Get current tier for comparison
    const customer = await prisma.crm_contact.findUnique({
      where: { id },
      select: { tier: true, email: true },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: `Customer with ID ${id} not found`,
      });
    }

    // Calculate or use provided tier
    const targetTier = tier || (await tierService.calculateTierForCustomer(id)).calculatedTier;
    const oldTier = customer.tier;

    // Update tier
    const updated = await tierService.updateCustomerTier(id, targetTier);

    if (!updated) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update tier',
      });
    }

    // Send notification if requested
    let notificationSent = false;
    if (sendNotification && oldTier !== targetTier) {
      const changeType = !oldTier
        ? 'initial_assignment'
        : tierService.getTierDefinition(targetTier)!.level >
            tierService.getTierDefinition(oldTier)!.level
          ? 'upgrade'
          : 'downgrade';

      notificationSent = await tierNotificationService.sendTierChangeNotification(
        id,
        oldTier,
        targetTier,
        changeType,
        reason
      );
    }

    res.status(200).json({
      success: true,
      data: {
        customerId: id,
        oldTier,
        newTier: targetTier,
        updated: true,
        notificationSent,
      },
      message: `Tier updated from ${oldTier || 'none'} to ${targetTier}`,
    });
  } catch (error: unknown) {
    console.error('Error updating tier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update tier',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/crm/customers/tier/definitions:
 *   get:
 *     summary: Get all tier definitions
 *     tags: [Customers]
 *     responses:
 *       200:
 *         description: Success
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
 *         description: Server error
 */
router.get('/tier/definitions', async (req: Request, res: Response) => {
  try {
    const definitions = tierService.getAllTierDefinitions();

    res.status(200).json({
      success: true,
      data: definitions,
    });
  } catch (error: unknown) {
    console.error('Error fetching tier definitions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tier definitions',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/crm/customers/tier/batch-update:
 *   post:
 *     summary: Batch update tiers for multiple customers
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerIds
 *             properties:
 *               customerIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               sendNotifications:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Success
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
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/tier/batch-update', async (req: Request, res: Response) => {
  try {
    const { customerIds, sendNotifications = false } = req.body;

    if (!customerIds || !Array.isArray(customerIds)) {
      return res.status(400).json({
        success: false,
        message: 'customerIds array is required',
      });
    }

    const job = new TierUpdateJob();
    const result = await job.runUpdateForCustomers(customerIds);

    // Send notifications if requested
    let notificationsSent = { success: 0, failed: 0 };
    if (sendNotifications && result.details) {
      const notificationsToSend = result.details
        .filter(
          (d: { success: boolean; oldTier: string | null; newTier: string }) =>
            d.success && d.oldTier !== d.newTier
        )
        .map((d: { customerId: string; oldTier: string | null; newTier: string }) => ({
          customerId: d.customerId,
          oldTier: d.oldTier,
          newTier: d.newTier,
          changeType: !d.oldTier
            ? ('initial_assignment' as const)
            : tierService.getTierDefinition(d.newTier)!.level >
                tierService.getTierDefinition(d.oldTier)!.level
              ? ('upgrade' as const)
              : ('downgrade' as const),
        }));

      if (notificationsToSend.length > 0) {
        notificationsSent =
          await tierNotificationService.batchSendNotifications(notificationsToSend);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        jobId: result.jobId,
        tierUpdate: result,
        notifications: notificationsSent,
      },
      message: `Batch tier update completed: ${result.successfulUpdates} succeeded, ${result.failedUpdates} failed`,
    });
  } catch (error: unknown) {
    console.error('Error in batch tier update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to execute batch tier update',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @swagger
 * /api/crm/customers/tier/upgrade-opportunities:
 *   get:
 *     summary: Get customers eligible for tier upgrades
 *     tags: [Customers]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: '20'
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: string
 *           default: '70'
 *     responses:
 *       200:
 *         description: Success
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
 *                 count:
 *                   type: integer
 *                 totalChecked:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/tier/upgrade-opportunities', async (req: Request, res: Response) => {
  try {
    const { limit = '20', minScore = '70' } = req.query;
    const limitNum = parseInt(limit as string, 10);
    const minScoreNum = parseInt(minScore as string, 10);

    // Get all active customers
    const customers = await prisma.crm_contact.findMany({
      where: {
        status: { in: ['customer', 'prospect'] },
        lastInteractionAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Active in last 90 days
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        tier: true,
        totalSpent: true,
        bookingsCount: true,
        lastInteractionAt: true,
      },
      take: 100, // Limit initial query
    });

    // Calculate tier scores and filter for upgrade opportunities
    const opportunities = [];
    for (const customer of customers.slice(0, 50)) {
      // Limit to first 50 for performance
      try {
        const tierScore = await tierService.calculateTierForCustomer(customer.id);

        if (tierScore.upgradeEligible && tierScore.score >= minScoreNum) {
          opportunities.push({
            customerId: customer.id,
            email: customer.email,
            name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim(),
            currentTier: customer.tier,
            recommendedTier: tierScore.calculatedTier,
            score: tierScore.score,
            metrics: tierScore.metrics,
            lastInteraction: customer.lastInteractionAt,
          });
        }
      } catch (error: unknown) {
        console.error(`Error calculating tier for customer ${customer.id}:`, error);
      }
    }

    // Sort by score descending and limit
    opportunities.sort((a, b) => b.score - a.score);
    const limitedOpportunities = opportunities.slice(0, limitNum);

    res.status(200).json({
      success: true,
      data: limitedOpportunities,
      count: limitedOpportunities.length,
      totalChecked: customers.length,
    });
  } catch (error: unknown) {
    console.error('Error finding upgrade opportunities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find upgrade opportunities',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
