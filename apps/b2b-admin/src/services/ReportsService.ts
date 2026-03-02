import axios from "axios";

// Types for Reports
export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface B2BCompanyReport {
  companyId: string;
  companyName: string;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  commissionEarned: number;
  pendingPayments: number;
  lastBookingDate: string | null;
}

export interface B2CCustomerReport {
  customerId: string;
  customerEmail: string;
  customerName: string;
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  averageBookingValue: number;
  customerLifetimeValue: number;
  firstBookingDate: string | null;
  lastBookingDate: string | null;
}

export interface BookingTrend {
  date: string;
  bookings: number;
  revenue: number;
  cancellations: number;
}

export interface FinancialSummary {
  totalRevenue: number;
  pendingPayments: number;
  refundsIssued: number;
  netRevenue: number;
  currency: string;
}

export interface ServiceBreakdown {
  serviceType: string;
  count: number;
  percentage: number;
  revenue: number;
}

export interface TopDestination {
  destination: string;
  country: string;
  bookings: number;
  revenue: number;
}

// API Base URL
const API_BASE_URL = "/api/v1";
const ENABLE_MOCK_REPORTS_FALLBACK =
  import.meta.env.DEV &&
  import.meta.env.VITE_ENABLE_B2B_ADMIN_MOCK_FALLBACK === "true";

