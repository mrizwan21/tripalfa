import express, { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import WalletController from '../controllers/WalletController.js';

const router: ExpressRouter = Router();

// Account Management
router.post('/', WalletController.createAccount);
router.get('/:entityType/:entityId', WalletController.getEntityAccounts);

// Transactions
router.post('/transfer', WalletController.transferFunds);
router.post('/deposit', WalletController.depositFunds);
router.get('/history/:accountId', WalletController.getAccountHistory);

export default router;
