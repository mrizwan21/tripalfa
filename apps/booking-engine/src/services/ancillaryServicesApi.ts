/**
 * Ancillary Services API Integration
 * Type-safe API client for ancillary services endpoints
 */

import { API_BASE_URL } from '../lib/constants';

export type ServiceType = 'baggage' | 'meal' | 'seat' | 'special_request' | 'lounge' | 'insurance';

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
  applicableSegments: 'all' | 'outbound' | 'return' | 'specific';
  applicablePassengers: 'all' | 'specific';
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
  private baseUrl: string;

  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get available services during booking flow
   * @param offerId Offer ID
   * @param serviceType Optional filter by service type
   */
  async getServicesForBooking(
    offerId: string,
    serviceType?: ServiceType
  ): Promise<AncillaryServiceResponse> {
    const url = new URL(`${this.baseUrl}/bookings/ancillary/services`);
    url.searchParams.append('offerId', offerId);
    if (serviceType) {
      url.searchParams.append('serviceType', serviceType);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json() as AncillaryErrorResponse;
      throw new Error(error.error?.message || 'Failed to fetch services');
    }

    return response.json();
  }

  /**
   * Get available services for post-booking modifications
   * @param orderId Order ID
   * @param serviceType Optional filter by service type
   */
  async getServicesForOrder(
    orderId: string,
    serviceType?: ServiceType
  ): Promise<AncillaryServiceResponse & { currentServices: Service[] }> {
    const url = new URL(`${this.baseUrl}/bookings/ancillary/services`);
    url.searchParams.append('orderId', orderId);
    if (serviceType) {
      url.searchParams.append('serviceType', serviceType);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json() as AncillaryErrorResponse;
      throw new Error(error.error?.message || 'Failed to fetch order services');
    }

    return response.json();
  }

  /**
   * Select services during booking
   * @param offerId Offer ID
   * @param services Services to select
   */
  async selectServicesForBooking(
    offerId: string,
    services: ServiceSelection[]
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
    const response = await fetch(`${this.baseUrl}/bookings/ancillary/services/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        offerId,
        services
      })
    });

    if (!response.ok) {
      const error = await response.json() as AncillaryErrorResponse;
      throw new Error(error.error?.message || 'Failed to select services');
    }

    return response.json();
  }

  /**
   * Add services to existing order
   * @param orderId Order ID
   * @param services Services to add
   */
  async addServicesToOrder(
    orderId: string,
    services: ServiceSelection[]
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
    const response = await fetch(`${this.baseUrl}/bookings/ancillary/services/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        orderId,
        services
      })
    });

    if (!response.ok) {
      const error = await response.json() as AncillaryErrorResponse;
      throw new Error(error.error?.message || 'Failed to add services');
    }

    return response.json();
  }

  /**
   * Get available service categories
   */
  async getServiceCategories(): Promise<{
    success: boolean;
    data: ServiceCategory[];
    timestamp: string;
  }> {
    const response = await fetch(
      `${this.baseUrl}/bookings/ancillary/services/categories`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json() as AncillaryErrorResponse;
      throw new Error(error.error?.message || 'Failed to fetch service categories');
    }

    return response.json();
  }

  /**
   * Get details of a specific service
   */
  async getServiceDetails(serviceId: string): Promise<{
    success: boolean;
    data: Service;
    timestamp: string;
  }> {
    const response = await fetch(
      `${this.baseUrl}/bookings/ancillary/services/details/${serviceId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const error = await response.json() as AncillaryErrorResponse;
      throw new Error(error.error?.message || 'Failed to fetch service details');
    }

    return response.json();
  }
}

export const ancillaryServicesApi = new AncillaryServicesApi();
export default ancillaryServicesApi;

// ============================================================================
// STANDALONE EXPORT FUNCTIONS (for API integration verification)
// ============================================================================

const API_KEY = import.meta.env.VITE_API_KEY || '';

/**
 * Get details of a specific service
 * Standalone function for API integration verification
 * @param serviceId - Service ID
 */
export async function getServiceDetails(serviceId: string): Promise<{
  success: boolean;
  data: Service;
  timestamp: string;
}> {
  const response = await fetch(
    `${API_BASE_URL}/api/bookings/ancillary/services/details`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({ serviceId }),
      credentials: 'include'
    }
  );

  if (!response.ok) {
    const error = await response.json() as AncillaryErrorResponse;
    throw new Error(error.error?.message || 'Failed to fetch service details');
  }

  return response.json();
}
