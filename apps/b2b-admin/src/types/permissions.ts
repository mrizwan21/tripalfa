// Permission Management Types for Frontend

// Permission Categories
export enum PermissionCategory {
  COMPANY = 'company',
  DEPARTMENT = 'department',
  DESIGNATION = 'designation',
  COST_CENTER = 'cost_center',
  KYC = 'kyc',
  VIRTUAL_CARD = 'virtual_card'
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

// Permission Resources
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

// Permission Interface
export interface Permission {
  id: string;
  category: PermissionCategory;
  resource: PermissionResource;
  action: PermissionAction;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Role Interface
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Permission Context for API
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

// Permission Response
export interface PermissionResponse {
  granted: boolean;
  reason?: string;
  requiredPermissions: string[];
  userPermissions: string[];
}

// Permission Matrix Entry
export interface PermissionMatrixEntry {
  role: string;
  permissions: string[];
  categories: PermissionCategory[];
}

// Audit Log Entry
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  result: 'GRANTED' | 'DENIED';
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

// Permission Summary
export interface PermissionSummary {
  totalRoles: number;
  totalPermissions: number;
  activeRoles: number;
  inactiveRoles: number;
  permissionDistribution: Record<PermissionCategory, number>;
  lastUpdated: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PermissionValidationRequest {
  userId: string;
  permissions: string[];
  context?: PermissionContext;
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
  description: string;
}

// Utility Types
export type PermissionString = `${PermissionCategory}:${string}:${PermissionAction}`;

// Permission Utilities for Frontend
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
    const roleConfig = this.ROLE_PERMISSIONS.find(rp => rp.role === role);
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

  /**
   * Get human-readable permission description
   */
  static getPermissionDescription(permission: string): string {
    const parsed = this.parsePermission(permission);
    if (!parsed) return permission;

    const category = parsed.category.charAt(0).toUpperCase() + parsed.category.slice(1);
    const action = parsed.action.charAt(0).toUpperCase() + parsed.action.slice(1);
    
    return `${action} ${category} ${parsed.resource}`;
  }

  /**
   * Get role display name
   */
  static getRoleDisplayName(role: string): string {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Administrator';
      case 'ADMIN': return 'Administrator';
      case 'B2B': return 'B2B User';
      case 'VIEWER': return 'Viewer';
      default: return role;
    }
  }

  /**
   * Get role color for display
   */
  static getRoleColor(role: string): 'primary' | 'secondary' | 'success' | 'default' {
    switch (role) {
      case 'SUPER_ADMIN': return 'primary';
      case 'ADMIN': return 'secondary';
      case 'B2B': return 'success';
      case 'VIEWER': return 'default';
      default: return 'default';
    }
  }

  /**
   * Check if user can manage permissions
   */
  static canManagePermissions(userRole: string): boolean {
    return userRole === 'SUPER_ADMIN';
  }

  /**
   * Check if user can view audit logs
   */
  static canViewAuditLogs(userRole: string): boolean {
    return ['SUPER_ADMIN', 'ADMIN'].includes(userRole);
  }

  /**
   * Check if user can create roles
   */
  static canCreateRoles(userRole: string): boolean {
    return userRole === 'SUPER_ADMIN';
  }

  /**
   * Check if user can delete roles
   */
  static canDeleteRoles(userRole: string): boolean {
    return userRole === 'SUPER_ADMIN';
  }

  /**
   * Check if user can update roles
   */
  static canUpdateRoles(userRole: string): boolean {
    return userRole === 'SUPER_ADMIN';
  }

  /**
   * Check if user can create permissions
   */
  static canCreatePermissions(userRole: string): boolean {
    return userRole === 'SUPER_ADMIN';
  }

  /**
   * Check if user can delete permissions
   */
  static canDeletePermissions(userRole: string): boolean {
    return userRole === 'SUPER_ADMIN';
  }

  /**
   * Check if user can update permissions
   */
  static canUpdatePermissions(userRole: string): boolean {
    return userRole === 'SUPER_ADMIN';
  }

