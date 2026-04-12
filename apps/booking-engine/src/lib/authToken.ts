export interface JWTPayload {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Parse JWT payload without verification
 * Returns null if token is invalid
 */
export function parseJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1])) as JWTPayload;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired
 * Returns true if expired or invalid
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJWT(token);
  if (!payload?.exp) return false; // No expiry = treat as valid

  // exp is in seconds, Date.now() is in milliseconds
  return Date.now() >= payload.exp * 1000;
}

/**
 * Get stored auth token from localStorage
 * Returns empty string if no valid token found or if token is expired
 */
export function getStoredAuthToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken') || '';

  // Validate token is not expired before returning
  if (token && isTokenExpired(token)) {
    // Clear expired tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('authToken');
    return '';
  }

  return token;
}
