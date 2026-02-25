import { Router, Response } from 'express';
import prisma from '../database.js';
import { AuthRequest, authMiddleware, requirePermission } from '../middleware/auth.js';
import { validateZod, paginationSchema, createMarkupRuleSchema, idParamSchema } from '../middleware/validate.js';
import { Prisma } from '@prisma/client';

const router: Router = Router();

// All rules routes require authentication
router.use(authMiddleware);

// Helper to serialize Decimal values
const serializeRule = (rule: any) => ({
    ...rule,
    markupValue: rule.markupValue?.toNumber?.() ?? rule.markupValue,
    minMarkup: rule.minMarkup?.toNumber?.() ?? rule.minMarkup,
    maxMarkup: rule.maxMarkup?.toNumber?.() ?? rule.maxMarkup,
});

// ============================================
// Markup Rules Routes
// ============================================

// GET /api/rules/markup - List all markup rules
router.get('/markup',
    requirePermission('rules:read'),
    validateZod(paginationSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { page, limit, sortBy, sortOrder, search } = req.query as any;
            const { isActive, companyId, serviceType } = req.query;

            const where: any = {};

            if (isActive !== undefined) {
                where.isActive = isActive === 'true';
            }

            if (companyId) {
                where.companyId = companyId;
            }

            if (serviceType) {
                where.serviceTypes = { has: serviceType };
            }

            if (search) {
                where.OR = [
                    { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                    { code: { contains: search, mode: Prisma.QueryMode.insensitive } },
                ];
            }

            const [rules, total] = await Promise.all([
                prisma.markupRule.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: sortBy ? { [sortBy]: sortOrder } : { priority: 'desc' },
                }),
                prisma.markupRule.count({ where }),
            ]);

            res.json({
                success: true,
                data: rules.map(serializeRule),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error('Error fetching markup rules:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch markup rules',
            });
        }
    }
);

// GET /api/rules/markup/:id - Get markup rule by ID
router.get('/markup/:id',
    requirePermission('rules:read'),
    validateZod(idParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;

            const rule = await prisma.markupRule.findUnique({
                where: { id },
            });

            if (!rule) {
                return res.status(404).json({
                    success: false,
                    error: 'Markup rule not found',
                });
            }

            res.json({
                success: true,
                data: serializeRule(rule),
            });
        } catch (error) {
            console.error('Error fetching markup rule:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch markup rule',
            });
        }
    }
);

// POST /api/rules/markup - Create markup rule
router.post('/markup',
    requirePermission('rules:create'),
    validateZod(createMarkupRuleSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const data = req.body;

            // Check if code already exists
            const existingRule = await prisma.markupRule.findUnique({
                where: { code: data.code },
            });

            if (existingRule) {
                return res.status(400).json({
                    success: false,
                    error: 'Markup rule with this code already exists',
                });
            }

            const rule = await prisma.markupRule.create({
                data: {
                    companyId: data.companyId || null,
                    name: data.name,
                    code: data.code,
                    priority: data.priority || 0,
                    applicableTo: data.applicableTo,
                    serviceTypes: data.serviceTypes,
                    markupType: data.markupType,
                    markupValue: new Prisma.Decimal(data.markupValue),
                    minMarkup: data.minMarkup ? new Prisma.Decimal(data.minMarkup) : null,
                    maxMarkup: data.maxMarkup ? new Prisma.Decimal(data.maxMarkup) : null,
                    conditions: data.conditions || null,
                    supplierIds: data.supplierIds || [],
                    branchIds: data.branchIds || [],
                    userIds: data.userIds || [],
                    validFrom: new Date(data.validFrom),
                    validTo: data.validTo ? new Date(data.validTo) : null,
                    metadata: data.metadata || null,
                },
            });

            res.status(201).json({
                success: true,
                data: serializeRule(rule),
                message: 'Markup rule created successfully',
            });
        } catch (error) {
            console.error('Error creating markup rule:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create markup rule',
            });
        }
    }
);

