/**
 * Airline PLB (Performance Linked Bonus) Types
 * Comprehensive type definitions for airline bonus program management
 */

export type PLBType =
  | "volume_based"
  | "revenue_based"
  | "growth_based"
  | "mixed";
export type PLBPeriodType =
  | "daily"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly";
export type PLBStatus =
  | "pending"
  | "calculated"
  | "approved"
  | "paid"
  | "disputed";
export type BookingStatus =
  | "booked"
  | "confirmed"
  | "flown"
  | "cancelled"
  | "no_show";

/**
 * PLB Program definition
 */
export interface PLBProgram {
  id: string;
  airlineId: number;
  airlineCode: string;
  name: string;
  code: string;
  plbType: PLBType;
  status: string;
  basePercentage?: number;
  validFrom: Date;
  validTo: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * PLB Program creation input
 */
export interface PLBProgramCreate {
  airlineId: number;
  airlineCode: string;
  name: string;
  code: string;
  plbType: PLBType;
  basePercentage?: number;
  validFrom: Date;
  validTo: Date;
}

/**
 * PLB Tier definition
 */
export interface PLBTier {
  id: string;
  plbProgramId: string;
  tierName: string;
  tierLevel: number;
  minBookings?: number;
  minRevenue?: number;
  minPassengers?: number;
  minGrowthPercentage?: number;
  bonusPercentage: number;
  maxBonusAmount?: number;
  createdAt?: Date;
}

/**
 * PLB Tier creation input
 */
export interface PLBTierCreate {
  tierName: string;
  tierLevel: number;
  minBookings?: number;
  minRevenue?: number;
  minPassengers?: number;
  minGrowthPercentage?: number;
  bonusPercentage: number;
  maxBonusAmount?: number;
}

/**
 * PLB Snapshot for period performance
 */
export interface PLBSnapshot {
  id: string;
  plbProgramId: string;
  airlineId: number;
  airlineCode: string;
  periodType: PLBPeriodType;
  periodStart: Date;
  periodEnd: Date;
  totalBookings: number;
  totalRevenue: number;
  totalPassengers: number;
  revenueGrowth?: number;
  calculatedBonusAmount: number;
  achievedTierName?: string;
  achievedTierLevel?: number;
  calculationStatus: PLBStatus;
  createdAt?: Date;
  approvedAt?: Date;
  paidAt?: Date;
}

/**
 * PLB Snapshot creation input
 */
export interface PLBSnapshotCreate {
  plbProgramId: string;
  airlineId: number;
  airlineCode: string;
  periodType: PLBPeriodType;
  periodStart: Date;
  periodEnd: Date;
  totalBookings: number;
  totalRevenue: number;
  totalPassengers: number;
  revenueGrowth?: number;
}

/**
 * Airline booking analytics record
 */
export interface AirlineBookingAnalytics {
  id: string;
  bookingId: string;
  airlineId: number;
  airlineCode: string;
  totalFare: number;
  baseFare: number;
  route: string;
  status: BookingStatus;
  plbProgramId?: string;
  plbEligible: boolean;
  plbEligibleAmount: number;
  bookedAt: Date;
  flownAt?: Date;
}

/**
 * PLB calculation breakdown
 */
export interface PLBCalculationBreakdown {
  plbProgramId: string;
  airlineCode: string;
  periodType: PLBPeriodType;
  periodStart: Date;
  periodEnd: Date;
  metrics: {
    totalBookings: number;
    totalRevenue: number;
    totalPassengers: number;
    averageBookingValue: number;
    revenueGrowth: number;
  };
  tierAnalysis: {
    currentTier: string;
    currentTierLevel: number;
    bonusPercentage: number;
    calculatedBonus: number;
    nextTierThreshold?: number;
    gapToNextTier?: number;
  };
  breakdown: {
    baseBonus: number;
    volumeBonus?: number;
    growthBonus?: number;
    otherBonus?: number;
    deductions?: number;
    finalBonus: number;
  };
}

/**
 * PLB dashboard overview
 */
export interface PLBDashboardOverview {
  period: PLBPeriodType;
  totalPrograms: number;
  activePrograms: number;
  totalAirlines: number;
  totalBonus: number;
  averageBonusPerAirline: number;
  topPerformers: AirlinePerformance[];
  pendingPayments: number;
  nextPaymentDate?: Date;
}

/**
 * Airline performance details
 */
export interface AirlinePerformance {
  airlineId: number;
  airlineCode: string;
  airlineName: string;
  currentTier: string;
  totalBookings: number;
  totalRevenue: number;
  calculatedBonus: number;
  percentageOfTotal: number;
  status: PLBStatus;
}

/**
 * PLB Payment record
 */
export interface PLBPayment {
  id: string;
  plbProgramId: string;
  airlineId: number;
  airlineCode: string;
  periodStart: Date;
  periodEnd: Date;
  bonusAmount: number;
  paymentReference: string;
  paymentDate: Date;
  status: "pending" | "processed" | "completed" | "failed";
  createdAt: Date;
}
