/**
 * Document System Type Definitions
 * Core types and interfaces for document generation service
 */

import { Document, DocumentTemplate, DocumentAccess, DocumentType, GenerationStatus } from '@prisma/client';

// Re-export Prisma types
export type { Document, DocumentTemplate, DocumentAccess };
export { DocumentType, GenerationStatus };

/**
 * Document format enumeration
 */
export enum DocumentFormat {
  HTML = 'HTML',
  PDF = 'PDF',
  BOTH = 'BOTH',
}

/**
 * Document access action types
 */
export enum DocumentAccessAction {
  VIEW = 'view',
  DOWNLOAD = 'download',
  PRINT = 'print',
  EMAIL_RESENT = 'email-resent',
  REGENERATE = 'regenerate',
}

/**
 * Template context for Handlebars rendering
 */
export interface TemplateContext {
  booking?: {
    id: string;
    reference: string;
    status: string;
    startDate: string;
    endDate: string;
    destination: string;
    totalCost: number;
    paxCount: number;
    passengers: Array<{
      name: string;
      email: string;
      phone: string;
    }>;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    date: string;
    dueDate: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
    paymentMethod: string;
  };
  receipt?: {
    id: string;
    transactionId: string;
    date: string;
    amount: number;
    paymentMethod: string;
    description: string;
  };
  user?: {
    name: string;
    email: string;
    phone?: string;
  };
  company?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    logo?: string;
  };
  [key: string]: any;
}

/**
 * PDF generation options
 */
export interface PDFOptions {
  format?: 'A4' | 'Letter';
  landscape?: boolean;
  margin?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  scale?: number;
  timeout?: number;
  preferCSSPageSize?: boolean;
}

/**
 * Storage provider interface
 */
export interface IStorageProvider {
  upload(key: string, buffer: Buffer, contentType: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getSignedUrl(key: string, expirationSeconds?: number): Promise<string>;
}

/**
 * Document generation request
 */
export interface GenerateDocumentRequest {
  type: DocumentType;
  userId: string;
  templateId?: string;
  bookingId?: string;
  invoiceId?: string;
  context: TemplateContext;
  format?: DocumentFormat;
  sendEmail?: boolean;
  emailTo?: string[];
}

/**
 * Document response
 */
export interface DocumentResponse {
  id: string;
  type: DocumentType;
  status: GenerationStatus;
  userId: string;
  templateId: string;
  fileUrl?: string;
  fileSize?: number;
  generatedAt?: Date;
  sentAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Template creation/update request
 */
export interface CreateTemplateRequest {
  name: string;
  type: DocumentType;
  content: string;
  format: DocumentFormat;
  description?: string;
}

/**
 * Template preview request
 */
export interface PreviewTemplateRequest {
  templateId: string;
  context: TemplateContext;
  format?: 'html' | 'pdf';
}

/**
 * Bulk document generation request
 */
export interface BulkGenerateRequest {
  type: DocumentType;
  bookingIds?: string[];
  invoiceIds?: string[];
  templateId?: string;
  sendEmail?: boolean;
  context?: TemplateContext;
}

/**
 * Document search filters
 */
export interface DocumentFilter {
  userId?: string;
  type?: DocumentType;
  status?: GenerationStatus;
  startDate?: Date;
  endDate?: Date;
  bookingId?: string;
  invoiceId?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Retention policy configuration
 */
export interface RetentionPolicy {
  documentType: DocumentType;
  retentionDays: number;
  autoDelete: boolean;
}

/**
 * Document generation job
 */
export interface DocumentGenerationJob {
  id: string;
  documentId: string;
  type: DocumentType;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Service configuration
 */
export interface DocumentServiceConfig {
  enablePDF: boolean;
  enableEmail: boolean;
  storageProvider: 'local' | 's3' | 'azure';
  maxConcurrentGenerations: number;
  defaultRetentionDays: number;
  pdfTimeoutMs: number;
  emailBatchSize: number;
}

/**
 * Custom errors
 */
export class DocumentError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'DocumentError';
  }
}

export class TemplateNotFound extends DocumentError {
  constructor(templateId: string) {
    super('TEMPLATE_NOT_FOUND', 404, `Template with ID ${templateId} not found`);
  }
}

export class DocumentNotFound extends DocumentError {
  constructor(documentId: string) {
    super('DOCUMENT_NOT_FOUND', 404, `Document with ID ${documentId} not found`);
  }
}

export class TemplateRenderError extends DocumentError {
  constructor(templateId: string, reason: string) {
    super('TEMPLATE_RENDER_ERROR', 400, `Failed to render template ${templateId}: ${reason}`);
  }
}

export class PDFGenerationError extends DocumentError {
  constructor(reason: string) {
    super('PDF_GENERATION_ERROR', 500, `PDF generation failed: ${reason}`);
  }
}

export class StorageError extends DocumentError {
  constructor(reason: string) {
    super('STORAGE_ERROR', 500, `Storage operation failed: ${reason}`);
  }
}

export class UnauthorizedError extends DocumentError {
  constructor(message = 'Unauthorized access to document') {
    super('UNAUTHORIZED', 403, message);
  }
}

/**
 * Extended Prisma types with relations
 */
export interface DocumentWithTemplate extends Document {
  template: DocumentTemplate;
  accesses: DocumentAccess[];
}

export interface TemplateWithDocuments extends DocumentTemplate {
  documents: Document[];
}
