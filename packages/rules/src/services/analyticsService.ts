// @ts-ignore
import { PrismaClient } from '@prisma/client';
import {
  AnalyticsEvent,
  DealPerformance,
  DashboardOverview,
  TrendPoint,
  DealSummary,
  Period,
  PeriodType,
  EventType,
  AnalyticsSnapshot,
  ExportOptions,
  Channel,
  ProductType
} from '../types';

/**
 * Deal Analytics Service
 *
 * Comprehensive analytics engine for deal performance tracking,
 * reporting, and insights generation.
 */
export class AnalyticsService {
  private prisma: any;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Track analytics event
   */
  async trackEvent(event: AnalyticsEvent): Promise<void> {
    try {
      await this.prisma.dealAnalyticsEvents.create({
        data: {
          dealId: event.dealId || '',
          eventType: event.eventType,
          customerId: event.customerId,
          customerType: event.customerType,
          companyId: event.companyId,
          channel: event.channel,
          productType: event.productType,
          route: event.route,
          bookingClass: event.bookingClass,
          cabinClass: event.cabinClass,
          originalPrice: event.originalPrice ?? null,
          dealPrice: event.dealPrice ?? null,
          discountAmount: event.discountAmount ?? null,
          discountPercentage: event.discountPercentage ?? null,
          sessionId: event.sessionId,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
          metadata: event.metadata || {},
          createdAt: new Date()
        }
      });
    } catch (error) {
      throw new Error(`Failed to track event: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get dashboard overview
   */
  async getDashboardOverview(periodDays: number = 30): Promise<DashboardOverview> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      // Get all active deals
      const deals = await this.prisma.supplierDeals.findMany({
        where: { status: 'active' }
      });

      let totalRevenue = 0;
      let totalDiscounts = 0;
      let totalBookings = 0;
      let uniqueCustomers = new Set<string>();

      // Get events for period
      const events = await this.prisma.dealAnalyticsEvents.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      });

      // Calculate metrics
      for (const event of events) {
        if (event.eventType === 'booking') {
          totalBookings++;
          if (event.customerId) uniqueCustomers.add(event.customerId);
          if (event.dealPrice && event.originalPrice) {
            totalRevenue += Number(event.dealPrice);
            const discount = Number(event.originalPrice) - Number(event.dealPrice);
            if (discount > 0) totalDiscounts += discount;
          }
        }
      }

      // Get trend data
      const bookingsTrend = await this.getTrendData(startDate, endDate, 'booking', 'count');
      const revenueTrend = await this.getTrendData(startDate, endDate, 'booking', 'revenue');

      // Get top deals
      const topDeals = await this.getTopDeals(startDate, endDate, 5);

      // Get channel performance
      const channelPerformance = await this.getChannelPerformance(startDate, endDate);

      return {
        period: { start: startDate, end: endDate, type: 'daily' },
        totalDeals: deals.length,
        activeDeals: deals.filter((d: any) => d.status === 'active').length,
        totalRevenue,
        totalDiscounts,
        averageDiscount: totalBookings > 0 ? totalDiscounts / totalBookings : 0,
        conversionRate: events.length > 0 ? (totalBookings / events.filter((e: any) => e.eventType === 'search').length) * 100 : 0,
        uniqueCustomers: uniqueCustomers.size,
        bookingsTrend,
        revenueTrend,
        topDeals,
        channelPerformance
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard overview: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get trend data
   */
  private async getTrendData(startDate: Date, endDate: Date, eventType: EventType, metric: 'count' | 'revenue'): Promise<TrendPoint[]> {
    try {
      const events = await this.prisma.dealAnalyticsEvents.findMany({
        where: {
          eventType,
          createdAt: { gte: startDate, lte: endDate }
        }
      });

      // Group by date
      const grouped = new Map<string, AnalyticsEvent[]>();
      for (const event of events) {
        const dateStr = (event as any).createdAt.toISOString().split('T')[0];
        if (!grouped.has(dateStr)) {
          grouped.set(dateStr, []);
        }
        grouped.get(dateStr)!.push(event as any);
      }

      // Convert to trend points
      const trends: TrendPoint[] = [];
      for (const [date, dayEvents] of grouped) {
        let value = 0;
        if (metric === 'count') {
          value = dayEvents.length;
        } else {
          value = dayEvents.reduce((sum: number, e: any) => sum + (Number((e as any).dealPrice) || 0), 0);
        }
        trends.push({ date, value });
      }

      return trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } catch (error) {
      return [];
    }
  }

  /**
   * Get top deals
   */
  private async getTopDeals(startDate: Date, endDate: Date, limit: number = 10): Promise<DealSummary[]> {
    try {
      const deals = await this.prisma.supplierDeals.findMany({
        where: { status: 'active' }
      });

      const summaries: DealSummary[] = [];

      for (const deal of deals) {
        const events = await this.prisma.dealAnalyticsEvents.findMany({
          where: {
            dealId: deal.id,
            createdAt: { gte: startDate, lte: endDate }
          }
        });

        const bookings = events.filter((e: any) => e.eventType === 'booking').length;
        const searches = events.filter((e: any) => e.eventType === 'search').length;
        let revenue = 0;
        let discountGiven = 0;

        for (const event of events) {
          if (event.eventType === 'booking' && (event as any).dealPrice) {
            revenue += Number((event as any).dealPrice);
            const originalPrice = Number((event as any).originalPrice);
            const dealPrice = Number((event as any).dealPrice);
            if (originalPrice > dealPrice) {
              discountGiven += originalPrice - dealPrice;
            }
          }
        }

        const conversionRate = searches > 0 ? (bookings / searches) * 100 : 0;

        summaries.push({
          dealId: deal.id,
          dealName: deal.name,
          dealCode: deal.code,
          bookings,
          revenue,
          discountGiven,
          conversionRate,
          status: deal.status
        });
      }

      return summaries.sort((a, b) => b.revenue - a.revenue).slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  /**
   * Get channel performance
   */
  private async getChannelPerformance(startDate: Date, endDate: Date): Promise<Record<string, any>> {
    try {
      const channels: Channel[] = ['web', 'mobile', 'api', 'b2b_portal'];
      const performance: Record<string, any> = {};

      for (const channel of channels) {
        const events = await this.prisma.dealAnalyticsEvents.findMany({
          where: {
            channel,
            createdAt: { gte: startDate, lte: endDate }
          }
        });

        const bookings = events.filter((e: any) => e.eventType === 'booking').length;
        const searches = events.filter((e: any) => e.eventType === 'search').length;
        let revenue = 0;

        for (const event of events) {
          if (event.eventType === 'booking' && (event as any).dealPrice) {
            revenue += Number((event as any).dealPrice);
          }
        }

        performance[channel] = {
          bookings,
          revenue,
          searches,
          conversionRate: searches > 0 ? (bookings / searches) * 100 : 0
        };
      }

      return performance;
    } catch (error) {
      return {};
    }
  }

  /**
   * Get deal performance
   */
  async getDealPerformance(dealId: string, period: Period): Promise<DealPerformance | null> {
    try {
      const deal = await this.prisma.supplierDeals.findUnique({
        where: { id: dealId }
      });

      if (!deal) return null;

      const events = await this.prisma.dealAnalyticsEvents.findMany({
        where: {
          dealId,
          createdAt: { gte: period.start, lte: period.end }
        }
      });

      let totalRevenue = 0;
      let totalDiscountGiven = 0;
      const uniqueCustomers = new Set<string>();
      let b2cBookings = 0;
      let b2bBookings = 0;

      const metrics = {
        totalBookings: events.filter((e: any) => e.eventType === 'booking').length,
        totalSearches: events.filter((e: any) => e.eventType === 'search').length,
        totalViews: events.filter((e: any) => e.eventType === 'view').length,
        totalApplications: events.filter((e: any) => e.eventType === 'apply').length,
        totalCancellations: events.filter((e: any) => e.eventType === 'cancellation').length,
        conversionRate: 0,
        totalRevenue: 0,
        totalDiscountGiven: 0,
        totalCommissionEarned: 0,
        averageBookingValue: 0,
        averageDiscountAmount: 0,
        roiPercentage: 0,
        uniqueCustomers: 0,
        b2cBookings: 0,
        b2bBookings: 0
      };

      for (const event of events) {
        if (event.customerId) uniqueCustomers.add(event.customerId);
        if (event.eventType === 'booking') {
          if ((event as any).dealPrice) totalRevenue += Number((event as any).dealPrice);
          if ((event as any).originalPrice && (event as any).dealPrice) {
            const discount = Number((event as any).originalPrice) - Number((event as any).dealPrice);
            totalDiscountGiven += Math.max(0, discount);
          }
          if (event.customerType === 'b2c') b2cBookings++;
          if (event.customerType === 'b2b') b2bBookings++;
        }
      }

      metrics.conversionRate = metrics.totalSearches > 0 ? (metrics.totalBookings / metrics.totalSearches) * 100 : 0;
      metrics.totalRevenue = totalRevenue;
      metrics.totalDiscountGiven = totalDiscountGiven;
      metrics.averageBookingValue = metrics.totalBookings > 0 ? totalRevenue / metrics.totalBookings : 0;
      metrics.averageDiscountAmount = metrics.totalBookings > 0 ? totalDiscountGiven / metrics.totalBookings : 0;
      metrics.roiPercentage = metrics.totalRevenue > 0 ? ((metrics.totalRevenue - metrics.totalDiscountGiven) / metrics.totalDiscountGiven) * 100 : 0;
      metrics.uniqueCustomers = uniqueCustomers.size;
      metrics.b2cBookings = b2cBookings;
      metrics.b2bBookings = b2bBookings;

      return {
        dealId,
        dealName: deal.name,
        dealCode: deal.code,
        period,
        metrics,
        channelBreakdown: await this.getChannelMetricsForDeal(dealId, period),
        topRoutes: await this.getTopRoutesForDeal(dealId, period),
        segmentBreakdown: {},
        topCompanies: []
      };
    } catch (error) {
      throw new Error(`Failed to get deal performance: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get channel metrics for deal
   */
  private async getChannelMetricsForDeal(dealId: string, period: Period): Promise<Record<string, any>> {
    try {
      const channels: Channel[] = ['web', 'mobile', 'api', 'b2b_portal'];
      const metrics: Record<string, any> = {};

      for (const channel of channels) {
        const events = await this.prisma.dealAnalyticsEvents.findMany({
          where: {
            dealId,
            channel,
            createdAt: { gte: period.start, lte: period.end }
          }
        });

        const bookings = events.filter((e: any) => e.eventType === 'booking').length;
        const searches = events.filter((e: any) => e.eventType === 'search').length;
        let revenue = 0;

        for (const event of events) {
          if (event.eventType === 'booking' && (event as any).dealPrice) {
            revenue += Number((event as any).dealPrice);
          }
        }

        metrics[channel] = {
          bookings,
          revenue,
          searches,
          conversionRate: searches > 0 ? (bookings / searches) * 100 : 0
        };
      }

      return metrics;
    } catch (error) {
      return {};
    }
  }

  /**
   * Get top routes for deal
   */
  private async getTopRoutesForDeal(dealId: string, period: Period, limit: number = 5): Promise<any[]> {
    try {
      const events = await this.prisma.dealAnalyticsEvents.findMany({
        where: {
          dealId,
          createdAt: { gte: period.start, lte: period.end }
        }
      });

      const routeMetrics = new Map<string, any>();

      for (const event of events) {
        const route = (event as any).route || 'unknown';
        if (!routeMetrics.has(route)) {
          routeMetrics.set(route, {
            route,
            bookings: 0,
            revenue: 0,
            searches: 0,
            conversionRate: 0
          });
        }

        const metrics = routeMetrics.get(route);
        if (event.eventType === 'booking') {
          metrics.bookings++;
          if ((event as any).dealPrice) metrics.revenue += Number((event as any).dealPrice);
        } else if (event.eventType === 'search') {
          metrics.searches++;
        }
      }

      // Update conversion rates
      for (const metrics of routeMetrics.values()) {
        metrics.conversionRate = metrics.searches > 0 ? (metrics.bookings / metrics.searches) * 100 : 0;
      }

      return Array.from(routeMetrics.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate daily snapshot
   */
  async generateDailySnapshot(dealId: string, date: Date): Promise<AnalyticsSnapshot> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const performance = await this.getDealPerformance(dealId, {
        start: startOfDay,
        end: endOfDay,
        type: 'daily'
      });

      if (!performance) {
        throw new Error(`Deal ${dealId} not found`);
      }

      const snapshot = await this.prisma.analyticsSnapshot.create({
        data: {
          dealId,
          periodStart: startOfDay,
          periodEnd: endOfDay,
          periodType: 'daily',
          metrics: performance.metrics as any,
          createdAt: new Date(),
          calculatedAt: new Date()
        }
      });

      return {
        id: snapshot.id,
        dealId: snapshot.dealId,
        periodStart: snapshot.periodStart,
        periodEnd: snapshot.periodEnd,
        periodType: snapshot.periodType as PeriodType,
        metrics: snapshot.metrics as any,
        createdAt: snapshot.createdAt,
        calculatedAt: snapshot.calculatedAt
      };
    } catch (error) {
      throw new Error(`Failed to generate daily snapshot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get active deals
   */
  async getActiveDeals(): Promise<any[]> {
    try {
      return await this.prisma.supplierDeals.findMany({
        where: { status: 'active' }
      });
    } catch (error) {
      throw new Error(`Failed to get active deals: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Disconnect Prisma
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
