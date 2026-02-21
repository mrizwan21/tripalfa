/**
 * Centralized static data exports
 */

// Supplier data for B2B admin
export * from './supplier-data';

// Re-export commonly used types for convenience
export type {
  Supplier,
  ApiVendor,
  Contract
} from './supplier-data';
