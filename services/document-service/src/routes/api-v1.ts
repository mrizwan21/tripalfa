/**
 * API v1 Routes
 * Complete API endpoint configuration
 */

import { Router, Request, Response } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import { TemplateController } from '../controllers/TemplateController';
import { StatisticsController } from '../controllers/StatisticsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

interface AuthRequest extends Request {
  userId?: string;
  isAdmin?: boolean;
  user?: { id: string; email?: string; isAdmin?: boolean };
}

/**
 * Create API v1 routes
 */
export function createAPIv1Routes(
  documentController: DocumentController,
  templateController: TemplateController,
  statisticsController: StatisticsController,
): Router {
  const router = Router();

  // ===== HEALTH CHECK =====
  router.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      service: 'document-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // ===== DOCUMENT ROUTES =====

  // Generate document
  router.post(
    '/documents/generate',
    authenticateToken,
    (req: AuthRequest, res: Response, next: any) =>
      documentController.generateDocument(req, res, next),
  );

  // List documents
  router.get(
    '/documents',
    authenticateToken,
    (req: AuthRequest, res: Response, next: any) =>
      documentController.listDocuments(req, res, next),
  );

  // Search documents
  router.get(
    '/documents/search',
    authenticateToken,
    (req: AuthRequest, res: Response, next: any) =>
      documentController.searchDocuments(req, res, next),
  );

  // Get document statistics
  router.get(
    '/documents/stats/summary',
    authenticateToken,
    (req: AuthRequest, res: Response, next: any) =>
      statisticsController.getDocumentStatistics(req, res, next),
  );

  // Get document by ID
  router.get(
    '/documents/:id',
    authenticateToken,
    (req: AuthRequest, res: Response, next: any) =>
      documentController.getDocument(req, res, next),
  );

  // Download document
  router.get(
    '/documents/:id/download',
    authenticateToken,
    (req: AuthRequest, res: Response, next: any) =>
      documentController.getDownloadLink(req, res, next),
  );



  // Delete document
  router.delete(
    '/documents/:id',
    authenticateToken,
    (req: AuthRequest, res: Response, next: any) =>
      documentController.deleteDocument(req, res, next),
  );

  // ===== TEMPLATE ROUTES =====

  // List templates
  router.get(
    '/templates',
    (req: Request, res: Response, next: any) =>
      templateController.listTemplates(req as AuthRequest, res, next),
  );

  // Get template by ID
  router.get(
    '/templates/:id',
    (req: Request, res: Response, next: any) =>
      templateController.getTemplate(req as AuthRequest, res, next),
  );

  // Validate template
  router.post(
    '/templates/validate',
    (req: Request, res: Response, next: any) =>
      templateController.validateTemplate(req as AuthRequest, res, next),
  );

  // Preview template
  router.post(
    '/templates/preview',
    authenticateToken,
    (req: AuthRequest, res: Response, next: any) =>
      templateController.previewTemplate(req, res, next),
  );

  // Get template statistics
  router.get(
    '/templates/stats/summary',
    (req: Request, res: Response, next: any) =>
      statisticsController.getTemplateStatistics(req as AuthRequest, res, next),
  );

  // Create template (admin only)
  router.post(
    '/templates',
    authenticateToken,
    requireAdmin,
    (req: AuthRequest, res: Response, next: any) =>
      templateController.createTemplate(req, res, next),
  );

  // Update template (admin only)
  router.put(
    '/templates/:id',
    authenticateToken,
    requireAdmin,
    (req: AuthRequest, res: Response, next: any) =>
      templateController.updateTemplate(req, res, next),
  );

  // Delete template (admin only)
  router.delete(
    '/templates/:id',
    authenticateToken,
    requireAdmin,
    (req: AuthRequest, res: Response, next: any) =>
      templateController.deleteTemplate(req, res, next),
  );

  // ===== STATISTICS ROUTES (ADMIN ONLY) =====

  // System statistics
  router.get(
    '/system/stats/summary',
    authenticateToken,
    requireAdmin,
    (req: AuthRequest, res: Response, next: any) =>
      statisticsController.getSystemStatistics(req, res, next),
  );

  // Performance metrics
  router.get(
    '/system/metrics/performance',
    authenticateToken,
    requireAdmin,
    (req: AuthRequest, res: Response, next: any) =>
      statisticsController.getPerformanceMetrics(req, res, next),
  );

  // Audit summary
  router.get(
    '/audit/summary',
    authenticateToken,
    requireAdmin,
    (req: AuthRequest, res: Response, next: any) =>
      statisticsController.getAuditSummary(req, res, next),
  );

  return router;
}

// Export as default for backwards compatibility
export default createAPIv1Routes;
