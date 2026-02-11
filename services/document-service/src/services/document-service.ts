/**
 * Document Service
 * Main orchestration service for document generation, storage, and distribution
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuid } from 'uuid';
import {
  Document,
  DocumentFormat,
  GenerationStatus,
  GenerateDocumentRequest,
  DocumentResponse,
  TemplateContext,
  DocumentFilter,
  PaginationOptions,
  PaginatedResponse,
  DocumentError,
  DocumentNotFound,
  UnauthorizedError,
} from '../models/types';
import { IStorageProvider } from '../models/types';
import { TemplateProvider } from './template-provider';
import { PDFGenerator } from './pdf-generator';

/**
 * Main document service orchestrator
 */
export class DocumentService {
  private prisma: PrismaClient;
  private templateProvider: TemplateProvider;
  private pdfGenerator: PDFGenerator;
  private storageProvider: IStorageProvider;

  constructor(
    prisma: PrismaClient,
    templateProvider: TemplateProvider,
    pdfGenerator: PDFGenerator,
    storageProvider: IStorageProvider,
  ) {
    this.prisma = prisma;
    this.templateProvider = templateProvider;
    this.pdfGenerator = pdfGenerator;
    this.storageProvider = storageProvider;
  }

  /**
   * Generate a document
   */
  async generateDocument(userId: string, request: GenerateDocumentRequest): Promise<DocumentResponse> {
    try {
      console.log(`[DocumentService] Generating document: type=${request.type}, userId=${userId}`);

      // Get template
      let templateId: string;
      if (request.templateId) {
        templateId = request.templateId;
      } else {
        const template = await this.templateProvider.getActiveTemplate(request.type);
        templateId = template.id;
      }

      // Create document record (pending)
      const document = await this.prisma.document.create({
        data: {
          type: request.type,
          status: GenerationStatus.PENDING,
          userId,
          bookingId: request.bookingId,
          invoiceId: request.invoiceId,
          templateId,
          metadata: {
            generationRequestedAt: new Date().toISOString(),
          },
        },
      });

      try {
        // Render template
        const htmlContent = await this.templateProvider.renderTemplate(templateId, request.context);

        // Generate PDF if needed
        let pdfBuffer: Buffer | null = null;
        const format = request.format || DocumentFormat.BOTH;

        if (format === DocumentFormat.PDF || format === DocumentFormat.BOTH) {
          pdfBuffer = await this.pdfGenerator.generatePDF(htmlContent);
        }

        // Store files
        const storagePath = `documents/${request.type}/${userId}/${uuid()}`;
        let fileUrl: string | null = null;
        let fileSize: number | null = null;

        if (pdfBuffer) {
          const pdfPath = `${storagePath}.pdf`;
          fileUrl = await this.storageProvider.upload(pdfPath, pdfBuffer, 'application/pdf');
          fileSize = pdfBuffer.length;
        }

        // Calculate expiration date based on retention policy
        const retentionPolicy = await this.prisma.documentRetention.findUnique({
          where: { documentType: request.type },
        });

        const expiresAt = retentionPolicy
          ? new Date(Date.now() + retentionPolicy.retentionDays * 24 * 60 * 60 * 1000)
          : null;

        // Update document with generated content
        const updated = await this.prisma.document.update({
          where: { id: document.id },
          data: {
            status: GenerationStatus.GENERATED,
            content: format === DocumentFormat.HTML || format === DocumentFormat.BOTH ? htmlContent : undefined,
            storagePath,
            fileUrl,
            fileSize,
            generatedAt: new Date(),
            expiresAt,
          },
        });

        console.log(`[DocumentService] Document generated successfully: ${document.id}`);

        return this.mapDocumentToResponse(updated);
      } catch (error) {
        // Mark document as failed
        await this.prisma.document.update({
          where: { id: document.id },
          data: {
            status: GenerationStatus.FAILED,
            metadata: {
              ...(document.metadata as Record<string, any> || {}),
              error: error instanceof Error ? error.message : String(error),
            },
          },
        });

        throw error;
      }
    } catch (error) {
      console.error('[DocumentService] Error generating document:', error);
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(userId: string, documentId: string): Promise<DocumentResponse> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new DocumentNotFound(documentId);
      }

      // Check authorization
      if (document.userId !== userId) {
        throw new UnauthorizedError('Access denied to this document');
      }

      // Log access
      await this.logDocumentAccess(documentId, userId, 'view');

      return this.mapDocumentToResponse(document);
    } catch (error) {
      if (error instanceof DocumentError) throw error;
      throw new Error(`Failed to get document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * List user's documents
   */
  async listDocuments(
    userId: string,
    filters?: DocumentFilter,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResponse<DocumentResponse>> {
    try {
      const pageSize = pagination?.pageSize || 10;
      const page = pagination?.page || 1;
      const skip = (page - 1) * pageSize;

      // Build filter
      const whereFilter: any = {
        userId,
      };

      if (filters?.type) whereFilter.type = filters.type;
      if (filters?.status) whereFilter.status = filters.status;
      if (filters?.bookingId) whereFilter.bookingId = filters.bookingId;
      if (filters?.invoiceId) whereFilter.invoiceId = filters.invoiceId;

      if (filters?.startDate || filters?.endDate) {
        whereFilter.createdAt = {};
        if (filters.startDate) whereFilter.createdAt.gte = filters.startDate;
        if (filters.endDate) whereFilter.createdAt.lte = filters.endDate;
      }

      // Fetch documents
      const [documents, total] = await Promise.all([
        this.prisma.document.findMany({
          where: whereFilter,
          skip,
          take: pageSize,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.document.count({ where: whereFilter }),
      ]);

      return {
        items: documents.map(doc => this.mapDocumentToResponse(doc)),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      throw new Error(`Failed to list documents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Search documents
   */
  async searchDocuments(userId: string, query: string): Promise<DocumentResponse[]> {
    try {
      // Simple substring search on metadata
      const documents = await this.prisma.document.findMany({
        where: {
          userId,
          OR: [
            { bookingId: { contains: query, mode: 'insensitive' } },
            { invoiceId: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return documents.map(doc => this.mapDocumentToResponse(doc));
    } catch (error) {
      throw new Error(`Failed to search documents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get document download link
   */
  async getDownloadLink(userId: string, documentId: string, expirationSeconds: number = 3600): Promise<string> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new DocumentNotFound(documentId);
      }

      if (document.userId !== userId) {
        throw new UnauthorizedError('Cannot download this document');
      }

      if (!document.storagePath) {
        throw new Error('Document file not available');
      }

      // Log access
      await this.logDocumentAccess(documentId, userId, 'download');

      // Update accessed timestamp
      await this.prisma.document.update({
        where: { id: documentId },
        data: { accessedAt: new Date() },
      });

      return this.storageProvider.getSignedUrl(document.storagePath, expirationSeconds);
    } catch (error) {
      if (error instanceof DocumentError) throw error;
      throw new Error(`Failed to get download link: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(userId: string, documentId: string): Promise<void> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new DocumentNotFound(documentId);
      }

      if (document.userId !== userId) {
        throw new UnauthorizedError('Cannot delete this document');
      }

      // Delete from storage if exists
      if (document.storagePath) {
        try {
          await this.storageProvider.delete(document.storagePath);
        } catch (error) {
          console.error('[DocumentService] Error deleting from storage:', error);
        }
      }

      // Delete from database (cascade will delete accesses)
      await this.prisma.document.delete({
        where: { id: documentId },
      });

      console.log(`[DocumentService] Document deleted: ${documentId}`);
    } catch (error) {
      if (error instanceof DocumentError) throw error;
      throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Regenerate document (e.g., after template update)
   */
  async regenerateDocument(userId: string, documentId: string): Promise<DocumentResponse> {
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
        include: { template: true },
      });

      if (!document) {
        throw new DocumentNotFound(documentId);
      }

      if (document.userId !== userId) {
        throw new UnauthorizedError('Cannot regenerate this document');
      }

      // Extract context from metadata
      const context: TemplateContext = document.metadata as TemplateContext;

      // Delete old file
      if (document.storagePath) {
        try {
          await this.storageProvider.delete(document.storagePath);
        } catch (error) {
          console.error('[DocumentService] Error deleting old storage:', error);
        }
      }

      // Generate new
      const newDocument = await this.generateDocument(userId, {
        type: document.type,
        userId,
        templateId: document.templateId,
        bookingId: document.bookingId || undefined,
        invoiceId: document.invoiceId || undefined,
        context,
        format: document.template.format as DocumentFormat,
      });

      // Log regeneration
      await this.logDocumentAccess(documentId, userId, 'regenerate');

      console.log(`[DocumentService] Document regenerated: ${documentId}`);
      return newDocument;
    } catch (error) {
      if (error instanceof DocumentError) throw error;
      throw new Error(`Failed to regenerate document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get document access logs (admin only)
   */
  async getDocumentAccessLogs(documentId: string): Promise<any[]> {
    try {
      const accesses = await this.prisma.documentAccess.findMany({
        where: { documentId },
        orderBy: { timestamp: 'desc' },
      });

      return accesses;
    } catch (error) {
      throw new Error(`Failed to get access logs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get user's document statistics
   */
  async getUserDocumentStats(userId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    try {
      const documents = await this.prisma.document.findMany({
        where: { userId },
      });

      const byType: Record<string, number> = {};
      const byStatus: Record<string, number> = {};

      documents.forEach(doc => {
        byType[doc.type] = (byType[doc.type] || 0) + 1;
        byStatus[doc.status] = (byStatus[doc.status] || 0) + 1;
      });

      return {
        total: documents.length,
        byType,
        byStatus,
      };
    } catch (error) {
      throw new Error(`Failed to get stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Clean up expired documents (scheduled task)
   */
  async cleanupExpiredDocuments(): Promise<{ deleted: number; errors: number }> {
    try {
      const expiredDocuments = await this.prisma.document.findMany({
        where: {
          expiresAt: {
            lte: new Date(),
          },
        },
      });

      let deleted = 0;
      let errors = 0;

      for (const doc of expiredDocuments) {
        try {
          // Delete from storage
          if (doc.storagePath) {
            await this.storageProvider.delete(doc.storagePath);
          }

          // Delete from database
          await this.prisma.document.delete({
            where: { id: doc.id },
          });

          deleted++;
        } catch (error) {
          console.error(`[DocumentService] Error deleting expired document ${doc.id}:`, error);
          errors++;
        }
      }

      console.log(`[DocumentService] Cleanup complete: deleted=${deleted}, errors=${errors}`);
      return { deleted, errors };
    } catch (error) {
      throw new Error(`Failed to cleanup: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Log document access for audit trail
   */
  private async logDocumentAccess(
    documentId: string,
    userId: string,
    action: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    try {
      await this.prisma.documentAccess.create({
        data: {
          documentId,
          userId,
          action,
          ipAddress,
          userAgent,
        },
      });
    } catch (error) {
      console.error('[DocumentService] Error logging access:', error);
      // Don't throw - access logging shouldn't break the operation
    }
  }

  /**
   * Map document to response DTO
   */
  private mapDocumentToResponse(document: Document): DocumentResponse {
    return {
      id: document.id,
      type: document.type,
      status: document.status,
      userId: document.userId,
      templateId: document.templateId,
      fileUrl: document.fileUrl || undefined,
      fileSize: document.fileSize || undefined,
      generatedAt: document.generatedAt || undefined,
      sentAt: document.sentAt || undefined,
      expiresAt: document.expiresAt || undefined,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }
}
