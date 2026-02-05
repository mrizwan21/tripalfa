import { PoolClient } from 'pg';
import { logger } from '../utils/logger.js';
import { SecurityMiddleware } from '../middleware/security.js';
import { 
  KYCDocument, 
  KYCVerification, 
  KYCCompliance,
  CreateKYCDocumentRequest,
  UpdateKYCDocumentRequest,
  KYCQueryParams,
  PaginatedResponse,
  KYCStats,
  KYCDocumentType,
  KYCDocumentStatus,
  KYCVerificationType,
  KYCVerificationStatus,
  KYCVerificationResult,
  KYCComplianceType,
  KYCComplianceStatus,
  KYCRequirement,
  KYCComplianceIssue
} from '../types/kyc.js';

/**
 * KYC Service for managing Know Your Customer compliance
 */
export class KYCService {
  private db: PoolClient;

  constructor(db: PoolClient) {
    this.db = db;
  }

  /**
   * KYC Document Management
   */

  /**
   * Create a new KYC document with validation and security checks
   */
  async createKYCDocument(
    documentData: CreateKYCDocumentRequest, 
    userId: string, 
    userRole: string
  ): Promise<KYCDocument> {
    try {
      // Security validation
      this.validateKYCDocumentInput(documentData);
      
      // Authorization check
      await this.checkKYCPermissions(userId, userRole, 'create', documentData.companyId);

      // Check if document already exists for this type and company
      const existingDoc = await this.db.query(
        'SELECT id FROM kyc_documents WHERE document_type = $1 AND company_id = $2 AND deleted_at IS NULL',
        [documentData.documentType, documentData.companyId]
      );

      if (existingDoc.rows.length > 0) {
        throw new Error('A document of this type already exists for this company');
      }

      // Validate expiry date
      if (documentData.expiryDate <= new Date()) {
        throw new Error('Document expiry date must be in the future');
      }

      const result = await this.db.query(
        `INSERT INTO kyc_documents (
          company_id, document_type, document_number, issue_date, expiry_date,
          issuing_authority, document_url, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *`,
        [
          documentData.companyId,
          documentData.documentType,
          documentData.documentNumber,
          documentData.issueDate,
          documentData.expiryDate,
          documentData.issuingAuthority,
          documentData.documentUrl,
          KYCDocumentStatus.PENDING
        ]
      );

      const document = result.rows[0];

      // Log security event
      logger.info('KYC document created', {
        documentId: document.id,
        companyId: document.company_id,
        documentType: document.document_type,
        createdBy: userId,
        userRole
      });

      return this.mapKYCDocument(document);
    } catch (error) {
      logger.error('Error creating KYC document', { error, userId, userRole });
      throw error;
    }
  }

