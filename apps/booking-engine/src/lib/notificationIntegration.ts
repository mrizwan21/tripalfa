/**
 * Notification Integration Helpers
 *
 * This module provides utilities for integrating the notification system
 * with the offline booking request workflow.
 */

/**
 * Status change event types for offline requests
 */
export const OFFLINE_REQUEST_STATUSES = {
  PENDING_SUBMISSION: "pending_submission",
  SUBMITTED: "submitted",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

/**
 * Generate notification based on offline request status
 */
export function generateNotificationForStatus(
  status: string,
  requestData: {
    requestId: string;
    destination?: string;
    departureDate?: string;
    passengers?: number;
    reviewNotes?: string;
  },
) {
  const {
    requestId,
    destination = "your trip",
    departureDate = "the scheduled date",
    reviewNotes,
  } = requestData;

  const notificationMap: Record<string, any> = {
    [OFFLINE_REQUEST_STATUSES.SUBMITTED]: {
      type: "offline_request_update",
      title: "✅ Request Received",
      message: `Your offline booking request for ${destination} (${departureDate}) has been received and is now under review.`,
      priority: "medium",
      channels: ["email", "push", "in_app"],
      icon: "📝",
    },
    [OFFLINE_REQUEST_STATUSES.UNDER_REVIEW]: {
      type: "offline_request_update",
      title: "👀 Request Under Review",
      message: `Your offline booking request for ${destination} is currently being reviewed by our team. We'll notify you soon.`,
      priority: "low",
      channels: ["email", "in_app"],
      icon: "⏳",
    },
    [OFFLINE_REQUEST_STATUSES.APPROVED]: {
      type: "offline_request_update",
      title: "🎉 Request Approved!",
      message: `Great news! Your offline booking request for ${destination} (${departureDate}) has been approved. Check your email for booking details.`,
      priority: "high",
      channels: ["email", "sms", "push", "in_app"],
      icon: "✅",
    },
    [OFFLINE_REQUEST_STATUSES.REJECTED]: {
      type: "offline_request_update",
      title: "❌ Request Could Not Be Processed",
      message: `Unfortunately, your offline booking request for ${destination} could not be processed. ${
        reviewNotes
          ? `Reason: ${reviewNotes}`
          : "Please contact support for more details."
      }`,
      priority: "high",
      channels: ["email", "sms", "push", "in_app"],
      icon: "❌",
    },
    [OFFLINE_REQUEST_STATUSES.COMPLETED]: {
      type: "offline_request_update",
      title: "✈️ Booking Complete",
      message: `Your booking for ${destination} (${departureDate}) is now complete. Have a great trip!`,
      priority: "medium",
      channels: ["email", "in_app"],
      icon: "✈️",
    },
    [OFFLINE_REQUEST_STATUSES.CANCELLED]: {
      type: "offline_request_update",
      title: "🚫 Request Cancelled",
      message: `Your offline booking request for ${destination} has been cancelled. If this was unexpected, please contact support.`,
      priority: "high",
      channels: ["email", "sms", "in_app"],
      icon: "🚫",
    },
  };

  return notificationMap[status] || null;
}

/**
 * Create webhook payload for offline request status change
 */
export function createOfflineRequestWebhookPayload(
  requestId: string,
  userId: string,
  status: string,
  tripDetails?: {
    destination?: string;
    departureDate?: string;
    returnDate?: string;
    passengers?: number;
  },
  reviewNotes?: string,
) {
  return {
    requestId,
    userId,
    status,
    tripDetails,
    reviewNotes,
    actionUrl: `/bookings/requests/${requestId}`,
  };
}

/**
 * Send notification via API
 */
export async function sendNotificationAPI(
  apiBaseUrl: string,
  token: string,
  notification: {
    userId: string;
    type: string;
    title: string;
    message: string;
    priority: string;
    channels: string[];
    actionUrl?: string;
    data?: any;
  },
) {
  const response = await fetch(`${apiBaseUrl}/notifications/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(notification),
  });

  if (!response.ok) {
    throw new Error(`Failed to send notification: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Trigger webhook for offline request status change
 */
export async function triggerOfflineRequestWebhook(
  webhookUrl: string,
  payload: any,
) {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Notify admin about new offline request
 */
export async function notifyAdminNewRequest(
  apiBaseUrl: string,
  token: string,
  requestData: {
    requestId: string;
    userId: string;
    destination?: string;
    departureDate?: string;
    passengers?: number;
  },
) {
  const {
    requestId,
    userId,
    destination = "Unknown",
    departureDate = "TBD",
    passengers = 0,
  } = requestData;

  const notification = {
    userId: "admin", // Would be replaced with actual admin user ID
    type: "approval_pending",
    title: "New Offline Request Submitted",
    message: `A new offline booking request has been submitted for ${destination} (Departure: ${departureDate}, Passengers: ${passengers}). Please review it.`,
    priority: "high",
    channels: ["email", "push"],
    actionUrl: `/admin/requests/${requestId}`,
    data: {
      requestId,
      userId,
      destination,
      departureDate,
      passengers,
    },
  };

  return sendNotificationAPI(apiBaseUrl, token, notification);
}

/**
 * Listen for real-time notifications via WebSocket
 */
export function listenForNotifications(
  socketUrl: string,
  token: string,
  userId: string,
  onNotification: (notification: any) => void,
  onError?: (error: any) => void,
) {
  const socket = new WebSocket(
    `${socketUrl}?token=${encodeURIComponent(token)}`,
  );

  socket.addEventListener("open", () => {
    console.log("WebSocket connected");
    socket.send(
      JSON.stringify({
        type: "subscribe",
        userId,
      }),
    );
  });

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "notification:new") {
        onNotification(data.notification);
      }
    } catch (err) {
      console.error("Failed to parse WebSocket message:", err);
    }
  });

  socket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
    if (onError) onError(error);
  });

  socket.addEventListener("close", () => {
    console.log("WebSocket disconnected");
  });

  return socket;
}

