import { useState, useEffect, useCallback, useMemo } from 'react';
import { RulePermissionUtils, RULE_PERMISSIONS } from '../types/rulePermissions';
import { useAuth } from './useAuth';

// Define the user type based on the mock user structure
interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  permissions: string[];
  avatar: string;
  lastLogin: string;
}

export interface UseRulePermissionsReturn {
  // Permission checking functions
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  
  // Specific permission checks
  canViewRules: boolean;
  canCreateRules: boolean;
  canUpdateRules: boolean;
  canDeleteRules: boolean;
  canManageRules: boolean;
  canApproveRules: boolean;
  canPublishRules: boolean;
  canAnalyzeRules: boolean;
  canExportData: boolean;
  canImportData: boolean;
  
  // Category-specific permissions
  canViewMarkup: boolean;
  canCreateMarkup: boolean;
  canUpdateMarkup: boolean;
  canDeleteMarkup: boolean;
  canManageMarkup: boolean;
  
  canViewCommission: boolean;
  canCreateCommission: boolean;
  canUpdateCommission: boolean;
  canDeleteCommission: boolean;
  canManageCommission: boolean;
  
  canViewCoupons: boolean;
  canCreateCoupons: boolean;
  canUpdateCoupons: boolean;
  canDeleteCoupons: boolean;
  canManageCoupons: boolean;
  
  canViewAirlineDeals: boolean;
  canCreateAirlineDeals: boolean;
  canUpdateAirlineDeals: boolean;
  canDeleteAirlineDeals: boolean;
  canManageAirlineDeals: boolean;
  
  // Utility functions
  getRolePermissions: (role: string) => string[];
  checkPermissionLevel: (
    userRole: string,
    permissionLevel: any,
    userCompanyId?: string,
    targetCompanyId?: string
  ) => boolean;
  
  // Loading state
  isLoading: boolean;
  error: string | null;
  
  // Refresh function
  refreshPermissions: () => void;
  
  // User data
  user: MockUser | null;
}

