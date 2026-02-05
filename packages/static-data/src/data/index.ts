/**
 * Centralized static data exports
 */

// Notification types and data
export * from './notification-types';

// Supplier data for B2B admin
export * from './supplier-data';

// Re-export commonly used types for convenience
export type {
  NotificationType,
  NotificationStatus,
  NotificationItem
} from '../types';

export type {
  Supplier,
  ApiVendor,
  Contract
} from './supplier-data';
