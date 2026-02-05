/**
 * Permission Management Types and Definitions
 * Comprehensive permission system for Company Management module
 * Includes KYC and Virtual Card as sub-functions
 */

// Permission Categories
export enum PermissionCategory {
  COMPANY = 'company',
  DEPARTMENT = 'department',
  DESIGNATION = 'designation',
  COST_CENTER = 'cost_center',
  KYC = 'kyc',
  VIRTUAL_CARD = 'virtual_card'
}

// Company Management Module Permissions
export enum CompanyPermission {
  // Company Management
  VIEW_COMPANIES = 'company:companies:view',
  CREATE_COMPANIES = 'company:companies:create',
  UPDATE_COMPANIES = 'company:companies:update',
  DELETE_COMPANIES = 'company:companies:delete',
  MANAGE_COMPANY_SETTINGS = 'company:companies:settings',
  
  // Department Management
  VIEW_DEPARTMENTS = 'company:departments:view',
  CREATE_DEPARTMENTS = 'company:departments:create',
  UPDATE_DEPARTMENTS = 'company:departments:update',
  DELETE_DEPARTMENTS = 'company:departments:delete',
  
  // Designation Management
  VIEW_DESIGNATIONS = 'company:designations:view',
  CREATE_DESIGNATIONS = 'company:designations:create',
  UPDATE_DESIGNATIONS = 'company:designations:update',
  DELETE_DESIGNATIONS = 'company:designations:delete',
  
  // Cost Center Management
  VIEW_COST_CENTERS = 'company:cost_centers:view',
  CREATE_COST_CENTERS = 'company:cost_centers:create',
  UPDATE_COST_CENTERS = 'company:cost_centers:update',
  DELETE_COST_CENTERS = 'company:cost_centers:delete',
  
  // Company Hierarchy Management
  MANAGE_HIERARCHY = 'company:hierarchy:manage',
  VIEW_HIERARCHY = 'company:hierarchy:view',
  
  // Company Reports and Analytics
  VIEW_COMPANY_REPORTS = 'company:reports:view',
  EXPORT_COMPANY_DATA = 'company:export',
  
  // Company Configuration
  MANAGE_COMPANY_CONFIG = 'company:config:manage',
  VIEW_COMPANY_CONFIG = 'company:config:view'
}

// KYC Module Permissions (Sub-function of Company Management)
export enum KYCPermission {
  // Document Management
  VIEW_DOCUMENTS = 'company:kyc:documents:view',
  CREATE_DOCUMENTS = 'company:kyc:documents:create',
  UPDATE_DOCUMENTS = 'company:kyc:documents:update',
  DELETE_DOCUMENTS = 'company:kyc:documents:delete',
  VERIFY_DOCUMENTS = 'company:kyc:documents:verify',
  UPLOAD_DOCUMENTS = 'company:kyc:documents:upload',
  DOWNLOAD_DOCUMENTS = 'company:kyc:documents:download',
  
  // Compliance Management
  VIEW_COMPLIANCE = 'company:kyc:compliance:view',
  UPDATE_COMPLIANCE = 'company:kyc:compliance:update',
  MANAGE_COMPLIANCE = 'company:kyc:compliance:manage',
  VIEW_COMPLIANCE_REPORTS = 'company:kyc:compliance:reports',
  
  // Verification Management
  VIEW_VERIFICATIONS = 'company:kyc:verifications:view',
  MANAGE_VERIFICATIONS = 'company:kyc:verifications:manage',
  TRIGGER_VERIFICATION = 'company:kyc:verifications:trigger',
  
  // KYC Statistics and Reporting
  VIEW_KYC_STATS = 'company:kyc:stats:view',
  EXPORT_KYC_DATA = 'company:kyc:export',
  
  // KYC Settings
  MANAGE_KYC_SETTINGS = 'company:kyc:settings:manage',
  VIEW_KYC_SETTINGS = 'company:kyc:settings:view'
}