export function useRulePermissions(): UseRulePermissionsReturn {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Permission checking functions
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user || !user.permissions || user.permissions.length === 0) return false;
    return RulePermissionUtils.hasPermission(user.permissions, permission);
  }, [user]);

  const hasAnyPermission = useCallback((requiredPermissions: string[]): boolean => {
    if (!user || !user.permissions || user.permissions.length === 0) return false;
    return RulePermissionUtils.hasAnyPermission(user.permissions, requiredPermissions);
  }, [user]);

  const hasAllPermissions = useCallback((requiredPermissions: string[]): boolean => {
    if (!user || !user.permissions || user.permissions.length === 0) return false;
    return RulePermissionUtils.hasAllPermissions(user.permissions, requiredPermissions);
  }, [user]);

  // Category-specific permission arrays
  const markupPermissions = useMemo(() => [
    RULE_PERMISSIONS.MARKUP_VIEW,
    RULE_PERMISSIONS.MARKUP_CREATE,
    RULE_PERMISSIONS.MARKUP_EDIT,
    RULE_PERMISSIONS.MARKUP_DELETE,
    RULE_PERMISSIONS.MARKUP_MANAGE
  ], []);

  const commissionPermissions = useMemo(() => [
    RULE_PERMISSIONS.COMMISSION_VIEW,
    RULE_PERMISSIONS.COMMISSION_CREATE,
    RULE_PERMISSIONS.COMMISSION_EDIT,
    RULE_PERMISSIONS.COMMISSION_DELETE,
    RULE_PERMISSIONS.COMMISSION_MANAGE
  ], []);

  const couponPermissions = useMemo(() => [
    RULE_PERMISSIONS.COUPON_VIEW,
    RULE_PERMISSIONS.COUPON_CREATE,
    RULE_PERMISSIONS.COUPON_EDIT,
    RULE_PERMISSIONS.COUPON_DELETE,
    RULE_PERMISSIONS.COUPON_MANAGE
  ], []);

  const airlineDealPermissions = useMemo(() => [
    RULE_PERMISSIONS.AIRLINE_DEAL_VIEW,
    RULE_PERMISSIONS.AIRLINE_DEAL_CREATE,
    RULE_PERMISSIONS.AIRLINE_DEAL_EDIT,
    RULE_PERMISSIONS.AIRLINE_DEAL_DELETE,
    RULE_PERMISSIONS.AIRLINE_DEAL_MANAGE
  ], []);

  // Specific permission checks
  const canViewRules = useMemo(() => 
    hasAnyPermission([
      RULE_PERMISSIONS.MARKUP_VIEW,
      RULE_PERMISSIONS.COMMISSION_VIEW,
      RULE_PERMISSIONS.COUPON_VIEW,
      RULE_PERMISSIONS.AIRLINE_DEAL_VIEW
    ]), [hasAnyPermission]);

  const canCreateRules = useMemo(() => 
    hasAnyPermission([
      RULE_PERMISSIONS.MARKUP_CREATE,
      RULE_PERMISSIONS.COMMISSION_CREATE,
      RULE_PERMISSIONS.COUPON_CREATE,
      RULE_PERMISSIONS.AIRLINE_DEAL_CREATE
    ]), [hasAnyPermission]);

  const canUpdateRules = useMemo(() => 
    hasAnyPermission([
      RULE_PERMISSIONS.MARKUP_EDIT,
      RULE_PERMISSIONS.COMMISSION_EDIT,
      RULE_PERMISSIONS.COUPON_EDIT,
      RULE_PERMISSIONS.AIRLINE_DEAL_EDIT
    ]), [hasAnyPermission]);

  const canDeleteRules = useMemo(() => 
    hasAnyPermission([
      RULE_PERMISSIONS.MARKUP_DELETE,
      RULE_PERMISSIONS.COMMISSION_DELETE,
      RULE_PERMISSIONS.COUPON_DELETE,
      RULE_PERMISSIONS.AIRLINE_DEAL_DELETE
    ]), [hasAnyPermission]);

  const canManageRules = useMemo(() => 
    hasAnyPermission([
      RULE_PERMISSIONS.MARKUP_MANAGE,
      RULE_PERMISSIONS.COMMISSION_MANAGE,
      RULE_PERMISSIONS.COUPON_MANAGE,
      RULE_PERMISSIONS.AIRLINE_DEAL_MANAGE
    ]), [hasAnyPermission]);

  const canApproveRules = useMemo(() => 
    hasAnyPermission([
      RULE_PERMISSIONS.MARKUP_APPROVE,
      RULE_PERMISSIONS.COMMISSION_APPROVE,
      RULE_PERMISSIONS.COUPON_APPROVE,
      RULE_PERMISSIONS.AIRLINE_DEAL_APPROVE
    ]), [hasAnyPermission]);

  const canPublishRules = useMemo(() => 
    hasAnyPermission([
      RULE_PERMISSIONS.MARKUP_PUBLISH,
      RULE_PERMISSIONS.COMMISSION_PUBLISH,
      RULE_PERMISSIONS.COUPON_PUBLISH,
      RULE_PERMISSIONS.AIRLINE_DEAL_PUBLISH
    ]), [hasAnyPermission]);

  const canAnalyzeRules = useMemo(() => 
    hasAnyPermission([
      RULE_PERMISSIONS.MARKUP_ANALYZE,
      RULE_PERMISSIONS.COMMISSION_ANALYZE,
      RULE_PERMISSIONS.COUPON_ANALYZE,
      RULE_PERMISSIONS.AIRLINE_DEAL_ANALYZE
    ]), [hasAnyPermission]);

  const canExportData = useMemo(() => 
    hasPermission(RULE_PERMISSIONS.RULE_EXPORT), [hasPermission]);

  const canImportData = useMemo(() => 
    hasPermission(RULE_PERMISSIONS.RULE_IMPORT), [hasPermission]);

  // Category-specific permissions
  const canViewMarkup = useMemo(() => hasPermission(RULE_PERMISSIONS.MARKUP_VIEW), [hasPermission]);
  const canCreateMarkup = useMemo(() => hasPermission(RULE_PERMISSIONS.MARKUP_CREATE), [hasPermission]);
  const canUpdateMarkup = useMemo(() => hasPermission(RULE_PERMISSIONS.MARKUP_EDIT), [hasPermission]);
  const canDeleteMarkup = useMemo(() => hasPermission(RULE_PERMISSIONS.MARKUP_DELETE), [hasPermission]);
  const canManageMarkup = useMemo(() => hasPermission(RULE_PERMISSIONS.MARKUP_MANAGE), [hasPermission]);

  const canViewCommission = useMemo(() => hasPermission(RULE_PERMISSIONS.COMMISSION_VIEW), [hasPermission]);
  const canCreateCommission = useMemo(() => hasPermission(RULE_PERMISSIONS.COMMISSION_CREATE), [hasPermission]);
  const canUpdateCommission = useMemo(() => hasPermission(RULE_PERMISSIONS.COMMISSION_EDIT), [hasPermission]);
  const canDeleteCommission = useMemo(() => hasPermission(RULE_PERMISSIONS.COMMISSION_DELETE), [hasPermission]);
  const canManageCommission = useMemo(() => hasPermission(RULE_PERMISSIONS.COMMISSION_MANAGE), [hasPermission]);

  const canViewCoupons = useMemo(() => hasPermission(RULE_PERMISSIONS.COUPON_VIEW), [hasPermission]);
  const canCreateCoupons = useMemo(() => hasPermission(RULE_PERMISSIONS.COUPON_CREATE), [hasPermission]);
  const canUpdateCoupons = useMemo(() => hasPermission(RULE_PERMISSIONS.COUPON_EDIT), [hasPermission]);
  const canDeleteCoupons = useMemo(() => hasPermission(RULE_PERMISSIONS.COUPON_DELETE), [hasPermission]);
  const canManageCoupons = useMemo(() => hasPermission(RULE_PERMISSIONS.COUPON_MANAGE), [hasPermission]);

  const canViewAirlineDeals = useMemo(() => hasPermission(RULE_PERMISSIONS.AIRLINE_DEAL_VIEW), [hasPermission]);
  const canCreateAirlineDeals = useMemo(() => hasPermission(RULE_PERMISSIONS.AIRLINE_DEAL_CREATE), [hasPermission]);
  const canUpdateAirlineDeals = useMemo(() => hasPermission(RULE_PERMISSIONS.AIRLINE_DEAL_EDIT), [hasPermission]);
  const canDeleteAirlineDeals = useMemo(() => hasPermission(RULE_PERMISSIONS.AIRLINE_DEAL_DELETE), [hasPermission]);
  const canManageAirlineDeals = useMemo(() => hasPermission(RULE_PERMISSIONS.AIRLINE_DEAL_MANAGE), [hasPermission]);

  // Utility functions
  const getRolePermissions = useCallback((role: string): string[] => {
    return RulePermissionUtils.getRolePermissions(role);
  }, []);

  const checkPermissionLevel = useCallback((
    userRole: string,
    permissionLevel: any,
    userCompanyId?: string,
    targetCompanyId?: string
  ): boolean => {
    return RulePermissionUtils.checkPermissionLevel(
      userRole,
      permissionLevel,
      userCompanyId,
      targetCompanyId
    );
  }, []);

  // Refresh function
  const refreshPermissions = useCallback(() => {
    // This would typically trigger a refresh of permissions from the server
    // For now, we'll just clear any errors
    setError(null);
  }, []);

  // Combine loading states
  const isLoading = useMemo(() => authLoading || loading, [authLoading, loading]);

  // Combine errors
  const combinedError = useMemo(() => {
    return error;
  }, [error]);

  return {
    // Permission checking functions
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Specific permission checks
    canViewRules,
    canCreateRules,
    canUpdateRules,
    canDeleteRules,
    canManageRules,
    canApproveRules,
    canPublishRules,
    canAnalyzeRules,
    canExportData,
    canImportData,
    
    // Category-specific permissions
    canViewMarkup,
    canCreateMarkup,
    canUpdateMarkup,
    canDeleteMarkup,
    canManageMarkup,
    
    canViewCommission,
    canCreateCommission,
    canUpdateCommission,
    canDeleteCommission,
    canManageCommission,
    
    canViewCoupons,
    canCreateCoupons,
    canUpdateCoupons,
    canDeleteCoupons,
    canManageCoupons,
    
    canViewAirlineDeals,
    canCreateAirlineDeals,
    canUpdateAirlineDeals,
    canDeleteAirlineDeals,
    canManageAirlineDeals,
    
    // Utility functions
    getRolePermissions,
    checkPermissionLevel,
    
    // Loading state
    isLoading,
    error: combinedError,
    
    // Refresh function
    refreshPermissions,
    
    // User data
    user
  };
}

