// ============================================================================
// TripAlfa Shared Types - Index
// Re-exports all domain types for convenient importing
// ============================================================================

// Core Enums
export * from './enums';

// Domain Types
export * from './company';
export * from './user';
export * from './rbac';
export * from './booking';
export * from './loyalty';
// Note: hotel-deals is in src/ directory, import directly using:
// import type { AdvanceBookingTier, ... } from '@tripalfa/shared-types'
// export * from './hotel-deals';
// Note: offline-request types are not re-exported here due to naming conflicts.
// Import directly from './offline-request' if needed.
export * from './supplier';
export * from './payment';
export * from './finance';
export * from './pricing';
export * from './reference';
export * from './system';
