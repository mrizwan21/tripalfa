/**
 * Deal Analytics Types
 * Comprehensive type definitions for deal performance analytics and reporting
 */

export type PeriodType = "daily" | "weekly" | "monthly" | "yearly";
export type EventType =
  | "search"
  | "view"
  | "apply"
  | "booking"
  | "cancellation"
  | "rejection";
export type CustomerType = "b2c" | "b2b";
export type Channel = "web" | "mobile" | "api" | "b2b_portal";
export type ProductType = "flight" | "hotel";

/**
 * Period definition for analytics queries
 */
export interface Period {
  start: Date;
  end: Date;
  type: PeriodType;
}

/**
 * Analytics event from customer interactions
 */
export interface AnalyticsEvent {
  dealId?: string;
  eventType: EventType;
  customerId?: string;
  customerType?: CustomerType;
  companyId?: string;
  channel?: Channel;
  productType?: ProductType;
  route?: string;
  bookingClass?: string;
  cabinClass?: string;
  originalPrice?: number;
  dealPrice?: number;
  discountAmount?: number;
  discountPercentage?: number;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Deal performance metrics
 */
export interface DealPerformance {
  dealId: string;
  dealName: string;
  dealCode: string;
  period: Period;
  metrics: {
    totalBookings: number;
    totalSearches: number;
    totalViews: number;
    totalApplications: number;
    totalCancellations: number;
    conversionRate: number;
    totalRevenue: number;
    totalDiscountGiven: number;
    totalCommissionEarned: number;
    averageBookingValue: number;
    averageDiscountAmount: number;
    roiPercentage: number;
    uniqueCustomers: number;
    b2cBookings: number;
    b2bBookings: number;
  };
  channelBreakdown: Record<string, ChannelMetrics>;
  topRoutes: RouteMetrics[];
  segmentBreakdown: Record<string, SegmentMetrics>;
  topCompanies: CompanyMetrics[];
}

/**
 * Channel-specific metrics
 */
export interface ChannelMetrics {
  bookings: number;
  revenue: number;
  searches: number;
  conversionRate: number;
}

/**
 * Route-specific metrics
 */
export interface RouteMetrics {
  route: string;
  bookings: number;
  revenue: number;
  searches: number;
  conversionRate: number;
}

/**
 * Segment-specific metrics
 */
export interface SegmentMetrics {
  bookings: number;
  revenue: number;
}

/**
 * Company-specific metrics
 */
export interface CompanyMetrics {
  companyId: string;
  name: string;
  bookings: number;
  revenue: number;
  discountUtilization: number;
}

/**
 * Dashboard overview
 */
export interface DashboardOverview {
  period: Period;
  totalDeals: number;
  activeDeals: number;
  totalRevenue: number;
  totalDiscounts: number;
  averageDiscount: number;
  conversionRate: number;
  uniqueCustomers: number;
  bookingsTrend: TrendPoint[];
  revenueTrend: TrendPoint[];
  topDeals: DealSummary[];
  channelPerformance: Record<string, ChannelMetrics>;
}

/**
 * Trend data point
 */
export interface TrendPoint {
  date: string;
  value: number;
  change?: number;
  changePercent?: number;
}

/**
 * Deal summary
 */
export interface DealSummary {
  dealId: string;
  dealName: string;
  dealCode: string;
  bookings: number;
  revenue: number;
  discountGiven: number;
  conversionRate: number;
  status: string;
}

/**
 * Analytics snapshot
 */
export interface AnalyticsSnapshot {
  id: string;
  dealId: string;
  periodStart: Date;
  periodEnd: Date;
  periodType: PeriodType;
  metrics: DealPerformance["metrics"];
  createdAt: Date;
  calculatedAt: Date;
}

/**
 * Export options
 */
export interface ExportOptions {
  format: "csv" | "json" | "xlsx";
  includeDetails: boolean;
  includeTrends: boolean;
  includeComparison: boolean;
}

/**
 * Alert definition
 */
export interface AnalyticsAlert {
  id: string;
  dealId: string;
  type:
    | "low_conversion"
    | "low_revenue"
    | "high_cancellations"
    | "underutilized_discount";
  threshold: number;
  severity: "low" | "medium" | "high";
  isActive: boolean;
  createdAt: Date;
}
