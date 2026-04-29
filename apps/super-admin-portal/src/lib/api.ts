/**
 * Super Admin Portal – Centralized API Client
 * Communicates with super-admin backend/gateway (auth via x-admin-id header).
 */

import { requestJson, superAdminApiBaseUrl } from "../services/httpClient";

const SUPERADMIN_API_URL = superAdminApiBaseUrl;

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  return requestJson<T>(url, opts);
}

// ─── Types ────────────────────────────────────────────────────

export interface Tenant {
  id: string;
  agentCode: string;
  name: string;
  type: "SUB_AGENT" | "MASTER_AGENCY" | "INDIVIDUAL_AGENT";
  status: "ACTIVE" | "SUSPENDED" | "ARCHIVED";
  contactEmail?: string;
  country?: string;
  creditLimit: number;
  paymentType: string;
  accessFlights: boolean;
  accessHotels: boolean;
  accessCars: boolean;
  enableB2B2C: boolean;
  canManageMarkups: boolean;
  subAgencies?: { id: string; name: string }[];
}

export interface PlatformStats {
  tenants: { total: number; active: number; suspended: number; inactive: number };
  themes: { total: number };
  users: { total: number };
  suppliers: { total: number };
}

// ─── API Methods ──────────────────────────────────────────────

export const statsApi = {
  get: () => request<PlatformStats>(`${SUPERADMIN_API_URL}/api/admin/stats`),
};

// ─── Staff Management API ──────────────────────────────────────
export interface User {
  id: string;
  tenantId: string;
  username: string;
  email: string;
  name: string;
  role: string;
  salesChannelId?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  tenant?: { id: string; name: string; agentCode: string };
  salesChannelConfig?: { id: string; name: string };
}

// ─── Supplier Management API ────────────────────────────────────
interface Supplier {
  id: string;
  name: string;
  code: string;
  type: string;
  status: boolean;
  address?: string;
  city?: string;
  state?: string;
  postCode?: string;
  country?: string;
  telephone1?: string;
  telephone2?: string;
  mobile?: string;
  fax?: string;
  email?: string;
  website?: string;
  logoUrl?: string;
  taxId?: string;
  panNo?: string;
  serviceTaxNo?: string;
  atolNo?: string;
  bankName?: string;
  accountNumber?: string;
  swiftCode?: string;
  rtgsCode?: string;
  currency: string;
  settlementPeriod: string;
  securityDeposit: number;
  contractDate: string;
  financialRemarks?: string;
  creditLimit: number;
  availableCredit: number;
  onboardingStatus: string;
  loginStatus: boolean;
  contracts?: SupplierContract[];
  metrics?: SupplierMetric[];
  alerts?: SupplierAlert[];
}

interface SupplierContract {
  id: string;
  supplierId: string;
  contractRef: string;
  startDate: string;
  endDate: string;
  terms?: string;
  netMarkup: number;
  isActive: boolean;
}

interface SupplierMetric {
  id: string;
  supplierId: string;
  timestamp: string;
  latencyMs: number;
  successRate: number;
  errorCount: number;
  pnrVelocity: number;
}

