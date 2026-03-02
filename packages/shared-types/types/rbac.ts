// ============================================================================
// TripAlfa Shared Types - RBAC Domain
// Role-Based Access Control with ABAC conditions
// ============================================================================

import { RoleType, RoleStatus } from "./enums";

// ============================================================================
// Role Types
// ============================================================================
export interface Role {
  id: string;
  companyId?: string;
  name: string;
  code: string;
  description?: string;
  type: RoleType;
  isSystem: boolean;
  level: number;
  status: RoleStatus;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RoleCreate {
  companyId?: string;
  name: string;
  code: string;
  description?: string;
  type?: RoleType;
  level?: number;
  metadata?: Record<string, unknown>;
}

export interface RoleUpdate {
  name?: string;
  description?: string;
  status?: RoleStatus;
  level?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Permission Types
// ============================================================================
export interface Permission {
  id: string;
  module: string;
  resource: string;
  action: string;
  code: string;
  name: string;
  description?: string;
  isSystem: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionCreate {
  module: string;
  resource: string;
  action: string;
  code: string;
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Role Permission Types (ABAC conditions)
// ============================================================================
export interface RolePermissionConditions {
  branchId?: "own" | "all" | string;
  maxAmount?: number;
  serviceTypes?: string[];
  requireApproval?: boolean;
  approvalLevel?: number;
  [key: string]: unknown;
}

export interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  conditions?: RolePermissionConditions;
  createdAt: string;
}

export interface RolePermissionAssign {
  roleId: string;
  permissionId: string;
  conditions?: RolePermissionConditions;
}

export interface RolePermissionBulkAssign {
  roleId: string;
  permissions: {
    permissionId: string;
    conditions?: RolePermissionConditions;
  }[];
}

// ============================================================================
// User Role Types
// ============================================================================
export interface UserRole {
  id: string;
  userId: string;
  roleId: string;
  branchId?: string;
  validFrom?: string;
  validTo?: string;
  assignedBy?: string;
  createdAt: string;
}

export interface UserRoleAssign {
  userId: string;
  roleId: string;
  branchId?: string;
  validFrom?: string;
  validTo?: string;
}

export interface UserRoleBulkAssign {
  userId: string;
  roles: {
    roleId: string;
    branchId?: string;
    validFrom?: string;
    validTo?: string;
  }[];
}

// ============================================================================
// Role with Relations
// ============================================================================
export interface RoleWithPermissions extends Role {
  permissions: {
    permission: Permission;
    conditions?: RolePermissionConditions;
  }[];
}

// ============================================================================
// Permission Check Types
// ============================================================================
export interface PermissionCheck {
  resource: string;
  action: string;
  context?: {
    branchId?: string;
    amount?: number;
    serviceType?: string;
    [key: string]: unknown;
  };
}

export interface PermissionCheckResult {
  allowed: boolean;
  conditions?: RolePermissionConditions;
  reason?: string;
}

// ============================================================================
// Predefined Permissions
// ============================================================================
export const PERMISSIONS = {
  // Company Management
  COMPANY_CREATE: "company:create",
  COMPANY_READ: "company:read",
  COMPANY_UPDATE: "company:update",
  COMPANY_DELETE: "company:delete",
  COMPANY_MANAGE_SETTINGS: "company:manage_settings",

  // Branch Management
  BRANCH_CREATE: "branch:create",
  BRANCH_READ: "branch:read",
  BRANCH_UPDATE: "branch:update",
  BRANCH_DELETE: "branch:delete",

  // User Management
  USER_CREATE: "user:create",
  USER_READ: "user:read",
  USER_UPDATE: "user:update",
  USER_DELETE: "user:delete",
  USER_ASSIGN_ROLES: "user:assign_roles",
  USER_RESET_PASSWORD: "user:reset_password",

  // Role Management
  ROLE_CREATE: "role:create",
  ROLE_READ: "role:read",
  ROLE_UPDATE: "role:update",
  ROLE_DELETE: "role:delete",
  ROLE_ASSIGN_PERMISSIONS: "role:assign_permissions",

  // Booking Management
  BOOKING_CREATE: "booking:create",
  BOOKING_READ: "booking:read",
  BOOKING_UPDATE: "booking:update",
  BOOKING_CANCEL: "booking:cancel",
  BOOKING_APPROVE: "booking:approve",
  BOOKING_TICKET: "booking:ticket",
  BOOKING_REFUND: "booking:refund",

  // Supplier Management
  SUPPLIER_CREATE: "supplier:create",
  SUPPLIER_READ: "supplier:read",
  SUPPLIER_UPDATE: "supplier:update",
  SUPPLIER_DELETE: "supplier:delete",
  SUPPLIER_MANAGE_CONTRACTS: "supplier:manage_contracts",

  // Payment Management
  PAYMENT_CREATE: "payment:create",
  PAYMENT_READ: "payment:read",
  PAYMENT_REFUND: "payment:refund",
  PAYMENT_MANAGE_GATEWAYS: "payment:manage_gateways",

  // Finance Management
  WALLET_READ: "wallet:read",
  WALLET_TOPUP: "wallet:topup",
  WALLET_WITHDRAW: "wallet:withdraw",
  LEDGER_READ: "ledger:read",

  // Pricing Management
  MARKUP_CREATE: "markup:create",
  MARKUP_READ: "markup:read",
  MARKUP_UPDATE: "markup:update",
  MARKUP_DELETE: "markup:delete",
  COMMISSION_CREATE: "commission:create",
  COMMISSION_READ: "commission:read",
  COMMISSION_UPDATE: "commission:update",
  COMMISSION_DELETE: "commission:delete",
  DISCOUNT_CREATE: "discount:create",
  DISCOUNT_READ: "discount:read",
  DISCOUNT_UPDATE: "discount:update",
  DISCOUNT_DELETE: "discount:delete",

  // Report Management
  REPORT_READ: "report:read",
  REPORT_CREATE: "report:create",
  REPORT_EXPORT: "report:export",
  REPORT_SCHEDULE: "report:schedule",

  // System Administration
  AUDIT_READ: "audit:read",
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE: "settings:update",
  API_MANAGE: "api:manage",
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ============================================================================
// Predefined Roles
// ============================================================================
export const SYSTEM_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  AGENT: "agent",
  ACCOUNTANT: "accountant",
  VIEWER: "viewer",
} as const;

export type SystemRole = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];
