// @ts-ignore
import { PrismaClient } from '@prisma/client';
import {
  PLBProgram,
  PLBProgramCreate,
  PLBTier,
  PLBTierCreate,
  PLBSnapshot,
  PLBSnapshotCreate,
  AirlineBookingAnalytics,
  PLBCalculationBreakdown,
  PLBDashboardOverview,
  AirlinePerformance,
  PLBStatus,
  PLBPeriodType,
  BookingStatus
} from '../types';

/**
 * Airline PLB (Performance Linked Bonus) Service
 *
 * Manages PLB programs, calculations, tier matching, and payment processing
 * for airline performance-based bonus structures.
 */
export class PLBService {
  private prisma: any;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get PLB Programs
   */
  async getPLBPrograms(airlineId?: number): Promise<PLBProgram[]> {
    try {
      const where = airlineId ? { airlineId } : {};
      const programs = await this.prisma.airlinePLBPrograms.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      return programs as PLBProgram[];
    } catch (error) {
      throw new Error(`Failed to get PLB programs: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create PLB Program
   */
  async createPLBProgram(data: PLBProgramCreate): Promise<PLBProgram> {
    try {
      const program = await this.prisma.airlinePLBPrograms.create({
        data: {
          airlineId: data.airlineId,
          airlineCode: data.airlineCode,
          name: data.name,
          code: data.code,
          plbType: data.plbType,
          status: 'active',
          basePercentage: data.basePercentage ?? null,
          validFrom: data.validFrom,
          validTo: data.validTo,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      return program as PLBProgram;
    } catch (error) {
      throw new Error(`Failed to create PLB program: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get PLB Tiers
   */
  async getPLBTiers(programId: string): Promise<PLBTier[]> {
    try {
      const tiers = await this.prisma.airlinePLBTiers.findMany({
        where: { plbProgramId: programId },
        orderBy: { tierLevel: 'asc' }
      });

      return tiers as PLBTier[];
    } catch (error) {
      throw new Error(`Failed to get PLB tiers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Add PLB Tier
   */
  async addPLBTier(programId: string, data: PLBTierCreate): Promise<PLBTier> {
    try {
      const tier = await this.prisma.airlinePLBTiers.create({
        data: {
          plbProgramId: programId,
          tierName: data.tierName,
          tierLevel: data.tierLevel,
          minBookings: data.minBookings,
          minRevenue: data.minRevenue ?? null,
          minPassengers: data.minPassengers,
          minGrowthPercentage: data.minGrowthPercentage ?? null,
          bonusPercentage: data.bonusPercentage,
          maxBonusAmount: data.maxBonusAmount ?? null,
          createdAt: new Date()
        }
      });

      return tier as PLBTier;
    } catch (error) {
      throw new Error(`Failed to add PLB tier: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Track booking for PLB
   */
  async trackBooking(bookingData: {
    bookingId: string;
    airlineId: number;
    airlineCode: string;
    totalFare: number;
    baseFare: number;
    route: string;
    status: BookingStatus;
  }): Promise<void> {
    try {
      // Find active PLB program
      const program = await this.prisma.airlinePLBPrograms.findFirst({
        where: {
          airlineId: bookingData.airlineId,
          status: 'active',
          validFrom: { lte: new Date() },
          validTo: { gte: new Date() }
        }
      });

      await this.prisma.airlineBookingAnalytics.create({
        data: {
          bookingId: bookingData.bookingId,
          airlineId: bookingData.airlineId,
          airlineCode: bookingData.airlineCode,
          totalFare: bookingData.totalFare,
          baseFare: bookingData.baseFare,
          route: bookingData.route,
          status: bookingData.status,
          plbProgramId: program?.id,
          plbEligible: !!program,
          plbEligibleAmount: program ? bookingData.baseFare : 0,
          bookedAt: new Date()
        }
      });
    } catch (error) {
      throw new Error(`Failed to track booking: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Generate PLB snapshot
   */
  async generateSnapshot(data: PLBSnapshotCreate): Promise<PLBSnapshot> {
    try {
      // Get bookings for period
      const bookings = await this.prisma.airlineBookingAnalytics.findMany({
        where: {
          airlineId: data.airlineId,
          plbProgramId: data.plbProgramId,
          bookedAt: { gte: data.periodStart, lte: data.periodEnd },
          status: { in: ['booked', 'confirmed', 'flown'] }
        }
      });

      // Get program and tiers
      const program = await this.prisma.airlinePLBPrograms.findUnique({
        where: { id: data.plbProgramId }
      });

      const tiers = await this.getPLBTiers(data.plbProgramId);

      // Calculate metrics
      const totalBookings = bookings.length;
      const totalRevenue = bookings.reduce((sum: number, b: any) => sum + (b.totalFare?.toNumber() || 0), 0);
      const totalPassengers = totalBookings;
      const revenueGrowth = data.revenueGrowth || 0;

      // Find applicable tier
      const applicableTier = tiers.find(t => {
        let matches = true;
        if (t.minBookings && totalBookings < t.minBookings) matches = false;
        if (t.minRevenue && totalRevenue < Number(t.minRevenue)) matches = false;
        if (t.minPassengers && totalPassengers < t.minPassengers) matches = false;
        if (t.minGrowthPercentage && revenueGrowth < Number(t.minGrowthPercentage)) matches = false;
        return matches;
      });

      // Calculate bonus
      const bonusPercent = applicableTier ? Number(applicableTier.bonusPercentage) : 0;
      let calculatedBonus = (totalRevenue * bonusPercent) / 100;
      if (applicableTier?.maxBonusAmount) {
        calculatedBonus = Math.min(calculatedBonus, Number(applicableTier.maxBonusAmount));
      }

      const snapshot = await this.prisma.airlinePLBSnapshots.create({
        data: {
          plbProgramId: data.plbProgramId,
          airlineId: data.airlineId,
          airlineCode: data.airlineCode,
          periodType: data.periodType,
          periodStart: data.periodStart,
          periodEnd: data.periodEnd,
          totalBookings,
          totalRevenue,
          totalPassengers,
          revenueGrowth,
          calculatedBonusAmount: calculatedBonus,
          achievedTierName: applicableTier?.tierName,
          achievedTierLevel: applicableTier?.tierLevel,
          calculationStatus: 'calculated' as PLBStatus,
          createdAt: new Date()
        }
      });

      return {
        id: snapshot.id,
        plbProgramId: snapshot.plbProgramId,
        airlineId: snapshot.airlineId,
        airlineCode: snapshot.airlineCode,
        periodType: snapshot.periodType as PLBPeriodType,
        periodStart: snapshot.periodStart,
        periodEnd: snapshot.periodEnd,
        totalBookings: snapshot.totalBookings,
        totalRevenue: Number(snapshot.totalRevenue),
        totalPassengers: snapshot.totalPassengers,
        revenueGrowth: snapshot.revenueGrowth ? Number(snapshot.revenueGrowth) : undefined,
        calculatedBonusAmount: Number(snapshot.calculatedBonusAmount),
        achievedTierName: snapshot.achievedTierName || undefined,
        achievedTierLevel: snapshot.achievedTierLevel || undefined,
        calculationStatus: snapshot.calculationStatus as PLBStatus,
        createdAt: snapshot.createdAt
      };
    } catch (error) {
      throw new Error(`Failed to generate snapshot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get airline performance
   */
  async getAirlinePerformance(airlineId: number, periodDays: number = 30): Promise<AirlinePerformance | null> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      const program = await this.prisma.airlinePLBPrograms.findFirst({
        where: { airlineId, status: 'active' }
      });

      if (!program) return null;

      const bookings = await this.prisma.airlineBookingAnalytics.findMany({
        where: {
          airlineId,
          plbProgramId: program.id,
          bookedAt: { gte: startDate, lte: endDate },
          status: { in: ['booked', 'confirmed', 'flown'] }
        }
      });

      const totalBookings = bookings.length;
      const totalRevenue = bookings.reduce((sum: number, b: any) => sum + (b.totalFare?.toNumber() || 0), 0);

      // Get latest snapshot to find achieved tier
      const latestSnapshot = await this.prisma.airlinePLBSnapshots.findFirst({
        where: { plbProgramId: program.id, airlineId },
        orderBy: { createdAt: 'desc' }
      });

      return {
        airlineId,
        airlineCode: program.airlineCode,
        airlineName: program.airlineCode,
        currentTier: latestSnapshot?.achievedTierName || 'Bronze',
        totalBookings,
        totalRevenue,
        calculatedBonus: Number(latestSnapshot?.calculatedBonusAmount || 0),
        percentageOfTotal: 0,
        status: (latestSnapshot?.calculationStatus || 'pending') as PLBStatus
      };
    } catch (error) {
      throw new Error(`Failed to get airline performance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get PLB dashboard overview
   */
  async getDashboardOverview(periodType: PLBPeriodType = 'monthly'): Promise<PLBDashboardOverview> {
    try {
      const programs = await this.prisma.airlinePLBPrograms.findMany({
        where: { status: 'active' }
      });

      const snapshots = await this.prisma.airlinePLBSnapshots.findMany({
        where: { calculationStatus: 'calculated' },
        orderBy: { createdAt: 'desc' },
        take: programs.length
      });

      let totalBonus = 0;
      const topPerformers: AirlinePerformance[] = [];

      for (const snapshot of snapshots) {
        totalBonus += Number(snapshot.calculatedBonusAmount);
        const perf = await this.getAirlinePerformance(snapshot.airlineId);
        if (perf) {
          topPerformers.push(perf);
        }
      }

      topPerformers.sort((a, b) => b.calculatedBonus - a.calculatedBonus);

      return {
        period: periodType,
        totalPrograms: programs.length,
        activePrograms: programs.filter((p: PLBProgram) => p.status === 'active').length,
        totalAirlines: new Set(programs.map((p: PLBProgram) => p.airlineId)).size,
        totalBonus,
        averageBonusPerAirline: programs.length > 0 ? totalBonus / programs.length : 0,
        topPerformers: topPerformers.slice(0, 5),
        pendingPayments: snapshots.filter((s: PLBSnapshot) => s.calculationStatus === 'approved').length
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard overview: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate PLB breakdown
   */
  async calculatePLBBreakdown(
    programId: string,
    airlineId: number,
    periodStart: Date,
    periodEnd: Date,
    periodType: PLBPeriodType
  ): Promise<PLBCalculationBreakdown> {
    try {
      const bookings = await this.prisma.airlineBookingAnalytics.findMany({
        where: {
          plbProgramId: programId,
          airlineId,
          bookedAt: { gte: periodStart, lte: periodEnd },
          status: { in: ['booked', 'confirmed', 'flown'] }
        }
      });

      const program = await this.prisma.airlinePLBPrograms.findUnique({
        where: { id: programId }
      });

      const tiers = await this.getPLBTiers(programId);

      const totalBookings = bookings.length;
      const totalRevenue = bookings.reduce((sum: number, b: any) => sum + (b.totalFare?.toNumber() || 0), 0);
      const totalPassengers = totalBookings;
      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      const applicableTier = tiers.find(t => totalBookings >= (t.minBookings || 0));

      const baseBonus = (totalRevenue * Number(program?.basePercentage || 0)) / 100;
      const bonusPercentage = applicableTier ? Number(applicableTier.bonusPercentage) : 0;
      const finalBonus = (totalRevenue * bonusPercentage) / 100;

      return {
        plbProgramId: programId,
        airlineCode: program?.airlineCode || '',
        periodType,
        periodStart,
        periodEnd,
        metrics: {
          totalBookings,
          totalRevenue,
          totalPassengers,
          averageBookingValue,
          revenueGrowth: 0
        },
        tierAnalysis: {
          currentTier: applicableTier?.tierName || 'Entry',
          currentTierLevel: applicableTier?.tierLevel || 1,
          bonusPercentage,
          calculatedBonus: finalBonus,
          nextTierThreshold: undefined,
          gapToNextTier: undefined
        },
        breakdown: {
          baseBonus,
          finalBonus,
          deductions: 0
        }
      };
    } catch (error) {
      throw new Error(`Failed to calculate PLB breakdown: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Approve PLB snapshot
   */
  async approvePLBSnapshot(snapshotId: string): Promise<PLBSnapshot> {
    try {
      const snapshot = await this.prisma.airlinePLBSnapshots.update({
        where: { id: snapshotId },
        data: {
          calculationStatus: 'approved',
          approvedAt: new Date()
        }
      });

      return {
        id: snapshot.id,
        plbProgramId: snapshot.plbProgramId,
        airlineId: snapshot.airlineId,
        airlineCode: snapshot.airlineCode,
        periodType: snapshot.periodType as PLBPeriodType,
        periodStart: snapshot.periodStart,
        periodEnd: snapshot.periodEnd,
        totalBookings: snapshot.totalBookings,
        totalRevenue: Number(snapshot.totalRevenue),
        totalPassengers: snapshot.totalPassengers,
        calculatedBonusAmount: Number(snapshot.calculatedBonusAmount),
        achievedTierName: snapshot.achievedTierName || undefined,
        calculationStatus: snapshot.calculationStatus as PLBStatus,
        approvedAt: snapshot.approvedAt || undefined
      };
    } catch (error) {
      throw new Error(`Failed to approve PLB snapshot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Process PLB payment
   */
  async processPLBPayment(snapshotId: string, paymentReference: string): Promise<PLBSnapshot> {
    try {
      const snapshot = await this.prisma.airlinePLBSnapshots.update({
        where: { id: snapshotId },
        data: {
          calculationStatus: 'paid',
          paidAt: new Date()
        }
      });

      return {
        id: snapshot.id,
        plbProgramId: snapshot.plbProgramId,
        airlineId: snapshot.airlineId,
        airlineCode: snapshot.airlineCode,
        periodType: snapshot.periodType as PLBPeriodType,
        periodStart: snapshot.periodStart,
        periodEnd: snapshot.periodEnd,
        totalBookings: snapshot.totalBookings,
        totalRevenue: Number(snapshot.totalRevenue),
        totalPassengers: snapshot.totalPassengers,
        calculatedBonusAmount: Number(snapshot.calculatedBonusAmount),
        calculationStatus: snapshot.calculationStatus as PLBStatus,
        paidAt: snapshot.paidAt || undefined
      };
    } catch (error) {
      throw new Error(`Failed to process PLB payment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Disconnect Prisma
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