// PUT /api/rules/markup/:id - Update markup rule
router.put('/markup/:id',
    requirePermission('rules:update'),
    validateZod(idParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const data = req.body;

            const rule = await prisma.markupRule.findUnique({
                where: { id },
            });

            if (!rule) {
                return res.status(404).json({
                    success: false,
                    error: 'Markup rule not found',
                });
            }

            const updateData: any = {};

            if (data.name) updateData.name = data.name;
            if (data.priority !== undefined) updateData.priority = data.priority;
            if (data.applicableTo) updateData.applicableTo = data.applicableTo;
            if (data.serviceTypes) updateData.serviceTypes = data.serviceTypes;
            if (data.markupType) updateData.markupType = data.markupType;
            if (data.markupValue !== undefined) updateData.markupValue = new Prisma.Decimal(data.markupValue);
            if (data.minMarkup !== undefined) updateData.minMarkup = data.minMarkup ? new Prisma.Decimal(data.minMarkup) : null;
            if (data.maxMarkup !== undefined) updateData.maxMarkup = data.maxMarkup ? new Prisma.Decimal(data.maxMarkup) : null;
            if (data.conditions !== undefined) updateData.conditions = data.conditions;
            if (data.supplierIds) updateData.supplierIds = data.supplierIds;
            if (data.branchIds) updateData.branchIds = data.branchIds;
            if (data.userIds) updateData.userIds = data.userIds;
            if (data.isActive !== undefined) updateData.isActive = data.isActive;
            if (data.validFrom) updateData.validFrom = new Date(data.validFrom);
            if (data.validTo !== undefined) updateData.validTo = data.validTo ? new Date(data.validTo) : null;
            if (data.metadata !== undefined) updateData.metadata = data.metadata;

            const updatedRule = await prisma.markupRule.update({
                where: { id },
                data: updateData,
            });

            res.json({
                success: true,
                data: serializeRule(updatedRule),
                message: 'Markup rule updated successfully',
            });
        } catch (error) {
            console.error('Error updating markup rule:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update markup rule',
            });
        }
    }
);

// DELETE /api/rules/markup/:id - Delete markup rule
router.delete('/markup/:id',
    requirePermission('rules:delete'),
    validateZod(idParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;

            const rule = await prisma.markupRule.findUnique({
                where: { id },
            });

            if (!rule) {
                return res.status(404).json({
                    success: false,
                    error: 'Markup rule not found',
                });
            }

            await prisma.markupRule.delete({
                where: { id },
            });

            res.json({
                success: true,
                message: 'Markup rule deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting markup rule:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete markup rule',
            });
        }
    }
);

// PUT /api/rules/markup/:id/toggle - Toggle markup rule active status
router.put('/markup/:id/toggle',
    requirePermission('rules:update'),
    validateZod(idParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;

            const rule = await prisma.markupRule.findUnique({
                where: { id },
            });

            if (!rule) {
                return res.status(404).json({
                    success: false,
                    error: 'Markup rule not found',
                });
            }

            const updatedRule = await prisma.markupRule.update({
                where: { id },
                data: { isActive: !rule.isActive },
            });

            res.json({
                success: true,
                data: serializeRule(updatedRule),
                message: `Markup rule ${updatedRule.isActive ? 'activated' : 'deactivated'} successfully`,
            });
        } catch (error) {
            console.error('Error toggling markup rule:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to toggle markup rule',
            });
        }
    }
);

// POST /api/rules/markup/:id/duplicate - Duplicate markup rule
router.post('/markup/:id/duplicate',
    requirePermission('rules:create'),
    validateZod(idParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;

            const rule = await prisma.markupRule.findUnique({
                where: { id },
            });

            if (!rule) {
                return res.status(404).json({
                    success: false,
                    error: 'Markup rule not found',
                });
            }

            // Create duplicate with modified code
            const newCode = `${rule.code}-copy-${Date.now()}`;

            const newRule = await prisma.markupRule.create({
                data: {
                    companyId: rule.companyId,
                    name: `${rule.name} (Copy)`,
                    code: newCode,
                    priority: rule.priority,
                    applicableTo: [...rule.applicableTo],
                    serviceTypes: [...rule.serviceTypes],
                    markupType: rule.markupType,
                    markupValue: rule.markupValue,
                    minMarkup: rule.minMarkup,
                    maxMarkup: rule.maxMarkup,
                    conditions: rule.conditions,
                    supplierIds: [...rule.supplierIds],
                    branchIds: [...rule.branchIds],
                    userIds: [...rule.userIds],
                    isActive: false, // Start as inactive
                    validFrom: new Date(),
                    validTo: rule.validTo,
                    metadata: rule.metadata,
                },
            });

            res.status(201).json({
                success: true,
                data: serializeRule(newRule),
                message: 'Markup rule duplicated successfully',
            });
        } catch (error) {
            console.error('Error duplicating markup rule:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to duplicate markup rule',
            });
        }
    }
);

// ============================================
// Supplier Deals Routes
// ============================================

