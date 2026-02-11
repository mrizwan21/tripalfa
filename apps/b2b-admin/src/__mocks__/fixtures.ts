/**
 * Mock data fixtures for notification tests
 */

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface MockNotification {
  id: string;
  userId: string;
  type: 'email' | 'sms' | 'push' | 'system' | 'whatsapp';
  title: string;
  message: string;
  status: 'sent' | 'pending' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  readAt?: string;
  channels: ('email' | 'sms' | 'push' | 'system')[];
  deliveryStatus: Record<string, 'sent' | 'failed' | 'pending'>;
}

export interface MockUserPreferences {
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
}

// Mock Admin User
export const mockAdminUser: MockUser = {
  id: 'admin-001',
  name: 'Admin User',
  email: 'admin@tripalfa.com',
  role: 'admin'
};

// Mock Regular User
export const mockRegularUser: MockUser = {
  id: 'user-001',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user'
};

// Mock Support User
export const mockSupportUser: MockUser = {
  id: 'support-001',
  name: 'Support Agent',
  email: 'support@tripalfa.com',
  role: 'support'
};

// Mock Notifications
export const mockNotifications: MockNotification[] = [
  {
    id: 'notif-001',
    userId: 'user-001',
    type: 'email',
    title: 'Booking Confirmation',
    message: 'Your booking has been confirmed',
    status: 'sent',
    priority: 'high',
    createdAt: '2024-02-08T10:00:00Z',
    readAt: '2024-02-08T10:15:00Z',
    channels: ['email', 'system'],
    deliveryStatus: {
      email: 'sent',
      system: 'sent'
    }
  },
  {
    id: 'notif-002',
    userId: 'user-002',
    type: 'sms',
    title: 'Flight Alert',
    message: 'Your flight has been delayed',
    status: 'sent',
    priority: 'urgent',
    createdAt: '2024-02-08T09:30:00Z',
    channels: ['sms', 'push'],
    deliveryStatus: {
      sms: 'sent',
      push: 'sent'
    }
  },
  {
    id: 'notif-003',
    userId: 'user-003',
    type: 'push',
    title: 'New Promotion',
    message: 'Check out our latest deals',
    status: 'pending',
    priority: 'medium',
    createdAt: '2024-02-08T08:00:00Z',
    channels: ['push'],
    deliveryStatus: {
      push: 'pending'
    }
  },
  {
    id: 'notif-004',
    userId: 'user-001',
    type: 'system',
    title: 'Account Verification',
    message: 'Please verify your email address',
    status: 'failed',
    priority: 'high',
    createdAt: '2024-02-07T15:00:00Z',
    channels: ['email', 'system'],
    deliveryStatus: {
      email: 'failed',
      system: 'sent'
    }
  },
  {
    id: 'notif-005',
    userId: 'user-004',
    type: 'whatsapp',
    title: 'Booking Reminder',
    message: 'Your booking is coming up in 24 hours',
    status: 'sent',
    priority: 'medium',
    createdAt: '2024-02-08T07:00:00Z',
    readAt: '2024-02-08T07:30:00Z',
    channels: ['system'],
    deliveryStatus: {
      system: 'sent',
      whatsapp: 'sent'
    }
  }
];

// Mock Unread Notifications (recent)
export const mockUnreadNotifications: MockNotification[] = [
  {
    id: 'unread-001',
    userId: 'user-001',
    type: 'email',
    title: 'Payment Received',
    message: 'We received your payment',
    status: 'sent',
    priority: 'high',
    createdAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
    channels: ['email', 'system'],
    deliveryStatus: {
      email: 'sent',
      system: 'sent'
    }
  },
  {
    id: 'unread-002',
    userId: 'user-001',
    type: 'system',
    title: 'Account Update',
    message: 'Your profile has been updated',
    status: 'sent',
    priority: 'medium',
    createdAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    channels: ['system'],
    deliveryStatus: {
      system: 'sent'
    }
  },
  {
    id: 'unread-003',
    userId: 'user-001',
    type: 'push',
    title: 'Special Offer',
    message: 'Exclusive offer just for you',
    status: 'sent',
    priority: 'low',
    createdAt: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
    channels: ['push'],
    deliveryStatus: {
      push: 'sent'
    }
  }
];

// Mock User Preferences
export const mockUserPreferences: MockUserPreferences = {
  userId: 'user-001',
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  inAppNotifications: true
};

// Mock User Preferences - All Disabled
export const mockUserPreferencesAllDisabled: MockUserPreferences = {
  userId: 'user-002',
  emailNotifications: false,
  smsNotifications: false,
  pushNotifications: false,
  inAppNotifications: false
};

// Mock Notification Template
export const mockNotificationTemplate = {
  id: 'template-001',
  name: 'Booking Confirmation',
  subject: 'Your booking confirmation - {{bookingId}}',
  body: 'Dear {{customerName}}, your booking {{bookingId}} has been confirmed for {{hotelName}} on {{checkInDate}}.',
  variables: ['bookingId', 'customerName', 'hotelName', 'checkInDate']
};

// Mock Notification Templates List
export const mockNotificationTemplates = [
  mockNotificationTemplate,
  {
    id: 'template-002',
    name: 'Payment Reminder',
    subject: 'Payment reminder for {{bookingId}}',
    body: 'Please complete your payment for booking {{bookingId}} by {{paymentDeadline}}.'
  },
  {
    id: 'template-003',
    name: 'Flight Alert',
    subject: 'Flight update for {{flightNumber}}',
    body: 'Your flight {{flightNumber}} has been updated. New status: {{flightStatus}}'
  }
];

// Helper function to create a notification with defaults
export const createMockNotification = (
  overrides: Partial<MockNotification> = {}
): MockNotification => {
  return {
    id: `notif-${Date.now()}`,
    userId: 'user-001',
    type: 'email',
    title: 'Test Notification',
    message: 'This is a test notification',
    status: 'sent',
    priority: 'medium',
    createdAt: new Date().toISOString(),
    channels: ['email'],
    deliveryStatus: {
      email: 'sent'
    },
    ...overrides
  };
};

// Helper function to create multiple notifications
export const createMockNotifications = (count: number): MockNotification[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockNotification({
      id: `notif-${i + 1000}`,
      userId: `user-${(i % 5) + 1}`,
      title: `Notification ${i + 1}`,
      status: i % 3 === 0 ? 'failed' : i % 2 === 0 ? 'pending' : 'sent',
      createdAt: new Date(Date.now() - i * 3600000).toISOString()
    })
  );
};

// Mock API responses
export const mockApiResponses = {
  notificationsSuccess: {
    data: mockNotifications,
    total: mockNotifications.length,
    page: 1,
    pageSize: 10
  },
  notificationsEmpty: {
    data: [],
    total: 0,
    page: 1,
    pageSize: 10
  },
  preferencesSuccess: {
    data: mockUserPreferences
  },
  notificationSuccess: {
    data: mockNotifications[0]
  },
  markAsReadSuccess: {
    data: { success: true }
  },
  deleteSuccess: {
    data: { success: true }
  },
  sendSuccess: {
    data: { 
      id: `notif-${Date.now()}`,
      status: 'sent',
      message: 'Notification sent successfully'
    }
  },
  error: {
    error: 'An error occurred',
    message: 'Something went wrong'
  }
};
