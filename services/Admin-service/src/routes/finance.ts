import { Router, Response } from 'express';
import { prisma } from '../database.js';
import { AuthRequest, authMiddleware, requirePermission } from '../middleware/auth.js';
import { validateZod, paginationSchema, walletTransactionSchema } from '../middleware/validate.js';

const router: Router = Router();

// All finance routes require authentication
router.use(authMiddleware);

// Helper to serialize Decimal values
const serializeWallet = (wallet: any) => ({
  ...wallet,
  balance: wallet.balance?.toNumber?.() ?? wallet.balance,
  reservedBalance: wallet.reservedBalance?.toNumber?.() ?? wallet.reservedBalance,
});

const serializeTransaction = (tx: any) => ({
  ...tx,
  amount: tx.amount?.toNumber?.() ?? tx.amount,
});

// ============================================
// Wallet Routes
// ============================================

/**
 * @swagger
 * /api/finance/wallets:
 *   get:
 *     summary: List all wallets
 *     tags: [Finance]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of wallets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { type: object } }
 *                 pagination: { type: object }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 error: { type: string }
 */
router.get(
  '/wallets',
  requirePermission('finance:read'),
  validateZod(paginationSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, sortBy, sortOrder, search } = req.query as any;

      const where = search
        ? {
            OR: [
              {
                userId: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {};

      const [wallets, total] = await Promise.all([
        prisma.wallet.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        }),
        prisma.wallet.count({ where }),
      ]);

      res.json({
        success: true,
        data: wallets.map(serializeWallet),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching wallets:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch wallets',
      });
    }
  }
);

/**
 * @swagger
 * /api/finance/wallets/{userId}:
 *   get:
 *     summary: Get wallet by user ID
 *     tags: [Finance]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           default: USD
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
 *         description: Wallet not found
 *       500:
 *         description: Server error
 */
router.get(
  '/wallets/:userId',
  requirePermission('finance:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { currency = 'USD' } = req.query;

      const wallet = await prisma.wallet.findUnique({
        where: {
          userId_currency: {
            userId,
            currency: currency as string,
          },
        },
      });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          error: 'Wallet not found',
        });
      }

      res.json({
        success: true,
        data: serializeWallet(wallet),
      });
    } catch (error) {
      console.error('Error fetching wallet:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch wallet',
      });
    }
  }
);

/**
 * @swagger
 * /api/finance/wallets/{userId}/transactions:
 *   get:
 *     summary: Get wallet transactions
 *     tags: [Finance]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: currency
 *         schema: { type: string, default: USD }
 *     responses:
 *       200:
 *         description: Wallet transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array, items: { type: object } }
 *                 pagination: { type: object }
 *       404:
 *         description: Wallet not found
 *       500:
 *         description: Server error
 */
router.get(
  '/wallets/:userId/transactions',
  requirePermission('finance:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20, type, currency = 'USD' } = req.query;

      // First get the wallet
      const wallet = await prisma.wallet.findUnique({
        where: {
          userId_currency: {
            userId,
            currency: currency as string,
          },
        },
      });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          error: 'Wallet not found',
        });
      }

      const where: any = { walletId: wallet.id };
      if (type) {
        where.type = type;
      }

      const [transactions, total] = await Promise.all([
        prisma.walletTransaction.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.walletTransaction.count({ where }),
      ]);

      res.json({
        success: true,
        data: transactions.map(serializeTransaction),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch transactions',
      });
    }
  }
);