// Virtual Card Module Permissions (Sub-function of Company Management)
export enum VirtualCardPermission {
  // Card Management
  VIEW_CARDS = 'company:virtual_card:cards:view',
  CREATE_CARDS = 'company:virtual_card:cards:create',
  UPDATE_CARDS = 'company:virtual_card:cards:update',
  DELETE_CARDS = 'company:virtual_card:cards:delete',
  ACTIVATE_CARDS = 'company:virtual_card:cards:activate',
  DEACTIVATE_CARDS = 'company:virtual_card:cards:deactivate',
  BLOCK_CARDS = 'company:virtual_card:cards:block',
  UNBLOCK_CARDS = 'company:virtual_card:cards:unblock',
  
  // Transaction Management
  VIEW_TRANSACTIONS = 'company:virtual_card:transactions:view',
  CREATE_TRANSACTIONS = 'company:virtual_card:transactions:create',
  MANAGE_TRANSACTIONS = 'company:virtual_card:transactions:manage',
  AUTHORIZE_TRANSACTIONS = 'company:virtual_card:transactions:authorize',
  
  // Spending Controls
  MANAGE_SPENDING_LIMITS = 'company:virtual_card:limits:manage',
  VIEW_SPENDING_LIMITS = 'company:virtual_card:limits:view',
  
  // Card Settings and Configuration
  VIEW_CARD_SETTINGS = 'company:virtual_card:settings:view',
  MANAGE_CARD_SETTINGS = 'company:virtual_card:settings:manage',
  
  // Virtual Card Statistics and Reporting
  VIEW_CARD_STATS = 'company:virtual_card:stats:view',
  EXPORT_CARD_DATA = 'company:virtual_card:export',
  
  // Security and Fraud Management
  MANAGE_FRAUD_DETECTION = 'company:virtual_card:fraud:manage',
  VIEW_FRAUD_ALERTS = 'company:virtual_card:fraud:alerts',
  
  // Merchant and Category Management
  MANAGE_MERCHANT_CONTROLS = 'company:virtual_card:merchants:manage',
  VIEW_MERCHANT_CONTROLS = 'company:virtual_card:merchants:view',
  MANAGE_CATEGORY_CONTROLS = 'company:virtual_card:categories:manage',
  VIEW_CATEGORY_CONTROLS = 'company:virtual_card:categories:view'
}

// Permission Actions
export enum PermissionAction {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  EXPORT = 'export',
  VERIFY = 'verify',
  AUTHORIZE = 'authorize',
  UPLOAD = 'upload',
  DOWNLOAD = 'download',
  TRIGGER = 'trigger',
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate',
  BLOCK = 'block',
  UNBLOCK = 'unblock'
}

// Permission Resource Types
export enum PermissionResource {
  COMPANY = 'company',
  DEPARTMENT = 'department',
  DESIGNATION = 'designation',
  COST_CENTER = 'cost_center',
  KYC_DOCUMENT = 'kyc_document',
  KYC_COMPLIANCE = 'kyc_compliance',
  KYC_VERIFICATION = 'kyc_verification',
  VIRTUAL_CARD = 'virtual_card',
  VIRTUAL_CARD_TRANSACTION = 'virtual_card_transaction',
  VIRTUAL_CARD_SETTINGS = 'virtual_card_settings'
}

// Role-based Permission Sets
export interface RolePermissions {
  role: string;
  permissions: string[];
  description: string;
}

