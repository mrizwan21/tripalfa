import axios, { AxiosInstance } from 'axios';
import { prisma } from '../database.js';
import { tokenService } from './token.service.js';
import { auditService } from './audit.service.js';
import { UserType } from '../types/index.js';
import type { AuthResult } from '../types/index.js';

// FusionAuth configuration from environment
const FUSIONAUTH_URL = process.env.FUSIONAUTH_URL || 'http://localhost:9011';
const FUSIONAUTH_API_KEY = process.env.FUSIONAUTH_API_KEY || '';
const FUSIONAUTH_TENANT_ID = process.env.FUSIONAUTH_TENANT_ID || '';

// Application IDs
const FUSIONAUTH_B2B_APP_ID = process.env.FUSIONAUTH_B2B_APP_ID || 'b2b-admin-app';
const FUSIONAUTH_B2C_APP_ID = process.env.FUSIONAUTH_B2C_APP_ID || 'b2c-booking-app';

// Client Secrets
const FUSIONAUTH_B2B_CLIENT_SECRET = process.env.FUSIONAUTH_B2B_CLIENT_SECRET || '';
const FUSIONAUTH_B2C_CLIENT_SECRET = process.env.FUSIONAUTH_B2C_CLIENT_SECRET || '';

// JWT Configuration
const FUSIONAUTH_JWT_ISSUER = process.env.FUSIONAUTH_JWT_ISSUER || FUSIONAUTH_URL;

// Frontend URLs
const B2B_FRONTEND_URL = process.env.B2B_FRONTEND_URL || 'http://localhost:5173';
const B2C_FRONTEND_URL = process.env.B2C_FRONTEND_URL || 'http://localhost:5174';

/**
 * FusionAuth User interface
 */
interface FusionAuthUser {
  id?: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  active?: boolean;
  verified?: boolean;
  data?: Record<string, any>;
}

/**
 * FusionAuth Application Registration interface
 */
interface FusionAuthRegistration {
  applicationId: string;
  roles?: string[];
  username?: string;
}

/**
 * FusionAuth Service for handling authentication with FusionAuth
 */
export class FusionAuthService {
  private static instance: FusionAuthService;
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

  static getInstance(): FusionAuthService {
    if (!FusionAuthService.instance) {
      FusionAuthService.instance = new FusionAuthService();
    }
    return FusionAuthService.instance;
  }

  /**
   * Check if FusionAuth is configured and accessible
   */
  async healthCheck(): Promise<{ status: string; version?: string }> {
    try {
      const response = await this.client.get('/api/status');
      return {
        status: 'healthy',
        version: response.data.version,
      };
    } catch (error: unknown) {
      return {
        status: 'unhealthy',
      };
    }
  }

