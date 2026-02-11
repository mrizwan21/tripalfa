/**
 * Duffel API Client
 * Handles communication with Duffel API for seat maps and orders
 */

import logger from '../utils/logger';
import { apiManagerService, APIUsageRecord } from '../services/apiManagerService';

export class DuffelApiClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number = 10000; // 10 seconds

  constructor() {
    this.baseUrl = process.env.DUFFEL_BASE_URL || 'https://api.duffel.com';
    this.apiKey = process.env.DUFFEL_API_KEY || '';

    if (!this.apiKey) {
      logger.warn('[DuffelClient] DUFFEL_API_KEY not configured');
    }
  }

  /**
   * Get seat map for an offer
   */
  async getSeatMapForOffer(offerId: string): Promise<any> {
    try {
      logger.info(`[DuffelClient] Fetching seat map for offer: ${offerId}`);

      const url = `${this.baseUrl}/seat_maps?offer_id=${offerId}`;

      const response = await this.makeRequest(url, 'GET');

      logger.info(`[DuffelClient] Seat map retrieved successfully`);
      return response;
    } catch (error: any) {
      logger.error(`[DuffelClient] Error fetching seat map:`, error);

      if (error.statusCode === 404) {
        return null; // Offer not found
      }

      throw error;
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<any> {
    try {
      logger.info(`[DuffelClient] Fetching order: ${orderId}`);

      const url = `${this.baseUrl}/orders/${orderId}`;

      const response = await this.makeRequest(url, 'GET');

      logger.info(`[DuffelClient] Order retrieved successfully`);
      return response;
    } catch (error: any) {
      logger.error(`[DuffelClient] Error fetching order:`, error);

      if (error.statusCode === 404) {
        return null; // Order not found
      }

      throw error;
    }
  }

  /**
   * Get offer with available services
   */
  async getOfferWithServices(offerId: string, env: string = 'sandbox'): Promise<any> {
    try {
      logger.info(`[DuffelClient] Fetching offer with available services: ${offerId}`);

      const url = `${this.baseUrl}/air/offers/${offerId}?return_available_services=true`;

      const response = await this.makeRequest(url, 'GET');

      logger.info(`[DuffelClient] Offer with services retrieved successfully`);
      return response?.data || response;
    } catch (error: any) {
      logger.error(`[DuffelClient] Error fetching offer with services:`, error);

      if (error.statusCode === 404) {
        return null; // Offer not found
      }

      throw error;
    }
  }

  /**
   * Get available services for an order (post-booking)
   */
  async getAvailableServicesForOrder(orderId: string, env: string = 'sandbox'): Promise<any> {
    try {
      logger.info(`[DuffelClient] Fetching available services for order: ${orderId}`);

      const url = `${this.baseUrl}/air/orders/${orderId}/available_services`;

      const response = await this.makeRequest(url, 'GET');

      logger.info(`[DuffelClient] Available services retrieved successfully`);
      return response?.data || response;
    } catch (error: any) {
      logger.error(`[DuffelClient] Error fetching available services:`, error);

      if (error.statusCode === 404) {
        return null; // Order not found
      }

      throw error;
    }
  }

  /**
   * Price offer with selected services
   */
  async priceOfferWithServices(offerId: string, services: any[]): Promise<any> {
    try {
      logger.info(`[DuffelClient] Pricing offer with services: ${offerId}`);

      const url = `${this.baseUrl}/air/offers/${offerId}/actions/price`;

      const body = {
        data: {
          intended_services: services.map(s => ({
            id: s.id,
            quantity: s.quantity || 1
          }))
        }
      };

      const response = await this.makeRequest(url, 'POST', body);

      logger.info(`[DuffelClient] Offer priced successfully`);
      return response?.data || response;
    } catch (error: any) {
      logger.error(`[DuffelClient] Error pricing offer:`, error);

      throw error;
    }
  }

  /**
   * Add services to an existing order
   */
  async addServicesToOrder(orderId: string, services: any[], payment?: any): Promise<any> {
    try {
      logger.info(`[DuffelClient] Adding services to order: ${orderId}`);

      const url = `${this.baseUrl}/air/orders/${orderId}/services`;

      const body = {
        data: {
          add_services: services.map(s => ({
            id: s.id,
            quantity: s.quantity || 1
          })),
          ...(payment && { payment })
        }
      };

      const response = await this.makeRequest(url, 'POST', body);

      logger.info(`[DuffelClient] Services added successfully`);
      return response?.data || response;
    } catch (error: any) {
      logger.error(`[DuffelClient] Error adding services:`, error);

      throw error;
    }
  }

  /**
   * Create a cancellation quote for an order
   * This allows reviewing refund conditions and amounts before confirming
   */
  async createCancellationQuote(orderId: string): Promise<any> {
    try {
      logger.info(`[DuffelClient] Creating cancellation quote for order: ${orderId}`);

      const url = `${this.baseUrl}/order_cancellations`;

      const body = {
        data: {
          order_id: orderId
        }
      };

      const response = await this.makeRequest(url, 'POST', body);

      logger.info(`[DuffelClient] Cancellation quote created successfully`);
      return response?.data || response;
    } catch (error: any) {
      logger.error(`[DuffelClient] Error creating cancellation quote:`, error);

      throw error;
    }
  }

  /**
   * Confirm a cancellation quote to proceed with order cancellation
   */
  async confirmCancellation(cancellationId: string): Promise<any> {
    try {
      logger.info(`[DuffelClient] Confirming cancellation: ${cancellationId}`);

      const url = `${this.baseUrl}/order_cancellations/${cancellationId}/actions/confirm`;

      const response = await this.makeRequest(url, 'POST', {});

      logger.info(`[DuffelClient] Cancellation confirmed successfully`);
      return response?.data || response;
    } catch (error: any) {
      logger.error(`[DuffelClient] Error confirming cancellation:`, error);

      throw error;
    }
  }

  /**
   * Check if an order is cancellable
   */
  async isOrderCancellable(orderId: string): Promise<boolean> {
    try {
      logger.info(`[DuffelClient] Checking if order is cancellable: ${orderId}`);

      const order = await this.getOrder(orderId);

      if (!order || !order.data) {
        return false;
      }

      const availableActions = order.data.available_actions || [];
      const isCancellable = availableActions.includes('cancel');

      logger.info(`[DuffelClient] Order cancellable status: ${isCancellable}`);
      return isCancellable;
    } catch (error: any) {
      logger.error(`[DuffelClient] Error checking order cancellable status:`, error);

      return false;
    }
  }

  /**
   * Step 1: Create an order change request
   * Specifies slices to remove and search criteria for new slices
   */
  async createOrderChangeRequest(orderId: string, changeRequest: {
    remove: Array<{ slice_id: string }>;
    add: Array<{
      origin: string;
      destination: string;
      departure_date: string;
      cabin_class: string;
    }>;
  }): Promise<any> {
    try {
      logger.info(`[DuffelClient] Creating order change request for order: ${orderId}`);

      const url = `${this.baseUrl}/order_change_requests`;

      const body = {
        data: {
          order_id: orderId,
          slices: changeRequest
        }
      };

      const response = await this.makeRequest(url, 'POST', body);

      logger.info(`[DuffelClient] Order change request created successfully`, {
        requestId: response?.data?.id
      });
      return response?.data || response;
    } catch (error: any) {
      logger.error(`[DuffelClient] Error creating order change request:`, error);
      throw error;
    }
  }

  /**
   * Step 2: Get order change request with available offers
   * Reviews available order change offers and their prices
   */
  async getOrderChangeRequest(orderChangeRequestId: string): Promise<any> {
    try {
      logger.info(`[DuffelClient] Fetching order change request: ${orderChangeRequestId}`);

      const url = `${this.baseUrl}/order_change_requests/${orderChangeRequestId}`;

      const response = await this.makeRequest(url, 'GET');

      logger.info(`[DuffelClient] Order change request retrieved successfully`);
      return response?.data || response;
    } catch (error: any) {
      logger.error(`[DuffelClient] Error fetching order change request:`, error);

      if (error.statusCode === 404) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Step 3: Create a pending order change
   * Selects one of the available change offers
   */
  async createPendingOrderChange(selectedOrderChangeOfferId: string): Promise<any> {
    try {
      logger.info(`[DuffelClient] Creating pending order change with offer: ${selectedOrderChangeOfferId}`);

      const url = `${this.baseUrl}/order_changes`;

      const body = {
        data: {
          selected_order_change_offer_id: selectedOrderChangeOfferId
        }
      };

      const response = await this.makeRequest(url, 'POST', body);

      logger.info(`[DuffelClient] Pending order change created successfully`, {
        changeId: response?.data?.id
      });
      return response?.data || response;
    } catch (error: any) {
      logger.error(`[DuffelClient] Error creating pending order change:`, error);
      throw error;
    }
  }

  /**
   * Get pending order change status
   * Used to review final pricing before confirmation
   */
  async getPendingOrderChange(orderChangeId: string): Promise<any> {
    try {
      logger.info(`[DuffelClient] Fetching pending order change: ${orderChangeId}`);

      const url = `${this.baseUrl}/order_changes/${orderChangeId}`;

      const response = await this.makeRequest(url, 'GET');

      logger.info(`[DuffelClient] Pending order change retrieved successfully`);
      return response?.data || response;
    } catch (error: any) {
      logger.error(`[DuffelClient] Error fetching pending order change:`, error);

      if (error.statusCode === 404) {
        return null;
      }

      throw error;
    }
  }

  /**
   * Step 4: Confirm the order change
   * Finalizes the order change with payment
   */
  async confirmOrderChange(orderChangeId: string, payment?: {
    type: string;
    currency: string;
    amount: string;
  }): Promise<any> {
    try {
      logger.info(`[DuffelClient] Confirming order change: ${orderChangeId}`);

      const url = `${this.baseUrl}/order_changes/${orderChangeId}/actions/confirm`;

      const body: any = {
        data: {}
      };

      if (payment) {
        body.data.payment = payment;
      }

      const response = await this.makeRequest(url, 'POST', body);

      logger.info(`[DuffelClient] Order change confirmed successfully`);
      return response?.data || response;
    } catch (error: any) {
      logger.error(`[DuffelClient] Error confirming order change:`, error);
      throw error;
    }
  }

  /**
   * Check if an order is changeable
   * Examines slices to see which are changeable
   */
  async isOrderChangeable(orderId: string): Promise<{ changeable: boolean; changeableSlices: any[] }> {
    try {
      logger.info(`[DuffelClient] Checking if order is changeable: ${orderId}`);

      const order = await this.getOrder(orderId);

      if (!order || !order.data) {
        return { changeable: false, changeableSlices: [] };
      }

      const slices = order.data.slices || [];
      const changeableSlices = slices.filter((slice: any) => slice.changeable === true);

      const isChangeable = changeableSlices.length > 0;

      logger.info(`[DuffelClient] Order changeable status: ${isChangeable}`, {
        totalSlices: slices.length,
        changeableSlices: changeableSlices.length
      });

      return { changeable: isChangeable, changeableSlices };
    } catch (error: any) {
      logger.error(`[DuffelClient] Error checking order changeable status:`, error);
      return { changeable: false, changeableSlices: [] };
    }
  }

  /**
   * Get available baggage services for an order
   * Filters available services to return only baggage services
   */
  async getAvailableBaggages(orderId: string): Promise<any[]> {
    try {
      logger.info(`[DuffelClient] Fetching available baggages for order: ${orderId}`);

      const allServices = await this.getAvailableServicesForOrder(orderId);

      if (!allServices || !Array.isArray(allServices)) {
        logger.info(`[DuffelClient] No services found for order`);
        return [];
      }

      const bagServices = allServices.filter((service: any) => service.type === 'baggage');

      logger.info(`[DuffelClient] Available baggages retrieved successfully`, {
        totalServices: allServices.length,
        baggageServices: bagServices.length
      });

      return bagServices;
    } catch (error: any) {
      logger.error(`[DuffelClient] Error fetching available baggages:`, error);
      throw error;
    }
  }

  /**
   * Get booked baggage services on an order
   * Returns baggage services currently booked
   */
  async getOrderBaggages(orderId: string): Promise<any[]> {
    try {
      logger.info(`[DuffelClient] Fetching booked baggages for order: ${orderId}`);

      const order = await this.getOrder(orderId);

      if (!order || !order.data) {
        logger.info(`[DuffelClient] Order not found`);
        return [];
      }

      const services = order.data.services || [];
      const bagServices = services.filter((service: any) => service.type === 'baggage');

      logger.info(`[DuffelClient] Booked baggages retrieved successfully`, {
        totalServices: services.length,
        baggageServices: bagServices.length
      });

      return bagServices;
    } catch (error: any) {
      logger.error(`[DuffelClient] Error fetching order baggages:`, error);
      throw error;
    }
  }

  /**
   * Check if baggage can be added to an order
   * Returns true if available baggage services exist
   */
  async isOrderEligibleForBaggage(orderId: string): Promise<boolean> {
    try {
      logger.info(`[DuffelClient] Checking baggage eligibility for order: ${orderId}`);

      const availableBaggages = await this.getAvailableBaggages(orderId);

      const eligible = availableBaggages.length > 0;

      logger.info(`[DuffelClient] Order baggage eligibility: ${eligible}`, {
        availableBaggages: availableBaggages.length
      });

      return eligible;
    } catch (error: any) {
      logger.error(`[DuffelClient] Error checking baggage eligibility:`, error);
      return false;
    }
  }

  /**
   * Make HTTP request with error handling
   */
  private async makeRequest(
    url: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    const startTime = Date.now();
    let statusCode = 0;
    let errorMessage: string | undefined;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const options: any = {
        method,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      clearTimeout(timeoutId);
      statusCode = response.status;

      if (!response.ok) {
        const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.statusCode = response.status;

        try {
          error.data = await response.json();
        } catch {
          // Ignore JSON parse error
        }

        throw error;
      }

      const data = await response.json();

      // Record successful API usage
      await this.recordAPIUsage(url, method, startTime, statusCode);

      return data;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        const timeoutError: any = new Error('Request timeout');
        timeoutError.code = 'TIMEOUT';
        errorMessage = 'Request timeout';
        throw timeoutError;
      }

      // Record failed API usage
      await this.recordAPIUsage(url, method, startTime, error.statusCode || 0, error.message || errorMessage);

      throw error;
    }
  }

  /**
   * Record API usage for monitoring and alerting
   */
  private async recordAPIUsage(
    url: string,
    method: string,
    startTime: number,
    statusCode: number,
    error?: string
  ): Promise<void> {
    try {
      const responseTime = Date.now() - startTime;

      const record: APIUsageRecord = {
        apiKey: this.apiKey,
        endpoint: url,
        method,
        timestamp: startTime,
        responseTime,
        statusCode,
        error
      };

      await apiManagerService.recordUsage(record);
    } catch (recordError) {
      logger.error('[DuffelClient] Failed to record API usage:', recordError);
      // Don't throw - API monitoring failure shouldn't break the API call
    }
  }
}

export const duffelClient = new DuffelApiClient();
