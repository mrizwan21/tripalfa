import express, { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import WalletController from '../controllers/WalletController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router: ExpressRouter = Router();

// All wallet routes require authentication
router.use(authMiddleware);

// Account Management
/**
 * @swagger
 * /api/v1/ledger:
 *   post:
 *     summary: Create a wallet account
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
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/', WalletController.createAccount);

// Transactions
/**
 * @swagger
 * /api/v1/ledger/transfer:
 *   post:
 *     summary: Transfer funds between wallets
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
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/transfer', WalletController.transferFunds);
/**
 * @swagger
 * /api/v1/ledger/deposit:
 *   post:
 *     summary: Deposit funds into a wallet
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
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/deposit', WalletController.depositFunds);
/**
 * @swagger
 * /api/v1/ledger/history/{accountId}:
 *   get:
 *     summary: Get account transaction history
 *     tags: [Wallet]
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
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
router.get('/history/:accountId', WalletController.getAccountHistory);

// Dynamic route last to avoid shadowing static paths
/**
 * @swagger
 * /api/v1/ledger/{entityType}/{entityId}:
 *   get:
 *     summary: Get entity accounts
 *     tags: [Wallet]
 *     parameters:
 *       - in: path
 *         name: entityType
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity type
 *       - in: path
 *         name: entityId
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity ID
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
router.get('/:entityType/:entityId', WalletController.getEntityAccounts);

export default router;
