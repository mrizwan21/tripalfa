import express, { Router } from "express";
import type { Router as ExpressRouter } from "express";
import WalletController from "../controllers/WalletController.js";
import { authMiddleware } from "../middlewares/auth.js";

const router: ExpressRouter = Router();

// All wallet routes require authentication
router.use(authMiddleware);

// Account Management
router.post("/", WalletController.createAccount);

// Transactions
router.post("/transfer", WalletController.transferFunds);
router.post("/deposit", WalletController.depositFunds);
router.get("/history/:accountId", WalletController.getAccountHistory);

// Dynamic route last to avoid shadowing static paths
router.get("/:entityType/:entityId", WalletController.getEntityAccounts);

export default router;