/**
 * Format notification for UI display
 */
export function formatNotificationForUI(notification: any) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    priority: notification.priority || "medium",
    channels: notification.channels || [],
    read: !!notification.readAt,
    createdAt: notification.createdAt || new Date().toISOString(),
    icon: getNotificationIcon(notification.type),
    actionUrl: notification.actionUrl,
    color: getPriorityColor(notification.priority),
  };
}

/**
 * Get icon emoji based on notification type
 */
export function getNotificationIcon(type: string): string {
  const iconMap: Record<string, string> = {
    offline_request_update: "📝",
    price_alert: "💰",
    booking_reminder: "🛫",
    approval_pending: "⏳",
    payment_confirmation: "💳",
    booking_confirmation: "✅",
    error: "❌",
  };
  return iconMap[type] || "📬";
}

/**
 * Get color class based on priority
 */
export function getPriorityColor(priority: string): string {
  const colorMap: Record<string, string> = {
    low: "bg-blue-100 text-blue-800 border-blue-300",
    medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
    high: "bg-red-100 text-red-800 border-red-300",
    urgent: "bg-red-600 text-white border-red-700",
  };
  return colorMap[priority] || colorMap.medium;
}

/**
 * Batch send notifications to multiple users
 */
export async function sendBulkNotifications(
  apiBaseUrl: string,
  token: string,
  userIds: string[],
  notification: {
    type: string;
    title: string;
    message: string;
    priority: string;
    channels: string[];
    actionUrl?: string;
    data?: any;
  },
) {
  const promises = userIds.map((userId) =>
    sendNotificationAPI(apiBaseUrl, token, { userId, ...notification }),
  );

  return Promise.allSettled(promises);
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  apiBaseUrl: string,
  token: string,
  notificationId: string,
) {
  const response = await fetch(
    `${apiBaseUrl}/notifications/${notificationId}/read`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to mark notification as read: ${response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Delete notification
 */
export async function deleteNotification(
  apiBaseUrl: string,
  token: string,
  notificationId: string,
) {
  const response = await fetch(
    `${apiBaseUrl}/notifications/${notificationId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to delete notification: ${response.statusText}`);
  }

  return response.json();
}
