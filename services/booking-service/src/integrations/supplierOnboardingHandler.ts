/**
 * Supplier Onboarding Event Handler
 * Processes supplier lifecycle events (registration, wallet assignment, wallet activation)
 * and dispatches admin and supplier notifications
 */

import logger from '../utils/logger';

export interface SupplierOnboardingEvent {
  eventType: string; // 'supplier_registered', 'wallet_assigned', 'wallet_activated'
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  walletId?: string;
  walletType?: string; // 'credit', 'prepaid', 'postpaid'
  activationStatus?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface SupplierNotification {
  id: string;
  recipient: string; // admin or supplier email
  recipientType: 'admin' | 'supplier'; // who receives the notification
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: string[];
  metadata: Record<string, any>;
}

/**
 * Creates supplier onboarding notifications from an event
 * Returns both admin and supplier notifications as applicable
 */
export function createSupplierOnboardingNotifications(
  event: SupplierOnboardingEvent
): SupplierNotification[] {
  const notifications: SupplierNotification[] = [];

  const baseAdminNotification: SupplierNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    recipient: process.env.ADMIN_EMAIL || 'admin@tripalfa.com',
    recipientType: 'admin',
    type: `supplier_onboarding_${event.eventType}`,
    title: '',
    message: '',
    priority: 'medium',
    channels: ['email', 'in_app'],
    metadata: {
      eventType: event.eventType,
      supplierId: event.supplierId,
      supplierName: event.supplierName,
      sourceSystem: 'supplier_onboarding',
      timestamp: event.timestamp,
    },
  };

  const baseSupplierNotification: SupplierNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    recipient: event.supplierEmail,
    recipientType: 'supplier',
    type: `supplier_onboarding_${event.eventType}`,
    title: '',
    message: '',
    priority: 'medium',
    channels: ['email', 'in_app'],
    metadata: {
      eventType: event.eventType,
      supplierId: event.supplierId,
      sourceSystem: 'supplier_onboarding',
      timestamp: event.timestamp,
    },
  };

  switch (event.eventType) {
    case 'supplier_registered':
      // Admin notification
      baseAdminNotification.title = '✅ New Supplier Registered';
      baseAdminNotification.message = `New supplier "${event.supplierName}" has been registered and requires wallet setup and approval.`;
      baseAdminNotification.priority = 'high';
      baseAdminNotification.channels = ['email', 'in_app', 'sms'];
      baseAdminNotification.metadata = {
        ...baseAdminNotification.metadata,
        requiresAction: true,
        actionType: 'review_supplier_registration',
        supplierEmail: event.supplierEmail,
      };
      notifications.push(baseAdminNotification);

      // Supplier notification
      baseSupplierNotification.title = '🎉 Welcome to TripAlfa!';
      baseSupplierNotification.message = `Your supplier account "${event.supplierName}" has been successfully registered. Please complete wallet setup to start accepting bookings.`;
      baseSupplierNotification.priority = 'high';
      baseSupplierNotification.channels = ['email', 'in_app'];
      baseSupplierNotification.metadata = {
        ...baseSupplierNotification.metadata,
        requiresAction: true,
        actionType: 'setup_wallet',
        nextSteps: ['Complete wallet configuration', 'Add payment details', 'Activate wallet'],
      };
      notifications.push(baseSupplierNotification);
      break;

    case 'wallet_assigned':
      // Admin notification
      baseAdminNotification.title = '💳 Wallet Assigned to Supplier';
      baseAdminNotification.message = `Wallet (${event.walletType}) has been assigned to supplier "${event.supplierName}". Ready for activation.`;
      baseAdminNotification.priority = 'medium';
      baseAdminNotification.channels = ['email', 'in_app'];
      baseAdminNotification.metadata = {
        ...baseAdminNotification.metadata,
        walletId: event.walletId,
        walletType: event.walletType,
        requiresAction: false,
      };
      notifications.push(baseAdminNotification);

      // Supplier notification
      baseSupplierNotification.title = '💳 Wallet Setup Complete';
      baseSupplierNotification.message = `Your ${event.walletType} wallet has been assigned. Please activate it to start accepting payments.`;
      baseSupplierNotification.priority = 'high';
      baseSupplierNotification.channels = ['email', 'in_app'];
      baseSupplierNotification.metadata = {
        ...baseSupplierNotification.metadata,
        walletId: event.walletId,
        walletType: event.walletType,
        requiresAction: true,
        actionType: 'activate_wallet',
        nextSteps: ['Review wallet configuration', 'Activate wallet', 'Start accepting bookings'],
      };
      notifications.push(baseSupplierNotification);
      break;

    case 'wallet_activated':
      // Admin notification
      baseAdminNotification.title = '✅ Supplier Wallet Activated';
      baseAdminNotification.message = `Supplier "${event.supplierName}" wallet (${event.walletType}) is now active and ready for transactions.`;
      baseAdminNotification.priority = 'medium';
      baseAdminNotification.channels = ['email', 'in_app'];
      baseAdminNotification.metadata = {
        ...baseAdminNotification.metadata,
        walletId: event.walletId,
        walletType: event.walletType,
        activationStatus: event.activationStatus,
        requiresAction: false,
      };
      notifications.push(baseAdminNotification);

      // Supplier notification
      baseSupplierNotification.title = '🚀 Wallet Activated Successfully';
      baseSupplierNotification.message = `Your wallet is now active! You can start accepting bookings and payments from TripAlfa.`;
      baseSupplierNotification.priority = 'high';
      baseSupplierNotification.channels = ['email', 'in_app'];
      baseSupplierNotification.metadata = {
        ...baseSupplierNotification.metadata,
        walletId: event.walletId,
        walletType: event.walletType,
        activationStatus: event.activationStatus,
        requiresAction: false,
        nextSteps: ['Monitor wallet balance', 'Track transactions', 'Review settlement reports'],
      };
      notifications.push(baseSupplierNotification);
      break;

    default:
      logger.warn(`Unhandled supplier onboarding event type: ${event.eventType}`);
  }

  return notifications;
}

/**
 * Processes a supplier onboarding event and returns notification data
 */
export async function processSupplierOnboardingEvent(
  event: SupplierOnboardingEvent
): Promise<{ success: boolean; notifications?: SupplierNotification[]; error?: string }> {
  try {
    if (!event.eventType || !event.supplierId || !event.supplierName || !event.supplierEmail || !event.timestamp) {
      return {
        success: false,
        error: 'Missing required event fields: eventType, supplierId, supplierName, supplierEmail, timestamp',
      };
    }

    const notifications = createSupplierOnboardingNotifications(event);

    if (!notifications || notifications.length === 0) {
      return {
        success: false,
        error: `Unable to map event type: ${event.eventType}`,
      };
    }

    logger.info(`Supplier onboarding event processed`, {
      eventType: event.eventType,
      supplierId: event.supplierId,
      supplierName: event.supplierName,
      notificationCount: notifications.length,
    });

    return {
      success: true,
      notifications,
    };
  } catch (error) {
    logger.error('Error processing supplier onboarding event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
