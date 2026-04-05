import { getPrismaClient } from '../database';
import type { CreateActivity } from '../types';

const prisma = getPrismaClient();

export class ActivityService {
  /**
   * Log activity for contact
   */
  async logActivity(data: CreateActivity) {
    try {
      if (!data.createdBy) {
        data.createdBy = 'SYSTEM';
      }

      const activity = await prisma.activity.create({
        data: {
          contactId: data.contactId,
          type: data.type as any,
          title: data.title,
          description: data.description,
          bookingId: data.bookingId,
          ticketId: data.ticketId,
          emailCampaignId: data.emailCampaignId,
          metadata: data.metadata,
          createdBy: data.createdBy,
          isInternal: data.isInternal || false,
        },
      });

      // Update contact's last interaction timestamp
      await prisma.contact.update({
        where: { id: data.contactId },
        data: { lastInteractionAt: new Date() },
      });

      return activity;
    } catch (error: unknown) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }

  /**
   * Get activity timeline for contact
   */
  async getTimeline(
    contactId: string,
    options: {
      limit?: number;
      offset?: number;
      type?: string;
    } = {}
  ) {
    try {
      const { limit = 20, offset = 0, type } = options;

      const where: any = { contactId };
      if (type) where.type = type;

      const [activities, total] = await Promise.all([
        prisma.activity.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.activity.count({ where }),
      ]);

      return {
        data: activities,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: unknown) {
      console.error('Error fetching timeline:', error);
      throw error;
    }
  }

  /**
   * Get activity metrics
   */
  async getActivityMetrics(contactId: string) {
    try {
      const activities = await prisma.activity.findMany({
        where: { contactId },
      });

      const grouped = activities.reduce(
        (acc, activity) => {
          const type = activity.type;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalActivities: activities.length,
        byType: grouped,
        lastActivity: activities[0]?.createdAt || null,
        firstActivity: activities[activities.length - 1]?.createdAt || null,
      };
    } catch (error: unknown) {
      console.error('Error calculating activity metrics:', error);
      throw error;
    }
  }

  /**
   * Search activities by type
   */
  async searchByType(contactId: string, activityType: string, limit: number = 50) {
    try {
      return await prisma.activity.findMany({
        where: {
          contactId,
          type: activityType as any,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error: unknown) {
      console.error('Error searching activities:', error);
      throw error;
    }
  }

  /**
   * Get activities by booking ID
   */
  async getActivitiesByBookingId(bookingId: string) {
    try {
      return await prisma.activity.findMany({
        where: { bookingId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: unknown) {
      console.error('Error fetching booking activities:', error);
      throw error;
    }
  }

  /**
   * Get activities by ticket ID
   */
  async getActivitiesByTicketId(ticketId: string) {
    try {
      return await prisma.activity.findMany({
        where: { ticketId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: unknown) {
      console.error('Error fetching ticket activities:', error);
      throw error;
    }
  }

  /**
   * Delete activity (soft delete by marking old activities)
   */
  async deleteActivity(activityId: string) {
    // In production, implement soft delete with a deletedAt flag
    // For now, we'll just return a deprecation notice
    return { deprecated: true, message: 'Activities are immutable for audit trail' };
  }

  /**
   * Get recent activities across all contacts (for dashboard)
   */
  async getRecentActivities(limit: number = 50) {
    try {
      return await prisma.activity.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          contact: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    } catch (error: unknown) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }

  /**
   * Get activities from last N days
   */
  async getActivitiesFromLastDays(contactId: string, days: number = 30) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      return await prisma.activity.findMany({
        where: {
          contactId,
          createdAt: {
            gte: since,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error: unknown) {
      console.error('Error fetching recent activities:', error);
      throw error;
    }
  }
}

export const activityService = new ActivityService();
