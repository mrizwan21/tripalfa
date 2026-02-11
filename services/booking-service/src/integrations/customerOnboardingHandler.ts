/**
 * Customer Onboarding Event Handler
 * Processes customer lifecycle events (registration, profile completion, verification, payment)
 * and dispatches admin and customer notifications
 */

import logger from '../utils/logger';

export interface CustomerOnboardingEvent {
  eventType: string; // 'customer_registered', 'profile_completed', 'account_verified', 'payment_method_added'
  customerId: string;
  customerName: string;
  customerEmail: string;
  phoneNumber?: string;
  profileData?: {
    firstName?: string;
    lastName?: string;
    country?: string;
    preferredLanguage?: string;
  };
  paymentMethod?: string; // 'credit_card', 'debit_card', 'digital_wallet'
  verificationMethod?: string; // 'email', 'sms', 'phone'
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CustomerNotification {
  id: string;
  recipient: string; // admin or customer email
  recipientType: 'admin' | 'customer'; // who receives the notification
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: string[];
  metadata: Record<string, any>;
}

/**
 * Creates customer onboarding notifications from an event
 * Returns both admin and customer notifications as applicable
 */
export function createCustomerOnboardingNotifications(
  event: CustomerOnboardingEvent
): CustomerNotification[] {
  const notifications: CustomerNotification[] = [];

  const baseAdminNotification: CustomerNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    recipient: process.env.ADMIN_EMAIL || 'admin@tripalfa.com',
    recipientType: 'admin',
    type: `customer_onboarding_${event.eventType}`,
    title: '',
    message: '',
    priority: 'medium',
    channels: ['email', 'in_app'],
    metadata: {
      eventType: event.eventType,
      customerId: event.customerId,
      customerName: event.customerName,
      customerEmail: event.customerEmail,
      sourceSystem: 'customer_onboarding',
      timestamp: event.timestamp,
    },
  };

