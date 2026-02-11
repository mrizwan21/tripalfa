/**
 * Document Service Routes
 * Express route definitions
 */

import { Router, Request, Response, NextFunction } from 'express';
import { DocumentController } from '../controllers/DocumentController';
import {
  authenticateToken,
  requireAuth,
  requireAdmin,
  AuthRequest,
} from '../middleware/auth';

/**
 * Create and configure routes
 */
export function createDocumentRoutes(controller: DocumentController): Router {
  const router = Router();

  // ===== PUBLIC ROUTES =====

  /**
   * Health check - no auth required
   */
  router.get('/health', (req: Request, res: Response, next: NextFunction) =>
    controller.health(req, res)
  );

  // ===== AUTHENTICATED USER ROUTES =====

  /**
   * Generate document
   * POST /documents/generate
   */
  router.post('/generate', authenticateToken, (req: AuthRequest, res: Response, next: NextFunction) =>
    controller.generateDocument(req, res, next)
  );

  /**
   * List user's documents
   * GET /documents
   */
  router.get('/', authenticateToken, (req: AuthRequest, res: Response, next: NextFunction) =>
    controller.listDocuments(req, res, next)
  );

  /**
   * Search documents
   * GET /documents/search
   */
  router.get('/search', authenticateToken, (req: AuthRequest, res: Response, next: NextFunction) =>
    controller.searchDocuments(req, res, next)
  );

  /**
   * Get document statistics
   * GET /documents/stats/summary
   */
  router.get('/stats/summary', authenticateToken, (req: AuthRequest, res: Response, next: NextFunction) =>
    controller.getDocumentStats(req, res, next)
  );

  /**
   * Get document by ID
   * GET /documents/:id
   */
  router.get('/:id', authenticateToken, (req: AuthRequest, res: Response, next: NextFunction) =>
    controller.getDocument(req, res, next)
  );

  /**
   * Get download link
   * GET /documents/:id/download-link
   */
  router.get('/:id/download-link', authenticateToken, (req: AuthRequest, res: Response, next: NextFunction) =>
    controller.getDownloadLink(req, res, next)
  );

  /**
   * Regenerate document
   * POST /documents/:id/regenerate
   */
  router.post('/:id/regenerate', authenticateToken, (req: AuthRequest, res: Response, next: NextFunction) =>
    controller.regenerateDocument(req, res, next)
  );

  /**
   * Delete document
   * DELETE /documents/:id
   */
  router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response, next: NextFunction) =>
    controller.deleteDocument(req, res, next)
  );

  // ===== ADMIN ROUTES =====

  /**
   * Get all templates
   * GET /templates
   */
  router.get('/templates', (req: Request, res: Response, next: NextFunction) =>
    controller.listTemplates(req, res, next)
  );

  /**
   * Validate template syntax
   * POST /templates/validate
   */
  router.post('/templates/validate', (req: Request, res: Response, next: NextFunction) =>
    controller.validateTemplate(req, res, next)
  );

  /**
   * Preview template
   * POST /templates/preview
   */
  router.post('/templates/preview', (req: Request, res: Response, next: NextFunction) =>
    controller.previewTemplate(req, res, next)
  );

  /**
   * Get template by ID
   * GET /templates/:id
   */
  router.get('/templates/:id', (req: Request, res: Response, next: NextFunction) =>
    controller.getTemplate(req, res, next)
  );

  /**
   * Create template (admin only)
   * POST /templates
   */
  router.post('/templates', requireAdmin, (req: AuthRequest, res: Response, next: NextFunction) =>
    controller.createTemplate(req, res, next)
  );

  /**
   * Update template (admin only)
   * PATCH /templates/:id
   */
  router.patch('/templates/:id', requireAdmin, (req: AuthRequest, res: Response, next: NextFunction) =>
    controller.updateTemplate(req, res, next)
  );

  /**
   * Toggle template active status (admin only)
   * PATCH /templates/:id/activate
   */
  router.patch('/templates/:id/activate', requireAdmin, (req: AuthRequest, res: Response, next: NextFunction) =>
    controller.toggleTemplateActive(req, res, next)
  );

  /**
   * Get template versions (admin only)
   * GET /templates/:name/versions
   */
  router.get('/templates/:name/versions', requireAdmin, (req: AuthRequest, res: Response, next: NextFunction) =>
    controller.getTemplateVersions(req, res, next)
  );

  /**
   * Delete template (admin only)
   * DELETE /templates/:id
   */
  router.delete('/templates/:id', requireAdmin, (req: AuthRequest, res: Response, next: NextFunction) =>
    controller.deleteTemplate(req, res, next)
  );

  /**
   * Get document access logs (admin only)
   * GET /documents/:id/access-logs
   */
  router.get('/:id/access-logs', requireAdmin, (req: AuthRequest, res: Response, next: NextFunction) =>
    controller.getAccessLogs(req, res, next)
  );

  /**
   * Clean up expired documents (admin only)
   * POST /documents/cleanup
   */
  router.post('/cleanup', requireAdmin, (req: AuthRequest, res: Response, next: NextFunction) =>
    controller.cleanupExpiredDocuments(req, res, next)
  );

  return router;
}
