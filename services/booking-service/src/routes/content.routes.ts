import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ── Async wrapper helper ───────────────────────────────────────
const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void | Response<any>>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next);
  };

/**
 * @swagger
 * /api/content/popular-destinations:
 *   get:
 *     summary: Get popular destinations
 *     tags: [Content]
 *     responses:
 *       200:
 *         description: Popular destinations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       500:
 *         description: Server error
 */
router.get('/popular-destinations', async (_req: Request, res: Response) => {
  const data = await prisma.$queryRaw<
    { id: number; city: string; country: string; image_url: string; rank: number }[]
  >`
    SELECT id, city, country, image_url, rank
    FROM popular_destinations
    ORDER BY rank ASC
  `;
  return res.json({ data });
});

/**
 * @swagger
 * /api/content/promotions:
 *   get:
 *     summary: Get active promotions
 *     tags: [Content]
 *     responses:
 *       200:
 *         description: Active promotions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       500:
 *         description: Server error
 */
router.get('/promotions', async (_req: Request, res: Response) => {
  const now = new Date();
  const data = await prisma.$queryRaw<
    {
      id: number;
      code: string;
      discount_type: string;
      discount_value: number;
      is_active: boolean;
      start_date: Date;
      end_date: Date;
    }[]
  >`
    SELECT id, code, discount_type, discount_value,
           is_active, start_date, end_date
    FROM promotions
    WHERE is_active = true AND start_date <= ${now} AND end_date >= ${now}
    ORDER BY start_date DESC
  `;
  return res.json({ data });
});

/**
 * @swagger
 * /api/content/promotions/validate:
 *   post:
 *     summary: Validate promo code
 *     tags: [Content]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - bookingTotal
 *             properties:
 *               code:
 *                 type: string
 *               bookingTotal:
 *                 type: number
 *     responses:
 *       200:
 *         description: Promo code validated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Invalid or expired promo code
 *       500:
 *         description: Server error
 */
// ── Promo code validation ──────────────────────────────────────
// @static-lookup: Public system-wide data, no tenant isolation needed
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/promotions/validate', async (req: Request, res: Response) => {
  const { code, bookingTotal } = req.body as {
    code?: string;
    bookingTotal?: number;
  };

  if (!code || bookingTotal == null) {
    return res.status(400).json({
      valid: false,
      error: 'code and bookingTotal are required',
    });
  }

  const now = new Date();
  const [promo] = await prisma.$queryRaw<
    {
      code: string;
      discountType: string;
      discountValue: number;
    }[]
  >`
    SELECT code, discount_type as "discountType", discount_value as "discountValue"
    FROM promotions
    WHERE code = ${code.toUpperCase().trim()}
      AND is_active = true
      AND start_date <= ${now}
      AND end_date >= ${now}
    LIMIT 1
  `;

  if (!promo) {
    return res.status(404).json({ valid: false, error: 'Invalid or expired promo code' });
  }

  const discountAmount =
    promo.discountType === 'PERCENTAGE'
      ? (bookingTotal * Number(promo.discountValue)) / 100
      : Number(promo.discountValue);

  return res.json({
    valid: true,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: promo.discountValue,
    discountAmount: Math.min(discountAmount, bookingTotal),
  });
});

/**
 * @swagger
 * /api/content/legal/{type}:
 *   get:
 *     summary: Get legal document by type
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Document type
 *     responses:
 *       200:
 *         description: Legal document retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/content/legal/{type}:
 *   get:
 *     summary: Get legal document by type
 *     tags: [Content]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Document type
 *     responses:
 *       200:
 *         description: Legal document retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Document not found
 *       500:
 *         description: Server error
 */
// ── Legal documents ────────────────────────────────────────────
// @static-lookup: Public system-wide data, no tenant isolation needed
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/legal/:type', async (req: Request, res: Response) => {
  const [doc] = await prisma.$queryRaw<
    {
      id: number;
      type: string;
      content: string | null;
      url: string | null;
      version: string;
      isActive: boolean;
    }[]
  >`
    SELECT id, type, content, url, version, is_active as "isActive"
    FROM legal_documents
    WHERE type = ${req.params.type.toUpperCase()}
      AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (!doc) return res.status(404).json({ error: 'Document not found' });
  return res.json(doc);
});

/**
 * @swagger
 * /api/content/insurance/options:
 *   get:
 *     summary: Get insurance options
 *     tags: [Content]
 *     responses:
 *       200:
 *         description: Insurance options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       500:
 *         description: Server error
 */
/**
 * @swagger
 * /api/content/insurance/options:
 *   get:
 *     summary: Get insurance options
 *     tags: [Content]
 *     responses:
 *       200:
 *         description: Insurance options retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       500:
 *         description: Server error
 */
// ── Insurance options ──────────────────────────────────────────
// @static-lookup: Public system-wide data, no tenant isolation needed
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/insurance/options', async (_req: Request, res: Response) => {
  const data = await prisma.$queryRaw<
    {
      id: number;
      name: string;
      basePrice: number;
      currency: string;
      isActive: boolean;
    }[]
  >`
    SELECT id, name, base_price as "basePrice", currency, is_active as "isActive"
    FROM insurance_products
    WHERE is_active = true
  `;

  // Fetch coverage details for each product
  const productsWithCoverage = await Promise.all(
    data.map(async product => {
      const coverage = await prisma.$queryRaw<
        {
          id: number;
          productId: number;
          coverageType: string;
          amount: number | null;
          description: string;
        }[]
      >`
        SELECT id, product_id as "productId", coverage_type as "coverageType",
               amount, description
        FROM insurance_coverage_details
        WHERE product_id = ${product.id}
      `;
      return { ...product, coverageDetails: coverage };
    })
  );

  return res.json(productsWithCoverage);
});

export default router;