/**
 * @swagger
 * /api/finance/wallets/{userId}/credit:
 *   post:
 *     summary: Credit wallet
 *     tags: [Finance]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount: { type: number }
 *               currency: { type: string, default: USD }
 *               description: { type: string }
 *               referenceId: { type: string }
 *     responses:
 *       200:
 *         description: Wallet credited successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *                 message: { type: string }
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post(
  '/wallets/:userId/credit',
  requirePermission('finance:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { amount, currency = 'USD', description, referenceId } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid amount is required',
        });
      }

      // Find or create wallet
      let wallet = await prisma.wallet.findUnique({
        where: {
          userId_currency: {
            userId,
            currency,
          },
        },
      });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            userId,
            currency,
            balance: '0',
            reservedBalance: '0',
          },
        });
      }

      // Create transaction and update balance
      const transaction = await prisma.$transaction(async tx => {
        // Get current wallet balance
        const currentWallet = await tx.wallet.findUnique({
          where: { id: wallet!.id },
          select: { balance: true },
        });

        // Calculate new balance
        const currentBalance = currentWallet?.balance?.toNumber?.() ?? Number(currentWallet?.balance ?? 0);
        const newBalance = String(currentBalance + amount);

        // Create transaction
        const newTx = await tx.walletTransaction.create({
          data: {
            walletId: wallet!.id,
            type: 'deposit',
            flow: 'credit',
            amount: String(amount),
            balance: newBalance,
            currency,
            description: description || 'Admin credit',
            metadata: { referenceId, processedBy: req.user?.id },
          },
        });

        // Update wallet balance
        await tx.wallet.update({
          where: { id: wallet!.id },
          data: {
            balance: { increment: String(amount) },
          },
        });

        return newTx;
      });

      res.json({
        success: true,
        data: serializeTransaction(transaction),
        message: 'Wallet credited successfully',
      });
    } catch (error) {
      console.error('Error crediting wallet:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to credit wallet',
      });
    }
  }
);

/**
 * @swagger
 * /api/finance/wallets/{userId}/debit:
 *   post:
 *     summary: Debit wallet
 *     tags: [Finance]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *               description:
 *                 type: string
 *               referenceId:
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
 *         description: Wallet not found
 *       500:
 *         description: Server error
 */
router.post(
  '/wallets/:userId/debit',
  requirePermission('finance:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { userId } = req.params;
      const { amount, currency = 'USD', description, referenceId } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Valid amount is required',
        });
      }

      const wallet = await prisma.wallet.findUnique({
        where: {
          userId_currency: {
            userId,
            currency,
          },
        },
      });

      if (!wallet) {
        return res.status(404).json({
          success: false,
          error: 'Wallet not found',
        });
      }

      // Check sufficient balance
      if (wallet.balance.toNumber() < amount) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient balance',
        });
      }

      // Create transaction and update balance
      const transaction = await prisma.$transaction(async tx => {
        // Get current wallet balance
        const currentWallet = await tx.wallet.findUnique({
          where: { id: wallet.id },
          select: { balance: true },
        });

        // Calculate new balance
        const currentBalance = currentWallet?.balance?.toNumber?.() ?? Number(currentWallet?.balance ?? 0);
        const newBalance = String(currentBalance - amount);

        // Create transaction
        const newTx = await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'withdrawal',
            flow: 'debit',
            amount: String(amount),
            balance: newBalance,
            currency,
            description: description || 'Admin debit',
            metadata: { referenceId, processedBy: req.user?.id },
          },
        });

        // Update wallet balance
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: String(amount) },
          },
        });

        return newTx;
      });

      res.json({
        success: true,
        data: serializeTransaction(transaction),
        message: 'Wallet debited successfully',
      });
    } catch (error) {
      console.error('Error debiting wallet:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to debit wallet',
      });
    }
  }
);

// ============================================
// Settlement Routes
// ============================================