  /**
   * Default Role Permission Sets for Company Management
   */
  private static readonly ROLE_PERMISSIONS = [
    {
      role: 'SUPER_ADMIN',
      permissions: [
        // Company Management - Full Access
        'company:companies:manage',
        'company:departments:manage',
        'company:designations:manage',
        'company:cost_centers:manage',
        'company:hierarchy:manage',
        'company:reports:manage',
        'company:export:manage',
        'company:config:manage',
        
        // KYC Management - Full Access
        'company:kyc:documents:manage',
        'company:kyc:compliance:manage',
        'company:kyc:verifications:manage',
        'company:kyc:stats:manage',
        'company:kyc:export:manage',
        'company:kyc:settings:manage',
        
        // Virtual Card Management - Full Access
        'company:virtual_card:cards:manage',
        'company:virtual_card:transactions:manage',
        'company:virtual_card:limits:manage',
        'company:virtual_card:settings:manage',
        'company:virtual_card:fraud:manage',
        'company:virtual_card:merchants:manage',
        'company:virtual_card:categories:manage'
      ]
    },
    {
      role: 'ADMIN',
      permissions: [
        // Company Management - Limited Access
        'company:companies:view',
        'company:companies:update',
        'company:departments:view',
        'company:departments:create',
        'company:departments:update',
        'company:designations:view',
        'company:designations:create',
        'company:designations:update',
        'company:cost_centers:view',
        'company:cost_centers:create',
        'company:cost_centers:update',
        'company:hierarchy:view',
        'company:reports:view',
        'company:config:view',
        
        // KYC Management - Review and Verification
        'company:kyc:documents:view',
        'company:kyc:documents:verify',
        'company:kyc:compliance:view',
        'company:kyc:compliance:update',
        'company:kyc:verifications:view',
        'company:kyc:verifications:manage',
        'company:kyc:stats:view',
        'company:kyc:settings:view',
        
        // Virtual Card Management - Monitoring and Basic Management
        'company:virtual_card:cards:view',
        'company:virtual_card:transactions:view',
        'company:virtual_card:limits:view',
        'company:virtual_card:settings:view',
        'company:virtual_card:stats:view',
        'company:virtual_card:fraud:alerts',
        'company:virtual_card:merchants:view',
        'company:virtual_card:categories:view'
      ]
    },
    {
      role: 'B2B',
      permissions: [
        // Company Management - View Only
        'company:companies:view',
        'company:departments:view',
        'company:designations:view',
        'company:cost_centers:view',
        'company:hierarchy:view',
        'company:config:view',
        
        // KYC Management - Document Submission and Status Tracking
        'company:kyc:documents:view',
        'company:kyc:documents:create',
        'company:kyc:documents:update',
        'company:kyc:documents:upload',
        'company:kyc:compliance:view',
        'company:kyc:verifications:view',
        'company:kyc:stats:view',
        'company:kyc:settings:view',
        
        // Virtual Card Management - Card Usage and Transaction Monitoring
        'company:virtual_card:cards:view',
        'company:virtual_card:cards:create',
        'company:virtual_card:cards:update',
        'company:virtual_card:cards:activate',
        'company:virtual_card:cards:deactivate',
        'company:virtual_card:transactions:view',
        'company:virtual_card:transactions:create',
        'company:virtual_card:limits:view',
        'company:virtual_card:settings:view',
        'company:virtual_card:stats:view'
      ]
    },
    {
      role: 'VIEWER',
      permissions: [
        // Company Management - Read Only
        'company:companies:view',
        'company:departments:view',
        'company:designations:view',
        'company:cost_centers:view',
        'company:hierarchy:view',
        'company:reports:view',
        'company:config:view',
        
        // KYC Management - Status Monitoring
        'company:kyc:documents:view',
        'company:kyc:compliance:view',
        'company:kyc:verifications:view',
        'company:kyc:stats:view',
        'company:kyc:settings:view',
        
        // Virtual Card Management - Monitoring Only
        'company:virtual_card:cards:view',
        'company:virtual_card:transactions:view',
        'company:virtual_card:limits:view',
        'company:virtual_card:settings:view',
        'company:virtual_card:stats:view',
        'company:virtual_card:fraud:alerts'
      ]
    }
  ];
}

// Permission Level
export enum PermissionLevel {
  GLOBAL = 'global',      // Access to all companies
  COMPANY = 'company',    // Access to specific company
  DEPARTMENT = 'department', // Access to specific department
  USER = 'user'           // Access to own resources only
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