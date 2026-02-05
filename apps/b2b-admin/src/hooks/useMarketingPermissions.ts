import { useQuery } from 'react-query';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MarketingPermissionResponse, 
  MarketingPermissionValidationRequest,
  MARKETING_PERMISSIONS,
  MarketingPermissionUtils
} from '@/types/marketingPermissions';

/**
 * Custom hook for managing marketing permissions
 */
export const useMarketingPermissions = () => {
  const { userId } = useAuth();

  // Get user permissions from existing permission service
  const { data: userPermissions, isLoading: permissionsLoading } = useQuery(
    ['user-permissions', userId],
    async () => {
      // Use existing permission service to get user permissions
      const response = await fetch(`/api/permissions/user/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user permissions');
      }
      const result = await response.json();
      return result.data?.permissions || [];
    },
    {
      enabled: !!userId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  /**
   * Check if user has specific marketing permission
   */
  const hasPermission = (permission: string): boolean => {
    if (!userPermissions) return false;
    return MarketingPermissionUtils.hasPermission(userPermissions, permission);
  };

  /**
   * Check if user has any of the required permissions
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!userPermissions) return false;
    return MarketingPermissionUtils.hasAnyPermission(userPermissions, permissions);
  };

  /**
   * Check if user has all required permissions
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!userPermissions) return false;
    return MarketingPermissionUtils.hasAllPermissions(userPermissions, permissions);
  };

  /**
   * Validate multiple permissions at once
   */
  const validatePermissions = async (permissions: string[]): Promise<MarketingPermissionResponse> => {
    if (!userId) {
      return {
        granted: false,
        reason: 'User not authenticated',
        requiredPermissions: permissions,
        userPermissions: []
      };
    }

    const request: MarketingPermissionValidationRequest = {
      userId,
      permissions
    };

    try {
      const response = await fetch('/api/marketing/permissions/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Permission validation failed');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      return {
        granted: false,
        reason: 'Failed to validate permissions',
        requiredPermissions: permissions,
        userPermissions: userPermissions || []
      };
    }
  };

  // SEO Permissions
  const canViewSEO = hasPermission(MARKETING_PERMISSIONS.SEO_VIEW);
  const canEditSEO = hasPermission(MARKETING_PERMISSIONS.SEO_EDIT);
  const canPublishSEO = hasPermission(MARKETING_PERMISSIONS.SEO_PUBLISH);

  // Social Media Permissions
  const canViewSocial = hasPermission(MARKETING_PERMISSIONS.SOCIAL_VIEW);
  const canConnectSocial = hasPermission(MARKETING_PERMISSIONS.SOCIAL_CONNECT);
  const canDisconnectSocial = hasPermission(MARKETING_PERMISSIONS.SOCIAL_DISCONNECT);
  const canManageSocial = hasPermission(MARKETING_PERMISSIONS.SOCIAL_MANAGE);

  // Banner Permissions
  const canViewBanners = hasPermission(MARKETING_PERMISSIONS.BANNER_VIEW);
  const canCreateBanners = hasPermission(MARKETING_PERMISSIONS.BANNER_CREATE);
  const canEditBanners = hasPermission(MARKETING_PERMISSIONS.BANNER_EDIT);
  const canDeleteBanners = hasPermission(MARKETING_PERMISSIONS.BANNER_DELETE);
  const canPublishBanners = hasPermission(MARKETING_PERMISSIONS.BANNER_PUBLISH);
  const canManageBanners = hasPermission(MARKETING_PERMISSIONS.BANNER_MANAGE);

  // Affiliate Permissions
  const canViewAffiliates = hasPermission(MARKETING_PERMISSIONS.AFFILIATE_VIEW);
  const canCreateAffiliates = hasPermission(MARKETING_PERMISSIONS.AFFILIATE_CREATE);
  const canEditAffiliates = hasPermission(MARKETING_PERMISSIONS.AFFILIATE_EDIT);
  const canDeleteAffiliates = hasPermission(MARKETING_PERMISSIONS.AFFILIATE_DELETE);
  const canManageCommission = hasPermission(MARKETING_PERMISSIONS.AFFILIATE_COMMISSION);
  const canManageAffiliates = hasPermission(MARKETING_PERMISSIONS.AFFILIATE_MANAGE);

  // Role-based permissions
  const canManageMarketingPermissions = MarketingPermissionUtils.canManagePermissions('SUPER_ADMIN');
  const canViewMarketingAuditLogs = MarketingPermissionUtils.canViewAuditLogs('SUPER_ADMIN');
  const canCreateMarketingRoles = MarketingPermissionUtils.canCreateRoles('SUPER_ADMIN');
  const canDeleteMarketingRoles = MarketingPermissionUtils.canDeleteRoles('SUPER_ADMIN');
  const canUpdateMarketingRoles = MarketingPermissionUtils.canUpdateRoles('SUPER_ADMIN');

  return {
    // Loading state
    isLoading: permissionsLoading,
    
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    validatePermissions,
    
    // SEO permissions
    canViewSEO,
    canEditSEO,
    canPublishSEO,
    
    // Social media permissions
    canViewSocial,
    canConnectSocial,
    canDisconnectSocial,
    canManageSocial,
    
    // Banner permissions
    canViewBanners,
    canCreateBanners,
    canEditBanners,
    canDeleteBanners,
    canPublishBanners,
    canManageBanners,
    
    // Affiliate permissions
    canViewAffiliates,
    canCreateAffiliates,
    canEditAffiliates,
    canDeleteAffiliates,
    canManageCommission,
    canManageAffiliates,
    
    // Management permissions
    canManageMarketingPermissions,
    canViewMarketingAuditLogs,
    canCreateMarketingRoles,
    canDeleteMarketingRoles,
    canUpdateMarketingRoles,
    
    // Utility functions
    getRolePermissions: MarketingPermissionUtils.getRolePermissions,
    getPermissionDescription: MarketingPermissionUtils.getPermissionDescription,
    getRoleDisplayName: MarketingPermissionUtils.getRoleDisplayName,
    getRoleColor: MarketingPermissionUtils.getRoleColor,
  };
};

/**
 * Hook for checking if user has at least one permission from a group
 */
export const useMarketingPermissionGroup = (permissions: string[]) => {
  const { hasAnyPermission } = useMarketingPermissions();
  return hasAnyPermission(permissions);
};

/**
 * Hook for checking if user has all permissions from a group
 */
export const useMarketingPermissionAll = (permissions: string[]) => {
  const { hasAllPermissions } = useMarketingPermissions();
  return hasAllPermissions(permissions);
};

/**
 * Hook for checking if user can perform any marketing action
 */
export const useCanAccessMarketing = () => {
  const { canViewSEO, canViewSocial, canViewBanners, canViewAffiliates } = useMarketingPermissions();
  return canViewSEO || canViewSocial || canViewBanners || canViewAffiliates;
};

/**
 * Hook for checking if user can manage marketing content
 */
export const useCanManageMarketing = () => {
  const { canEditSEO, canManageSocial, canManageBanners, canManageAffiliates } = useMarketingPermissions();
  return canEditSEO || canManageSocial || canManageBanners || canManageAffiliates;
};