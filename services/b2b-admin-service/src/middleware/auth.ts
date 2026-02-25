import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
    id: string;
    email: string;
    role: string;
    companyId?: string;
    permissions: string[];
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Set it before starting the server.');
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Access token required'
            });
            return;
        }

        const token = authHeader.substring(7);

        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        req.user = decoded;

        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                error: 'Token expired'
            });
            return;
        }

        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
};

export const requireRole = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
            return;
        }

        next();
    };
};

export const requirePermission = (...permissions: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }

        const hasPermission = permissions.some(permission =>
            req.user!.permissions.includes(permission) ||
            req.user!.role === 'super_admin'
        );

        if (!hasPermission) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
            return;
        }

        next();
    };
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
            req.user = decoded;
        }

        next();
    } catch {
        // Continue without user
        next();
    }
};
