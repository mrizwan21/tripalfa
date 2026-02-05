// Rule Management Permission Types

// Rule Permission Categories
export enum RulePermissionCategory {
  MARKUP = 'markup',
  COMMISSION = 'commission',
  COUPON = 'coupon',
  AIRLINE_DEAL = 'airline_deal'
}

// Rule Permission Actions
export enum RulePermissionAction {
  VIEW = 'view',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MANAGE = 'manage',
  APPROVE = 'approve',
  PUBLISH = 'publish',
  ANALYZE = 'analyze',
  EXPORT = 'export',
  IMPORT = 'import',
  ACTIVATE = 'activate',
  DEACTIVATE = 'deactivate'
}

// Rule Permission Resources
export enum RulePermissionResource {
  MARKUP_RULES = 'markup_rules',
  COMMISSION_RULES = 'commission_rules',
  COUPON_CAMPAIGNS = 'coupon_campaigns',
  AIRLINE_DEALS = 'airline_deals',
  RULE_ANALYTICS = 'rule_analytics',
  RULE_APPROVALS = 'rule_approvals',
  RULE_TEMPLATES = 'rule_templates',
  RULE_AUDIT = 'rule_audit'
}

// Rule Permission Interface
export interface RulePermission {
  id: string;
  category: RulePermissionCategory;
  resource: RulePermissionResource;
  action: RulePermissionAction;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// Rule Role Interface
export interface RuleRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Rule Permission Context
export interface RulePermissionContext {
  userId: string;
  companyId?: string;
  userRole: string;
  userPermissions: string[];
  resourceType: RulePermissionResource;
  action: RulePermissionAction;
  targetCompanyId?: string;
  ruleType?: RulePermissionCategory;
}

// Rule Permission Response
export interface RulePermissionResponse {
  granted: boolean;
  reason?: string;
  requiredPermissions: string[];
  userPermissions: string[];
}

// Rule Permission Matrix Entry
export interface RulePermissionMatrixEntry {
  role: string;
  permissions: string[];
  categories: RulePermissionCategory[];
}

// Rule Audit Log Entry
export interface RuleAuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  action: string;
  resource: string;
  ruleId?: string;
  ruleType?: string;
  result: 'GRANTED' | 'DENIED';
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

// Rule Permission Summary
export interface RulePermissionSummary {
  totalRoles: number;
  totalPermissions: number;
  activeRoles: number;
  inactiveRoles: number;
  permissionDistribution: Record<RulePermissionCategory, number>;
  lastUpdated: string;
}

// Rule API Response Types
export interface RuleApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface RulePermissionValidationRequest {
  userId: string;
  permissions: string[];
  context?: RulePermissionContext;
}

export interface RuleRoleCreationRequest {
  name: string;
  description: string;
  permissions: string[];
  isActive: boolean;
}

export interface RulePermissionCreationRequest {
  category: RulePermissionCategory;
  resource: RulePermissionResource;
  action: RulePermissionAction;
  description: string;
}

// Rule Permission Utilities
export class RulePermissionUtils {
  /**
   * Check if user has specific rule permission
   */
  static hasPermission(userPermissions: string[], requiredPermission: string): boolean {
    return userPermissions.includes(requiredPermission);
  }

  /**
   * Check if user has any of the required rule permissions
   */
  static hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(permission => 
      this.hasPermission(userPermissions, permission)
    );
  }

