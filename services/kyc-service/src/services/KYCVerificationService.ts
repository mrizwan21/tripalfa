import { coreDb } from '../database.js';

export interface KYCSubmitData {
  userId: string;
  documentType: string;
  documentNumber: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  nationality?: string;
}

export interface KYCStatusUpdateData {
  status: 'approved' | 'rejected' | 'pending';
  rejectionReason?: string;
  reviewedBy?: string;
}

export interface KYCVerification {
  id: string;
  userId: string;
  documentType: string;
  documentNumber: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  nationality?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  rejectionReason?: string;
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
}

export interface KYCListResult {
  verifications: KYCVerification[];
  total: number;
  limit: number;
  offset: number;
}

export interface KYCStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  approvalRate: number;
  averageProcessingTimeHours: number;
}

export class KYCVerificationService {
  /**
   * Validate KYC submit data
   */
  static validateSubmitData(data: Partial<KYCSubmitData>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.userId) errors.push('userId is required');
    if (!data.documentType) errors.push('documentType is required');
    if (!data.documentNumber) errors.push('documentNumber is required');

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate KYC status update data
   */
  static validateStatusUpdateData(data: Partial<KYCStatusUpdateData>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.status) errors.push('status is required');
    if (data.status === 'rejected' && !data.rejectionReason) {
      errors.push('rejectionReason is required when status is rejected');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Submit a new KYC verification
   */
  static async submitKYC(data: KYCSubmitData): Promise<KYCVerification> {
    // Check if user already has a pending verification
    const existing = await (coreDb as any).kycVerification.findFirst({
      where: {
        userId: data.userId,
        status: { in: ['pending', 'approved'] },
      },
    });

    if (existing) {
      throw new Error(`User already has a ${existing.status} KYC verification`);
    }

    const verification = await (coreDb as any).kycVerification.create({
      data: {
        userId: data.userId,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        documentFrontUrl: data.documentFrontUrl,
        documentBackUrl: data.documentBackUrl,
        selfieUrl: data.selfieUrl,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        address: data.address,
        nationality: data.nationality,
        status: 'pending',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return verification;
  }

  /**
   * Get KYC status for a user
   */
  static async getKYCStatus(userId: string): Promise<KYCVerification | null> {
    return (coreDb as any).kycVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get KYC verification by ID
   */
  static async getKYCById(id: string): Promise<KYCVerification | null> {
    return (coreDb as any).kycVerification.findUnique({
      where: { id },
    });
  }

  /**
   * List KYC verifications with pagination
   */
  static async listKYC(
    limit: number = 20,
    offset: number = 0,
    filters?: { status?: string; userId?: string }
  ): Promise<KYCListResult> {
    const where: Record<string, unknown> = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.userId) where.userId = filters.userId;

    const [verifications, total] = await Promise.all([
      (coreDb as any).kycVerification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      (coreDb as any).kycVerification.count({ where }),
    ]);

    return {
      verifications,
      total,
      limit,
      offset,
    };
  }

  /**
   * Update KYC verification status
   */
  static async updateKYCStatus(
    id: string,
    data: KYCStatusUpdateData
  ): Promise<KYCVerification> {
    const verification = await (coreDb as any).kycVerification.update({
      where: { id },
      data: {
        status: data.status,
        rejectionReason: data.rejectionReason,
        reviewedBy: data.reviewedBy,
      },
    });

    return verification;
  }

  /**
   * Resubmit KYC after rejection
   */
  static async resubmitKYC(
    id: string,
    data: KYCSubmitData
  ): Promise<KYCVerification> {
    const verification = await (coreDb as any).kycVerification.create({
      data: {
        userId: data.userId,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        documentFrontUrl: data.documentFrontUrl,
        documentBackUrl: data.documentBackUrl,
        selfieUrl: data.selfieUrl,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        address: data.address,
        nationality: data.nationality,
        status: 'pending',
        previousVerificationId: id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return verification;
  }

  /**
   * Delete KYC verification (soft delete by expiring)
   */
  static async deleteKYC(id: string): Promise<void> {
    await (coreDb as any).kycVerification.update({
      where: { id },
      data: {
        status: 'expired',
        expiresAt: new Date(),
      },
    });
  }

  /**
   * Get KYC statistics
   */
  static async getKYCStats(): Promise<KYCStats> {
    const [total, pending, approved, rejected, expired] = await Promise.all([
      (coreDb as any).kycVerification.count(),
      (coreDb as any).kycVerification.count({ where: { status: 'pending' } }),
      (coreDb as any).kycVerification.count({ where: { status: 'approved' } }),
      (coreDb as any).kycVerification.count({ where: { status: 'rejected' } }),
      (coreDb as any).kycVerification.count({ where: { status: 'expired' } }),
    ]);

    const approvalRate = total > 0 ? (approved / total) * 100 : 0;

    return {
      total,
      pending,
      approved,
      rejected,
      expired,
      approvalRate,
      averageProcessingTimeHours: 0, // Would need more complex query
    };
  }
}

export default KYCVerificationService;