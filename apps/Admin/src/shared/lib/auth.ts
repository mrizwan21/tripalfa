/**
 * Authentication Utilities
 *
 * Provides helper functions for JWT token management and authentication status
 */

/**
 * Get the current JWT token from localStorage
 * Standardized key: 'accessToken' (consistent with booking-engine)
 * Falls back to legacy keys for backward compatibility
 */
export function getAuthToken(): string | null {
  return (
    localStorage.getItem('accessToken') ||
    localStorage.getItem('token') ||
    localStorage.getItem('authToken')
  );
}

/**
 * Check if user is authenticated
 */
function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Set the JWT token in localStorage
 * Uses standardized 'accessToken' key
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('accessToken', token);
  // Clear legacy keys
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
}

/**
 * Clear the JWT token from localStorage
 */
function clearAuthToken(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
  localStorage.removeItem('authToken');
}

/**
 * Decode JWT token (basic decoding - does not verify signature)
 * For verification, rely on the backend
 */
export function decodeToken(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return false;
  }

  // exp is in seconds, Date.now() is in milliseconds
  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();

  return currentTime >= expirationTime;
}

/**
 * Get time until token expiration in seconds
 */
function getTokenExpiresIn(token: string): number | null {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) {
    return null;
  }

  const expirationTime = decoded.exp * 1000;
  const currentTime = Date.now();
  const secondsUntilExpiry = Math.floor((expirationTime - currentTime) / 1000);

  return Math.max(0, secondsUntilExpiry);
}

/**
 * Get user info from token
 */
function getUserFromToken(
  token: string
): { id: string; email: string; role: string } | null {
  const decoded = decodeToken(token);
  if (!decoded) {
    return null;
  }

  return {
    id: decoded.id || decoded.sub || '',
    email: decoded.email || '',
    role: decoded.role || 'user',
  };
}

/**
 * Check if current token is valid and not expired
 */
function isValidToken(): boolean {
  const token = getAuthToken();
  if (!token) {
    return false;
  }

  return !isTokenExpired(token);
}