/**
 * @swagger
 * /api/finance/settlements:
 *   get:
 *     summary: List settlements
 *     tags: [Finance]
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
router.get(
  '/settlements',
  requirePermission('finance:read'),
  validateZod(paginationSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, sortBy, sortOrder, search } = req.query as any;
      const { status } = req.query;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const [settlements, total] = await Promise.all([
        prisma.settlement.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        }),
        prisma.settlement.count({ where }),
      ]);

      res.json({
        success: true,
        data: settlements.map(s => ({
          ...s,
          amount: s.amount?.toNumber?.() ?? s.amount,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching settlements:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch settlements',
      });
    }
  }
);

/**
 * @swagger
 * /api/finance/settlements/{id}:
 *   put:
 *     summary: Update settlement
 *     tags: [Finance]
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
 *             properties:
 *               status:
 *                 type: string
 *               referenceNumber:
 *                 type: string
 *               bankReference:
 *                 type: string
 *               notes:
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
 *       404:
 *         description: Settlement not found
 *       500:
 *         description: Server error
 */
router.put(
  '/settlements/:id',
  requirePermission('finance:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, referenceNumber, bankReference, notes } = req.body;

      const settlement = await prisma.settlement.findUnique({
        where: { id },
      });

      if (!settlement) {
        return res.status(404).json({
          success: false,
          error: 'Settlement not found',
        });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (referenceNumber) updateData.referenceNumber = referenceNumber;
      if (bankReference) updateData.bankReference = bankReference;
      if (status === 'completed') updateData.processedAt = new Date();

      const updatedSettlement = await prisma.settlement.update({
        where: { id },
        data: updateData,
      });

      res.json({
        success: true,
        data: {
          ...updatedSettlement,
          amount: updatedSettlement.amount?.toNumber?.() ?? updatedSettlement.amount,
        },
        message: 'Settlement updated successfully',
      });
    } catch (error) {
      console.error('Error updating settlement:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update settlement',
      });
    }
  }
);

// ============================================
// Dispute Routes
// ============================================

/**
 * @swagger
 * /api/finance/disputes:
 *   get:
 *     summary: List disputes
 *     tags: [Finance]
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
router.get(
  '/disputes',
  requirePermission('finance:read'),
  validateZod(paginationSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, sortBy, sortOrder } = req.query as any;
      const { status } = req.query;

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const [disputes, total] = await Promise.all([
        prisma.dispute.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
        }),
        prisma.dispute.count({ where }),
      ]);

      res.json({
        success: true,
        data: disputes.map(d => ({
          ...d,
          amount: d.amount?.toNumber?.() ?? d.amount,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching disputes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch disputes',
      });
    }
  }
);

/**
 * @swagger
 * /api/finance/disputes/{id}:
 *   put:
 *     summary: Update dispute
 *     tags: [Finance]
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
 *               status:
 *                 type: string
 *               staffNote:
 *                 type: string
 *               customerNote:
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
 *       404:
 *         description: Dispute not found
 *       500:
 *         description: Server error
 */
router.put(
  '/disputes/:id',
  requirePermission('finance:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, staffNote, customerNote } = req.body;

      const dispute = await prisma.dispute.findUnique({
        where: { id },
      });

      if (!dispute) {
        return res.status(404).json({
          success: false,
          error: 'Dispute not found',
        });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (staffNote) updateData.staffNote = staffNote;
      if (customerNote) updateData.customerNote = customerNote;
      if (['won', 'lost', 'resolved'].includes(status)) {
        updateData.resolvedAt = new Date();
        updateData.processedAt = new Date();
      }

      const updatedDispute = await prisma.dispute.update({
        where: { id },
        data: updateData,
      });

      res.json({
        success: true,
        data: {
          ...updatedDispute,
          amount: updatedDispute.amount?.toNumber?.() ?? updatedDispute.amount,
        },
        message: 'Dispute updated successfully',
      });
    } catch (error) {
      console.error('Error updating dispute:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update dispute',
      });
    }
  }
);

// ============================================
// Exchange Rate Routes
// ============================================

