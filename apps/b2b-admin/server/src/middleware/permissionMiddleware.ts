/**
 * Permission Middleware
 * Enforces permission checks for all company management routes
 */

import { Request, Response, NextFunction } from 'express';
import { PermissionContext, PermissionResponse, PermissionError, PermissionErrorType, PermissionResource, PermissionAction } from '../types/permissions.js';
import { logger } from '../utils/logger.js';

type AuthRequest = Request<Record<string, any>, any, any> & {
  body?: Record<string, any>;
  user?: {
    userId?: string;
    id?: string;
    role?: string;
    companyId?: string;
    departmentId?: string;
    permissions?: string[];
    [key: string]: unknown;
  };
};

/**
 * Permission Middleware Factory
 * Creates middleware for specific permission checks
 */
export function requirePermission(
  resourceType: string,
  action: string,
  options: {
    requireCompanyAccess?: boolean;
    requireOwnership?: boolean;
    customValidator?: (req: Request, context: PermissionContext) => Promise<boolean>;
  } = {}
) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'UNAUTHORIZED'
        });
        return;
      }

      const user = req.user as {
        id: string;
        role: string;
        companyId?: string;
        departmentId?: string;
        permissions: string[];
      } & Record<string, unknown>;
      const { requireCompanyAccess = true, requireOwnership = false, customValidator } = options;

      // Build permission context
      const context: PermissionContext = {
        userId: user.id,
        companyId: user.companyId,
        departmentId: user.departmentId,
        userRole: user.role,
        userPermissions: user.permissions,
        resourceType: resourceType as PermissionResource,
        action: action as PermissionAction,
        targetCompanyId: req.params.companyId || req.body.companyId || user.companyId,
        targetDepartmentId: req.params.departmentId || req.body.departmentId || user.departmentId
      };

      // Check custom validator first if provided
      if (customValidator) {
        const isValid = await customValidator(req, context);
        if (!isValid) {
          throw new PermissionError(
            PermissionErrorType.ACCESS_DENIED,
            'Custom validation failed',
            [],
            user.permissions
          );
        }
      }

      // Check company access requirement
      if (requireCompanyAccess && !user.companyId) {
        throw new PermissionError(
          PermissionErrorType.ACCESS_DENIED,
          'Company access required',
          [],
          user.permissions
        );
      }

      // Check ownership requirement
      if (requireOwnership) {
        const resourceOwnerId = getResourceOwnerId(req);
        if (resourceOwnerId && resourceOwnerId !== user.id) {
          throw new PermissionError(
            PermissionErrorType.ACCESS_DENIED,
            'Access denied: Resource ownership required',
            [],
            user.permissions
          );
        }
      }

      // Validate permission
      const permissionResponse = await validatePermission(context);

      if (!permissionResponse.granted) {
        logger.warn('Permission denied', {
          userId: user.id,
          userRole: user.role,
          resourceType,
          action,
          requiredPermissions: permissionResponse.requiredPermissions,
          userPermissions: user.permissions,
          reason: permissionResponse.reason
        });

        res.status(403).json({
          success: false,
          message: permissionResponse.reason || 'Insufficient permissions',
          error: 'FORBIDDEN',
          requiredPermissions: permissionResponse.requiredPermissions,
          userPermissions: user.permissions
        });
        return;
      }

      // Permission granted, continue to next middleware
      next();
    } catch (error) {
      logger.error('Permission middleware error', error);

      if (error instanceof PermissionError) {
        res.status(403).json({
          success: false,
          message: error.message,
          error: error.type,
          requiredPermissions: error.requiredPermissions,
          userPermissions: error.userPermissions
        });
        return;
      }

      // Generic error response
      res.status(500).json({
        success: false,
        message: 'Permission validation failed',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
}

/**
 * Permission validation function
 */
async function validatePermission(context: PermissionContext): Promise<PermissionResponse> {
  const { userRole, userPermissions, resourceType, action, targetCompanyId, companyId } = context;

  // Check if user has the SUPER_ADMIN role (bypass most checks)
  if (userRole === 'SUPER_ADMIN') {
    return {
      granted: true,
      requiredPermissions: [],
      userPermissions
    };
  }

  // Build required permission string
  const requiredPermission = buildRequiredPermission(resourceType, action);

  // Check if user has the required permission
  if (!userPermissions.includes(requiredPermission)) {
    return {
      granted: false,
      reason: `Missing required permission: ${requiredPermission}`,
      requiredPermissions: [requiredPermission],
      userPermissions
    };
  }

  // Check company-level access for company-specific resources
  if (targetCompanyId && companyId && targetCompanyId !== companyId) {
    return {
      granted: false,
      reason: 'Access denied: Resource belongs to different company',
      requiredPermissions: [requiredPermission],
      userPermissions
    };
  }

  return {
    granted: true,
    requiredPermissions: [requiredPermission],
    userPermissions
  };
}

/**
 * Build required permission string
 */
function buildRequiredPermission(resourceType: string, action: string): string {
  // Map resource types to permission categories
  const resourceToCategory: Record<string, string> = {
    'company': 'company:companies',
    'department': 'company:departments',
    'designation': 'company:designations',
    'cost_center': 'company:cost_centers',
    'kyc_document': 'company:kyc:documents',
    'kyc_compliance': 'company:kyc:compliance',
    'kyc_verification': 'company:kyc:verifications',
    'virtual_card': 'company:virtual_card:cards',
    'virtual_card_transaction': 'company:virtual_card:transactions',
    'virtual_card_settings': 'company:virtual_card:settings'
  };

  const category = resourceToCategory[resourceType] || resourceType;
  return `${category}:${action}`;
}

/**
 * Extract resource owner ID from request
 */
function getResourceOwnerId(req: AuthRequest): string | null {
  // Try to extract from various sources
  return req.params.userId || 
         req.body.userId || 
         req.user?.id || 
         null;
}

/**
 * Permission check middleware for specific scenarios
 */

// Company Management Permissions
export const requireCompanyView = requirePermission('company', 'view');
export const requireCompanyCreate = requirePermission('company', 'create');
export const requireCompanyUpdate = requirePermission('company', 'update');
export const requireCompanyDelete = requirePermission('company', 'delete');

// Department Management Permissions
export const requireDepartmentView = requirePermission('department', 'view');
export const requireDepartmentCreate = requirePermission('department', 'create');
export const requireDepartmentUpdate = requirePermission('department', 'update');
export const requireDepartmentDelete = requirePermission('department', 'delete');

// Designation Management Permissions
export const requireDesignationView = requirePermission('designation', 'view');
export const requireDesignationCreate = requirePermission('designation', 'create');
export const requireDesignationUpdate = requirePermission('designation', 'update');
export const requireDesignationDelete = requirePermission('designation', 'delete');

// Cost Center Management Permissions
export const requireCostCenterView = requirePermission('cost_center', 'view');
export const requireCostCenterCreate = requirePermission('cost_center', 'create');
export const requireCostCenterUpdate = requirePermission('cost_center', 'update');
export const requireCostCenterDelete = requirePermission('cost_center', 'delete');

// KYC Management Permissions
export const requireKYCDocumentView = requirePermission('kyc_document', 'view');
export const requireKYCDocumentCreate = requirePermission('kyc_document', 'create');
export const requireKYCDocumentUpdate = requirePermission('kyc_document', 'update');
export const requireKYCDocumentDelete = requirePermission('kyc_document', 'delete');
export const requireKYCDocumentVerify = requirePermission('kyc_document', 'verify');
export const requireKYCDocumentUpload = requirePermission('kyc_document', 'upload');
export const requireKYCDocumentDownload = requirePermission('kyc_document', 'download');

export const requireKYCComplianceView = requirePermission('kyc_compliance', 'view');
export const requireKYCComplianceUpdate = requirePermission('kyc_compliance', 'update');
export const requireKYCComplianceManage = requirePermission('kyc_compliance', 'manage');

export const requireKYCVerificationView = requirePermission('kyc_verification', 'view');
export const requireKYCVerificationManage = requirePermission('kyc_verification', 'manage');

// Virtual Card Management Permissions
export const requireVirtualCardView = requirePermission('virtual_card', 'view');
export const requireVirtualCardCreate = requirePermission('virtual_card', 'create');
export const requireVirtualCardUpdate = requirePermission('virtual_card', 'update');
export const requireVirtualCardDelete = requirePermission('virtual_card', 'delete');
export const requireVirtualCardActivate = requirePermission('virtual_card', 'activate');
export const requireVirtualCardDeactivate = requirePermission('virtual_card', 'deactivate');
export const requireVirtualCardBlock = requirePermission('virtual_card', 'block');
export const requireVirtualCardUnblock = requirePermission('virtual_card', 'unblock');

export const requireVirtualCardTransactionView = requirePermission('virtual_card_transaction', 'view');
export const requireVirtualCardTransactionCreate = requirePermission('virtual_card_transaction', 'create');
export const requireVirtualCardTransactionManage = requirePermission('virtual_card_transaction', 'manage');
export const requireVirtualCardTransactionAuthorize = requirePermission('virtual_card_transaction', 'authorize');

export const requireVirtualCardSettingsView = requirePermission('virtual_card_settings', 'view');
export const requireVirtualCardSettingsManage = requirePermission('virtual_card_settings', 'manage');

/**
 * Permission check for company-specific access
 */
export function requireCompanyAccess(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.user?.companyId) {
    res.status(403).json({
      success: false,
      message: 'Company access required',
      error: 'FORBIDDEN'
    });
    return;
  }
  next();
}

/**
 * Permission check for resource ownership
 */
export function requireOwnership(resourceIdParam: string = 'id') {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const resourceId = req.params[resourceIdParam];
    const userId = req.user?.id;

    if (!resourceId || !userId) {
      res.status(403).json({
        success: false,
        message: 'Ownership verification failed',
        error: 'FORBIDDEN'
      });
      return;
    }

    // For now, we'll assume ownership is verified at the service level
    // This middleware can be extended with database queries to verify ownership
    next();
  };
}

