// ============================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================
// JWT token verification and permission checking
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth.js';
import { poolLocal } from '../database/client.js';

// ============================================================
// JWT Authentication Middleware
// ============================================================

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      const error: any = new Error('Missing authentication token');
      error.status = 401;
      error.code = 'UNAUTHORIZED';
      throw error;
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      const error: any = new Error('Invalid or expired token');
      error.status = 401;
      error.code = 'UNAUTHORIZED';
      throw error;
    }

    // Check if user exists and is active
    const userResult = await poolLocal.query(
      'SELECT id, email, status FROM core.users WHERE id = $1 AND deleted_at IS NULL',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      const error: any = new Error('User not found or inactive');
      error.status = 401;
      error.code = 'UNAUTHORIZED';
      throw error;
    }

    const user = userResult.rows[0];

    if (user.status !== 'active') {
      const error: any = new Error('Account is not active');
      error.status = 401;
      error.code = 'UNAUTHORIZED';
      throw error;
    }

    // Get user roles and permissions
    const rolesResult = await poolLocal.query(
      `SELECT r.id, r.name, r.user_type, r.permissions, r.service_access
       FROM core.roles r
       JOIN core.user_role ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    const permissionsResult = await poolLocal.query(
      `SELECT DISTINCT p.name, p.service
       FROM core.permissions p
       JOIN core.role_permission rp ON p.id = rp.permission_id
       JOIN core.user_role ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = $1`,
      [user.id]
    );

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      status: user.status,
      roles: rolesResult.rows,
      permissions: permissionsResult.rows.map((p: any) => `${p.service}:${p.name}`),
    };

    next();
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Permission Authorization Middleware
// ============================================================

export const authorizePermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if user has the required permission
      const userPermissions = (req as any).user?.permissions || [];
      
      // Check for exact match or wildcard permissions
      const hasPermission = userPermissions.some((perm: string) => {
        // Exact match
        if (perm === requiredPermission) return true;
        
        // Wildcard match (e.g., "*" or "read:*")
        if (perm === '*') return true;
        
        // Service-level wildcard (e.g., "read:*" matches "read:users")
        const [requiredService, requiredAction] = requiredPermission.split(':');
        const [permService, permAction] = perm.split(':');
        
        if (permService === requiredService && permAction === '*') return true;
        
        // Admin override
        const userRoles = (req as any).user?.roles || [];
        if (userRoles.some((role: any) => role.name === 'super_admin')) return true;
        
        return false;
      });

      if (!hasPermission) {
        const error: any = new Error('Insufficient permissions');
        error.status = 403;
        error.code = 'FORBIDDEN';
        throw error;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// ============================================================
// API Key Authentication Middleware
// ============================================================

export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      const error: any = new Error('Missing API key');
      error.status = 401;
      error.code = 'UNAUTHORIZED';
      throw error;
    }

    // Verify API key
    const result = await poolLocal.query(
       `SELECT id, name, permissions, rate_limit
       FROM core.api_keys
       WHERE key_hash = crypt($1, key_hash)
       AND status = 'active'`,
      [apiKey]
    );

    if (result.rows.length === 0) {
      const error: any = new Error('Invalid API key');
      error.status = 401;
      error.code = 'UNAUTHORIZED';
      throw error;
    }

    const apiKeyData = result.rows[0];

    // Attach API key info to request
    req.apiKey = {
      id: apiKeyData.id,
      name: apiKeyData.name,
      permissions: apiKeyData.permissions,
      rateLimit: apiKeyData.rate_limit,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default {
  authenticateToken,
  authorizePermission,
  authenticateApiKey,
};