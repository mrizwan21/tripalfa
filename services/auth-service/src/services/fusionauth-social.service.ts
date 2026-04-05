import axios, { AxiosInstance } from 'axios';
import { prisma } from '../database.js';
import { tokenService } from './token.service.js';
import { auditService } from './audit.service.js';

// FusionAuth configuration
const FUSIONAUTH_URL = process.env.FUSIONAUTH_URL || 'http://localhost:9011';
const FUSIONAUTH_API_KEY = process.env.FUSIONAUTH_API_KEY || '';
const FUSIONAUTH_TENANT_ID = process.env.FUSIONAUTH_TENANT_ID || '';

// Application IDs
const FUSIONAUTH_B2C_APP_ID = process.env.FUSIONAUTH_B2C_APP_ID || 'b2c-booking-app';

// Social Provider IDs (configured in FusionAuth)
const GOOGLE_IDENTITY_PROVIDER_ID = process.env.FUSIONAUTH_GOOGLE_PROVIDER_ID || '';
const FACEBOOK_IDENTITY_PROVIDER_ID = process.env.FUSIONAUTH_FACEBOOK_PROVIDER_ID || '';
const APPLE_IDENTITY_PROVIDER_ID = process.env.FUSIONAUTH_APPLE_PROVIDER_ID || '';

// Frontend URL
const B2C_FRONTEND_URL = process.env.B2C_FRONTEND_URL || 'http://localhost:5174';

/**
 * Social login providers
 */
export type SocialProvider = 'google' | 'facebook' | 'apple';

/**
 * Social login result
 */
export interface SocialLoginResult {
  success: boolean;
  user?: any;
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  error?: string;
}

/**
 * Social Login Service for FusionAuth
 */
export class FusionAuthSocialService {
  private static instance: FusionAuthSocialService;
  private client: AxiosInstance;

