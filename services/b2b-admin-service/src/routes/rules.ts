import { Router, Response } from "express";
import { prisma } from "../database.js";
import {
  AuthRequest,
  authMiddleware,
  requirePermission,
} from "../middleware/auth.js";
import {
  validateZod,
  paginationSchema,
  createMarkupRuleSchema,
  idParamSchema,
} from "../middleware/validate.js";
import { Prisma } from "@prisma/client";

const router: Router = Router();

// All rules routes require authentication
router.use(authMiddleware);

// TODO: Consider extracting field mappings to a configuration object to reduce duplication
// const FIELD_MAPPINGS = { markupValue: 'value', minMarkup: 'minValue', ... } as const;
// This would simplify validateFieldMigration, logDeprecatedFieldUsage, and serializeRule

/**
 * Helper to validate that request doesn't contain both old and new field names
 *
 * NOTE: This validation only checks top-level fields. Deprecated field names
 * nested within the `conditions` object are NOT validated. If you're migrating
 * field names inside conditions, ensure you handle them separately or document
 * the expected structure.
 *
 * Example of what IS detected:
 *   { markupValue: 10, value: 5 }  // Conflict at top level
 *
 * Example of what is NOT detected:
 *   { conditions: { markupValue: 10 }, value: 5 }  // No conflict detected
 */
const validateFieldMigration = (data: any): { valid: boolean; error?: string } => {
  const conflicts: string[] = [];

  // Check for conflicting field pairs
  if (data.markupValue !== undefined && data.value !== undefined) {
    conflicts.push("Cannot use both 'markupValue' and 'value'. Use 'value' (new field name).");
  }
  if (data.minMarkup !== undefined && data.minValue !== undefined) {
    conflicts.push("Cannot use both 'minMarkup' and 'minValue'. Use 'minValue' (new field name).");
  }
  if (data.maxMarkup !== undefined && data.maxValue !== undefined) {
    conflicts.push("Cannot use both 'maxMarkup' and 'maxValue'. Use 'maxValue' (new field name).");
  }
  if (data.markupType !== undefined && data.ruleType !== undefined) {
    conflicts.push("Cannot use both 'markupType' and 'ruleType'. Use 'ruleType' (new field name).");
  }
  if (data.applicableTo !== undefined && data.targetType !== undefined) {
    conflicts.push("Cannot use both 'applicableTo' and 'targetType'. Use 'targetType' (new field name).");
  }
  if (data.serviceTypes !== undefined && data.serviceType !== undefined) {
    conflicts.push("Cannot use both 'serviceTypes' and 'serviceType'. Use 'serviceType' (new field name).");
  }

  if (conflicts.length > 0) {
    return { valid: false, error: conflicts.join(" ") };
  }

  return { valid: true };
};

// Helper to log when deprecated fields are used (for migration tracking)
const logDeprecatedFieldUsage = (data: any, context: string): void => {
  const deprecatedFields: string[] = [];
  
  if (data.markupValue !== undefined) deprecatedFields.push("markupValue (use 'value')");
  if (data.minMarkup !== undefined) deprecatedFields.push("minMarkup (use 'minValue')");
  if (data.maxMarkup !== undefined) deprecatedFields.push("maxMarkup (use 'maxValue')");
  if (data.markupType !== undefined) deprecatedFields.push("markupType (use 'ruleType')");
  if (data.applicableTo !== undefined) deprecatedFields.push("applicableTo (use 'targetType')");
  if (data.serviceTypes !== undefined) deprecatedFields.push("serviceTypes (use 'serviceType')");
  
  if (deprecatedFields.length > 0) {
    console.warn(
      `[API Deprecation] ${context}: Using deprecated field(s): ${deprecatedFields.join(", ")}. ` +
      "Please migrate to new field names."
    );
  }
};

// Helper to serialize Decimal values with backward-compatible field aliases
const serializeRule = (rule: any) => ({
  ...rule,
  // New field names
  value: rule.value?.toNumber?.() ?? rule.value,
  minValue: rule.minValue?.toNumber?.() ?? rule.minValue,
  maxValue: rule.maxValue?.toNumber?.() ?? rule.maxValue,
  // Backward-compatible aliases for API consumers
  markupValue: rule.value?.toNumber?.() ?? rule.value,
  minMarkup: rule.minValue?.toNumber?.() ?? rule.minValue,
  maxMarkup: rule.maxValue?.toNumber?.() ?? rule.maxValue,
  markupType: rule.ruleType,
  applicableTo: rule.targetType,
  serviceTypes: rule.serviceType ? [rule.serviceType] : [],
});

