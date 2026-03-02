// ============================================================================
// TripAlfa Shared Types - Supplier Domain
// GDS/API suppliers with contract and performance tracking
// ============================================================================

import {
  SupplierType,
  SupplierCategory,
  SupplierStatus,
  ContractType,
  ContractStatus,
  InvoiceStatus,
  RemittanceStatus,
  ApiVendorType,
  ApiVendorStatus,
  AuthType,
  HttpMethod,
} from "./enums";
import { Address } from "./company";
import { InvoiceLineItem } from "./finance";

// ============================================================================
// Supplier Types
// ============================================================================
export interface ApiConfig {
  baseUrl: string;
  authType: AuthType;
  credentials?: Record<string, unknown>;
  endpoints?: Record<string, string>;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  type: SupplierType;
  category: SupplierCategory;
  status: SupplierStatus;

  // Contact
  contactName?: string;
  email?: string;
  phone?: string;
  address?: Address;
  website?: string;

  // API Configuration
  apiConfig?: ApiConfig;
  apiVendorId?: string;

  // Financial
  paymentTerms?: string;
  currency: string;

  // Settings
  isPreferred: boolean;
  priority: number;
  supportedServices: string[];

  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierCreate {
  code: string;
  name: string;
  type: SupplierType;
  category: SupplierCategory;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: Address;
  website?: string;
  apiConfig?: ApiConfig;
  apiVendorId?: string;
  paymentTerms?: string;
  currency?: string;
  isPreferred?: boolean;
  priority?: number;
  supportedServices?: string[];
  metadata?: Record<string, unknown>;
}

export interface SupplierUpdate {
  name?: string;
  type?: SupplierType;
  category?: SupplierCategory;
  status?: SupplierStatus;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: Address;
  website?: string;
  apiConfig?: ApiConfig;
  apiVendorId?: string;
  paymentTerms?: string;
  currency?: string;
  isPreferred?: boolean;
  priority?: number;
  supportedServices?: string[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Supplier Contract Types
// ============================================================================
export interface ContractDocument {
  name: string;
  url: string;
  type: string;
}

export interface SupplierContract {
  id: string;
  supplierId: string;
  companyId?: string;
  contractRef: string;
  type: ContractType;
  status: ContractStatus;
  startDate: string;
  endDate?: string;

  // Terms
  creditLimit?: number;
  commissionRate?: number;
  markupAllowed?: number;
  paymentTermsDays?: number;

  terms?: Record<string, unknown>;
  documents?: ContractDocument[];

  signedBy?: string;
  signedAt?: string;

  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierContractCreate {
  supplierId: string;
  companyId?: string;
  contractRef: string;
  type: ContractType;
  startDate: string;
  endDate?: string;
  creditLimit?: number;
  commissionRate?: number;
  markupAllowed?: number;
  paymentTermsDays?: number;
  terms?: Record<string, unknown>;
  documents?: ContractDocument[];
  metadata?: Record<string, unknown>;
}

export interface SupplierContractUpdate {
  type?: ContractType;
  status?: ContractStatus;
  startDate?: string;
  endDate?: string;
  creditLimit?: number;
  commissionRate?: number;
  markupAllowed?: number;
  paymentTermsDays?: number;
  terms?: Record<string, unknown>;
  documents?: ContractDocument[];
  signedBy?: string;
  signedAt?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Supplier Invoice Types
// ============================================================================

export interface SupplierInvoice {
  id: string;
  supplierId: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;

  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;

  lineItems?: InvoiceLineItem[];
  bookingRefs: string[];

  notes?: string;
  documentUrl?: string;

  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierInvoiceCreate {
  supplierId: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxAmount?: number;
  lineItems?: InvoiceLineItem[];
  bookingRefs?: string[];
  notes?: string;
  documentUrl?: string;
}

export interface SupplierInvoiceUpdate {
  status?: InvoiceStatus;
  dueDate?: string;
  paidAmount?: number;
  lineItems?: InvoiceLineItem[];
  bookingRefs?: string[];
  notes?: string;
  documentUrl?: string;
}

// ============================================================================
// Supplier Remittance Types
// ============================================================================
export interface BankDetails {
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
}

export interface SupplierRemittance {
  id: string;
  supplierId: string;
  remittanceRef: string;
  remittanceDate: string;
  status: RemittanceStatus;

  currency: string;
  totalAmount: number;

  paymentMethod: string;
  paymentRef?: string;
  bankDetails?: BankDetails;

  invoiceIds: string[];
  notes?: string;
  documentUrl?: string;

  processedAt?: string;
  processedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierRemittanceCreate {
  supplierId: string;
  remittanceRef: string;
  remittanceDate: string;
  currency: string;
  totalAmount: number;
  paymentMethod: string;
  paymentRef?: string;
  bankDetails?: BankDetails;
  invoiceIds: string[];
  notes?: string;
  documentUrl?: string;
}

export interface SupplierRemittanceUpdate {
  status?: RemittanceStatus;
  paymentRef?: string;
  notes?: string;
  documentUrl?: string;
}

// ============================================================================
// Supplier Performance Types
// ============================================================================
export interface SupplierPerformance {
  id: string;
  supplierId: string;
  period: string; // 'YYYY-MM'

  totalBookings: number;
  totalRevenue: number;
  avgResponseTime?: number;
  successRate?: number;
  errorRate?: number;

  bookingsByType?: Record<string, number>;
  revenueByType?: Record<string, number>;

  totalComplaints: number;
  totalRefunds: number;
  refundAmount: number;

  metadata?: Record<string, unknown>;
  calculatedAt: string;
  createdAt: string;
}

// ============================================================================
// API Vendor Types
// ============================================================================
export interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
}

export interface ApiVendor {
  id: string;
  code: string;
  name: string;
  type: ApiVendorType;
  status: ApiVendorStatus;

  // Connection
  baseUrl: string;
  authType: AuthType;
  credentials?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout: number;
  retryConfig?: RetryConfig;

  // Rate limiting
  rateLimit?: number;
  concurrentLimit?: number;

  // Health
  lastHealthCheck?: string;
  healthStatus?: string;

  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiVendorCreate {
  code: string;
  name: string;
  type: ApiVendorType;
  baseUrl: string;
  authType: AuthType;
  credentials?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  retryConfig?: RetryConfig;
  rateLimit?: number;
  concurrentLimit?: number;
  metadata?: Record<string, unknown>;
}

export interface ApiVendorUpdate {
  name?: string;
  type?: ApiVendorType;
  status?: ApiVendorStatus;
  baseUrl?: string;
  authType?: AuthType;
  credentials?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  retryConfig?: RetryConfig;
  rateLimit?: number;
  concurrentLimit?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// API Endpoint Types
// ============================================================================
export interface ApiEndpoint {
  id: string;
  apiVendorId: string;
  name: string;
  method: HttpMethod;
  path: string;
  description?: string;

  requestSchema?: Record<string, unknown>;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;

  responseSchema?: Record<string, unknown>;
  successCodes: number[];

  cacheable: boolean;
  cacheTtl?: number;
  rateLimit?: number;

  isActive: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiEndpointCreate {
  apiVendorId: string;
  name: string;
  method: HttpMethod;
  path: string;
  description?: string;
  requestSchema?: Record<string, unknown>;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  responseSchema?: Record<string, unknown>;
  successCodes?: number[];
  cacheable?: boolean;
  cacheTtl?: number;
  rateLimit?: number;
  metadata?: Record<string, unknown>;
}

export interface ApiEndpointUpdate {
  name?: string;
  description?: string;
  requestSchema?: Record<string, unknown>;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  responseSchema?: Record<string, unknown>;
  successCodes?: number[];
  cacheable?: boolean;
  cacheTtl?: number;
  rateLimit?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Supplier List/Search Types
// ============================================================================
export interface SupplierListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: SupplierType;
  category?: SupplierCategory;
  status?: SupplierStatus;
  isPreferred?: boolean;
  sortBy?: "name" | "code" | "priority" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface SupplierListResponse {
  data: Supplier[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// Supplier with Relations
// ============================================================================
export interface SupplierWithRelations extends Supplier {
  contracts?: SupplierContract[];
  performance?: SupplierPerformance[];
  apiVendor?: ApiVendor;
}
