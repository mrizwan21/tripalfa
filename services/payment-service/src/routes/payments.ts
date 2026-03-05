import { Router, Request, Response } from "express";
import type { Router as ExpressRouter } from "express";
import {
  authMiddleware,
  getAuthenticatedUser,
} from "../middleware/auth.js";

const router: ExpressRouter = Router();

// ============================================================================
// Idempotency Store - Supports both Redis (production) and in-memory (dev)
// ============================================================================

interface IdempotencyStore {
  get(key: string): Promise<any> | any;
  set(key: string, value: any, ttlSeconds?: number): Promise<void> | void;
}

// In-memory implementation for development
export class InMemoryIdempotencyStore implements IdempotencyStore {
  private store = new Map<string, any>();
  private expiryTimes = new Map<string, number>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    // Clean up expired entries periodically
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000); // Every hour
  }

  /**
   * Stop the cleanup interval. Call this during tests or shutdown.
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  get(key: string): any {
    // Check if expired
    const expiry = this.expiryTimes.get(key);
    if (expiry && Date.now() > expiry) {
      this.store.delete(key);
      this.expiryTimes.delete(key);
      return undefined;
    }
    return this.store.get(key);
  }

  set(key: string, value: any, ttlSeconds: number = 86400): void {
    this.store.set(key, value);
    this.expiryTimes.set(key, Date.now() + (ttlSeconds * 1000));
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, expiry] of this.expiryTimes.entries()) {
      if (now > expiry) {
        this.store.delete(key);
        this.expiryTimes.delete(key);
      }
    }
  }
}

// Redis implementation for production (lazy-loaded with initialization tracking)
export class RedisIdempotencyStore implements IdempotencyStore {
  private redis: any = null;
  private connected = false;
  private fallbackStore: InMemoryIdempotencyStore;
  private initPromise: Promise<void> | null = null;
  private initStarted = false;

  constructor() {
    this.fallbackStore = new InMemoryIdempotencyStore();
    // Defer initialization to first use to avoid blocking constructor
  }

  /**
   * Gracefully shutdown the Redis store and its fallback.
   * Call this during application shutdown to prevent memory leaks
   * and ensure clean disconnection from Redis.
   */
  async shutdown(): Promise<void> {
    // Stop the fallback store's cleanup interval
    this.fallbackStore.stopCleanup();
    
    // Disconnect Redis if connected
    if (this.redis?.isReady) {
      await this.redis.disconnect();
      this.connected = false;
    }
  }

  /**
   * Ensure Redis is initialized before use. Safe to call multiple times.
   */
  private async ensureInitialized(): Promise<void> {
    if (this.connected) return;
    
    if (!this.initStarted) {
      this.initStarted = true;
      this.initPromise = this.initRedis();
    }
    
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  private async initRedis(): Promise<void> {
    try {
      // Dynamically import Redis to avoid dependency if not configured
      const { createClient } = await import("redis");
      const redisUrl = process.env.REDIS_URL || process.env.REDIS_IDEMPOTENCY_URL;

      if (!redisUrl) {
        console.warn("[Idempotency] REDIS_URL not configured, using in-memory fallback");
        return;
      }

      this.redis = createClient({ url: redisUrl });
      this.redis.on("error", (err: Error) => {
        console.error("[Idempotency] Redis error:", err);
        this.connected = false;
      });
      this.redis.on("connect", () => {
        console.log("[Idempotency] Redis connected");
        this.connected = true;
      });

      await this.redis.connect();
    } catch (error) {
      console.warn("[Idempotency] Failed to initialize Redis, using in-memory fallback:", error);
    }
  }

  async get(key: string): Promise<any> {
    await this.ensureInitialized();
    
    if (this.connected && this.redis) {
      try {
        const value = await this.redis.get(`idempotency:${key}`);
        return value ? JSON.parse(value) : undefined;
      } catch (error) {
        console.error("[Idempotency] Redis get failed, using fallback:", error);
      }
    }
    return this.fallbackStore.get(key);
  }

  async set(key: string, value: any, ttlSeconds: number = 86400): Promise<void> {
    await this.ensureInitialized();
    
    if (this.connected && this.redis) {
      try {
        await this.redis.setEx(`idempotency:${key}`, ttlSeconds, JSON.stringify(value));
        return;
      } catch (error) {
        console.error("[Idempotency] Redis set failed, using fallback:", error);
      }
    }
    this.fallbackStore.set(key, value, ttlSeconds);
  }
}

// Create store instance - uses Redis if configured, otherwise in-memory
const idempotencyStore: IdempotencyStore = process.env.REDIS_URL || process.env.REDIS_IDEMPOTENCY_URL
  ? new RedisIdempotencyStore()
  : new InMemoryIdempotencyStore();

/**
 * Gracefully shutdown the idempotency store.
 * Call this during application shutdown or in tests to prevent memory leaks
 * from dangling intervals.
 *
 * @example
 * // In your shutdown handler:
 * process.on('SIGTERM', async () => {
 *   await shutdownIdempotencyStore();
 *   process.exit(0);
 * });
 */
export async function shutdownIdempotencyStore(): Promise<void> {
  if (idempotencyStore instanceof InMemoryIdempotencyStore) {
    idempotencyStore.stopCleanup();
  } else if (idempotencyStore instanceof RedisIdempotencyStore) {
    await idempotencyStore.shutdown();
  }
}

// Helper to handle both sync and async store operations
async function getFromStore(store: IdempotencyStore, key: string): Promise<any> {
  const result = store.get(key);
  return result instanceof Promise ? await result : result;
}

async function setInStore(store: IdempotencyStore, key: string, value: any, ttlSeconds?: number): Promise<void> {
  const result = store.set(key, value, ttlSeconds);
  if (result instanceof Promise) {
    await result;
  }
}

