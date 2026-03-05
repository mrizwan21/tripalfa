import { Router, Request, Response } from "express";
import { WalletManager } from "@tripalfa/wallet";

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

  const getAuthenticatedUser = (req: AuthenticatedRequest): { userId: string | null; isAdmin: boolean } => {
    const user = req.user || {};
    const userId = user.userId || user.sub || user.id || null;
    const role = String(user.role || "").toLowerCase();
    const isAdmin = role === "admin" || role === "super_admin";
    return { userId, isAdmin };
  };

  const parsePositiveAmount = (value: unknown): number | null => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    return amount;
  };

  // GET /api/wallet - List all wallets for the authenticated user
  router.get("/", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = getAuthenticatedUser(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const wallets = await walletManager.getUserWallets(userId);
      res.json(wallets);
    } catch (error) {
      console.error("Error fetching wallets:", error);
      res.status(500).json({ error: "Failed to fetch wallets" });
    }
  });

  // GET /api/wallet/balance - Get specific wallet balance
  router.get("/balance", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = getAuthenticatedUser(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

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
  router.post("/credit", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = getAuthenticatedUser(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { currency, amount, reason, idempotencyKey } = req.body;
      const key = idempotencyKey || req.headers["idempotency-key"];
      const parsedAmount = parsePositiveAmount(amount);

      if (!currency || !key || parsedAmount === null) {
        return res.status(400).json({
          error:
            "Currency, positive numeric amount, and idempotencyKey are required",
        });
      }

      const transaction = await walletManager.creditWallet(
        userId,
        currency,
        parsedAmount,
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
  router.post("/debit", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = getAuthenticatedUser(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { currency, amount, reason, idempotencyKey } = req.body;
      const key = idempotencyKey || req.headers["idempotency-key"];
      const parsedAmount = parsePositiveAmount(amount);

      if (!currency || !key || parsedAmount === null) {
        return res.status(400).json({
          error:
            "Currency, positive numeric amount, and idempotencyKey are required",
        });
      }

      const transaction = await walletManager.debitWallet(
        userId,
        currency,
        parsedAmount,
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
  router.post("/transfer", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = getAuthenticatedUser(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { fromCurrency, toCurrency, amount, idempotencyKey } = req.body;
      const key = idempotencyKey || req.headers["idempotency-key"];
      const parsedAmount = parsePositiveAmount(amount);

      if (!fromCurrency || !toCurrency || !key || parsedAmount === null) {
        return res.status(400).json({
          error:
            "fromCurrency, toCurrency, positive numeric amount, and idempotencyKey are required",
        });
      }

      const transfer = await walletManager.transferBetweenCurrencies(
        userId,
        fromCurrency,
        toCurrency,
        parsedAmount,
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
  router.get("/history", async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { userId } = getAuthenticatedUser(req);
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { limit = "50", offset = "0" } = req.query;
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
          error: "Invalid pagination values: limit (1-200), offset (>=0)",
        });
      }

      const history = await walletManager.getTransactionHistory(
        userId,
        parsedLimit,
        parsedOffset,
      );
      res.json(history);
    } catch (error) {
      console.error("Error fetching history:", error);
      res.status(500).json({ error: "Failed to fetch transaction history" });
    }
  });

  return router;
};
