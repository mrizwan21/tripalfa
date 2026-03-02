/**
 * API Authentication Helper
 *
 * Handles authentication for API integration tests.
 * Provides utilities for login, token management, and session handling.
 *
 * @module api-integration/api-auth
 */

import { Page, APIRequestContext } from "@playwright/test";
import { API_ENDPOINTS } from "./api-test-helpers";

/**
 * Authentication Configuration
 */
export const AUTH_CONFIG = {
  // Test user credentials
  testUsers: {
    standard: {
      email: process.env.TEST_USER_EMAIL || "test.user@tripalfa.com",
      password: process.env.TEST_USER_PASSWORD || "Test@1234",
    },
    premium: {
      email: process.env.TEST_PREMIUM_EMAIL || "premium.user@tripalfa.com",
      password: process.env.TEST_PREMIUM_PASSWORD || "Test@1234",
    },
    admin: {
      email: process.env.TEST_ADMIN_EMAIL || "admin.user@tripalfa.com",
      password: process.env.TEST_ADMIN_PASSWORD || "Test@1234",
    },
  },
  // Token settings
  tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
} as const;

/**
 * Token storage for API tests
 */
interface TokenStorage {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId: string;
  email: string;
  role: string;
}

/**
 * API Authentication Manager
 * Manages authentication state for API integration tests
 */
export class ApiAuthManager {
  private tokens: Map<string, TokenStorage> = new Map();
  private baseURL: string;

  constructor(
    baseURL: string = process.env.API_URL || "http://localhost:3003",
  ) {
    this.baseURL = baseURL;
  }

