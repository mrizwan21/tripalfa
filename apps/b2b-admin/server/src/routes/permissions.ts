/**
 * Permission Management Routes
 * API endpoints for managing permissions and roles within the company management system
 */

import express from 'express';
import { logger } from '../utils/logger.js';
import { 
  COMPANY_ROLE_PERMISSIONS, 
  PermissionUtils, 
  PermissionCategory, 
  PermissionAction, 
  PermissionResource,
  PermissionError,
  PermissionErrorType
} from '../types/permissions.js';
import { requireAdminAccess, requireSuperAdminAccess } from '../middleware/permissionMiddleware.js';

const router = express.Router();

/**
 * Permission Management Routes
 */

// GET /api/permissions/roles - Get all available roles and their permissions
router.get('/roles', 
  requireAdminAccess,
  (req, res) => {
    try {
      res.json({
        success: true,
        data: COMPANY_ROLE_PERMISSIONS
      });
    } catch (error) {
      logger.error('Error getting roles', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get roles',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
);

// GET /api/permissions/role/:roleName - Get permissions for a specific role
router.get('/role/:roleName', 
  requireAdminAccess,
  (req, res) => {
    try {
      const { roleName } = req.params;
      const roleConfig = COMPANY_ROLE_PERMISSIONS.find(rp => rp.role === (roleName as string).toUpperCase());
      
      if (!roleConfig) {
        return res.status(404).json({
          success: false,
          message: `Role ${roleName} not found`,
          error: 'ROLE_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: roleConfig
      });
    } catch (error) {
      logger.error('Error getting role permissions', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get role permissions',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
);

// GET /api/permissions/categories - Get all permission categories
router.get('/categories', 
  requireAdminAccess,
  (req, res) => {
    try {
      const categories = Object.values(PermissionCategory);
      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      logger.error('Error getting permission categories', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get permission categories',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
);

// GET /api/permissions/actions - Get all permission actions
router.get('/actions', 
  requireAdminAccess,
  (req, res) => {
    try {
      const actions = Object.values(PermissionAction);
      res.json({
        success: true,
        data: actions
      });
    } catch (error) {
      logger.error('Error getting permission actions', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get permission actions',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
);

// GET /api/permissions/resources - Get all permission resources
router.get('/resources', 
  requireAdminAccess,
  (req, res) => {
    try {
      const resources = Object.values(PermissionResource);
      res.json({
        success: true,
        data: resources
      });
    } catch (error) {
      logger.error('Error getting permission resources', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get permission resources',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
);

// GET /api/permissions/available - Get all available permissions
router.get('/available', 
  requireAdminAccess,
  (req, res) => {
    try {
      const categories = Object.values(PermissionCategory);
      const actions = Object.values(PermissionAction);
      
      const availablePermissions = [];
      
      // Generate all possible permissions
      categories.forEach(category => {
        actions.forEach(action => {
          availablePermissions.push(`${category}:${action}`);
        });
      });

      res.json({
        success: true,
        data: {
          permissions: availablePermissions,
          categories,
          actions
        }
      });
    } catch (error) {
      logger.error('Error getting available permissions', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get available permissions',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
);

// POST /api/permissions/validate - Validate if user has specific permissions
router.post('/validate', 
  requireAdminAccess,
  (req, res) => {
    try {
      const { userPermissions, requiredPermissions } = req.body;

      if (!Array.isArray(userPermissions) || !Array.isArray(requiredPermissions)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request format',
          error: 'INVALID_REQUEST'
        });
      }

      const missingPermissions = requiredPermissions.filter(
        permission => !userPermissions.includes(permission)
      );

      const hasAllPermissions = missingPermissions.length === 0;

      res.json({
        success: true,
        data: {
          hasAllPermissions,
          missingPermissions,
          userPermissions,
          requiredPermissions
        }
      });
    } catch (error) {
      logger.error('Error validating permissions', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate permissions',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
);

// GET /api/permissions/user/:userId - Get user's permissions summary
router.get('/user/:userId', 
  requireAdminAccess,
  (req, res) => {
    try {
      // This would typically query the database for user permissions
      // For now, we'll return a mock response
      const { userId } = req.params;
      
      // Mock user permissions based on role
      const userRole = req.user?.role || 'B2B';
      const userPermissions = PermissionUtils.getRolePermissions(userRole);

      res.json({
        success: true,
        data: {
          userId,
          userRole,
          permissions: userPermissions,
          permissionCount: userPermissions.length,
          hasCompanyAccess: !!req.user?.companyId,
          capabilities: {
            canManageCompanies: userPermissions.includes('company:companies:manage'),
            canManageDepartments: userPermissions.includes('company:departments:manage'),
            canManageDesignations: userPermissions.includes('company:designations:manage'),
            canManageCostCenters: userPermissions.includes('company:cost_centers:manage'),
            canManageKYC: userPermissions.includes('company:kyc:documents:manage'),
            canManageVirtualCards: userPermissions.includes('company:virtual_card:cards:manage')
          }
        }
      });
    } catch (error) {
      logger.error('Error getting user permissions', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get user permissions',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
);

// POST /api/permissions/test - Test permission check
router.post('/test', 
  requireAdminAccess,
  (req, res) => {
    try {
      const { resourceType, action, userRole, userPermissions } = req.body;

      if (!resourceType || !action) {
        return res.status(400).json({
          success: false,
          message: 'Missing required parameters: resourceType and action',
          error: 'INVALID_REQUEST'
        });
      }

      const requiredPermission = PermissionUtils.buildPermission(
        resourceType as PermissionCategory,
        resourceType as unknown as PermissionResource,
        action as PermissionAction
      );

      const hasPermission = userPermissions 
        ? PermissionUtils.hasAnyPermission(userPermissions, [requiredPermission])
        : PermissionUtils.hasAnyPermission(
            PermissionUtils.getRolePermissions(userRole || 'B2B'), 
            [requiredPermission]
          );

      res.json({
        success: true,
        data: {
          resourceType,
          action,
          requiredPermission,
          userRole,
          userPermissions: userPermissions || PermissionUtils.getRolePermissions(userRole || 'B2B'),
          hasPermission
        }
      });
    } catch (error) {
      logger.error('Error testing permission', error);
      res.status(500).json({
        success: false,
        message: 'Failed to test permission',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
);

// GET /api/permissions/role-matrix - Get permission matrix for all roles
router.get('/role-matrix', 
  requireAdminAccess,
  (req, res) => {
    try {
      const categories = Object.values(PermissionCategory);
      const actions = Object.values(PermissionAction);
      
      const matrix = {};
      
      // Build permission matrix
      COMPANY_ROLE_PERMISSIONS.forEach(role => {
        matrix[role.role] = {};
        categories.forEach(category => {
          matrix[role.role][category] = {};
          actions.forEach(action => {
            const permission = `${category}:${action}`;
            matrix[role.role][category][action] = role.permissions.includes(permission);
          });
        });
      });

      res.json({
        success: true,
        data: {
          matrix,
          roles: COMPANY_ROLE_PERMISSIONS.map(r => r.role),
          categories,
          actions
        }
      });
    } catch (error) {
      logger.error('Error getting permission matrix', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get permission matrix',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
);

// GET /api/permissions/audit - Get permission audit log (mock implementation)
router.get('/audit', 
  requireSuperAdminAccess,
  (req, res) => {
    try {
      // This would typically query an audit log table
      // For now, we'll return a mock response
      const auditLog = [
        {
          timestamp: new Date().toISOString(),
          userId: 'admin-user-123',
          action: 'PERMISSION_CHECK',
          resource: 'company:kyc:documents:view',
          result: 'GRANTED',
          ipAddress: '192.168.1.100'
        },
        {
          timestamp: new Date().toISOString(),
          userId: 'b2b-user-456',
          action: 'PERMISSION_DENIED',
          resource: 'company:companies:delete',
          result: 'DENIED',
          ipAddress: '192.168.1.101'
        }
      ];

      res.json({
        success: true,
        data: {
          auditLog,
          totalEntries: auditLog.length,
          timeRange: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            end: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      logger.error('Error getting permission audit log', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get permission audit log',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
);

// POST /api/permissions/bulk-validate - Bulk permission validation
router.post('/bulk-validate', 
  requireAdminAccess,
  (req, res) => {
    try {
      const { checks } = req.body;

      if (!Array.isArray(checks)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid request format: checks must be an array',
          error: 'INVALID_REQUEST'
        });
      }

      const results = checks.map(check => {
        const { resourceType, action, userPermissions, userRole } = check;
        
        const requiredPermission = PermissionUtils.buildPermission(
          resourceType as PermissionCategory,
          resourceType as unknown as PermissionResource,
          action as PermissionAction
        );

        const permissionsToCheck = userPermissions || PermissionUtils.getRolePermissions(userRole || 'B2B');
        const hasPermission = PermissionUtils.hasAnyPermission(permissionsToCheck, [requiredPermission]);

        return {
          resourceType,
          action,
          requiredPermission,
          userRole,
          userPermissions: permissionsToCheck,
          hasPermission
        };
      });

      res.json({
        success: true,
        data: {
          results,
          totalChecks: results.length,
          grantedCount: results.filter(r => r.hasPermission).length,
          deniedCount: results.filter(r => !r.hasPermission).length
        }
      });
    } catch (error) {
      logger.error('Error in bulk permission validation', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform bulk permission validation',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
);

// GET /api/permissions/summary - Get comprehensive permission summary
router.get('/summary', 
  requireAdminAccess,
  (req, res) => {
    try {
      const userRole = req.user?.role || 'B2B';
      const userPermissions = PermissionUtils.getRolePermissions(userRole);

      const summary = {
        user: {
          role: userRole,
          permissions: userPermissions,
          permissionCount: userPermissions.length
        },
        system: {
          totalRoles: COMPANY_ROLE_PERMISSIONS.length,
          totalPermissions: userPermissions.length,
          permissionCategories: Object.values(PermissionCategory),
          permissionActions: Object.values(PermissionAction),
          permissionResources: Object.values(PermissionResource)
        },
        capabilities: {
          canManageCompanies: userPermissions.includes('company:companies:manage'),
          canManageDepartments: userPermissions.includes('company:departments:manage'),
          canManageDesignations: userPermissions.includes('company:designations:manage'),
          canManageCostCenters: userPermissions.includes('company:cost_centers:manage'),
          canManageKYC: userPermissions.includes('company:kyc:documents:manage'),
          canManageVirtualCards: userPermissions.includes('company:virtual_card:cards:manage'),
          canViewReports: userPermissions.includes('company:reports:view'),
          canExportData: userPermissions.includes('company:export')
        }
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error getting permission summary', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get permission summary',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
);

export default router;