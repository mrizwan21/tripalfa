// ============================================================================
// TripAlfa Shared Types - System Domain
// Invoices, Documents, Notifications, Audit Logs, Reports
// ============================================================================

import {
  InvoiceType,
  CustomerInvoiceStatus,
  DocumentType,
  NotificationChannel,
  NotificationType,
  NotificationStatus,
  NotificationPriority,
  AuditSeverity,
  GdsLogStatus,
  ReportCategory,
  DeliveryMethod,
} from './enums';
import { Address } from './company';
import { InvoiceLineItem } from './finance';

// ============================================================================
// Invoice Types
// ============================================================================

export interface TaxBreakdown {
  taxCode: string;
  taxName: string;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  companyId: string;
  bookingId?: string;
  invoiceNo: string;
  type: InvoiceType;
  status: CustomerInvoiceStatus;

  // Dates
  invoiceDate: string;
  dueDate: string;

  // Customer
  customerName: string;
  customerEmail?: string;
  customerAddress?: Address;

  // Amounts
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;

  // Details
  lineItems: InvoiceLineItem[];
  taxBreakdown?: TaxBreakdown[];

  notes?: string;
  terms?: string;
  documentUrl?: string;

  // Timestamps
  sentAt?: string;
  paidAt?: string;
  voidedAt?: string;

  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceCreate {
  companyId: string;
  bookingId?: string;
  type: InvoiceType;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerEmail?: string;
  customerAddress?: Address;
  currency: string;
  lineItems: InvoiceLineItem[];
  taxBreakdown?: TaxBreakdown[];
  discountAmount?: number;
  notes?: string;
  terms?: string;
  metadata?: Record<string, unknown>;
}

export interface InvoiceUpdate {
  status?: CustomerInvoiceStatus;
  dueDate?: string;
  customerEmail?: string;
  customerAddress?: Address;
  lineItems?: InvoiceLineItem[];
  taxBreakdown?: TaxBreakdown[];
  discountAmount?: number;
  paidAmount?: number;
  notes?: string;
  terms?: string;
  documentUrl?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Document Types
// ============================================================================
export interface Document {
  id: string;
  entityType: string;
  entityId: string;
  type: DocumentType;
  name: string;
  description?: string;

  // File info
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;

  // Storage
  storageProvider: string;
  storagePath: string;

  // Access
  isPublic: boolean;
  expiresAt?: string;

