import { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/index.js';
import logger from '../utils/logger.js';
import { TypedRequest } from '../types';

interface PermissionRule {
  action: string;
  resource: string;
  conditions?: Record<string, any>;
}

// Define permission rules
const PERMISSION_RULES: Record<string, PermissionRule> = {
  // Booking Management Permissions
  'create_booking': {
    action: 'create',
    resource: 'booking'
  },
  'search_bookings': {
    action: 'search',
    resource: 'booking'
  },
  'view_bookings': {
    action: 'view',
    resource: 'booking'
  },
  'update_booking': {
    action: 'update',
    resource: 'booking'
  },
  'cancel_booking': {
    action: 'cancel',
    resource: 'booking'
  },
  'confirm_booking': {
    action: 'confirm',
    resource: 'booking'
  },
  'issue_ticket': {
    action: 'issue',
    resource: 'ticket'
  },
  'hold_inventory': {
    action: 'hold',
    resource: 'inventory'
  },

  // Customer Management Permissions
  'view_customers': {
    action: 'view',
    resource: 'customer'
  },
  'create_customer': {
    action: 'create',
    resource: 'customer'
  },
  'update_customer': {
    action: 'update',
    resource: 'customer'
  },
  'delete_customer': {
    action: 'delete',
    resource: 'customer'
  },

  // Supplier Management Permissions
  'view_suppliers': {
    action: 'view',
    resource: 'supplier'
  },
  'create_supplier': {
    action: 'create',
    resource: 'supplier'
  },
  'update_supplier': {
    action: 'update',
    resource: 'supplier'
  },
  'delete_supplier': {
    action: 'delete',
    resource: 'supplier'
  },

  // Workflow Management Permissions
  'manage_workflow': {
    action: 'manage',
    resource: 'workflow'
  },
  'assign_booking': {
    action: 'assign',
    resource: 'booking'
  },
  'update_priority': {
    action: 'update',
    resource: 'priority'
  },

  // Inventory Management Permissions
  'view_inventory': {
    action: 'view',
    resource: 'inventory'
  },
  'manage_inventory': {
    action: 'manage',
    resource: 'inventory'
  },
  'add_inventory': {
    action: 'add',
    resource: 'inventory'
  },
  'update_inventory': {
    action: 'update',
    resource: 'inventory'
  },
  'delete_inventory': {
    action: 'delete',
    resource: 'inventory'
  },

  // Pricing Management Permissions
  'manage_pricing': {
    action: 'manage',
    resource: 'pricing'
  },
  'view_pricing': {
    action: 'view',
    resource: 'pricing'
  },
  'create_pricing_rule': {
    action: 'create',
    resource: 'pricing_rule'
  },
  'update_pricing_rule': {
    action: 'update',
    resource: 'pricing_rule'
  },
  'delete_pricing_rule': {
    action: 'delete',
    resource: 'pricing_rule'
  },

  // Commission Management Permissions
  'manage_commissions': {
    action: 'manage',
    resource: 'commission'
  },
  'view_commissions': {
    action: 'view',
    resource: 'commission'
  },
  'create_commission_rule': {
    action: 'create',
    resource: 'commission_rule'
  },
  'update_commission_rule': {
    action: 'update',
    resource: 'commission_rule'
  },
  'delete_commission_rule': {
    action: 'delete',
    resource: 'commission_rule'
  },

  // Permission Management Permissions
  'manage_permissions': {
    action: 'manage',
    resource: 'permission'
  },
  'view_permissions': {
    action: 'view',
    resource: 'permission'
  },

  // Reporting Permissions
  'view_reports': {
    action: 'view',
    resource: 'report'
  },
  'generate_reports': {
    action: 'generate',
    resource: 'report'
  },

  // Audit and Compliance Permissions
  'view_audit': {
    action: 'view',
    resource: 'audit'
  },
  'view_compliance': {
    action: 'view',
    resource: 'compliance'
  }
};

export const permissionMiddleware = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const typedReq = req as TypedRequest;
    
    try {
      const user = typedReq.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Check if user has the required permission
      const hasPermission = await checkUserPermission(user.id, requiredPermission);

      if (!hasPermission) {
        logger.warn('Permission denied', {
          userId: user.id,
          userEmail: user.email,
          requiredPermission,
          timestamp: new Date().toISOString()
        });

        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          details: {
            requiredPermission,
            userRole: user.role
          }
        });
      }

      // Add permission context to request
      (req as any).permissionContext = {
        userId: user.id,
        userRole: user.role,
        requiredPermission,
        granted: true
      };

      next();
    } catch (error) {
      logger.error('Permission check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: typedReq.user?.id,
        requiredPermission
      });

      return res.status(500).json({
        success: false,
        error: 'Permission check failed'
      });
    }
  };
};

