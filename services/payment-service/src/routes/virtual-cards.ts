import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authMiddleware, getAuthenticatedUser, parsePositiveAmount } from '../middleware/auth.js';

const router: ExpressRouter = Router();

// TODO: Replace mock data with real database integration
// This is temporary mock data for development/testing purposes.
// Issue: [INSERT_TICKET_NUMBER] - Implement real virtual card database schema
// Mock virtual cards data
const mockVirtualCards: any[] = [
  {
    id: 'vc_001',
    userId: 'user123',
    cardholderName: 'John Doe',
    currency: 'USD',
    spendingLimit: 5000,
    dailyLimit: 1000,
    monthlyLimit: 3000,
    perTransactionLimit: 500,
    cardType: 'debit',
    usageType: 'business',
    status: 'active',
    isActive: true,
    isBlocked: false,
    createdAt: '2026-01-15T10:00:00Z',
    lastUsed: '2026-01-20T14:30:00Z',
  },
];

// TODO: Replace mock data with real database integration
// Mock transactions data
const mockTransactions: any[] = [
  {
    id: 'txn_vc_001',
    virtualCardId: 'vc_001',
    amount: 150.5,
    currency: 'USD',
    merchantName: 'Hotel Booking Co',
    merchantCategory: 'travel',
    transactionType: 'purchase',
    status: 'completed',
    authorizationCode: 'AUTH123456',
    createdAt: '2026-01-20T14:30:00Z',
  },
];

