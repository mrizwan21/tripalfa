import { Request as ExpressRequest } from 'express';

export type UserType = 'B2B' | 'B2C' | 'B2B_ADMIN' | 'B2B_EMPLOYEE';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: UserType;
  role?: string;
  permissions?: string[];
  companyId?: string;
}

export interface AuthRequest extends ExpressRequest {
  user?: AuthUser & { sub: string };
}

export interface AuthResult {
  user: any;
  token?: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
}
