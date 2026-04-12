import { getCoreDb } from '../database.js';
import { v4 as uuidv4 } from 'uuid';

class VisitorService {
  /**
   * Track visitor session
   */
  async trackVisitor(
    sessionId: string,
    pageUrl: string,
    data: {
      email?: string;
      deviceType?: string;
      deviceOs?: string;
      browserName?: string;
      browserVersion?: string;
      country?: string;
      countryCode?: string;
      city?: string;
      latitude?: number;
      longitude?: number;
      source?: string;
      campaign?: string;
      referrer?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
      utmContent?: string;
      utmTerm?: string;
    }
  ) {
    try {
      // Check if visitor exists
      let visitor = await getCoreDb().online_visitor.findUnique({
        where: { sessionId },
      });

      if (visitor) {
        // Update existing visitor
        visitor = await getCoreDb().online_visitor.update({
          where: { sessionId },
          data: {
            pageViews: { increment: 1 },
            lastPageUrl: pageUrl,
            lastSeenAt: new Date(),
            email: data.email || visitor.email,
          },
        });
      } else {
        // Create new visitor
        visitor = await getCoreDb().online_visitor.create({
          data: {
            sessionId,
            lastPageUrl: pageUrl,
            pageViews: 1,
            email: data.email,
            deviceType: (data.deviceType as any) || 'DESKTOP',
            deviceOs: data.deviceOs,
            browserName: data.browserName,
            browserVersion: data.browserVersion,
            country: data.country,
            countryCode: data.countryCode,
            city: data.city,
            latitude: data.latitude,
            longitude: data.longitude,
            source: data.source,
            campaign: data.campaign,
            referrer: data.referrer,
            utmSource: data.utmSource,
            utmMedium: data.utmMedium,
            utmCampaign: data.utmCampaign,
            utmContent: data.utmContent,
            utmTerm: data.utmTerm,
          },
        });
      }

      // Log page view
      await getCoreDb().visitor_page_view.create({
        data: {
          visitorId: visitor.id,
          pageUrl,
          viewedAt: new Date(),
        },
      });

      // Update lead score
      await this.updateLeadScore(visitor.id);

      return visitor;
    } catch (error: unknown) {
      console.error('Error tracking visitor:', error);
      throw error;
    }
  }

  /**
   * Track search query
   */
  async trackSearch(
    sessionId: string,
    searchParams: {
      searchType?: string;
      origin?: string;
      destination?: string;
      departureDate?: Date;
      returnDate?: Date;
      passengers?: number;
      filters?: any;
      resultsCount?: number;
      selectedResultId?: string;
    }
  ) {
    try {
      const visitor = await getCoreDb().online_visitor.findUnique({
        where: { sessionId },
      });

      if (!visitor) return null;

      await getCoreDb().online_visitor.update({
        where: { sessionId },
        data: { searchQueries: { increment: 1 } },
      });

      const search = await getCoreDb().visitor_search.create({
        data: {
          visitorId: visitor.id,
          searchType: searchParams.searchType || 'flight',
          origin: searchParams.origin,
          destination: searchParams.destination,
          departureDate: searchParams.departureDate,
          returnDate: searchParams.returnDate,
          passengers: searchParams.passengers,
          filters: searchParams.filters,
          resultsCount: searchParams.resultsCount,
          selectedResultId: searchParams.selectedResultId,
        },
      });

      // Update lead score
      await this.updateLeadScore(visitor.id);

      return search;
    } catch (error: unknown) {
      console.error('Error tracking search:', error);
      throw error;
    }
  }

  /**
   * Calculate and update lead score
   */
  async updateLeadScore(visitorId: string) {
    try {
      const visitor = await getCoreDb().online_visitor.findUnique({
        where: { id: visitorId },
        include: {
          searches: true,
        },
      });

      if (!visitor) return null;

      let score = 0;

      // Scoring logic
      score += visitor.pageViews * 5; // 5 points per page view
      score += visitor.searchQueries * 10; // 10 points per search
      if (visitor.email) score += 20; // 20 points for email
      if (visitor.bookingId) score += 50; // 50 points for booking

      // Cap at 100
      score = Math.min(score, 100);

      return await getCoreDb().online_visitor.update({
        where: { id: visitorId },
        data: { leadScore: score },
      });
    } catch (error: unknown) {
      console.error('Error updating lead score:', error);
      throw error;
    }
  }

  /**
   * Convert visitor to contact
   */
  async convertVisitorToContact(sessionId: string, userId: string, email: string) {
    try {
      const visitor = await getCoreDb().online_visitor.findUnique({
        where: { sessionId },
      });

      if (!visitor) return null;

      // Update visitor
      const updated = await getCoreDb().online_visitor.update({
        where: { sessionId },
        data: {
          userId,
          email,
          convertedAt: new Date(),
          convertedToBooking: true,
        },
      });

      return updated;
    } catch (error: unknown) {
      console.error('Error converting visitor:', error);
      throw error;
    }
  }

  /**
   * Get visitor profile
   */
  async getVisitorProfile(sessionId: string) {
    try {
      const visitor = await getCoreDb().online_visitor.findUnique({
        where: { sessionId },
        include: {
          pageViews_rel: {
            orderBy: { viewedAt: 'desc' },
            take: 20,
          },
          searches: {
            orderBy: { searchedAt: 'desc' },
            take: 10,
          },
        },
      });

      return visitor;
    } catch (error: unknown) {
      console.error('Error fetching visitor profile:', error);
      throw error;
    }
  }

  /**
   * Get active visitors (last 24 hours)
   */
  async getActiveVisitors(limit: number = 50) {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      return await getCoreDb().online_visitor.findMany({
        where: {
          lastSeenAt: {
            gte: oneDayAgo,
          },
        },
        orderBy: { lastSeenAt: 'desc' },
        take: limit,
      });
    } catch (error: unknown) {
      console.error('Error fetching active visitors:', error);
      throw error;
    }
  }

  /**
   * Get visitor analytics
   */
  async getVisitorAnalytics(daysBack: number = 7) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - daysBack);

      const visitors = await getCoreDb().online_visitor.findMany({
        where: {
          firstSeenAt: { gte: since },
        },
      });

      // Group by source
      const bySource = visitors.reduce(
        (acc, v) => {
          const source = v.source || 'direct';
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      // Group by device
      const byDevice = visitors.reduce(
        (acc, v) => {
          const device = v.deviceType || 'unknown';
          acc[device] = (acc[device] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalVisitors: visitors.length,
        bySource,
        byDevice,
        avgPageViews: visitors.reduce((sum, v) => sum + v.pageViews, 0) / visitors.length,
        avgSearches: visitors.reduce((sum, v) => sum + v.searchQueries, 0) / visitors.length,
      };
    } catch (error: unknown) {
      console.error('Error calculating analytics:', error);
      throw error;
    }
  }
}

const visitorService = new VisitorService();
