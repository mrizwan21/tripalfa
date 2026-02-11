/**
 * Template Controller
 * REST API endpoints for template management
 */

import { Request, Response, NextFunction } from 'express';
import { TemplateProvider } from '../services/template-provider';
import {
  DocumentType,
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
 * Template Controller handling template-related endpoints
 */
export class TemplateController {
  constructor(private templateProvider: TemplateProvider) {}

  /**
   * List templates
   * GET /templates
   */
  async listTemplates(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { type, page = 1, pageSize = 20 } = req.query;

      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize as string) || 20));

      const templates = await this.templateProvider.listTemplates(type as DocumentType);

      res.json({
        success: true,
        templates,
        count: Array.isArray(templates) ? templates.length : 0,
        page: pageNum,
        pageSize: pageSizeNum,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get template by ID
   * GET /templates/:id
   */
  async getTemplate(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params;

      const template = await this.templateProvider.getTemplate(id);

      if (!template) {
        res.status(404).json({
          success: false,
          error: { code: 'TEMPLATE_NOT_FOUND', message: 'Template not found' },
        });
        return;
      }

      res.json({
        success: true,
        template,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validate template syntax
   * POST /templates/validate
   */
  async validateTemplate(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { content } = req.body;

      if (!content) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_CONTENT', message: 'Template content is required' },
        });
        return;
      }

      const validation = this.templateProvider.validateTemplateSyntax(content);

      res.json({
        success: true,
        valid: validation.valid,
        error: validation.error,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Preview template
   * POST /templates/preview
   */
  async previewTemplate(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { templateId, content, context } = req.body;

      if (!context) {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_CONTEXT', message: 'Context data is required' },
        });
        return;
      }

      let htmlContent: string;

      if (templateId) {
        const template = await this.templateProvider.getTemplate(templateId);
        if (!template) {
          res.status(404).json({
            success: false,
            error: { code: 'TEMPLATE_NOT_FOUND', message: 'Template not found' },
          });
          return;
        }
        htmlContent = template.content;
      } else if (content) {
        htmlContent = content;
      } else {
        res.status(400).json({
          success: false,
          error: { code: 'MISSING_TEMPLATE', message: 'Template ID or content required' },
        });
        return;
      }

      const startTime = Date.now();
      const rendered = this.templateProvider.renderTemplateContent(htmlContent, context);
      const renderTime = Date.now() - startTime;

      res.json({
        success: true,
        html: rendered,
        length: rendered.length,
        renderTime,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create template (admin only)
   * POST /templates
   */
  async createTemplate(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.isAdmin) {
        throw new UnauthorizedError('Admin access required');
      }

      const { name, type, content, format, description } = req.body;

      if (!name || !type || !content) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_REQUIRED_FIELDS',
            message: 'Name, type, and content are required',
          },
        });
        return;
      }

      // Validate template syntax
      const validation = this.templateProvider.validateTemplateSyntax(content);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_TEMPLATE_SYNTAX',
            message: 'Template syntax validation failed',
            details: validation.error,
          },
        });
        return;
      }

      const template = await this.templateProvider.createTemplate({
        name,
        type: type as DocumentType,
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
   * Update template (admin only)
   * PUT /templates/:id
   */
  async updateTemplate(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.isAdmin) {
        throw new UnauthorizedError('Admin access required');
      }

      const { id } = req.params;
      const updateData = req.body;

      // Validate template syntax if content is being updated
      if (updateData.content) {
        const validation = this.templateProvider.validateTemplateSyntax(updateData.content);
        if (!validation.valid) {
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_TEMPLATE_SYNTAX',
              message: 'Template syntax validation failed',
              details: validation.error,
            },
          });
          return;
        }
      }

      const template = await this.templateProvider.updateTemplate(id, updateData);

      if (!template) {
        res.status(404).json({
          success: false,
          error: { code: 'TEMPLATE_NOT_FOUND', message: 'Template not found' },
        });
        return;
      }

      res.json({
        success: true,
        template,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete template (admin only)
   * DELETE /templates/:id
   */
  async deleteTemplate(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.isAdmin) {
        throw new UnauthorizedError('Admin access required');
      }

      const { id } = req.params;

      await this.templateProvider.deleteTemplate(id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get template statistics
   * GET /templates/stats/summary
   */
  async getTemplateStats(
    _req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const allTemplates = await this.templateProvider.listTemplates();

      res.json({
        success: true,
        stats: {
          totalTemplates: allTemplates.length,
          activeTemplates: allTemplates.filter((t: any) => t.isActive).length,
          byType: allTemplates.reduce((acc: any, t: any) => {
            acc[t.type] = (acc[t.type] || 0) + 1;
            return acc;
          }, {}),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
