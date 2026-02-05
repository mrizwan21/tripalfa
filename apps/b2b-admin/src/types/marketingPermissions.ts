// Marketing Permission Types

// Marketing Permission Categories
export enum MarketingPermissionCategory {
  SEO = 'seo',
  SOCIAL = 'social',
  BANNER = 'banner',
  AFFILIATE = 'affiliate'
}

// Marketing Permission Actions
export enum MarketingPermissionAction {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  PUBLISH = 'publish',
  CONNECT = 'connect',
  DISCONNECT = 'disconnect'
}

// Marketing Permission Resources
export enum MarketingPermissionResource {
  SEO_SETTINGS = 'seo_settings',
  SOCIAL_PLATFORMS = 'social_platforms',
  BANNER_CAMPAIGNS = 'banner_campaigns',
  AFFILIATE_PROGRAMS = 'affiliate_programs'
}

// Marketing Permission Interface
export interface MarketingPermission {
  id: string;
  category: MarketingPermissionCategory;
  resource: MarketingPermissionResource;
  action: MarketingPermissionAction;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Marketing Role Interface
export interface MarketingRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Marketing Permission Context
export interface MarketingPermissionContext {
  userId: string;
  companyId?: string;
  userRole: string;
  userPermissions: string[];
  resourceType: MarketingPermissionResource;
  action: MarketingPermissionAction;
  targetCompanyId?: string;
}

// Marketing Permission Response
export interface MarketingPermissionResponse {
  granted: boolean;
  reason?: string;
  requiredPermissions: string[];
  userPermissions: string[];
}

// Marketing Permission Matrix Entry
export interface MarketingPermissionMatrixEntry {
  role: string;
  permissions: string[];
  categories: MarketingPermissionCategory[];
}

// Marketing Audit Log Entry
export interface MarketingAuditLogEntry {
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

// Marketing Permission Summary
export interface MarketingPermissionSummary {
  totalRoles: number;
  totalPermissions: number;
  activeRoles: number;
  inactiveRoles: number;
  permissionDistribution: Record<MarketingPermissionCategory, number>;
  lastUpdated: string;
}

// Marketing API Response Types
export interface MarketingApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface MarketingPermissionValidationRequest {
  userId: string;
  permissions: string[];
  context?: MarketingPermissionContext;
}

export interface MarketingRoleCreationRequest {
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}

export interface MarketingPermissionCreationRequest {
  category: MarketingPermissionCategory;
  resource: MarketingPermissionResource;
  action: MarketingPermissionAction;
  description: string;
}

// Marketing Permission Utilities
export class MarketingPermissionUtils {
  /**
   * Check if user has specific marketing permission
   */
  static hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    return userPermissions.includes(requiredPermission);
  }

  /**
   * Check if user has any of the required marketing permissions
   */
  static hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(permission => 
      this.hasPermission(userPermissions, permission)
    );
  }