// ============================================
// Markup Rules Routes
// ============================================

// GET /api/rules/markup - List all markup rules
router.get(
  "/markup",
  requirePermission("rules:read"),
  validateZod(paginationSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, sortBy, sortOrder, search } = req.query as any;
      const { isActive, companyId, serviceType } = req.query;

      const where: any = {};

      if (isActive !== undefined) {
        where.isActive = isActive === "true";
      }

      if (companyId) {
        where.companyId = companyId;
      }

      if (serviceType) {
        where.serviceType = serviceType;
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
          orderBy: sortBy ? { [sortBy]: sortOrder } : { priority: "desc" },
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
      console.error("Error fetching markup rules:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch markup rules",
      });
    }
  },
);

// GET /api/rules/markup/:id - Get markup rule by ID
router.get(
  "/markup/:id",
  requirePermission("rules:read"),
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
          error: "Markup rule not found",
        });
      }

      res.json({
        success: true,
        data: serializeRule(rule),
      });
    } catch (error) {
      console.error("Error fetching markup rule:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch markup rule",
      });
    }
  },
);

// POST /api/rules/markup - Create markup rule
/**
 * @api {post} /api/rules/markup Create Markup Rule
 * @apiName CreateMarkupRule
 * @apiGroup Rules
 * @apiPermission rules:create
 *
 * @apiBody {String} name Rule name
 * @apiBody {String} code Unique rule code
 * @apiBody {String} [companyId] Company ID (optional)
 * @apiBody {Number} [priority=0] Rule priority
 *
 * @apiBody (New Field Names) {String} ruleType Type of rule (percentage|fixed|tiered)
 * @apiBody (New Field Names) {String} targetType Target scope (global|company|branch|user)
 * @apiBody (New Field Names) {String} serviceType Service type (flight|hotel|car|transfer)
 * @apiBody (New Field Names) {Number} value Markup value
 * @apiBody (New Field Names) {Number} [minValue] Minimum markup value
 * @apiBody (New Field Names) {Number} [maxValue] Maximum markup value
 *
 * @apiBody (Deprecated Field Names) {String} [markupType] Use 'ruleType' instead
 * @apiBody (Deprecated Field Names) {String} [applicableTo] Use 'targetType' instead
 * @apiBody (Deprecated Field Names) {String[]} [serviceTypes] Use 'serviceType' instead
 * @apiBody (Deprecated Field Names) {Number} [markupValue] Use 'value' instead
 * @apiBody (Deprecated Field Names) {Number} [minMarkup] Use 'minValue' instead
 * @apiBody (Deprecated Field Names) {Number} [maxMarkup] Use 'maxValue' instead
 *
 * @apiDescription **Field Migration Notice:** This endpoint supports both old and new field names for backward compatibility.
 * If you provide both old and new field names in the same request, the validation will reject the request.
 * If you use only deprecated field names, they will be automatically mapped to the new field names.
 *
 * **Important:** When migrating, use EITHER all old fields OR all new fields. Do not mix them.
 *
 * **Field Precedence:** When both old and new fields are provided (though validation rejects this),
 * old field names take precedence. Example: if markupValue=10 and value=5, markupValue wins.
 *
 * **Migration Strategy:**
 * - Existing integrations: Continue using old field names (backward compatible)
 * - New integrations: Use new field names exclusively
 * - Migration: Replace all old fields with new ones in a single deployment
 * - Deprecation: Old fields will be removed in v3.0.0 (6 month migration period)
 *
 * @apiExample {json} Request-Example (New Fields):
 *     {
 *       "name": "Standard Flight Markup",
 *       "code": "FLIGHT_STD",
 *       "ruleType": "percentage",
 *       "targetType": "global",
 *       "serviceType": "flight",
 *       "value": 5.0
 *     }
 *
 * @apiExample {json} Request-Example (Deprecated Fields - Still Supported):
 *     {
 *       "name": "Standard Flight Markup",
 *       "code": "FLIGHT_STD",
 *       "markupType": "percentage",
 *       "applicableTo": "global",
 *       "serviceTypes": ["flight"],
 *       "markupValue": 5.0
 *     }
 */
