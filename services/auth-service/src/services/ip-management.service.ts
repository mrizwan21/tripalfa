import { prisma } from '../database.js';

export interface IpAccessCheckResult {
  allowed: boolean;
  reason?: string;
  riskScore: number;
  checks: {
    ipBlacklisted: boolean;
    countryBlocked: boolean;
    vpnDetected: boolean;
    proxyDetected: boolean;
    torDetected: boolean;
  };
}

export interface AnomalousActivityResult {
  isNewIp: boolean;
  isNewLocation: boolean;
  failedAttempts: number;
}

export interface IpWhitelistEntry {
  id: string;
  ipAddress: string;
  ipRange?: string;
  description?: string;
  userId?: string;
  companyId?: string;
  isBlacklist: boolean;
  isActive: boolean;
  expiresAt?: Date;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

class IpManagementService {
  private cache: Map<string, { data: IpAccessCheckResult; expiry: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  async checkIpAccess(ipAddress: string, userId?: string, companyId?: string): Promise<IpAccessCheckResult> {
    const cacheKey = ipAddress + ':' + (userId || '') + ':' + (companyId || '');
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) return cached.data;

    const checks = { ipBlacklisted: false, countryBlocked: false, vpnDetected: false, proxyDetected: false, torDetected: false };
    let riskScore = 0;
    let reason: string | undefined;

    try {
      const blacklisted = await prisma.ip_whitelist.findFirst({
        where: { ipAddress, isBlacklist: true, isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      });
      if (blacklisted) { checks.ipBlacklisted = true; riskScore += 100; reason = 'IP is blacklisted'; }

      const recentFailures = await prisma.login_audit.count({
        where: { userId: userId || undefined, ipAddress, status: 'failed', createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
      });
      if (recentFailures > 5) riskScore += 30;
      else if (recentFailures > 2) riskScore += 15;

      const result: IpAccessCheckResult = { allowed: riskScore < 100, reason, riskScore, checks };
      this.cache.set(cacheKey, { data: result, expiry: Date.now() + this.CACHE_TTL });
      return result;
    } catch (error) {
      console.error('[IP Management] Error:', error);
      return { allowed: true, riskScore: 0, checks };
    }
  }

  async detectAnomalousActivity(userId: string, ipAddress: string): Promise<AnomalousActivityResult> {
    try {
      const knownIps = await prisma.ip_audit_log.findMany({ where: { userId, ipAddress: { not: ipAddress } }, distinct: ['ipAddress'], take: 1 });
      const isNewIp = knownIps.length === 0;
      const recentLogins = await prisma.login_audit.findMany({
        where: { userId, status: 'success', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        orderBy: { createdAt: 'desc' }, take: 10,
      });
      const uniqueIps = new Set(recentLogins.map((l: any) => l.ipAddress));
      const isNewLocation = uniqueIps.size > 2;
      const failedAttempts = await prisma.login_audit.count({
        where: { userId, status: 'failed', createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
      });
      return { isNewIp, isNewLocation, failedAttempts };
    } catch (error) {
      console.error('[IP Management] Anomaly error:', error);
      return { isNewIp: false, isNewLocation: false, failedAttempts: 0 };
    }
  }

  async logIpAccess(data: { ipAddress: string; userId?: string; action?: string; userAgent?: string; countryCode?: string; isVpn?: boolean; isProxy?: boolean; isTor?: boolean }): Promise<any> {
    try {
      return await prisma.ip_audit_log.create({
        data: { ipAddress: data.ipAddress, userId: data.userId || null, action: data.action || 'access', userAgent: data.userAgent || null, countryCode: data.countryCode || null, isVpn: data.isVpn || false, isProxy: data.isProxy || false, isTor: data.isTor || false },
      });
    } catch (error) { console.error('[IP Management] Log error:', error); return null; }
  }

  async getWhitelistEntries(filters?: { userId?: string; companyId?: string; isBlacklist?: boolean }): Promise<IpWhitelistEntry[]> {
    return prisma.ip_whitelist.findMany({
      where: { userId: filters?.userId, companyId: filters?.companyId, isBlacklist: filters?.isBlacklist, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addToWhitelist(data: { ipAddress: string; ipRange?: string; description?: string; userId?: string; companyId?: string; isBlacklist: boolean; expiresAt?: Date; createdBy?: string }): Promise<any> {
    return prisma.ip_whitelist.create({
      data: { ipAddress: data.ipAddress, ipRange: data.ipRange || null, description: data.description || null, userId: data.userId || null, companyId: data.companyId || null, isBlacklist: data.isBlacklist, isActive: true, expiresAt: data.expiresAt || null, createdBy: data.createdBy || null },
    });
  }

  async removeFromWhitelist(id: string): Promise<any> {
    return prisma.ip_whitelist.update({ where: { id }, data: { isActive: false } });
  }

  clearCache(): void { this.cache.clear(); }
}

export const ipManagementService = new IpManagementService();
