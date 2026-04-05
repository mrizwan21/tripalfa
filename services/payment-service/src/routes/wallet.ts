import { Router, Request, Response } from 'express';
import { WalletManager } from '@tripalfa/wallet';

// JWT Payload interface for type safety
interface JwtPayload {
  sub?: string;
  id?: string;
  userId?: string;
  role?: string;
  [key: string]: unknown;
}

// Extended Request interface with typed user property
interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

/**
 * Wallet API routes for Payment Service
 *
 * These routes are handled by the WalletManager from the @tripalfa/wallet package.
 * All mutations (POST) are idempotent using the Idempotency-Key header.
 */
export default (walletManager: WalletManager): Router => {
  const router = Router();

  const getAuthenticatedUser = (
    req: AuthenticatedRequest
  ): { userId: string | null; isAdmin: boolean } => {
    const user = req.user || {};
    const userId = user.userId || user.sub || user.id || null;
    const role = String(user.role || '').toLowerCase();
    const isAdmin = role === 'admin' || role === 'super_admin';
    return { userId, isAdmin };
  };

  const parsePositiveAmount = (value: unknown): number | null => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return amount;
  };

  /**
   * @swagger
   * /api/wallet:
   *   get:
   *     summary: List all wallets
   *     tags: [Wallet]
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
  router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = getAuthenticatedUser(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const wallets = await walletManager.getUserWallets(userId);
      res.json(wallets);
    } catch (error) {
      console.error('Error fetching wallets:', error);
      res.status(500).json({ error: 'Failed to fetch wallets' });
    }
  });

  /**
   * @swagger
   * /api/wallet/balance:
   *   get:
   *     summary: Get specific wallet balance
   *     tags: [Wallet]
   *     parameters:
   *       - in: query
   *         name: currency
   *         required: true
   *         schema:
   *           type: string
   *         description: Currency code
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
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Server error
   */
  router.get('/balance', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = getAuthenticatedUser(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { currency } = req.query;

      if (!currency || typeof currency !== 'string') {
        return res.status(400).json({ error: 'Currency is required' });
      }

      const balance = await walletManager.getWalletBalance(userId, currency);
      res.json(balance);
    } catch (error: any) {
      console.error('Error fetching balance:', error);
      res.status(error.status || 500).json({ error: error.message || 'Failed to fetch balance' });
    }
  });

  /**
   * @swagger
   * /api/wallet/credit:
   *   post:
   *     summary: Top up wallet
   *     tags: [Wallet]
   *     parameters:
   *       - in: header
   *         name: Idempotency-Key
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currency
   *               - amount
   *               - idempotencyKey
   *             properties:
   *               currency:
   *                 type: string
   *               amount:
   *                 type: number
   *               reason:
   *                 type: string
   *               idempotencyKey:
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
   *       400:
   *         description: Bad request
   *       500:
   *         description: Server error
   */
  router.post('/credit', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = getAuthenticatedUser(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { currency, amount, reason, idempotencyKey } = req.body;
      const key = idempotencyKey || req.headers['idempotency-key'];
      const parsedAmount = parsePositiveAmount(amount);

      if (!currency || !key || parsedAmount === null) {
        return res.status(400).json({
          error: 'Currency, positive numeric amount, and idempotencyKey are required',
        });
      }

      const transaction = await walletManager.creditWallet(
        userId,
        currency,
        parsedAmount,
        reason,
        key as string
      );
      res.status(201).json(transaction);
    } catch (error: any) {
      console.error('Error crediting wallet:', error);
      res.status(error.status || 500).json({ error: error.message || 'Failed to credit wallet' });
    }
  });

  /**
   * @swagger
   * /api/wallet/debit:
   *   post:
   *     summary: Payment from wallet
   *     tags: [Wallet]
   *     parameters:
   *       - in: header
   *         name: Idempotency-Key
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - currency
   *               - amount
   *               - idempotencyKey
   *             properties:
   *               currency:
   *                 type: string
   *               amount:
   *                 type: number
   *               reason:
   *                 type: string
   *               idempotencyKey:
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
   *       400:
   *         description: Bad request
   *       500:
   *         description: Server error
   */
  router.post('/debit', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = getAuthenticatedUser(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { currency, amount, reason, idempotencyKey } = req.body;
      const key = idempotencyKey || req.headers['idempotency-key'];
      const parsedAmount = parsePositiveAmount(amount);

      if (!currency || !key || parsedAmount === null) {
        return res.status(400).json({
          error: 'Currency, positive numeric amount, and idempotencyKey are required',
        });
      }

      const transaction = await walletManager.debitWallet(
        userId,
        currency,
        parsedAmount,
        reason,
        key as string
      );
      res.status(201).json(transaction);
    } catch (error: any) {
      console.error('Error debiting wallet:', error);
      res.status(error.status || 500).json({ error: error.message || 'Failed to debit wallet' });
    }
  });

  /**
   * @swagger
   * /api/wallet/transfer:
   *   post:
   *     summary: Transfer between currencies
   *     tags: [Wallet]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               fromCurrency:
   *                 type: string
   *               toCurrency:
   *                 type: string
   *               amount:
   *                 type: number
   *               idempotencyKey:
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
  router.post('/transfer', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = getAuthenticatedUser(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { fromCurrency, toCurrency, amount, idempotencyKey } = req.body;
      const key = idempotencyKey || req.headers['idempotency-key'];
      const parsedAmount = parsePositiveAmount(amount);

      if (!fromCurrency || !toCurrency || !key || parsedAmount === null) {
        return res.status(400).json({
          error:
            'fromCurrency, toCurrency, positive numeric amount, and idempotencyKey are required',
        });
      }

      const transfer = await walletManager.transferBetweenCurrencies(
        userId,
        fromCurrency,
        toCurrency,
        parsedAmount,
        key as string
      );
      res.status(201).json(transfer);
    } catch (error: any) {
      console.error('Error transferring funds:', error);
      res.status(error.status || 500).json({ error: error.message || 'Failed to transfer funds' });
    }
  });

  /**
   * @swagger
   * /api/wallet/history:
   *   get:
   *     summary: Get transaction history
   *     tags: [Wallet]
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *       - in: query
   *         name: offset
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
  router.get('/history', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = getAuthenticatedUser(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { limit = '50', offset = '0' } = req.query;
      const parsedLimit = Number(limit);
      const parsedOffset = Number(offset);

      if (
        !Number.isInteger(parsedLimit) ||
        parsedLimit <= 0 ||
        parsedLimit > 200 ||
        !Number.isInteger(parsedOffset) ||
        parsedOffset < 0
      ) {
        return res.status(400).json({
          error: 'Invalid pagination values: limit (1-200), offset (>=0)',
        });
      }

      const history = await walletManager.getTransactionHistory(userId, parsedLimit, parsedOffset);
      res.json(history);
    } catch (error) {
      console.error('Error fetching history:', error);
      res.status(500).json({ error: 'Failed to fetch transaction history' });
    }
  });

  return router;
};
