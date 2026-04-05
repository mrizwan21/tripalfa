/**
 * FusionAuth Client
 * Handles authentication with FusionAuth server
 */

import axios, { type AxiosInstance } from 'axios';
import type {
  FusionAuthConfig,
  User,
  AuthTokens,
  AuthState,
  LoginOptions,
  LoginResult,
  LogoutOptions,
  TokenResponse,
  AuthEventListener,
  AuthEvent,
} from './types.js';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'fusionauth_access_token',
  REFRESH_TOKEN: 'fusionauth_refresh_token',
  ID_TOKEN: 'fusionauth_id_token',
  EXPIRES_AT: 'fusionauth_expires_at',
  USER: 'fusionauth_user',
};

export class FusionAuthClient {
  private config: Required<FusionAuthConfig>;
  private axios: AxiosInstance;
  private listeners: Set<AuthEventListener> = new Set();
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private state: AuthState = {
    isAuthenticated: false,
    isLoading: false,
    user: null,
    tokens: null,
    error: null,
  };

  constructor(config: FusionAuthConfig) {
    this.config = {
      serverUrl: config.serverUrl.replace(/\/$/, ''),
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      postLogoutRedirectUri: config.postLogoutRedirectUri || config.redirectUri,
      scope: config.scope || 'openid offline_access',
      shouldAutoRefresh: config.shouldAutoRefresh !== false,
      shouldAutoFetchUserInfo: config.shouldAutoFetchUserInfo !== false,
      onRedirect: config.onRedirect || ((url) => { window.location.href = url; }),
    };

    this.axios = axios.create({
      baseURL: this.config.serverUrl,
      timeout: 10000,
    });

    // Initialize from storage
    this.loadFromStorage();

    // Set up auto refresh
    if (this.config.shouldAutoRefresh) {
      this.scheduleTokenRefresh();
    }

    // Listen for visibility change to refresh token
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.state.isAuthenticated) {
          this.checkTokenExpiration();
        }
      });
    }
  }

  // ============================================
  // PUBLIC API
  // ============================================

  /**
   * Get current authentication state
   */
  getState(): AuthState {
    return { ...this.state };
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.state.isAuthenticated && !this.isTokenExpired();
  }

  /**
   * Get current user
   */
  getUser(): User | null {
    return this.state.user;
  }

  /**
   * Get current tokens
   */
  getTokens(): AuthTokens | null {
    return this.state.tokens;
  }

  /**
   * Get access token (refreshes if needed)
   */
  async getAccessToken(): Promise<string | null> {
    if (!this.state.tokens?.accessToken) {
      return null;
    }

    if (this.isTokenExpired()) {
      if (this.config.shouldAutoRefresh) {
        await this.refreshTokens();
      } else {
        return null;
      }
    }

    return this.state.tokens.accessToken;
  }

  /**
   * Start login flow
   */
  login(options: LoginOptions = {}): void {
    const stateParam = this.generateState(options.state);
    const url = new URL(`${this.config.serverUrl}/oauth2/authorize`);

    url.searchParams.set('client_id', this.config.clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', options.redirectUri || this.config.redirectUri);
    url.searchParams.set('scope', this.config.scope);
    url.searchParams.set('state', stateParam);

    if (options.userType) {
      url.searchParams.set('userType', options.userType);
    }

    // Store state for validation
    sessionStorage.setItem('fusionauth_state', stateParam);

    this.config.onRedirect(url.toString());
  }

  /**
   * Login with email and password (via backend)
   */
  async loginWithCredentials(
    email: string,
    password: string,
    userType?: 'B2B' | 'B2C'
  ): Promise<LoginResult> {
    try {
      this.setState({ isLoading: true, error: null });

      const response = await this.axios.post('/auth/fusionauth/login', {
        email,
        password,
        userType,
      });

      const data = response.data?.data || response.data;
      
      if (data.mfaRequired) {
        return {
          success: false,
          requiresMfa: true,
          mfaUserId: data.userId,
        };
      }

      await this.handleTokenResponse(data);
      
      return {
        success: true,
        user: this.state.user!,
        tokens: this.state.tokens!,
      };
    } catch (error: unknown) {
      const errorMessage = (error as any).response?.data?.error || (error as Error)?.message || 'Login failed';
      this.setState({ error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      this.setState({ isLoading: false });
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(code: string, state?: string): Promise<LoginResult> {
    try {
      this.setState({ isLoading: true, error: null });

      // Validate state
      const storedState = sessionStorage.getItem('fusionauth_state');
      if (state && storedState && state !== storedState) {
        throw new Error('Invalid state parameter');
      }
      sessionStorage.removeItem('fusionauth_state');

      // Exchange code for tokens via backend
      const response = await this.axios.post('/auth/fusionauth/exchange', { code });
      const data = response.data;

      await this.handleTokenResponse(data);

      return {
        success: true,
        user: this.state.user!,
        tokens: this.state.tokens!,
      };
    } catch (error: unknown) {
      const errorMessage = (error as any).response?.data?.error || (error as Error)?.message || 'Callback failed';
      this.setState({ error: errorMessage });
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      this.setState({ isLoading: false });
    }
  }

  /**
   * Logout user
   */
  async logout(options: LogoutOptions = {}): Promise<void> {
    try {
      this.setState({ isLoading: true });

      // Call backend logout
      const token = this.state.tokens?.accessToken;
      if (token) {
        try {
          await this.axios.post(
            '/auth/fusionauth/logout',
            { global: options.global },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch {
          // Ignore logout API errors
        }
      }
    } finally {
      this.clearAuth();
      this.setState({ isLoading: false });

      // Redirect to logout URL
      const redirectUrl = options.redirectUri || this.config.postLogoutRedirectUri;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    }
  }

  /**
   * Refresh tokens
   */
  async refreshTokens(): Promise<AuthTokens | null> {
    try {
      const refreshToken = this.state.tokens?.refreshToken;
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.axios.post('/auth/fusionauth/refresh', {
        refreshToken,
      });

      const data = response.data?.data || response.data;
      await this.handleTokenResponse(data);

      return this.state.tokens;
    } catch (error) {
      this.clearAuth();
      this.emit({ type: 'token_expired' });
      return null;
    }
  }

  /**
   * Fetch user info
   */
  async fetchUserInfo(): Promise<User | null> {
    try {
      const token = await this.getAccessToken();
      if (!token) {
        return null;
      }

      const response = await this.axios.get('/auth/fusionauth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = response.data?.data || response.data;
      const user = this.mapToUser(userData);

      this.setState({ user });
      this.saveToStorage();

      return user;
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      return null;
    }
  }

  /**
   * Add event listener
   */
  addEventListener(listener: AuthEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: AuthEventListener): void {
    this.listeners.delete(listener);
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private setState(partial: Partial<AuthState>): void {
    this.state = { ...this.state, ...partial };
  }

  private emit(event: Omit<AuthEvent, 'timestamp'>): void {
    const fullEvent: AuthEvent = {
      ...event,
      timestamp: Date.now(),
    };
    this.listeners.forEach((listener) => {
      try {
        listener(fullEvent);
      } catch (error) {
        console.error('Error in auth event listener:', error);
      }
    });
  }

  private generateState(customState?: string): string {
    const random = Math.random().toString(36).substring(2, 15);
    return customState ? `${customState}:${random}` : random;
  }

  private isTokenExpired(): boolean {
    if (!this.state.tokens?.expiresAt) {
      return true;
    }
    // Consider token expired 60 seconds before actual expiration
    return Date.now() >= this.state.tokens.expiresAt - 60000;
  }

  private checkTokenExpiration(): void {
    if (this.isTokenExpired() && this.state.isAuthenticated) {
      if (this.config.shouldAutoRefresh) {
        this.refreshTokens();
      } else {
        this.emit({ type: 'token_expired' });
      }
    }
  }

  private scheduleTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    if (!this.state.tokens?.expiresAt) {
      return;
    }

    const expiresIn = this.state.tokens.expiresAt - Date.now();
    // Refresh 5 minutes before expiration
    const refreshIn = Math.max(expiresIn - 5 * 60 * 1000, 0);

    this.refreshTimer = setTimeout(() => {
      if (this.state.isAuthenticated) {
        this.refreshTokens();
      }
    }, refreshIn);
  }

  private async handleTokenResponse(data: TokenResponse | any): Promise<void> {
    const accessToken = data.access_token || data.accessToken;
    const refreshToken = data.refresh_token || data.refreshToken;
    const idToken = data.id_token || data.idToken;
    const expiresIn = data.expires_in || data.expiresIn;

    if (!accessToken) {
      throw new Error('No access token in response');
    }

    const expiresAt = expiresIn
      ? Date.now() + expiresIn * 1000
      : Date.now() + 15 * 60 * 1000; // Default 15 minutes

    const tokens: AuthTokens = {
      accessToken,
      refreshToken,
      idToken,
      expiresIn,
      expiresAt,
    };

    this.setState({
      isAuthenticated: true,
      tokens,
      error: null,
    });

    // Fetch user info if configured
    if (this.config.shouldAutoFetchUserInfo) {
      await this.fetchUserInfo();
    }

    this.saveToStorage();
    this.scheduleTokenRefresh();
    this.emit({ type: 'login', payload: { tokens } });
  }

  private mapToUser(data: any): User {
    return {
      id: data.id || data.sub,
      email: data.email,
      firstName: data.firstName || data.given_name,
      lastName: data.lastName || data.family_name,
      fullName: data.fullName || data.name,
      imageUrl: data.imageUrl || data.picture,
      roles: data.roles || [],
      userType: data.userType,
      companyId: data.companyId,
      mfaEnabled: data.mfaEnabled || data.mfa_enabled,
      emailVerified: data.emailVerified || data.email_verified,
      ...data,
    };
  }

  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      if (this.state.tokens) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, this.state.tokens.accessToken);
        if (this.state.tokens.refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, this.state.tokens.refreshToken);
        }
        if (this.state.tokens.idToken) {
          localStorage.setItem(STORAGE_KEYS.ID_TOKEN, this.state.tokens.idToken);
        }
        if (this.state.tokens.expiresAt) {
          localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, String(this.state.tokens.expiresAt));
        }
      }
      if (this.state.user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(this.state.user));
      }
    } catch (error) {
      console.error('Failed to save auth state to storage:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const idToken = localStorage.getItem(STORAGE_KEYS.ID_TOKEN);
      const expiresAtStr = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);

      if (accessToken) {
        const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : undefined;
        const user = userStr ? JSON.parse(userStr) : null;

        this.setState({
          isAuthenticated: true,
          tokens: {
            accessToken,
            refreshToken: refreshToken || undefined,
            idToken: idToken || undefined,
            expiresAt,
          },
          user,
        });
      }
    } catch (error) {
      console.error('Failed to load auth state from storage:', error);
      this.clearAuth();
    }
  }

  private clearAuth(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    this.setState({
      isAuthenticated: false,
      user: null,
      tokens: null,
      error: null,
    });

    if (typeof localStorage !== 'undefined') {
      Object.values(STORAGE_KEYS).forEach((key) => {
        localStorage.removeItem(key);
      });
    }

    this.emit({ type: 'logout' });
  }
}