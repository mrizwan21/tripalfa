import { Router, Response } from 'express';
import { prisma } from '../database.js';
import { AuthRequest, authMiddleware, requirePermission } from '../middleware/auth.js';

const router: Router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/suppliers/{supplierId}/financial:
 *   get:
 *     summary: Get supplier financial profile
 *     tags: [Supplier Financial]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *         description: The supplier ID
 *     responses:
 *       200:
 *         description: Financial profile retrieved successfully
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
 *         description: Supplier or financial profile not found
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
 *         description: Server error
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
router.get(
  '/:supplierId/financial',
  requirePermission('suppliers:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      const financial = await prisma.supplierFinancial.findUnique({
        where: { supplierId: supplierId as string },
      });

      if (!financial) {
        res.status(404).json({ error: 'Financial profile not found. Create one first.' });
        return;
      }

      res.json({ data: financial });
    } catch (error) {
      console.error('Error fetching financial profile:', error);
      res.status(500).json({ error: 'Failed to fetch financial profile' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/financial:
 *   put:
 *     summary: Create or update supplier financial profile
 *     tags: [Supplier Financial]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *         description: The supplier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentTerms:
 *                 type: string
 *               settlementCycle:
 *                 type: string
 *               commissionStructure:
 *                 type: object
 *               minimumPayoutAmount:
 *                 type: number
 *               bankAccountName:
 *                 type: string
 *               bankAccountNumber:
 *                 type: string
 *               bankCode:
 *                 type: string
 *               swiftCode:
 *                 type: string
 *               accountHolderName:
 *                 type: string
 *               country:
 *                 type: string
 *               currency:
 *                 type: string
 *               taxId:
 *                 type: string
 *               paymentHolds:
 *                 type: boolean
 *               holdReason:
 *                 type: string
 *               holdExpiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Financial profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       201:
 *         description: Financial profile created successfully
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
 *         description: Supplier not found
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
 *         description: Server error
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
router.put(
  '/:supplierId/financial',
  requirePermission('suppliers:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const updateData = req.body;

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      const existingProfile = await prisma.supplierFinancial.findUnique({
        where: { supplierId: supplierId as string },
      });

      let financial;

      if (existingProfile) {
        financial = await prisma.supplierFinancial.update({
          where: { supplierId: supplierId as string },
          data: updateData,
        });
        res.json({
          message: 'Financial profile updated successfully',
          data: financial,
        });
      } else {
        financial = await prisma.supplierFinancial.create({
          data: {
            supplierId: supplierId as string,
            paymentTerms: updateData.paymentTerms || '30_days',
            settlementCycle: updateData.settlementCycle || 'monthly',
            commissionStructure: updateData.commissionStructure,
            minimumPayoutAmount: updateData.minimumPayoutAmount,
            bankAccountName: updateData.bankAccountName,
            bankAccountNumber: updateData.bankAccountNumber,
            bankCode: updateData.bankCode,
            swiftCode: updateData.swiftCode,
            accountHolderName: updateData.accountHolderName,
            country: updateData.country,
            currency: updateData.currency || 'USD',
            taxId: updateData.taxId,
            paymentHolds: updateData.paymentHolds || false,
            holdReason: updateData.holdReason,
            holdExpiresAt: updateData.holdExpiresAt,
          },
        });
        res.status(201).json({
          message: 'Financial profile created successfully',
          data: financial,
        });
      }
    } catch (error) {
      console.error('Error managing financial profile:', error);
      res.status(500).json({ error: 'Failed to manage financial profile' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/payment-terms:
 *   get:
 *     summary: List payment terms for supplier
 *     tags: [Supplier Financial]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *         description: The supplier ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           default: "1"
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "10"
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Payment terms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 pagination:
 *                   type: object
 *       404:
 *         description: Supplier not found
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
 *         description: Server error
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
router.get(
  '/:supplierId/payment-terms',
  requirePermission('suppliers:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { page = '1', limit = '10' } = req.query;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      const [terms, total] = await Promise.all([
        prisma.supplierPaymentTerm.findMany({
          where: { supplierId: supplierId as string },
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.supplierPaymentTerm.count({
          where: { supplierId: supplierId as string },
        }),
      ]);

      res.json({
        data: terms,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Error fetching payment terms:', error);
      res.status(500).json({ error: 'Failed to fetch payment terms' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/payment-terms:
 *   post:
 *     summary: Add payment term
 *     tags: [Supplier Financial]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *         description: The supplier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - termType
 *             properties:
 *               termType:
 *                 type: string
 *               daysFromBooking:
 *                 type: integer
 *               percentageRequired:
 *                 type: number
 *               minimumAmount:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment term added successfully
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
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       404:
 *         description: Supplier not found
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
 *         description: Server error
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
router.post(
  '/:supplierId/payment-terms',
  requirePermission('suppliers:create'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { termType, daysFromBooking, percentageRequired, minimumAmount, description } =
        req.body;

      if (!termType) {
        res.status(400).json({ error: 'termType is required' });
        return;
      }

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      const term = await prisma.supplierPaymentTerm.create({
        data: {
          supplierId: supplierId as string,
          termType,
          daysFromBooking: daysFromBooking || 0,
          percentageRequired,
          minimumAmount,
          description,
        },
      });

      res.status(201).json({
        message: 'Payment term added successfully',
        data: term,
      });
    } catch (error) {
      console.error('Error creating payment term:', error);
      res.status(500).json({ error: 'Failed to create payment term' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/payment-terms/{termId}:
 *   put:
 *     summary: Update payment term
 *     tags: [Supplier Financial]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *         description: The supplier ID
 *       - in: path
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *         description: The payment term ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Payment term updated successfully
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
 *         description: Supplier or payment term not found
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
 *         description: Server error
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
router.put(
  '/:supplierId/payment-terms/:termId',
  requirePermission('suppliers:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, termId } = req.params;
      const updateData = req.body;

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      const term = await prisma.supplierPaymentTerm.findFirst({
        where: { id: termId as string, supplierId: supplierId as string },
      });
      if (!term) {
        res.status(404).json({ error: 'Payment term not found' });
        return;
      }

      const updated = await prisma.supplierPaymentTerm.update({
        where: { id: termId as string },
        data: updateData,
      });

      res.json({
        message: 'Payment term updated successfully',
        data: updated,
      });
    } catch (error) {
      console.error('Error updating payment term:', error);
      res.status(500).json({ error: 'Failed to update payment term' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/payment-terms/{termId}:
 *   delete:
 *     summary: Remove payment term
 *     tags: [Supplier Financial]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *         description: The supplier ID
 *       - in: path
 *         name: termId
 *         required: true
 *         schema:
 *           type: string
 *         description: The payment term ID
 *     responses:
 *       204:
 *         description: Payment term deleted successfully
 *       404:
 *         description: Supplier or payment term not found
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
 *         description: Server error
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
router.delete(
  '/:supplierId/payment-terms/:termId',
  requirePermission('suppliers:delete'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, termId } = req.params;

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      const term = await prisma.supplierPaymentTerm.findFirst({
        where: { id: termId as string, supplierId: supplierId as string },
      });
      if (!term) {
        res.status(404).json({ error: 'Payment term not found' });
        return;
      }

      await prisma.supplierPaymentTerm.delete({ where: { id: termId as string } });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting payment term:', error);
      res.status(500).json({ error: 'Failed to delete payment term' });
    }
  }
);

export default router;