router.post(
  "/markup",
  requirePermission("rules:create"),
  validateZod(createMarkupRuleSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body;

      // Validate that request doesn't contain both old and new field names
      const validation = validateFieldMigration(data);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
        });
      }

      // Log deprecated field usage for migration tracking
      logDeprecatedFieldUsage(data, "POST /api/rules/markup");

      /**
       * Backward-compatible field aliases for API input
       *
       * NOTE: Field precedence behavior (Important for API consumers)
       * - Old field names (markupValue, minMarkup, maxMarkup, etc.) take precedence over new field names
       * - This ensures existing API consumers using old field names continue to work without changes
       * - Migration validation above prevents mixed usage to ensure clean migration path
       * - Example: If markupValue=10 and value=5, markupValue wins (result: 10)
       *
       * MIGRATION RECOMMENDATION:
       * - For existing integrations: Continue using old field names (no changes needed)
       * - For new integrations: Use new field names exclusively
       * - To migrate: Replace all old field names with new ones in a single deployment
       * - NEVER mix old and new field names in the same request (will be rejected by validation)
       *
       * DEPRECATION TIMELINE:
       * - Old field names are deprecated and will be removed in v3.0.0
       * - Migration period: 6 months from release date
       */
      const inputData = {
        ...data,
        // Old field names take precedence for backward compatibility
        markupValue: data.markupValue ?? data.value,
        minMarkup: data.minMarkup ?? data.minValue,
        maxMarkup: data.maxMarkup ?? data.maxValue,
        markupType: data.markupType ?? data.ruleType,
        applicableTo: data.applicableTo ?? data.targetType,
        serviceTypes: data.serviceTypes ?? (data.serviceType ? [data.serviceType] : undefined),
      };

      // Check if code already exists
      const existingRule = await prisma.markupRule.findUnique({
        where: { code: data.code },
      });

      if (existingRule) {
        return res.status(400).json({
          success: false,
          error: "Markup rule with this code already exists",
        });
      }

      const rule = await prisma.markupRule.create({
        data: {
          companyId: inputData.companyId || null,
          name: inputData.name,
          code: inputData.code,
          priority: inputData.priority || 0,
          targetType: inputData.applicableTo || "global",
          serviceType: Array.isArray(inputData.serviceTypes) && inputData.serviceTypes.length > 0
            ? inputData.serviceTypes[0]
            : (typeof inputData.serviceTypes === "string" ? inputData.serviceTypes : null),
          ruleType: inputData.markupType || "percentage",
          value: new Prisma.Decimal(inputData.markupValue),
          minValue: inputData.minMarkup ? new Prisma.Decimal(inputData.minMarkup) : null,
          maxValue: inputData.maxMarkup ? new Prisma.Decimal(inputData.maxMarkup) : null,
          conditions: {
            applicableTo: inputData.applicableTo,
            supplierIds: inputData.supplierIds || [],
            branchIds: inputData.branchIds || [],
            userIds: inputData.userIds || [],
            ...inputData.conditions,
          },
          validFrom: inputData.validFrom ? new Date(inputData.validFrom) : null,
          validTo: inputData.validTo ? new Date(inputData.validTo) : null,
          metadata: inputData.metadata || null,
        },
      });

      res.status(201).json({
        success: true,
        data: serializeRule(rule),
        message: "Markup rule created successfully",
      });
    } catch (error) {
      console.error("Error creating markup rule:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create markup rule",
      });
    }
  },
);