async function checkUserPermission(userId: string, permission: string): Promise<boolean> {
  try {
    // Get user with roles and permissions
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          include: {
            permissions: true
          }
        }
      }
    });

    if (!user) {
      return false;
    }

    // Check if user has admin role (super admin)
    const isAdmin = user.role === 'admin';
    if (isAdmin) {
      return true;
    }

    // For now, use role-based permissions until roles are properly set up
    return hasRolePermission(user.role, permission);
  } catch (error) {
    logger.error('Database permission check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      permission
    });
    return false;
  }
}

// Permission validation helper
export const validatePermission = (userPermissions: string[], requiredPermission: string): boolean => {
  // Check for exact match
  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  // Check for wildcard permissions (e.g., "manage_*")
  const wildcardPermission = requiredPermission.split('_')[0] + '_*';
  if (userPermissions.includes(wildcardPermission)) {
    return true;
  }

  return false;
};

// Role-based permission helper
export const hasRolePermission = (userRole: string, requiredPermission: string): boolean => {
  // Define role-based permissions
  const rolePermissions: Record<string, string[]> = {
    'admin': ['*'], // Admin has all permissions
    'agent': [
      'create_booking',
      'search_bookings',
      'view_bookings',
      'update_booking',
      'cancel_booking',
      'confirm_booking',
      'issue_ticket',
      'hold_inventory',
      'view_suppliers',
      'create_supplier',
      'manage_workflow',
      'assign_booking',
      'update_priority',
      'view_inventory',
      'view_pricing',
      'view_commissions',
      'view_reports'
    ],
    'supervisor': [
      'create_booking',
      'search_bookings',
      'view_bookings',
      'update_booking',
      'cancel_booking',
      'confirm_booking',
      'issue_ticket',
      'hold_inventory',
      'view_customers',
      'create_customer',
      'update_customer',
      'view_suppliers',
      'create_supplier',
      'update_supplier',
      'manage_workflow',
      'assign_booking',
      'update_priority',
      'view_inventory',
      'manage_inventory',
      'view_pricing',
      'manage_pricing',
      'view_commissions',
      'manage_commissions',
      'view_reports',
      'generate_reports',
      'view_audit',
      'view_compliance'
    ],
    'manager': [
      'create_booking',
      'search_bookings',
      'view_bookings',
      'update_booking',
      'cancel_booking',
      'confirm_booking',
      'issue_ticket',
      'hold_inventory',
      'view_customers',
      'create_customer',
      'update_customer',
      'delete_customer',
      'view_suppliers',
      'create_supplier',
      'update_supplier',
      'delete_supplier',
      'manage_workflow',
      'assign_booking',
      'update_priority',
      'view_inventory',
      'manage_inventory',
      'add_inventory',
      'update_inventory',
      'delete_inventory',
      'view_pricing',
      'manage_pricing',
      'create_pricing_rule',
      'update_pricing_rule',
      'delete_pricing_rule',
      'view_commissions',
      'manage_commissions',
      'create_commission_rule',
      'update_commission_rule',
      'delete_commission_rule',
      'view_reports',
      'generate_reports',
      'view_audit',
      'view_compliance',
      'manage_permissions'
    ]
  };

  const userPermissions = rolePermissions[userRole] || [];
  
  // Check for wildcard permissions
  if (userPermissions.includes('*')) {
    return true;
  }

  return userPermissions.includes(requiredPermission);
};

// Request interface extension
declare global {
  namespace Express {
    interface Request {
      permissionContext?: {
        userId: string;
        userRole: string;
        requiredPermission: string;
        granted: boolean;
      };
    }
  }
}

export default permissionMiddleware;