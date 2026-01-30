import { RULE_PERMISSIONS } from '../types/rulePermissions';

/**
 * Permission utilities for rule management operations
 * Provides helper functions for working with rule permissions
 */

export interface PermissionCheckResult {
  hasPermission: boolean;
  missingPermissions: string[];
  requiredPermissions: string[];
}

/**
 * Permission utility functions for rule management
 */
export class RulePermissionUtils {
  /**
   * Check if user has a specific permission
   */
  static hasPermission(userPermissions: string[], permission: string): boolean {
    return userPermissions.includes(permission);
  }

  /**
   * Check if user has any of the required permissions
   */
  static hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
  }

  /**
   * Check if user has all required permissions
   */
  static hasAllPermissions(userPermissions: string[], requiredPermissions: string[]): boolean {
    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
  }

  /**
   * Check permissions with detailed result
   */
  static checkPermissions(
    userPermissions: string[], 
    requiredPermissions: string[], 
    requireAll: boolean = false
  ): PermissionCheckResult {
    const missingPermissions: string[] = [];
    
    if (requireAll) {
      for (const permission of requiredPermissions) {
        if (!userPermissions.includes(permission)) {
          missingPermissions.push(permission);
        }
      }
    } else {
      const hasAny = requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );
      
      if (!hasAny) {
        missingPermissions.push(...requiredPermissions);
      }
    }

    return {
      hasPermission: missingPermissions.length === 0,
      missingPermissions,
      requiredPermissions
    };
  }

  /**
   * Get all permissions for a specific rule category
   */
  static getPermissionsForCategory(category: string): string[] {
    const categoryMap: Record<string, string[]> = {
      'markup': [
        RULE_PERMISSIONS.MARKUP_VIEW,
        RULE_PERMISSIONS.MARKUP_CREATE,
        RULE_PERMISSIONS.MARKUP_EDIT,
        RULE_PERMISSIONS.MARKUP_DELETE,
        RULE_PERMISSIONS.MARKUP_MANAGE
      ],
      'commission': [
        RULE_PERMISSIONS.COMMISSION_VIEW,
        RULE_PERMISSIONS.COMMISSION_CREATE,
        RULE_PERMISSIONS.COMMISSION_EDIT,
        RULE_PERMISSIONS.COMMISSION_DELETE,
        RULE_PERMISSIONS.COMMISSION_MANAGE
      ],
      'coupon': [
        RULE_PERMISSIONS.COUPON_VIEW,
        RULE_PERMISSIONS.COUPON_CREATE,
        RULE_PERMISSIONS.COUPON_EDIT,
        RULE_PERMISSIONS.COUPON_DELETE,
        RULE_PERMISSIONS.COUPON_MANAGE
      ],
      'airline_deal': [
        RULE_PERMISSIONS.AIRLINE_DEAL_VIEW,
        RULE_PERMISSIONS.AIRLINE_DEAL_CREATE,
        RULE_PERMISSIONS.AIRLINE_DEAL_EDIT,
        RULE_PERMISSIONS.AIRLINE_DEAL_DELETE,
        RULE_PERMISSIONS.AIRLINE_DEAL_MANAGE
      ]
    };

    return categoryMap[category] || [];
  }

  /**
   * Get all permissions for a specific operation
   */
  static getPermissionsForOperation(operation: string): string[] {
    const operationMap: Record<string, string[]> = {
      'view': [
        RULE_PERMISSIONS.MARKUP_VIEW,
        RULE_PERMISSIONS.COMMISSION_VIEW,
        RULE_PERMISSIONS.COUPON_VIEW,
        RULE_PERMISSIONS.AIRLINE_DEAL_VIEW
      ],
      'create': [
        RULE_PERMISSIONS.MARKUP_CREATE,
        RULE_PERMISSIONS.COMMISSION_CREATE,
        RULE_PERMISSIONS.COUPON_CREATE,
        RULE_PERMISSIONS.AIRLINE_DEAL_CREATE
      ],
      'edit': [
        RULE_PERMISSIONS.MARKUP_EDIT,
        RULE_PERMISSIONS.COMMISSION_EDIT,
        RULE_PERMISSIONS.COUPON_EDIT,
        RULE_PERMISSIONS.AIRLINE_DEAL_EDIT
      ],
      'delete': [
        RULE_PERMISSIONS.MARKUP_DELETE,
        RULE_PERMISSIONS.COMMISSION_DELETE,
        RULE_PERMISSIONS.COUPON_DELETE,
        RULE_PERMISSIONS.AIRLINE_DEAL_DELETE
      ],
      'manage': [
        RULE_PERMISSIONS.MARKUP_MANAGE,
        RULE_PERMISSIONS.COMMISSION_MANAGE,
        RULE_PERMISSIONS.COUPON_MANAGE,
        RULE_PERMISSIONS.AIRLINE_DEAL_MANAGE,
        RULE_PERMISSIONS.RULE_AUDIT
      ]
    };

    return operationMap[operation] || [];
  }

  /**
   * Check if user can perform a specific operation on any rule category
   */
  static canPerformOperation(userPermissions: string[], operation: string): boolean {
    const operationPermissions = this.getPermissionsForOperation(operation);
    return this.hasAnyPermission(userPermissions, operationPermissions);
  }

  /**
   * Check if user can perform any operation on a specific rule category
   */
  static canManageCategory(userPermissions: string[], category: string): boolean {
    const categoryPermissions = this.getPermissionsForCategory(category);
    return this.hasAnyPermission(userPermissions, categoryPermissions);
  }

  /**
   * Get user's effective permissions for rule management
   */
  static getEffectivePermissions(userPermissions: string[]): string[] {
    const allowed = new Set<string>(Object.values(RULE_PERMISSIONS));
    return userPermissions.filter(permission => allowed.has(permission));
  }

  /**
   * Check if user has admin-level permissions for rules
   */
  static isAdmin(userPermissions: string[]): boolean {
    return this.hasPermission(userPermissions, RULE_PERMISSIONS.RULE_AUDIT);
  }

  /**
   * Check if user has read-only access to rules
   */
  static canViewRules(userPermissions: string[]): boolean {
    return this.hasAnyPermission(userPermissions, [
      RULE_PERMISSIONS.MARKUP_VIEW,
      RULE_PERMISSIONS.COMMISSION_VIEW,
      RULE_PERMISSIONS.COUPON_VIEW,
      RULE_PERMISSIONS.AIRLINE_DEAL_VIEW
    ]);
  }

  /**
   * Check if user can create rules
   */
  static canCreateRules(userPermissions: string[]): boolean {
    return this.hasAnyPermission(userPermissions, [
      RULE_PERMISSIONS.MARKUP_CREATE,
      RULE_PERMISSIONS.COMMISSION_CREATE,
      RULE_PERMISSIONS.COUPON_CREATE,
      RULE_PERMISSIONS.AIRLINE_DEAL_CREATE
    ]);
  }

  /**
   * Check if user can edit rules
   */
  static canEditRules(userPermissions: string[]): boolean {
    return this.hasAnyPermission(userPermissions, [
      RULE_PERMISSIONS.MARKUP_EDIT,
      RULE_PERMISSIONS.COMMISSION_EDIT,
      RULE_PERMISSIONS.COUPON_EDIT,
      RULE_PERMISSIONS.AIRLINE_DEAL_EDIT
    ]);
  }

  /**
   * Check if user can delete rules
   */
  static canDeleteRules(userPermissions: string[]): boolean {
    return this.hasAnyPermission(userPermissions, [
      RULE_PERMISSIONS.MARKUP_DELETE,
      RULE_PERMISSIONS.COMMISSION_DELETE,
      RULE_PERMISSIONS.COUPON_DELETE,
      RULE_PERMISSIONS.AIRLINE_DEAL_DELETE
    ]);
  }

  /**
   * Get permission hierarchy for a user
   */
  static getPermissionHierarchy(userPermissions: string[]): {
    admin: boolean;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    categories: {
      markup: boolean;
      commission: boolean;
      coupon: boolean;
      airlineDeal: boolean;
    };
    operations: {
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
      manage: boolean;
    };
  } {
    return {
      admin: this.isAdmin(userPermissions),
      canView: this.canViewRules(userPermissions),
      canCreate: this.canCreateRules(userPermissions),
      canEdit: this.canEditRules(userPermissions),
      canDelete: this.canDeleteRules(userPermissions),
      categories: {
        markup: this.canManageCategory(userPermissions, 'markup'),
        commission: this.canManageCategory(userPermissions, 'commission'),
        coupon: this.canManageCategory(userPermissions, 'coupon'),
        airlineDeal: this.canManageCategory(userPermissions, 'airline_deal')
      },
      operations: {
        view: this.canPerformOperation(userPermissions, 'view'),
        create: this.canPerformOperation(userPermissions, 'create'),
        edit: this.canPerformOperation(userPermissions, 'edit'),
        delete: this.canPerformOperation(userPermissions, 'delete'),
        manage: this.canPerformOperation(userPermissions, 'manage')
      }
    };
  }

  /**
   * Validate permission format
   */
  static isValidPermission(permission: string): boolean {
    const validPermissionPattern = /^rule:(markup|commission|coupon|airline_deal):(view|create|edit|delete|manage)$/;
    return validPermissionPattern.test(permission);
  }

  /**
   * Normalize permission string
   */
  static normalizePermission(permission: string): string {
    return permission.toLowerCase().trim();
  }

  /**
   * Get permission suggestions for a user based on their current permissions
   */
  static getSuggestions(userPermissions: string[]): {
    missingAdmin: boolean;
    missingCategories: string[];
    missingOperations: string[];
    recommendations: string[];
  } {
    const effectivePermissions = this.getEffectivePermissions(userPermissions);
    const hierarchy = this.getPermissionHierarchy(userPermissions);

    const missingCategories: string[] = [];
    const missingOperations: string[] = [];

    if (!hierarchy.categories.markup) missingCategories.push('markup');
    if (!hierarchy.categories.commission) missingCategories.push('commission');
    if (!hierarchy.categories.coupon) missingCategories.push('coupon');
    if (!hierarchy.categories.airlineDeal) missingCategories.push('airline_deal');

    if (!hierarchy.operations.view) missingOperations.push('view');
    if (!hierarchy.operations.create) missingOperations.push('create');
    if (!hierarchy.operations.edit) missingOperations.push('edit');
    if (!hierarchy.operations.delete) missingOperations.push('delete');
    if (!hierarchy.operations.manage) missingOperations.push('manage');

    const recommendations: string[] = [];

    if (!hierarchy.admin) {
      recommendations.push('Consider granting admin permissions for full rule management access');
    }

    if (missingCategories.length > 0) {
      recommendations.push(`Consider granting permissions for: ${missingCategories.join(', ')}`);
    }

    if (missingOperations.length > 0) {
      recommendations.push(`Consider granting permissions for operations: ${missingOperations.join(', ')}`);
    }

    return {
      missingAdmin: !hierarchy.admin,
      missingCategories,
      missingOperations,
      recommendations
    };
  }

  /**
   * Check if permissions are sufficient for a specific rule operation
   */
  static checkRuleOperation(
    userPermissions: string[],
    category: string,
    operation: string
  ): PermissionCheckResult {
    const categoryPermissions = this.getPermissionsForCategory(category);
    const operationPermissions = this.getPermissionsForOperation(operation);
    
    // Find the intersection of category and operation permissions
    const matchingPermissions = categoryPermissions.filter(permission => 
      operationPermissions.includes(permission)
    );

    return this.checkPermissions(userPermissions, matchingPermissions);
  }

  /**
   * Get all available rule permissions
   */
  static getAllPermissions(): string[] {
    return Object.values(RULE_PERMISSIONS);
  }

  /**
   * Get permissions grouped by category
   */
  static getPermissionsByCategory(): Record<string, string[]> {
    const categories = ['markup', 'commission', 'coupon', 'airline_deal'];
    const result: Record<string, string[]> = {};

    for (const category of categories) {
      result[category] = this.getPermissionsForCategory(category);
    }

    return result;
  }

  /**
   * Get permissions grouped by operation
   */
  static getPermissionsByOperation(): Record<string, string[]> {
    const operations = ['view', 'create', 'edit', 'delete', 'manage'];
    const result: Record<string, string[]> = {};

    for (const operation of operations) {
      result[operation] = this.getPermissionsForOperation(operation);
    }

    return result;
  }
}

