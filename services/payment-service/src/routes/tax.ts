import { Router, Request, Response } from "express";
import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

// GET /api/tax/calculate - Calculate taxes for booking
router.get("/calculate", async (req: Request, res: Response) => {
  try {
    const { amount, country, state } = req.query;

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({
        error: "amount must be a non-negative number",
      });
    }

    const normalizedCountry =
      typeof country === "string" && country.trim()
        ? country.trim().toUpperCase()
        : "US";
    const normalizedState =
      typeof state === "string" && state.trim()
        ? state.trim().toUpperCase()
        : "CA";

    const taxAmount = parsedAmount * 0.08; // Mock 8% tax
    res.json({
      data: {
        originalAmount: parsedAmount,
        taxAmount,
        totalAmount: parsedAmount + taxAmount,
        taxRate: 0.08,
        country: normalizedCountry,
        state: normalizedState,
      },
    });
  } catch (error) {
    console.error("Error calculating tax:", error);
    res.status(500).json({ error: "Failed to calculate tax" });
  }
});

// GET /api/tax/rates/:country - Get tax rates for country
router.get("/rates/:country", async (req: Request, res: Response) => {
  try {
    const { country } = req.params;
    const rates = {
      country,
      standardRate: 0.08,
      reducedRate: 0.05,
      zeroRate: 0.0,
      lastUpdated: new Date().toISOString(),
    };
    res.json({ data: rates });
  } catch (error) {
    console.error("Error fetching tax rates:", error);
    res.status(500).json({ error: "Failed to fetch tax rates" });
  }
});

export default router;
