import { tierService } from './tierService';
import { prisma } from '../database';

export interface TierChangeNotification {
  id: string;
  customerId: string;
  customerEmail: string;
  oldTier: string | null;
  newTier: string;
  changeType: 'upgrade' | 'downgrade' | 'initial_assignment';
  changeDate: Date;
  reason?: string;
  benefits: string[];
  nextMilestone?: {
    targetTier: string;
    requirements: {
      totalSpentNeeded: number;
      bookingsNeeded: number;
      engagementScoreNeeded: number;
    };
    currentProgress: {
      totalSpent: number;
      bookingsCount: number;
      engagementScore: number;
    };
  };
  metadata?: Record<string, any>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  channel: 'email' | 'in_app' | 'sms' | 'all';
}

export class TierNotificationService {
  private readonly notificationTemplates: NotificationTemplate[] = [
    {
      id: 'tier_upgrade',
      name: 'Tier Upgrade Notification',
      subject: "Congratulations! You've been upgraded to {{newTier}} tier",
      body: `Dear {{customerName}},

We're excited to inform you that you've been upgraded to our {{newTier}} tier!

This upgrade recognizes your loyalty and engagement with our platform. As a {{newTier}} member, you now have access to:

{{benefitsList}}

Thank you for being a valued customer. We look forward to continuing to serve you.

Best regards,
The TripAlfa Team`,
      variables: ['customerName', 'newTier', 'benefitsList', 'oldTier'],
      channel: 'email',
    },
    {
      id: 'tier_downgrade',
      name: 'Tier Downgrade Notification',
      subject: 'Important: Your account tier has been updated',
      body: `Dear {{customerName}},

We wanted to inform you that your account tier has been updated from {{oldTier}} to {{newTier}}.

This change is based on your recent activity and engagement levels. To regain your previous tier status, we recommend:

- Making new bookings
- Increasing your engagement with our platform
- Exploring our latest offers

You can view your current benefits and requirements in your account dashboard.

If you have any questions, please don't hesitate to contact our support team.

Best regards,
The TripAlfa Team`,
      variables: ['customerName', 'newTier', 'oldTier', 'reason'],
      channel: 'email',
    },
    {
      id: 'tier_initial',
      name: 'Tier Initial Assignment',
      subject: 'Welcome to your {{newTier}} tier membership',
      body: `Dear {{customerName}},

Welcome to TripAlfa! Based on your profile, you've been assigned to our {{newTier}} tier.

As a {{newTier}} member, you enjoy:

{{benefitsList}}

We're excited to have you on board and look forward to helping you with your travel needs.

Best regards,
The TripAlfa Team`,
      variables: ['customerName', 'newTier', 'benefitsList'],
      channel: 'email',
    },
    {
      id: 'tier_milestone',
      name: 'Tier Milestone Progress',
      subject: "You're making great progress toward {{targetTier}} tier!",
      body: `Dear {{customerName}},

Great news! You're making excellent progress toward reaching our {{targetTier}} tier.

Your current progress:
- Spending: {{currentSpent}} of {{neededSpent}} needed
- Bookings: {{currentBookings}} of {{neededBookings}} needed
- Engagement: {{currentEngagement}}% of {{neededEngagement}}% needed

Keep up the great work! Reach {{targetTier}} tier to unlock even more benefits.

Best regards,
The TripAlfa Team`,
      variables: [
        'customerName',
        'targetTier',
        'currentSpent',
        'neededSpent',
        'currentBookings',
        'neededBookings',
        'currentEngagement',
        'neededEngagement',
      ],
      channel: 'email',
    },
  ];

