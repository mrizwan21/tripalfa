import axios from "axios";
import { getEnv } from "./env.js";
import { getErrorMessage } from "./utils.js";

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  details?: any;
}

export interface ComplianceReport {
  period: string;
  totalLogs: number;
  securityEvents: number;
  complianceStatus: string;
  lastAudit: string;
}

export class AuditService {
  /**
   * Get base URL for audit service - uses lazy evaluation to support runtime config changes
   */
  private static get baseURL(): string {
    return getEnv("VITE_AUDIT_SERVICE_URL", "http://localhost:3012");
  }

  /**
   * Get audit logs
   */
  static async getAuditLogs(params?: {
    userId?: string;
    action?: string;
    limit?: number;
  }): Promise<AuditLog[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.userId) queryParams.append("userId", params.userId);
      if (params?.action) queryParams.append("action", params.action);
      if (params?.limit) queryParams.append("limit", params.limit.toString());

      const response = await axios.get<AuditLog[]>(
        `${this.baseURL}/api/audit/logs?${queryParams.toString()}`,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to fetch audit logs: ${message}`, { cause: error });
    }
  }

  /**
   * Log an action
   */
  static async logAction(data: {
    userId: string;
    action: string;
    details?: any;
    ipAddress?: string;
  }): Promise<AuditLog> {
    try {
      const response = await axios.post<AuditLog>(
        `${this.baseURL}/api/audit/log`,
        data,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to log action: ${message}`, { cause: error });
    }
  }

  /**
   * Get compliance report
   */
  static async getComplianceReport(): Promise<ComplianceReport> {
    try {
      const response = await axios.get<ComplianceReport>(
        `${this.baseURL}/api/audit/compliance`,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to fetch compliance report: ${message}`, { cause: error });
    }
  }
}

export default AuditService;
