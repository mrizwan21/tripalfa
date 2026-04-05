// src/routes/fxRoute.ts
// FX rate endpoints for multi-currency conversions and rate lookups
//
// SECURITY NOTICE: FX Rate Failure Handling
// ------------------------------------------
// When the FX service is unavailable or rate data is stale (>3 hours old),
// the system REJECTS conversion requests rather than using fallback rates.
// This prevents financial loss from incorrect currency conversions.
// All rejected transactions are logged for audit.

import express, { Router, Request, Response } from 'express';
import {
  convertAmount as convertAmountService,
  getRate,
  getLatestSnapshot,
} from '../services/fxService.js';
import { logger } from '../utils/logger.js';
import { authMiddleware } from '../middlewares/auth.js';

const SERVICE_NAME = 'fxRoute';
const router: Router = express.Router();

// Maximum age of FX rates in milliseconds (3 hours)
const MAX_RATE_AGE_MS = 3 * 60 * 60 * 1000;

// ISO 4217 currency codes - commonly supported currencies
const VALID_CURRENCY_CODES = new Set([
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'HKD',
  'NZD',
  'SEK',
  'KRW',
  'SGD',
  'NOK',
  'MXN',
  'INR',
  'RUB',
  'ZAR',
  'TRY',
  'BRL',
  'TWD',
  'DKK',
  'PLN',
  'THB',
  'IDR',
  'HUF',
  'CZK',
  'ILS',
  'CLP',
  'PHP',
  'AED',
  'COP',
  'SAR',
  'MYR',
  'RON',
  'ARS',
  'KWD',
  'QAR',
  'OMR',
  'JOD',
  'BHD',
  'EGP',
  'NGN',
  'PKR',
  'BDT',
  'VND',
  'LKR',
  'MMK',
  'KHR',
  'MOP',
  'BND',
  'KZT',
  'UZS',
  'GEL',
  'MNT',
  'NPR',
  'AFN',
  'IRR',
  'IQD',
  'SYP',
  'YER',
  'LYD',
  'SDG',
  'TND',
  'DZD',
  'MAD',
  'MRU',
  'XOF',
  'XAF',
  'CDF',
  'BIF',
  'DJF',
  'ERN',
  'ETB',
  'KES',
  'MGA',
  'MWK',
  'MZN',
  'RWF',
  'SCR',
  'SLL',
  'SOS',
  'SSP',
  'SZL',
  'TZS',
  'UGX',
  'ZMW',
  'ZWL',
  'AOA',
  'BWP',
  'LSL',
  'NAD',
  'ZAR',
]);

/**
 * Validate currency code against ISO 4217 standard
 */
function isValidCurrencyCode(currency: string): boolean {
  if (!currency || typeof currency !== 'string') return false;
  return VALID_CURRENCY_CODES.has(currency.toUpperCase());
}

/**
 * Check if FX rates are fresh and available
 * Returns true if rates are valid, false if stale or unavailable
 */
async function areRatesFresh(): Promise<{ valid: boolean; reason?: string; fetchedAt?: Date }> {
  try {
    const snapshot = await getLatestSnapshot();
    if (!snapshot || !snapshot.fetchedAt) {
      return { valid: false, reason: 'No FX rate data available' };
    }

    const fetchedAt = new Date(snapshot.fetchedAt);
    const ageMs = Date.now() - fetchedAt.getTime();

    if (ageMs > MAX_RATE_AGE_MS) {
      return {
        valid: false,
        reason: `FX rates are stale (${Math.round(ageMs / 60000)} minutes old)`,
        fetchedAt,
      };
    }

    return { valid: true, fetchedAt };
  } catch (err) {
    logger.error(`${SERVICE_NAME}: Failed to check rate freshness`, err as Error);
    return { valid: false, reason: 'FX service unavailable' };
  }
}

/**
 * @swagger
 * /api/fx/health:
 *   get:
 *     summary: Check FX service health
 *     tags: [FX]
 *     responses:
 *       200:
 *         description: Health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 service:
 *                   type: string
 *                 baseCurrency:
 *                   type: string
 *                 currencyCount:
 *                   type: integer
 *                 fetchedAt:
 *                   type: string
 *                 isStale:
 *                   type: boolean
 *       503:
 *         description: Service unavailable
 */
router.get('/api/fx/health', async (req: Request, res: Response) => {
  try {
    const snapshot = await getLatestSnapshot();
    const ratesCount = Object.keys(snapshot.rates || {}).length;
    const fetchedAt = new Date(snapshot.fetchedAt);
    const ageMs = Date.now() - fetchedAt.getTime();
    const isStale = ageMs > MAX_RATE_AGE_MS;

    res.json({
      status: isStale ? 'degraded' : 'healthy',
      service: 'fx-service',
      baseCurrency: snapshot.baseCurrency || 'USD',
      currencyCount: ratesCount,
      fetchedAt: snapshot.fetchedAt,
      isStale,
      maxAgeHours: 3,
    });
  } catch (err) {
    logger.error(`${SERVICE_NAME}: Health check failed`, err as Error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Service temporarily unavailable',
    });
  }
});