// GET /api/rules/deals - List all supplier deals
router.get('/deals',
    requirePermission('rules:read'),
    validateZod(paginationSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { page, limit, sortBy, sortOrder, search } = req.query as any;
            const { status, productType } = req.query;

            const where: any = {};

            if (status) {
                where.status = status;
            }

            if (productType) {
                where.productType = productType;
            }

            if (search) {
                where.OR = [
                    { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                    { code: { contains: search, mode: Prisma.QueryMode.insensitive } },
                ];
            }

            const [deals, total] = await Promise.all([
                prisma.supplierDeals.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: sortBy ? { [sortBy]: sortOrder } : { priority: 'desc' },
                    include: {
                        mappingRules: {
                            take: 5,
                        },
                    },
                }),
                prisma.supplierDeals.count({ where }),
            ]);

            res.json({
                success: true,
                data: deals.map(d => ({
                    ...d,
                    discountValue: d.discountValue?.toNumber?.() ?? d.discountValue,
                    maxDiscount: d.maxDiscount?.toNumber?.() ?? d.maxDiscount,
                    minOrderAmount: d.minOrderAmount?.toNumber?.() ?? d.minOrderAmount,
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error('Error fetching supplier deals:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch supplier deals',
            });
        }
    }
);

// GET /api/rules/deals/:id - Get deal by ID
router.get('/deals/:id',
    requirePermission('rules:read'),
    validateZod(idParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;

            const deal = await prisma.supplierDeals.findUnique({
                where: { id },
                include: {
                    mappingRules: true,
                    dealAnalyticsEvents: {
                        take: 100,
                        orderBy: { createdAt: 'desc' },
                    },
                },
            });

            if (!deal) {
                return res.status(404).json({
                    success: false,
                    error: 'Deal not found',
                });
            }

            res.json({
                success: true,
                data: {
                    ...deal,
                    discountValue: deal.discountValue?.toNumber?.() ?? deal.discountValue,
                    maxDiscount: deal.maxDiscount?.toNumber?.() ?? deal.maxDiscount,
                    minOrderAmount: deal.minOrderAmount?.toNumber?.() ?? deal.minOrderAmount,
                },
            });
        } catch (error) {
            console.error('Error fetching deal:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch deal',
            });
        }
    }
);

// POST /api/rules/deals - Create supplier deal
router.post('/deals',
    requirePermission('rules:create'),
    async (req: AuthRequest, res: Response) => {
        try {
            const data = req.body;

            if (!data.name || !data.code || !data.productType || !data.dealType) {
                return res.status(400).json({
                    success: false,
                    error: 'Name, code, productType, and dealType are required',
                });
            }

            // Check if code already exists
            const existingDeal = await prisma.supplierDeals.findUnique({
                where: { code: data.code },
            });

            if (existingDeal) {
                return res.status(400).json({
                    success: false,
                    error: 'Deal with this code already exists',
                });
            }

            const deal = await prisma.supplierDeals.create({
                data: {
                    name: data.name,
                    code: data.code,
                    productType: data.productType,
                    dealType: data.dealType,
                    status: data.status || 'active',
                    supplierCodes: data.supplierCodes || [],
                    discountType: data.discountType,
                    discountValue: new Prisma.Decimal(data.discountValue),
                    maxDiscount: data.maxDiscount ? new Prisma.Decimal(data.maxDiscount) : null,
                    minOrderAmount: data.minOrderAmount ? new Prisma.Decimal(data.minOrderAmount) : null,
                    priority: data.priority || 0,
                    isCombinableWithCoupons: data.isCombinableWithCoupons || false,
                    validFrom: new Date(data.validFrom),
                    validTo: new Date(data.validTo),
                    metadata: data.metadata || null,
                },
            });

            res.status(201).json({
                success: true,
                data: {
                    ...deal,
                    discountValue: deal.discountValue?.toNumber?.() ?? deal.discountValue,
                    maxDiscount: deal.maxDiscount?.toNumber?.() ?? deal.maxDiscount,
                    minOrderAmount: deal.minOrderAmount?.toNumber?.() ?? deal.minOrderAmount,
                },
                message: 'Deal created successfully',
            });
        } catch (error) {
            console.error('Error creating deal:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create deal',
            });
        }
    }
);

