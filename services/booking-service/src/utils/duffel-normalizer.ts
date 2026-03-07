/**
 * Duffel Data Normalizer
 * Maps raw Duffel API responses to TripAlfa standardized frontend interfaces
 */

import { Service, ServiceType } from "../types/ancillary.js";

/**
 * Normalizes a Duffel available_service to TripAlfa Service interface
 */
export function normalizeDuffelService(duffelService: any): any {
    if (!duffelService) return null;

    // Map Duffel types to TripAlfa ServiceType
    const typeMap: Record<string, string> = {
        baggage: "baggage",
        meal: "meal",
        seat: "seat",
        cancelation: "special_request", // Duffel uses cancelation for some service protections
        change: "special_request",
        priority_boarding: "special_request",
        lounge_access: "lounge",
        wifi: "special_request",
    };

    const type = typeMap[duffelService.type] || "special_request";

    return {
        id: duffelService.id,
        type: type as any,
        productName: duffelService.metadata?.name || duffelService.type?.replace(/_/g, ' ').toUpperCase() || "Additional Service",
        description: duffelService.metadata?.description || `Additional ${duffelService.type} for your flight`,
        baseAmount: duffelService.total_amount || "0.00",
        currency: duffelService.total_currency || "USD",
        segmentIds: duffelService.segment_ids || [],
        passengerIds: duffelService.passenger_ids || [],
        maximumQuantity: duffelService.maximum_quantity || 1,
        restrictions: duffelService.metadata?.restrictions || null,
        rawDuffelService: duffelService // Keep for reference if needed
    };
}

/**
 * Normalizes a list of Duffel services
 */
export function normalizeDuffelServices(services: any[]): any[] {
    if (!services || !Array.isArray(services)) return [];
    return services.map(normalizeDuffelService).filter(Boolean);
}

/**
 * Extracts and normalizes categories from services
 */
export function extractServiceCategories(services: any[]): string[] {
    if (!services || !Array.isArray(services)) return [];
    const categories = new Set<string>();
    services.forEach(s => {
        const type = normalizeDuffelService(s)?.type;
        if (type) categories.add(type);
    });
    return Array.from(categories);
}
