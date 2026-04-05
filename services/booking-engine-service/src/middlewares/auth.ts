import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        roles: string[];
        email?: string;
      };
    }
  }
}

// SECURITY: JWT secret must be set via environment variable in production and staging
// The fallback to 'development-secret' is ONLY acceptable in local development
const JWT_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET;

// Enforce JWT secret requirement based on environment
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
    console.warn('[AUTH] No JWT secret configured. Using development fallback.');
  } else {
    // Strict requirement for staging/production/any other environment
    console.error('[SECURITY] CRITICAL: JWT_SECRET or AUTH_SECRET environment variable is not set!');
    console.error('[SECURITY] Authentication will fail until a secret is configured.');
    console.error('[SECURITY] All environments except local development must have JWT_SECRET set.');
    throw new Error('JWT_SECRET must be set in all non-development environments');
  }
}

// Development-only fallback with warning
const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'development-secret';

/**
 * Authentication middleware - validates JWT tokens
 * Tokens can be passed via:
 * - Authorization: Bearer <token> header
 * - Cookie (for browser-based auth)
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.accessToken;

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : cookieToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'No valid authentication token provided',
    });
  }

  try {
    if (!EFFECTIVE_JWT_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error',
        message: 'Authentication secret not configured',
      });
    }
    const decoded = jwt.verify(token, EFFECTIVE_JWT_SECRET) as {
      sub: string;
      roles?: string[];
      email?: string;
      [key: string]: any;
    };

    req.user = {
      id: decoded.sub || decoded.id || decoded.userId,
      roles: decoded.roles || decoded.role ? [decoded.role] : [],
      email: decoded.email,
    };

    next();
  } catch (error: unknown) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Authentication token has expired',
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({
        success: false,
        error: 'Invalid token',
        message: 'Authentication token is invalid',
      });
    }
    return res.status(403).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}

/**
 * Role-based authorization middleware
 * Checks if the authenticated user has at least one of the required roles
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = allowedRoles.some(role =>
      userRoles.includes(role.toLowerCase()) ||
      userRoles.includes(role.toUpperCase()) ||
      userRoles.some(r => r.toLowerCase() === role.toLowerCase())
    );

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
}

/**
 * Optional authentication - attaches user if token is valid, but doesn't block if not
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.accessToken;

  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : cookieToken;

  if (!token) {
    next();
    return;
  }

  try {
    if (!EFFECTIVE_JWT_SECRET) {
      next();
      return;
    }
    const decoded = jwt.verify(token, EFFECTIVE_JWT_SECRET) as {
      sub: string;
      roles?: string[];
      email?: string;
      [key: string]: any;
    };

    req.user = {
      id: decoded.sub || decoded.id || decoded.userId,
      roles: decoded.roles || decoded.role ? [decoded.role] : [],
      email: decoded.email,
    };
  } catch {
    // Token invalid, continue without user info
  }

  next();
}