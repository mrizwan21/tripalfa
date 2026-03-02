import { Router, Request, Response } from "express";
import type { Router as ExpressRouter } from "express";
import jwt from "jsonwebtoken";

const router: ExpressRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. Set it before starting the server.",
  );
}

// Simple auth middleware for payment service
const authMiddleware = (req: Request, res: Response, next: () => void): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Access token required",
      });
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

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

// Idempotency key store (in production, use Redis)
const idempotencyStore = new Map<string, any>();

// Payment processing routes with auth and idempotency
router.post("/process", authMiddleware, (req: Request, res: Response) => {
  const { amount, currency, paymentMethod, bookingId, customerId, idempotencyKey } = req.body;

  // Validate required fields
  if (!amount || !currency || !paymentMethod || !bookingId) {
    return res.status(400).json({
      success: false,
      error:
        "Missing required fields: amount, currency, paymentMethod, bookingId",
    });
  }

  // Check idempotency - return existing transaction if key was used
  if (idempotencyKey) {
    const existingTransaction = idempotencyStore.get(idempotencyKey);
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
    customerId,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  mockTransactions.push(transaction);

  // Store in idempotency cache if key provided
  if (idempotencyKey) {
    idempotencyStore.set(idempotencyKey, transaction);
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
  res.json(mockTransactions);
});

// GET /payments/:id - Get payment by ID (requires auth)
router.get("/:id", authMiddleware, (req: Request, res: Response) => {
  const payment = mockTransactions.find((t) => t.id === req.params.id);
  if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
  res.json(payment);
});

// POST /payments/:id/refund - Refund a payment (requires auth)
router.post("/:id/refund", authMiddleware, (req: Request, res: Response) => {
  const { idempotencyKey } = req.body;
  const payment = mockTransactions.find((t) => t.id === req.params.id);
  if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
  if (payment.status === "refunded")
    return res.status(400).json({ success: false, message: "Already refunded" });
  
  // Check idempotency for refunds
  if (idempotencyKey) {
    const existingRefund = idempotencyStore.get(`refund:${idempotencyKey}`);
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
    idempotencyStore.set(`refund:${idempotencyKey}`, payment);
  }
  
  res.json({ success: true, payment });
});

// Analytics requires auth
router.get("/analytics", authMiddleware, (req: Request, res: Response) => {
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

export default router;
