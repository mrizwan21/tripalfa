import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

// Support both old (id) and new (userId) token formats for backward compatibility
export interface AuthUser {
  userId: string;
  iat: number;
  id?: string; // Legacy: kept for backward compatibility
  email?: string;
  role?: string;
  companyId?: string;
  permissions?: string[];
}

// Helper to get the user ID from token (supports both old and new formats)
function getUserId(user: AuthUser): string {
  return user.userId || user.id || "";
}

// Validate that the token contains a valid user identifier
function validateTokenPayload(user: AuthUser): void {
  if (!user.userId && !user.id) {
    throw new jwt.JsonWebTokenError("Invalid token: missing user identifier");
  }
}

export type AuthRequest = Parameters<RequestHandler>[0] & { user?: AuthUser };

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. Set it before starting the server.",
  );
}

export const authMiddleware: RequestHandler = (req, res, next): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        error: "Access token required",
      });
      return;
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

    // Validate token payload has required user identifier
    validateTokenPayload(decoded);

    (req as AuthRequest).user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: "Token expired",
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: "Invalid token",
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: "Authentication failed",
    });
  }
};

const requireRole = (...roles: string[]): RequestHandler => {
  return (req: AuthRequest, res, next): void => {
    const user = req.user as AuthUser | undefined;
    if (!user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    // Check if role claim is missing from token
    if (!user.role) {
      res.status(403).json({
        success: false,
        error: "Token missing role claim",
      });
      return;
    }

    // Support both old (id) and new (userId) formats - use role with fallback
    if (!roles.includes(user.role)) {
      res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
      return;
    }

    next();
  };
};

export const requirePermission = (...permissions: string[]): RequestHandler => {
  return (req: AuthRequest, res, next): void => {
    const user = req.user as AuthUser | undefined;
    if (!user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const userPermissions = user.permissions ?? [];
    const hasPermission = permissions.some(
      (permission) =>
        userPermissions.includes(permission) || user.role === "super_admin",
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
      return;
    }

    next();
  };
};

const optionalAuth: RequestHandler = (req, res, next): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

      // Only attach user if token has valid identifier
      if (decoded.userId || decoded.id) {
        (req as AuthRequest).user = decoded;
      }
    }

    next();
  } catch {
    // Continue without user
    next();
  }
};