class ReportsService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  private handleReportsError(error: unknown, context: string): never {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${context}: ${message}`);
  }

  /**
   * Get B2B Company Reports
   */
  async getB2BReports(dateRange?: DateRange): Promise<B2BCompanyReport[]> {
    try {
      const params = dateRange
        ? {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          }
        : {};
      const response = await this.api.get<B2BCompanyReport[]>("/reports/b2b", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching B2B reports:", error);
      if (ENABLE_MOCK_REPORTS_FALLBACK) {
        return this.getMockB2BReports();
      }
      this.handleReportsError(error, "Failed to fetch B2B reports");
    }
  }

  /**
   * Get B2C Customer Reports
   */
  async getB2CReports(dateRange?: DateRange): Promise<B2CCustomerReport[]> {
    try {
      const params = dateRange
        ? {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          }
        : {};
      const response = await this.api.get<B2CCustomerReport[]>("/reports/b2c", {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching B2C reports:", error);
      if (ENABLE_MOCK_REPORTS_FALLBACK) {
        return this.getMockB2CReports();
      }
      this.handleReportsError(error, "Failed to fetch B2C reports");
    }
  }

  /**
   * Get Booking Trends
   */
  async getBookingTrends(dateRange: DateRange): Promise<BookingTrend[]> {
    try {
      const response = await this.api.post<BookingTrend[]>(
        "/reports/booking-trends",
        dateRange,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching booking trends:", error);
      if (ENABLE_MOCK_REPORTS_FALLBACK) {
        return this.getMockBookingTrends();
      }
      this.handleReportsError(error, "Failed to fetch booking trends");
    }
  }

  /**
   * Get Financial Summary
   */
  async getFinancialSummary(dateRange?: DateRange): Promise<FinancialSummary> {
    try {
      const params = dateRange
        ? {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          }
        : {};
      const response = await this.api.get<FinancialSummary>(
        "/reports/financial-summary",
        { params },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching financial summary:", error);
      if (ENABLE_MOCK_REPORTS_FALLBACK) {
        return this.getMockFinancialSummary();
      }
      this.handleReportsError(error, "Failed to fetch financial summary");
    }
  }

  /**
   * Get Service Breakdown (Flights vs Hotels)
   */
  async getServiceBreakdown(
    dateRange?: DateRange,
  ): Promise<ServiceBreakdown[]> {
    try {
      const params = dateRange
        ? {
            startDate: dateRange.startDate,
            endDate: dateRange.endDate,
          }
        : {};
      const response = await this.api.get<ServiceBreakdown[]>(
        "/reports/service-breakdown",
        { params },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching service breakdown:", error);
      if (ENABLE_MOCK_REPORTS_FALLBACK) {
        return this.getMockServiceBreakdown();
      }
      this.handleReportsError(error, "Failed to fetch service breakdown");
    }
  }

  /**
   * Get Top Destinations
   */
  async getTopDestinations(
    limit: number = 10,
    dateRange?: DateRange,
  ): Promise<TopDestination[]> {
    try {
      const params = { limit, ...dateRange };
      const response = await this.api.get<TopDestination[]>(
        "/reports/top-destinations",
        { params },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching top destinations:", error);
      if (ENABLE_MOCK_REPORTS_FALLBACK) {
        return this.getMockTopDestinations();
      }
      this.handleReportsError(error, "Failed to fetch top destinations");
    }
  }

  /**
   * Export Report to CSV
   */
  async exportToCSV(reportType: string, dateRange?: DateRange): Promise<Blob> {
    const params = dateRange
      ? {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }
      : {};
    const response = await this.api.get(`/reports/export/${reportType}`, {
      params,
      responseType: "blob",
    });
    return response.data;
  }

  /**
   * Get Customer Analytics Summary
   */
  async getCustomerAnalytics(dateRange?: DateRange) {
    const params = dateRange
      ? {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        }
      : {};

    try {
      const response = await this.api.get("/reports/customer-analytics", {
        params,
      });
      return response.data;
    } catch (error) {
      if (ENABLE_MOCK_REPORTS_FALLBACK) {
        return {
          totalCustomers: 1250,
          newCustomers: 345,
          returningCustomers: 905,
          averageCustomerValue: 2500,
          bookingFrequency: 3.2,
        };
      }
      this.handleReportsError(error, "Failed to fetch customer analytics");
    }
  }

  // Mock data generators
  private getMockB2BReports(): B2BCompanyReport[] {
    return [
      {
        companyId: "1",
        companyName: "Global Travel Agency",
        totalBookings: 156,
        confirmedBookings: 142,
        pendingBookings: 8,
        cancelledBookings: 6,
        totalRevenue: 285000,
        averageBookingValue: 1826.92,
        commissionEarned: 28500,
        pendingPayments: 15000,
        lastBookingDate: "2026-02-15",
      },
      {
        companyId: "2",
        companyName: "Corporate Solutions Ltd",
        totalBookings: 89,
        confirmedBookings: 82,
        pendingBookings: 5,
        cancelledBookings: 2,
        totalRevenue: 178500,
        averageBookingValue: 2005.62,
        commissionEarned: 17850,
        pendingPayments: 8500,
        lastBookingDate: "2026-02-14",
      },
      {
        companyId: "3",
        companyName: "Adventure Tours Co",
        totalBookings: 67,
        confirmedBookings: 61,
        pendingBookings: 4,
        cancelledBookings: 2,
        totalRevenue: 124800,
        averageBookingValue: 1862.69,
        commissionEarned: 12480,
        pendingPayments: 6200,
        lastBookingDate: "2026-02-13",
      },
      {
        companyId: "4",
        companyName: "Luxury Escapes",
        totalBookings: 45,
        confirmedBookings: 42,
        pendingBookings: 2,
        cancelledBookings: 1,
        totalRevenue: 156750,
        averageBookingValue: 3483.33,
        commissionEarned: 15675,
        pendingPayments: 0,
        lastBookingDate: "2026-02-10",
      },
      {
        companyId: "5",
        companyName: "Budget Travelers Inc",
        totalBookings: 234,
        confirmedBookings: 215,
        pendingBookings: 12,
        cancelledBookings: 7,
        totalRevenue: 156000,
        averageBookingValue: 666.67,
        commissionEarned: 15600,
        pendingPayments: 12000,
        lastBookingDate: "2026-02-15",
      },
    ];
  }

  private getMockB2CReports(): B2CCustomerReport[] {
    return [
      {
        customerId: "1",
        customerEmail: "john.doe@email.com",
        customerName: "John Doe",
        totalBookings: 12,
        confirmedBookings: 11,
        pendingBookings: 1,
        cancelledBookings: 0,
        totalSpent: 24500,
        averageBookingValue: 2041.67,
        customerLifetimeValue: 24500,
        firstBookingDate: "2025-03-15",
        lastBookingDate: "2026-02-10",
      },
      {
        customerId: "2",
        customerEmail: "sarah.smith@email.com",
        customerName: "Sarah Smith",
        totalBookings: 8,
        confirmedBookings: 7,
        pendingBookings: 0,
        cancelledBookings: 1,
        totalSpent: 18200,
        averageBookingValue: 2275,
        customerLifetimeValue: 18200,
        firstBookingDate: "2025-06-20",
        lastBookingDate: "2026-01-28",
      },
      {
        customerId: "3",
        customerEmail: "mike.johnson@email.com",
        customerName: "Mike Johnson",
        totalBookings: 5,
        confirmedBookings: 5,
        pendingBookings: 0,
        cancelledBookings: 0,
        totalSpent: 8900,
        averageBookingValue: 1780,
        customerLifetimeValue: 8900,
        firstBookingDate: "2025-09-10",
        lastBookingDate: "2026-02-05",
      },
      {
        customerId: "4",
        customerEmail: "emma.wilson@email.com",
        customerName: "Emma Wilson",
        totalBookings: 15,
        confirmedBookings: 14,
        pendingBookings: 1,
        cancelledBookings: 0,
        totalSpent: 32000,
        averageBookingValue: 2133.33,
        customerLifetimeValue: 32000,
        firstBookingDate: "2024-11-05",
        lastBookingDate: "2026-02-14",
      },
      {
        customerId: "5",
        customerEmail: "david.brown@email.com",
        customerName: "David Brown",
        totalBookings: 3,
        confirmedBookings: 2,
        pendingBookings: 1,
        cancelledBookings: 0,
        totalSpent: 4500,
        averageBookingValue: 1500,
        customerLifetimeValue: 4500,
        firstBookingDate: "2026-01-15",
        lastBookingDate: "2026-02-12",
      },
    ];
  }

  private getMockBookingTrends(): BookingTrend[] {
    const trends: BookingTrend[] = [];
    const today = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const baseBookings = 15 + Math.floor(Math.random() * 20);
      const cancellationRate = 0.08;

      trends.push({
        date: date.toISOString().split("T")[0],
        bookings: baseBookings,
        revenue: baseBookings * (1500 + Math.random() * 1000),
        cancellations: Math.floor(baseBookings * cancellationRate),
      });
    }

    return trends;
  }

  private getMockFinancialSummary(): FinancialSummary {
    return {
      totalRevenue: 1245650,
      pendingPayments: 85000,
      refundsIssued: 32500,
      netRevenue: 1131150,
      currency: "USD",
    };
  }

  private getMockServiceBreakdown(): ServiceBreakdown[] {
    return [
      { serviceType: "Flight", count: 1250, percentage: 65, revenue: 875000 },
      { serviceType: "Hotel", count: 520, percentage: 27, revenue: 312000 },
      {
        serviceType: "Flight + Hotel",
        count: 145,
        percentage: 8,
        revenue: 58500,
      },
    ];
  }

  private getMockTopDestinations(): TopDestination[] {
    return [
      { destination: "Dubai", country: "UAE", bookings: 245, revenue: 185000 },
      { destination: "London", country: "UK", bookings: 198, revenue: 156000 },
      {
        destination: "Paris",
        country: "France",
        bookings: 167,
        revenue: 134000,
      },
      {
        destination: "New York",
        country: "USA",
        bookings: 145,
        revenue: 128000,
      },
      {
        destination: "Singapore",
        country: "Singapore",
        bookings: 132,
        revenue: 115000,
      },
      { destination: "Tokyo", country: "Japan", bookings: 98, revenue: 92000 },
      {
        destination: "Bangkok",
        country: "Thailand",
        bookings: 87,
        revenue: 65000,
      },
      {
        destination: "Sydney",
        country: "Australia",
        bookings: 76,
        revenue: 58000,
      },
      { destination: "Rome", country: "Italy", bookings: 65, revenue: 48000 },
      {
        destination: "Barcelona",
        country: "Spain",
        bookings: 54,
        revenue: 42000,
      },
    ];
  }
}

export const reportsService = new ReportsService();
export default reportsService;
