/**
 * Ancillary Services Service
 * Business logic for handling ancillary services (baggage, meals, special requests, etc.)
 */

import logger from '../utils/logger';
import { DuffelApiClient } from '../integrations/duffelApiClient';

/**
 * Service Type Categories
 */
export interface ServiceCategory {
  type: string;
  name: string;
  description: string;
  icon?: string;
  applicableSegments: 'all' | 'outbound' | 'return' | 'specific';
  applicablePassengers: 'all' | 'specific';
  maxQuantityPerPassenger: number;
}

/**
 * Service Detail
 */
export interface ServiceDetail {
  id: string;
  type: string;
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

/**
 * Service Selection
 */
export interface ServiceSelection {
  id: string;
  quantity: number;
  passengerIds?: string[];
  segmentIds?: string[];
}

export class AncillaryServicesService {
  private duffelClient: DuffelApiClient;

  constructor() {
    this.duffelClient = new DuffelApiClient();
  }

  /**
   * Get available services during booking flow
   * Retrieves services from the offer with return_available_services=true
   */
  async getServicesForBooking(
    offerId: string,
    serviceType?: string,
    provider: string = 'duffel',
    env: string = 'sandbox'
  ): Promise<{
    offerId: string;
    services: ServiceDetail[];
    categories: string[];
    provider: string;
    environment: string;
  } | null> {
    try {
      logger.info(`[AncillaryServicesService] Getting available services for booking offer: ${offerId}`);

      // Fetch offer with available_services
      const offer = await this.duffelClient.getOfferWithServices(offerId, env);

      if (!offer) {
        logger.error(`[AncillaryServicesService] Offer not found: ${offerId}`);
        return null;
      }

      // Process available services
      const services = this.processAvailableServices(
        offer.available_services || [],
        serviceType
      );

      const categories = [...new Set(services.map(s => s.type))];

      logger.info(`[AncillaryServicesService] Found ${services.length} available services in ${categories.length} categories`);

      return {
        offerId,
        services,
        categories,
        provider,
        environment: env
      };
    } catch (error) {
      logger.error('[AncillaryServicesService] Error getting services for booking:', error);
      throw error;
    }
  }

  /**
   * Get available services for existing order (post-booking)
   */
  async getServicesForOrder(
    orderId: string,
    serviceType?: string,
    provider: string = 'duffel',
    env: string = 'sandbox'
  ): Promise<{
    orderId: string;
    services: ServiceDetail[];
    categories: string[];
    currentServices: ServiceDetail[];
    provider: string;
    environment: string;
  } | null> {
    try {
      logger.info(`[AncillaryServicesService] Getting available services for order: ${orderId}`);

      // Fetch available services for order
      const availableServices = await this.duffelClient.getAvailableServicesForOrder(orderId, env);

      if (!availableServices) {
        logger.error(`[AncillaryServicesService] Order or services not found: ${orderId}`);
        return null;
      }

      // Get the order to find currently booked services
      const order = await this.duffelClient.getOrder(orderId);
      const currentServices = this.processAvailableServices(order?.services || []);

      // Process available services
      const services = this.processAvailableServices(
        availableServices,
        serviceType
      );

      const categories = [...new Set(services.map(s => s.type))];

      logger.info(`[AncillaryServicesService] Found ${services.length} available services and ${currentServices.length} current services`);

      return {
        orderId,
        services,
        categories,
        currentServices,
        provider,
        environment: env
      };
    } catch (error) {
      logger.error('[AncillaryServicesService] Error getting services for order:', error);
      throw error;
    }
  }

  /**
   * Select services during booking flow
   */
  async selectServicesForBooking(
    offerId: string,
    selectedServices: ServiceSelection[]
  ): Promise<{
    offerId: string;
    selectedServices: ServiceSelection[];
    totalAmount: string;
    currency: string;
  } | null> {
    try {
      logger.info(`[AncillaryServicesService] Selecting ${selectedServices.length} services for booking offer: ${offerId}`);

      // Verify services with pricing
      const pricingResult = await this.duffelClient.priceOfferWithServices(offerId, selectedServices);

      if (!pricingResult) {
        logger.error('[AncillaryServicesService] Failed to price offer with selected services');
        return null;
      }

      logger.info(`[AncillaryServicesService] Services selected successfully. New total: ${pricingResult.total_amount} ${pricingResult.total_currency}`);

      return {
        offerId,
        selectedServices,
        totalAmount: pricingResult.total_amount,
        currency: pricingResult.total_currency
      };
    } catch (error) {
      logger.error('[AncillaryServicesService] Error selecting services for booking:', error);
      throw error;
    }
  }

