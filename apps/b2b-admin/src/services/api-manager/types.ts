/**
 * Supplier API Service Types
 * TypeScript types and interfaces for supplier management
 */

// ============================================================================
// SUPPLIER TYPES
// ============================================================================

export type SupplierType = "GDS" | "Aggregator" | "Direct" | "Wholesaler";
export type PricingModel = "Commissionable" | "Net" | "Markup";
export type SupplierStatus = "Active" | "Inactive" | "Suspended" | "Pending";
export type CommissionType = "API" | "Offline";
export type ProductPresence = "Online" | "Offline";
export type PaymentMode = "Online" | "Offline";
export type PaymentStatus = "Active" | "Expired" | "Suspended" | "Inactive";
export type DocumentType =
  | "Supplier Contract"
  | "Owner Passport Copy"
  | "Commercial License"
  | "SLA Document"
  | "NDA"
  | "Tax Certificate"
  | "Insurance Certificate";
export type APIEnvironment = "Test" | "Production";
export type RuleStatus = "Active" | "Expired" | "Inactive";

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    timestamp?: string;
  };
  errors?: string[];
}

// ============================================================================
// SUPPLIER PROFILE
// ============================================================================

export interface SupplierProfile {
  id: string;
  supplierIdCode: string;
  supplierName: string;
  supplierType: SupplierType;
  commercialRegNo?: string;
  pricingModel: PricingModel;
  status: SupplierStatus;
  emailAddress?: string;
  websiteAddress?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country: string;
  telephone?: string;
  contactFirstName?: string;
  contactLastName?: string;
  designation?: string;
  logoUrl?: string;
  isActive: boolean;
  rating?: number;
  totalOrders?: number;
  lastOrderDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierFormData {
  supplierIdCode?: string;
  supplierName: string;
  supplierType: SupplierType;
  commercialRegNo?: string;
  pricingModel: PricingModel;
  emailAddress?: string;
  websiteAddress?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  country: string;
  telephone?: string;
  contactFirstName?: string;
  contactLastName?: string;
  designation?: string;
  logoFile?: File;
  isActive: boolean;
}

export interface SupplierListFilters {
  search?: string;
  supplierType?: SupplierType;
  status?: SupplierStatus;
  pricingModel?: PricingModel;
  country?: string;
  sortBy?: "name" | "rating" | "orders" | "date";
  sortOrder?: "asc" | "desc";
}

// ============================================================================
// SUPPLIER PRODUCTS
// ============================================================================

export interface SupplierProduct {
  id: string;
  supplierId: string;
  name: string;
  commissionType: CommissionType;
  contactPerson?: string;
  presence: ProductPresence;
  isActive: boolean;
  addedDate: string;
  lastModified: string;
}

export interface SupplierProductFormData {
  name: string;
  commissionType: CommissionType;
  contactPerson?: string;
  presence: ProductPresence;
  isActive: boolean;
}

// ============================================================================
// SUPPLIER PRICING RULES
// ============================================================================

export interface SupplierRule {
  id: string;
  supplierId: string;
  name: string;
  product: string;
  customerMarkup?: number | string;
  supplierCommission?: number | string;
  discount?: number | string;
  status: RuleStatus;
  priority: number;
  conditions?: RuleCondition[];
  createdDate: string;
  createdBy: string;
  lastModified: string;
}

export interface RuleCondition {
  field: string;
  operator: "equals" | "contains" | "greaterThan" | "lessThan" | "between";
  value: any;
}

export interface SupplierRuleFormData {
  name: string;
  product: string;
  customerMarkup?: number;
  supplierCommission?: number;
  discount?: number;
  status: RuleStatus;
  priority: number;
  conditions?: RuleCondition[];
}

// ============================================================================
// SUPPLIER PAYMENTS
// ============================================================================

export type AccountType =
  | "PayPal"
  | "Cash"
  | "Google Pay"
  | "Bank Transfer"
  | "Stripe"
  | "Credit Card"
  | "Wire Transfer";
export type Currency = "USD" | "SAR" | "EUR" | "GBP" | "BHD" | "LYD" | "AED";

export interface SupplierPayment {
  id: string;
  supplierId: string;
  accountNo?: string;
  accountType: AccountType;
  paymentMode: PaymentMode;
  surcharge?: number;
  currency: Currency;
  status: PaymentStatus;
  isDefault: boolean;
  note?: string;
  createdDate: string;
  lastModified: string;
}

export interface SupplierPaymentData {
  accountNo?: string;
  accountType: AccountType;
  paymentMode: PaymentMode;
  surcharge?: number;
  currency: Currency;
  status: PaymentStatus;
  isDefault?: boolean;
  note?: string;
}

// ============================================================================
// SUPPLIER DOCUMENTS
// ============================================================================

export interface SupplierDocument {
  id: string;
  supplierId: string;
  name: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  issueDate?: string;
  expiryDate?: string;
  status: "Valid" | "Expiring Soon" | "Expired";
  uploadedDate: string;
  uploadedBy: string;
}

export interface SupplierDocumentData {
  name: string;
  type: DocumentType;
  file: File;
  issueDate?: string;
  expiryDate?: string;
}

// ============================================================================
// SUPPLIER API CREDENTIALS
// ============================================================================

export interface SupplierAPICredential {
  id: string;
  supplierId: string;
  environment: APIEnvironment;
  username: string;
  endpoint?: string;
  status: "Active" | "Inactive" | "Revoked";
  lastUsed?: string;
  createdDate: string;
  lastModified: string;
}

export interface SupplierAPICredentialFormData {
  environment: APIEnvironment;
  username: string;
  password: string;
  endpoint?: string;
}

// ============================================================================
// SUPPLIER STATISTICS & ANALYTICS
// ============================================================================

export interface SupplierStats {
  id: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  responseTime: number;
  successRate: number;
  rating: number;
  totalCustomers: number;
  products: number;
  activeRules: number;
  period: "daily" | "weekly" | "monthly" | "yearly";
  data: StatPoint[];
}

export interface StatPoint {
  timestamp: string;
  value: number;
}

export interface SupplierAnalytics {
  totalSuppliers: number;
  activeSuppliers: number;
  suspendedSuppliers: number;
  totalRevenue: number;
  averageRating: number;
  topSuppliers: SupplierProfile[];
  performanceByType: Record<SupplierType, number>;
  performanceByRegion: Record<string, number>;
  revenueByType: Record<SupplierType, number>;
  trendData: { date: string; revenue: number; orders: number }[];
}

// ============================================================================
// SUPPLIER HEALTH CHECK
// ============================================================================

export interface SupplierHealthCheck {
  id: string;
  supplierId: string;
  status: "Healthy" | "Degraded" | "Down";
  responseTime: number;
  lastCheck: string;
  nextCheck: string;
  issues?: HealthIssue[];
}

export interface HealthIssue {
  type: "connection" | "timeout" | "error" | "performance";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: string;
}

export interface APIEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  description: string;
  parameters?: any[];
  headers?: any[];
  body?: any;
  responses?: Record<number, any>;
  cache?: {
    enabled: boolean;
    ttl?: number;
  };
  requiresAuth?: boolean;
  timeout?: number;
  rateLimit?: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface SupplierListResponse {
  data: SupplierProfile[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface SupplierDetailResponse {
  profile: SupplierProfile;
  products: SupplierProduct[];
  rules: SupplierRule[];
  payments: SupplierPayment[];
  documents: SupplierDocument[];
  stats: SupplierStats;
  health: SupplierHealthCheck;
}

export interface BulkSupplierResponse {
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

// ============================================================================
// PAGINATION & SORTING
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  skip?: number;
}

export interface SortParams {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

// ============================================================================
// FILTER QUERY BUILDER
// ============================================================================

export interface FilterQuery {
  field: string;
  operator: "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "in" | "nin" | "regex";
  value: any;
}

export interface QueryBuilder {
  filters: FilterQuery[];
  sort?: SortParams;
  pagination?: PaginationParams;
}