/**
 * @swagger
 * /api/fx/rates:
 *   get:
 *     summary: Get all current FX rates
 *     tags: [FX]
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
 *                 rates:
 *                   type: object
 *                 baseCurrency:
 *                   type: string
 *                 fetchedAt:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.get('/api/fx/rates', async (req: Request, res: Response) => {
  try {
    const snapshot = await getLatestSnapshot();
    res.json({
      success: true,
      rates: snapshot.rates,
      baseCurrency: snapshot.baseCurrency || 'USD',
      fetchedAt: snapshot.fetchedAt,
    });
  } catch (err) {
    logger.error(`${SERVICE_NAME}: Get rates failed`, err as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve exchange rates',
    });
  }
});

/**
 * @swagger
 * /api/fx/rate/{fromCurrency}/{toCurrency}:
 *   get:
 *     summary: Get a single FX rate pair
 *     tags: [FX]
 *     parameters:
 *       - in: path
 *         name: fromCurrency
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: toCurrency
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
 *                 fromCurrency:
 *                   type: string
 *                 toCurrency:
 *                   type: string
 *                 rate:
 *                   type: number
 *                 feePercentage:
 *                   type: number
 *       400:
 *         description: Invalid currency codes
 *       503:
 *         description: Rates unavailable
 *       500:
 *         description: Server error
 */
router.get('/api/fx/rate/:fromCurrency/:toCurrency', async (req: Request, res: Response) => {
  try {
    const { fromCurrency, toCurrency } = req.params;

    if (!fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        error: 'fromCurrency and toCurrency are required',
      });
    }

    // Validate currency codes
    if (!isValidCurrencyCode(fromCurrency)) {
      return res.status(400).json({
        success: false,
        error: `Invalid fromCurrency: '${fromCurrency}'. Must be a valid ISO 4217 currency code.`,
      });
    }

    if (!isValidCurrencyCode(toCurrency)) {
      return res.status(400).json({
        success: false,
        error: `Invalid toCurrency: '${toCurrency}'. Must be a valid ISO 4217 currency code.`,
      });
    }

    // Check rate freshness before returning
    const freshness = await areRatesFresh();
    if (!freshness.valid) {
      logger.warn(`${SERVICE_NAME}: Rate request rejected - ${freshness.reason}`);
      return res.status(503).json({
        success: false,
        error: 'Exchange rates temporarily unavailable. Please try again later.',
        reason: freshness.reason,
      });
    }

    const rate = await getRate(fromCurrency.toUpperCase(), toCurrency.toUpperCase());

    res.json({
      success: true,
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      rate,
      feePercentage: 2,
      feeNote: '2% FX fee applied for cross-currency conversions',
      fetchedAt: freshness.fetchedAt,
    });
  } catch (err) {
    logger.error(`${SERVICE_NAME}: Get rate failed`, err as Error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve exchange rate',
    });
  }
});

/**
 * @swagger
 * /api/fx/convert:
 *   post:
 *     summary: Convert amount from one currency to another
 *     tags: [FX]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, fromCurrency, toCurrency]
 *             properties:
 *               amount:
 *                 type: number
 *               fromCurrency:
 *                 type: string
 *               toCurrency:
 *                 type: string
 *     responses:
 *       200:
 *         description: Conversion successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 original:
 *                   type: object
 *                 converted:
 *                   type: object
 *                 fxRate:
 *                   type: number
 *                 fxFee:
 *                   type: number
 *                 totalDebit:
 *                   type: number
 *       400:
 *         description: Bad request
 *       503:
 *         description: Rates unavailable
 *       500:
 *         description: Server error
 */
