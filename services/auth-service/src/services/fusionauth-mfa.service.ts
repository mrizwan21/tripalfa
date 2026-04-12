import axios, { AxiosInstance } from 'axios';
import { prisma } from '../database.js';
import { auditService } from './audit.service.js';

// FusionAuth configuration
const FUSIONAUTH_URL = process.env.FUSIONAUTH_URL || 'http://localhost:9011';
const FUSIONAUTH_API_KEY = process.env.FUSIONAUTH_API_KEY || '';

// Application IDs
const FUSIONAUTH_B2B_APP_ID = process.env.FUSIONAUTH_B2B_APP_ID || 'b2b-admin-app';

/**
 * MFA method types
 */
export type MFAMethod = 'authenticator' | 'email' | 'sms';

/**
 * MFA setup result
 */
export interface MFASetupResult {
  success: boolean;
  secret?: string;
  qrCodeUrl?: string;
  recoveryCodes?: string[];
  error?: string;
}

/**
 * MFA verification result
 */
export interface MFAVerificationResult {
  success: boolean;
  trustToken?: string;
  error?: string;
}

/**
 * Multi-Factor Authentication Service for FusionAuth
 */
class FusionAuthMFAService {
  private static instance: FusionAuthMFAService;
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

  static getInstance(): FusionAuthMFAService {
    if (!FusionAuthMFAService.instance) {
      FusionAuthMFAService.instance = new FusionAuthMFAService();
    }
    return FusionAuthMFAService.instance;
  }

  /**
   * Enable MFA for a user
   */
  async enableMFA(userId: string): Promise<MFASetupResult> {
    try {
      // Generate secret for authenticator app
      const response = await this.client.post('/api/two-factor/enable', {
        userId,
        method: 'authenticator',
      });

      const { secret, qrCodeUrl, recoveryCodes } = response.data;

      // Store MFA secret in user data
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: false, // Not enabled until verified
          mfaSecret: secret,
        },
      });

      await auditService.logSecurityEvent({
        userId,
        action: 'mfa_setup_initiated',
      });

      return {
        success: true,
        secret,
        qrCodeUrl,
        recoveryCodes,
      };
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to enable MFA:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return {
        success: false,
        error:
          (error as any).response?.data?.message ||
          (error instanceof Error ? error.message : 'Unknown error'),
      };
    }
  }

  /**
   * Verify MFA setup with TOTP code
   */
  async verifyMFASetup(userId: string, code: string): Promise<MFAVerificationResult> {
    try {
      // Verify the TOTP code
      const response = await this.client.post('/api/two-factor/verify', {
        userId,
        code,
      });

      if (response.data.verified) {
        // Mark MFA as enabled
        await prisma.user.update({
          where: { id: userId },
          data: {
            mfaEnabled: true,
          },
        });

        await auditService.logSecurityEvent({
          userId,
          action: 'mfa_enabled',
        });

        return {
          success: true,
          trustToken: response.data.trustToken,
        };
      } else {
        return {
          success: false,
          error: 'Invalid verification code',
        };
      }
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] MFA verification failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return {
        success: false,
        error:
          (error as any).response?.data?.message ||
          (error instanceof Error ? error.message : 'Unknown error'),
      };
    }
  }

  /**
   * Disable MFA for a user
   */
  async disableMFA(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.post('/api/two-factor/disable', {
        userId,
      });

      // Clear MFA settings
      await prisma.user.update({
        where: { id: userId },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
        },
      });

      await auditService.logSecurityEvent({
        userId,
        action: 'mfa_disabled',
      });

      return { success: true };
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to disable MFA:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return {
        success: false,
        error:
          (error as any).response?.data?.message ||
          (error instanceof Error ? error.message : 'Unknown error'),
      };
    }
  }

  /**
   * Verify MFA code during login
   */
  async verifyMFACode(
    userId: string,
    code: string,
    trustToken?: string
  ): Promise<MFAVerificationResult> {
    try {
      const response = await this.client.post('/api/two-factor/verify', {
        userId,
        code,
        trustToken,
      });

      if (response.data.verified) {
        await auditService.logLoginAttempt({
          userId,
          action: 'mfa_verify',
          status: 'success',
          ipAddress: '127.0.0.1',
        });

        return {
          success: true,
          trustToken: response.data.trustToken,
        };
      } else {
        await auditService.logLoginAttempt({
          userId,
          action: 'mfa_verify',
          status: 'failed',
          failureReason: 'Invalid MFA code',
          ipAddress: '127.0.0.1',
        });

        return {
          success: false,
          error: 'Invalid verification code',
        };
      }
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] MFA verification failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return {
        success: false,
        error:
          (error as any).response?.data?.message ||
          (error instanceof Error ? error.message : 'Unknown error'),
      };
    }
  }

  /**
   * Send MFA code via email
   */
  async sendEmailCode(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.post('/api/two-factor/send', {
        userId,
        method: 'email',
      });

      await auditService.logSecurityEvent({
        userId,
        action: 'mfa_email_sent',
      });

      return { success: true };
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to send MFA email:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return {
        success: false,
        error:
          (error as any).response?.data?.message ||
          (error instanceof Error ? error.message : 'Unknown error'),
      };
    }
  }

  /**
   * Send MFA code via SMS
   */
  async sendSMSCode(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      await this.client.post('/api/two-factor/send', {
        userId,
        method: 'sms',
      });

      await auditService.logSecurityEvent({
        userId,
        action: 'mfa_sms_sent',
      });

      return { success: true };
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to send MFA SMS:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return {
        success: false,
        error:
          (error as any).response?.data?.message ||
          (error instanceof Error ? error.message : 'Unknown error'),
      };
    }
  }

  /**
   * Generate new recovery codes
   */
  async generateRecoveryCodes(userId: string): Promise<string[]> {
    try {
      const response = await this.client.post('/api/two-factor/recovery-codes', {
        userId,
      });

      return response.data.recoveryCodes || [];
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to generate recovery codes:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Check if user has MFA enabled
   */
  async isMFAEnabled(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { mfaEnabled: true },
      });

      return user?.mfaEnabled || false;
    } catch (error: unknown) {
      return false;
    }
  }

  /**
   * Get user's MFA methods
   */
  async getMFAMethods(userId: string): Promise<MFAMethod[]> {
    try {
      const response = await this.client.get(`/api/user/${userId}`);
      const twoFactor = response.data.user?.twoFactor;

      if (!twoFactor?.methods) {
        return [];
      }

      return twoFactor.methods.map((m: any) => m.method as MFAMethod);
    } catch (error: unknown) {
      console.error(
        '[FusionAuth] Failed to get MFA methods:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      return [];
    }
  }

  /**
   * Require MFA for B2B users
   */
  async requireMFAForB2BUser(userId: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { userType: true, mfaEnabled: true },
      });

      // B2B users should have MFA enabled
      if (
        user?.userType === 'B2B' ||
        user?.userType === 'B2B_ADMIN' ||
        user?.userType === 'B2B_EMPLOYEE'
      ) {
        return !user.mfaEnabled;
      }

      return false;
    } catch (error: unknown) {
      return false;
    }
  }
}

export const fusionAuthMFAService = FusionAuthMFAService.getInstance();
