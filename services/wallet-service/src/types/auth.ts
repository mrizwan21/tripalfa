/**
 * Auth types for wallet service
 */

import { Request } from 'express';

export interface AuthenticatedUser {
  sub?: string;
  id?: string;
  userId?: string;
  role?: string;
  email?: string;
  [key: string]: unknown;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  userId?: string | null;
}
