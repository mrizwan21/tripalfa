// @ts-ignore
import { PrismaClient } from '@prisma/client';
import { CommissionSettlement, CommissionCalculationType } from '../types';

/**
 * Commission calculation input
 */
export interface CommissionCalculationInput {
  totalAmount: number;
  bookingId: string;
  supplierId: string;
  commissionPercent?: number;
  commissionFixed?: number;
  commissionTiers?: CommissionTier[];
}

/**
 * Commission tier definition
 */
export interface CommissionTier {
  minAmount: number;
  maxAmount?: number;
  percent: number;
}

/**
 * Commission Manager Service
 *
 * Comprehensive service for managing commissions, settlements, and payments.
 * Supports percentage, fixed, and tiered commission calculations with settlement lifecycle.
 */
export class CommissionManager {
  private prisma: any;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Calculate commission
   */
  calculateCommission(input: CommissionCalculationInput): CommissionSettlement {
    let commissionAmount = 0;
    let calculationType: CommissionCalculationType = 'percentage';

    if (input.commissionTiers && input.commissionTiers.length > 0) {
      commissionAmount = this.calculateTieredCommission(input.totalAmount, input.commissionTiers);
      calculationType = 'tiered';
    } else if (input.commissionPercent !== undefined && input.commissionPercent > 0) {
      commissionAmount = (input.totalAmount * input.commissionPercent) / 100;
      calculationType = 'percentage';
    } else if (input.commissionFixed !== undefined && input.commissionFixed > 0) {
      commissionAmount = input.commissionFixed;
      calculationType = 'fixed';
    }

    return {
      id: '',
      bookingId: input.bookingId,
      supplierId: input.supplierId,
      bookingAmount: input.totalAmount,
      commissionAmount,
      calculationType,
      status: 'pending',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Create settlement record
   */
  async createSettlement(settlement: CommissionSettlement): Promise<CommissionSettlement> {
    try {
      const created = await this.prisma.commissionSettlement.create({
        data: {
          bookingId: settlement.bookingId,
          supplierId: settlement.supplierId,
          bookingAmount: settlement.bookingAmount,
          commissionAmount: settlement.commissionAmount,
          calculationType: settlement.calculationType,
          status: 'pending',
          notes: settlement.notes || '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return this.mapPrismaToSettlement(created);
    } catch (error) {
      throw new Error(`Failed to create settlement: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update settlement status
   */
  async updateSettlementStatus(id: string, status: 'pending' | 'paid' | 'cancelled'): Promise<CommissionSettlement> {
    try {
      const updated = await this.prisma.commissionSettlement.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date()
        }
      });

      return this.mapPrismaToSettlement(updated);
    } catch (error) {
      throw new Error(`Failed to update settlement status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get pending settlements for date range
   */
  async getPendingSettlements(startDate: Date, endDate: Date): Promise<CommissionSettlement[]> {
    try {
      const settlements = await this.prisma.commissionSettlement.findMany({
        where: {
          status: 'pending',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return settlements.map((s: any) => this.mapPrismaToSettlement(s));
    } catch (error) {
      throw new Error(`Failed to get pending settlements: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get pending settlements by supplier
   */
  async getPendingSettlementsBySupplier(supplierId: string): Promise<CommissionSettlement[]> {
    try {
      const settlements = await this.prisma.commissionSettlement.findMany({
        where: {
          supplierId,
          status: 'pending'
        },
        orderBy: { createdAt: 'desc' }
      });

      return settlements.map((s: any) => this.mapPrismaToSettlement(s));
    } catch (error) {
      throw new Error(`Failed to get supplier settlements: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get total pending commission for supplier
   */
  async getTotalPendingCommission(supplierId: string): Promise<number> {
    try {
      const result = await this.prisma.commissionSettlement.aggregate({
        where: {
          supplierId,
          status: 'pending'
        },
        _sum: {
          commissionAmount: true
        }
      });

      return result._sum.commissionAmount ? Number(result._sum.commissionAmount) : 0;
    } catch (error) {
      throw new Error(`Failed to calculate total pending commission: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get total pending commission for all suppliers
   */
  async getTotalPendingCommissionAll(): Promise<number> {
    try {
      const result = await this.prisma.commissionSettlement.aggregate({
        where: { status: 'pending' },
        _sum: { commissionAmount: true }
      });

      return result._sum.commissionAmount ? Number(result._sum.commissionAmount) : 0;
    } catch (error) {
      throw new Error(`Failed to calculate total pending commission: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process settlement payment
   */
  async processSettlementPayment(settlementIds: string[], paymentReference: string): Promise<number> {
    try {
      const updated = await this.prisma.commissionSettlement.updateMany({
        where: {
          id: { in: settlementIds },
          status: 'pending'
        },
        data: {
          status: 'paid',
          notes: `Paid via ${paymentReference}`,
          updatedAt: new Date()
        }
      });

      return updated.count;
    } catch (error) {
      throw new Error(`Failed to process settlement payment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process bulk payment for supplier
   */
  async processSupplierPayment(supplierId: string, paymentReference: string): Promise<number> {
    try {
      const settlements = await this.getPendingSettlementsBySupplier(supplierId);
      const ids = settlements.map(s => s.id);

      if (ids.length === 0) return 0;

      return this.processSettlementPayment(ids, paymentReference);
    } catch (error) {
      throw new Error(`Failed to process supplier payment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get settlement by ID
   */
  async getSettlement(id: string): Promise<CommissionSettlement | null> {
    try {
      const settlement = await this.prisma.commissionSettlement.findUnique({
        where: { id }
      });

      return settlement ? this.mapPrismaToSettlement(settlement) : null;
    } catch (error) {
      throw new Error(`Failed to get settlement: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get settlement by booking
   */
  async getSettlementByBooking(bookingId: string): Promise<CommissionSettlement | null> {
    try {
      const settlement = await this.prisma.commissionSettlement.findFirst({
        where: { bookingId }
      });

      return settlement ? this.mapPrismaToSettlement(settlement) : null;
    } catch (error) {
      throw new Error(`Failed to get booking settlement: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate tiered commission
   */
  private calculateTieredCommission(amount: number, tiers: CommissionTier[]): number {
    // Sort tiers by minAmount
    const sorted = [...tiers].sort((a, b) => a.minAmount - b.minAmount);

    let commission = 0;

    for (const tier of sorted) {
      if (amount <= tier.minAmount) break;

      const tierMax = tier.maxAmount || amount;
      const tierAmount = Math.min(amount, tierMax) - tier.minAmount;

      if (tierAmount > 0) {
        commission += (tierAmount * tier.percent) / 100;
      }
    }

    return commission;
  }

  /**
   * Map Prisma settlement to interface
   */
  private mapPrismaToSettlement(prismaSettlement: any): CommissionSettlement {
    return {
      id: prismaSettlement.id,
      bookingId: prismaSettlement.bookingId,
      supplierId: prismaSettlement.supplierId,
      bookingAmount: Number(prismaSettlement.bookingAmount),
      commissionAmount: Number(prismaSettlement.commissionAmount),
      calculationType: prismaSettlement.calculationType,
      status: prismaSettlement.status,
      notes: prismaSettlement.notes || '',
      createdAt: prismaSettlement.createdAt.toISOString(),
      updatedAt: prismaSettlement.updatedAt.toISOString()
    };
  }

  /**
   * Disconnect Prisma client
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