  /**
   * Check if user has all required marketing permissions
   */
  static hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => 
      this.hasPermission(userPermissions, permission)
    );
  }

  /**
   * Get marketing permissions for a specific role
   */
  static getRolePermissions(role: string): string[] {
    const roleConfig = this.MARKETING_ROLE_PERMISSIONS.find(rp => rp.role === role);
    return roleConfig ? roleConfig.permissions : [];
  }

  /**
   * Check marketing permission level access
   */
  static checkPermissionLevel(
    userRole: string,
    permissionLevel: MarketingPermissionLevel,
    userCompanyId?: string,
    targetCompanyId?: string
  ): boolean {
    // SUPER_ADMIN has global access
    if (userRole === 'SUPER_ADMIN') {
      return true;
    }

    // Check permission level requirements
    switch (permissionLevel) {
      case MarketingPermissionLevel.GLOBAL:
        return userRole === 'SUPER_ADMIN';
      
      case MarketingPermissionLevel.COMPANY:
        return userCompanyId === targetCompanyId;
      
      case MarketingPermissionLevel.DEPARTMENT:
        // Additional department-level checks would go here
        return true;
      
      case MarketingPermissionLevel.USER:
        // User-level checks would go here
        return true;
      
      default:
        return false;
    }
  }

  /**
   * Build marketing permission string from components
   */
  static buildPermission(
    category: MarketingPermissionCategory,
    resource: string,
    action: MarketingPermissionAction
  ): string {
    return `marketing:${category}:${resource}:${action}`;
  }

  /**
   * Parse marketing permission string into components
   */
  static parsePermission(permission: string): {
    category: string;
    resource: string;
    action: string;
  } | null {
    const parts = permission.split(':');
    if (parts.length !== 4 || parts[0] !== 'marketing') {
      return null;
    }
    return {
      category: parts[1],
      resource: parts[2],
      action: parts[3] as MarketingPermissionAction
    };
  }

  /**
   * Get human-readable marketing permission description
   */
  static getPermissionDescription(permission: string): string {
    const parsed = this.parsePermission(permission);
    if (!parsed) return permission;

    const category = parsed.category.charAt(0).toUpperCase() + parsed.category.slice(1);
    const action = parsed.action.charAt(0).toUpperCase() + parsed.action.slice(1);
    
    return `${action} ${category} ${parsed.resource}`;
  }

  /**
   * Get marketing role display name
   */
  static getRoleDisplayName(role: string): string {
    switch (role) {
      case 'MARKETING_ADMIN': return 'Marketing Administrator';
      case 'MARKETING_MANAGER': return 'Marketing Manager';
      case 'MARKETING_USER': return 'Marketing User';
      case 'MARKETING_VIEWER': return 'Marketing Viewer';
      default: return role;
    }
  }

  /**
   * Get marketing role color for display
   */
  static getRoleColor(role: string): 'primary' | 'secondary' | 'success' | 'default' {
    switch (role) {
      case 'MARKETING_ADMIN': return 'primary';
      case 'MARKETING_MANAGER': return 'secondary';
      case 'MARKETING_USER': return 'success';
      case 'MARKETING_VIEWER': return 'default';
      default: return 'default';
    }
  }

  /**
   * Check if user can manage marketing permissions
   */
  static canManagePermissions(userRole: string): boolean {
    return ['SUPER_ADMIN', 'MARKETING_ADMIN'].includes(userRole);
  }

  /**
   * Check if user can view marketing audit logs
   */
  static canViewAuditLogs(userRole: string): boolean {
    return ['SUPER_ADMIN', 'MARKETING_ADMIN', 'MARKETING_MANAGER'].includes(userRole);
  }

  /**
   * Check if user can create marketing roles
   */
  static canCreateRoles(userRole: string): boolean {
    return ['SUPER_ADMIN', 'MARKETING_ADMIN'].includes(userRole);
  }

  /**
   * Check if user can delete marketing roles
   */
  static canDeleteRoles(userRole: string): boolean {
    return ['SUPER_ADMIN', 'MARKETING_ADMIN'].includes(userRole);
  }

  /**
   * Check if user can update marketing roles
   */
  static canUpdateRoles(userRole: string): boolean {
    return ['SUPER_ADMIN', 'MARKETING_ADMIN'].includes(userRole);
  }

  /**
   * Check if user can create marketing permissions
   */
  static canCreatePermissions(userRole: string): boolean {
    return ['SUPER_ADMIN', 'MARKETING_ADMIN'].includes(userRole);
  }

  /**
   * Check if user can delete marketing permissions
   */
  static canDeletePermissions(userRole: string): boolean {
    return ['SUPER_ADMIN', 'MARKETING_ADMIN'].includes(userRole);
  }

  /**
   * Check if user can update marketing permissions
   */
  static canUpdatePermissions(userRole: string): boolean {
    return ['SUPER_ADMIN', 'MARKETING_ADMIN'].includes(userRole);
  }

  /**
   * Default Marketing Role Permission Sets
   */
  private static readonly MARKETING_ROLE_PERMISSIONS = [
    {
      role: 'MARKETING_ADMIN',
      permissions: [
        // SEO Management - Full Access
        'marketing:seo:seo_settings:manage',
        'marketing:seo:seo_settings:view',
        'marketing:seo:seo_settings:create',
        'marketing:seo:seo_settings:update',
        'marketing:seo:seo_settings:publish',
        
        // Social Media Management - Full Access
        'marketing:social:social_platforms:manage',
        'marketing:social:social_platforms:view',
        'marketing:social:social_platforms:create',
        'marketing:social:social_platforms:update',
        'marketing:social:social_platforms:connect',
        'marketing:social:social_platforms:disconnect',
        'marketing:social:social_platforms:delete',
        
        // Banner Management - Full Access
        'marketing:banner:banner_campaigns:manage',
        'marketing:banner:banner_campaigns:view',
        'marketing:banner:banner_campaigns:create',
        'marketing:banner:banner_campaigns:update',
        'marketing:banner:banner_campaigns:delete',
        'marketing:banner:banner_campaigns:publish',
        
        // Affiliate Management - Full Access
        'marketing:affiliate:affiliate_programs:manage',
        'marketing:affiliate:affiliate_programs:view',
        'marketing:affiliate:affiliate_programs:create',
        'marketing:affiliate:affiliate_programs:update',
        'marketing:affiliate:affiliate_programs:delete',
        'marketing:affiliate:affiliate_programs:commission'
      ]
    },
    {
      role: 'MARKETING_MANAGER',
      permissions: [
        // SEO Management - Limited Access
        'marketing:seo:seo_settings:view',
        'marketing:seo:seo_settings:update',
        'marketing:seo:seo_settings:publish',
        
        // Social Media Management - Management Access
        'marketing:social:social_platforms:view',
        'marketing:social:social_platforms:connect',
        'marketing:social:social_platforms:disconnect',
        
        // Banner Management - Management Access
        'marketing:banner:banner_campaigns:view',
        'marketing:banner:banner_campaigns:create',
        'marketing:banner:banner_campaigns:update',
        'marketing:banner:banner_campaigns:publish',
        
        // Affiliate Management - Management Access
        'marketing:affiliate:affiliate_programs:view',
        'marketing:affiliate:affiliate_programs:create',
        'marketing:affiliate:affiliate_programs:update'
      ]
    },
    {
      role: 'MARKETING_USER',
      permissions: [
        // SEO Management - View Only
        'marketing:seo:seo_settings:view',
        
        // Social Media Management - View Only
        'marketing:social:social_platforms:view',
        
        // Banner Management - View and Create
        'marketing:banner:banner_campaigns:view',
        'marketing:banner:banner_campaigns:create',
        
        // Affiliate Management - View and Create
        'marketing:affiliate:affiliate_programs:view',
        'marketing:affiliate:affiliate_programs:create'
      ]
    },
    {
      role: 'MARKETING_VIEWER',
      permissions: [
        // SEO Management - View Only
        'marketing:seo:seo_settings:view',
        
        // Social Media Management - View Only
        'marketing:social:social_platforms:view',
        
        // Banner Management - View Only
        'marketing:banner:banner_campaigns:view',
        
        // Affiliate Management - View Only
        'marketing:affiliate:affiliate_programs:view'
      ]
    }
  ];
}