/**
 * @swagger
 * /api/virtual-cards:
 *   get:
 *     summary: Get all virtual cards
 *     tags: [Virtual Cards]
 *     responses:
 *       200:
 *         description: List of virtual cards
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
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Failed to fetch virtual cards
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
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, isAdmin } = getAuthenticatedUser(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const cards = isAdmin ? mockVirtualCards : mockVirtualCards.filter(c => c.userId === userId);

    res.json({ data: cards });
  } catch (error) {
    console.error('Error getting virtual cards:', error);
    res.status(500).json({ error: 'Failed to fetch virtual cards' });
  }
});

/**
 * @swagger
 * /api/virtual-cards/settings:
 *   get:
 *     summary: Get virtual card settings
 *     tags: [Virtual Cards]
 *     responses:
 *       200:
 *         description: Virtual card settings retrieved successfully
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
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
router.get('/settings', authMiddleware, async (req: Request, res: Response) => {
  try {
    const settings = {
      defaultSettings: {
        currency: 'USD',
        spendingLimit: 1000,
        dailyLimit: 500,
        monthlyLimit: 2000,
      },
      securitySettings: {
        requirePin: true,
        allowOnlinePurchases: true,
        allowInternational: false,
      },
      notificationSettings: {
        emailAlerts: true,
        smsAlerts: false,
        transactionAlerts: true,
      },
    };
    res.json({ data: settings });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

/**
 * @swagger
 * /api/virtual-cards/settings:
 *   put:
 *     summary: Update virtual card settings
 *     tags: [Virtual Cards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               defaultSettings:
 *                 type: object
 *               securitySettings:
 *                 type: object
 *               notificationSettings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Settings updated successfully
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
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
router.put('/settings', authMiddleware, async (req: Request, res: Response) => {
  try {
    // In a real implementation, this would save to database
    res.json({ data: req.body, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * @swagger
 * /api/virtual-cards/stats:
 *   get:
 *     summary: Get virtual card statistics
 *     tags: [Virtual Cards]
 *     responses:
 *       200:
 *         description: Virtual card statistics retrieved successfully
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
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
router.get('/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const stats = {
      totalCards: mockVirtualCards.length,
      activeCards: mockVirtualCards.filter(c => c.isActive).length,
      blockedCards: mockVirtualCards.filter(c => c.isBlocked).length,
      totalTransactions: mockTransactions.length,
      totalSpent: mockTransactions.reduce((sum, t) => sum + t.amount, 0),
      period: '2026-01',
    };
    res.json({ data: stats });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * @swagger
 * /api/virtual-cards/{id}:
 *   get:
 *     summary: Get virtual card by ID
 *     tags: [Virtual Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Virtual card ID
 *     responses:
 *       200:
 *         description: Virtual card retrieved successfully
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       404:
 *         description: Virtual card not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
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
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, isAdmin } = getAuthenticatedUser(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const card = mockVirtualCards.find(c => c.id === req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Virtual card not found' });
    }
    if (!isAdmin && card.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ data: card });
  } catch (error) {
    console.error('Error getting virtual card:', error);
    res.status(500).json({ error: 'Failed to fetch virtual card' });
  }
});

/**
 * @swagger
 * /api/virtual-cards:
 *   post:
 *     summary: Create virtual card
 *     tags: [Virtual Cards]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cardholderName:
 *                 type: string
 *               currency:
 *                 type: string
 *               spendingLimit:
 *                 type: number
 *               cardType:
 *                 type: string
 *               usageType:
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
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId } = getAuthenticatedUser(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { cardholderName, currency, spendingLimit, cardType, usageType } = req.body;

    const parsedSpendingLimit = parsePositiveAmount(spendingLimit ?? 1000);
    if (!cardholderName || typeof cardholderName !== 'string') {
      return res.status(400).json({ error: 'cardholderName is required' });
    }
    if (parsedSpendingLimit === null) {
      return res.status(400).json({ error: 'spendingLimit must be positive' });
    }

    const newCard = {
      id: `vc_${String(mockVirtualCards.length + 1).padStart(3, '0')}`,
      userId,
      cardholderName,
      currency: currency || 'USD',
      spendingLimit: parsedSpendingLimit,
      dailyLimit: 500,
      monthlyLimit: 2000,
      perTransactionLimit: 200,
      cardType: cardType || 'debit',
      usageType: usageType || 'business',
      status: 'active',
      isActive: true,
      isBlocked: false,
      createdAt: new Date().toISOString(),
      lastUsed: null,
    };

    mockVirtualCards.push(newCard);
    res.status(201).json({ data: newCard });
  } catch (error) {
    console.error('Error creating virtual card:', error);
    res.status(500).json({ error: 'Failed to create virtual card' });
  }
});

/**
 * @swagger
 * /api/virtual-cards/{id}:
 *   put:
 *     summary: Update virtual card
 *     tags: [Virtual Cards]
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
 *       500:
 *         description: Server error
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, isAdmin } = getAuthenticatedUser(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const card = mockVirtualCards.find(c => c.id === req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Virtual card not found' });
    }
    if (!isAdmin && card.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const allowedFields = [
      'cardholderName',
      'currency',
      'dailyLimit',
      'monthlyLimit',
      'perTransactionLimit',
      'spendingLimit',
      'cardType',
      'usageType',
    ] as const;

    for (const key of allowedFields) {
      if (req.body[key] === undefined) continue;
      if (
        key === 'dailyLimit' ||
        key === 'monthlyLimit' ||
        key === 'perTransactionLimit' ||
        key === 'spendingLimit'
      ) {
        const parsed = parsePositiveAmount(req.body[key]);
        if (parsed === null) {
          return res.status(400).json({ error: `${key} must be positive` });
        }
        card[key] = parsed;
      } else {
        card[key] = req.body[key];
      }
    }

    res.json({ data: card });
  } catch (error) {
    console.error('Error updating virtual card:', error);
    res.status(500).json({ error: 'Failed to update virtual card' });
  }
});

/**
 * @swagger
 * /api/virtual-cards/{id}/activate:
 *   post:
 *     summary: Activate virtual card
 *     tags: [Virtual Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Virtual card ID
 *     responses:
 *       200:
 *         description: Virtual card activated successfully
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       403:
 *         description: Access denied
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       404:
 *         description: Virtual card not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
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
router.post('/:id/activate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, isAdmin } = getAuthenticatedUser(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const card = mockVirtualCards.find(c => c.id === req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Virtual card not found' });
    }
    if (!isAdmin && card.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    card.isActive = true;
    card.status = 'active';
    res.json({ data: card });
  } catch (error) {
    console.error('Error activating virtual card:', error);
    res.status(500).json({ error: 'Failed to activate virtual card' });
  }
});

/**
 * @swagger
 * /api/virtual-cards/{id}/deactivate:
 *   post:
 *     summary: Deactivate virtual card
 *     tags: [Virtual Cards]
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
 *       500:
 *         description: Server error
 */