  /**
   * Check if user has all required rule permissions
   */
  static hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => 
      this.hasPermission(userPermissions, permission)
    );
  }

  /**
   * Get rule permissions for a specific role
   */
  static getRolePermissions(role: string): string[] {
    const roleConfig = this.RULE_ROLE_PERMISSIONS.find(rp => rp.role === role);
    return roleConfig ? roleConfig.permissions : [];
  }

  /**
   * Check rule permission level access
   */
  static checkPermissionLevel(
    userRole: string,
    permissionLevel: RulePermissionLevel,
    userCompanyId?: string,
    targetCompanyId?: string
  ): boolean {
    // SUPER_ADMIN has global access
    if (userRole === 'SUPER_ADMIN') {
      return true;
    }

    // Check permission level requirements
    switch (permissionLevel) {
      case RulePermissionLevel.GLOBAL:
        return userRole === 'SUPER_ADMIN';
      
      case RulePermissionLevel.COMPANY:
        return userCompanyId === targetCompanyId;
      
      case RulePermissionLevel.DEPARTMENT:
        // Additional department-level checks would go here
        return true;
      
      case RulePermissionLevel.USER:
        // User-level checks would go here
        return true;
      
      default:
        return false;
    }
  }

  /**
   * Build rule permission string from components
   */
  static buildPermission(
    category: RulePermissionCategory,
    resource: string,
    action: RulePermissionAction
  ): string {
    return `rules:${category}:${resource}:${action}`;
  }

  /**
   * Parse rule permission string into components
   */
  static parsePermission(permission: string): {
    category: string;
    resource: string;
    action: string;
  } | null {
    const parts = permission.split(':');
    if (parts.length !== 4 || parts[0] !== 'rules') {
      return null;
    }
    return {
      category: parts[1],
      resource: parts[2],
      action: parts[3] as RulePermissionAction
    };
  }

  /**
   * Get human-readable rule permission description
   */
  static getPermissionDescription(permission: string): string {
    const parsed = this.parsePermission(permission);
    if (!parsed) return permission;

    const category = parsed.category.charAt(0).toUpperCase() + parsed.category.slice(1);
    const action = parsed.action.charAt(0).toUpperCase() + parsed.action.slice(1);
    
    return `${action} ${category} ${parsed.resource}`;
  }

  /**
   * Get rule role display name
   */
  static getRoleDisplayName(role: string): string {
    switch (role) {
      case 'RULE_ADMIN': return 'Rule Administrator';
      case 'RULE_MANAGER': return 'Rule Manager';
      case 'RULE_USER': return 'Rule User';
      case 'RULE_VIEWER': return 'Rule Viewer';
      default: return role;
    }
  }

  /**
   * Get rule role color for display
   */
  static getRoleColor(role: string): 'primary' | 'secondary' | 'success' | 'default' {
    switch (role) {
      case 'RULE_ADMIN': return 'primary';
      case 'RULE_MANAGER': return 'secondary';
      case 'RULE_USER': return 'success';
      case 'RULE_VIEWER': return 'default';
      default: return 'default';
    }
  }

  /**
   * Check if user can manage rule permissions
   */
  static canManagePermissions(userRole: string): boolean {
    return ['SUPER_ADMIN', 'RULE_ADMIN'].includes(userRole);
  }

  /**
   * Check if user can view rule audit logs
   */
  static canViewAuditLogs(userRole: string): boolean {
    return ['SUPER_ADMIN', 'RULE_ADMIN', 'RULE_MANAGER'].includes(userRole);
  }

  /**
   * Check if user can create rule roles
   */
  static canCreateRoles(userRole: string): boolean {
    return ['SUPER_ADMIN', 'RULE_ADMIN'].includes(userRole);
  }

  /**
   * Check if user can delete rule roles
   */
  static canDeleteRoles(userRole: string): boolean {
    return ['SUPER_ADMIN', 'RULE_ADMIN'].includes(userRole);
  }

  /**
   * Check if user can update rule roles
   */
  static canUpdateRoles(userRole: string): boolean {
    return ['SUPER_ADMIN', 'RULE_ADMIN'].includes(userRole);
  }

  /**
   * Check if user can create rule permissions
   */
  static canCreatePermissions(userRole: string): boolean {
    return ['SUPER_ADMIN', 'RULE_ADMIN'].includes(userRole);
  }

  /**
   * Check if user can delete rule permissions
   */
  static canDeletePermissions(userRole: string): boolean {
    return ['SUPER_ADMIN', 'RULE_ADMIN'].includes(userRole);
  }

  /**
   * Check if user can update rule permissions
   */
  static canUpdatePermissions(userRole: string): boolean {
    return ['SUPER_ADMIN', 'RULE_ADMIN'].includes(userRole);
  }

  /**
   * Check if user can approve rules
   */
  static canApproveRules(userRole: string): boolean {
    return ['SUPER_ADMIN', 'RULE_ADMIN', 'RULE_MANAGER'].includes(userRole);
  }

  /**
   * Check if user can publish rules
   */
  static canPublishRules(userRole: string): boolean {
    return ['SUPER_ADMIN', 'RULE_ADMIN', 'RULE_MANAGER'].includes(userRole);
  }

  /**
   * Check if user can export rule data
   */
  static canExportData(userRole: string): boolean {
    return ['SUPER_ADMIN', 'RULE_ADMIN', 'RULE_MANAGER'].includes(userRole);
  }

  /**
   * Check if user can import rule data
   */
  static canImportData(userRole: string): boolean {
    return ['SUPER_ADMIN', 'RULE_ADMIN'].includes(userRole);
  }

  /**
   * Default Rule Role Permission Sets
   */
  private static readonly RULE_ROLE_PERMISSIONS = [
    {
      role: 'RULE_ADMIN',
      permissions: [
        // Markup Management - Full Access
        'rules:markup:markup_rules:manage',
        'rules:markup:markup_rules:view',
        'rules:markup:markup_rules:create',
        'rules:markup:markup_rules:update',
        'rules:markup:markup_rules:delete',
        'rules:markup:markup_rules:approve',
        'rules:markup:markup_rules:publish',
        'rules:markup:rule_analytics:manage',
        'rules:markup:rule_audit:manage',
        
        // Commission Management - Full Access
        'rules:commission:commission_rules:manage',
        'rules:commission:commission_rules:view',
        'rules:commission:commission_rules:create',
        'rules:commission:commission_rules:update',
        'rules:commission:commission_rules:delete',
        'rules:commission:commission_rules:approve',
        'rules:commission:commission_rules:publish',
        'rules:commission:rule_analytics:manage',
        'rules:commission:rule_audit:manage',
        
        // Coupon Management - Full Access
        'rules:coupon:coupon_campaigns:manage',
        'rules:coupon:coupon_campaigns:view',
        'rules:coupon:coupon_campaigns:create',
        'rules:coupon:coupon_campaigns:update',
        'rules:coupon:coupon_campaigns:delete',
        'rules:coupon:coupon_campaigns:approve',
        'rules:coupon:coupon_campaigns:publish',
        'rules:coupon:rule_analytics:manage',
        'rules:coupon:rule_audit:manage',
        
        // Airline Deals Management - Full Access
        'rules:airline_deal:airline_deals:manage',
        'rules:airline_deal:airline_deals:view',
        'rules:airline_deal:airline_deals:create',
        'rules:airline_deal:airline_deals:update',
        'rules:airline_deal:airline_deals:delete',
        'rules:airline_deal:airline_deals:approve',
        'rules:airline_deal:airline_deals:publish',
        'rules:airline_deal:rule_analytics:manage',
        'rules:airline_deal:rule_audit:manage',
        
        // Global Rule Management
        'rules:markup:rule_templates:manage',
        'rules:commission:rule_templates:manage',
        'rules:coupon:rule_templates:manage',
        'rules:airline_deal:rule_templates:manage',
        'rules:markup:rule_approvals:manage',
        'rules:commission:rule_approvals:manage',
        'rules:coupon:rule_approvals:manage',
        'rules:airline_deal:rule_approvals:manage'
      ]
    },
    {
      role: 'RULE_MANAGER',
      permissions: [
        // Markup Management - Management Access
        'rules:markup:markup_rules:view',
        'rules:markup:markup_rules:create',
        'rules:markup:markup_rules:update',
        'rules:markup:markup_rules:approve',
        'rules:markup:markup_rules:publish',
        'rules:markup:rule_analytics:view',
        
        // Commission Management - Management Access
        'rules:commission:commission_rules:view',
        'rules:commission:commission_rules:create',
        'rules:commission:commission_rules:update',
        'rules:commission:commission_rules:approve',
        'rules:commission:commission_rules:publish',
        'rules:commission:rule_analytics:view',
        
        // Coupon Management - Management Access
        'rules:coupon:coupon_campaigns:view',
        'rules:coupon:coupon_campaigns:create',
        'rules:coupon:coupon_campaigns:update',
        'rules:coupon:coupon_campaigns:approve',
        'rules:coupon:coupon_campaigns:publish',
        'rules:coupon:rule_analytics:view',
        
        // Airline Deals Management - Management Access
        'rules:airline_deal:airline_deals:view',
        'rules:airline_deal:airline_deals:create',
        'rules:airline_deal:airline_deals:update',
        'rules:airline_deal:airline_deals:approve',
        'rules:airline_deal:airline_deals:publish',
        'rules:airline_deal:rule_analytics:view'
      ]
    },
    {
      role: 'RULE_USER',
      permissions: [
        // Markup Management - Create and View
        'rules:markup:markup_rules:view',
        'rules:markup:markup_rules:create',
        'rules:markup:markup_rules:update',
        'rules:markup:rule_analytics:view',
        
        // Commission Management - Create and View
        'rules:commission:commission_rules:view',
        'rules:commission:commission_rules:create',
        'rules:commission:commission_rules:update',
        'rules:commission:rule_analytics:view',
        
        // Coupon Management - Create and View
        'rules:coupon:coupon_campaigns:view',
        'rules:coupon:coupon_campaigns:create',
        'rules:coupon:coupon_campaigns:update',
        'rules:coupon:rule_analytics:view',
        
        // Airline Deals Management - Create and View
        'rules:airline_deal:airline_deals:view',
        'rules:airline_deal:airline_deals:create',
        'rules:airline_deal:airline_deals:update',
        'rules:airline_deal:rule_analytics:view'
      ]
    },
    {
      role: 'RULE_VIEWER',
      permissions: [
        // Markup Management - View Only
        'rules:markup:markup_rules:view',
        'rules:markup:rule_analytics:view',
        
        // Commission Management - View Only
        'rules:commission:commission_rules:view',
        'rules:commission:rule_analytics:view',
        
        // Coupon Management - View Only
        'rules:coupon:coupon_campaigns:view',
        'rules:coupon:rule_analytics:view',
        
        // Airline Deals Management - View Only
        'rules:airline_deal:airline_deals:view',
        'rules:airline_deal:rule_analytics:view'
      ]
    }
  ];
}