// PUT /api/rules/deals/:id - Update deal
router.put('/deals/:id',
    requirePermission('rules:update'),
    validateZod(idParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const data = req.body;

            const deal = await prisma.supplierDeals.findUnique({
                where: { id },
            });

            if (!deal) {
                return res.status(404).json({
                    success: false,
                    error: 'Deal not found',
                });
            }

            const updateData: any = {};

            if (data.name) updateData.name = data.name;
            if (data.status) updateData.status = data.status;
            if (data.supplierCodes) updateData.supplierCodes = data.supplierCodes;
            if (data.discountType) updateData.discountType = data.discountType;
            if (data.discountValue !== undefined) updateData.discountValue = new Prisma.Decimal(data.discountValue);
            if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount ? new Prisma.Decimal(data.maxDiscount) : null;
            if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount ? new Prisma.Decimal(data.minOrderAmount) : null;
            if (data.priority !== undefined) updateData.priority = data.priority;
            if (data.isCombinableWithCoupons !== undefined) updateData.isCombinableWithCoupons = data.isCombinableWithCoupons;
            if (data.validFrom) updateData.validFrom = new Date(data.validFrom);
            if (data.validTo) updateData.validTo = new Date(data.validTo);
            if (data.metadata !== undefined) updateData.metadata = data.metadata;

            const updatedDeal = await prisma.supplierDeals.update({
                where: { id },
                data: updateData,
            });

            res.json({
                success: true,
                data: {
                    ...updatedDeal,
                    discountValue: updatedDeal.discountValue?.toNumber?.() ?? updatedDeal.discountValue,
                    maxDiscount: updatedDeal.maxDiscount?.toNumber?.() ?? updatedDeal.maxDiscount,
                    minOrderAmount: updatedDeal.minOrderAmount?.toNumber?.() ?? updatedDeal.minOrderAmount,
                },
                message: 'Deal updated successfully',
            });
        } catch (error) {
            console.error('Error updating deal:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update deal',
            });
        }
    }
);

// DELETE /api/rules/deals/:id - Delete deal
router.delete('/deals/:id',
    requirePermission('rules:delete'),
    validateZod(idParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;

            const deal = await prisma.supplierDeals.findUnique({
                where: { id },
            });

            if (!deal) {
                return res.status(404).json({
                    success: false,
                    error: 'Deal not found',
                });
            }

            await prisma.supplierDeals.delete({
                where: { id },
            });

            res.json({
                success: true,
                message: 'Deal deleted successfully',
            });
        } catch (error) {
            console.error('Error deleting deal:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete deal',
            });
        }
    }
);

// ============================================
// Commission Settlements Routes
// ============================================

// GET /api/rules/commissions - List commission settlements
router.get('/commissions',
    requirePermission('rules:read'),
    validateZod(paginationSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { page, limit, sortBy, sortOrder } = req.query as any;
            const { status, supplierId } = req.query;

            const where: any = {};

            if (status) {
                where.status = status;
            }

            if (supplierId) {
                where.supplierId = supplierId;
            }

            const [commissions, total] = await Promise.all([
                prisma.commissionSettlement.findMany({
                    where,
                    skip: (page - 1) * limit,
                    take: limit,
                    orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
                }),
                prisma.commissionSettlement.count({ where }),
            ]);

            res.json({
                success: true,
                data: commissions.map(c => ({
                    ...c,
                    baseAmount: c.baseAmount?.toNumber?.() ?? c.baseAmount,
                    bookingAmount: c.bookingAmount?.toNumber?.() ?? c.bookingAmount,
                    commissionAmount: c.commissionAmount?.toNumber?.() ?? c.commissionAmount,
                    settledAmount: c.settledAmount?.toNumber?.() ?? c.settledAmount,
                })),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            console.error('Error fetching commissions:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch commissions',
            });
        }
    }
);

// PUT /api/rules/commissions/:id/settle - Settle commission
router.put('/commissions/:id/settle',
    requirePermission('rules:update'),
    validateZod(idParamSchema),
    async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { settledAmount, settlementRef, notes } = req.body;

            const commission = await prisma.commissionSettlement.findUnique({
                where: { id },
            });

            if (!commission) {
                return res.status(404).json({
                    success: false,
                    error: 'Commission settlement not found',
                });
            }

            if (commission.status === 'settled') {
                return res.status(400).json({
                    success: false,
                    error: 'Commission already settled',
                });
            }

            const updatedCommission = await prisma.commissionSettlement.update({
                where: { id },
                data: {
                    status: 'settled',
                    settledAmount: settledAmount ? new Prisma.Decimal(settledAmount) : commission.commissionAmount,
                    settlementRef: settlementRef || null,
                    notes: notes || null,
                    settledAt: new Date(),
                },
            });

            res.json({
                success: true,
                data: {
                    ...updatedCommission,
                    baseAmount: updatedCommission.baseAmount?.toNumber?.() ?? updatedCommission.baseAmount,
                    bookingAmount: updatedCommission.bookingAmount?.toNumber?.() ?? updatedCommission.bookingAmount,
                    commissionAmount: updatedCommission.commissionAmount?.toNumber?.() ?? updatedCommission.commissionAmount,
                    settledAmount: updatedCommission.settledAmount?.toNumber?.() ?? updatedCommission.settledAmount,
                },
                message: 'Commission settled successfully',
            });
        } catch (error) {
            console.error('Error settling commission:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to settle commission',
            });
        }
    }
);

export default router;