/**
 * @swagger
 * /api/finance/exchange-rates:
 *   get:
 *     summary: List exchange rates
 *     tags: [Finance]
 *     parameters:
 *       - in: query
 *         name: baseCurrency
 *         schema:
 *           type: string
 *           default: USD
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
  '/exchange-rates',
  requirePermission('finance:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { baseCurrency = 'USD' } = req.query;

      const rates = await prisma.exchangeRate.findMany({
        where: { baseCurrency: baseCurrency as string },
        orderBy: { targetCurrency: 'asc' },
      });

      res.json({
        success: true,
        data: rates.map(r => ({
          ...r,
          rate: r.rate?.toNumber?.() ?? r.rate,
        })),
      });
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch exchange rates',
      });
    }
  }
);

/**
 * @swagger
 * /api/finance/exchange-rates:
 *   post:
 *     summary: Update exchange rate
 *     tags: [Finance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - source
 *               - baseCurrency
 *               - targetCurrency
 *               - rate
 *             properties:
 *               source:
 *                 type: string
 *               baseCurrency:
 *                 type: string
 *               targetCurrency:
 *                 type: string
 *               rate:
 *                 type: number
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
router.post(
  '/exchange-rates',
  requirePermission('finance:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { source, baseCurrency, targetCurrency, rate } = req.body;

      if (!source || !baseCurrency || !targetCurrency || !rate) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required: source, baseCurrency, targetCurrency, rate',
        });
      }

      const exchangeRate = await prisma.exchangeRate.upsert({
        where: {
          source_baseCurrency_targetCurrency: {
            source,
            baseCurrency,
            targetCurrency,
          },
        },
        update: {
          rate: String(rate),
          fetchedAt: new Date(),
        },
        create: {
          source,
          baseCurrency,
          targetCurrency,
          rate: String(rate),
        },
      });

      res.json({
        success: true,
        data: {
          ...exchangeRate,
          rate: exchangeRate.rate?.toNumber?.() ?? exchangeRate.rate,
        },
        message: 'Exchange rate updated successfully',
      });
    } catch (error) {
      console.error('Error updating exchange rate:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update exchange rate',
      });
    }
  }
);

// ============================================
// Currency Routes
// ============================================

/**
 * @swagger
 * /api/finance/currencies:
 *   get:
 *     summary: List currencies
 *     tags: [Finance]
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
  '/currencies',
  requirePermission('finance:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const currencies = await prisma.currency.findMany({
        where: { isActive: true },
        orderBy: { code: 'asc' },
      });

      res.json({
        success: true,
        data: currencies,
      });
    } catch (error) {
      console.error('Error fetching currencies:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch currencies',
      });
    }
  }
);

/**
 * @swagger
 * /api/finance/currencies/{code}:
 *   put:
 *     summary: Update currency
 *     tags: [Finance]
 *     parameters:
 *       - in: path
 *         name: code
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
 *               symbol:
 *                 type: string
 *               decimals:
 *                 type: integer
 *               isActive:
 *                 type: boolean
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
 *         description: Currency not found
 *       500:
 *         description: Server error
 */
router.put(
  '/currencies/:code',
  requirePermission('finance:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { code } = req.params;
      const { name, symbol, decimals, isActive } = req.body;

      const currency = await prisma.currency.findUnique({
        where: { code },
      });

      if (!currency) {
        return res.status(404).json({
          success: false,
          error: 'Currency not found',
        });
      }

      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (symbol !== undefined) updateData.symbol = symbol;
      if (decimals !== undefined) updateData.decimals = decimals;
      if (isActive !== undefined) updateData.isActive = isActive;

      const updatedCurrency = await prisma.currency.update({
        where: { code },
        data: updateData,
      });

      res.json({
        success: true,
        data: updatedCurrency,
        message: 'Currency updated successfully',
      });
    } catch (error) {
      console.error('Error updating currency:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update currency',
      });
    }
  }
);

// ============================================
// Reports Routes
// ============================================

