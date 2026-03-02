import { Router, Response } from "express";
import { prisma } from "../database.js";
import {
  AuthRequest,
  authMiddleware,
  requirePermission,
} from "../middleware/auth.js";
import { Prisma } from "@prisma/client";

const router: Router = Router();

// All supplier product routes require authentication
router.use(authMiddleware);

// ============================================
// SUPPLIER PRODUCTS (Inventory Management)
// ============================================

/**
 * GET /api/suppliers/:supplierId/products
 * List all products for a supplier with pagination
 */
router.get(
  "/:supplierId/products",
  requirePermission("suppliers:read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { page = "1", limit = "10", status, productType } = req.query;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId as string } });
      if (!supplier) {
        res.status(404).json({ error: "Supplier not found" });
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
          orderBy: { createdAt: "desc" },
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
      res.status(500).json({ error: "Failed to list supplier products" });
    }
  }
);

/**
 * POST /api/suppliers/:supplierId/products
 * Add a new product for supplier
 */
router.post(
  "/:supplierId/products",
  requirePermission("suppliers:create"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { externalProductId, productType, name, description, category, subCategory } = req.body;

      // Validation
      if (!externalProductId || !productType || !name) {
        res.status(400).json({
          error: "Missing required fields: externalProductId, productType, name",
        });
        return;
      }

      const validProductTypes = ["flight", "hotel", "activity", "car", "other"];
      if (!validProductTypes.includes(productType)) {
        res.status(400).json({
          error: `Invalid productType. Must be one of: ${validProductTypes.join(", ")}`,
        });
        return;
      }

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId as string } });
      if (!supplier) {
        res.status(404).json({ error: "Supplier not found" });
        return;
      }

      // Check for duplicates
      const existing = await prisma.supplierProduct.findFirst({
        where: { supplierId: supplierId as string, externalProductId },
      });
      if (existing) {
        res.status(400).json({
          error: "Product with this external ID already exists for this supplier",
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
          status: "active",
        },
      });

      res.status(201).json({
        message: "Product added successfully",
        data: product,
      });
    } catch (error) {
      console.error("Error creating supplier product:", error);
      res.status(500).json({ error: "Failed to create supplier product" });
    }
  }
);

/**
 * PUT /api/suppliers/:supplierId/products/:productId
 * Update supplier product
 */
router.put(
  "/:supplierId/products/:productId",
  requirePermission("suppliers:update"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, productId } = req.params;
      const updateData = req.body;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId as string } });
      if (!supplier) {
        res.status(404).json({ error: "Supplier not found" });
        return;
      }

      // Verify product exists and belongs to supplier
      const product = await prisma.supplierProduct.findFirst({
        where: { id: productId as string, supplierId: supplierId as string },
      });
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      // Update product
      const updated = await prisma.supplierProduct.update({
        where: { id: productId as string },
        data: updateData,
      });

      res.json({
        message: "Product updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Error updating supplier product:", error);
      res.status(500).json({ error: "Failed to update supplier product" });
    }
  }
);

/**
 * DELETE /api/suppliers/:supplierId/products/:productId
 * Remove supplier product
 */
router.delete(
  "/:supplierId/products/:productId",
  requirePermission("suppliers:delete"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, productId } = req.params;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId as string } });
      if (!supplier) {
        res.status(404).json({ error: "Supplier not found" });
        return;
      }

      // Verify product exists and belongs to supplier
      const product = await prisma.supplierProduct.findFirst({
        where: { id: productId as string, supplierId: supplierId as string },
      });
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      // Check if product has active mappings
      const activeMappings = await prisma.supplierProductMapping.count({
        where: {
          supplierProductId: productId as string,
          status: "active",
        },
      });

      if (activeMappings > 0) {
        res.status(400).json({
          error: "Cannot delete product with active mappings. Deactivate mappings first.",
        });
        return;
      }

      // Delete product
      await prisma.supplierProduct.delete({ where: { id: productId as string } });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting supplier product:", error);
      res.status(500).json({ error: "Failed to delete supplier product" });
    }
  }
);

export default router;
