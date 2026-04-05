import { prisma } from '../database.js';
import { ipManagementService } from './ip-management.service.js';
import { auditService } from './audit.service.js';

/**
 * Security configuration for FusionAuth
 */
export interface SecurityConfig {
  userId: string;
  ipAddress: string;
  userAgent?: string;
  companyId?: string;
  userType?: string;
}

/**
 * Security check result
 */
export interface SecurityCheckResult {
  allowed: boolean;
  reason?: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requireMfa: boolean;
  requireRecovery: boolean;
  checks: {
    ipAllowed: boolean;
    countryAllowed: boolean;
    vpnAllowed: boolean;
    proxyAllowed: boolean;
    torAllowed: boolean;
    anomalyDetected: boolean;
  };
}

/**
 * FusionAuth Security Service
 * Integrates IP management and security policies with FusionAuth
 */
export class FusionAuthService {
  private static instance: FusionAuthService;

  private constructor() {}

  static getInstance(): FusionAuthService {
    if (!FusionAuthService.instance) {
      FusionAuthService.instance = new FusionAuthService();
    }
    return FusionAuthService.instance;
  }

  /**
   * Perform comprehensive security check before authentication
   */
  async performSecurityCheck(config: SecurityConfig): Promise<SecurityCheckResult> {
    const { userId, ipAddress, companyId, userType } = config;

    // Get IP access check from existing service
    const ipCheck = await ipManagementService.checkIpAccess(ipAddress, userId, companyId);

    // Get anomaly detection
    const anomalies = await ipManagementService.detectAnomalousActivity(userId, ipAddress);

    // Calculate risk score
    let riskScore = ipCheck.riskScore;

    // Adjust for anomalies
    if (anomalies.isNewIp) riskScore += 10;
    if (anomalies.isNewLocation) riskScore += 20;
    if (anomalies.failedAttempts > 2) riskScore += 30;

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 90) riskLevel = 'critical';
    else if (riskScore >= 70) riskLevel = 'high';
    else if (riskScore >= 40) riskLevel = 'medium';
    else riskLevel = 'low';

    // Determine if MFA is required
    const requireMfa = this.shouldRequireMfa(riskScore, userType, anomalies);

    // Determine if recovery is required
    const requireRecovery = riskScore >= 90;

    const result: SecurityCheckResult = {
      allowed: riskScore < 100,
      reason: riskScore >= 100 ? ipCheck.reason : undefined,
      riskScore,
      riskLevel,
      requireMfa,
      requireRecovery,
      checks: {
        ipAllowed: !ipCheck.checks.ipBlacklisted,
        countryAllowed: !ipCheck.checks.countryBlocked,
        vpnAllowed: !ipCheck.checks.vpnDetected,
        proxyAllowed: !ipCheck.checks.proxyDetected,
        torAllowed: !ipCheck.checks.torDetected,
        anomalyDetected: anomalies.isNewIp || anomalies.isNewLocation,
      },
    };

    // Log security check
    await this.logSecurityCheck(config, result);