  /**
   * Authenticate a user and store tokens
   */
  async authenticate(
    email: string,
    password: string,
    userKey: string = "default",
  ): Promise<TokenStorage> {
    try {
      const response = await fetch(
        `${this.baseURL}${API_ENDPOINTS.auth.login}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Authentication failed: ${error.message || response.statusText}`,
        );
      }

      const data = await response.json();

      const tokenStorage: TokenStorage = {
        accessToken: data.accessToken || data.token,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
        userId: data.userId || data.id,
        email: data.email || email,
        role: data.role || "CUSTOMER",
      };

      this.tokens.set(userKey, tokenStorage);
      console.log(`✅ Authenticated user: ${email} (${userKey})`);

      return tokenStorage;
    } catch (error) {
      console.error(`❌ Authentication failed for ${email}:`, error);
      throw error;
    }
  }

  /**
   * Get stored tokens for a user
   */
  getTokens(userKey: string = "default"): TokenStorage | undefined {
    return this.tokens.get(userKey);
  }

  /**
   * Get access token for API requests
   */
  getAccessToken(userKey: string = "default"): string | undefined {
    const tokens = this.tokens.get(userKey);
    return tokens?.accessToken;
  }

  /**
   * Check if token needs refresh
   */
  needsRefresh(userKey: string = "default"): boolean {
    const tokens = this.tokens.get(userKey);
    if (!tokens) return true;

    return Date.now() > tokens.expiresAt - AUTH_CONFIG.tokenRefreshThreshold;
  }

  /**
   * Refresh access token
   */
  async refreshToken(userKey: string = "default"): Promise<TokenStorage> {
    const tokens = this.tokens.get(userKey);
    if (!tokens?.refreshToken) {
      throw new Error(`No refresh token available for user: ${userKey}`);
    }

    try {
      const response = await fetch(
        `${this.baseURL}${API_ENDPOINTS.auth.refresh}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        },
      );

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.statusText}`);
      }

      const data = await response.json();

      const updatedTokens: TokenStorage = {
        ...tokens,
        accessToken: data.accessToken || data.token,
        expiresAt: Date.now() + (data.expiresIn || 3600) * 1000,
      };

      this.tokens.set(userKey, updatedTokens);
      console.log(`🔄 Token refreshed for user: ${userKey}`);

      return updatedTokens;
    } catch (error) {
      console.error(`❌ Token refresh failed for ${userKey}:`, error);
      throw error;
    }
  }

  /**
   * Ensure valid token (refresh if needed)
   */
  async ensureValidToken(userKey: string = "default"): Promise<string> {
    if (this.needsRefresh(userKey)) {
      await this.refreshToken(userKey);
    }

    const token = this.getAccessToken(userKey);
    if (!token) {
      throw new Error(`No valid token available for user: ${userKey}`);
    }

    return token;
  }

  /**
   * Logout user and clear tokens
   */
  async logout(userKey: string = "default"): Promise<void> {
    const tokens = this.tokens.get(userKey);
    if (tokens) {
      try {
        await fetch(`${this.baseURL}${API_ENDPOINTS.auth.logout}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });
      } catch (error) {
        console.warn(`Warning: Logout API call failed for ${userKey}:`, error);
      }
    }

    this.tokens.delete(userKey);
    console.log(`👋 Logged out user: ${userKey}`);
  }

  /**
   * Clear all stored tokens
   */
  clearAllTokens(): void {
    this.tokens.clear();
    console.log("🧹 All tokens cleared");
  }

  /**
   * Get authentication headers for API requests
   */
  async getAuthHeaders(
    userKey: string = "default",
  ): Promise<Record<string, string>> {
    const token = await this.ensureValidToken(userKey);
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }
}

/**
 * Playwright Page Authentication Helper
 * Handles authentication within Playwright page context
 */
export class PageAuthHelper {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Login via UI and store session
   */
  async loginViaUI(email: string, password: string): Promise<void> {
    console.log(`🔐 Logging in via UI: ${email}`);

    // Navigate to login page
    await this.page.goto("/login");
    await this.page.waitForLoadState("domcontentloaded");

    // Fill login form
    const emailField = this.page
      .locator('[data-testid="login-email"]')
      .or(this.page.locator('input[type="email"]'))
      .first();

    const passwordField = this.page
      .locator('[data-testid="login-password"]')
      .or(this.page.locator('input[type="password"]'))
      .first();

    const submitButton = this.page
      .locator('[data-testid="login-submit"]')
      .or(this.page.locator('button[type="submit"]'))
      .first();

    await emailField.fill(email);
    await passwordField.fill(password);
    await submitButton.click();

    // Wait for navigation to dashboard or home
    await Promise.race([
      this.page.waitForURL("**/dashboard", { timeout: 10000 }),
      this.page.waitForURL("**/flights", { timeout: 10000 }),
      this.page.waitForURL("**/hotels", { timeout: 10000 }),
    ]);

    console.log(`✅ Login successful: ${email}`);
  }

  /**
   * Set authentication token directly in localStorage/sessionStorage
   */
  async setAuthToken(
    token: string,
    storage: "localStorage" | "sessionStorage" = "localStorage",
  ): Promise<void> {
    await this.page.evaluate(
      ({ token, storage }) => {
        if (storage === "localStorage") {
          localStorage.setItem("accessToken", token);
          localStorage.setItem("authToken", token);
        } else {
          sessionStorage.setItem("accessToken", token);
          sessionStorage.setItem("authToken", token);
        }
      },
      { token, storage },
    );

    console.log(`🔑 Auth token set in ${storage}`);
  }

  /**
   * Clear authentication tokens from storage
   */
  async clearAuthTokens(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("refreshToken");
    });

    console.log("🧹 Auth tokens cleared from storage");
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.page.evaluate(() => {
      return (
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("accessToken") ||
        sessionStorage.getItem("authToken")
      );
    });

    return !!token;
  }

  /**
   * Get current auth token from storage
   */
  async getAuthToken(): Promise<string | null> {
    return await this.page.evaluate(() => {
      return (
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        sessionStorage.getItem("accessToken") ||
        sessionStorage.getItem("authToken")
      );
    });
  }

  /**
   * Logout via UI
   */
  async logoutViaUI(): Promise<void> {
    console.log("👋 Logging out via UI...");

    // Try to find and click logout button/link
    const logoutButton = this.page
      .locator('[data-testid="logout-button"]')
      .or(
        this.page.locator("text=Logout").or(this.page.locator("text=Sign Out")),
      )
      .first();

    if (await logoutButton.isVisible().catch(() => false)) {
      await logoutButton.click();
      await this.page.waitForLoadState("networkidle");
    }

    // Clear tokens regardless
    await this.clearAuthTokens();

    console.log("✅ Logout completed");
  }
}

/**
 * API Request Context with Authentication
 * Creates an API request context with automatic authentication
 */
export async function createAuthenticatedContext(
  baseURL: string,
  authManager: ApiAuthManager,
  userKey: string = "default",
): Promise<APIRequestContext> {
  const { request } = await import("@playwright/test");

  const headers = await authManager.getAuthHeaders(userKey);

  return request.newContext({
    baseURL,
    extraHTTPHeaders: headers,
  });
}

/**
 * Quick authentication helper for tests
 */
export async function quickLogin(
  page: Page,
  userType: "standard" | "premium" | "admin" = "standard",
): Promise<void> {
  const credentials = AUTH_CONFIG.testUsers[userType];
  const authHelper = new PageAuthHelper(page);
  await authHelper.loginViaUI(credentials.email, credentials.password);
}

/**
 * Quick API authentication helper
 */
export async function quickApiAuth(
  authManager: ApiAuthManager,
  userType: "standard" | "premium" | "admin" = "standard",
): Promise<TokenStorage> {
  const credentials = AUTH_CONFIG.testUsers[userType];
  return await authManager.authenticate(
    credentials.email,
    credentials.password,
    userType,
  );
}

/**
 * Authentication state for test fixtures
 */
export interface AuthState {
  userKey: string;
  email: string;
  role: string;
  isAuthenticated: boolean;
  tokenExpiry?: number;
}

/**
 * Get current authentication state
 */
export function getAuthState(
  authManager: ApiAuthManager,
  userKey: string = "default",
): AuthState {
  const tokens = authManager.getTokens(userKey);

  return {
    userKey,
    email: tokens?.email || "",
    role: tokens?.role || "",
    isAuthenticated: !!tokens?.accessToken,
    tokenExpiry: tokens?.expiresAt,
  };
}

/**
 * Authentication error types
 */
export class AuthenticationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(message: string = "Token has expired") {
    super(message, "TOKEN_EXPIRED", 401);
    this.name = "TokenExpiredError";
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor(message: string = "Invalid credentials provided") {
    super(message, "INVALID_CREDENTIALS", 401);
    this.name = "InvalidCredentialsError";
  }
}