  const baseCustomerNotification: CustomerNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    recipient: event.customerEmail,
    recipientType: 'customer',
    type: `customer_onboarding_${event.eventType}`,
    title: '',
    message: '',
    priority: 'medium',
    channels: ['email', 'in_app'],
    metadata: {
      eventType: event.eventType,
      customerId: event.customerId,
      sourceSystem: 'customer_onboarding',
      timestamp: event.timestamp,
    },
  };

  switch (event.eventType) {
    case 'customer_registered':
      // Admin notification
      baseAdminNotification.title = '👤 New Customer Registered';
      baseAdminNotification.message = `New customer "${event.customerName}" has registered. Email: ${event.customerEmail}`;
      baseAdminNotification.priority = 'medium';
      baseAdminNotification.channels = ['email', 'in_app'];
      baseAdminNotification.metadata = {
        ...baseAdminNotification.metadata,
        requiresAction: false,
        registrationSource: event.metadata?.registrationSource || 'web',
      };
      notifications.push(baseAdminNotification);

      // Customer notification
      baseCustomerNotification.title = '🎉 Welcome to TripAlfa!';
      baseCustomerNotification.message = `Welcome ${event.profileData?.firstName || 'to our platform'}! Your account has been successfully created. Complete your profile to unlock exclusive deals.`;
      baseCustomerNotification.priority = 'high';
      baseCustomerNotification.channels = ['email', 'in_app'];
      baseCustomerNotification.metadata = {
        ...baseCustomerNotification.metadata,
        requiresAction: true,
        nextSteps: ['Complete your profile', 'Add a payment method', 'Browse deals'],
      };
      notifications.push(baseCustomerNotification);
      break;

    case 'profile_completed':
      // Admin notification
      baseAdminNotification.title = '✅ Customer Profile Completed';
      baseAdminNotification.message = `Customer "${event.customerName}" has completed their profile and is ready to book.`;
      baseAdminNotification.priority = 'low';
      baseAdminNotification.channels = ['email', 'in_app'];
      baseAdminNotification.metadata = {
        ...baseAdminNotification.metadata,
        requiresAction: false,
        completedFields: Object.keys(event.profileData || {}).join(', '),
      };
      notifications.push(baseAdminNotification);

      // Customer notification
      baseCustomerNotification.title = '🎯 Profile Complete!';
      baseCustomerNotification.message = `Great! Your profile is now complete. You can start booking flights and hotels immediately.`;
      baseCustomerNotification.priority = 'medium';
      baseCustomerNotification.channels = ['email', 'in_app'];
      baseCustomerNotification.metadata = {
        ...baseCustomerNotification.metadata,
        requiresAction: true,
        nextSteps: ['Add a payment method', 'Start booking', 'Check out our hot deals'],
      };
      notifications.push(baseCustomerNotification);
      break;

    case 'account_verified':
      // Admin notification
      baseAdminNotification.title = '🔐 Customer Account Verified';
      baseAdminNotification.message = `Customer "${event.customerName}" account has been verified via ${event.verificationMethod || 'email'}.`;
      baseAdminNotification.priority = 'low';
      baseAdminNotification.channels = ['email', 'in_app'];
      baseAdminNotification.metadata = {
        ...baseAdminNotification.metadata,
        verificationMethod: event.verificationMethod,
        requiresAction: false,
      };
      notifications.push(baseAdminNotification);

      // Customer notification
      baseCustomerNotification.title = '✨ Account Verified!';
      baseCustomerNotification.message = `Your account has been verified successfully. You now have full access to all TripAlfa features and can proceed with bookings.`;
      baseCustomerNotification.priority = 'medium';
      baseCustomerNotification.channels = ['email', 'in_app'];
      baseCustomerNotification.metadata = {
        ...baseCustomerNotification.metadata,
        verificationMethod: event.verificationMethod,
        requiresAction: true,
        nextSteps: ['Add a payment method', 'Start booking flights', 'Start booking hotels'],
      };
      notifications.push(baseCustomerNotification);
      break;

    case 'payment_method_added':
      // Admin notification
      baseAdminNotification.title = '💳 Payment Method Added';
      baseAdminNotification.message = `Customer "${event.customerName}" has added a ${event.paymentMethod || 'payment method'} to their account.`;
      baseAdminNotification.priority = 'low';
      baseAdminNotification.channels = ['email', 'in_app'];
      baseAdminNotification.metadata = {
        ...baseAdminNotification.metadata,
        paymentMethod: event.paymentMethod,
        requiresAction: false,
      };
      notifications.push(baseAdminNotification);

      // Customer notification
      baseCustomerNotification.title = '💰 Payment Method Saved';
      baseCustomerNotification.message = `Your ${event.paymentMethod || 'payment method'} has been securely saved. You can now complete your bookings with ease.`;
      baseCustomerNotification.priority = 'medium';
      baseCustomerNotification.channels = ['email', 'in_app'];
      baseCustomerNotification.metadata = {
        ...baseCustomerNotification.metadata,
        paymentMethod: event.paymentMethod,
        requiresAction: true,
        nextSteps: ['Browse flight deals', 'Browse hotel deals', 'Create your first booking'],
      };
      notifications.push(baseCustomerNotification);
      break;

    default:
      logger.warn(`Unhandled customer onboarding event type: ${event.eventType}`);
  }

  return notifications;
}

/**
 * Processes a customer onboarding event and returns notification data
 */
export async function processCustomerOnboardingEvent(
  event: CustomerOnboardingEvent
): Promise<{ success: boolean; notifications?: CustomerNotification[]; error?: string }> {
  try {
    if (!event.eventType || !event.customerId || !event.customerName || !event.customerEmail || !event.timestamp) {
      return {
        success: false,
        error: 'Missing required event fields: eventType, customerId, customerName, customerEmail, timestamp',
      };
    }

    const notifications = createCustomerOnboardingNotifications(event);

    if (!notifications || notifications.length === 0) {
      return {
        success: false,
        error: `Unable to map event type: ${event.eventType}`,
      };
    }

    logger.info(`Customer onboarding event processed`, {
      eventType: event.eventType,
      customerId: event.customerId,
      customerName: event.customerName,
      notificationCount: notifications.length,
    });

    return {
      success: true,
      notifications,
    };
  } catch (error) {
    logger.error('Error processing customer onboarding event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
