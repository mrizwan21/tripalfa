// src/routes/transactionHistoryRoute.ts
// GET /api/wallet/transactions - Get transaction history with filters
// GET /api/wallet/transactions/export - Export transactions to CSV/Excel

import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { logger } from '../utils/logger.js';
import {
  getTransactionHistory,
  getTransactionSummary,
  exportTransactionsToCSV,
  exportTransactionsToExcel,
} from '../services/transactionHistoryService.js';

const router: ExpressRouter = Router();
const SERVICE_NAME = 'transactionHistoryRoute';

/**
 * @swagger
 * /api/wallet/transactions:
 *   get:
 *     summary: Get transaction history with filters
 *     tags: [Transaction History]
 *     parameters:
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: flow
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
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
 *                 transactions:
 *                   type: array
 *                 pagination:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/transactions', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Parse query parameters
    const {
      serviceType,
      type,
      flow,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      currency,
      supplierId,
      bookingRef,
      status,
      limit = '50',
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Build filters
    const filters: any = {
      userId,
      serviceType: serviceType as string,
      type: type as string,
      flow: flow as string,
      currency: currency as string,
      supplierId: supplierId as string,
      bookingRef: bookingRef as string,
      status: status as string,
    };

    // Parse dates
    if (startDate) {
      filters.startDate = new Date(startDate as string);
    }
    if (endDate) {
      filters.endDate = new Date(endDate as string);
    }

    // Parse amounts
    if (minAmount) {
      filters.minAmount = parseFloat(minAmount as string);
    }
    if (maxAmount) {
      filters.maxAmount = parseFloat(maxAmount as string);
    }

    const options = {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as 'createdAt' | 'amount' | 'balance',
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    logger.info(`${SERVICE_NAME}: Getting transaction history for user ${userId}`);

    const result = await getTransactionHistory(filters, options);

    res.json({
      success: true,
      transactions: result.transactions,
      pagination: {
        total: result.total,
        limit: options.limit,
        offset: options.offset,
      },
    });
  } catch (error) {
    logger.error(`${SERVICE_NAME}: Failed to get transaction history`, error);
    res.status(500).json({ success: false, error: 'Failed to get transaction history' });
  }
});

/**
 * @swagger
 * /api/wallet/transactions/summary:
 *   get:
 *     summary: Get transaction summary
 *     tags: [Transaction History]
 *     parameters:
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
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
 *                 summary:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get(
  '/transactions/summary',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const { serviceType, startDate, endDate } = req.query;

      const filters: any = {};
      if (serviceType) {
        filters.serviceType = serviceType as string;
      }
      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }
      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      logger.info(`${SERVICE_NAME}: Getting transaction summary for user ${userId}`);

      const summary = await getTransactionSummary(userId, filters);

      res.json({
        success: true,
        summary,
      });
    } catch (error) {
      logger.error(`${SERVICE_NAME}: Failed to get transaction summary`, error);
      res.status(500).json({ success: false, error: 'Failed to get transaction summary' });
    }
  }
);

/**
 * @swagger
 * /api/wallet/transactions/export:
 *   get:
 *     summary: Export transactions to CSV or Excel
 *     tags: [Transaction History]
 *     parameters:
 *       - in: query
 *         name: serviceType
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, excel]
 *     responses:
 *       200:
 *         description: File download
 *       500:
 *         description: Server error
 */
router.get(
  '/transactions/export',
  authMiddleware,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      // Parse query parameters
      const {
        serviceType,
        type,
        flow,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        currency,
        supplierId,
        bookingRef,
        status,
        format = 'csv', // 'csv' or 'excel'
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      // Build filters
      const filters: any = {
        userId,
        serviceType: serviceType as string,
        type: type as string,
        flow: flow as string,
        currency: currency as string,
        supplierId: supplierId as string,
        bookingRef: bookingRef as string,
        status: status as string,
      };

      // Parse dates
      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }
      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      // Parse amounts
      if (minAmount) {
        filters.minAmount = parseFloat(minAmount as string);
      }
      if (maxAmount) {
        filters.maxAmount = parseFloat(maxAmount as string);
      }

      const exportFormat = format as string;
      const fileName = `transactions_${new Date().toISOString().split('T')[0]}`;

      logger.info(`${SERVICE_NAME}: Exporting transactions for user ${userId} as ${exportFormat}`);

      if (exportFormat === 'excel') {
        const excelBuffer = await exportTransactionsToExcel(filters, {
          sortBy: sortBy as 'createdAt' | 'amount' | 'balance',
          sortOrder: sortOrder as 'asc' | 'desc',
        });

        res.setHeader('Content-Type', 'application/vnd.ms-excel');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.xls"`);
        res.send(excelBuffer);
      } else {
        // Default to CSV
        const csvContent = await exportTransactionsToCSV(filters, {
          sortBy: sortBy as 'createdAt' | 'amount' | 'balance',
          sortOrder: sortOrder as 'asc' | 'desc',
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}.csv"`);
        res.send(csvContent);
      }
    } catch (error) {
      logger.error(`${SERVICE_NAME}: Failed to export transactions`, error);
      res.status(500).json({ success: false, error: 'Failed to export transactions' });
    }
  }
);

export default router;