  uploadedBy: string;

  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentCreate {
  entityType: string;
  entityId: string;
  type: DocumentType;
  name: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageProvider: string;
  storagePath: string;
  isPublic?: boolean;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface DocumentUpdate {
  name?: string;
  description?: string;
  type?: DocumentType;
  isPublic?: boolean;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Notification Types
// ============================================================================
export interface Notification {
  id: string;
  userId?: string;
  companyId?: string;

  channel: NotificationChannel;
  type: NotificationType;
  status: NotificationStatus;
  priority: NotificationPriority;

  // Content
  subject?: string;
  body: string;
  templateId?: string;
  templateData?: Record<string, unknown>;

  // Recipient
  recipientType: string;
  recipientValue: string;

  // Delivery
  scheduledAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;

  // Provider
  providerMessageId?: string;
  providerStatus?: string;
  errorMessage?: string;

  // Retry
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: string;

  // Context
  referenceType?: string;
  referenceId?: string;

  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCreate {
  userId?: string;
  companyId?: string;
  channel: NotificationChannel;
  type: NotificationType;
  priority?: NotificationPriority;
  subject?: string;
  body: string;
  templateId?: string;
  templateData?: Record<string, unknown>;
  recipientType: string;
  recipientValue: string;
  scheduledAt?: string;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationUpdate {
  status?: NotificationStatus;
  providerMessageId?: string;
  providerStatus?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Audit Log Types
// ============================================================================
export interface AuditLog {
  id: string;
  companyId?: string;
  userId?: string;

  action: string;
  entityType: string;
  entityId?: string;

  // Changes
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  changedFields: string[];

  // Context
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;

  // Additional info
  description?: string;
  severity: AuditSeverity;

  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogListParams {
  page?: number;
  limit?: number;
  companyId?: string;
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  severity?: AuditSeverity;
  fromDate?: string;
  toDate?: string;
  sortBy?: 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditLogListResponse {
  data: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// GDS Log Types
// ============================================================================
export interface GdsLog {
  id: string;
  supplierId?: string;
  bookingId?: string;

  operation: string;
  status: GdsLogStatus;

  // Request
  requestPayload?: Record<string, unknown>;
  requestHeaders?: Record<string, unknown>;

  // Response
  responsePayload?: Record<string, unknown>;
  responseCode?: number;
  responseTime?: number;

  // Error
  errorCode?: string;
  errorMessage?: string;

  // Context
  correlationId?: string;
  sessionId?: string;

  createdAt: string;
}

export interface GdsLogListParams {
  page?: number;
  limit?: number;
  supplierId?: string;
  bookingId?: string;
  operation?: string;
  status?: GdsLogStatus;
  correlationId?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: 'createdAt' | 'responseTime';
  sortOrder?: 'asc' | 'desc';
}

export interface GdsLogListResponse {
  data: GdsLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// Report Definition Types
// ============================================================================
export interface ReportParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  default?: unknown;
  options?: { label: string; value: unknown }[];
}

export interface ReportDefinition {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  description?: string;
  category: ReportCategory;

  // Query/Template
  queryTemplate: string;
  parameters?: ReportParameter[];

  // Output
  outputFormats: string[];
  defaultFormat: string;

  // Access control
  allowedRoles: string[];
  isPublic: boolean;

  isActive: boolean;

  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ReportDefinitionCreate {
  companyId?: string;
  code: string;
  name: string;
  description?: string;
  category: ReportCategory;
  queryTemplate: string;
  parameters?: ReportParameter[];
  outputFormats: string[];
  defaultFormat?: string;
  allowedRoles?: string[];
  isPublic?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ReportDefinitionUpdate {
  name?: string;
  description?: string;
  category?: ReportCategory;
  queryTemplate?: string;
  parameters?: ReportParameter[];
  outputFormats?: string[];
  defaultFormat?: string;
  allowedRoles?: string[];
  isPublic?: boolean;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Report Schedule Types
// ============================================================================
export interface ReportRecipient {
  type: 'email' | 'sftp' | 'webhook';
  address: string;
  name?: string;
}

export interface ReportSchedule {
  id: string;
  reportId: string;
  name: string;

  // Schedule
  cronExpression: string;
  timezone: string;

  // Parameters
  parameters?: Record<string, unknown>;
  outputFormat: string;

  // Delivery
  deliveryMethod: DeliveryMethod;
  recipients: ReportRecipient[];

  // Status
  isActive: boolean;
  lastRunAt?: string;
  lastRunStatus?: string;
  nextRunAt?: string;

  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ReportScheduleCreate {
  reportId: string;
  name: string;
  cronExpression: string;
  timezone?: string;
  parameters?: Record<string, unknown>;
  outputFormat?: string;
  deliveryMethod: DeliveryMethod;
  recipients: ReportRecipient[];
  metadata?: Record<string, unknown>;
}

export interface ReportScheduleUpdate {
  name?: string;
  cronExpression?: string;
  timezone?: string;
  parameters?: Record<string, unknown>;
  outputFormat?: string;
  deliveryMethod?: DeliveryMethod;
  recipients?: ReportRecipient[];
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Report Execution Types
// ============================================================================
export interface ReportExecutionRequest {
  reportId: string;
  parameters?: Record<string, unknown>;
  outputFormat?: string;
}

export interface ReportExecutionResponse {
  executionId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  downloadUrl?: string;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
}