  /**
   * Get KYC document by ID with security checks
   */
  async getKYCDocumentById(id: string, userId: string, userRole: string): Promise<KYCDocument> {
    try {
      // First get the document to determine its type
      const docResult = await this.db.query(
        'SELECT document_type FROM kyc_documents WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );

      if (docResult.rows.length === 0) {
        throw new Error('KYC document not found');
      }

      const documentType = docResult.rows[0].document_type;
      const verificationType = this.mapDocumentTypeToVerificationType(documentType);

      const result = await this.db.query(
        `SELECT d.*, 
                v.status as verification_status,
                v.verification_type,
                v.verified_at,
                v.verified_by
         FROM kyc_documents d
         LEFT JOIN kyc_verifications v ON v.company_id = d.company_id 
           AND v.verification_type = $2
         WHERE d.id = $1 AND d.deleted_at IS NULL`,
        [id, verificationType]
      );

      if (result.rows.length === 0) {
        throw new Error('KYC document not found');
      }

      const document = result.rows[0];

      // Authorization check
      await this.checkKYCPermissions(userId, userRole, 'read', document.company_id);

      return this.mapKYCDocumentWithVerification(document);
    } catch (error) {
      logger.error('Error getting KYC document', { error, id, userId, userRole });
      throw error;
    }
  }

  /**
   * Get KYC documents with pagination and filtering
   */
  async getKYCDocuments(
    params: KYCQueryParams, 
    userId: string, 
    userRole: string
  ): Promise<PaginatedResponse<KYCDocument>> {
    try {
      // Build query with security filters
      let query = `
        SELECT d.*, 
               v.status as verification_status,
               v.verification_type,
               COUNT(t.id) as transaction_count
        FROM kyc_documents d
        LEFT JOIN kyc_verifications v ON v.company_id = d.company_id
        LEFT JOIN virtual_card_transactions t ON t.company_id = d.company_id
        WHERE d.deleted_at IS NULL
      `;
      
      const values: any[] = [];
      let paramIndex = 1;

      // Apply security filters based on user role
      if (userRole !== 'SUPER_ADMIN') {
        query += ` AND d.company_id = $${paramIndex}`;
        values.push(params.companyId || 'user_company_id'); // This would be replaced with actual user company
        paramIndex++;
      } else if (params.companyId) {
        query += ` AND d.company_id = $${paramIndex}`;
        values.push(params.companyId);
        paramIndex++;
      }

      if (params.documentType) {
        query += ` AND d.document_type = $${paramIndex}`;
        values.push(params.documentType);
        paramIndex++;
      }

      if (params.status) {
        query += ` AND d.status = $${paramIndex}`;
        values.push(params.status);
        paramIndex++;
      }

      if (params.verificationStatus) {
        query += ` AND v.status = $${paramIndex}`;
        values.push(params.verificationStatus);
        paramIndex++;
      }

      if (params.search) {
        query += ` AND (d.document_number ILIKE $${paramIndex} OR d.issuing_authority ILIKE $${paramIndex})`;
        values.push(`%${params.search}%`);
        paramIndex++;
      }

      query += ` GROUP BY d.id, v.status, v.verification_type`;

      // Add sorting
      const sortBy = params.sortBy || 'created_at';
      const sortOrder = params.sortOrder || 'desc';
      query += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

      // Add pagination
      if (params.limit) {
        query += ` LIMIT $${paramIndex}`;
        values.push(params.limit);
        paramIndex++;
        
        if (params.offset) {
          query += ` OFFSET $${paramIndex}`;
          values.push(params.offset);
        }
      }

      // Get total count
      const countQuery = query.replace(/SELECT.*?FROM/, 'SELECT COUNT(*) FROM');
      const countResult = await this.db.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get data
      const result = await this.db.query(query, values);

      const documents = result.rows.map(row => this.mapKYCDocumentWithVerification(row));

      return {
        data: documents,
        total,
        page: Math.floor((params.offset || 0) / (params.limit || 10)) + 1,
        limit: params.limit || 10,
        totalPages: Math.ceil(total / (params.limit || 10))
      };
    } catch (error) {
      logger.error('Error getting KYC documents', { error, params, userId, userRole });
      throw error;
    }
  }

  /**
   * Update KYC document with validation
   */
  async updateKYCDocument(
    id: string, 
    updateData: UpdateKYCDocumentRequest, 
    userId: string, 
    userRole: string
  ): Promise<KYCDocument> {
    try {
      // Security validation
      this.validateKYCDocumentInput(updateData);

      // Get existing document
      const existing = await this.getKYCDocumentById(id, userId, userRole);

      // Authorization check
      await this.checkKYCPermissions(userId, userRole, 'update', existing.companyId);

      // Build update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${this.toSnakeCase(key)} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE kyc_documents 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND deleted_at IS NULL
        RETURNING *
      `;

      const result = await this.db.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('KYC document not found or already deleted');
      }

      const document = result.rows[0];

      // Log security event
      logger.info('KYC document updated', {
        documentId: id,
        companyId: document.company_id,
        updatedBy: userId,
        userRole,
        fields: Object.keys(updateData)
      });

      return this.mapKYCDocument(document);
    } catch (error) {
      logger.error('Error updating KYC document', { error, id, userId, userRole });
      throw error;
    }
  }

  /**
   * Verify KYC document
   */
  async verifyKYCDocument(
    id: string, 
    verificationResult: KYCVerificationResult,
    verifiedBy: string,
    userId: string, 
    userRole: string,
    rejectionReason?: string
  ): Promise<KYCDocument> {
    try {
      const document = await this.getKYCDocumentById(id, userId, userRole);

      // Authorization check
      await this.checkKYCPermissions(userId, userRole, 'verify', document.companyId);

      // Update document status
      const newStatus = verificationResult === KYCVerificationResult.PASS 
        ? KYCDocumentStatus.VERIFIED 
        : KYCDocumentStatus.REJECTED;

      const result = await this.db.query(
        `UPDATE kyc_documents 
         SET status = $1, verified_at = NOW(), verified_by = $2, 
             rejection_reason = $3, updated_at = NOW()
         WHERE id = $4 AND deleted_at IS NULL
         RETURNING *`,
        [newStatus, verifiedBy, rejectionReason, id]
      );

      if (result.rows.length === 0) {
        throw new Error('KYC document not found or already deleted');
      }

      const updatedDocument = result.rows[0];

      // Create verification record
      await this.createVerificationRecord(
        document.companyId,
        this.mapDocumentTypeToVerificationType(document.documentType),
        verificationResult,
        verifiedBy,
        rejectionReason
      );

      // Log security event
      logger.info('KYC document verified', {
        documentId: id,
        companyId: document.companyId,
        verificationResult,
        verifiedBy,
        verifiedAt: new Date(),
        userRole
      });

      return this.mapKYCDocument(updatedDocument);
    } catch (error) {
      logger.error('Error verifying KYC document', { error, id, userId, userRole });
      throw error;
    }
  }

  /**
   * KYC Verification Management
   */

  /**
   * Create verification record
   */
  async createVerificationRecord(
    companyId: string,
    verificationType: KYCVerificationType,
    result: KYCVerificationResult,
    verifiedBy: string,
    rejectionReason?: string
  ): Promise<KYCVerification> {
    try {
      const dbResult = await this.db.query(
        `INSERT INTO kyc_verifications (
          company_id, verification_type, status, verification_result,
          verified_at, verified_by, rejection_reason, attempts, last_attempt_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, 1, NOW(), NOW(), NOW())
        RETURNING *`,
        [
          companyId,
          verificationType,
          KYCVerificationStatus.VERIFIED,
          result,
          verifiedBy,
          rejectionReason
        ]
      );

      const verification = dbResult.rows[0];

      logger.info('KYC verification created', {
        verificationId: verification.id,
        companyId,
        verificationType,
        result
      });

      return this.mapKYCVerification(verification);
    } catch (error) {
      logger.error('Error creating verification record', { error, companyId, verificationType });
      throw error;
    }
  }

  /**
   * KYC Compliance Management
   */

  /**
   * Check compliance status for a company
   */
  async checkComplianceStatus(
    companyId: string, 
    userId: string, 
    userRole: string
  ): Promise<KYCCompliance[]> {
    try {
      // Authorization check
      await this.checkKYCPermissions(userId, userRole, 'read', companyId);

      const result = await this.db.query(
        `SELECT * FROM kyc_compliance 
         WHERE company_id = $1 AND deleted_at IS NULL
         ORDER BY compliance_type, created_at DESC`,
        [companyId]
      );

      return result.rows.map(row => this.mapKYCCompliance(row));
    } catch (error) {
      logger.error('Error checking compliance status', { error, companyId, userId, userRole });
      throw error;
    }
  }

  /**
   * Update compliance status
   */
  async updateComplianceStatus(
    companyId: string,
    complianceType: KYCComplianceType,
    status: KYCComplianceStatus,
    issues: KYCComplianceIssue[],
    userId: string,
    userRole: string
  ): Promise<KYCCompliance> {
    try {
      // Authorization check
      await this.checkKYCPermissions(userId, userRole, 'update', companyId);

      const complianceScore = this.calculateComplianceScore(issues);

      const result = await this.db.query(
        `INSERT INTO kyc_compliance (
          company_id, compliance_type, status, compliance_score, 
          issues, last_checked_at, next_check_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, NOW(), NOW())
        ON CONFLICT (company_id, compliance_type) 
        DO UPDATE SET 
          status = EXCLUDED.status,
          compliance_score = EXCLUDED.compliance_score,
          issues = EXCLUDED.issues,
          last_checked_at = EXCLUDED.last_checked_at,
          next_check_at = EXCLUDED.next_check_at,
          updated_at = NOW()
        RETURNING *`,
        [
          companyId,
          complianceType,
          status,
          complianceScore,
          JSON.stringify(issues),
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next check in 30 days
        ]
      );

      const compliance = result.rows[0];

      // Log security event
      logger.info('KYC compliance updated', {
        companyId,
        complianceType,
        status,
        complianceScore,
        issuesCount: issues.length,
        updatedBy: userId,
        userRole
      });

      return this.mapKYCCompliance(compliance);
    } catch (error) {
      logger.error('Error updating compliance status', { error, companyId, complianceType, userId, userRole });
      throw error;
    }
  }

  /**
   * Get KYC statistics
   */
  async getKYCStats(
    companyId: string, 
    userId: string, 
    userRole: string
  ): Promise<KYCStats> {
    try {
      // Authorization check
      await this.checkKYCPermissions(userId, userRole, 'read', companyId);

      const statsQuery = `
        SELECT 
          COUNT(*) as total_documents,
          COUNT(CASE WHEN status = 'VERIFIED' THEN 1 END) as verified_documents,
          COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_documents,
          COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as rejected_documents,
          COUNT(CASE WHEN status = 'EXPIRED' THEN 1 END) as expired_documents,
          AVG(EXTRACT(EPOCH FROM (verified_at - created_at)) / 3600) as avg_processing_time
        FROM kyc_documents 
        WHERE company_id = $1 AND deleted_at IS NULL
      `;

      const result = await this.db.query(statsQuery, [companyId]);
      const stats = result.rows[0];

      // Calculate verification rate
      const totalDocuments = parseInt(stats.total_documents || '0');
      const verifiedDocuments = parseInt(stats.verified_documents || '0');
      const verificationRate = totalDocuments > 0 ? (verifiedDocuments / totalDocuments) * 100 : 0;

      return {
        totalDocuments,
        verifiedDocuments,
        pendingDocuments: parseInt(stats.pending_documents || '0'),
        rejectedDocuments: parseInt(stats.rejected_documents || '0'),
        expiredDocuments: parseInt(stats.expired_documents || '0'),
        verificationRate: Math.round(verificationRate * 100) / 100,
        averageProcessingTime: parseFloat(stats.avg_processing_time || '0')
      };
    } catch (error) {
      logger.error('Error getting KYC stats', { error, companyId, userId, userRole });
      throw error;
    }
  }

  /**
   * Security and Validation Methods
   */

  private validateKYCDocumentInput(data: Partial<CreateKYCDocumentRequest>): void {
    if (!data.documentType || !Object.values(KYCDocumentType).includes(data.documentType)) {
      throw new Error('Invalid document type');
    }
    
    if (!data.documentNumber || data.documentNumber.trim().length < 2) {
      throw new Error('Document number must be at least 2 characters');
    }

    if (!data.issuingAuthority || data.issuingAuthority.trim().length < 2) {
      throw new Error('Issuing authority must be at least 2 characters');
    }

    if (!data.documentUrl || !this.isValidUrl(data.documentUrl)) {
      throw new Error('Invalid document URL');
    }

    if (data.issueDate && data.expiryDate && data.issueDate >= data.expiryDate) {
      throw new Error('Issue date must be before expiry date');
    }
  }

  private async checkKYCPermissions(userId: string, userRole: string, action: string, companyId: string): Promise<void> {
    if (userRole === 'SUPER_ADMIN') return;
    
    // For non-super admins, verify they have access to the company
    const result = await this.db.query(
      'SELECT id FROM companies WHERE id = $1 AND deleted_at IS NULL',
      [companyId]
    );

    if (result.rows.length === 0) {
      throw new Error('Company not found');
    }
  }

  private mapDocumentTypeToVerificationType(documentType: KYCDocumentType): KYCVerificationType {
    switch (documentType) {
      case KYCDocumentType.BUSINESS_REGISTRATION:
        return KYCVerificationType.BUSINESS_VERIFICATION;
      case KYCDocumentType.DIRECTOR_ID:
        return KYCVerificationType.DIRECTOR_VERIFICATION;
      case KYCDocumentType.BENEFICIAL_OWNER_ID:
        return KYCVerificationType.BENEFICIAL_OWNER_VERIFICATION;
      case KYCDocumentType.UTILITY_BILL:
      case KYCDocumentType.BANK_STATEMENT:
        return KYCVerificationType.ADDRESS_VERIFICATION;
      default:
        return KYCVerificationType.BUSINESS_VERIFICATION;
    }
  }

  private calculateComplianceScore(issues: KYCComplianceIssue[]): number {
    if (issues.length === 0) return 100;
    
    const severityWeights = {
      'LOW': 10,
      'MEDIUM': 25,
      'HIGH': 50,
      'CRITICAL': 100
    };

    const totalDeduction = issues.reduce((total, issue) => {
      return total + (severityWeights[issue.severity] || 0);
    }, 0);

    return Math.max(0, 100 - totalDeduction);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private mapKYCDocument(row: any): KYCDocument {
    return {
      id: row.id,
      companyId: row.company_id,
      documentType: row.document_type,
      documentNumber: row.document_number,
      issueDate: row.issue_date,
      expiryDate: row.expiry_date,
      issuingAuthority: row.issuing_authority,
      documentUrl: row.document_url,
      status: row.status,
      verifiedAt: row.verified_at,
      verifiedBy: row.verified_by,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at
    };
  }

  private mapKYCDocumentWithVerification(row: any): KYCDocument {
    const document = this.mapKYCDocument(row);
    return {
      ...document,
      verificationStatus: row.verification_status,
      verificationType: row.verification_type,
      transactionCount: parseInt(row.transaction_count || '0')
    };
  }

  private mapKYCVerification(row: any): KYCVerification {
    return {
      id: row.id,
      companyId: row.company_id,
      verificationType: row.verification_type,
      status: row.status,
      verificationData: row.verification_data,
      verificationResult: row.verification_result,
      verifiedAt: row.verified_at,
      verifiedBy: row.verified_by,
      rejectionReason: row.rejection_reason,
      attempts: parseInt(row.attempts || '0'),
      lastAttemptAt: row.last_attempt_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapKYCCompliance(row: any): KYCCompliance {
    return {
      id: row.id,
      companyId: row.company_id,
      complianceType: row.compliance_type,
      status: row.status,
      requirements: row.requirements || [],
      lastCheckedAt: row.last_checked_at,
      nextCheckAt: row.next_check_at,
      complianceScore: parseFloat(row.compliance_score || '0'),
      issues: row.issues || [],
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}