import { Router, Request, Response } from 'express';
import { OrganizationService } from '../services/organizationService.js';
import { DatabaseConnection } from '../utils/database.js';
import { SecurityMiddleware } from '../middleware/security.js';
import { createLogger } from '@tripalfa/shared-utils';

const logger = createLogger({ serviceName: 'organization-service' });
const router: Router = Router();

/**
 * @swagger
 * /api/organization/campaigns:
 *   get:
 *     summary: List marketing campaigns
 *     tags: [Campaigns]
 *     parameters:
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
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
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  SecurityMiddleware.authenticate,
  SecurityMiddleware.authorize(['SUPER_ADMIN', 'ADMIN', 'B2B']),
  async (req: Request, res: Response) => {
    try {
      const db = await DatabaseConnection.getInstance().connect();
      const service = new OrganizationService(db);

      const params = {
        companyId: req.user.companyId,
        skip: req.query.offset ? Number(req.query.offset) : 0,
        take: req.query.limit ? Number(req.query.limit) : 10,
      };

      const result = await service.getCampaigns(params, req.user.id, req.user.role);

      res.json(result.data);
    } catch (error) {
      logger.error(error as Error, 'Error fetching campaigns');
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  }
);

/**
 * @swagger
 * /api/organization/campaigns:
 *   post:
 *     summary: Create new campaign
 *     tags: [Campaigns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               budget:
 *                 type: number
 *               status:
 *                 type: string
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
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  SecurityMiddleware.authenticate,
  SecurityMiddleware.authorize(['SUPER_ADMIN', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const db = await DatabaseConnection.getInstance().connect();
      const service = new OrganizationService(db);

      const campaignData = {
        ...req.body,
        companyId: req.user.companyId,
      };

      const campaign = await service.createCampaign(campaignData, req.user.id, req.user.role);

      res.status(201).json(campaign);
    } catch (error) {
      logger.error(error as Error, 'Error creating campaign');
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }
);

/**
 * @swagger
 * /api/organization/campaigns/{id}:
 *   put:
 *     summary: Update campaign
 *     tags: [Campaigns]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               budget:
 *                 type: number
 *               status:
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
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  SecurityMiddleware.authenticate,
  SecurityMiddleware.authorize(['SUPER_ADMIN', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const db = await DatabaseConnection.getInstance().connect();
      const service = new OrganizationService(db);

      const campaign = await service.updateCampaign(
        Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
        req.body,
        req.user.id,
        req.user.role
      );

      res.json(campaign);
    } catch (error) {
      logger.error(error as Error, 'Error updating campaign');
      res.status(500).json({ error: 'Failed to update campaign' });
    }
  }
);

export default router;
