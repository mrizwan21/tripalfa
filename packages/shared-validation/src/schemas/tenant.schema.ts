import { z } from 'zod';

// Tenant type enum
export const TenantType = z.enum(['MASTER_AGENCY', 'SUB_AGENT', 'INDIVIDUAL_AGENT', 'CORPORATE']);
export type TenantType = z.infer<typeof TenantType>;

// Tenant status enum
export const TenantStatus = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']);
export type TenantStatus = z.infer<typeof TenantStatus>;

// Create tenant schema
export const CreateTenantSchema = z.object({
  name: z.string()
    .min(1, 'Tenant name is required')
    .max(100, 'Tenant name must be less than 100 characters'),
  
  agentCode: z.string()
    .min(3, 'Agent code must be at least 3 characters')
    .max(10, 'Agent code must be less than 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Agent code must contain only uppercase letters and numbers'),
  
  type: TenantType.default('MASTER_AGENCY'),
  
  parentId: z.string()
    .cuid('Invalid parent tenant ID')
    .optional()
    .nullable(),
  
  databaseUrl: z.string()
    .url('Invalid database URL')
    .optional()
    .nullable(),
  
  config: z.record(z.any())
    .optional()
    .default({}),
  
  status: TenantStatus.default('PENDING'),
});

export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;

// Update tenant schema (partial create schema)
export const UpdateTenantSchema = CreateTenantSchema.partial().extend({
  id: z.string().cuid('Invalid tenant ID'),
});

export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;

// Tenant query schema
export const TenantQuerySchema = z.object({
  page: z.coerce.number()
    .int()
    .min(1, 'Page must be at least 1')
    .default(1),
  
  limit: z.coerce.number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(20),
  
  search: z.string()
    .optional(),
  
  type: TenantType
    .optional(),
  
  status: TenantStatus
    .optional(),
  
  parentId: z.string()
    .cuid('Invalid parent tenant ID')
    .optional()
    .nullable(),
});

export type TenantQueryInput = z.infer<typeof TenantQuerySchema>;

// Tenant metrics query schema
export const TenantMetricsQuerySchema = z.object({
  tenantId: z.string().cuid('Invalid tenant ID'),
  
  startDate: z.string()
    .datetime('Invalid start date')
    .optional(),
  
  endDate: z.string()
    .datetime('Invalid end date')
    .optional(),
  
  period: z.enum(['day', 'week', 'month', 'quarter', 'year'])
    .default('month'),
  
  metrics: z.array(z.enum([
    'revenue',
    'bookings',
    'users',
    'conversion_rate',
    'growth',
    'active_users'
  ]))
  .min(1, 'At least one metric must be selected')
  .default(['revenue', 'bookings']),
});

export type TenantMetricsQueryInput = z.infer<typeof TenantMetricsQuerySchema>;

// Validation functions
export const validateCreateTenant = (input: unknown) => {
  return CreateTenantSchema.safeParse(input);
};

export const validateUpdateTenant = (input: unknown) => {
  return UpdateTenantSchema.safeParse(input);
};

export const validateTenantQuery = (input: unknown) => {
  return TenantQuerySchema.safeParse(input);
};

export const validateTenantMetricsQuery = (input: unknown) => {
  return TenantMetricsQuerySchema.safeParse(input);
};