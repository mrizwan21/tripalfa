/**
 * LiteAPI Booking Client - Legacy compatibility wrapper
 * 
 * This module provides backward compatibility for imports from './LiteAPIClient'.
 * New code should import from '../services/liteApiManager' directly.
 */

// Re-export everything from the new liteApiManager
export * from '../services/liteApiManager';

// Default export for backward compatibility
import * as LiteApiManager from '../services/liteApiManager';
export default LiteApiManager;
