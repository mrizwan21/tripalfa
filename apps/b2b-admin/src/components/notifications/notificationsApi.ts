/**
 * Notifications API Service
 * Handles all notification-related API calls
 */

export interface NotificationFilters {
  page?: number;
  pageSize?: number;
  userId?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface SendNotificationPayload {
  title: string;
  message: string;
  userId?: string;
  userIds?: string[];
  type: string;
  channels: string[];
  priority?: string;
  schedule?: string;
  template?: string;
}

export interface UserPreferencesUpdate {
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  pushNotifications?: boolean;
  inAppNotifications?: boolean;
}

export class NotificationsApiService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    }
  }

  /**
   * Fetch notifications with optional filters
   */
  async fetchNotifications(filters?: NotificationFilters) {
    const params = new URLSearchParams();
    
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.search) params.append('search', filters.search);

    const url = `${this.baseUrl}/notifications?${params.toString()}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }
    
    return response.json();
  }

  /**
   * Get a single notification by ID
   */
  async getNotification(id: string) {
    const response = await fetch(`${this.baseUrl}/notifications/${id}`);
    
    if (!response.ok) {
      throw new Error('Notification not found');
    }
    
    return response.json();
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string) {
    const response = await fetch(`${this.baseUrl}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark as read');
    }
    
    return response.json();
  }

  /**
   * Mark multiple notifications as read
   */
  async bulkMarkAsRead(ids: string[]) {
    const response = await fetch(`${this.baseUrl}/notifications/bulk/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids })
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark as read');
    }
    
    return response.json();
  }

  /**
   * Delete a notification
   */
  async deleteNotification(id: string) {
    const response = await fetch(`${this.baseUrl}/notifications/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }
    
    return response.json();
  }

  /**
   * Delete multiple notifications
   */
  async bulkDelete(ids: string[]) {
    const response = await fetch(`${this.baseUrl}/notifications/bulk/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ids })
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete notifications');
    }
    
    return response.json();
  }

  /**
   * Send a new notification
   */
  async sendNotification(data: SendNotificationPayload) {
    const response = await fetch(`${this.baseUrl}/notifications/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to send notification');
    }
    
    return response.json();
  }

  /**
   * Get user notification preferences
   */
  async getUserPreferences(userId: string) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/preferences`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch preferences');
    }
    
    return response.json();
  }

  /**
   * Update user notification preferences
   */
  async updateUserPreferences(userId: string, preferences: UserPreferencesUpdate) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/preferences`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferences)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update preferences');
    }
    
    return response.json();
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId?: string) {
    const url = userId
      ? `${this.baseUrl}/notifications/unread/count?userId=${userId}`
      : `${this.baseUrl}/notifications/unread/count`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }
    
    return response.json();
  }

  /**
   * Get recent notifications for bell dropdown
   */
  async getRecentNotifications(limit = 10) {
    const response = await fetch(`${this.baseUrl}/notifications/recent?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch recent notifications');
    }
    
    return response.json();
  }

  /**
   * Export notifications as CSV
   */
  async exportNotificationsCsv(filters?: NotificationFilters) {
    const response = await fetch(`${this.baseUrl}/notifications/export/csv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filters })
    });
    
    if (!response.ok) {
      throw new Error('Failed to export notifications');
    }
    
    return response.text();
  }
}

// Export singleton instance
export const notificationsApi = new NotificationsApiService();
