import { Notification, Booking } from '@tripalfa/shared-types';

/**
 * Test fixtures for notification tests
 */

export const createMockNotification = (overrides?: Partial<Notification>): Notification => ({
  id: 'notif_test_' + Math.random().toString(36).substr(2, 9),
  type: 'booking_created',
  title: 'Test Booking Created',
  message: 'Your booking has been created successfully.',
  userId: 'user_123',
  userName: 'John Doe',
  status: 'pending',
  priority: 'medium',
  channels: ['email', 'in_app'],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockBooking = (overrides?: Partial<Booking>): Booking => ({
  id: 'booking_' + Math.random().toString(36).substr(2, 9),
  reference: 'BK' + Date.now(),
  type: 'flight',
  status: 'pending',
  customerInfo: {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
  },
  createdByUser: {
    id: 'user_123',
    name: 'Agent Smith',
    email: 'agent@example.com',
  },
  timeline: {
    bookingDate: new Date(),
    travelDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  pricing: {
    baseAmount: 500,
    taxes: 50,
    fees: 20,
    sellingAmount: 570,
    currency: 'USD',
  },
  passengers: [
    {
      id: 'pax_1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      dateOfBirth: new Date('1990-01-01'),
    },
  ],
  itinerary: {
    flights: [],
    hotels: [],
    transfers: [],
  },
  metadata: {},
  ...overrides,
} as any);

export const mockEmailTemplate = {
  id: 'email_template_1',
  name: 'Booking Confirmation',
  subject: 'Your {bookingType} Booking is Confirmed',
  htmlBody: '<h1>Booking Confirmed</h1><p>Your {bookingType} booking {reference} is confirmed.</p>',
  textBody: 'Your {bookingType} booking {reference} is confirmed.',
  variables: ['bookingType', 'reference', 'customerName', 'travelDate'],
};

export const mockSmsTemplate = {
  id: 'sms_template_1',
  name: 'Payment Reminder',
  message: 'Payment reminder: {amount} {currency} due for booking {reference}. Reply CONFIRM to proceed.',
  variables: ['amount', 'currency', 'reference'],
};

export const mockNotificationChannels = {
  email: {
    id: 'email_channel',
    type: 'email',
    config: {
      provider: 'sendgrid',
      apiKey: 'test_key_123',
      fromAddress: 'notifications@tripalfa.com',
      fromName: 'TripAlfa',
    },
  },
  sms: {
    id: 'sms_channel',
    type: 'sms',
    config: {
      provider: 'twilio',
      accountSid: 'test_sid',
      authToken: 'test_token',
      fromNumber: '+12025551234',
    },
  },
  push: {
    id: 'push_channel',
    type: 'push',
    config: {
      provider: 'fcm',
      serverKey: 'test_server_key',
      senderId: 'test_sender_id',
    },
  },
  inApp: {
    id: 'in_app_channel',
    type: 'in_app',
    config: {},
  },
};

export const mockNotificationEvents = {
  booking_created: {
    type: 'booking_created',
    trigger: 'on_booking_creation',
    channels: ['email', 'in_app'],
    template: 'booking_created_template',
  },
  booking_confirmed: {
    type: 'booking_confirmed',
    trigger: 'on_booking_confirmation',
    channels: ['email', 'sms', 'in_app'],
    template: 'booking_confirmed_template',
  },
  payment_received: {
    type: 'payment_received',
    trigger: 'on_payment_success',
    channels: ['email', 'in_app'],
    template: 'payment_received_template',
  },
  payment_failed: {
    type: 'payment_failed',
    trigger: 'on_payment_failure',
    channels: ['email', 'sms', 'in_app'],
    template: 'payment_failed_template',
  },
};

export const mockScheduledNotificationData = {
  scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  recurring: {
    enabled: true,
    interval: 'daily',
    times: ['09:00', '17:00'],
    maxOccurrences: 5,
  },
};

export const mockNotificationWithAllChannels = (): Notification => ({
  ...createMockNotification(),
  channels: ['email', 'sms', 'push', 'in_app'],
  id: 'notif_all_channels',
});

export const mockHighPriorityNotification = (): Notification => ({
  ...createMockNotification(),
  priority: 'urgent',
  id: 'notif_urgent',
  title: 'Urgent Payment Required',
  channels: ['sms', 'email', 'push'],
});

export const mockLowPriorityNotification = (): Notification => ({
  ...createMockNotification(),
  priority: 'low',
  id: 'notif_low',
  title: 'Information Update',
  channels: ['in_app'],
});

export const notificationTestScenarios = {
  singleChannel: {
    name: 'Send to single channel',
    notification: createMockNotification({ channels: ['email'] }),
    expectedChannels: 1,
  },
  multipleChannels: {
    name: 'Send to multiple channels',
    notification: mockNotificationWithAllChannels(),
    expectedChannels: 4,
  },
  urgentPriority: {
    name: 'Send urgent notification',
    notification: mockHighPriorityNotification(),
    expectedChannels: 3,
  },
  lowPriority: {
    name: 'Send low priority notification',
    notification: mockLowPriorityNotification(),
    expectedChannels: 1,
  },
};