/**
 * Permission validation middleware
 */
export class PermissionValidator {
  /**
   * Validate that a permission string is valid
   */
  static validatePermission(permission: string): { isValid: boolean; error?: string } {
    if (!permission || typeof permission !== 'string') {
      return { isValid: false, error: 'Permission must be a non-empty string' };
    }

    if (!RulePermissionUtils.isValidPermission(permission)) {
      return { isValid: false, error: 'Invalid permission format' };
    }

    return { isValid: true };
  }

  /**
   * Validate a list of permissions
   */
  static validatePermissions(permissions: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(permissions)) {
      return { isValid: false, errors: ['Permissions must be an array'] };
    }

    for (let i = 0; i < permissions.length; i++) {
      const permission = permissions[i];
      const validation = this.validatePermission(permission);
      
      if (!validation.isValid) {
        errors.push(`Permission at index ${i}: ${validation.error}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Normalize and validate permissions
   */
  static normalizeAndValidate(permissions: string[]): { normalized: string[]; errors: string[] } {
    const normalized = permissions
      .map(permission => RulePermissionUtils.normalizePermission(permission))
      .filter(permission => permission.length > 0);

    const validation = this.validatePermissions(normalized);

    return {
      normalized,
      errors: validation.errors
    };
  }
}

// Export utility functions for convenience
export const {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  checkPermissions,
  getPermissionsForCategory,
  getPermissionsForOperation,
  canPerformOperation,
  canManageCategory,
  getEffectivePermissions,
  isAdmin,
  canViewRules,
  canCreateRules,
  canEditRules,
  canDeleteRules,
  getPermissionHierarchy,
  isValidPermission,
  normalizePermission,
  getSuggestions,
  checkRuleOperation,
  getAllPermissions,
  getPermissionsByCategory,
  getPermissionsByOperation
} = RulePermissionUtils;

export const {
  validatePermission,
  validatePermissions,
  normalizeAndValidate
} = PermissionValidator;