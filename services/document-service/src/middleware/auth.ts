/**
 * Authentication Middleware
 * JWT token validation and user extraction
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Extended Request with auth info
 */
export interface AuthRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
  token?: string;
}

/**
 * Verify JWT token and extract user info
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
      });
      return;
    }

    // In production, validate JWT signature using a secret key
    // For now, extract userId from token (mock implementation)
    // Real implementation: jwt.verify(token, process.env.JWT_SECRET)

    try {
      // Simple base64 decode for mock token format: base64({userId, isAdmin})
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));

      req.userId = decoded.userId || decoded.sub;
      req.isAdmin = decoded.isAdmin || decoded.role === 'admin';
      req.token = token;

      next();
    } catch (error) {
      // Token is malformed
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token format',
      });
      return;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication - doesn't fail if token is missing, but validates if present
 */
export function optionalAuthenticateToken(req: AuthRequest, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));

        req.userId = decoded.userId || decoded.sub;
        req.isAdmin = decoded.isAdmin || decoded.role === 'admin';
        req.token = token;
      } catch (error) {
        console.error('[Auth] Invalid token format:', error);
        // Continue without auth info
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Require admin role
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }

  if (!req.isAdmin) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Admin role required',
    });
    return;
  }

  next();
}

/**
 * Require authentication
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
    });
    return;
  }

  next();
}