/**
 * @swagger
 * /api/finance/reports/summary:
 *   get:
 *     summary: Get financial summary
 *     tags: [Finance]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: 30d
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
router.get(
  '/reports/summary',
  requirePermission('finance:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { period = '30d' } = req.query;

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get transaction summaries
      const transactions = await prisma.walletTransaction.findMany({
        where: {
          createdAt: { gte: startDate },
        },
      });

      const summary = {
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalPurchases: 0,
        totalRefunds: 0,
        totalCommissions: 0,
        totalSettlements: 0,
        transactionCount: transactions.length,
      };

      transactions.forEach(tx => {
        const amount = tx.amount.toNumber();
        switch (tx.type) {
          case 'deposit':
            summary.totalDeposits += amount;
            break;
          case 'withdrawal':
            summary.totalWithdrawals += amount;
            break;
          case 'purchase':
            summary.totalPurchases += amount;
            break;
          case 'refund':
            summary.totalRefunds += amount;
            break;
          case 'commission':
            summary.totalCommissions += amount;
            break;
          case 'settlement':
            summary.totalSettlements += amount;
            break;
        }
      });

      // Get wallet totals
      const walletTotals = await prisma.wallet.aggregate({
        _sum: {
          balance: true,
          reservedBalance: true,
        },
      });

      // Get pending settlements
      const pendingSettlements = await prisma.settlement.aggregate({
        where: { status: 'pending' },
        _sum: { amount: true },
        _count: true,
      });

      // Get open disputes
      const openDisputes = await prisma.dispute.aggregate({
        where: { status: 'open' },
        _sum: { amount: true },
        _count: true,
      });

      res.json({
        success: true,
        data: {
          period,
          transactions: summary,
          wallets: {
            totalBalance: walletTotals._sum.balance?.toNumber?.() ?? 0,
            totalReserved: walletTotals._sum.reservedBalance?.toNumber?.() ?? 0,
          },
          settlements: {
            pendingCount: pendingSettlements._count,
            pendingAmount: pendingSettlements._sum.amount?.toNumber?.() ?? 0,
          },
          disputes: {
            openCount: openDisputes._count,
            openAmount: openDisputes._sum.amount?.toNumber?.() ?? 0,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch financial summary',
      });
    }
  }
);

/**
 * @swagger
 * /api/finance/reports/revenue:
 *   get:
 *     summary: Get revenue report
 *     tags: [Finance]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           default: 30d
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           default: day
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
  '/reports/revenue',
  requirePermission('finance:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { period = '30d', groupBy = 'day' } = req.query;

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(now.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      // Get bookings for revenue calculation
      const bookings = await prisma.booking.findMany({
        where: {
          createdAt: { gte: startDate },
          status: { notIn: ['cancelled', 'draft'] },
        },
        select: {
          createdAt: true,
          totalAmount: true,
          markupAmount: true,
          currency: true,
          serviceType: true,
        },
      });

      // Group by date
      const groupedData: Record<string, { total: number; markup: number; count: number }> = {};

      bookings.forEach(booking => {
        let key: string;
        const date = new Date(booking.createdAt);

        switch (groupBy) {
          case 'hour':
            key = `${date.toISOString().split('T')[0]}T${date.getHours().toString().padStart(2, '0')}:00`;
            break;
          case 'day':
            key = date.toISOString().split('T')[0];
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'month':
            key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            break;
          default:
            key = date.toISOString().split('T')[0];
        }

        if (!groupedData[key]) {
          groupedData[key] = { total: 0, markup: 0, count: 0 };
        }

        groupedData[key].total += booking.totalAmount.toNumber();
        groupedData[key].markup += booking.markupAmount.toNumber();
        groupedData[key].count += 1;
      });

      const revenueData = Object.entries(groupedData)
        .map(([date, data]) => ({
          date,
          totalRevenue: data.total,
          markupRevenue: data.markup,
          bookingCount: data.count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      res.json({
        success: true,
        data: revenueData,
        period,
        groupBy,
      });
    } catch (error) {
      console.error('Error fetching revenue report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch revenue report',
      });
    }
  }
);

export default router;
