/**
 * FusionAuth Client Types
 */

export interface FusionAuthConfig {
  serverUrl: string;
  clientId: string;
  redirectUri: string;
  postLogoutRedirectUri?: string;
  scope?: string;
  shouldAutoRefresh?: boolean;
  shouldAutoFetchUserInfo?: boolean;
  onRedirect?: (url: string) => void;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  imageUrl?: string;
  roles?: string[];
  userType?: 'B2B' | 'B2C' | 'B2B_ADMIN' | 'B2B_EMPLOYEE';
  companyId?: string;
  mfaEnabled?: boolean;
  emailVerified?: boolean;
  [key: string]: any;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
  expiresAt?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  error: string | null;
}

export interface LoginOptions {
  userType?: 'B2B' | 'B2C';
  state?: string;
  redirectUri?: string;
}

export interface LoginResult {
  success: boolean;
  user?: User;
  tokens?: AuthTokens;
  error?: string;
  requiresMfa?: boolean;
  mfaUserId?: string;
}

export interface LogoutOptions {
  global?: boolean;
  redirectUri?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type: string;
}

export interface UserInfoResponse {
  sub: string;
  email: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
  roles?: string[];
  [key: string]: any;
}

export type AuthEventType = 
  | 'login'
  | 'logout'
  | 'token_refresh'
  | 'token_expired'
  | 'user_updated'
  | 'error';

export interface AuthEvent {
  type: AuthEventType;
  payload?: any;
  timestamp: number;
}

export type AuthEventListener = (event: AuthEvent) => void;