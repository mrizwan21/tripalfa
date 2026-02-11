/**
 * Mock handlers for notification API endpoints
 * Uses Vitest mocking with stateful mock data from fixtures
 */

import { vi } from 'vitest';
import {
  MockNotification,
  mockNotifications,
  mockUnreadNotifications,
  mockUserPreferences,
  mockNotificationTemplates
} from './fixtures';

// In-memory mock store for CRUD operations
let mockNotificationStore = [...mockNotifications];
let mockPreferencesStore: Record<string, any> = {
  'user-001': mockUserPreferences,
  'user-002': { userId: 'user-002', emailNotifications: false, smsNotifications: true, pushNotifications: false, inAppNotifications: true },
  'user-003': { userId: 'user-003', emailNotifications: true, smsNotifications: true, pushNotifications: true, inAppNotifications: false }
};

/**
 * Filter notifications based on provided filters
 */
function filterNotifications(filters?: Record<string, any>) {
  let result = [...mockNotificationStore];

  if (filters?.userId) {
    result = result.filter(n => n.userId === filters.userId);
  }
  
  if (filters?.type) {
    result = result.filter(n => n.type === filters.type);
  }
  
  if (filters?.status) {
    result = result.filter(n => n.status === filters.status);
  }
  
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    result = result.filter(n =>
      n.title.toLowerCase().includes(search) ||
      n.message.toLowerCase().includes(search)
    );
  }
  
  if (filters?.startDate) {
    result = result.filter(n => new Date(n.createdAt) >= new Date(filters.startDate));
  }
  
  if (filters?.endDate) {
    result = result.filter(n => new Date(n.createdAt) <= new Date(filters.endDate));
  }

  return result;
}

// Mock API handlers as Vitest mock functions
export const notificationsHandlers = {
  /**
   * Get all notifications with pagination and filtering
   */
  getNotifications: vi.fn(async (params?: any) => {
    const filtered = filterNotifications(params);
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = filtered.slice(start, end);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      data: paginatedData,
      total: filtered.length,
      page,
      pageSize
    };
  }),

  /**
   * Get notification by ID
   */
  getNotificationById: vi.fn(async (id: string) => {
    const notification = mockNotificationStore.find(n => n.id === id);
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
    return { data: notification };
  }),

  /**
   * Mark notification as read
   */
  markAsRead: vi.fn(async (id: string) => {
    const notification = mockNotificationStore.find(n => n.id === id);
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    notification.readAt = new Date().toISOString();
    
    await new Promise(resolve => setTimeout(resolve, 100));
    return { data: notification };
  }),

  /**
   * Mark multiple notifications as read
   */
  bulkMarkAsRead: vi.fn(async (ids: string[]) => {
    mockNotificationStore = mockNotificationStore.map(n => {
      if (ids.includes(n.id)) {
        return { ...n, readAt: new Date().toISOString() };
      }
      return n;
    });
    
    await new Promise(resolve => setTimeout(resolve, 150));
    return { data: { success: true, count: ids.length } };
  }),

  /**
   * Delete notification
   */
  deleteNotification: vi.fn(async (id: string) => {
    const index = mockNotificationStore.findIndex(n => n.id === id);
    
    if (index === -1) {
      throw new Error('Notification not found');
    }
    
    mockNotificationStore.splice(index, 1);
    
    await new Promise(resolve => setTimeout(resolve, 100));
    return { data: { success: true } };
  }),

  /**
   * Delete multiple notifications
   */
  bulkDelete: vi.fn(async (ids: string[]) => {
    mockNotificationStore = mockNotificationStore.filter(n => !ids.includes(n.id));
    
    await new Promise(resolve => setTimeout(resolve, 150));
    return { data: { success: true, count: ids.length } };
  }),

  /**
   * Send notification
   */
  sendNotification: vi.fn(async (payload: any) => {
    const newNotification: MockNotification = {
      id: `notif-${Date.now()}`,
      userId: payload.userIds?.[0] || payload.userId || 'user-001',
      type: payload.type || 'email',
      title: payload.title,
      message: payload.message,
      priority: payload.priority || 'medium',
      status: (payload.schedule ? 'pending' : 'sent') as 'sent' | 'pending' | 'failed',
      createdAt: new Date().toISOString(),
      channels: payload.channels || [],
      deliveryStatus: (payload.channels || []).reduce((acc: Record<string, string>, ch: string) => {
        acc[ch] = payload.schedule ? 'pending' : 'sent';
        return acc;
      }, {})
    };
    
    mockNotificationStore.push(newNotification);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    return { 
      data: { 
        id: newNotification.id,
        status: newNotification.status,
        message: `Notification ${payload.schedule ? 'scheduled' : 'sent'} successfully`
      }
    };
  }),

  /**
   * Get user preferences
   */
  getUserPreferences: vi.fn(async (userId: string) => {
    const prefs = mockPreferencesStore[userId] || {
      userId,
      emailNotifications: true,
      smsNotifications: true,
      pushNotifications: true,
      inAppNotifications: true
    };
    
    await new Promise(resolve => setTimeout(resolve, 50));
    return { data: prefs };
  }),

  /**
   * Update user preferences
   */
  updateUserPreferences: vi.fn(async (userId: string, prefs: any) => {
    const currentPrefs = mockPreferencesStore[userId] || { userId };
    
    // Validate at least one channel is enabled
    const updatedPrefs = { ...currentPrefs, ...prefs };
    const anyEnabled = 
      updatedPrefs.emailNotifications ||
      updatedPrefs.smsNotifications ||
      updatedPrefs.pushNotifications ||
      updatedPrefs.inAppNotifications;
    
    if (!anyEnabled) {
      throw new Error('At least one notification channel must be enabled');
    }
    
    mockPreferencesStore[userId] = { userId, ...updatedPrefs };
    
    await new Promise(resolve => setTimeout(resolve, 150));
    return { data: mockPreferencesStore[userId] };
  }),

  /**
   * Get unread notification count
   */
  getUnreadCount: vi.fn(async (userId?: string) => {
    let count = 0;
    
    if (userId) {
      count = mockNotificationStore.filter(n => n.userId === userId && !n.readAt).length;
    } else {
      count = mockNotificationStore.filter(n => !n.readAt).length;
    }
    
    await new Promise(resolve => setTimeout(resolve, 50));
    return { data: { count } };
  }),

  /**
   * Get recent notifications for bell dropdown
   */
  getRecentNotifications: vi.fn(async (limit: number = 10) => {
    const recent = mockNotificationStore
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
    
    await new Promise(resolve => setTimeout(resolve, 50));
    return { data: recent };
  }),

  /**
   * Export notifications as CSV
   */
  exportNotifications: vi.fn(async (filters?: any) => {
    const filtered = filterNotifications(filters);
    
    const csv = [
      'ID,User ID,Type,Title,Status,Priority,Created',
      ...filtered.map(n => 
        `${n.id},${n.userId},${n.type},"${n.title}",${n.status},${n.priority},${n.createdAt}`
      )
    ].join('\n');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    return csv;
  }),

  /**
   * Reset mock store to initial state (useful for testing)
   */
  resetMockStore: vi.fn(() => {
    mockNotificationStore = [...mockNotifications];
    mockPreferencesStore = {
      'user-001': mockUserPreferences,
      'user-002': { userId: 'user-002', emailNotifications: false, smsNotifications: true, pushNotifications: false, inAppNotifications: true },
      'user-003': { userId: 'user-003', emailNotifications: true, smsNotifications: true, pushNotifications: true, inAppNotifications: false }
    };
  })
};