// Default Role Permission Sets for Company Management
export const COMPANY_ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'SUPER_ADMIN',
    permissions: [
      // Company Management - Full Access
      ...Object.values(CompanyPermission),
      // KYC Management - Full Access
      ...Object.values(KYCPermission),
      // Virtual Card Management - Full Access
      ...Object.values(VirtualCardPermission)
    ],
    description: 'Super Admin with full access to all company management features'
  },
  {
    role: 'ADMIN',
    permissions: [
      // Company Management - Limited Access
      CompanyPermission.VIEW_COMPANIES,
      CompanyPermission.UPDATE_COMPANIES,
      CompanyPermission.VIEW_DEPARTMENTS,
      CompanyPermission.CREATE_DEPARTMENTS,
      CompanyPermission.UPDATE_DEPARTMENTS,
      CompanyPermission.VIEW_DESIGNATIONS,
      CompanyPermission.CREATE_DESIGNATIONS,
      CompanyPermission.UPDATE_DESIGNATIONS,
      CompanyPermission.VIEW_COST_CENTERS,
      CompanyPermission.CREATE_COST_CENTERS,
      CompanyPermission.UPDATE_COST_CENTERS,
      CompanyPermission.VIEW_HIERARCHY,
      CompanyPermission.VIEW_COMPANY_REPORTS,
      CompanyPermission.VIEW_COMPANY_CONFIG,
      
      // KYC Management - Review and Verification
      KYCPermission.VIEW_DOCUMENTS,
      KYCPermission.VERIFY_DOCUMENTS,
      KYCPermission.VIEW_COMPLIANCE,
      KYCPermission.UPDATE_COMPLIANCE,
      KYCPermission.VIEW_VERIFICATIONS,
      KYCPermission.MANAGE_VERIFICATIONS,
      KYCPermission.VIEW_KYC_STATS,
      KYCPermission.VIEW_KYC_SETTINGS,
      
      // Virtual Card Management - Monitoring and Basic Management
      VirtualCardPermission.VIEW_CARDS,
      VirtualCardPermission.VIEW_TRANSACTIONS,
      VirtualCardPermission.VIEW_SPENDING_LIMITS,
      VirtualCardPermission.VIEW_CARD_SETTINGS,
      VirtualCardPermission.VIEW_CARD_STATS,
      VirtualCardPermission.VIEW_FRAUD_ALERTS,
      VirtualCardPermission.VIEW_MERCHANT_CONTROLS,
      VirtualCardPermission.VIEW_CATEGORY_CONTROLS
    ],
    description: 'Admin with management and review capabilities'
  },
  {
    role: 'B2B',
    permissions: [
      // Company Management - View Only
      CompanyPermission.VIEW_COMPANIES,
      CompanyPermission.VIEW_DEPARTMENTS,
      CompanyPermission.VIEW_DESIGNATIONS,
      CompanyPermission.VIEW_COST_CENTERS,
      CompanyPermission.VIEW_HIERARCHY,
      CompanyPermission.VIEW_COMPANY_CONFIG,
      
      // KYC Management - Document Submission and Status Tracking
      KYCPermission.VIEW_DOCUMENTS,
      KYCPermission.CREATE_DOCUMENTS,
      KYCPermission.UPDATE_DOCUMENTS,
      KYCPermission.UPLOAD_DOCUMENTS,
      KYCPermission.VIEW_COMPLIANCE,
      KYCPermission.VIEW_VERIFICATIONS,
      KYCPermission.VIEW_KYC_STATS,
      KYCPermission.VIEW_KYC_SETTINGS,
      
      // Virtual Card Management - Card Usage and Transaction Monitoring
      VirtualCardPermission.VIEW_CARDS,
      VirtualCardPermission.CREATE_CARDS,
      VirtualCardPermission.UPDATE_CARDS,
      VirtualCardPermission.ACTIVATE_CARDS,
      VirtualCardPermission.DEACTIVATE_CARDS,
      VirtualCardPermission.VIEW_TRANSACTIONS,
      VirtualCardPermission.CREATE_TRANSACTIONS,
      VirtualCardPermission.VIEW_SPENDING_LIMITS,
      VirtualCardPermission.VIEW_CARD_SETTINGS,
      VirtualCardPermission.VIEW_CARD_STATS
    ],
    description: 'B2B User with operational access to company features'
  },
  {
    role: 'VIEWER',
    permissions: [
      // Company Management - Read Only
      CompanyPermission.VIEW_COMPANIES,
      CompanyPermission.VIEW_DEPARTMENTS,
      CompanyPermission.VIEW_DESIGNATIONS,
      CompanyPermission.VIEW_COST_CENTERS,
      CompanyPermission.VIEW_HIERARCHY,
      CompanyPermission.VIEW_COMPANY_REPORTS,
      CompanyPermission.VIEW_COMPANY_CONFIG,
      
      // KYC Management - Status Monitoring
      KYCPermission.VIEW_DOCUMENTS,
      KYCPermission.VIEW_COMPLIANCE,
      KYCPermission.VIEW_VERIFICATIONS,
      KYCPermission.VIEW_KYC_STATS,
      KYCPermission.VIEW_KYC_SETTINGS,
      
      // Virtual Card Management - Monitoring Only
      VirtualCardPermission.VIEW_CARDS,
      VirtualCardPermission.VIEW_TRANSACTIONS,
      VirtualCardPermission.VIEW_SPENDING_LIMITS,
      VirtualCardPermission.VIEW_CARD_SETTINGS,
      VirtualCardPermission.VIEW_CARD_STATS,
      VirtualCardPermission.VIEW_FRAUD_ALERTS
    ],
    description: 'Viewer role with read-only access to company management'
  }
];