  /**
   * Add services to existing order (post-booking)
   */
  async addServicesToOrder(
    orderId: string,
    servicesToAdd: ServiceSelection[]
  ): Promise<{
    orderId: string;
    addedServices: ServiceSelection[];
    totalAmount: string;
    currency: string;
  } | null> {
    try {
      logger.info(`[AncillaryServicesService] Adding ${servicesToAdd.length} services to order: ${orderId}`);

      // Add services to order
      const result = await this.duffelClient.addServicesToOrder(orderId, servicesToAdd);

      if (!result) {
        logger.error('[AncillaryServicesService] Failed to add services to order');
        return null;
      }

      logger.info(`[AncillaryServicesService] Services added successfully. New total: ${result.total_amount} ${result.total_currency}`);

      return {
        orderId,
        addedServices: servicesToAdd,
        totalAmount: result.total_amount,
        currency: result.total_currency
      };
    } catch (error) {
      logger.error('[AncillaryServicesService] Error adding services to order:', error);
      throw error;
    }
  }

  /**
   * Get available service categories
   */
  getServiceCategories(): ServiceCategory[] {
    return [
      {
        type: 'baggage',
        name: 'Additional Baggage',
        description: 'Extra checked or carry-on baggage',
        applicableSegments: 'all',
        applicablePassengers: 'all',
        maxQuantityPerPassenger: 5
      },
      {
        type: 'meal',
        name: 'Meal Services',
        description: 'Pre-order meals, dietary requests, special menus',
        applicableSegments: 'all',
        applicablePassengers: 'all',
        maxQuantityPerPassenger: 1
      },
      {
        type: 'seat',
        name: 'Seat Selection',
        description: 'Premium, extra legroom, or specific seat assignments',
        applicableSegments: 'all',
        applicablePassengers: 'all',
        maxQuantityPerPassenger: 1
      },
      {
        type: 'special_request',
        name: 'Special Requests',
        description: 'Wheelchair, infant seat, unaccompanied minor, etc.',
        applicableSegments: 'all',
        applicablePassengers: 'all',
        maxQuantityPerPassenger: 2
      },
      {
        type: 'lounge',
        name: 'Lounge Access',
        description: 'Airport lounge access',
        applicableSegments: 'all',
        applicablePassengers: 'all',
        maxQuantityPerPassenger: 1
      },
      {
        type: 'insurance',
        name: 'Travel Insurance',
        description: 'Travel insurance and protection plans',
        applicableSegments: 'all',
        applicablePassengers: 'all',
        maxQuantityPerPassenger: 1
      }
    ];
  }

  /**
   * Get details of a specific service
   */
  async getServiceDetails(serviceId: string): Promise<ServiceDetail | null> {
    try {
      logger.info(`[AncillaryServicesService] Getting details for service: ${serviceId}`);

      // In a real implementation, this would fetch from a service catalog
      // For now, return a mock structure
      const service: ServiceDetail = {
        id: serviceId,
        type: 'baggage',
        productName: 'Additional Checked Baggage (23kg)',
        description: 'One additional checked bag up to 23kg',
        baseAmount: '25.00',
        currency: 'GBP',
        segmentIds: [],
        passengerIds: [],
        maximumQuantity: 5,
        restrictions: {
          minQuantity: 1,
          maxQuantity: 5
        }
      };

      return service;
    } catch (error) {
      logger.error('[AncillaryServicesService] Error getting service details:', error);
      return null;
    }
  }

  /**
   * Process and normalize available services from API response
   */
  private processAvailableServices(
    rawServices: any[] = [],
    filterByType?: string
  ): ServiceDetail[] {
    try {
      let services: ServiceDetail[] = rawServices.map(service => ({
        id: service.id,
        type: service.type || 'unknown',
        productName: service.product_name || service.name || `${service.type} Service`,
        description: service.description || `${service.type} service`,
        baseAmount: service.base_amount || service.total_amount || '0.00',
        currency: service.currency || service.total_currency || 'GBP',
        segmentIds: service.segment_ids || [],
        passengerIds: service.passenger_ids || [],
        maximumQuantity: service.maximum_quantity || 1
      }));

      // Filter by type if specified
      if (filterByType) {
        services = services.filter(s => s.type === filterByType);
      }

      return services;
    } catch (error) {
      logger.error('[AncillaryServicesService] Error processing services:', error);
      return [];
    }
  }
}
