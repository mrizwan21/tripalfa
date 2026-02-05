import express from 'express';
import { KYCService } from '../services/kycService.js';
import { Database } from '../utils/database.js';
import { SecurityMiddleware } from '../middleware/security.js';
import { logger } from '../utils/logger.js';
import { 
  CreateKYCDocumentRequest, 
  UpdateKYCDocumentRequest,
  KYCQueryParams,
  KYCVerificationResult,
  KYCComplianceType,
  KYCComplianceStatus,
  KYCComplianceIssue
} from '../types/kyc.js';
import {
  requireKYCDocumentView,
  requireKYCDocumentCreate,
  requireKYCDocumentUpdate,
  requireKYCDocumentDelete,
  requireKYCDocumentVerify,
  requireKYCDocumentUpload,
  requireKYCDocumentDownload,
  requireKYCComplianceView,
  requireKYCComplianceUpdate,
  requireKYCComplianceManage,
  requireKYCVerificationView,
  requireKYCVerificationManage,
  debugPermissions
} from '../middleware/permissionMiddleware.js';

const router = express.Router();

/**
 * KYC Document Routes
 */

// GET /api/kyc/documents - Get all KYC documents with pagination and filtering
router.get('/documents', 
  requireKYCDocumentView,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new KYCService(client);
      
        const params: KYCQueryParams = {
          companyId: req.user?.companyId,
          documentType: req.query.documentType as any,
          status: req.query.status as any,
          verificationStatus: req.query.verificationStatus as any,
          search: req.query.search as string,
          sortBy: req.query.sortBy as any,
          sortOrder: req.query.sortOrder as any,
          limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
          offset: req.query.offset ? parseInt(req.query.offset as string) : 0
        };

        const result = await service.getKYCDocuments(
          params, 
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.json(result);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error getting KYC documents', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/kyc/documents/:id - Get KYC document by ID
router.get('/documents/:id', 
  requireKYCDocumentView,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new KYCService(client);
      
        const document = await service.getKYCDocumentById(
          req.params.id as string, 
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.json(document);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error getting KYC document', error);
      if (error.message === 'KYC document not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// POST /api/kyc/documents - Create new KYC document
router.post('/documents', 
  requireKYCDocumentCreate,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new KYCService(client);
      
        const documentData: CreateKYCDocumentRequest = {
          companyId: req.user?.companyId || 'default-company',
          documentType: req.body.documentType,
          documentNumber: req.body.documentNumber,
          issueDate: new Date(req.body.issueDate),
          expiryDate: new Date(req.body.expiryDate),
          issuingAuthority: req.body.issuingAuthority,
          documentUrl: req.body.documentUrl
        };

        const document = await service.createKYCDocument(
          documentData, 
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.status(201).json(document);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error creating KYC document', error);
      if (error.message.includes('already exists') || error.message.includes('must be in the future')) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// PUT /api/kyc/documents/:id - Update KYC document
router.put('/documents/:id', 
  requireKYCDocumentUpdate,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new KYCService(client);
      
        const updateData: UpdateKYCDocumentRequest = {
          documentType: req.body.documentType,
          documentNumber: req.body.documentNumber,
          issueDate: req.body.issueDate ? new Date(req.body.issueDate) : undefined,
          expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
          issuingAuthority: req.body.issuingAuthority,
          documentUrl: req.body.documentUrl,
          status: req.body.status,
          rejectionReason: req.body.rejectionReason
        };

        const document = await service.updateKYCDocument(
          req.params.id as string, 
          updateData, 
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.json(document);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error updating KYC document', error);
      if (error.message.includes('not found') || error.message.includes('No fields to update')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// POST /api/kyc/documents/:id/verify - Verify KYC document
router.post('/documents/:id/verify', 
  requireKYCDocumentVerify,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new KYCService(client);
      
        const { verificationResult, rejectionReason } = req.body;

        const document = await service.verifyKYCDocument(
          req.params.id as string, 
          verificationResult, 
          req.user?.id || 'anonymous', 
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B',
          rejectionReason
        );

        res.json(document);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error verifying KYC document', error);
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

/**
 * KYC Compliance Routes
 */

// GET /api/kyc/compliance - Get compliance status for a company
router.get('/compliance', 
  requireKYCComplianceView,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new KYCService(client);
      
        const compliance = await service.checkComplianceStatus(
          req.user?.companyId || 'default-company', 
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.json(compliance);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error checking compliance status', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/kyc/compliance - Update compliance status
router.post('/compliance', 
  requireKYCComplianceUpdate,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new KYCService(client);
      
        const { complianceType, status, issues } = req.body;

        const compliance = await service.updateComplianceStatus(
          req.user?.companyId || 'default-company',
          complianceType,
          status,
          issues,
          req.user?.id || 'anonymous',
          req.user?.role || 'B2B'
        );

        res.json(compliance);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error updating compliance status', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/kyc/stats - Get KYC statistics
router.get('/stats', 
  requireKYCVerificationView,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new KYCService(client);
      
        const stats = await service.getKYCStats(
          req.user?.companyId || 'default-company', 
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.json(stats);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error getting KYC stats', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * KYC Document Upload Routes
 */

// POST /api/kyc/documents/:id/upload - Upload document file
router.post('/documents/:id/upload', 
  requireKYCDocumentUpload,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new KYCService(client);
      
        // This would integrate with file upload middleware
        // For now, we'll assume the file URL is provided in the request body
        const { documentUrl } = req.body;

        const updateData: UpdateKYCDocumentRequest = {
          documentUrl
        };

        const document = await service.updateKYCDocument(
          req.params.id as string, 
          updateData, 
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        res.json(document);
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error uploading KYC document', error);
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// GET /api/kyc/documents/:id/download - Download document file
router.get('/documents/:id/download', 
  requireKYCDocumentDownload,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new KYCService(client);
      
        const document = await service.getKYCDocumentById(
          req.params.id as string, 
          req.user?.id || 'anonymous', 
          req.user?.role || 'B2B'
        );

        // This would integrate with file storage service
        // For now, we'll return the document URL
        res.json({
          downloadUrl: document.documentUrl,
          fileName: `kyc-document-${document.id}.${document.documentType.toLowerCase()}`
        });
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error downloading KYC document', error);
      if (error.message === 'KYC document not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

/**
 * KYC Verification Routes
 */

// POST /api/kyc/verify - Manual verification trigger
router.post('/verify', 
  requireKYCVerificationManage,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new KYCService(client);
      
        const { companyId, documentId, verificationType, verificationResult, rejectionReason } = req.body;

        // This would implement manual verification logic
        // For now, we'll return a success response
        res.json({
          success: true,
          message: 'Manual verification completed',
          verificationResult,
          rejectionReason
        });
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error during manual verification', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/kyc/verification/:id - Get verification details
router.get('/verification/:id', 
  requireKYCVerificationView,
  async (req, res) => {
    try {
      const db = new Database();
      const client = await db.getClient();
      try {
        const service = new KYCService(client);
      
        // This would retrieve verification details
        // For now, we'll return a placeholder response
        res.json({
          verificationId: req.params.id,
          status: 'COMPLETED',
          result: 'PASS',
          verifiedAt: new Date(),
          verifiedBy: 'admin@example.com',
          details: {
            documentType: 'BUSINESS_REGISTRATION',
            verificationMethod: 'MANUAL',
            confidenceScore: 95
          }
        });
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error getting verification details', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;