import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

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

// Validate JWT secret - throw if not set (consistent with other services)
if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET environment variable is required. Set it before starting the server.",
  );
}

const getJwtSecret = (): string => JWT_SECRET;

/**
 * Authentication middleware - validates JWT token
 */
export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
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

    const decoded = jwt.verify(token, getJwtSecret()) as AuthUser;
    req.user = decoded;

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

/**
 * Role-based authorization middleware
 */
const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: "Insufficient permissions",
      });
      return;
    }

    next();
  };
};

/**
 * Permission-based authorization middleware
 */
const requirePermission = (...permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    const hasPermission = permissions.some(
      (permission) =>
        req.user!.permissions.includes(permission) ||
        req.user!.role === "super_admin",
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

/**
 * Optional authentication - extracts user if token present, but doesn't require it
 */
export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, getJwtSecret()) as AuthUser;
      req.user = decoded;
    }

    next();
  } catch {
    // Continue without user
    next();
  }
};

/**
 * Verify user owns the booking workflow
 * Must be used after authMiddleware
 */
const requireWorkflowOwnership = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: "Authentication required",
      });
      return;
    }

    // Allow super_admin to access any workflow
    if (req.user.role === "super_admin") {
      next();
      return;
    }

    const { workflowId, orderId } = req.params;
    const bodyWorkflowId = req.body?.workflowId;
    const bodyOrderId = req.body?.orderId;

    const targetWorkflowId = workflowId || bodyWorkflowId;
    const targetOrderId = orderId || bodyOrderId;

    if (!targetWorkflowId && !targetOrderId) {
      res.status(400).json({
        success: false,
        error: "Workflow ID or Order ID is required",
      });
      return;
    }

    // Import CacheService to check workflow ownership
    const { CacheService } = await import("../cache/redis.js");

    // Check workflow ownership
    if (targetWorkflowId) {
      const workflowKey = `flight:workflow:${targetWorkflowId}`;
      const workflowState = await CacheService.get<any>(workflowKey);

      if (!workflowState) {
        res.status(404).json({
          success: false,
          error: "Workflow not found",
        });
        return;
      }

      // Check if user owns this workflow (by customer ID or company ID)
      const isOwner =
        workflowState.customer?.id === req.user.id ||
        workflowState.customer?.email === req.user.email ||
        (req.user.companyId && workflowState.companyId === req.user.companyId);

      if (!isOwner) {
        res.status(403).json({
          success: false,
          error: "You do not have permission to access this workflow",
        });
        return;
      }
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to verify workflow ownership",
    });
  }
};