// Permission Check Interface
export interface PermissionCheck {
  resource: PermissionResource;
  action: PermissionAction;
  companyId?: string;
  userId?: string;
}

// Permission Response
export interface PermissionResponse {
  granted: boolean;
  reason?: string;
  requiredPermissions: string[];
  userPermissions: string[];
}

// Permission Hierarchy Levels
export enum PermissionLevel {
  GLOBAL = 'global',      // Access to all companies
  COMPANY = 'company',    // Access to specific company
  DEPARTMENT = 'department', // Access to specific department
  USER = 'user'           // Access to own resources only
}

// Permission Context
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

// Permission Validation Rules
export interface PermissionRule {
  resource: PermissionResource;
  action: PermissionAction;
  requiredPermissions: string[];
  level: PermissionLevel;
  description: string;
}

// Default Permission Rules
export const PERMISSION_RULES: PermissionRule[] = [
  // Company Management Rules
  {
    resource: PermissionResource.COMPANY,
    action: PermissionAction.VIEW,
    requiredPermissions: [CompanyPermission.VIEW_COMPANIES],
    level: PermissionLevel.COMPANY,
    description: 'View company information'
  },
  {
    resource: PermissionResource.COMPANY,
    action: PermissionAction.CREATE,
    requiredPermissions: [CompanyPermission.CREATE_COMPANIES],
    level: PermissionLevel.GLOBAL,
    description: 'Create new company'
  },
  {
    resource: PermissionResource.COMPANY,
    action: PermissionAction.UPDATE,
    requiredPermissions: [CompanyPermission.UPDATE_COMPANIES],
    level: PermissionLevel.COMPANY,
    description: 'Update company information'
  },
  {
    resource: PermissionResource.COMPANY,
    action: PermissionAction.DELETE,
    requiredPermissions: [CompanyPermission.DELETE_COMPANIES],
    level: PermissionLevel.GLOBAL,
    description: 'Delete company'
  },
  
  // KYC Document Rules
  {
    resource: PermissionResource.KYC_DOCUMENT,
    action: PermissionAction.VIEW,
    requiredPermissions: [KYCPermission.VIEW_DOCUMENTS],
    level: PermissionLevel.COMPANY,
    description: 'View KYC documents'
  },
  {
    resource: PermissionResource.KYC_DOCUMENT,
    action: PermissionAction.CREATE,
    requiredPermissions: [KYCPermission.CREATE_DOCUMENTS],
    level: PermissionLevel.COMPANY,
    description: 'Create KYC documents'
  },
  {
    resource: PermissionResource.KYC_DOCUMENT,
    action: PermissionAction.VERIFY,
    requiredPermissions: [KYCPermission.VERIFY_DOCUMENTS],
    level: PermissionLevel.COMPANY,
    description: 'Verify KYC documents'
  },
  
  // Virtual Card Rules
  {
    resource: PermissionResource.VIRTUAL_CARD,
    action: PermissionAction.VIEW,
    requiredPermissions: [VirtualCardPermission.VIEW_CARDS],
    level: PermissionLevel.COMPANY,
    description: 'View virtual cards'
  },
  {
    resource: PermissionResource.VIRTUAL_CARD,
    action: PermissionAction.CREATE,
    requiredPermissions: [VirtualCardPermission.CREATE_CARDS],
    level: PermissionLevel.COMPANY,
    description: 'Create virtual cards'
  },
  {
    resource: PermissionResource.VIRTUAL_CARD,
    action: PermissionAction.ACTIVATE,
    requiredPermissions: [VirtualCardPermission.ACTIVATE_CARDS],
    level: PermissionLevel.COMPANY,
    description: 'Activate virtual cards'
  },
  {
    resource: PermissionResource.VIRTUAL_CARD_TRANSACTION,
    action: PermissionAction.VIEW,
    requiredPermissions: [VirtualCardPermission.VIEW_TRANSACTIONS],
    level: PermissionLevel.COMPANY,
    description: 'View virtual card transactions'
  }
];