router.post('/api/fx/convert', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        error: 'amount, fromCurrency, and toCurrency are required',
      });
    }

    // Validate currency codes
    if (!isValidCurrencyCode(fromCurrency)) {
      return res.status(400).json({
        success: false,
        error: `Invalid fromCurrency: '${fromCurrency}'. Must be a valid ISO 4217 currency code.`,
      });
    }

    if (!isValidCurrencyCode(toCurrency)) {
      return res.status(400).json({
        success: false,
        error: `Invalid toCurrency: '${toCurrency}'. Must be a valid ISO 4217 currency code.`,
      });
    }

    const numAmount = parseFloat(String(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount must be a positive number',
      });
    }

    // REJECT if rates are stale - don't use fallback
    const freshness = await areRatesFresh();
    if (!freshness.valid) {
      logger.error(`${SERVICE_NAME}: Conversion rejected - ${freshness.reason}`, {
        amount: numAmount,
        fromCurrency,
        toCurrency,
        userId: (req as any).user?.userId,
      });
      return res.status(503).json({
        success: false,
        error:
          'Currency conversion temporarily unavailable due to stale exchange rates. Please try again later.',
        reason: freshness.reason,
      });
    }

    const result = await convertAmountService(
      numAmount,
      fromCurrency.toUpperCase(),
      toCurrency.toUpperCase()
    );

    // Calculate 2% FX fee for cross-currency conversions
    const fxFee = fromCurrency.toUpperCase() !== toCurrency.toUpperCase() ? numAmount * 0.02 : 0;
    const totalDebit = numAmount + fxFee;
    const convertedAmount = result.converted;

    res.json({
      success: true,
      original: {
        amount: numAmount,
        currency: fromCurrency.toUpperCase(),
      },
      converted: {
        amount: convertedAmount,
        currency: toCurrency.toUpperCase(),
      },
      fxRate: result.fxRate,
      fxFee: Number(fxFee.toFixed(6)),
      totalDebit: Number(totalDebit.toFixed(6)),
      baseCurrency: result.baseCurrency,
      baseAmount: result.baseAmount,
      fetchedAt: result.fetchedAt,
      isStale: result.isStale,
      feePercentage: fromCurrency.toUpperCase() !== toCurrency.toUpperCase() ? 2 : 0,
    });
  } catch (err) {
    logger.error(`${SERVICE_NAME}: Convert failed`, err as Error);
    res.status(500).json({
      success: false,
      error: 'Currency conversion failed',
    });
  }
});

/**
 * @swagger
 * /api/fx/convert-with-fee:
 *   post:
 *     summary: Convert amount and calculate FX fee
 *     tags: [FX]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, fromCurrency, toCurrency]
 *             properties:
 *               amount:
 *                 type: number
 *               fromCurrency:
 *                 type: string
 *               toCurrency:
 *                 type: string
 *               applyFee:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Conversion successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 original:
 *                   type: object
 *                 converted:
 *                   type: object
 *                 breakdown:
 *                   type: object
 *                 rateInfo:
 *                   type: object
 *       400:
 *         description: Bad request
 *       503:
 *         description: Rates unavailable
 *       500:
 *         description: Server error
 */
router.post('/api/fx/convert-with-fee', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { amount, fromCurrency, toCurrency, applyFee } = req.body;

    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        success: false,
        error: 'amount, fromCurrency, and toCurrency are required',
      });
    }

    // Validate currency codes
    if (!isValidCurrencyCode(fromCurrency)) {
      return res.status(400).json({
        success: false,
        error: `Invalid fromCurrency: '${fromCurrency}'. Must be a valid ISO 4217 currency code.`,
      });
    }

    if (!isValidCurrencyCode(toCurrency)) {
      return res.status(400).json({
        success: false,
        error: `Invalid toCurrency: '${toCurrency}'. Must be a valid ISO 4217 currency code.`,
      });
    }

    const numAmount = parseFloat(String(amount));
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'amount must be a positive number',
      });
    }

    // REJECT if rates are stale - don't use fallback
    const freshness = await areRatesFresh();
    if (!freshness.valid) {
      logger.error(`${SERVICE_NAME}: Convert-with-fee rejected - ${freshness.reason}`, {
        amount: numAmount,
        fromCurrency,
        toCurrency,
        userId: (req as any).user?.userId,
      });
      return res.status(503).json({
        success: false,
        error:
          'Currency conversion temporarily unavailable due to stale exchange rates. Please try again later.',
        reason: freshness.reason,
      });
    }

    const result = await convertAmountService(
      numAmount,
      fromCurrency.toUpperCase(),
      toCurrency.toUpperCase()
    );

    // Calculate 2% FX fee only for cross-currency and if applyFee is true
    const shouldApplyFee =
      applyFee !== false && fromCurrency.toUpperCase() !== toCurrency.toUpperCase();
    const fxFee = shouldApplyFee ? numAmount * 0.02 : 0;
    const totalDebit = numAmount + fxFee;
    const convertedAmount = result.converted;

    res.json({
      success: true,
      original: {
        amount: numAmount,
        currency: fromCurrency.toUpperCase(),
      },
      converted: {
        amount: convertedAmount,
        currency: toCurrency.toUpperCase(),
      },
      breakdown: {
        baseAmount: numAmount,
        fxRate: result.fxRate,
        convertedAmount,
        fxFee: Number(fxFee.toFixed(6)),
        fxFeePercentage: shouldApplyFee ? 2 : 0,
        totalDebit: Number(totalDebit.toFixed(6)),
      },
      rateInfo: {
        baseCurrency: result.baseCurrency,
        baseAmount: result.baseAmount,
        fetchedAt: result.fetchedAt,
        isStale: result.isStale,
      },
    });
  } catch (err) {
    logger.error(`${SERVICE_NAME}: Convert with fee failed`, err as Error);
    res.status(500).json({
      success: false,
      error: 'Currency conversion failed',
    });
  }
});

export default router;