interface SupplierAlert {
  id: string;
  supplierId: string;
  type: string;
  threshold: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedSuppliers {
  data: Supplier[];
  total: number;
  page: number;
  limit: number;
}

// ─── Tax Rules ─────────────────────────────────────────────────
export interface TaxRule {
  id: string;
  taxCode: string;
  name: string;
  description?: string;
  valueType: "PERCENTAGE" | "FIXED" | "TIERED";
  value: number;
  serviceType: "FLIGHT" | "HOTEL" | "CAR" | "ALL";
  ruleLevel: "BASE" | "OVERRIDE" | "EXCEPTION";
  taxAuthority: string;
  isRecoverable: boolean;
  appliesToNet: boolean;
  conditions?: Record<string, string | number | boolean | undefined>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TaxRuleAuditLog {
  id: string;
  taxRuleId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "TOGGLE";
  changedBy: string;
  changes?: Record<string, string | number | boolean | undefined>;
  createdAt: string;
}

interface PaginatedTaxRules {
  data: TaxRule[];
  total: number;
  page: number;
  limit: number;
}

interface PaginatedTaxAuditLogs {
  data: TaxRuleAuditLog[];
  total: number;
  page: number;
  limit: number;
}

export const taxApi = {
  list: (params?: { serviceType?: string; isActive?: boolean; ruleLevel?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.serviceType) qs.set("serviceType", params.serviceType);
    if (params?.isActive !== undefined) qs.set("isActive", String(params.isActive));
    if (params?.ruleLevel) qs.set("ruleLevel", params.ruleLevel);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    return request<PaginatedTaxRules>(`${SUPERADMIN_API_URL}/api/admin/tax-rules?${qs}`);
  },

  get: (id: string) => request<TaxRule>(`${SUPERADMIN_API_URL}/api/admin/tax-rules/${id}`),

  create: (payload: Omit<TaxRule, "id" | "createdAt" | "updatedAt">) =>
    request<TaxRule>(`${SUPERADMIN_API_URL}/api/admin/tax-rules`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<TaxRule>) =>
    request<TaxRule>(`${SUPERADMIN_API_URL}/api/admin/tax-rules/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`${SUPERADMIN_API_URL}/api/admin/tax-rules/${id}`, {
      method: "DELETE",
    }),

  toggle: (id: string) =>
    request<TaxRule>(`${SUPERADMIN_API_URL}/api/admin/tax-rules/${id}/toggle`, {
      method: "PATCH",
    }),

  getAuditLogs: (taxRuleId: string, params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    return request<PaginatedTaxAuditLogs>(`${SUPERADMIN_API_URL}/api/admin/tax-rules/${taxRuleId}/audit-logs?${qs}`);
  },
};

// ─── Markup Rules ──────────────────────────────────────────────
export interface MarkupRule {
  id: string;
  name: string;
  description?: string;
  valueType: "PERCENTAGE" | "FIXED" | "TIERED";
  value: number;
  serviceType: "FLIGHT" | "HOTEL" | "CAR" | "ALL";
  ruleLevel: "BASE" | "OVERRIDE" | "EXCEPTION";
  salesChannel?: "CORPORATE" | "SUBAGENT" | "B2C" | "ALL";
  conditions?: Record<string, string | number | boolean | undefined>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedMarkupRules {
  data: MarkupRule[];
  total: number;
  page: number;
  limit: number;
}

export const markupApi = {
  list: (params?: { serviceType?: string; isActive?: boolean; ruleLevel?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.serviceType) qs.set("serviceType", params.serviceType);
    if (params?.isActive !== undefined) qs.set("isActive", String(params.isActive));
    if (params?.ruleLevel) qs.set("ruleLevel", params.ruleLevel);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    return request<PaginatedMarkupRules>(`${SUPERADMIN_API_URL}/api/admin/markup-rules?${qs}`);
  },

  get: (id: string) => request<MarkupRule>(`${SUPERADMIN_API_URL}/api/admin/markup-rules/${id}`),

  create: (payload: Omit<MarkupRule, "id" | "createdAt" | "updatedAt">) =>
    request<MarkupRule>(`${SUPERADMIN_API_URL}/api/admin/markup-rules`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<MarkupRule>) =>
    request<MarkupRule>(`${SUPERADMIN_API_URL}/api/admin/markup-rules/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`${SUPERADMIN_API_URL}/api/admin/markup-rules/${id}`, {
      method: "DELETE",
    }),
};

// ─── Commission Rules ──────────────────────────────────────────
export interface CommissionRule {
  id: string;
  name: string;
  description?: string;
  commissionType: "PERCENTAGE" | "FIXED" | "TIERED";
  value: number;
  serviceType: "FLIGHT" | "HOTEL" | "CAR" | "ALL";
  sourceType: "BOOKING" | "UPSELL" | "REFERRAL";
  recipientType?: "AGENT" | "SUB_AGENT" | "TENANT" | "ALL";
  conditions?: Record<string, string | number | boolean | undefined>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedCommissionRules {
  data: CommissionRule[];
  total: number;
  page: number;
  limit: number;
}

export const commissionApi = {
  list: (params?: { serviceType?: string; isActive?: boolean; sourceType?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.serviceType) qs.set("serviceType", params.serviceType);
    if (params?.isActive !== undefined) qs.set("isActive", String(params.isActive));
    if (params?.sourceType) qs.set("sourceType", params.sourceType);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    return request<PaginatedCommissionRules>(`${SUPERADMIN_API_URL}/api/admin/commission-rules?${qs}`);
  },

  get: (id: string) => request<CommissionRule>(`${SUPERADMIN_API_URL}/api/admin/commission-rules/${id}`),

  create: (payload: Omit<CommissionRule, "id" | "createdAt" | "updatedAt">) =>
    request<CommissionRule>(`${SUPERADMIN_API_URL}/api/admin/commission-rules`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<CommissionRule>) =>
    request<CommissionRule>(`${SUPERADMIN_API_URL}/api/admin/commission-rules/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    request<{ success: boolean }>(`${SUPERADMIN_API_URL}/api/admin/commission-rules/${id}`, {
      method: "DELETE",
    }),
};

export const supplierApi = {
  list: (params?: { type?: string; status?: boolean; search?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.status !== undefined) qs.set("status", String(params.status));
    if (params?.search) qs.set("search", params.search);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    return request<PaginatedSuppliers>(`${SUPERADMIN_API_URL}/api/admin/suppliers?${qs}`);
  },

  get: (id: string) => request<Supplier>(`${SUPERADMIN_API_URL}/api/admin/suppliers/${id}`),

  create: (payload: Omit<Supplier, "id" | "contracts" | "metrics" | "alerts">) =>
    request<Supplier>(`${SUPERADMIN_API_URL}/api/admin/suppliers`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<Supplier>) =>
    request<Supplier>(`${SUPERADMIN_API_URL}/api/admin/suppliers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  updateStatus: (id: string, status: boolean) =>
    request<Supplier>(`${SUPERADMIN_API_URL}/api/admin/suppliers/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  createContract: (supplierId: string, payload: Omit<SupplierContract, "id" | "supplierId">) =>
    request<SupplierContract>(`${SUPERADMIN_API_URL}/api/admin/suppliers/${supplierId}/contracts`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

// ─── Payment Gateways ──────────────────────────────────────────
export interface PaymentGateway {
  id: string;
  name: string;
  provider: string;
  status: "ACTIVE" | "INACTIVE";
  isLive: boolean;
  publicKey?: string;
  secretKey?: string;
  webhookSecret?: string;
  clientId?: string;
  clientSecret?: string;
  webhookId?: string;
  merchantId?: string;
  terminalId?: string;
  encryptionKey?: string;
  supportedCurrencies: string[];
  createdAt: string;
  updatedAt: string;
}

export const paymentGatewayApi = {
  list: () => request<PaymentGateway[]>(`${SUPERADMIN_API_URL}/api/admin/payment-gateways`),

  create: (payload: Omit<PaymentGateway, "id" | "createdAt" | "updatedAt">) =>
    request<PaymentGateway>(`${SUPERADMIN_API_URL}/api/admin/payment-gateways`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<PaymentGateway>) =>
    request<PaymentGateway>(`${SUPERADMIN_API_URL}/api/admin/payment-gateways/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`${SUPERADMIN_API_URL}/api/admin/payment-gateways/${id}`, {
      method: "DELETE",
    }),
};

// ─── Email Templates ───────────────────────────────────────────
export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const emailTemplateApi = {
  list: () => request<EmailTemplate[]>(`${SUPERADMIN_API_URL}/api/admin/email-templates`),

  create: (payload: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">) =>
    request<EmailTemplate>(`${SUPERADMIN_API_URL}/api/admin/email-templates`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Partial<EmailTemplate>) =>
    request<EmailTemplate>(`${SUPERADMIN_API_URL}/api/admin/email-templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`${SUPERADMIN_API_URL}/api/admin/email-templates/${id}`, {
      method: "DELETE",
    }),
};
// ─── Gateway Management ────────────────────────────────────────
export interface ServiceHealth {
  name: string;
  port: number;
  state: "up" | "down" | "unknown";
  lastCheck: string;
}

export interface GatewayHealthResponse {
  timestamp: string;
  services: Record<string, ServiceHealth>;
}

export interface AuditLogFile {
  date: string;
  filename: string;
  size: number;
}

export interface AuditLogEntry {
  ts: string;
  method: string;
  path: string;
  status: number;
  latencyMs: number;
  ip: string;
  userId?: string;
  userRole?: string;
  tenantId?: string;
  correlationId?: string;
  userAgent?: string;
}

const GATEWAY_URL = superAdminApiBaseUrl;

export const gatewayApi = {
  getHealth: () => request<GatewayHealthResponse>(`${GATEWAY_URL}/api/gateway/health-status`),
  
  listAuditLogs: () => request<AuditLogFile[]>(`${GATEWAY_URL}/api/gateway/audit-logs`),
  
  getAuditLog: (date: string) => request<AuditLogEntry[]>(`${GATEWAY_URL}/api/gateway/audit-logs/${date}`),
};
