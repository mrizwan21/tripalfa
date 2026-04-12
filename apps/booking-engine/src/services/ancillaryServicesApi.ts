/**
 * Ancillary Services API Integration
 * Type-safe API client for ancillary services endpoints
 *
 * Routes through centralized API Manager for consistency
 */

import type { api as ApiClientInstance } from "../lib/api";

// Lazy import to avoid circular dependency
type ApiClient = typeof ApiClientInstance;
let api: ApiClient | undefined;
function getApi() {
  if (!api) api = require("../lib/api").api as ApiClient;
  return api;
}

export type ServiceType =
  | "baggage"
  | "meal"
  | "seat"
  | "special_request"
  | "lounge"
  | "insurance";

export interface Service {
  id: string;
  type: ServiceType;
  productName: string;
  description: string;
  baseAmount: string;
  currency: string;
  segmentIds: string[];
  passengerIds: string[];
  maximumQuantity: number;
  restrictions?: {
    minQuantity: number;
    maxQuantity: number;
    passengers?: string[];
    segments?: string[];
  };
}

export interface ServiceCategory {
  type: ServiceType;
  name: string;
  description: string;
  icon?: string;
  applicableSegments: "all" | "outbound" | "return" | "specific";
  applicablePassengers: "all" | "specific";
  maxQuantityPerPassenger: number;
}

export interface AncillaryServiceResponse {
  success: boolean;
  data: {
    services: Service[];
    categories: ServiceType[];
    provider: string;
    environment: string;
    currentServices?: Service[];
  };
  timestamp: string;
}

export interface ServiceSelection {
  id: string;
  quantity: number;
  passengerIds?: string[];
  segmentIds?: string[];
}

interface AncillaryErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

class AncillaryServicesApi {
  /**
   * Get available services during booking flow
   * @param offerId Offer ID
   * @param serviceType Optional filter by service type
   */
  async getServicesForBooking(
    offerId: string,
    serviceType?: ServiceType,
  ): Promise<AncillaryServiceResponse> {
    const result = await api.get<any>(
      `/api/flights/ancillary/services?offerId=${offerId}${serviceType ? `&serviceType=${serviceType}` : ""}`,
    );
    return result;
  }

  /**
   * Get available services for post-booking modifications
   * @param orderId Order ID
   * @param serviceType Optional filter by service type
   */
  async getServicesForOrder(
    orderId: string,
    serviceType?: ServiceType,
  ): Promise<AncillaryServiceResponse & { currentServices: Service[] }> {
    const result = await api.get<any>(
      `/api/flights/ancillary/services?orderId=${orderId}${serviceType ? `&serviceType=${serviceType}` : ""}`,
    );
    return result;
  }

  /**
   * Select services during booking
   * @param offerId Offer ID
   * @param services Services to select
   */
  async selectServicesForBooking(
    offerId: string,
    services: ServiceSelection[],
  ): Promise<{
    success: boolean;
    data: {
      offerId: string;
      selectedServices: ServiceSelection[];
      totalAmount: string;
      currency: string;
    };
    message: string;
    servicesCount: number;
    timestamp: string;
  }> {
    const result = await api.post<any>("/api/flights/ancillary/services/select", {
      offerId,
      services,
    });
    return result;
  }

  /**
   * Add services to existing order
   * @param orderId Order ID
   * @param services Services to add
   */
  async addServicesToOrder(
    orderId: string,
    services: ServiceSelection[],
  ): Promise<{
    success: boolean;
    data: {
      orderId: string;
      addedServices: ServiceSelection[];
      totalAmount: string;
      currency: string;
    };
    message: string;
    servicesCount: number;
    timestamp: string;
  }> {
    const result = await api.post<any>("/api/flights/ancillary/services/select", {
      orderId,
      services,
    });
    return result;
  }

  /**
   * Get available service categories
   */
  async getServiceCategories(): Promise<{
    success: boolean;
    data: ServiceCategory[];
    timestamp: string;
  }> {
    const result = await api.get<any>(
      "/api/flights/ancillary/services/categories",
    );
    return result;
  }

  /**
   * Get details of a specific service
   */
  async getServiceDetails(serviceId: string): Promise<{
    success: boolean;
    data: Service;
    timestamp: string;
  }> {
    const result = await api.get<any>(
      `/api/flights/ancillary/services/details/${serviceId}`,
    );
    return result;
  }
}

const ancillaryServicesApi = new AncillaryServicesApi();
export default ancillaryServicesApi;

// ============================================================================
// STANDALONE EXPORT FUNCTIONS (for API integration verification)
// ============================================================================

/**
 * Get details of a specific service
 * Standalone function for API integration verification
 * @param serviceId - Service ID
 */
async function getServiceDetails(serviceId: string): Promise<{
  success: boolean;
  data: Service;
  timestamp: string;
}> {
  const result = await api.get<any>(
    `/api/flights/ancillary/services/details?serviceId=${serviceId}`,
  );
  return result;
}
