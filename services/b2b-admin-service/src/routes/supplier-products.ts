import { Router, Response } from 'express';
import { prisma } from '../database.js';
import { AuthRequest, authMiddleware, requirePermission } from '../middleware/auth.js';
import { Prisma } from '@prisma/client';

const router: Router = Router();

// All supplier product routes require authentication
router.use(authMiddleware);

// ============================================
// SUPPLIER PRODUCTS (Inventory Management)
// ============================================

/**
 * @swagger
 * /api/suppliers/{supplierId}/products:
 *   get:
 *     summary: List all products for a supplier
 *     tags: [Supplier Products]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema: { type: string }
 *         description: Supplier ID
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: Filter by status
 *       - in: query
 *         name: productType
 *         schema: { type: string }
 *         description: Filter by product type
 *     responses:
 *       200:
 *         description: List of supplier products
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array }
 *                 pagination: { type: object }
 *       404:
 *         description: Supplier not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.get(
  '/:supplierId/products',
  requirePermission('suppliers:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { page = '1', limit = '10', status, productType } = req.query;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId as string } });
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      // Build filter
      const where: any = { supplierId };
      if (status) where.status = status;
      if (productType) where.productType = productType;

      // Get products with pagination
      const [products, total] = await Promise.all([
        prisma.supplierProduct.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.supplierProduct.count({ where }),
      ]);

      res.json({
        data: products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to list supplier products' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/products:
 *   post:
 *     summary: Add a new product for supplier
 *     tags: [Supplier Products]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema: { type: string }
 *         description: Supplier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [externalProductId, productType, name]
 *             properties:
 *               externalProductId: { type: string }
 *               productType: { type: string, enum: [flight, hotel, activity, car, other] }
 *               name: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               subCategory: { type: string }
 *     responses:
 *       201:
 *         description: Product created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: object }
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       404:
 *         description: Supplier not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.post(
  '/:supplierId/products',
  requirePermission('suppliers:create'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { externalProductId, productType, name, description, category, subCategory } = req.body;

      // Validation
      if (!externalProductId || !productType || !name) {
        res.status(400).json({
          error: 'Missing required fields: externalProductId, productType, name',
        });
        return;
      }

      const validProductTypes = ['flight', 'hotel', 'activity', 'car', 'other'];
      if (!validProductTypes.includes(productType)) {
        res.status(400).json({
          error: `Invalid productType. Must be one of: ${validProductTypes.join(', ')}`,
        });
        return;
      }

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId as string } });
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      // Check for duplicates
      const existing = await prisma.supplierProduct.findFirst({
        where: { supplierId: supplierId as string, externalProductId },
      });
      if (existing) {
        res.status(400).json({
          error: 'Product with this external ID already exists for this supplier',
        });
        return;
      }

      // Create product
      const product = await prisma.supplierProduct.create({
        data: {
          supplierId: supplierId as string,
          externalProductId,
          productType,
          name,
          description: description || null,
          category: category || null,
          subCategory: subCategory || null,
          status: 'active',
        },
      });

      res.status(201).json({
        message: 'Product added successfully',
        data: product,
      });
    } catch (error) {
      console.error('Error creating supplier product:', error);
      res.status(500).json({ error: 'Failed to create supplier product' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/products/{productId}:
 *   put:
 *     summary: Update supplier product
 *     tags: [Supplier Products]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema: { type: string }
 *         description: Supplier ID
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               category: { type: string }
 *               subCategory: { type: string }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Product updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { type: object }
 *       404:
 *         description: Supplier or product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.put(
  '/:supplierId/products/:productId',
  requirePermission('suppliers:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, productId } = req.params;
      const updateData = req.body;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId as string } });
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      // Verify product exists and belongs to supplier
      const product = await prisma.supplierProduct.findFirst({
        where: { id: productId as string, supplierId: supplierId as string },
      });
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      // Update product
      const updated = await prisma.supplierProduct.update({
        where: { id: productId as string },
        data: updateData,
      });

      res.json({
        message: 'Product updated successfully',
        data: updated,
      });
    } catch (error) {
      console.error('Error updating supplier product:', error);
      res.status(500).json({ error: 'Failed to update supplier product' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/products/{productId}:
 *   delete:
 *     summary: Remove supplier product
 *     tags: [Supplier Products]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema: { type: string }
 *         description: Supplier ID
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *         description: Product ID
 *     responses:
 *       204:
 *         description: Product deleted successfully
 *       400:
 *         description: Cannot delete product with active mappings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       404:
 *         description: Supplier or product not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.delete(
  '/:supplierId/products/:productId',
  requirePermission('suppliers:delete'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, productId } = req.params;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId as string } });
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      // Verify product exists and belongs to supplier
      const product = await prisma.supplierProduct.findFirst({
        where: { id: productId as string, supplierId: supplierId as string },
      });
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      // Check if product has active mappings
      const activeMappings = await prisma.supplierProductMapping.count({
        where: {
          supplierProductId: productId as string,
          status: 'active',
        },
      });

      if (activeMappings > 0) {
        res.status(400).json({
          error: 'Cannot delete product with active mappings. Deactivate mappings first.',
        });
        return;
      }

      // Delete product
      await prisma.supplierProduct.delete({ where: { id: productId as string } });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting supplier product:', error);
      res.status(500).json({ error: 'Failed to delete supplier product' });
    }
  }
);

export default router;
