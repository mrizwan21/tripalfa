import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, AuthUser } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_ISSUER = process.env.JWT_ISSUER || 'tripalfa';

/**
 * Authentication middleware - validates JWT token
 */
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Also check for 'token' cookie as a fallback
      const cookieToken = (req as any).cookies?.token;
      if (!cookieToken) {
        res.status(401).json({
          success: false,
          error: 'Access token required',
        });
        return;
      }
      
      const decoded = jwt.verify(cookieToken, JWT_SECRET, { issuer: JWT_ISSUER }) as any;
      req.user = {
        ...decoded,
        sub: decoded.sub || decoded.id,
      };
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER }) as any;
    
    // Normalize user object
    req.user = {
      ...decoded,
      sub: decoded.sub || decoded.id,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    const userRole = req.user.role;
    if (!userRole || !roles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export type { AuthRequest, AuthUser };
