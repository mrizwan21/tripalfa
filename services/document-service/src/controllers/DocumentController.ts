/**
 * Document Controller
 * REST API endpoints for document management
 */

import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/document-service';
import { TemplateProvider } from '../services/template-provider';
import {
  GenerateDocumentRequest,
  DocumentType,
  DocumentFilter,
  UnauthorizedError,
} from '../models/types';

/**
 * Extended Express Request with authenticated user info
 */
interface AuthRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
}

/**
 * Document Controller handling all REST endpoints
 */
export class DocumentController {
  constructor(
    private documentService: DocumentService,
    private templateProvider: TemplateProvider,
  ) {}

  /**
   * Generate a new document
   * POST /documents/generate
   */
  async generateDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, bookingId, invoiceId, context, format, sendEmail } = req.body;
      const userId = req.userId!;

      // Validate required fields
      if (!type) {
        res.status(400).json({ error: 'Document type is required' });
        return;
      }

      // Validate context
      if (!context || typeof context !== 'object') {
        res.status(400).json({ error: 'Template context is required and must be an object' });
        return;
      }

      const request: GenerateDocumentRequest = {
        type: type as DocumentType,
        userId,
        bookingId,
        invoiceId,
        context,
        format,
        sendEmail: sendEmail || false,
      };

      const document = await this.documentService.generateDocument(userId, request);

      res.status(201).json({
        success: true,
        document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List user's documents
   * GET /documents
   */
  async listDocuments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const page = parseInt((req.query.page as any) || '1') || 1;
      const pageSize = parseInt((req.query.pageSize as any) || '10') || 10;
      const type = (req.query.type as any) as DocumentType | undefined;
      const status = (req.query.status as any) as string | undefined;
      const startDate = req.query.startDate ? new Date((req.query.startDate as any) || '') : undefined;
      const endDate = req.query.endDate ? new Date((req.query.endDate as any) || '') : undefined;

      const filters: DocumentFilter = {
        type,
        status: status ? (status as any) : undefined,
        startDate,
        endDate,
      };

      const result = await this.documentService.listDocuments(userId, filters, {
        page,
        pageSize,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search documents
   * GET /documents/search
   */
  async searchDocuments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      const documents = await this.documentService.searchDocuments(userId, q);

      res.json({
        success: true,
        documents,
        count: documents.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document by ID
   * GET /documents/:id
   */
  async getDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const document = await this.documentService.getDocument(userId, id as string);

      res.json({
        success: true,
        document,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document download link
   * GET /documents/:id/download-link
   */
  async getDownloadLink(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId!;
      const expirationSeconds = parseInt(req.query.expires as string) || 3600;

      const downloadLink = await this.documentService.getDownloadLink(userId, id as string, expirationSeconds);

      res.json({
        success: true,
        downloadLink,
        expiresIn: expirationSeconds,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete document
   * DELETE /documents/:id
   */
  async deleteDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      await this.documentService.deleteDocument(userId, id as string);

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Regenerate document
   * POST /documents/:id/regenerate
   */
  async regenerateDocument(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const document = await this.documentService.regenerateDocument(userId, id as string);

      res.json({
        success: true,
        document,
        message: 'Document regenerated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's document statistics
   * GET /documents/stats/summary
   */
  async getDocumentStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;

      const stats = await this.documentService.getUserDocumentStats(userId as string);

      res.json({
        success: true,
        stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ====== ADMIN ENDPOINTS ======
   */

  /**
   * Get template by ID
   * GET /templates/:id
   */
  async getTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const template = await this.templateProvider.getTemplate(id as string);

      res.json({
        success: true,
        template,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List templates (with optional type filter)
   * GET /templates
   */
  async listTemplates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type } = req.query;

      const templates = await this.templateProvider.listTemplates((type as string | undefined) as DocumentType | undefined);

      res.json({
        success: true,
        templates,
        count: templates.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new template
   * POST /templates
   */
  async createTemplate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.isAdmin) {
        throw new UnauthorizedError('Only admins can create templates');
      }

      const { name, type, content, format, description } = req.body;

      // Validate syntax
      const syntaxCheck = this.templateProvider.validateTemplateSyntax(content);
      if (!syntaxCheck.valid) {
        res.status(400).json({
          error: 'Invalid template syntax',
          details: syntaxCheck.error,
        });
        return;
      }

      const template = await this.templateProvider.createTemplate({
        name,
        type: (type as any) as DocumentType,
        content,
        format,
        description,
      });

      res.status(201).json({
        success: true,
        template,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update template
   * PATCH /templates/:id
   */
  async updateTemplate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.isAdmin) {
        throw new UnauthorizedError('Only admins can update templates');
      }

      const { id } = req.params;
      const { name, content, format, description } = req.body;

      // Validate syntax if content is being updated
      if (content) {
        const syntaxCheck = this.templateProvider.validateTemplateSyntax(content);
        if (!syntaxCheck.valid) {
          res.status(400).json({
            error: 'Invalid template syntax',
            details: syntaxCheck.error,
          });
          return;
        }
      }

      const template = await this.templateProvider.updateTemplate(id as string, {
        name,
        content,
        format,
        description,
      });

      res.json({
        success: true,
        template,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete template
   * DELETE /templates/:id
   */
  async deleteTemplate(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.isAdmin) {
        throw new UnauthorizedError('Only admins can delete templates');
      }

      const { id } = req.params;

      await this.templateProvider.deleteTemplate(id as string);

      res.json({
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get template versions/history
   * GET /templates/:name/versions
   */
  async getTemplateVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name } = req.params;
      const { type } = req.query;

      if (!type) {
        res.status(400).json({ error: 'Document type is required' });
        return;
      }

      const versions = await this.templateProvider.getTemplateVersions(name as string, (type as string) as DocumentType);

      res.json({
        success: true,
        versions,
        count: versions.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Preview template rendering
   * POST /templates/preview
   */
  async previewTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { templateId, context } = req.body;

      if (!templateId || !context) {
        res.status(400).json({ error: 'Template ID and context are required' });
        return;
      }

      const html = await this.templateProvider.renderTemplate(templateId, context);

      res.json({
        success: true,
        html,
        length: html.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate template syntax
   * POST /templates/validate
   */
  async validateTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { content } = req.body;

      if (!content) {
        res.status(400).json({ error: 'Template content is required' });
        return;
      }

      const result = this.templateProvider.validateTemplateSyntax(content);

      res.json({
        success: result.valid,
        valid: result.valid,
        error: result.error,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle template active status
   * PATCH /templates/:id/activate
   */
  async toggleTemplateActive(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.isAdmin) {
        throw new UnauthorizedError('Only admins can toggle template status');
      }

      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        res.status(400).json({ error: 'isActive must be a boolean' });
        return;
      }

      const template = await this.templateProvider.toggleTemplateActiveStatus(id as string, isActive);

      res.json({
        success: true,
        template,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get document access logs (admin only)
   * GET /documents/:id/access-logs
   */
  async getAccessLogs(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.isAdmin) {
        throw new UnauthorizedError('Only admins can view access logs');
      }

      const { id } = req.params;

      const logs = await this.documentService.getDocumentAccessLogs(id as string);

      res.json({
        success: true,
        logs,
        count: logs.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clean up expired documents (admin only)
   * POST /documents/cleanup
   */
  async cleanupExpiredDocuments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.isAdmin) {
        throw new UnauthorizedError('Only admins can run cleanup');
      }

      const result = await this.documentService.cleanupExpiredDocuments();

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check endpoint
   * GET /health
   */
  async health(_req: Request, res: Response): Promise<void> {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'document-service',
      version: '1.0.0',
    });
  }
}