// Rule Permission Level
export enum RulePermissionLevel {
  GLOBAL = 'global',      // Access to all companies
  COMPANY = 'company',    // Access to specific company
  DEPARTMENT = 'department', // Access to specific department
  USER = 'user'           // Access to own resources only
}

// Rule Permission Error Types
export enum RulePermissionErrorType {
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED = 'ACCESS_DENIED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  INVALID_ROLE = 'INVALID_ROLE'
}

// Rule Permission Error
export class RulePermissionError extends Error {
  constructor(
    public type: RulePermissionErrorType,
    public message: string,
    public requiredPermissions: string[],
    public userPermissions: string[]
  ) {
    super(message);
    this.name = 'RulePermissionError';
  }
}

// Rule Permission Constants
export const RULE_PERMISSIONS = {
  // Markup Permissions
  MARKUP_VIEW: 'rules:markup:markup_rules:view',
  MARKUP_CREATE: 'rules:markup:markup_rules:create',
  MARKUP_EDIT: 'rules:markup:markup_rules:update',
  MARKUP_DELETE: 'rules:markup:markup_rules:delete',
  MARKUP_MANAGE: 'rules:markup:markup_rules:manage',
  MARKUP_APPROVE: 'rules:markup:markup_rules:approve',
  MARKUP_PUBLISH: 'rules:markup:markup_rules:publish',
  MARKUP_ANALYZE: 'rules:markup:rule_analytics:manage',
  
  // Commission Permissions
  COMMISSION_VIEW: 'rules:commission:commission_rules:view',
  COMMISSION_CREATE: 'rules:commission:commission_rules:create',
  COMMISSION_EDIT: 'rules:commission:commission_rules:update',
  COMMISSION_DELETE: 'rules:commission:commission_rules:delete',
  COMMISSION_MANAGE: 'rules:commission:commission_rules:manage',
  COMMISSION_APPROVE: 'rules:commission:commission_rules:approve',
  COMMISSION_PUBLISH: 'rules:commission:commission_rules:publish',
  COMMISSION_ANALYZE: 'rules:commission:rule_analytics:manage',
  
  // Coupon Permissions
  COUPON_VIEW: 'rules:coupon:coupon_campaigns:view',
  COUPON_CREATE: 'rules:coupon:coupon_campaigns:create',
  COUPON_EDIT: 'rules:coupon:coupon_campaigns:update',
  COUPON_DELETE: 'rules:coupon:coupon_campaigns:delete',
  COUPON_MANAGE: 'rules:coupon:coupon_campaigns:manage',
  COUPON_APPROVE: 'rules:coupon:coupon_campaigns:approve',
  COUPON_PUBLISH: 'rules:coupon:coupon_campaigns:publish',
  COUPON_ANALYZE: 'rules:coupon:rule_analytics:manage',
  
  // Airline Deal Permissions
  AIRLINE_DEAL_VIEW: 'rules:airline_deal:airline_deals:view',
  AIRLINE_DEAL_CREATE: 'rules:airline_deal:airline_deals:create',
  AIRLINE_DEAL_EDIT: 'rules:airline_deal:airline_deals:update',
  AIRLINE_DEAL_DELETE: 'rules:airline_deal:airline_deals:delete',
  AIRLINE_DEAL_MANAGE: 'rules:airline_deal:airline_deals:manage',
  AIRLINE_DEAL_APPROVE: 'rules:airline_deal:airline_deals:approve',
  AIRLINE_DEAL_PUBLISH: 'rules:airline_deal:airline_deals:publish',
  AIRLINE_DEAL_ANALYZE: 'rules:airline_deal:rule_analytics:manage',
  
  // Global Permissions
  RULE_EXPORT: 'rules:markup:rule_analytics:export',
  RULE_IMPORT: 'rules:markup:rule_analytics:import',
  RULE_AUDIT: 'rules:markup:rule_audit:manage'
} as const;