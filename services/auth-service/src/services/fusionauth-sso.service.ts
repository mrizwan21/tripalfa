import axios, { AxiosInstance } from 'axios';
import { prisma } from '../database.js';
import { auditService } from './audit.service.js';

// FusionAuth configuration
const FUSIONAUTH_URL = process.env.FUSIONAUTH_URL || 'http://localhost:9011';
const FUSIONAUTH_API_KEY = process.env.FUSIONAUTH_API_KEY || '';
const FUSIONAUTH_TENANT_ID = process.env.FUSIONAUTH_TENANT_ID || '';

// Application IDs
const FUSIONAUTH_B2B_APP_ID = process.env.FUSIONAUTH_B2B_APP_ID || 'b2b-admin-app';

// SAML/OIDC Provider IDs (configured in FusionAuth)
const SAML_IDENTITY_PROVIDER_ID = process.env.FUSIONAUTH_SAML_PROVIDER_ID || '';
const OIDC_IDENTITY_PROVIDER_ID = process.env.FUSIONAUTH_OIDC_PROVIDER_ID || '';

// Frontend URL
const B2B_FRONTEND_URL = process.env.B2B_FRONTEND_URL || 'http://localhost:5173';

/**
 * SSO provider types
 */
export type SSOProvider = 'saml' | 'oidc';

/**
 * SSO configuration for company
 */
export interface SSOConfig {
  id?: string;
  companyId: string;
  provider: SSOProvider;
  providerName: string;
  domain: string;
  entityId?: string;
  ssoUrl?: string;
  sloUrl?: string;
  certificate?: string;
  clientId?: string;
  clientSecret?: string;
  issuer?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  userinfoEndpoint?: string;
  isActive?: boolean;
}

/**
 * SSO login result
 */
export interface SSOLoginResult {
  success: boolean;
  user?: any;
  accessToken?: string;
  refreshToken?: string;
  error?: string;
}

/**
 * Single Sign-On Service for FusionAuth
 */
class FusionAuthSSOService {
  private static instance: FusionAuthSSOService;
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

  static getInstance(): FusionAuthSSOService {
    if (!FusionAuthSSOService.instance) {
      FusionAuthSSOService.instance = new FusionAuthSSOService();
    }
    return FusionAuthSSOService.instance;
  }

  /**
   * Configure SAML SSO for a company
   */
  async configureSAMLSSO(config: SSOConfig): Promise<SSOConfig> {
    try {
      const providerData = {
        identityProvider: {
          type: 'SAMLv2',
          name: config.providerName,
          id: config.id || `saml-${config.companyId}`,
          applicationConfiguration: {
            [FUSIONAUTH_B2B_APP_ID]: {
              createRegistration: true,
              enabled: true,
            },
          },
          debug: false,
          enabled: true,
          idpEndpoint: config.ssoUrl,
          issuer: config.entityId,
          useNameIdForEmail: true,
          configuration: {
            destinationVerificationUrl: config.ssoUrl,
            xmlSignatureC14nMethod: 'exclusive_with_comments',
            requireSignedRequests: false,
          },
        },
      };

      let response;
      if (config.id) {
        response = await this.client.put(`/api/identity-provider/${config.id}`, providerData);
      } else {
        response = await this.client.post('/api/identity-provider', providerData);
      }

      const providerId = response.data.identityProvider?.id;

      const ssoConfig = await this.storeSSOConfig({
        ...config,
        id: providerId,
      });

      await auditService.logSecurityEvent({
        companyId: config.companyId,
        action: 'sso_saml_configured',
        metadata: { providerId, domain: config.domain },
      } as any);

      return ssoConfig;
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to configure SAML SSO:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw new Error((error as any).response?.data?.message || 'Failed to configure SAML SSO');
    }
  }

  /**
   * Configure OIDC SSO for a company
   */
  async configureOIDCSSO(config: SSOConfig): Promise<SSOConfig> {
    try {
      const providerData = {
        identityProvider: {
          type: 'OpenIDConnect',
          name: config.providerName,
          id: config.id || `oidc-${config.companyId}`,
          applicationConfiguration: {
            [FUSIONAUTH_B2B_APP_ID]: {
              createRegistration: true,
              enabled: true,
            },
          },
          debug: false,
          enabled: true,
          oauth2: {
            authorization_endpoint: config.authorizationEndpoint,
            token_endpoint: config.tokenEndpoint,
            userinfo_endpoint: config.userinfoEndpoint,
            client_id: config.clientId,
            client_secret: config.clientSecret,
            scope: 'openid email profile',
          },
          domains: [config.domain],
        },
      };

      let response;
      if (config.id) {
        response = await this.client.put(`/api/identity-provider/${config.id}`, providerData);
      } else {
        response = await this.client.post('/api/identity-provider', providerData);
      }

      const providerId = response.data.identityProvider?.id;

      const ssoConfig = await this.storeSSOConfig({
        ...config,
        id: providerId,
      });

      await auditService.logSecurityEvent({
        companyId: config.companyId,
        action: 'sso_oidc_configured',
        metadata: { providerId, domain: config.domain },
      } as any);

      return ssoConfig;
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to configure OIDC SSO:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw new Error((error as any).response?.data?.message || 'Failed to configure OIDC SSO');
    }
  }