/**
 * Permission check for admin-level access
 */
export function requireAdminAccess(req: AuthRequest, res: Response, next: NextFunction): void {
  const userRole = req.user?.role;

  if (!userRole || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN')) {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
      error: 'FORBIDDEN'
    });
    return;
  }

  next();
}

/**
 * Permission check for super admin access
 */
export function requireSuperAdminAccess(req: AuthRequest, res: Response, next: NextFunction): void {
  const userRole = req.user?.role;

  if (!userRole || userRole !== 'SUPER_ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Super Admin access required',
      error: 'FORBIDDEN'
    });
    return;
  }

  next();
}

/**
 * Permission check for B2B user access
 */
export function requireB2BAccess(req: AuthRequest, res: Response, next: NextFunction): void {
  const userRole = req.user?.role;

  if (!userRole || (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN' && userRole !== 'B2B')) {
    res.status(403).json({
      success: false,
      message: 'B2B access required',
      error: 'FORBIDDEN'
    });
    return;
  }

  next();
}

/**
 * Permission check for viewer access
 */
export function requireViewerAccess(req: AuthRequest, res: Response, next: NextFunction): void {
  const userRole = req.user?.role;

  if (!userRole || !['SUPER_ADMIN', 'ADMIN', 'B2B', 'VIEWER'].includes(userRole)) {
    res.status(403).json({
      success: false,
      message: 'Viewer access required',
      error: 'FORBIDDEN'
    });
    return;
  }

  next();
}

/**
 * Permission debugging middleware (development only)
 */
export function debugPermissions(req: AuthRequest, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Permission Debug', {
      user: req.user,
      path: req.path,
      method: req.method,
      params: req.params,
      body: req.body
    });
  }
  next();
}

/**
 * Permission summary endpoint middleware
 */
export function getPermissionSummary(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  const { role, permissions, companyId } = req.user;

  res.json({
    success: true,
    data: {
      userRole: role,
      companyId,
      permissions,
      hasCompanyAccess: !!companyId,
      canCreateCompanies: permissions.includes('company:companies:create'),
      canManageDepartments: permissions.includes('company:departments:manage'),
      canManageDesignations: permissions.includes('company:designations:manage'),
      canManageCostCenters: permissions.includes('company:cost_centers:manage'),
      canManageKYC: permissions.includes('company:kyc:documents:manage'),
      canManageVirtualCards: permissions.includes('company:virtual_card:cards:manage')
    }
  });
}