// Marketing Permission Level
export enum MarketingPermissionLevel {
  GLOBAL = 'global',      // Access to all companies
  COMPANY = 'company',    // Access to specific company
  DEPARTMENT = 'department', // Access to specific department
  USER = 'user'           // Access to own resources only
}

// Marketing Permission Error Types
export enum MarketingPermissionErrorType {
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED = 'ACCESS_DENIED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  INVALID_ROLE = 'INVALID_ROLE'
}

// Marketing Permission Error
export class MarketingPermissionError extends Error {
  constructor(
    public type: MarketingPermissionErrorType,
    public message: string,
    public requiredPermissions: string[],
    public userPermissions: string[]
  ) {
    super(message);
    this.name = 'MarketingPermissionError';
  }
}

// Marketing Permission Constants
export const MARKETING_PERMISSIONS = {
  // SEO Permissions
  SEO_VIEW: 'marketing:seo:seo_settings:view',
  SEO_EDIT: 'marketing:seo:seo_settings:update',
  SEO_PUBLISH: 'marketing:seo:seo_settings:publish',
  
  // Social Media Permissions
  SOCIAL_VIEW: 'marketing:social:social_platforms:view',
  SOCIAL_CONNECT: 'marketing:social:social_platforms:connect',
  SOCIAL_DISCONNECT: 'marketing:social:social_platforms:disconnect',
  SOCIAL_MANAGE: 'marketing:social:social_platforms:manage',
  
  // Banner Permissions
  BANNER_VIEW: 'marketing:banner:banner_campaigns:view',
  BANNER_CREATE: 'marketing:banner:banner_campaigns:create',
  BANNER_EDIT: 'marketing:banner:banner_campaigns:update',
  BANNER_DELETE: 'marketing:banner:banner_campaigns:delete',
  BANNER_PUBLISH: 'marketing:banner:banner_campaigns:publish',
  BANNER_MANAGE: 'marketing:banner:banner_campaigns:manage',
  
  // Affiliate Permissions
  AFFILIATE_VIEW: 'marketing:affiliate:affiliate_programs:view',
  AFFILIATE_CREATE: 'marketing:affiliate:affiliate_programs:create',
  AFFILIATE_EDIT: 'marketing:affiliate:affiliate_programs:update',
  AFFILIATE_DELETE: 'marketing:affiliate:affiliate_programs:delete',
  AFFILIATE_COMMISSION: 'marketing:affiliate:affiliate_programs:commission',
  AFFILIATE_MANAGE: 'marketing:affiliate:affiliate_programs:manage'
} as const;