// Mock payment gateway integrations
const PAYMENT_GATEWAYS: Record<string, any> = {
  stripe: {
    name: "Stripe",
    supportedCurrencies: ["USD", "EUR", "GBP", "CAD", "AUD"],
    supportedMethods: ["card", "apple_pay", "google_pay", "link"],
    processingFee: 0.029, // 2.9%
    fixedFee: 0.3,
  },
  paypal: {
    name: "PayPal",
    supportedCurrencies: ["USD", "EUR", "GBP", "CAD", "AUD", "JPY"],
    supportedMethods: ["paypal", "venmo", "pay_later"],
    processingFee: 0.034, // 3.4%
    fixedFee: 0.49,
  },
};

// Mock transactions data
const mockTransactions: any[] = [
  {
    id: "txn_001",
    bookingId: "BK-2026-001247",
    amount: 1213.0,
    currency: "USD",
    status: "completed",
    paymentMethod: "card",
    gateway: "stripe",
    customerId: "user123",
    description: "Flight + Hotel Package",
    createdAt: "2026-01-21T14:30:00Z",
    completedAt: "2026-01-21T14:31:00Z",
  },
];

// Payment processing routes with auth and idempotency
router.post("/process", authMiddleware, async (req: Request, res: Response) => {
  const { amount, currency, paymentMethod, bookingId, idempotencyKey } =
    req.body;
  const { userId: authenticatedCustomerId } = getAuthenticatedUser(req);

  if (!authenticatedCustomerId) {
    return res.status(401).json({
      success: false,
      error: "Invalid token payload",
    });
  }

  // Validate required fields
  if (!amount || !currency || !paymentMethod || !bookingId) {
    return res.status(400).json({
      success: false,
      error:
        "Missing required fields: amount, currency, paymentMethod, bookingId",
    });
  }

  // Validate amount is a positive number
  if (typeof amount !== "number" || amount <= 0 || !Number.isFinite(amount)) {
    return res.status(400).json({
      success: false,
      error: "Amount must be a positive number",
    });
  }

  // Check idempotency - return existing transaction if key was used
  if (idempotencyKey) {
    const existingTransaction = await getFromStore(idempotencyStore, idempotencyKey);
    if (existingTransaction) {
      return res.json({
        success: true,
        transaction: existingTransaction,
        message: "Payment already processed (idempotency)",
        idempotent: true,
      });
    }
  }

  const transaction = {
    id: `txn_${String(mockTransactions.length + 1).padStart(3, "0")}`,
    bookingId,
    amount,
    currency,
    status: "completed",
    paymentMethod,
    gateway: "stripe",
    customerId: authenticatedCustomerId,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  mockTransactions.push(transaction);

  // Store in idempotency cache if key provided (TTL: 24 hours)
  if (idempotencyKey) {
    await setInStore(idempotencyStore, idempotencyKey, transaction, 86400);
  }

  res.json({
    success: true,
    transaction,
    message: "Payment processed successfully",
  });
});

// Public endpoint - doesn't require auth
router.get("/methods", (req: Request, res: Response) => {
  res.json({
    country: "US",
    currency: "USD",
    methods: [
      { id: "card", name: "Credit/Debit Card", gateways: ["stripe"] },
      { id: "paypal", name: "PayPal", gateways: ["paypal"] },
    ],
  });
});

// GET /payments - List all payments (requires auth)
router.get("/", authMiddleware, (req: Request, res: Response) => {
  const { userId, isAdmin } = getAuthenticatedUser(req);

  if (isAdmin) {
    return res.json(mockTransactions);
  }

  const visibleTransactions = mockTransactions.filter(
    (t) => t.customerId === userId,
  );
  return res.json(visibleTransactions);
});

 // Analytics requires admin auth
router.get("/analytics", authMiddleware, (req: Request, res: Response) => {
  const { isAdmin } = getAuthenticatedUser(req);

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  res.json({
    data: {
      summary: {
        totalVolume: 456780,
        totalTransactions: 1247,
        successRate: 98.2,
      },
    },
  });
});

// GET /payments/:id - Get payment by ID (requires auth)
router.get("/:id", authMiddleware, (req: Request, res: Response) => {
  const { userId, isAdmin } = getAuthenticatedUser(req);

  const payment = mockTransactions.find((t) => t.id === req.params.id);
  if (!payment)
    return res
      .status(404)
      .json({ success: false, message: "Payment not found" });

  if (!isAdmin && payment.customerId !== userId) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  res.json(payment);
});

// POST /payments/:id/refund - Refund a payment (requires auth)
router.post("/:id/refund", authMiddleware, async (req: Request, res: Response) => {
  const { idempotencyKey } = req.body;
  const { userId, isAdmin } = getAuthenticatedUser(req);

  const payment = mockTransactions.find((t) => t.id === req.params.id);
  if (!payment)
    return res
      .status(404)
      .json({ success: false, message: "Payment not found" });

  if (!isAdmin && payment.customerId !== userId) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }
  if (payment.status === "refunded")
    return res.status(400).json({ success: false, message: "Already refunded" });

  // Check idempotency for refunds
  if (idempotencyKey) {
    const existingRefund = await getFromStore(idempotencyStore, `refund:${idempotencyKey}`);
    if (existingRefund) {
      return res.json({
        success: true,
        payment: existingRefund,
        message: "Refund already processed (idempotency)",
        idempotent: true,
      });
    }
  }

  payment.status = "refunded";
  payment.refundedAt = new Date().toISOString();

  if (idempotencyKey) {
    await setInStore(idempotencyStore, `refund:${idempotencyKey}`, payment, 86400);
  }

  res.json({ success: true, payment });
});

export default router;
