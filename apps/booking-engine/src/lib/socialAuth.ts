import { api, setAccessToken, setRefreshToken } from "./api";
import { API_ENDPOINTS } from "./constants";

// Social auth provider types
export type SocialProvider = "google" | "facebook" | "apple";

export interface SocialUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  provider: SocialProvider;
  providerId: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: SocialUser;
  isNewUser: boolean;
}

// Get the frontend redirect URL for OAuth callbacks
function getRedirectUrl(provider: SocialProvider): string {
  // In production, this would be your actual domain
  const baseUrl = import.meta.env.VITE_APP_URL || "http://localhost:5174";
  return `${baseUrl}/auth/callback/${provider}`;
}

// Initialize OAuth flow - redirects to the backend OAuth endpoint
export function initiateOAuth(provider: SocialProvider): void {
  const redirectUrl = getRedirectUrl(provider);
  const authUrl = `${API_ENDPOINTS.AUTH_OAUTH}/${provider}?redirect_url=${encodeURIComponent(redirectUrl)}`;

  // Redirect to backend OAuth authorization URL
  window.location.href = authUrl;
}

// Handle OAuth callback - exchange authorization code for tokens
export async function handleOAuthCallback(
  provider: SocialProvider,
  authorizationCode: string,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>(
    API_ENDPOINTS.AUTH_OAUTH_CALLBACK,
    {
      provider,
      code: authorizationCode,
    },
  );

  // Store tokens
  setAccessToken(response.accessToken);
  setRefreshToken(response.refreshToken);

  return response;
}

// Check if user is authenticated via social login
export async function getSocialUser(): Promise<SocialUser | null> {
  try {
    const response = await api.get<SocialUser>(API_ENDPOINTS.AUTH_PROFILE);
    return response;
  } catch {
    return null;
  }
}

// Link existing account with social provider
export async function linkSocialAccount(
  provider: SocialProvider,
): Promise<void> {
  const redirectUrl = getRedirectUrl(provider);
  window.location.href = `${API_ENDPOINTS.AUTH_OAUTH_LINK}/${provider}?redirect_url=${encodeURIComponent(redirectUrl)}`;
}

// Unlink social account from existing account
export async function unlinkSocialAccount(
  provider: SocialProvider,
): Promise<void> {
  await api.delete(`${API_ENDPOINTS.AUTH_OAUTH_UNLINK}/${provider}`);
}

// Get current linked social accounts
export async function getLinkedAccounts(): Promise<SocialProvider[]> {
  const response = await api.get<{ providers: SocialProvider[] }>(
    API_ENDPOINTS.AUTH_LINKED_ACCOUNTS,
  );
  return response.providers || [];
}
