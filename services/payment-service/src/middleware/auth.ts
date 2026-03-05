import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// JWT Payload interface for type safety
export interface JwtPayload {
  sub?: string;
  id?: string;
  role?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Lazily get JWT_SECRET at runtime to prevent server crash on startup
 * if environment variable is not set. First call will throw if missing.
 */
export const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET environment variable is required. Set it before starting the server.",
    );
  }
  return secret;
};

/**
 * Express middleware to authenticate JWT tokens
 * Validates the Authorization header and attaches user to request
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Access token required" });
      return;
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;

    // Validate JWT payload structure
    if (!decoded || typeof decoded !== "object" || (!decoded.sub && !decoded.id)) {
      res.status(401).json({
        error: "Invalid token payload: missing user identifier",
      });
      return;
    }

    (req as any).user = decoded;
    next();
  } catch (error) {
    console.error("[Auth] Token verification failed:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

/**
 * Helper to extract authenticated user info from request
 * @returns Object with userId, role, isAdmin flag, and full user object
 */
export const getAuthenticatedUser = (req: Request) => {
  const user = (req as any).user || {};
  const userId = user.sub || user.id || user.userId || null;
  const role = String(user.role || "").toLowerCase();
  const isAdmin = role === "admin" || role === "super_admin";
  return { userId, role, isAdmin, user };
};

/**
 * Parse and validate a positive amount from request body
 * @param value - The value to parse
 * @returns The parsed positive number, or null if invalid
 */
export const parsePositiveAmount = (value: unknown): number | null => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
};