  /**
   * Create a new user in FusionAuth
   */
  async createUser(user: FusionAuthUser, registrations?: FusionAuthRegistration[]): Promise<any> {
    try {
      const response = await this.client.post('/api/user', {
        user: {
          ...user,
          password: user.password,
        },
        registration: registrations?.length ? registrations[0] : undefined,
        skipVerification: false,
        sendSetPasswordEmail: !user.password,
      });

      if (response.data.user) {
        // If there are multiple registrations, add them one by one
        if (registrations && registrations.length > 1) {
          for (let i = 1; i < registrations.length; i++) {
            await this.client.post(`/api/user/registration/${response.data.user.id}`, {
              registration: registrations[i],
            });
          }
        }
      }

      return response.data;
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to create user:',
        (error as any).response?.data || (error instanceof Error ? error.message : 'Unknown error')
      );
      throw new Error(
        (error as any).response?.data?.message || 'Failed to create user in FusionAuth'
      );
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<any | null> {
    try {
      const response = await this.client.get('/api/user', {
        params: { email },
      });
      return response.data.user || null;
    } catch (error: unknown) {
      if ((error as any).response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any | null> {
    try {
      const response = await this.client.get(`/api/user/${userId}`);
      return response.data.user || null;
    } catch (error: unknown) {
      if ((error as any).response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Update user in FusionAuth
   */
  async updateUser(userId: string, updates: Partial<FusionAuthUser>): Promise<any> {
    try {
      const response = await this.client.patch(`/api/user/${userId}`, {
        user: updates,
      });
      return response.data.user;
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to update user:',
        (error as any).response?.data || (error instanceof Error ? error.message : 'Unknown error')
      );
      throw new Error(
        (error as any).response?.data?.message || 'Failed to update user in FusionAuth'
      );
    }
  }

  /**
   * Delete user from FusionAuth
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await this.client.delete(`/api/user/${userId}`);
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to delete user:',
        (error as any).response?.data || (error instanceof Error ? error.message : 'Unknown error')
      );
      throw new Error(
        (error as any).response?.data?.message || 'Failed to delete user from FusionAuth'
      );
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // First verify current password by attempting login
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update password
      await this.client.patch(`/api/user/${userId}`, {
        user: {
          password: newPassword,
        },
      });
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to change password:',
        (error as any).response?.data || (error instanceof Error ? error.message : 'Unknown error')
      );
      throw new Error((error as any).response?.data?.message || 'Failed to change password');
    }
  }

  /**
   * Login user with email and password
   */
  async login(email: string, password: string, applicationId?: string): Promise<any> {
    try {
      const appId = applicationId || FUSIONAUTH_B2C_APP_ID;

      const response = await this.client.post('/api/login', {
        loginId: email,
        password,
        applicationId: appId,
      });

      return response.data;
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Login failed:',
        (error as any).response?.data || (error instanceof Error ? error.message : 'Unknown error')
      );
      throw new Error((error as any).response?.data?.message || 'Login failed');
    }
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthorizationUrl(applicationId?: string, redirectUri?: string, state?: string): string {
    const appId = applicationId || FUSIONAUTH_B2C_APP_ID;
    const redirect = redirectUri || `${B2C_FRONTEND_URL}/auth/callback`;

    const params = new URLSearchParams({
      client_id: appId,
      response_type: 'code',
      redirect_uri: redirect,
      scope: 'openid offline_access',
    });

    if (state) {
      params.append('state', state);
    }

    return `${FUSIONAUTH_URL}/oauth2/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    applicationId?: string,
    redirectUri?: string
  ): Promise<any> {
    try {
      const appId = applicationId || FUSIONAUTH_B2C_APP_ID;
      const clientSecret =
        appId === FUSIONAUTH_B2B_APP_ID
          ? FUSIONAUTH_B2B_CLIENT_SECRET
          : FUSIONAUTH_B2C_CLIENT_SECRET;
      const redirect = redirectUri || `${B2C_FRONTEND_URL}/auth/callback`;

      const response = await this.client.post(
        '/oauth2/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: appId,
          client_secret: clientSecret,
          code,
          redirect_uri: redirect,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Token exchange failed:',
        (error as any).response?.data || (error instanceof Error ? error.message : 'Unknown error')
      );
      throw new Error((error as any).response?.data?.error_description || 'Token exchange failed');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string, applicationId?: string): Promise<any> {
    try {
      const appId = applicationId || FUSIONAUTH_B2C_APP_ID;
      const clientSecret =
        appId === FUSIONAUTH_B2B_APP_ID
          ? FUSIONAUTH_B2B_CLIENT_SECRET
          : FUSIONAUTH_B2C_CLIENT_SECRET;

      const response = await this.client.post(
        '/oauth2/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: appId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Token refresh failed:',
        (error as any).response?.data || (error instanceof Error ? error.message : 'Unknown error')
      );
      throw new Error((error as any).response?.data?.error_description || 'Token refresh failed');
    }
  }

  /**
   * Validate access token and get user info
   */
  async validateToken(accessToken: string): Promise<any> {
    try {
      const response = await this.client.get('/oauth2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Token validation failed:',
        (error as any).response?.data || (error instanceof Error ? error.message : 'Unknown error')
      );
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Logout user (invalidate session)
   */
  async logout(accessToken: string, global: boolean = false): Promise<void> {
    try {
      await this.client.delete('/api/logout', {
        params: {
          global,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Logout failed:',
        (error as any).response?.data || (error instanceof Error ? error.message : 'Unknown error')
      );
      // Don't throw error for logout - best effort
    }
  }

  /**
   * Register user to application
   */
  async registerUserToApplication(
    userId: string,
    applicationId: string,
    roles: string[] = []
  ): Promise<any> {
    try {
      const response = await this.client.post(`/api/user/registration/${userId}`, {
        registration: {
          applicationId,
          roles,
        },
      });
      return response.data;
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Registration failed:',
        (error as any).response?.data || (error instanceof Error ? error.message : 'Unknown error')
      );
      throw new Error(
        (error as any).response?.data?.message || 'Failed to register user to application'
      );
    }
  }

  /**
   * Get user registrations
   */
  async getUserRegistrations(userId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/api/user/${userId}`);
      return response.data.user?.registrations || [];
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to get registrations:',
        (error as any).response?.data || (error instanceof Error ? error.message : 'Unknown error')
      );
      return [];
    }
  }

  /**
   * List all users
   */
  async listUsers(
    applicationId?: string,
    resultsPerPage: number = 100,
    startRow: number = 0
  ): Promise<{ users: any[]; total: number }> {
    try {
      const params: any = {
        results: resultsPerPage,
        startRow,
      };

      if (applicationId) {
        params.applicationId = applicationId;
      }

      const response = await this.client.get('/api/user/search', {
        params: {
          ...params,
          queryString: '*',
        },
      });

      return {
        users: response.data.users || [],
        total: response.data.total || 0,
      };
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to list users:',
        (error as any).response?.data || (error instanceof Error ? error.message : 'Unknown error')
      );
      return { users: [], total: 0 };
    }
  }

  /**
   * Create role in FusionAuth
   */
  async createRole(
    applicationId: string,
    roleName: string,
    description?: string,
    isDefault: boolean = false,
    isSuperRole: boolean = false
  ): Promise<any> {
    try {
      // First get the application to check existing roles
      const appResponse = await this.client.get(`/api/application/${applicationId}`);
      const existingRoles = appResponse.data.application?.roles || [];

      // Check if role already exists
      const existingRole = existingRoles.find((r: any) => r.name === roleName);
      if (existingRole) {
        return existingRole;
      }

      // Add new role to application
      const response = await this.client.patch(`/api/application/${applicationId}`, {
        application: {
          roles: [
            ...existingRoles,
            {
              name: roleName,
              description: description || `${roleName} role`,
              isDefault,
              isSuperRole,
            },
          ],
        },
      });

      return response.data.application?.roles?.find((r: any) => r.name === roleName);
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to create role:',
        (error as any).response?.data || (error instanceof Error ? error.message : 'Unknown error')
      );
      throw new Error((error as any).response?.data?.message || 'Failed to create role');
    }
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, applicationId: string, roleName: string): Promise<void> {
    try {
      // Get current registrations
      const userResponse = await this.client.get(`/api/user/${userId}`);
      const registrations = userResponse.data.user?.registrations || [];

      const registration = registrations.find((r: any) => r.applicationId === applicationId);

      if (!registration) {
        // Register user to application first
        await this.registerUserToApplication(userId, applicationId, [roleName]);
      } else {
        // Update existing registration with new role
        const currentRoles = registration.roles || [];
        if (!currentRoles.includes(roleName)) {
          await this.client.put(`/api/user/registration/${userId}`, {
            registration: {
              applicationId,
              roles: [...currentRoles, roleName],
            },
          });
        }
      }
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to assign role:',
        (error as any).response?.data || (error instanceof Error ? error.message : 'Unknown error')
      );
      throw new Error((error as any).response?.data?.message || 'Failed to assign role');
    }
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, applicationId: string, roleName: string): Promise<void> {
    try {
      const userResponse = await this.client.get(`/api/user/${userId}`);
      const registrations = userResponse.data.user?.registrations || [];

      const registration = registrations.find((r: any) => r.applicationId === applicationId);

      if (registration) {
        const currentRoles = registration.roles || [];
        const updatedRoles = currentRoles.filter((r: string) => r !== roleName);

        await this.client.put(`/api/user/registration/${userId}`, {
          registration: {
            applicationId,
            roles: updatedRoles,
          },
        });
      }
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to remove role:',
        (error as any).response?.data || (error instanceof Error ? error.message : 'Unknown error')
      );
      throw new Error((error as any).response?.data?.message || 'Failed to remove role');
    }
  }

  /**
   * Get application by ID
   */
  async getApplication(applicationId: string): Promise<any> {
    try {
      const response = await this.client.get(`/api/application/${applicationId}`);
      return response.data.application;
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to get application:',
        (error as any).response?.data || (error instanceof Error ? error.message : 'Unknown error')
      );
      throw new Error((error as any).response?.data?.message || 'Failed to get application');
    }
  }

  /**
   * List all applications
   */
  async listApplications(): Promise<any[]> {
    try {
      const response = await this.client.get('/api/application');
      return response.data.applications || [];
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to list applications:',
        (error as any).response?.data || (error instanceof Error ? error.message : 'Unknown error')
      );
      return [];
    }
  }

  /**
   * Get application ID based on user type
   */
  getApplicationId(userType: UserType | string): string {
    return userType === 'B2B' || userType === 'B2B_ADMIN' || userType === 'B2B_EMPLOYEE'
      ? FUSIONAUTH_B2B_APP_ID
      : FUSIONAUTH_B2C_APP_ID;
  }

  /**
   * Get frontend URL based on user type
   */
  getFrontendUrl(userType: UserType | string): string {
    return userType === 'B2B' || userType === 'B2B_ADMIN' || userType === 'B2B_EMPLOYEE'
      ? B2B_FRONTEND_URL
      : B2C_FRONTEND_URL;
  }

  /**
   * Sync user from FusionAuth to local database
   */
  async syncUserToLocal(fusionAuthUser: any): Promise<any> {
    try {
      const email = fusionAuthUser.email;
      const userType = fusionAuthUser.data?.userType || 'B2C';

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
            firstName: fusionAuthUser.firstName || localUser.firstName,
            lastName: fusionAuthUser.lastName || localUser.lastName,
            avatarUrl: fusionAuthUser.imageUrl || localUser.avatarUrl,
            externalId: fusionAuthUser.id,
            isEmailVerified: fusionAuthUser.verified || localUser.isEmailVerified,
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
            name: userType === 'B2B' ? 'B2B_ADMIN' : 'B2C_USER',
            userType: userType as any,
          },
        });

        localUser = await prisma.user.create({
          data: {
            email,
            firstName: fusionAuthUser.firstName,
            lastName: fusionAuthUser.lastName,
            avatarUrl: fusionAuthUser.imageUrl,
            externalId: fusionAuthUser.id,
            userType: userType as any,
            authProvider: 'FUSIONAUTH' as any,
            isEmailVerified: fusionAuthUser.verified || false,
            roleId: defaultRole?.id,
            companyId: fusionAuthUser.data?.companyId,
            lastLoginAt: new Date(),
          },
          include: {
            role: true,
          },
        });
      }

      return localUser;
    } catch (error: unknown) {
      console.error('[FusionAuth] Failed to sync user to local:', error);
      throw error;
    }
  }
}

export const fusionAuthService = FusionAuthService.getInstance();