// PUT /api/rules/markup/:id - Update markup rule
/**
 * @api {put} /api/rules/markup/:id Update Markup Rule
 * @apiName UpdateMarkupRule
 * @apiGroup Rules
 * @apiPermission rules:update
 *
 * @apiParam {String} id Rule ID
 *
 * @apiBody {String} [name] Rule name
 * @apiBody {Number} [priority] Rule priority
 *
 * @apiBody (New Field Names) {String} [ruleType] Type of rule (percentage|fixed|tiered)
 * @apiBody (New Field Names) {String} [targetType] Target scope (global|company|branch|user)
 * @apiBody (New Field Names) {String} [serviceType] Service type (flight|hotel|car|transfer)
 * @apiBody (New Field Names) {Number} [value] Markup value
 * @apiBody (New Field Names) {Number} [minValue] Minimum markup value
 * @apiBody (New Field Names) {Number} [maxValue] Maximum markup value
 *
 * @apiBody (Deprecated Field Names) {String} [markupType] Use 'ruleType' instead
 * @apiBody (Deprecated Field Names) {String} [applicableTo] Use 'targetType' instead
 * @apiBody (Deprecated Field Names) {String[]} [serviceTypes] Use 'serviceType' instead
 * @apiBody (Deprecated Field Names) {Number} [markupValue] Use 'value' instead
 * @apiBody (Deprecated Field Names) {Number} [minMarkup] Use 'minValue' instead
 * @apiBody (Deprecated Field Names) {Number} [maxMarkup] Use 'maxValue' instead
 *
 * @apiDescription **Field Migration Notice:** This endpoint supports both old and new field names for backward compatibility.
 * If you provide both old and new field names in the same request, the validation will reject the request.
 * If you use only deprecated field names, they will be automatically mapped to the new field names.
 *
 * **Important:** When migrating, use EITHER all old fields OR all new fields. Do not mix them.
 *
 * **Field Precedence:** When both old and new fields are provided (though validation rejects this),
 * old field names take precedence. Example: if markupValue=10 and value=5, markupValue wins.
 *
 * **Migration Strategy:**
 * - Existing integrations: Continue using old field names (backward compatible)
 * - New integrations: Use new field names exclusively
 * - Migration: Replace all old fields with new ones in a single deployment
 * - Deprecation: Old fields will be removed in v3.0.0 (6 month migration period)
 *
 * @apiExample {json} Request-Example (New Fields):
 *     {
 *       "name": "Updated Flight Markup",
 *       "ruleType": "percentage",
 *       "value": 7.5
 *     }
 *
 * @apiExample {json} Request-Example (Deprecated Fields - Still Supported):
 *     {
 *       "name": "Updated Flight Markup",
 *       "markupType": "percentage",
 *       "markupValue": 7.5
 *     }
 */
router.put(
  "/markup/:id",
  requirePermission("rules:update"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;

      // Validate that request doesn't contain both old and new field names
      const validation = validateFieldMigration(data);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
        });
      }

      // Log deprecated field usage for migration tracking
      logDeprecatedFieldUsage(data, `PUT /api/rules/markup/${id}`);

      /**
       * Backward-compatible field aliases for API input
       *
       * NOTE: Field precedence behavior (Important for API consumers)
       * - Old field names (markupValue, minMarkup, maxMarkup, etc.) take precedence over new field names
       * - This ensures existing API consumers using old field names continue to work without changes
       * - Migration validation above prevents mixed usage to ensure clean migration path
       * - Example: If markupValue=10 and value=5, markupValue wins (result: 10)
       *
       * MIGRATION RECOMMENDATION:
       * - For existing integrations: Continue using old field names (no changes needed)
       * - For new integrations: Use new field names exclusively
       * - To migrate: Replace all old field names with new ones in a single deployment
       * - NEVER mix old and new field names in the same request (will be rejected by validation)
       *
       * DEPRECATION TIMELINE:
       * - Old field names are deprecated and will be removed in v3.0.0
       * - Migration period: 6 months from release date
       */
      const inputData = {
        ...data,
        // Old field names take precedence for backward compatibility
        markupValue: data.markupValue ?? data.value,
        minMarkup: data.minMarkup ?? data.minValue,
        maxMarkup: data.maxMarkup ?? data.maxValue,
        markupType: data.markupType ?? data.ruleType,
        applicableTo: data.applicableTo ?? data.targetType,
        serviceTypes: data.serviceTypes ?? (data.serviceType ? [data.serviceType] : undefined),
      };

      const rule = await prisma.markupRule.findUnique({
        where: { id },
      });

      if (!rule) {
        return res.status(404).json({
          success: false,
          error: "Markup rule not found",
        });
      }

      const updateData: any = {};

      if (inputData.name) updateData.name = inputData.name;
      if (inputData.priority !== undefined) updateData.priority = inputData.priority;
      if (inputData.applicableTo) updateData.targetType = inputData.applicableTo;
      if (inputData.serviceTypes) {
        updateData.serviceType = Array.isArray(inputData.serviceTypes) && inputData.serviceTypes.length > 0
          ? inputData.serviceTypes[0]
          : (typeof inputData.serviceTypes === "string" ? inputData.serviceTypes : null);
      }
      if (inputData.markupType) updateData.ruleType = inputData.markupType;
      if (inputData.markupValue !== undefined)
        updateData.value = new Prisma.Decimal(inputData.markupValue);
      if (inputData.minMarkup !== undefined)
        updateData.minValue = inputData.minMarkup
          ? new Prisma.Decimal(inputData.minMarkup)
          : null;
      if (inputData.maxMarkup !== undefined)
        updateData.maxValue = inputData.maxMarkup
          ? new Prisma.Decimal(inputData.maxMarkup)
          : null;
      if (inputData.conditions !== undefined || inputData.supplierIds !== undefined || inputData.branchIds !== undefined || inputData.userIds !== undefined) {
        updateData.conditions = {
          ...inputData.conditions,
          supplierIds: inputData.supplierIds,
          branchIds: inputData.branchIds,
          userIds: inputData.userIds,
        };
      }
      if (inputData.isActive !== undefined) updateData.isActive = inputData.isActive;
      if (inputData.validFrom) updateData.validFrom = new Date(inputData.validFrom);
      if (inputData.validTo !== undefined)
        updateData.validTo = inputData.validTo ? new Date(inputData.validTo) : null;
      if (inputData.metadata !== undefined) updateData.metadata = inputData.metadata;

      const updatedRule = await prisma.markupRule.update({
        where: { id },
        data: updateData,
      });

      res.json({
        success: true,
        data: serializeRule(updatedRule),
        message: "Markup rule updated successfully",
      });
    } catch (error) {
      console.error("Error updating markup rule:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update markup rule",
      });
    }
  },
);

