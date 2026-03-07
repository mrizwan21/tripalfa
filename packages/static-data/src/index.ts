/**
 * Static Data Package - Main Export
 * 
 * Provides the main exports for the static data package including
 * the StaticDataService and API server functionality.
 */

import { StaticDataService, staticDataService } from "./static-data-service.js";
export { StaticDataService, staticDataService };
export { startServer } from "./server.js";

// Re-export types for convenience
export type { Hotel, City, Country, Airport } from "./static-data-service";

// Utility functions
export { importUAEHotels } from "./scripts/import-uae-hotels";

// Version information
export const VERSION = "1.0.0";
export const API_VERSION = "1.0.0";

// Configuration
export const DEFAULT_PORT = 3002;
export const API_BASE_PATH = "/api";

// Health check endpoint
export const HEALTH_ENDPOINT = "/health";

// API endpoints
export const ENDPOINTS = {
    COUNTRIES: "/api/countries",
    CITIES: "/api/cities/:countryCode",
    HOTELS: "/api/hotels",
    HOTEL_BY_ID: "/api/hotels/:id",
    HOTEL_FULL: "/api/hotels/:id/full",
    HOTEL_SEARCH: "/api/hotels/search/:query",
    HOTELS_NEAR: "/api/hotels/near/:lat/:lon",
    HOTELS_BY_AMENITIES: "/api/hotels/amenities/:amenities",
    POPULAR_DESTINATIONS: "/api/popular-destinations",
    STATISTICS: "/api/statistics"
} as const;

/**
 * Initialize and start the static data service
 */
export async function initStaticDataService() {
    try {
        // Test database connection
        await staticDataService.getCountries();
        console.log("✅ Static Data Service initialized successfully");
        return true;
    } catch (error) {
        console.error("❌ Failed to initialize Static Data Service:", error);
        return false;
    }
}

/**
 * Graceful shutdown of the static data service
 */
export async function shutdownStaticDataService() {
    try {
        await staticDataService.close();
        console.log("✅ Static Data Service shutdown complete");
    } catch (error) {
        console.error("❌ Error during Static Data Service shutdown:", error);
    }
}

export default {
    StaticDataService,
    staticDataService,
    initStaticDataService,
    shutdownStaticDataService,
    VERSION,
    API_VERSION,
    DEFAULT_PORT,
    API_BASE_PATH,
    HEALTH_ENDPOINT,
    ENDPOINTS
};