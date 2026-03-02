import { Router, Request, Response } from "express";
import { WalletManager } from "@tripalfa/wallet";

/**
 * Wallet API routes for Payment Service
 *
 * These routes are handled by the WalletManager from the @tripalfa/wallet package.
 * All mutations (POST) are idempotent using the Idempotency-Key header.
 */
export default (walletManager: WalletManager): Router => {
  const router = Router();

  // GET /api/wallet - List all wallets for the authenticated user
  router.get("/", async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const wallets = await walletManager.getUserWallets(userId);
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      res.status(500).json({ error: "Failed to fetch wallets" });
    }
  });

  // GET /api/wallet/balance - Get specific wallet balance
  router.get("/balance", async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { currency } = req.query;

      if (!currency || typeof currency !== "string") {
        return res.status(400).json({ error: "Currency is required" });
      }

      const balance = await walletManager.getWalletBalance(userId, currency);
      res.json(balance);
    } catch (error: any) {
      console.error("Error fetching balance:", error);
      res
        .status(error.status || 500)
        .json({ error: error.message || "Failed to fetch balance" });
    }
  });

  // POST /api/wallet/credit - Top up wallet (Idempotent)
  router.post("/credit", async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { currency, amount, reason, idempotencyKey } = req.body;
      const key = idempotencyKey || req.headers["idempotency-key"];

      if (!currency || !amount || !key) {
        return res
          .status(400)
          .json({ error: "Currency, amount, and idempotencyKey are required" });
      }

      const transaction = await walletManager.creditWallet(
        userId,
        currency,
        amount,
        reason,
        key as string,
      );
      res.status(201).json(transaction);
    } catch (error: any) {
      console.error("Error crediting wallet:", error);
      res
        .status(error.status || 500)
        .json({ error: error.message || "Failed to credit wallet" });
    }
  });

  // POST /api/wallet/debit - Payment from wallet (Idempotent)
  router.post("/debit", async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { currency, amount, reason, idempotencyKey } = req.body;
      const key = idempotencyKey || req.headers["idempotency-key"];

      if (!currency || !amount || !key) {
        return res
          .status(400)
          .json({ error: "Currency, amount, and idempotencyKey are required" });
      }

      const transaction = await walletManager.debitWallet(
        userId,
        currency,
        amount,
        reason,
        key as string,
      );
      res.status(201).json(transaction);
    } catch (error: any) {
      console.error("Error debiting wallet:", error);
      res
        .status(error.status || 500)
        .json({ error: error.message || "Failed to debit wallet" });
    }
  });

  // POST /api/wallet/transfer - Transfer between currencies (Idempotent)
  router.post("/transfer", async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { fromCurrency, toCurrency, amount, idempotencyKey } = req.body;
      const key = idempotencyKey || req.headers["idempotency-key"];

      if (!fromCurrency || !toCurrency || !amount || !key) {
        return res.status(400).json({
          error:
            "fromCurrency, toCurrency, amount, and idempotencyKey are required",
        });
      }

      const transfer = await walletManager.transferBetweenCurrencies(
        userId,
        fromCurrency,
        toCurrency,
        amount,
        key as string,
      );
      res.status(201).json(transfer);
    } catch (error: any) {
      console.error("Error transferring funds:", error);
      res
        .status(error.status || 500)
        .json({ error: error.message || "Failed to transfer funds" });
    }
  });

  // GET /api/wallet/history - Transaction history
  router.get("/history", async (req: Request, res: Response) => {
    try {
      const { userId } = (req as any).user;
      const { limit = "50", offset = "0" } = req.query;

      const history = await walletManager.getTransactionHistory(
        userId,
        parseInt(limit as string),
        parseInt(offset as string),
      );
      res.json(history);
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ error: "Failed to fetch transaction history" });
    }
  });

  return router;
};
