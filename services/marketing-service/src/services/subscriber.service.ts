import { getCoreDb } from '@tripalfa/shared-database';
import axios from 'axios';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_API_URL = 'https://api.resend.com';

class SubscriberService {
  /**
   * Subscribe email
   */
  async subscribe(
    email: string,
    data: {
      firstName?: string;
      lastName?: string;
      interests?: string[];
      source?: string;
      utmSource?: string;
      utmMedium?: string;
      utmCampaign?: string;
    }
  ) {
    try {
      const subscriber = await getCoreDb().email_subscriber.upsert({
        where: { email },
        create: {
          email,
          firstName: data.firstName,
          lastName: data.lastName,
          interests: data.interests || [],
          status: 'ACTIVE',
          leadScore: 0,
          leadGrade: 'D',
        },
        update: {
          status: 'ACTIVE',
          firstName: data.firstName || undefined,
          lastName: data.lastName || undefined,
        },
      });

      // Track subscription source
      if (data.source) {
        await getCoreDb().lead_source.create({
          data: {
            subscriberId: subscriber.id,
            source: data.source,
            utmSource: data.utmSource,
            utmMedium: data.utmMedium,
            utmCampaign: data.utmCampaign,
          },
        });
      }

      // Send welcome email
      await this.sendWelcomeEmail(email, data.firstName);

      // Log activity
      await getCoreDb().lead_activity.create({
        data: {
          subscriberId: subscriber.id,
          activityType: 'SUBSCRIPTION',
          description: `Subscribed via ${data.source || 'direct'}`,
          scoreDelta: 10,
        },
      });

      // Update lead score
      await this.updateLeadScore(subscriber.id);

      return subscriber;
    } catch (error: unknown) {
      console.error('Error subscribing:', error);
      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, firstName?: string) {
    try {
      if (!RESEND_API_KEY) return;

      const name = firstName || 'Valued Subscriber';

      await axios.post(
        `${RESEND_API_URL}/emails`,
        {
          from: process.env.RESEND_FROM_EMAIL || 'noreply@tripalfa.com',
          to: email,
          subject: 'Welcome to TripAlfa!',
          html: `<p>Hello ${name},</p><p>Thank you for subscribing to TripAlfa. Get ready for exclusive deals and travel inspiration!</p>`,
          tags: [{ name: 'type', value: 'welcome' }],
        },
        {
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
        }
      );
    } catch (error: unknown) {
      console.error('Error sending welcome email:', error);
      // Don't throw - subscription should succeed even if email fails
    }
  }

  /**
   * Unsubscribe
   */
  async unsubscribe(email: string) {
    try {
      return await getCoreDb().email_subscriber.update({
        where: { email },
        data: {
          status: 'UNSUBSCRIBED',
          unsubscribedAt: new Date(),
        },
      });
    } catch (error: unknown) {
      console.error('Error unsubscribing:', error);
      throw error;
    }
  }

  /**
   * Get subscriber
   */
  async getSubscriber(email: string) {
    try {
      return await getCoreDb().email_subscriber.findUnique({
        where: { email },
        include: {
          activities: {
            take: 20,
            orderBy: { createdAt: 'desc' },
          },
          sources: true,
        },
      });
    } catch (error: unknown) {
      console.error('Error fetching subscriber:', error);
      throw error;
    }
  }

  /**
   * Get subscriber stats
   */
  async getSubscriberStats() {
    try {
      const [total, active, unsubscribed, byGrade, bySource] = await Promise.all([
        getCoreDb().email_subscriber.count(),
        getCoreDb().email_subscriber.count({ where: { status: 'ACTIVE' } }),
        getCoreDb().email_subscriber.count({ where: { status: 'UNSUBSCRIBED' } }),
        getCoreDb().email_subscriber.groupBy({
          by: ['leadGrade'],
          _count: true,
        }),
        getCoreDb().lead_source.groupBy({
          by: ['source'],
          _count: true,
        }),
      ]);

      return {
        total,
        active,
        unsubscribed,
        byGrade: byGrade.reduce(
          (acc, g) => {
            acc[g.leadGrade] = g._count;
            return acc;
          },
          {} as Record<string, number>
        ),
        bySource: bySource.reduce(
          (acc, s) => {
            acc[s.source] = s._count;
            return acc;
          },
          {} as Record<string, number>
        ),
      };
    } catch (error: unknown) {
      console.error('Error calculating stats:', error);
      throw error;
    }
  }

  /**
   * Get hot leads (for sales team)
   */
  async getHotLeads(limit: number = 50) {
    try {
      return await getCoreDb().email_subscriber.findMany({
        where: {
          status: 'ACTIVE',
          leadGrade: { in: ['A', 'B'] },
        },
        include: {
          activities: {
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { leadScore: 'desc' },
        take: limit,
      });
    } catch (error: unknown) {
      console.error('Error fetching hot leads:', error);
      throw error;
    }
  }

  /**
   * Update lead score
   */
  async updateLeadScore(subscriberId: string) {
    try {
      const subscriber = await getCoreDb().email_subscriber.findUnique({
        where: { id: subscriberId },
        include: {
          activities: true,
        },
      });

      if (!subscriber) return null;

      let score = 0;

      // Scoring logic
      score += subscriber.emailsOpened * 5;
      score += subscriber.emailsClicked * 10;
      score += subscriber.activities.length * 3;

      // Engagement bonus
      if (subscriber.lastEmailOpenedAt) {
        const daysSinceOpen = (Date.now() - subscriber.lastEmailOpenedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceOpen < 7) score += 20;
        else if (daysSinceOpen < 30) score += 10;
      }

      // Cap at 100
      score = Math.min(score, 100);

      // Determine grade
      let grade: any = 'D';
      if (score >= 90) grade = 'A';
      else if (score >= 75) grade = 'B';
      else if (score >= 60) grade = 'C';

      return await getCoreDb().email_subscriber.update({
        where: { id: subscriberId },
        data: {
          leadScore: score,
          leadGrade: grade,
        },
      });
    } catch (error: unknown) {
      console.error('Error updating lead score:', error);
      throw error;
    }
  }

  /**
   * Log subscriber activity
   */
  async logActivity(subscriberId: string, activityType: string, metadata?: any, scoreDelta?: number) {
    try {
      const activity = await getCoreDb().lead_activity.create({
        data: {
          subscriberId,
          activityType,
          activityData: metadata,
          scoreDelta: scoreDelta || 0,
        },
      });

      // Update lead score
      await this.updateLeadScore(subscriberId);

      return activity;
    } catch (error: unknown) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }

  /**
   * Convert subscriber to contact
   */
  async convertToContact(email: string, userId: string) {
    try {
      const subscriber = await getCoreDb().email_subscriber.findUnique({
        where: { email },
      });

      if (!subscriber) return null;

      // Log conversion activity
      await this.logActivity(subscriber.id, 'BOOKING', { userId }, 50);

      return await getCoreDb().email_subscriber.update({
        where: { id: subscriber.id },
        data: {
          convertedToContact: true,
          contactId: userId,
          convertedAt: new Date(),
        },
      });
    } catch (error: unknown) {
      console.error('Error converting subscriber:', error);
      throw error;
    }
  }
}

const subscriberService = new SubscriberService();