router.post('/:id/deactivate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, isAdmin } = getAuthenticatedUser(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const card = mockVirtualCards.find(c => c.id === req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Virtual card not found' });
    }
    if (!isAdmin && card.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    card.isActive = false;
    card.status = 'inactive';
    res.json({ data: card });
  } catch (error) {
    console.error('Error deactivating virtual card:', error);
    res.status(500).json({ error: 'Failed to deactivate virtual card' });
  }
});

/**
 * @swagger
 * /api/virtual-cards/{id}/block:
 *   post:
 *     summary: Block virtual card
 *     tags: [Virtual Cards]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
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
 *       500:
 *         description: Server error
 */
router.post('/:id/block', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, isAdmin } = getAuthenticatedUser(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const card = mockVirtualCards.find(c => c.id === req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Virtual card not found' });
    }
    if (!isAdmin && card.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    card.isBlocked = true;
    card.status = 'blocked';
    card.blockReason = req.body.reason;
    res.json({ data: card });
  } catch (error) {
    console.error('Error blocking virtual card:', error);
    res.status(500).json({ error: 'Failed to block virtual card' });
  }
});

/**
 * @swagger
 * /api/virtual-cards/{id}/unblock:
 *   post:
 *     summary: Unblock virtual card
 *     tags: [Virtual Cards]
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
 *       500:
 *         description: Server error
 */
router.post('/:id/unblock', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, isAdmin } = getAuthenticatedUser(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const card = mockVirtualCards.find(c => c.id === req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Virtual card not found' });
    }
    if (!isAdmin && card.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    card.isBlocked = false;
    card.status = 'active';
    card.blockReason = null;
    res.json({ data: card });
  } catch (error) {
    console.error('Error unblocking virtual card:', error);
    res.status(500).json({ error: 'Failed to unblock virtual card' });
  }
});

/**
 * @swagger
 * /api/virtual-cards/{id}/transactions:
 *   get:
 *     summary: Get card transactions
 *     tags: [Virtual Cards]
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
 *                   type: array
 *       500:
 *         description: Server error
 */
router.get('/:id/transactions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, isAdmin } = getAuthenticatedUser(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const card = mockVirtualCards.find(c => c.id === req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Virtual card not found' });
    }
    if (!isAdmin && card.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const cardTransactions = mockTransactions.filter(t => t.virtualCardId === req.params.id);
    res.json({ data: cardTransactions });
  } catch (error) {
    console.error('Error getting card transactions:', error);
    res.status(500).json({ error: 'Failed to fetch card transactions' });
  }
});

/**
 * @swagger
 * /api/virtual-cards/{id}/transactions:
 *   post:
 *     summary: Create transaction
 *     tags: [Virtual Cards]
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
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               merchantName:
 *                 type: string
 *               merchantCategory:
 *                 type: string
 *               transactionType:
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
router.post('/:id/transactions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, isAdmin } = getAuthenticatedUser(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const card = mockVirtualCards.find(c => c.id === req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Virtual card not found' });
    }
    if (!isAdmin && card.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!card.isActive || card.isBlocked) {
      return res.status(400).json({ error: 'Card is not available for transactions' });
    }

    const { amount, currency, merchantName, merchantCategory, transactionType } = req.body;

    const parsedAmount = parsePositiveAmount(amount);
    if (parsedAmount === null) {
      return res.status(400).json({ error: 'amount must be positive' });
    }

    const newTransaction = {
      id: `txn_vc_${Date.now()}`,
      virtualCardId: req.params.id,
      amount: parsedAmount,
      currency: currency || 'USD',
      merchantName: merchantName || 'Unknown Merchant',
      merchantCategory: merchantCategory || 'general',
      transactionType: transactionType || 'purchase',
      status: 'completed',
      authorizationCode: `AUTH${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    mockTransactions.push(newTransaction);
    card.lastUsed = new Date().toISOString();
    res.status(201).json({ data: newTransaction });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

export default router;
