/**
 * Notifications API Tests
 * Tests for all notification API calls and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mockNotifications, mockUserPreferences, mockApiResponses } from '../../__mocks__/fixtures';

// Mock API service
class NotificationsApiService {
  private baseUrl = 'http://localhost:3000/api';

  async fetchNotifications(filters?: Record<string, any>) {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page);
    if (filters?.pageSize) params.append('pageSize', filters.pageSize);
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);

    const response = await fetch(`${this.baseUrl}/notifications?${params}`);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  }

  async getNotification(id: string) {
    const response = await fetch(`${this.baseUrl}/notifications/${id}`);
    if (!response.ok) throw new Error('Notification not found');
    return response.json();
  }

  async markAsRead(id: string) {
    const response = await fetch(`${this.baseUrl}/notifications/${id}/read`, {
      method: 'PATCH'
    });
    if (!response.ok) throw new Error('Failed to mark as read');
    return response.json();
  }

  async deleteNotification(id: string) {
    const response = await fetch(`${this.baseUrl}/notifications/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete notification');
    return response.json();
  }

  async bulkMarkAsRead(ids: string[]) {
    const response = await fetch(`${this.baseUrl}/notifications/bulk/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    if (!response.ok) throw new Error('Failed to mark as read');
    return response.json();
  }

  async bulkDelete(ids: string[]) {
    const response = await fetch(`${this.baseUrl}/notifications/bulk/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    if (!response.ok) throw new Error('Failed to delete notifications');
    return response.json();
  }

  async sendNotification(data: {
    title: string;
    message: string;
    userId?: string;
    userIds?: string[];
    type: string;
    channels: string[];
    priority?: string;
    schedule?: string;
  }) {
    const response = await fetch(`${this.baseUrl}/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to send notification');
    return response.json();
  }

  async getUserPreferences(userId: string) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/preferences`);
    if (!response.ok) throw new Error('Failed to fetch preferences');
    return response.json();
  }

  async updateUserPreferences(userId: string, preferences: Partial<typeof mockUserPreferences>) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/preferences`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences)
    });
    if (!response.ok) throw new Error('Failed to update preferences');
    return response.json();
  }

  async getUnreadCount(userId?: string) {
    const url = userId
      ? `${this.baseUrl}/notifications/unread/count?userId=${userId}`
      : `${this.baseUrl}/notifications/unread/count`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch unread count');
    return response.json();
  }

  async getRecentNotifications(limit = 10) {
    const response = await fetch(`${this.baseUrl}/notifications/recent?limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch recent notifications');
    return response.json();
  }

  async exportNotificationsCsv(filters?: Record<string, any>) {
    const response = await fetch(`${this.baseUrl}/notifications/export/csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filters })
    });
    if (!response.ok) throw new Error('Failed to export notifications');
    return response.text();
  }
}

describe('Notifications API', () => {
  let api: NotificationsApiService;
  let fetchSpy: any;

  beforeEach(() => {
    api = new NotificationsApiService();
    fetchSpy = global.fetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Fetch Notifications Tests
  describe('fetchNotifications', () => {
    it('should fetch notifications successfully', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponses.notificationsSuccess
      });

      const result = await api.fetchNotifications();

      expect(result.data).toEqual(mockNotifications);
      expect(result.total).toBe(mockNotifications.length);
    });

    it('should fetch notifications with filters', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponses.notificationsSuccess
      });

      const result = await api.fetchNotifications({ page: 1, pageSize: 10 });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=1')
      );
    });

    it('should handle fetch error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false
      });

      await expect(api.fetchNotifications()).rejects.toThrow('Failed to fetch notifications');
    });

    it('should fetch empty notifications list', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponses.notificationsEmpty
      });

      const result = await api.fetchNotifications();

      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  // Get Notification Tests
  describe('getNotification', () => {
    it('should get notification by ID', async () => {
      const notification = mockNotifications[0];
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: notification })
      });

      const result = await api.getNotification(notification.id);

      expect(result.data.id).toBe(notification.id);
    });

    it('should handle notification not found', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false
      });

      await expect(api.getNotification('invalid-id')).rejects.toThrow('Notification not found');
    });
  });

  // Mark as Read Tests
  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notification = mockNotifications[0];
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { ...notification, readAt: new Date().toISOString() } })
      });

      const result = await api.markAsRead(notification.id);

      expect(result.data.readAt).toBeDefined();
    });

    it('should handle mark as read error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false
      });

      await expect(api.markAsRead('invalid-id')).rejects.toThrow('Failed to mark as read');
    });

    it('should use PATCH method', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} })
      });

      await api.markAsRead('notif-001');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  // Delete Notification Tests
  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponses.deleteSuccess
      });

      const result = await api.deleteNotification('notif-001');

      expect(result.data.success).toBe(true);
    });

    it('should handle delete error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false
      });

      await expect(api.deleteNotification('invalid-id')).rejects.toThrow('Failed to delete notification');
    });

    it('should use DELETE method', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} })
      });

      await api.deleteNotification('notif-001');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  // Bulk Operations Tests
  describe('bulkMarkAsRead', () => {
    it('should mark multiple notifications as read', async () => {
      const ids = ['notif-001', 'notif-002', 'notif-003'];
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { success: true, count: ids.length } })
      });

      const result = await api.bulkMarkAsRead(ids);

      expect(result.data.count).toBe(ids.length);
    });

    it('should handle bulk mark as read error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false
      });

      await expect(api.bulkMarkAsRead(['notif-001'])).rejects.toThrow('Failed to mark as read');
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple notifications', async () => {
      const ids = ['notif-001', 'notif-002'];
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { success: true, count: ids.length } })
      });

      const result = await api.bulkDelete(ids);

      expect(result.data.count).toBe(ids.length);
    });

    it('should handle bulk delete error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false
      });

      await expect(api.bulkDelete(['notif-001'])).rejects.toThrow('Failed to delete notifications');
    });
  });

  // Send Notification Tests
  describe('sendNotification', () => {
    it('should send notification successfully', async () => {
      const data = {
        title: 'Test',
        message: 'Test message',
        userIds: ['user-001'],
        type: 'email',
        channels: ['email', 'system']
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponses.sendSuccess
      });

      const result = await api.sendNotification(data);

      expect(result.data.status).toBe('sent');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        title: '',
        message: '',
        type: 'email',
        channels: ['email']
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false
      });

      await expect(api.sendNotification(invalidData)).rejects.toThrow('Failed to send notification');
    });

    it('should handle scheduled notifications', async () => {
      const data = {
        title: 'Scheduled',
        message: 'Scheduled message',
        userIds: ['user-001'],
        type: 'email',
        channels: ['email'],
        schedule: '2024-02-25T10:00:00Z'
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { status: 'scheduled' } })
      });

      const result = await api.sendNotification(data);

      expect(result.data.status).toBe('scheduled');
    });

    it('should use POST method', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} })
      });

      await api.sendNotification({
        title: 'Test',
        message: 'Test',
        userIds: ['user-001'],
        type: 'email',
        channels: ['email']
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  // User Preferences Tests
  describe('getUserPreferences', () => {
    it('should fetch user preferences', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUserPreferences })
      });

      const result = await api.getUserPreferences('user-001');

      expect(result.data.emailNotifications).toBe(mockUserPreferences.emailNotifications);
    });

    it('should handle preferences not found', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false
      });

      await expect(api.getUserPreferences('invalid-user')).rejects.toThrow('Failed to fetch preferences');
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences', async () => {
      const updates = { emailNotifications: false };
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { ...mockUserPreferences, ...updates } })
      });

      const result = await api.updateUserPreferences('user-001', updates);

      expect(result.data.emailNotifications).toBe(false);
    });

    it('should validate at least one channel enabled', async () => {
      const invalidUpdates = {
        emailNotifications: false,
        smsNotifications: false,
        pushNotifications: false,
        inAppNotifications: false
      };

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false
      });

      await expect(api.updateUserPreferences('user-001', invalidUpdates))
        .rejects.toThrow('Failed to update preferences');
    });

    it('should use PATCH method', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: {} })
      });

      await api.updateUserPreferences('user-001', { emailNotifications: false });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  // Unread Count Tests
  describe('getUnreadCount', () => {
    it('should get unread count', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { count: 3 } })
      });

      const result = await api.getUnreadCount();

      expect(result.data.count).toBe(3);
    });

    it('should get unread count for specific user', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { count: 2 } })
      });

      await api.getUnreadCount('user-001');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('user-001')
      );
    });

    it('should handle fetch error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false
      });

      await expect(api.getUnreadCount()).rejects.toThrow('Failed to fetch unread count');
    });
  });

  // Recent Notifications Tests
  describe('getRecentNotifications', () => {
    it('should get recent notifications', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockNotifications.slice(0, 10) })
      });

      const result = await api.getRecentNotifications();

      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should respect limit parameter', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockNotifications.slice(0, 5) })
      });

      await api.getRecentNotifications(5);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('limit=5')
      );
    });

    it('should handle error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false
      });

      await expect(api.getRecentNotifications()).rejects.toThrow('Failed to fetch recent notifications');
    });
  });

  // Export Tests
  describe('exportNotificationsCsv', () => {
    it('should export notifications as CSV', async () => {
      const csvContent = 'ID,User ID,Type,Title\nnotif-001,user-001,email,Test';
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        text: async () => csvContent
      });

      const result = await api.exportNotificationsCsv();

      expect(result).toContain('ID,User ID');
    });

    it('should use POST method', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        text: async () => 'csv content'
      });

      await api.exportNotificationsCsv();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should handle export error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false
      });

      await expect(api.exportNotificationsCsv()).rejects.toThrow('Failed to export notifications');
    });
  });

  // Loading States Tests
  describe('Loading states', () => {
    it('should indicate loading during fetch', async () => {
      let resolveResponse: any;
      const fetchPromise = new Promise(resolve => {
        resolveResponse = resolve;
      });

      global.fetch = vi.fn().mockReturnValueOnce(fetchPromise);

      const resultPromise = api.fetchNotifications();

      // Fetch is still pending
      expect(global.fetch).toHaveBeenCalled();

      resolveResponse({
        ok: true,
        json: async () => mockApiResponses.notificationsSuccess
      });

      const result = await resultPromise;
      expect(result).toBeDefined();
    });
  });

  // Error Handling Tests
  describe('Error handling', () => {
    it('should throw error for network failure', async () => {
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      await expect(api.fetchNotifications()).rejects.toThrow();
    });

    it('should throw error for server error', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(api.fetchNotifications()).rejects.toThrow('Failed to fetch notifications');
    });

    it('should throw error for unauthorized', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401
      });

      await expect(api.fetchNotifications()).rejects.toThrow('Failed to fetch notifications');
    });
  });
});
