// Frontend permission types aligned with the backend/server schema

export enum PermissionCategory {
  COMPANY = "company",
  DEPARTMENT = "department",
  DESIGNATION = "designation",
  COST_CENTER = "cost_center",
  KYC = "kyc",
  VIRTUAL_CARD = "virtual_card",
}

// Detailed permission codes (parity with server)
export enum CompanyPermission {
  VIEW_COMPANIES = "company:companies:view",
  CREATE_COMPANIES = "company:companies:create",
  UPDATE_COMPANIES = "company:companies:update",
  DELETE_COMPANIES = "company:companies:delete",
  MANAGE_COMPANY_SETTINGS = "company:companies:settings",
  VIEW_DEPARTMENTS = "company:departments:view",
  CREATE_DEPARTMENTS = "company:departments:create",
  UPDATE_DEPARTMENTS = "company:departments:update",
  DELETE_DEPARTMENTS = "company:departments:delete",
  VIEW_DESIGNATIONS = "company:designations:view",
  CREATE_DESIGNATIONS = "company:designations:create",
  UPDATE_DESIGNATIONS = "company:designations:update",
  DELETE_DESIGNATIONS = "company:designations:delete",
  VIEW_COST_CENTERS = "company:cost_centers:view",
  CREATE_COST_CENTERS = "company:cost_centers:create",
  UPDATE_COST_CENTERS = "company:cost_centers:update",
  DELETE_COST_CENTERS = "company:cost_centers:delete",
  MANAGE_HIERARCHY = "company:hierarchy:manage",
  VIEW_HIERARCHY = "company:hierarchy:view",
  VIEW_COMPANY_REPORTS = "company:reports:view",
  EXPORT_COMPANY_DATA = "company:export",
  MANAGE_COMPANY_CONFIG = "company:config:manage",
  VIEW_COMPANY_CONFIG = "company:config:view",
}

export enum KYCPermission {
  VIEW_DOCUMENTS = "company:kyc:documents:view",
  CREATE_DOCUMENTS = "company:kyc:documents:create",
  UPDATE_DOCUMENTS = "company:kyc:documents:update",
  DELETE_DOCUMENTS = "company:kyc:documents:delete",
  VERIFY_DOCUMENTS = "company:kyc:documents:verify",
  UPLOAD_DOCUMENTS = "company:kyc:documents:upload",
  DOWNLOAD_DOCUMENTS = "company:kyc:documents:download",
  VIEW_COMPLIANCE = "company:kyc:compliance:view",
  UPDATE_COMPLIANCE = "company:kyc:compliance:update",
  MANAGE_COMPLIANCE = "company:kyc:compliance:manage",
  VIEW_COMPLIANCE_REPORTS = "company:kyc:compliance:reports",
  VIEW_VERIFICATIONS = "company:kyc:verifications:view",
  MANAGE_VERIFICATIONS = "company:kyc:verifications:manage",
  TRIGGER_VERIFICATION = "company:kyc:verifications:trigger",
  VIEW_KYC_STATS = "company:kyc:stats:view",
  EXPORT_KYC_DATA = "company:kyc:export",
  MANAGE_KYC_SETTINGS = "company:kyc:settings:manage",
  VIEW_KYC_SETTINGS = "company:kyc:settings:view",
}

export enum VirtualCardPermission {
  VIEW_CARDS = "company:virtual_card:cards:view",
  CREATE_CARDS = "company:virtual_card:cards:create",
  UPDATE_CARDS = "company:virtual_card:cards:update",
  DELETE_CARDS = "company:virtual_card:cards:delete",
  ACTIVATE_CARDS = "company:virtual_card:cards:activate",
  DEACTIVATE_CARDS = "company:virtual_card:cards:deactivate",
  BLOCK_CARDS = "company:virtual_card:cards:block",
  UNBLOCK_CARDS = "company:virtual_card:cards:unblock",
  VIEW_TRANSACTIONS = "company:virtual_card:transactions:view",
  CREATE_TRANSACTIONS = "company:virtual_card:transactions:create",
  MANAGE_TRANSACTIONS = "company:virtual_card:transactions:manage",
  AUTHORIZE_TRANSACTIONS = "company:virtual_card:transactions:authorize",
  MANAGE_SPENDING_LIMITS = "company:virtual_card:limits:manage",
  VIEW_SPENDING_LIMITS = "company:virtual_card:limits:view",
  VIEW_CARD_SETTINGS = "company:virtual_card:settings:view",
  MANAGE_CARD_SETTINGS = "company:virtual_card:settings:manage",
  VIEW_CARD_STATS = "company:virtual_card:stats:view",
  EXPORT_CARD_DATA = "company:virtual_card:export",
  MANAGE_FRAUD_DETECTION = "company:virtual_card:fraud:manage",
  VIEW_FRAUD_ALERTS = "company:virtual_card:fraud:alerts",
  MANAGE_MERCHANT_CONTROLS = "company:virtual_card:merchants:manage",
  VIEW_MERCHANT_CONTROLS = "company:virtual_card:merchants:view",
  MANAGE_CATEGORY_CONTROLS = "company:virtual_card:categories:manage",
  VIEW_CATEGORY_CONTROLS = "company:virtual_card:categories:view",
}

export enum PermissionAction {
  VIEW = "view",
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  MANAGE = "manage",
  EXPORT = "export",
  VERIFY = "verify",
  AUTHORIZE = "authorize",
  UPLOAD = "upload",
  DOWNLOAD = "download",
  TRIGGER = "trigger",
  ACTIVATE = "activate",
  DEACTIVATE = "deactivate",
  BLOCK = "block",
  UNBLOCK = "unblock",
}

export enum PermissionResource {
  COMPANY = "company",
  DEPARTMENT = "department",
  DESIGNATION = "designation",
  COST_CENTER = "cost_center",
  KYC_DOCUMENT = "kyc_document",
  KYC_COMPLIANCE = "kyc_compliance",
  KYC_VERIFICATION = "kyc_verification",
  VIRTUAL_CARD = "virtual_card",
  VIRTUAL_CARD_TRANSACTION = "virtual_card_transaction",
  VIRTUAL_CARD_SETTINGS = "virtual_card_settings",
}

export interface Permission {
  id: string;
  category: PermissionCategory;
  resource: PermissionResource;
  action: PermissionAction;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionContext {
  userId: string;
  companyId?: string;
  departmentId?: string;
  userRole: string;
  userPermissions: string[];
  resourceType: PermissionResource;
  action: PermissionAction;
  targetCompanyId?: string;
  targetDepartmentId?: string;
}

export interface PermissionResponse {
  granted: boolean;
  reason?: string;
  requiredPermissions: string[];
  userPermissions: string[];
}

export interface PermissionMatrixEntry {
  role: string;
  permissions: string[];
  categories: PermissionCategory[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  result: string;
  ipAddress: string;
  userAgent: string;
}

export interface PermissionSummary {
  totalRoles: number;
  totalPermissions: number;
  activeRoles: number;
  inactiveRoles: number;
  permissionDistribution: Record<PermissionCategory, number>;
  lastUpdated: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PermissionValidationRequest {
  userId?: string;
  permissions: string[];
}

export interface RoleCreationRequest {
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}

export interface PermissionCreationRequest {
  category: PermissionCategory;
  resource: PermissionResource;
  action: PermissionAction;
  description?: string;
}
