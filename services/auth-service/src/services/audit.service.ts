import { prisma } from '../database.js';

export const auditService = {
  async logSecurityEvent(params: {
    userId: string;
    action: string;
    details?: Record<string, any>;
    ipAddress?: string;
  }): Promise<void> {
    try {
      await prisma.ip_audit_log.create({
        data: {
          userId: params.userId,
          ipAddress: params.ipAddress || 'unknown',
          action: params.action,
          requestId: params.details?.requestId as string | undefined,
        },
      });
    } catch (error) {
      console.error('[Audit] Failed to log security event:', error);
    }
  },

  async logLoginAttempt(params: {
    userId: string;
    action: string;
    status: string;
    ipAddress?: string;
    failureReason?: string;
  }): Promise<void> {
    try {
      await prisma.login_audit.create({
        data: {
          userId: params.userId,
          action: params.action,
          status: params.status,
          ipAddress: params.ipAddress || 'unknown',
          failureReason: params.failureReason,
        },
      });
    } catch (error) {
      console.error('[Audit] Failed to log login attempt:', error);
    }
  },

  async logIpAudit(params: {
    userId?: string;
    ipAddress: string;
    action: string;
    details?: Record<string, any>;
  }): Promise<void> {
    try {
      await prisma.ip_audit_log.create({
        data: {
          userId: params.userId,
          ipAddress: params.ipAddress,
          action: params.action,
          details: params.details ? JSON.stringify(params.details) : null,
        },
      });
    } catch (error) {
      console.error('[Audit] Failed to log IP audit:', error);
    }
  },
};
