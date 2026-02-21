import { Router, Request, Response } from 'express';
import { OrganizationService } from '../services/organizationService.js';
import { DatabaseConnection } from '../utils/database.js';
import { SecurityMiddleware } from '../middleware/security.js';
import { createLogger } from '@tripalfa/shared-utils';

const logger = createLogger({ serviceName: 'organization-service' });
const router: Router = Router();

// GET /api/marketing/campaigns - List marketing campaigns
router.get('/',
  SecurityMiddleware.authenticate,
  SecurityMiddleware.authorize(['SUPER_ADMIN', 'ADMIN', 'B2B']),
  async (req: Request, res: Response) => {
    try {
      const db = await DatabaseConnection.getInstance().connect();
      const service = new OrganizationService(db);

      const params = {
        companyId: req.user.companyId,
        skip: req.query.offset ? Number(req.query.offset) : 0,
        take: req.query.limit ? Number(req.query.limit) : 10
      };

      const result = await service.getCampaigns(
        params,
        req.user.id,
        req.user.role
      );

      // MarketingService client expects data directly (result.data)
      res.json(result.data);
    } catch (error) {
      logger.error(error as Error, 'Error fetching campaigns');
      res.status(500).json({ error: 'Failed to fetch campaigns' });
    }
  }
);

// POST /api/marketing/campaigns - Create new campaign
router.post('/',
  SecurityMiddleware.authenticate,
  SecurityMiddleware.authorize(['SUPER_ADMIN', 'ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const db = await DatabaseConnection.getInstance().connect();
      const service = new OrganizationService(db);

      const campaignData = {
        ...req.body,
        companyId: req.user.companyId
      };

      const campaign = await service.createCampaign(
        campaignData,
        req.user.id,
        req.user.role
      );

      res.status(201).json(campaign);
    } catch (error) {
      logger.error(error as Error, 'Error creating campaign');
      res.status(500).json({ error: 'Failed to create campaign' });
    }
  }
);

// PUT /api/marketing/campaigns/:id - Update campaign
router.put('/:id',
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