// Hook for checking specific rule permissions with memoization
export function useRulePermission(permission: string): boolean {
  const { hasPermission } = useRulePermissions();
  
  return useMemo(() => hasPermission(permission), [hasPermission, permission]);
}

// Hook for checking multiple rule permissions
export function useRulePermissionsCheck(permissions: string[]): boolean {
  const { hasAllPermissions } = useRulePermissions();
  
  return useMemo(() => hasAllPermissions(permissions), [hasAllPermissions, permissions]);
}

// Hook for checking if user has any of the specified rule permissions
export function useRulePermissionsAny(permissions: string[]): boolean {
  const { hasAnyPermission } = useRulePermissions();
  
  return useMemo(() => hasAnyPermission(permissions), [hasAnyPermission, permissions]);
}

// Hook for getting rule permission status with detailed information
export interface RulePermissionStatus {
  granted: boolean;
  reason?: string;
  requiredPermissions: string[];
  userPermissions: string[];
}

export function useRulePermissionStatus(permission: string): RulePermissionStatus {
  const { hasPermission, user } = useRulePermissions();
  
  return useMemo(() => ({
    granted: hasPermission(permission),
    reason: hasPermission(permission) ? 'User has required permission' : 'User lacks required permission',
    requiredPermissions: [permission],
    userPermissions: user?.permissions || []
  }), [hasPermission, permission, user?.permissions]);
}
