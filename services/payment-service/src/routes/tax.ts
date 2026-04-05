import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';

const router: ExpressRouter = Router();

/**
 * @swagger
 * /api/tax/calculate:
 *   get:
 *     summary: Calculate taxes for booking
 *     tags: [Tax]
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: number
 *         description: The amount to calculate tax on
 *       - in: query
 *         name: country
 *         required: false
 *         schema:
 *           type: string
 *         description: Country code
 *       - in: query
 *         name: state
 *         required: false
 *         schema:
 *           type: string
 *         description: State code
 *     responses:
 *       200:
 *         description: Tax calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 error:
 *                   type: string
 *       400:
 *         description: Invalid amount
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to calculate tax
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.get('/calculate', async (req: Request, res: Response) => {
  try {
    const { amount, country, state } = req.query;

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      return res.status(400).json({
        error: 'amount must be a non-negative number',
      });
    }

    const normalizedCountry =
      typeof country === 'string' && country.trim() ? country.trim().toUpperCase() : 'US';
    const normalizedState =
      typeof state === 'string' && state.trim() ? state.trim().toUpperCase() : 'CA';

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
    console.error('Error calculating tax:', error);
    res.status(500).json({ error: 'Failed to calculate tax' });
  }
});

/**
 * @swagger
 * /api/tax/rates/{country}:
 *   get:
 *     summary: Get tax rates for country
 *     tags: [Tax]
 *     parameters:
 *       - in: path
 *         name: country
 *         required: true
 *         schema:
 *           type: string
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
router.get('/rates/:country', async (req: Request, res: Response) => {
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
    console.error('Error fetching tax rates:', error);
    res.status(500).json({ error: 'Failed to fetch tax rates' });
  }
});

export default router;