  /**
   * Send notification for tier change
   */
  async sendTierChangeNotification(
    customerId: string,
    oldTier: string | null,
    newTier: string,
    changeType: 'upgrade' | 'downgrade' | 'initial_assignment' = 'initial_assignment',
    reason?: string
  ): Promise<boolean> {
    try {
      // Get customer details
      const customer = await prisma.crm_contact.findUnique({
        where: { id: customerId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          totalSpent: true,
          bookingsCount: true,
        },
      });

      if (!customer) {
        console.error(`Customer ${customerId} not found for tier notification`);
        return false;
      }

      // Get tier definitions
      const newTierDef = tierService.getTierDefinition(newTier);
      const oldTierDef = oldTier ? tierService.getTierDefinition(oldTier) : null;

      if (!newTierDef) {
        console.error(`Tier definition not found for ${newTier}`);
        return false;
      }

      // Determine template based on change type
      let templateId = 'tier_initial';
      if (changeType === 'upgrade') templateId = 'tier_upgrade';
      else if (changeType === 'downgrade') templateId = 'tier_downgrade';

      const template = this.notificationTemplates.find(t => t.id === templateId);
      if (!template) {
        console.error(`Template ${templateId} not found`);
        return false;
      }

      // Prepare variables
      const customerName =
        `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Valued Customer';
      const benefitsList = newTierDef.benefits.map(b => `• ${b}`).join('\n');

      // Render template
      const renderedSubject = this.renderTemplate(template.subject, {
        customerName,
        newTier,
        oldTier: oldTier || 'none',
        benefitsList,
      });

      const renderedBody = this.renderTemplate(template.body, {
        customerName,
        newTier,
        oldTier: oldTier || 'none',
        benefitsList,
        reason: reason || 'based on your recent activity and engagement',
      });

      // In a real implementation, this would send via email service, push notification, etc.
      // For now, we'll log and simulate sending
      console.log(`[TIER NOTIFICATION] To: ${customer.email}`);
      console.log(`[TIER NOTIFICATION] Subject: ${renderedSubject}`);
      console.log(`[TIER NOTIFICATION] Body:\n${renderedBody}`);
      console.log(`[TIER NOTIFICATION] Channel: ${template.channel}`);

      // Store notification in database for tracking
      await this.storeNotification({
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerId: customer.id,
        customerEmail: customer.email,
        oldTier,
        newTier,
        changeType,
        changeDate: new Date(),
        reason,
        benefits: newTierDef.benefits,
        metadata: {
          templateId,
          channel: template.channel,
          renderedSubject,
          sentAt: new Date().toISOString(),
        },
      });

      // If upgrade, check and send milestone progress for next tier
      if (changeType === 'upgrade' || changeType === 'initial_assignment') {
        await this.checkAndSendMilestoneNotification(customerId, newTier);
      }

      return true;
    } catch (error: unknown) {
      console.error(`Error sending tier change notification for customer ${customerId}:`, error);
      return false;
    }
  }

  /**
   * Check if customer is close to next tier and send milestone notification
   */
  private async checkAndSendMilestoneNotification(
    customerId: string,
    currentTier: string
  ): Promise<void> {
    try {
      const allTiers = tierService.getAllTierDefinitions();
      const currentTierIndex = allTiers.findIndex(t => t.name === currentTier);

      // Check if there's a next tier
      if (currentTierIndex < allTiers.length - 1) {
        const nextTier = allTiers[currentTierIndex + 1];
        const currentTierDef = allTiers[currentTierIndex];

        // Get customer's current metrics
        const customer = await prisma.crm_contact.findUnique({
          where: { id: customerId },
          select: {
            totalSpent: true,
            bookingsCount: true,
          },
        });

        if (!customer) return;

        // Calculate engagement score
        // Note: In a real implementation, you'd want to calculate this properly
        // For simplicity, we'll estimate or skip for now

        // Check if customer is making progress toward next tier
        // For demo purposes, we'll send milestone if they're at least 50% toward next tier's spending
        const spentProgress = Number(customer.totalSpent) / nextTier.criteria.minTotalSpent;
        const bookingsProgress = customer.bookingsCount / nextTier.criteria.minBookingsCount;

        if (spentProgress >= 0.5 || bookingsProgress >= 0.5) {
          const template = this.notificationTemplates.find(t => t.id === 'tier_milestone');
          if (template) {
            const customerDetails = await prisma.crm_contact.findUnique({
              where: { id: customerId },
              select: {
                email: true,
                firstName: true,
                lastName: true,
              },
            });

            if (customerDetails) {
              const customerName =
                `${customerDetails.firstName || ''} ${customerDetails.lastName || ''}`.trim() ||
                'Valued Customer';

              const renderedSubject = this.renderTemplate(template.subject, {
                customerName,
                targetTier: nextTier.name,
              });

              const currentSpent = Number(customer.totalSpent).toFixed(2);
              const neededSpent = nextTier.criteria.minTotalSpent;
              const currentBookings = customer.bookingsCount;
              const neededBookings = nextTier.criteria.minBookingsCount;
              const currentEngagement = 65; // Placeholder
              const neededEngagement = nextTier.criteria.minEngagementScore;

              const renderedBody = this.renderTemplate(template.body, {
                customerName,
                targetTier: nextTier.name,
                currentSpent,
                neededSpent,
                currentBookings,
                neededBookings,
                currentEngagement,
                neededEngagement,
              });

              console.log(`[MILESTONE NOTIFICATION] To: ${customerDetails.email}`);
              console.log(`[MILESTONE NOTIFICATION] Subject: ${renderedSubject}`);
              console.log(`[MILESTONE NOTIFICATION] Body:\n${renderedBody}`);
            }
          }
        }
      }
    } catch (error: unknown) {
      console.error(`Error checking milestone for customer ${customerId}:`, error);
      // Don't throw - milestone notifications are non-critical
    }
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
    return result;
  }

  /**
   * Store notification in database for tracking
   */
  private async storeNotification(notification: TierChangeNotification): Promise<void> {
    try {
      // In a real implementation, you would store this in a notifications table
      // For now, we'll create a simple log entry in a JSON column or similar

      // Example of what you might do:
      /*
      await prisma.notification.create({
        data: {
          id: notification.id,
          userId: notification.customerId,
          type: 'tier_change',
          title: `Tier ${notification.changeType}: ${notification.oldTier || 'none'} → ${notification.newTier}`,
          message: JSON.stringify(notification),
          read: false,
          metadata: notification.metadata,
          createdAt: notification.changeDate
        }
      });
      */

      // For now, just log
      console.log(
        `[NOTIFICATION STORED] ${notification.id} for customer ${notification.customerId}`
      );
    } catch (error: unknown) {
      console.error('Error storing notification:', error);
    }
  }

  /**
   * Get notification history for a customer
   */
  async getNotificationHistory(customerId: string, limit = 50): Promise<TierChangeNotification[]> {
    // In a real implementation, this would query the database
    // For now, return empty array
    return [];
  }

  /**
   * Batch send notifications for multiple tier changes
   */
  async batchSendNotifications(
    changes: Array<{
      customerId: string;
      oldTier: string | null;
      newTier: string;
      changeType: 'upgrade' | 'downgrade' | 'initial_assignment';
      reason?: string;
    }>
  ): Promise<{ success: number; failed: number }> {
    const results = { success: 0, failed: 0 };

    // Process in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < changes.length; i += batchSize) {
      const batch = changes.slice(i, i + batchSize);

      const batchPromises = batch.map(async change => {
        try {
          const sent = await this.sendTierChangeNotification(
            change.customerId,
            change.oldTier,
            change.newTier,
            change.changeType,
            change.reason
          );

          if (sent) {
            results.success++;
          } else {
            results.failed++;
          }
        } catch (error: unknown) {
          console.error(`Failed to send notification for customer ${change.customerId}:`, error);
          results.failed++;
        }
      });

      await Promise.all(batchPromises);
    }

    console.log(
      `Batch notification sending completed: ${results.success} succeeded, ${results.failed} failed`
    );
    return results;
  }

  /**
   * Integrate with tier update job to send notifications automatically
   */
  async processTierUpdateResults(updateResults: any): Promise<void> {
    // This method would be called from the tier update job
    // It processes the results and sends appropriate notifications

    const notificationsToSend: Array<{
      customerId: string;
      oldTier: string | null;
      newTier: string;
      changeType: 'upgrade' | 'downgrade' | 'initial_assignment';
    }> = [];

    if (updateResults.details) {
      for (const detail of updateResults.details) {
        if (detail.success && detail.oldTier !== detail.newTier) {
          const changeType = this.determineChangeType(detail.oldTier, detail.newTier);
          notificationsToSend.push({
            customerId: detail.customerId,
            oldTier: detail.oldTier,
            newTier: detail.newTier,
            changeType,
          });
        }
      }
    }

    if (notificationsToSend.length > 0) {
      await this.batchSendNotifications(notificationsToSend);
    }
  }

  /**
   * Determine change type based on old and new tier
   */
  private determineChangeType(
    oldTier: string | null,
    newTier: string
  ): 'upgrade' | 'downgrade' | 'initial_assignment' {
    if (!oldTier) return 'initial_assignment';

    const allTiers = tierService.getAllTierDefinitions();
    const oldTierLevel = allTiers.find(t => t.name === oldTier)?.level || 0;
    const newTierLevel = allTiers.find(t => t.name === newTier)?.level || 0;

    if (newTierLevel > oldTierLevel) return 'upgrade';
    if (newTierLevel < oldTierLevel) return 'downgrade';
    return 'initial_assignment'; // Shouldn't happen if tiers are different
  }
}

// Export singleton instance
export const tierNotificationService = new TierNotificationService();