  /**
   * Store SSO configuration in database
   */
  private async storeSSOConfig(config: SSOConfig): Promise<SSOConfig> {
    const company = await prisma.company.findUnique({
      where: { id: config.companyId },
    });

    if (company) {
      const ssoSettings = {
        id: config.id,
        provider: config.provider,
        providerName: config.providerName,
        domain: config.domain,
        entityId: config.entityId,
        ssoUrl: config.ssoUrl,
        sloUrl: config.sloUrl,
        clientId: config.clientId,
        issuer: config.issuer,
        authorizationEndpoint: config.authorizationEndpoint,
        tokenEndpoint: config.tokenEndpoint,
        userinfoEndpoint: config.userinfoEndpoint,
        isActive: config.isActive ?? true,
      };

      await prisma.company.update({
        where: { id: config.companyId },
        data: {
          settings: {
            ...((company as any).settings || {}),
            sso: ssoSettings,
          },
        },
      });
    }

    return config;
  }

  /**
   * Get SSO configuration for company
   */
  async getSSOConfig(companyId: string): Promise<SSOConfig | null> {
    try {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { settings: true },
      });

      const settings = (company as any)?.settings;
      return settings?.sso || null;
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to get SSO config:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return null;
    }
  }

  /**
   * Get SSO login URL
   */
  getSSOLoginUrl(providerId: string, redirectUri?: string, state?: string): string {
    const redirect = redirectUri || `${B2B_FRONTEND_URL}/auth/callback`;

    const params = new URLSearchParams({
      client_id: FUSIONAUTH_B2B_APP_ID,
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
   * Handle SSO callback
   */
  async handleSSOCallback(
    code: string,
    providerId: string,
    redirectUri?: string
  ): Promise<SSOLoginResult> {
    try {
      const redirect = redirectUri || `${B2B_FRONTEND_URL}/auth/callback`;

      const tokenResponse = await this.client.post(
        '/oauth2/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: FUSIONAUTH_B2B_APP_ID,
          code,
          redirect_uri: redirect,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token } = tokenResponse.data;

      if (!access_token) {
        throw new Error('No access token received');
      }

      const userInfoResponse = await this.client.get('/oauth2/userinfo', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      const userInfo = userInfoResponse.data;

      const localUser = await this.syncSSOUser(userInfo, providerId);

      await auditService.logLoginAttempt({
        userId: localUser.id,
        email: userInfo.email,
        action: 'sso_login',
        status: 'success',
        ipAddress: '127.0.0.1',
        metadata: {
          providerId,
          fusionAuthId: userInfo.sub,
        },
      });

      return {
        success: true,
        user: localUser,
        accessToken: access_token,
        refreshToken: refresh_token,
      };
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] SSO login failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );

      await auditService.logLoginAttempt({
        email: 'unknown',
        action: 'sso_login',
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        ipAddress: 'unknown',
        metadata: { providerId },
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
   * Sync SSO user to local database
   */
  private async syncSSOUser(userInfo: any, providerId: string): Promise<any> {
    const email = userInfo.email;
    const domain = email.split('@')[1];

    const company = await prisma.company.findFirst({
      where: {
        settings: {
          path: ['sso', 'domain'],
          equals: domain,
        },
      },
    });

    let localUser = await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });

    if (localUser) {
      localUser = await prisma.user.update({
        where: { id: localUser.id },
        data: {
          firstName: userInfo.given_name || localUser.firstName,
          lastName: userInfo.family_name || localUser.lastName,
          externalId: userInfo.sub,
          authProvider: 'SSO' as any,
          isEmailVerified: userInfo.email_verified || localUser.isEmailVerified,
          companyId: company?.id || localUser.companyId,
          lastLoginAt: new Date(),
        },
        include: {
          role: true,
        },
      });
    } else {
      const defaultRole = await prisma.role.findFirst({
        where: {
          name: 'employee',
          userType: 'B2B' as any,
        },
      });

      localUser = await prisma.user.create({
        data: {
          email,
          firstName: userInfo.given_name,
          lastName: userInfo.family_name,
          externalId: userInfo.sub,
          userType: 'B2B' as any,
          authProvider: 'SSO' as any,
          isEmailVerified: userInfo.email_verified || false,
          roleId: defaultRole?.id,
          companyId: company?.id,
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
   * Enable SSO for company
   */
  async enableSSO(companyId: string): Promise<void> {
    try {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { settings: true },
      });

      const settings = (company as any)?.settings || {};
      settings.sso = {
        ...settings.sso,
        isActive: true,
      };

      await prisma.company.update({
        where: { id: companyId },
        data: { settings: settings as any },
      });

      await auditService.logSecurityEvent({
        companyId,
        action: 'sso_enabled',
      } as any);
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to enable SSO:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Disable SSO for company
   */
  async disableSSO(companyId: string): Promise<void> {
    try {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { settings: true },
      });

      const settings = (company as any)?.settings || {};
      settings.sso = {
        ...settings.sso,
        isActive: false,
      };

      await prisma.company.update({
        where: { id: companyId },
        data: { settings: settings as any },
      });

      await auditService.logSecurityEvent({
        companyId,
        action: 'sso_disabled',
      } as any);
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to disable SSO:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Check if company has SSO enabled
   */
  async isSSOEnabled(companyId: string): Promise<boolean> {
    try {
      const config = await this.getSSOConfig(companyId);
      return config?.isActive ?? false;
    } catch (error: unknown) {
      return false;
    }
  }

  /**
   * Get SSO provider for domain
   */
  async getSSOProviderForDomain(domain: string): Promise<SSOConfig | null> {
    try {
      const company = await prisma.company.findFirst({
        where: {
          settings: {
            path: ['sso', 'domain'],
            equals: domain,
          },
        },
        select: { settings: true },
      });

      const settings = (company as any)?.settings;
      return settings?.sso || null;
    } catch (error: unknown) {
      return null;
    }
  }
}

export const fusionAuthSSOService = FusionAuthSSOService.getInstance();
