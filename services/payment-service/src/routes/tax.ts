import { Router, Request, Response } from "express";
import type { Router as ExpressRouter } from "express";

const router: ExpressRouter = Router();

// GET /api/tax/calculate - Calculate taxes for booking
router.get("/calculate", async (req: Request, res: Response) => {
  try {
    const { amount, country, state } = req.query;
    const taxAmount = parseFloat(amount as string) * 0.08; // Mock 8% tax
    res.json({
      data: {
        originalAmount: parseFloat(amount as string),
        taxAmount,
        totalAmount: parseFloat(amount as string) + taxAmount,
        taxRate: 0.08,
        country: country || "US",
        state: state || "CA",
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
