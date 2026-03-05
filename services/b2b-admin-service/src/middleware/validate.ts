import { RequestHandler } from "express";
import { validationResult, ValidationChain } from "express-validator";
import { z } from "zod";

// Validation result handler
export const validate: RequestHandler = (req, res, next): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.type === "field" ? (err as any).path : undefined,
        message: err.msg,
      })),
    });
    return;
  }

  next();
};

// Zod validation middleware factory
export const validateZod: (schema: z.ZodSchema) => RequestHandler = (
  schema: z.ZodSchema,
) => {
  const handler: RequestHandler = async (req, res, next): Promise<void> => {
    try {
      // Parse the request data (using parseAsync to support async refinements/transforms)
      const data = {
        body: req.body,
        query: req.query,
        params: req.params,
      };

      await schema.parseAsync(data);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          errors: error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        });
        return;
      }
      next(error);
    }
  };

  return handler;
};

// Common validation schemas
export const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    search: z.string().optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, "ID is required"),
  }),
});

// Company validation schemas
export const createCompanySchema = z.object({
  body: z.object({
    name: z.string().min(1, "Company name is required").max(255),
    slug: z.string().optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    businessType: z.string().optional(),
    registrationNumber: z.string().optional(),
    taxId: z.string().optional(),
    subscriptionPlan: z.string().optional().default("free"),
    metadata: z.record(z.any()).optional(),
  }),
});

export const updateCompanySchema = z.object({
  params: z.object({
    id: z.string().min(1, "Company ID is required"),
  }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    slug: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    businessType: z.string().optional(),
    registrationNumber: z.string().optional(),
    taxId: z.string().optional(),
    status: z.enum(["active", "inactive", "suspended"]).optional(),
    subscriptionPlan: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

// User validation schemas
export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    firstName: z.string().min(1, "First name is required").optional(),
    lastName: z.string().min(1, "Last name is required").optional(),
    phoneNumber: z.string().optional(),
    roleId: z.string().optional(),
    companyId: z.string().optional(),
    status: z
      .enum(["active", "inactive", "pending"])
      .optional()
      .default("pending"),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
  body: z.object({
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phoneNumber: z.string().optional(),
    roleId: z.string().optional(),
    companyId: z.string().optional(),
    status: z.enum(["active", "inactive", "pending"]).optional(),
    avatarUrl: z.string().url().optional().or(z.literal("")),
  }),
});

// Booking validation schemas
export const bookingFilterSchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: z.string().optional(),
    type: z.string().optional(),
    search: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
    companyId: z.string().optional(),
    userId: z.string().optional(),
    sortBy: z.string().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
  }),
});

// Supplier validation schemas
export const createSupplierSchema = z.object({
  body: z.object({
    code: z.string().min(1, "Supplier code is required"),
    name: z.string().min(1, "Supplier name is required"),
    type: z.enum(["hotel", "flight", "transfer", "activity", "insurance"]),
    apiBaseUrl: z.string().url().optional().or(z.literal("")),
    apiKey: z.string().optional(),
    apiSecret: z.string().optional(),
    apiCredentials: z.record(z.any()).optional(),
    rateLimitPerMin: z.number().int().positive().optional(),
    rateLimitPerDay: z.number().int().positive().optional(),
    features: z.record(z.any()).optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

// Markup rule validation schemas
export const createMarkupRuleSchema = z.object({
  body: z.object({
    companyId: z.string().optional(),
    name: z.string().min(1, "Rule name is required"),
    code: z.string().min(1, "Rule code is required"),
    priority: z.number().int().optional().default(0),
    applicableTo: z
      .array(z.string())
      .min(1, "At least one applicable target is required"),
    serviceTypes: z
      .array(z.string())
      .min(1, "At least one service type is required"),
    markupType: z.enum(["percentage", "fixed", "tiered"]),
    markupValue: z.number().positive("Markup value must be positive"),
    minMarkup: z.number().optional(),
    maxMarkup: z.number().optional(),
    conditions: z.record(z.any()).optional(),
    supplierIds: z.array(z.string()).optional(),
    branchIds: z.array(z.string()).optional(),
    userIds: z.array(z.string()).optional(),
    validFrom: z.string().or(z.date()),
    validTo: z.string().or(z.date()).optional().nullable(),
    metadata: z.record(z.any()).optional(),
  }),
});

// Wallet validation schemas
export const walletTransactionSchema = z.object({
  body: z.object({
    walletId: z.string().min(1, "Wallet ID is required"),
    type: z.enum([
      "deposit",
      "withdrawal",
      "purchase",
      "refund",
      "transfer",
      "commission",
      "settlement",
    ]),
    amount: z.number().positive("Amount must be positive"),
    currency: z.string().length(3, "Currency must be 3 characters"),
    payerId: z.string().optional(),
    payeeId: z.string().optional(),
    bookingId: z.string().optional(),
    invoiceId: z.string().optional(),
    description: z.string().optional(),
    idempotencyKey: z.string().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});
