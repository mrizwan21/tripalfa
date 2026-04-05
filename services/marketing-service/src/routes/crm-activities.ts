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
 * /api/marketing/crm/activities:
 *   get:
 *     summary: List all activities with optional filtering
 *     tags: [CRM Activities]
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
 *       - in: query
 *         name: contactId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of activities
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

    const { page = '1', limit = '20', status, type, contactId } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const where: any = {};
    if (status) where.status = status as string;
    if (type) where.activityType = type as string;
    if (contactId) where.contactId = contactId as string;

    const [activities, total] = await Promise.all([
      getFinanceDb().crm_activity.findMany({
        where,
        skip,
        take: limitNum,
        include: { contact: { select: { email: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      getFinanceDb().crm_activity.count({ where }),
    ]);

    res.json({
      data: activities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/crm/activities/{id}:
 *   get:
 *     summary: Get a specific CRM activity
 *     tags: [CRM Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activity details
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
 *         description: Activity not found
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

    const activity = await getFinanceDb().crm_activity.findUnique({
      where: { id: id as string },
      include: { contact: true },
    });

    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json(activity);
  } catch (error: unknown) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/crm/activities:
 *   post:
 *     summary: Create a new CRM activity
 *     tags: [CRM Activities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [contactId, activityType, title]
 *             properties:
 *               contactId:
 *                 type: string
 *               activityType:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Activity created successfully
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
 *         description: Contact not found
 *       500:
 *         description: Server error
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { contactId, activityType, title, description, dueDate, metadata } = req.body;

    // Validate required fields
    if (!contactId) {
      return res.status(400).json({ error: 'contactId is required' });
    }
    if (!activityType) {
      return res.status(400).json({ error: 'activityType is required' });
    }
    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    // Check if contact exists
    const contact = await getFinanceDb().crm_contact.findUnique({ where: { id: contactId } });
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const activity = await getFinanceDb().crm_activity.create({
      data: {
        contactId,
        activityType,
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'pending',
        metadata: metadata || null,
      },
    });

    res.status(201).json(activity);
  } catch (error: unknown) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/crm/activities/{id}:
 *   patch:
 *     summary: Update a CRM activity
 *     tags: [CRM Activities]
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
 *         description: Activity updated successfully
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
 *         description: Activity not found
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

    // Check if activity exists
    const existing = await getFinanceDb().crm_activity.findUnique({ where: { id: id as string } });
    if (!existing) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    // If marking as completed, set completedAt
    if (updates.status === 'completed' && !updates.completedAt) {
      updates.completedAt = new Date();
    }

    const activity = await getFinanceDb().crm_activity.update({
      where: { id: id as string },
      data: updates,
    });

    res.json(activity);
  } catch (error: unknown) {
    console.error('Error updating activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/crm/activities/{id}:
 *   delete:
 *     summary: Delete a CRM activity
 *     tags: [CRM Activities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Activity deleted successfully
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
 *         description: Activity not found
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

    // Check if activity exists
    const existing = await getFinanceDb().crm_activity.findUnique({ where: { id: id as string } });
    if (!existing) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    await getFinanceDb().crm_activity.delete({ where: { id: id as string } });

    res.json({ message: 'Activity deleted successfully' });
  } catch (error: unknown) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
