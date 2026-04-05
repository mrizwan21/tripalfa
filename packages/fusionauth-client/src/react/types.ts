/**
 * FusionAuth React Types
 */

import { ReactNode } from 'react';
import type { FusionAuthConfig, User, AuthTokens, LoginOptions, LogoutOptions } from '../types.js';

export interface FusionAuthProviderProps extends FusionAuthConfig {
  children: ReactNode;
  fallback?: ReactNode;
  loadingComponent?: ReactNode;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  tokens?: AuthTokens;
  error?: string;
  requiresMfa?: boolean;
  mfaUserId?: string;
}

export interface UseFusionAuthReturn {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  error: string | null;
  
  // Actions
  login: (options?: LoginOptions) => void;
  loginWithCredentials: (email: string, password: string, userType?: 'B2B' | 'B2C') => Promise<LoginResult>;
  logout: (options?: LogoutOptions) => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  refreshTokens: () => Promise<AuthTokens | null>;
  fetchUserInfo: () => Promise<User | null>;
  handleCallback: (code: string, state?: string) => Promise<LoginResult>;
}
