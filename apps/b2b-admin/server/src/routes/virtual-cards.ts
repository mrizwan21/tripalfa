import express from 'express';
import { VirtualCardService } from '../services/virtualCardService.js';
import { Database } from '../utils/database.js';
import { SecurityMiddleware } from '../middleware/security.js';
import { logger } from '../utils/logger.js';
import { 
  CreateVirtualCardRequest, 
  UpdateVirtualCardRequest,
  VirtualCardQueryParams
} from '../types/kyc.js';
import {
  requireVirtualCardView,
  requireVirtualCardCreate,
  requireVirtualCardUpdate,
  requireVirtualCardDelete,
  requireVirtualCardActivate,
  requireVirtualCardDeactivate,
  requireVirtualCardBlock,
  requireVirtualCardUnblock,
  requireVirtualCardTransactionView,
  requireVirtualCardTransactionCreate,
  requireVirtualCardTransactionManage,
  requireVirtualCardTransactionAuthorize,
  requireVirtualCardSettingsView,
  requireVirtualCardSettingsManage,
  debugPermissions
} from '../middleware/permissionMiddleware.js';

const router = express.Router();

/**
 * Virtual Card Routes
 */

// GET /api/virtual-cards - Get all virtual cards with pagination and filtering
router.get('/', 
  requireVirtualCardView,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new VirtualCardService(client);
      
        const params: VirtualCardQueryParams = {
          companyId: req.user?.companyId,
          status: req.query.status as any,
          cardType: req.query.cardType as any,
          usageType: req.query.usageType as any,
          currency: req.query.currency as any,
          search: req.query.search as string,
          sortBy: req.query.sortBy as any,
          sortOrder: req.query.sortOrder as any,
          limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
          offset: req.query.offset ? parseInt(req.query.offset as string) : 0
        };

        const result = await service.getVirtualCards(
          params, 
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.json(result);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error getting virtual cards', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/virtual-cards/:id - Get virtual card by ID
router.get('/:id', 
  requireVirtualCardView,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new VirtualCardService(client);
      
        const card = await service.getVirtualCardById(
          req.params.id as string, 
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.json(card);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error getting virtual card', error);
      if (error.message === 'Virtual card not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// POST /api/virtual-cards - Create new virtual card
router.post('/', 
  requireVirtualCardCreate,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new VirtualCardService(client);
      
        const cardData: CreateVirtualCardRequest = {
          companyId: req.user?.companyId || 'default-company',
          cardholderName: req.body.cardholderName,
          currency: req.body.currency,
          spendingLimit: parseFloat(req.body.spendingLimit),
          dailyLimit: parseFloat(req.body.dailyLimit),
          monthlyLimit: parseFloat(req.body.monthlyLimit),
          perTransactionLimit: parseFloat(req.body.perTransactionLimit),
          cardType: req.body.cardType,
          usageType: req.body.usageType,
          allowedCategories: req.body.allowedCategories || [],
          blockedCategories: req.body.blockedCategories || [],
          allowedCountries: req.body.allowedCountries || [],
          blockedCountries: req.body.blockedCountries || []
        };

        const card = await service.createVirtualCard(
          cardData, 
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.status(201).json(card);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error creating virtual card', error);
      if (error.message.includes('already exists') || error.message.includes('must be in the future')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// PUT /api/virtual-cards/:id - Update virtual card
router.put('/:id', 
  requireVirtualCardUpdate,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new VirtualCardService(client);
      
        const updateData: UpdateVirtualCardRequest = {
          cardholderName: req.body.cardholderName,
          spendingLimit: req.body.spendingLimit ? parseFloat(req.body.spendingLimit) : undefined,
          dailyLimit: req.body.dailyLimit ? parseFloat(req.body.dailyLimit) : undefined,
          monthlyLimit: req.body.monthlyLimit ? parseFloat(req.body.monthlyLimit) : undefined,
          perTransactionLimit: req.body.perTransactionLimit ? parseFloat(req.body.perTransactionLimit) : undefined,
          status: req.body.status,
          isActive: req.body.isActive,
          isBlocked: req.body.isBlocked,
          blockReason: req.body.blockReason,
          allowedCategories: req.body.allowedCategories,
          blockedCategories: req.body.blockedCategories,
          allowedCountries: req.body.allowedCountries,
          blockedCountries: req.body.blockedCountries
        };

        const card = await service.updateVirtualCard(
          req.params.id as string, 
          updateData, 
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.json(card);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error updating virtual card', error);
      if (error.message.includes('not found') || error.message.includes('No fields to update')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// POST /api/virtual-cards/:id/activate - Activate virtual card
router.post('/:id/activate', 
  requireVirtualCardActivate,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new VirtualCardService(client);
      
        const card = await service.activateVirtualCard(
          req.params.id as string, 
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.json(card);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error activating virtual card', error);
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// POST /api/virtual-cards/:id/deactivate - Deactivate virtual card
router.post('/:id/deactivate', 
  requireVirtualCardDeactivate,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new VirtualCardService(client);
      
        const card = await service.deactivateVirtualCard(
          req.params.id as string, 
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.json(card);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error deactivating virtual card', error);
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// POST /api/virtual-cards/:id/block - Block virtual card
router.post('/:id/block', 
  requireVirtualCardBlock,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new VirtualCardService(client);
      
        const { reason } = req.body;

        const card = await service.blockVirtualCard(
          req.params.id as string, 
          reason, 
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.json(card);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error blocking virtual card', error);
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// POST /api/virtual-cards/:id/unblock - Unblock virtual card
router.post('/:id/unblock', 
  requireVirtualCardUnblock,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new VirtualCardService(client);
      
        const card = await service.unblockVirtualCard(
          req.params.id as string, 
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.json(card);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error unblocking virtual card', error);
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

/**
 * Virtual Card Transaction Routes
 */

// POST /api/virtual-cards/:id/transactions - Create transaction
router.post('/:id/transactions', 
  requireVirtualCardTransactionCreate,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new VirtualCardService(client);
      
        const transactionData = {
          transactionType: req.body.transactionType,
          amount: parseFloat(req.body.amount),
          currency: req.body.currency,
          merchantName: req.body.merchantName,
          merchantCategory: req.body.merchantCategory,
          merchantCountry: req.body.merchantCountry,
          authorizationCode: req.body.authorizationCode,
          status: req.body.status,
          reason: req.body.reason
        };

        const transaction = await service.createTransaction(
          req.params.id as string,
          req.user?.companyId || 'default-company',
          transactionData,
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.status(201).json(transaction);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error creating virtual card transaction', error);
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// GET /api/virtual-cards/:id/transactions - Get transactions
router.get('/:id/transactions', 
  requireVirtualCardTransactionView,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new VirtualCardService(client);
      
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
        const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

        const transactions = await service.getTransactions(
          req.params.id as string,
          req.user?.companyId || 'default-company',
          limit,
          offset,
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.json(transactions);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error getting virtual card transactions', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * Virtual Card Settings Routes
 */

// GET /api/virtual-cards/settings - Get virtual card settings
router.get('/settings', 
  requireVirtualCardSettingsView,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new VirtualCardService(client);
      
        const settings = await service.getSettings(
          req.user?.companyId || 'default-company',
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.json(settings);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error getting virtual card settings', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// PUT /api/virtual-cards/settings - Update virtual card settings
router.put('/settings', 
  requireVirtualCardSettingsManage,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new VirtualCardService(client);
      
        const settingsData = {
          defaultSettings: req.body.defaultSettings || {},
          securitySettings: req.body.securitySettings || {},
          notificationSettings: req.body.notificationSettings || {},
          complianceSettings: req.body.complianceSettings || {}
        };

        const settings = await service.updateSettings(
          req.user?.companyId || 'default-company',
          settingsData,
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.json(settings);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error updating virtual card settings', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/virtual-cards/stats - Get virtual card statistics
router.get('/stats', 
  requireVirtualCardTransactionView,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new VirtualCardService(client);
      
        const stats = await service.getStats(
          req.user?.companyId || 'default-company',
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.json(stats);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error getting virtual card stats', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;