import { NotificationService } from '../services/notificationService';
import { prisma } from '@tripalfa/database';

export type OfflineRequestStatus =
  | 'pending_submission'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export interface OfflineRequestWebhookPayload {
  requestId: string;
  userId: string;
  status: OfflineRequestStatus;
  previousStatus?: OfflineRequestStatus;
  bookingId?: string;
  tripDetails?: {
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    passengers?: number;
  };
  reviewNotes?: string;
  actionUrl: string;
}

export class OfflineRequestNotificationHandler {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Handle status changes in offline requests
   * Sends appropriate notifications based on the new status
   */
  async handleStatusChange(payload: OfflineRequestWebhookPayload): Promise<void> {
    const { requestId, userId, status, bookingId, tripDetails, actionUrl, reviewNotes } =
      payload;

    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        console.error(`User not found: ${userId}`);
        return;
      }

      // Determine notification based on status
      const notificationConfig = this.getNotificationConfig(
        status,
        tripDetails,
        reviewNotes
      );

      if (!notificationConfig) {
        console.log(`No notification configured for status: ${status}`);
        return;
      }

      // Send notification through service
      await this.notificationService.sendNotification({
        userId,
        type: 'offline_request_update',
        title: notificationConfig.title,
        message: notificationConfig.message,
        priority: notificationConfig.priority,
        channels: notificationConfig.channels,
        actionUrl,
        data: {
          requestId,
          bookingId,
          status,
          tripDetails,
        },
      });

      console.log(`Notification sent for request ${requestId} to user ${userId}`);
    } catch (error) {
      console.error(`Failed to send notification for request ${requestId}:`, error);
      // Don't throw - notification failures shouldn't block the workflow
    }
  }

  /**
   * Send admin notification when a new request is submitted
   */
  async notifyAdminNewRequest(
    requestId: string,
    userId: string,
    tripDetails?: OfflineRequestWebhookPayload['tripDetails']
  ): Promise<void> {
    try {
      // Get admin users
      const admins = await prisma.user.findMany({
        where: {
          role: {
            in: ['admin', 'staff'],
          },
        },
      });

      if (admins.length === 0) {
        console.log('No admins found to notify');
        return;
      }

      const destination = tripDetails?.destination || 'Unknown';
      const departureDate = tripDetails?.departureDate || 'TBD';

      // Send notification to each admin
      for (const admin of admins) {
        await this.notificationService.sendNotification({
          userId: admin.id,
          type: 'approval_pending',
          title: 'New Offline Request Submitted',
          message: `A new offline booking request has been submitted for ${destination} (Departure: ${departureDate}). Please review it.`,
          priority: 'high',
          channels: ['email', 'push'],
          actionUrl: `/admin/requests/${requestId}`,
          data: {
            requestId,
            userId,
            tripDetails,
            isAdminNotification: true,
          },
        });
      }

      console.log(`Admin notifications sent for request ${requestId}`);
    } catch (error) {
      console.error(`Failed to send admin notification for request ${requestId}:`, error);
    }
  }

  /**
   * Send batch notifications for bulk operations
   */
  async sendBulkNotification(
    userIds: string[],
    type: string,
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    actionUrl?: string
  ): Promise<void> {
    try {
      for (const userId of userIds) {
        await this.notificationService.sendNotification({
          userId,
          type: type as any,
          title,
          message,
          priority,
          actionUrl,
          channels: ['email', 'push'],
        });
      }

      console.log(`Bulk notification sent to ${userIds.length} users`);
    } catch (error) {
      console.error('Failed to send bulk notification:', error);
    }
  }

  /**
   * Get notification configuration based on status
   */
  private getNotificationConfig(
    status: OfflineRequestStatus,
    tripDetails?: OfflineRequestWebhookPayload['tripDetails'],
    reviewNotes?: string
  ): {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high';
    channels: Array<'email' | 'sms' | 'push' | 'in_app'>;
  } | null {
    const destination = tripDetails?.destination || 'your trip';
    const departureDate = tripDetails?.departureDate || 'the scheduled date';

    switch (status) {
      case 'submitted':
        return {
          title: '✅ Request Received',
          message: `Your offline booking request for ${destination} (${departureDate}) has been received and is now under review.`,
          priority: 'medium',
          channels: ['email', 'push', 'in_app'],
        };

      case 'under_review':
        return {
          title: '👀 Request Under Review',
          message: `Your offline booking request for ${destination} is currently being reviewed by our team. We'll notify you soon.`,
          priority: 'low',
          channels: ['email', 'in_app'],
        };

      case 'approved':
        return {
          title: '🎉 Request Approved!',
          message: `Great news! Your offline booking request for ${destination} (${departureDate}) has been approved. Check your email for booking details.`,
          priority: 'high',
          channels: ['email', 'sms', 'push', 'in_app'],
        };

      case 'rejected':
        return {
          title: '❌ Request Could Not Be Processed',
          message: `Unfortunately, your offline booking request for ${destination} could not be processed. ${
            reviewNotes ? `Reason: ${reviewNotes}` : 'Please contact support for more details.'
          }`,
          priority: 'high',
          channels: ['email', 'sms', 'push', 'in_app'],
        };

      case 'completed':
        return {
          title: '✈️ Booking Complete',
          message: `Your booking for ${destination} (${departureDate}) is now complete. Have a great trip!`,
          priority: 'medium',
          channels: ['email', 'in_app'],
        };

      case 'cancelled':
        return {
          title: '🚫 Request Cancelled',
          message: `Your offline booking request for ${destination} has been cancelled. If this was unexpected, please contact support.`,
          priority: 'high',
          channels: ['email', 'sms', 'in_app'],
        };

      case 'pending_submission':
      default:
        return null;
    }
  }
}

/**
 * Singleton instance
 */
export const offlineRequestNotificationHandler = new OfflineRequestNotificationHandler();

/**
 * Express middleware for handling webhook events
 */
export const offlineRequestWebhookMiddleware = async (
  req: any,
  res: any,
  next: any
) => {
  try {
    const payload = req.body as OfflineRequestWebhookPayload;

    // Validate payload
    if (!payload.requestId || !payload.userId || !payload.status || !payload.actionUrl) {
      return res.status(400).json({
        error: 'Missing required fields: requestId, userId, status, actionUrl',
      });
    }

    // Handle the notification asynchronously
    offlineRequestNotificationHandler.handleStatusChange(payload).catch((error) => {
      console.error('Webhook notification error:', error);
    });

    // Return immediately
    res.json({ success: true });
  } catch (error) {
    console.error('Webhook middleware error:', error);
    next(error);
  }
};
