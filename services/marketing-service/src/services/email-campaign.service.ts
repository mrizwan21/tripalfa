import { getCoreDb, CampaignStatus, RecipientStatus } from '../database.js';
import axios from 'axios';
import type { CreateEmailCampaign } from '../types/index.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_API_URL = 'https://api.resend.com';

export class EmailCampaignService {
  /**
   * Create email campaign
   */
  async createCampaign(data: CreateEmailCampaign) {
    try {
      const campaignId = `camp_${Date.now()}`;

      const campaign = await getCoreDb().email_campaign.create({
        data: {
          campaignId,
          name: data.name,
          subject: data.subject,
          description: data.description,
          segmentationRules: data.segmentationRules,
          estimatedRecipients: data.segmentationRules?.estimatedRecipients || 0,
          htmlContent: data.htmlContent,
          textContent: data.textContent,
          previewText: data.previewText,
          createdBy: data.createdBy,
          scheduledFor: data.scheduledFor,
        },
      });

      return campaign;
    } catch (error: unknown) {
      console.error('Error creating campaign:', error);
      throw error;
    }
  }

  /**
   * Build audience based on segmentation rules
   */
  async buildAudience(segmentationRules: any) {
    try {
      const where: any = {};

      // Example: tier-based filtering
      if (segmentationRules.tier) {
        where.tier = { in: segmentationRules.tier };
      }

      // Example: spending-based filtering
      if (segmentationRules.minSpent) {
        where.totalSpent = { gte: segmentationRules.minSpent };
      }

      if (segmentationRules.maxSpent) {
        where.totalSpent = { ...where.totalSpent, lte: segmentationRules.maxSpent };
      }

      // Get contacts matching criteria
      const contacts = await getCoreDb().contact.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          userId: true,
        },
      });

      return contacts;
    } catch (error: unknown) {
      console.error('Error building audience:', error);
      throw error;
    }
  }

  /**
   * Send email campaign via Resend
   */
  async sendEmailCampaign(
    campaignId: string,
    recipientEmail: string,
    recipientName: string,
    subject: string,
    htmlContent: string
  ) {
    try {
      if (!RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY not configured');
      }

      const response = await axios.post(
        `${RESEND_API_URL}/emails`,
        {
          from: process.env.RESEND_FROM_EMAIL || 'noreply@tripalfa.com',
          to: recipientEmail,
          subject,
          html: htmlContent,
          text: htmlContent.replace(/<[^>]*>/g, ''),
          reply_to: process.env.RESEND_REPLY_TO,
          tags: [{ name: 'campaign_id', value: campaignId }],
        },
        {
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error: unknown) {
      console.error('Error sending email via Resend:', error);
      throw error;
    }
  }

  /**
   * Send campaign to audience
   */
  async sendCampaignToAudience(campaignId: string, audience: any[]) {
    try {
      const campaign = await getCoreDb().email_campaign.findUnique({
        where: { campaignId },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const updates = {
        status: 'SENDING' as CampaignStatus,
        startedAt: new Date(),
      };

      await getCoreDb().email_campaign.update({
        where: { campaignId },
        data: updates,
      });

      // Send to audience (in production, queue these)
      for (const recipient of audience) {
        try {
          const emailResponse = await this.sendEmailCampaign(
            campaignId,
            recipient.email,
            recipient.firstName || 'Valued Customer',
            campaign.subject,
            campaign.htmlContent || ''
          );

          // Create recipient record
          await getCoreDb().campaign_recipient.create({
            data: {
              campaignId,
              userId: recipient.userId,
              email: recipient.email,
              resendMessageId: emailResponse.id,
              status: 'SENT' as RecipientStatus,
              sentAt: new Date(),
            },
          });

          // Update campaign stats
          await getCoreDb().email_campaign.update({
            where: { campaignId },
            data: { totalSent: { increment: 1 } },
          });
        } catch (emailError) {
          console.error(`Failed to send to ${recipient.email}:`, emailError);
          // Continue with next recipient
        }
      }

      return { success: true, message: `Campaign sent to ${audience.length} recipients` };
    } catch (error: unknown) {
      console.error('Error sending campaign:', error);
      throw error;
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string) {
    try {
      const campaign = await getCoreDb().email_campaign.findUnique({
        where: { campaignId },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const recipients = await getCoreDb().campaign_recipient.findMany({
        where: { campaignId },
      });

      const metrics = {
        sent: recipients.filter(r => r.status !== 'PENDING').length,
        opened: recipients.filter(r => r.openedAt).length,
        clicked: recipients.filter(r => r.clickedAt).length,
        converted: recipients.filter(r => r.convertedAt).length,
        bounced: recipients.filter(r => r.bouncedAt).length,
        complained: recipients.filter(r => r.complainedAt).length,
        open_rate: 0,
        click_rate: 0,
        conversion_rate: 0,
      };

      if (metrics.sent > 0) {
        metrics.open_rate = (metrics.opened / metrics.sent) * 100;
        metrics.click_rate = (metrics.clicked / metrics.sent) * 100;
        metrics.conversion_rate = (metrics.converted / metrics.sent) * 100;
      }

      return { campaign, metrics, recipients };
    } catch (error: unknown) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  /**
   * Handle Resend webhook (bounce, complaint, open, click)
   */
  async handleResendWebhook(data: any) {
    try {
      const { type, email, message_id } = data;

      if (type === 'email.bounced') {
        // Add to suppression list
        await getCoreDb().email_suppression_list.upsert({
          where: { email },
          create: {
            email,
            reason: 'BOUNCE',
            bounceType: data.bounce_type,
            bounceSubtype: data.bounce_subtype,
          },
          update: {
            reason: 'BOUNCE',
            bounceType: data.bounce_type,
            bounceSubtype: data.bounce_subtype,
          },
        });

        // Update recipient status
        await getCoreDb().campaign_recipient.updateMany({
          where: { resendMessageId: message_id },
          data: {
            status: 'BOUNCED' as RecipientStatus,
            bouncedAt: new Date(),
            bounceType: data.bounce_type,
            bounceReason: data.bounce_subtype,
          },
        });
      } else if (type === 'email.complained') {
        // Add to suppression list
        await getCoreDb().email_suppression_list.upsert({
          where: { email },
          create: { email, reason: 'COMPLAINT' },
          update: { reason: 'COMPLAINT' },
        });

        // Update recipient status
        await getCoreDb().campaign_recipient.updateMany({
          where: { resendMessageId: message_id },
          data: { status: 'COMPLAINED' as RecipientStatus, complainedAt: new Date() },
        });
      } else if (type === 'email.opened') {
        await getCoreDb().campaign_recipient.updateMany({
          where: { resendMessageId: message_id },
          data: {
            status: 'OPENED' as RecipientStatus,
            openedAt: new Date(),
            openedCount: { increment: 1 },
          },
        });
      } else if (type === 'email.clicked') {
        await getCoreDb().campaign_recipient.updateMany({
          where: { resendMessageId: message_id },
          data: {
            status: 'CLICKED' as RecipientStatus,
            clickedAt: new Date(),
            clickedCount: { increment: 1 },
          },
        });
      }

      return { processed: true };
    } catch (error: unknown) {
      console.error('Error handling webhook:', error);
      throw error;
    }
  }

  /**
   * Check suppression list before sending
   */
  async isEmailSuppressed(email: string): Promise<boolean> {
    try {
      const suppressed = await getCoreDb().email_suppression_list.findUnique({
        where: { email },
      });
      return !!suppressed;
    } catch (error: unknown) {
      console.error('Error checking suppression list:', error);
      return false;
    }
  }

  /**
   * Schedule campaign
   */
  async scheduleCampaign(campaignId: string, scheduledFor: Date) {
    try {
      return await getCoreDb().email_campaign.update({
        where: { campaignId },
        data: {
          status: 'SCHEDULED' as CampaignStatus,
          scheduledFor,
        },
      });
    } catch (error: unknown) {
      console.error('Error scheduling campaign:', error);
      throw error;
    }
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string) {
    try {
      return await getCoreDb().email_campaign.update({
        where: { campaignId },
        data: { status: 'PAUSED' as CampaignStatus },
      });
    } catch (error: unknown) {
      console.error('Error pausing campaign:', error);
      throw error;
    }
  }

  /**
   * Resume campaign
   */
  async resumeCampaign(campaignId: string) {
    try {
      return await getCoreDb().email_campaign.update({
        where: { campaignId },
        data: { status: 'SENDING' as CampaignStatus, startedAt: new Date() },
      });
    } catch (error: unknown) {
      console.error('Error resuming campaign:', error);
      throw error;
    }
  }
}

export const emailCampaignService = new EmailCampaignService();