    return result;
  }

  /**
   * Determine if MFA should be required based on risk and user type
   */
  private shouldRequireMfa(riskScore: number, userType?: string, anomalies?: any): boolean {
    // Always require MFA for B2B users if risk is elevated
    if (userType === 'B2B' || userType === 'B2B_ADMIN' || userType === 'B2B_EMPLOYEE') {
      return riskScore >= 30;
    }

    // For B2C users, require MFA if high risk
    if (riskScore >= 70) return true;

    // Require MFA for anomalies
    if (anomalies?.isNewIp && anomalies?.isNewLocation) return true;
    if (anomalies?.failedAttempts > 2) return true;

    return false;
  }

  /**
   * Log security check result
   */
  private async logSecurityCheck(
    config: SecurityConfig,
    result: SecurityCheckResult
  ): Promise<void> {
    try {
      await ipManagementService.logIpAccess({
        ipAddress: config.ipAddress,
        userId: config.userId,
        action: 'security_check',
        userAgent: config.userAgent,
        countryCode: result.checks.countryAllowed ? undefined : 'BLOCKED',
        isVpn: !result.checks.vpnAllowed,
        isProxy: !result.checks.proxyAllowed,
        isTor: !result.checks.torAllowed,
      });

      if (!result.allowed) {
        await auditService.logSecurityEvent({
          userId: config.userId,
          action: 'security_check_failed',
          metadata: {
            ipAddress: config.ipAddress,
            reason: result.reason,
            riskScore: result.riskScore,
            riskLevel: result.riskLevel,
          },
        });
      }
    } catch (error: unknown) {
      console.error('[FusionAuth Security] Failed to log security check:', error);
    }
  }

  /**
   * Get security policy for company
   */
  async getSecurityPolicy(companyId?: string): Promise<any> {
    return prisma.security_policy.findFirst({
      where: {
        companyId: companyId || null,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });
  }

  /**
   * Update security policy
   */
  async updateSecurityPolicy(
    companyId: string,
    policy: {
      enableGeoBlocking?: boolean;
      blockedCountries?: string[];
      allowVpn?: boolean;
      allowProxy?: boolean;
      allowTor?: boolean;
      requireMfaForHighRisk?: boolean;
      maxFailedAttempts?: number;
      lockoutDurationMinutes?: number;
    }
  ): Promise<void> {
    try {
      const existingPolicy = await prisma.security_policy.findFirst({
        where: { companyId },
      });

      if (existingPolicy) {
        await prisma.security_policy.update({
          where: { id: existingPolicy.id },
          data: {
            ...policy,
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.security_policy.create({
          data: {
            companyId,
            name: `${companyId} Security Policy`,
            isActive: true,
            priority: 100,
            ...policy,
          },
        });
      }

      await auditService.logSecurityEvent({
        companyId,
        action: 'security_policy_updated',
        metadata: { policy },
      });
    } catch (error: unknown) {
      console.error(
        '[FusionAuth Security] Failed to update security policy:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  /**
   * Get IP whitelist/blacklist entries
   */
  async getIpEntries(filters?: {
    userId?: string;
    companyId?: string;
    isBlacklist?: boolean;
  }): Promise<any[]> {
    return ipManagementService.getWhitelistEntries(filters);
  }

  /**
   * Add IP to whitelist
   */
  async addToWhitelist(data: {
    ipAddress: string;
    ipRange?: string;
    description?: string;
    userId?: string;
    companyId?: string;
    expiresAt?: Date;
    createdBy?: string;
  }): Promise<any> {
    return ipManagementService.addToWhitelist({
      ...data,
      isBlacklist: false,
    });
  }

  /**
   * Add IP to blacklist
   */
  async addToBlacklist(data: {
    ipAddress: string;
    ipRange?: string;
    description?: string;
    userId?: string;
    companyId?: string;
    expiresAt?: Date;
    createdBy?: string;
  }): Promise<any> {
    return ipManagementService.addToWhitelist({
      ...data,
      isBlacklist: true,
    });
  }

  /**
   * Remove IP from whitelist/blacklist
   */
  async removeIpEntry(id: string): Promise<any> {
    return ipManagementService.removeFromWhitelist(id);
  }

  /**
   * Get login audit logs
   */
  async getLoginAuditLogs(filters?: {
    userId?: string;
    ipAddress?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }): Promise<any[]> {
    return prisma.login_audit.findMany({
      where: {
        userId: filters?.userId,
        ipAddress: filters?.ipAddress,
        createdAt: {
          gte: filters?.startDate,
          lte: filters?.endDate,
        },
        status: filters?.status,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Get IP audit logs
   */
  async getIpAuditLogs(filters?: {
    userId?: string;
    ipAddress?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<any[]> {
    return prisma.ip_audit_log.findMany({
      where: {
        userId: filters?.userId,
        ipAddress: filters?.ipAddress,
        action: filters?.action,
        createdAt: {
          gte: filters?.startDate,
          lte: filters?.endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Check if IP is blocked
   */
  async isIpBlocked(ipAddress: string, userId?: string, companyId?: string): Promise<boolean> {
    const result = await ipManagementService.checkIpAccess(ipAddress, userId, companyId);
    return !result.allowed;
  }

  /**
   * Get blocked IPs for company
   */
  async getBlockedIps(companyId?: string): Promise<any[]> {
    return prisma.ip_whitelist.findMany({
      where: {
        companyId,
        isBlacklist: true,
        isActive: true,
      },
    });
  }

  /**
   * Clear IP cache
   */
  clearIpCache(): void {
    ipManagementService.clearCache();
  }

  /**
   * Get security statistics
   */
  async getSecurityStats(companyId?: string): Promise<{
    totalBlockedIps: number;
    totalWhitelistedIps: number;
    recentSecurityEvents: number;
    failedLoginAttempts: number;
  }> {
    const [blockedIps, whitelistedIps, securityEvents, failedLogins] = await Promise.all([
      prisma.ip_whitelist.count({
        where: { companyId, isBlacklist: true, isActive: true },
      }),
      prisma.ip_whitelist.count({
        where: { companyId, isBlacklist: false, isActive: true },
      }),
      (prisma as any).security_audit.count({
        where: {
          companyId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.login_audit.count({
        where: {
          userId: companyId || undefined,
          status: 'failed',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      totalBlockedIps: blockedIps,
      totalWhitelistedIps: whitelistedIps,
      recentSecurityEvents: securityEvents,
      failedLoginAttempts: failedLogins,
    };
  }
}

export const fusionAuthService = FusionAuthService.getInstance();