  private constructor() {
    this.client = axios.create({
      baseURL: FUSIONAUTH_URL,
      headers: {
        Authorization: FUSIONAUTH_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  static getInstance(): FusionAuthSocialService {
    if (!FusionAuthSocialService.instance) {
      FusionAuthSocialService.instance = new FusionAuthSocialService();
    }
    return FusionAuthSocialService.instance;
  }

  /**
   * Get identity provider ID for social provider
   */
  private getIdentityProviderId(provider: SocialProvider): string {
    switch (provider) {
      case 'google':
        return GOOGLE_IDENTITY_PROVIDER_ID;
      case 'facebook':
        return FACEBOOK_IDENTITY_PROVIDER_ID;
      case 'apple':
        return APPLE_IDENTITY_PROVIDER_ID;
      default:
        throw new Error(`Unknown social provider: ${provider}`);
    }
  }

  /**
   * Generate social login URL
   */
  getSocialLoginUrl(provider: SocialProvider, redirectUri?: string, state?: string): string {
    const providerId = this.getIdentityProviderId(provider);
    const redirect = redirectUri || `${B2C_FRONTEND_URL}/auth/callback`;

    const params = new URLSearchParams({
      client_id: FUSIONAUTH_B2C_APP_ID,
      response_type: 'code',
      redirect_uri: redirect,
      scope: 'openid offline_access',
      identity_provider_id: providerId,
    });

    if (state) {
      params.append('state', state);
    }

    return `${FUSIONAUTH_URL}/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Get Google login URL
   */
  getGoogleLoginUrl(redirectUri?: string, state?: string): string {
    return this.getSocialLoginUrl('google', redirectUri, state);
  }

  /**
   * Get Facebook login URL
   */
  getFacebookLoginUrl(redirectUri?: string, state?: string): string {
    return this.getSocialLoginUrl('facebook', redirectUri, state);
  }

  /**
   * Get Apple login URL
   */
  getAppleLoginUrl(redirectUri?: string, state?: string): string {
    return this.getSocialLoginUrl('apple', redirectUri, state);
  }

  /**
   * Handle social login callback
   */
  async handleSocialCallback(
    code: string,
    provider: SocialProvider,
    redirectUri?: string
  ): Promise<SocialLoginResult> {
    try {
      const redirect = redirectUri || `${B2C_FRONTEND_URL}/auth/callback`;

      // Exchange code for tokens
      const tokenResponse = await this.client.post(
        '/oauth2/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: FUSIONAUTH_B2C_APP_ID,
          code,
          redirect_uri: redirect,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, id_token } = tokenResponse.data;

      if (!access_token) {
        throw new Error('No access token received');
      }

      // Get user info
      const userInfoResponse = await this.client.get('/oauth2/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const userInfo = userInfoResponse.data;

      // Sync user to local database
      const localUser = await this.syncSocialUser(userInfo, provider);

      // Log successful login
      await auditService.logLoginAttempt({
        userId: localUser.id,
        email: userInfo.email,
        action: 'social_login',
        status: 'success',
        ipAddress: '127.0.0.1',
        metadata: {
          provider,
          fusionAuthId: userInfo.sub,
        },
      });

      return {
        success: true,
        user: localUser,
        accessToken: access_token,
        refreshToken: refresh_token,
        idToken: id_token,
      };
    } catch (error: unknown) {
      console.error(
        `[FusionAuth] Social login failed for ${provider}:`,
        error instanceof Error ? error.message : 'Unknown error'
      );

      await auditService.logLoginAttempt({
        email: 'unknown',
        action: 'social_login',
        status: 'failed',
        ipAddress: '127.0.0.1',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        metadata: { provider },
      });

      return {
        success: false,
        error:
          (error as any).response?.data?.error_description ||
          (error instanceof Error ? error.message : 'Unknown error'),
      };
    }
  }

  /**
   * Sync social user to local database
   */
  private async syncSocialUser(userInfo: any, provider: SocialProvider): Promise<any> {
    const email = userInfo.email;
    const providerId = userInfo.sub;

    // Check if user exists locally
    let localUser = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });

    if (localUser) {
      // Update existing user
      localUser = await prisma.user.update({
        where: { id: localUser.id },
        data: {
          firstName: userInfo.given_name || localUser.firstName,
          lastName: userInfo.family_name || localUser.lastName,
          avatarUrl: userInfo.picture || localUser.avatarUrl,
          externalId: providerId,
          authProvider: provider.toUpperCase() as any,
          isEmailVerified: userInfo.email_verified || localUser.isEmailVerified,
          lastLoginAt: new Date(),
        },
        include: {
          role: true,
        },
      });
    } else {
      // Create new user
      const defaultRole = await prisma.role.findFirst({
        where: {
          name: 'user',
          userType: 'B2C',
        },
      });

      localUser = await prisma.user.create({
        data: {
          email,
          firstName: userInfo.given_name,
          lastName: userInfo.family_name,
          avatarUrl: userInfo.picture,
          externalId: providerId,
          userType: 'B2C',
          authProvider: provider.toUpperCase() as any,
          isEmailVerified: userInfo.email_verified || false,
          roleId: defaultRole?.id,
          lastLoginAt: new Date(),
        },
        include: {
          role: true,
        },
      });
    }

    return localUser;
  }

  /**
   * Link social account to existing user
   */
  async linkSocialAccount(
    userId: string,
    provider: SocialProvider,
    socialUserId: string
  ): Promise<void> {
    try {
      // Store social account link in user data
      await prisma.user.update({
        where: { id: userId },
        data: {
          externalId: socialUserId,
          authProvider: provider.toUpperCase() as any,
        },
      });

      await auditService.logSecurityEvent({
        userId,
        action: 'social_account_linked',
        metadata: { provider, socialUserId },
      } as any);

      await auditService.logSecurityEvent({
        userId,
        action: 'social_account_unlinked',
        metadata: { provider },
      } as any);
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to link social account:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Check if social provider is configured
   */
  isProviderConfigured(provider: SocialProvider): boolean {
    const providerId = this.getIdentityProviderId(provider);
    return !!providerId;
  }

  /**
   * Get configured social providers
   */
  getConfiguredProviders(): SocialProvider[] {
    const providers: SocialProvider[] = [];

    if (GOOGLE_IDENTITY_PROVIDER_ID) {
      providers.push('google');
    }
    if (FACEBOOK_IDENTITY_PROVIDER_ID) {
      providers.push('facebook');
    }
    if (APPLE_IDENTITY_PROVIDER_ID) {
      providers.push('apple');
    }

    return providers;
  }
}

export const fusionAuthService = FusionAuthSocialService.getInstance();
