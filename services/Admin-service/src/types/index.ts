/**
 * Shared Types for B2B Admin Service
 *
 * Common type definitions used across the service.
 */

import { Request } from "express";

/**
 * User object attached to authenticated requests
 */
export interface AuthenticatedUser {
  id?: string;
  sub?: string;
  userId?: string;
  role?: string;
  email?: string;
  permissions?: string[];
  [key: string]: unknown;
}

/**
 * Extended Express Request with authenticated user
 * Use this instead of `(req as any).user` for type safety
 *
 * @example
 * ```typescript
 * router.get("/", authMiddleware, (req: AuthRequest, res: Response) => {
 *   const { userId, isAdmin } = getUserFromRequest(req);
 *   // ...
 * });
 * ```
 */
export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Helper to extract user info from AuthRequest
 * Returns normalized user data with safe defaults
 */
export function getUserFromRequest(req: AuthRequest): {
  userId: string | null;
  role: string;
  isAdmin: boolean;
  user: AuthenticatedUser | null;
} {
  const user = req.user || null;
  const userId = user?.sub || user?.id || user?.userId || null;
  const role = String(user?.role || "").toLowerCase();
  const isAdmin = role === "admin" || role === "super_admin";

  return { userId, role, isAdmin, user };
}

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Permission check result
 */
export interface PermissionCheck {
  hasPermission: boolean;
  missingPermissions: string[];
}

export default {
  getUserFromRequest,
};