// Permission Utility Functions
export class PermissionUtils {
  /**
   * Check if user has specific permission
   */
  static hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    return userPermissions.includes(requiredPermission);
  }

  /**
   * Check if user has any of the required permissions
   */
  static hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(permission => 
      this.hasPermission(userPermissions, permission)
    );
  }

  /**
   * Check if user has all required permissions
   */
  static hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => 
      this.hasPermission(userPermissions, permission)
    );
  }

  /**
   * Get permissions for a specific role
   */
  static getRolePermissions(role: string): string[] {
    const roleConfig = COMPANY_ROLE_PERMISSIONS.find(rp => rp.role === role);
    return roleConfig ? roleConfig.permissions : [];
  }

  /**
   * Check permission level access
   */
  static checkPermissionLevel(
    userRole: string,
    permissionLevel: PermissionLevel,
    userCompanyId?: string,
    targetCompanyId?: string
  ): boolean {
    // SUPER_ADMIN has global access
    if (userRole === 'SUPER_ADMIN') {
      return true;
    }

    // Check permission level requirements
    switch (permissionLevel) {
      case PermissionLevel.GLOBAL:
        return userRole === 'SUPER_ADMIN';
      
      case PermissionLevel.COMPANY:
        return userCompanyId === targetCompanyId;
      
      case PermissionLevel.DEPARTMENT:
        // Additional department-level checks would go here
        return true;
      
      case PermissionLevel.USER:
        // User-level checks would go here
        return true;
      
      default:
        return false;
    }
  }

  /**
   * Build permission string from components
   */
  static buildPermission(
    category: PermissionCategory,
    resource: string,
    action: PermissionAction
  ): string {
    return `${category}:${resource}:${action}`;
  }

  /**
   * Parse permission string into components
   */
  static parsePermission(permission: string): {
    category: string;
    resource: string;
    action: string;
  } | null {
    const parts = permission.split(':');
    if (parts.length !== 3) {
      return null;
    }
    return {
      category: parts[0],
      resource: parts[1],
      action: parts[2] as PermissionAction
    };
  }
}

// Permission Validation Interface
export interface PermissionValidator {
  validate(context: PermissionContext): Promise<PermissionResponse>;
  validateSync(context: PermissionContext): PermissionResponse;
}

// Permission Error Types
export enum PermissionErrorType {
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED = 'ACCESS_DENIED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  INVALID_ROLE = 'INVALID_ROLE'
}

// Permission Error
export class PermissionError extends Error {
  constructor(
    public type: PermissionErrorType,
    public message: string,
    public requiredPermissions: string[],
    public userPermissions: string[]
  ) {
    super(message);
    this.name = 'PermissionError';
  }
}