// DELETE /api/rules/markup/:id - Delete markup rule
router.delete(
  "/markup/:id",
  requirePermission("rules:delete"),
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
          error: "Markup rule not found",
        });
      }

      await prisma.markupRule.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Markup rule deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting markup rule:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete markup rule",
      });
    }
  },
);

// PUT /api/rules/markup/:id/toggle - Toggle markup rule active status
router.put(
  "/markup/:id/toggle",
  requirePermission("rules:update"),
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
          error: "Markup rule not found",
        });
      }

      const updatedRule = await prisma.markupRule.update({
        where: { id },
        data: { isActive: !rule.isActive },
      });

      res.json({
        success: true,
        data: serializeRule(updatedRule),
        message: `Markup rule ${updatedRule.isActive ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      console.error("Error toggling markup rule:", error);
      res.status(500).json({
        success: false,
        error: "Failed to toggle markup rule",
      });
    }
  },
);

// POST /api/rules/markup/:id/duplicate - Duplicate markup rule
router.post(
  "/markup/:id/duplicate",
  requirePermission("rules:create"),
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
          error: "Markup rule not found",
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
          targetType: rule.targetType || "global",
          serviceType: rule.serviceType,
          ruleType: rule.ruleType,
          value: rule.value,
          minValue: rule.minValue,
          maxValue: rule.maxValue,
          conditions: rule.conditions,
          isActive: false, // Start as inactive
          validFrom: new Date(),
          validTo: rule.validTo,
          metadata: rule.metadata,
        },
      });

      res.status(201).json({
        success: true,
        data: serializeRule(newRule),
        message: "Markup rule duplicated successfully",
      });
    } catch (error) {
      console.error("Error duplicating markup rule:", error);
      res.status(500).json({
        success: false,
        error: "Failed to duplicate markup rule",
      });
    }
  },
);

// ============================================
// Supplier Deals Routes
// ============================================

// GET /api/rules/deals - List all supplier deals
router.get(
  "/deals",
  requirePermission("rules:read"),
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
          orderBy: sortBy ? { [sortBy]: sortOrder } : { priority: "desc" },
          include: {
            dealMappingRules: {
              take: 5,
            },
          },
        }),
        prisma.supplierDeals.count({ where }),
      ]);

      res.json({
        success: true,
        data: deals.map((d) => ({
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
      console.error("Error fetching supplier deals:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch supplier deals",
      });
    }
  },
);

// GET /api/rules/deals/:id - Get deal by ID
router.get(
  "/deals/:id",
  requirePermission("rules:read"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const deal = await prisma.supplierDeals.findUnique({
        where: { id },
        include: {
          dealMappingRules: true,
        },
      });

      if (!deal) {
        return res.status(404).json({
          success: false,
          error: "Deal not found",
        });
      }

      res.json({
        success: true,
        data: {
          ...deal,
          discountValue: deal.discountValue?.toNumber?.() ?? deal.discountValue,
          maxDiscount: deal.maxDiscount?.toNumber?.() ?? deal.maxDiscount,
          minOrderAmount:
            deal.minOrderAmount?.toNumber?.() ?? deal.minOrderAmount,
        },
      });
    } catch (error) {
      console.error("Error fetching deal:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch deal",
      });
    }
  },
);

// POST /api/rules/deals - Create supplier deal
router.post(
  "/deals",
  requirePermission("rules:create"),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body;

      if (!data.name || !data.code || !data.productType || !data.dealType) {
        return res.status(400).json({
          success: false,
          error: "Name, code, productType, and dealType are required",
        });
      }

      // Check if code already exists
      const existingDeal = await prisma.supplierDeals.findUnique({
        where: { code: data.code },
      });

      if (existingDeal) {
        return res.status(400).json({
          success: false,
          error: "Deal with this code already exists",
        });
      }

      const deal = await prisma.supplierDeals.create({
        data: {
          supplierId: data.supplierId,
          name: data.name,
          code: data.code,
          productType: data.productType,
          dealType: data.dealType,
          status: data.status || "active",
          supplierCodes: data.supplierCodes || [],
          discountType: data.discountType,
          discountValue: new Prisma.Decimal(data.discountValue),
          maxDiscount: data.maxDiscount
            ? new Prisma.Decimal(data.maxDiscount)
            : null,
          minOrderAmount: data.minOrderAmount
            ? new Prisma.Decimal(data.minOrderAmount)
            : null,
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
          minOrderAmount:
            deal.minOrderAmount?.toNumber?.() ?? deal.minOrderAmount,
        },
        message: "Deal created successfully",
      });
    } catch (error) {
      console.error("Error creating deal:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create deal",
      });
    }
  },
);

// PUT /api/rules/deals/:id - Update deal
router.put(
  "/deals/:id",
  requirePermission("rules:update"),
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
          error: "Deal not found",
        });
      }

      const updateData: any = {};

      if (data.name) updateData.name = data.name;
      if (data.status) updateData.status = data.status;
      if (data.supplierCodes) updateData.supplierCodes = data.supplierCodes;
      if (data.discountType) updateData.discountType = data.discountType;
      if (data.discountValue !== undefined)
        updateData.discountValue = new Prisma.Decimal(data.discountValue);
      if (data.maxDiscount !== undefined)
        updateData.maxDiscount = data.maxDiscount
          ? new Prisma.Decimal(data.maxDiscount)
          : null;
      if (data.minOrderAmount !== undefined)
        updateData.minOrderAmount = data.minOrderAmount
          ? new Prisma.Decimal(data.minOrderAmount)
          : null;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.isCombinableWithCoupons !== undefined)
        updateData.isCombinableWithCoupons = data.isCombinableWithCoupons;
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
          discountValue:
            updatedDeal.discountValue?.toNumber?.() ??
            updatedDeal.discountValue,
          maxDiscount:
            updatedDeal.maxDiscount?.toNumber?.() ?? updatedDeal.maxDiscount,
          minOrderAmount:
            updatedDeal.minOrderAmount?.toNumber?.() ??
            updatedDeal.minOrderAmount,
        },
        message: "Deal updated successfully",
      });
    } catch (error) {
      console.error("Error updating deal:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update deal",
      });
    }
  },
);

// DELETE /api/rules/deals/:id - Delete deal
router.delete(
  "/deals/:id",
  requirePermission("rules:delete"),
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
          error: "Deal not found",
        });
      }

      await prisma.supplierDeals.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Deal deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting deal:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete deal",
      });
    }
  },
);

// ============================================
// Commission Settlements Routes
// ============================================

// GET /api/rules/commissions - List commission settlements
router.get(
  "/commissions",
  requirePermission("rules:read"),
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
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" },
        }),
        prisma.commissionSettlement.count({ where }),
      ]);

      res.json({
        success: true,
        data: commissions.map((c) => ({
          ...c,
          amount: c.amount?.toNumber?.() ?? c.amount,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching commissions:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch commissions",
      });
    }
  },
);

// PUT /api/rules/commissions/:id/settle - Settle commission
router.put(
  "/commissions/:id/settle",
  requirePermission("rules:update"),
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
          error: "Commission settlement not found",
        });
      }

      if (commission.settlementStatus === "settled") {
        return res.status(400).json({
          success: false,
          error: "Commission already settled",
        });
      }

      const updatedCommission = await prisma.commissionSettlement.update({
        where: { id },
        data: {
          settlementStatus: "settled",
          settledAt: new Date(),
          metadata: {
            settlementRef: settlementRef || null,
            notes: notes || null,
          },
        },
      });

      res.json({
        success: true,
        data: {
          ...updatedCommission,
          amount: updatedCommission.amount?.toNumber?.() ?? updatedCommission.amount,
        },
        message: "Commission settled successfully",
      });
    } catch (error) {
      console.error("Error settling commission:", error);
      res.status(500).json({
        success: false,
        error: "Failed to settle commission",
      });
    }
  },
);

export default router;
