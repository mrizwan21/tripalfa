import { api } from '../lib/api';

interface FlightSearchParams {
  departureDate: string;
  departureAirport: string;
  arrivalAirport: string;
  passengers: number;
  returnDate?: string;
  tripType?: 'oneway' | 'roundtrip';
}

interface FlightSearchResult {
  id: string;
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    city: string;
    time: string;
  };
  arrival: {
    airport: string;
    city: string;
    time: string;
  };
  duration: number; // in minutes
  cabin: string;
  passengers: number;
  price: number;
  currency: string;
  availableSeats: number;
}

interface FlightSearchResponse {
  success: boolean;
  data: {
    flights: FlightSearchResult[];
    total: number;
  };
}

// ============================================================================
// Flight Booking Types (E2E Flow)
// ============================================================================

interface PassengerInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  passportNumber?: string;
  passportExpiry?: string;
  nationality?: string;
}

interface FlightSegment {
  flightNumber: string;
  airline: string;
  departure: {
    airport: string;
    city: string;
    time: string;
    date: string;
  };
  arrival: {
    airport: string;
    city: string;
    time: string;
    date: string;
  };
  cabin: string;
  class: string;
}

interface HoldBookingRequest {
  orderId?: string;
  passengers: PassengerInfo[];
  segments: FlightSegment[];
  totalAmount: number;
  currency: string;
  isRefundable?: boolean;
  contactEmail: string;
  contactPhone: string;
}

interface HoldBookingResponse {
  success: boolean;
  workflowId?: string;
  orderId?: string;
  bookingReference?: string;
  status?: string;
  paymentRequiredBy?: string;
  message?: string;
  error?: string;
  documents?: {
    itinerary?: string;
    invoice?: string;
    ticket?: string;
    receipt?: string;
    refundNote?: string;
  };
}

interface PaymentRequest {
  orderId: string;
  workflowId: string;
  paymentMethod: 'card' | 'wallet' | 'bank_transfer';
  paymentDetails?: {
    cardLast4?: string;
    cardBrand?: string;
  };
}

interface PaymentResponse {
  success: boolean;
  workflowId?: string;
  paymentReference?: string;
  status?: string;
  message?: string;
  error?: string;
  documents?: {
    receipt?: string;
  };
}

interface TicketRequest {
  orderId: string;
  workflowId: string;
}

interface TicketResponse {
  success: boolean;
  ticketNumber?: string;
  status?: string;
  message?: string;
  error?: string;
  documents?: {
    ticket?: string;
  };
}

interface ReceiptRequest {
  orderId: string;
  workflowId: string;
}

interface ReceiptResponse {
  success: boolean;
  receiptNumber?: string;
  message?: string;
  error?: string;
  documents?: {
    receipt?: string;
  };
}

interface CancelRequest {
  orderId: string;
  workflowId: string;
  cancellationReason?: string;
  cancelAfterTicketing?: boolean;
  refundAmount?: number;
}

interface CancelResponse {
  success: boolean;
  cancellationId?: string;
  status?: string;
  refundAmount?: number;
  message?: string;
  error?: string;
}

interface RefundRequest {
  orderId: string;
  workflowId: string;
  refundAmount: number;
  currency: string;
  reason: string;
}

interface RefundResponse {
  success: boolean;
  refundNumber?: string;
  refundAmount?: number;
  currency?: string;
  status?: string;
  processedAt?: string;
  message?: string;
  error?: string;
  documents?: {
    refundNote?: string;
  };
}

interface BookingRetrieveResponse {
  success: boolean;
  booking?: {
    orderId: string;
    workflowId: string;
    bookingReference: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
    customer?: {
      email: string;
      phone: string;
    };
    passengers?: PassengerInfo[];
    segments?: FlightSegment[];
    totalAmount: number;
    currency: string;
  };
  documents?: {
    itinerary?: string;
    invoice?: string;
    ticket?: string;
    receipt?: string;
    refundNote?: string;
  };
  message?: string;
  error?: string;
}

/**
 * FlightApi class - Uses centralized API manager for all requests
 * 
 * This class routes all API calls through the centralized `api` object from lib/api.ts
 * which provides:
 * - Consistent authentication token handling
 * - Request/response interceptors
 * - Error handling standardization
 * - Logging and monitoring
 */
class FlightApi {
  /**
   * Search for flights
   * POST /api/flights/search
   */
  async search(params: FlightSearchParams): Promise<{ flights: FlightSearchResult[] }> {
    try {
      const response = await api.post<FlightSearchResponse>('/flights/search', params);
      return {
        flights: response.data.flights,
      };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to search flights'
      );
    }
  }

  /**
   * Get flight details
   * GET /api/flights/:id
   */
  async getFlightDetails(flightId: string): Promise<FlightSearchResult> {
    try {
      const response = await api.get<{ success: boolean; data: FlightSearchResult }>(
        `/flights/${flightId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch flight details'
      );
    }
  }

  // ============================================================================
  // E2E Flight Booking Methods
  // ============================================================================

  /**
   * Create a hold booking (Book Now Pay Later)
   * POST /api/flight-booking/hold
   * 
   * Step 1 of E2E Flow: Reserve inventory without immediate payment
   * Only available for refundable fares
   */
  async createHoldBooking(request: HoldBookingRequest): Promise<HoldBookingResponse> {
    try {
      const response = await api.post<HoldBookingResponse>('/flight-booking/hold', request);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create hold booking'
      };
    }
  }

  /**
   * Process payment for hold booking
   * POST /api/flight-booking/payment
   * 
   * Step 2 of E2E Flow: Convert hold to paid booking
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await api.post<PaymentResponse>('/flight-booking/payment', request);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to process payment'
      };
    }
  }

  /**
   * Retrieve booking details
   * GET /api/flight-booking/:orderId
   * 
   * Step 3 of E2E Flow: Get booking details and status
   */
  async getBooking(orderId: string): Promise<BookingRetrieveResponse> {
    try {
      const response = await api.get<BookingRetrieveResponse>(`/flight-booking/${orderId}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to retrieve booking'
      };
    }
  }

  /**
   * Issue ticket for confirmed booking
   * POST /api/flight-booking/ticket
   * 
   * Step 4 of E2E Flow: Convert paid booking to confirmed ticket
   */
  async issueTicket(request: TicketRequest): Promise<TicketResponse> {
    try {
      const response = await api.post<TicketResponse>('/flight-booking/ticket', request);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to issue ticket'
      };
    }
  }

  /**
   * Generate receipt for booking
   * POST /api/flight-booking/receipt
   */
  async generateReceipt(request: ReceiptRequest): Promise<ReceiptResponse> {
    try {
      const response = await api.post<ReceiptResponse>('/flight-booking/receipt', request);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to generate receipt'
      };
    }
  }

  /**
   * Cancel booking/ticket
   * POST /api/flight-booking/cancel
   * 
   * Step 5 of E2E Flow: Cancel ticket or reservation
   */
  async cancelBooking(request: CancelRequest): Promise<CancelResponse> {
    try {
      const response = await api.post<CancelResponse>('/flight-booking/cancel', request);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to cancel booking'
      };
    }
  }

  /**
   * Generate refund note
   * POST /api/flight-booking/refund
   * 
   * Step 6 of E2E Flow: Create refund documentation
   */
  async generateRefund(request: RefundRequest): Promise<RefundResponse> {
    try {
      const response = await api.post<RefundResponse>('/flight-booking/refund', request);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to generate refund'
      };
    }
  }

  /**
   * Get workflow state
   * GET /api/flight-booking/workflow/:workflowId
   */
  async getWorkflow(workflowId: string): Promise<any> {
    try {
      const response = await api.get<any>(`/flight-booking/workflow/${workflowId}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get workflow'
      };
    }
  }

  /**
   * Complete E2E flow (create hold -> pay -> ticket)
   * POST /api/flight-booking/complete-flow
   */
  async completeFlow(request: {
    orderId?: string;
    passengers: PassengerInfo[];
    segments: FlightSegment[];
    totalAmount: number;
    currency: string;
    isRefundable?: boolean;
    contactEmail: string;
    contactPhone: string;
    customer: { firstName: string; lastName: string; email: string; phone: string };
    paymentMethod: 'card' | 'wallet' | 'bank_transfer';
    paymentDetails?: { cardLast4?: string; cardBrand?: string };
    issueTicket?: boolean;
  }): Promise<any> {
    try {
      const response = await api.post<any>('/flight-booking/complete-flow', request);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to complete flow'
      };
    }
  }

  // ============================================================================
  // Duffel Hold Orders (Book Now, Pay Later)
  // ============================================================================

  /**
   * Create a Duffel hold order (book now, pay later)
   * POST /api/duffel/orders/hold
   * 
   * This creates an order with type: 'hold' which reserves the booking
   * for a limited time before payment is required.
   */
  async createDuffelHoldOrder(params: {
    selected_offers: string[];
    passengers: Array<{
      id?: string;
      type: 'adult' | 'child' | 'infant';
      given_name: string;
      family_name: string;
      email: string;
      phone_number: string;
      born_at?: string;
      gender?: 'm' | 'f';
      title?: 'mr' | 'mrs' | 'ms' | 'miss' | 'dr' | 'prof';
    }>;
    contact?: { email: string; phone: string };
    userId?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    success: boolean;
    order?: any;
    payment_required_by?: string;
    error?: string;
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        order?: any;
        payment_required_by?: string;
        error?: string;
      }>('/duffel/orders/hold', params);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create hold order'
      };
    }
  }

  /**
   * Pay for a Duffel hold order
   * POST /api/duffel/orders/:id/pay
   */
  async payForDuffelOrder(orderId: string, paymentMethodType: 'balance' | 'card' = 'balance'): Promise<{
    success: boolean;
    payment_intent?: any;
    error?: string;
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        payment_intent?: any;
        error?: string;
      }>(`/duffel/orders/${orderId}/pay`, {
        payment_method_type: paymentMethodType,
      });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to pay for order'
      };
    }
  }

  /**
   * Create a payment intent for a Duffel hold order
   * POST /api/duffel/payment-intents
   */
  async createDuffelPaymentIntent(params: {
    order_id: string;
    amount?: string;
    currency?: string;
    payment_method?: { type: 'balance' | 'card' };
  }): Promise<{
    success: boolean;
    payment_intent?: any;
    error?: string;
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        payment_intent?: any;
        error?: string;
      }>('/duffel/payment-intents', params);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create payment intent'
      };
    }
  }

  /**
   * Get Duffel payment intent by ID
   * GET /api/duffel/payment-intents/:id
   */
  async getDuffelPaymentIntent(paymentIntentId: string): Promise<any> {
    try {
      const response = await api.get<any>(`/duffel/payment-intents/${paymentIntentId}`);
      return response;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Confirm a Duffel payment intent
   * POST /api/duffel/payment-intents/:id/confirm
   */
  async confirmDuffelPaymentIntent(paymentIntentId: string): Promise<{
    success: boolean;
    payment_intent?: any;
    error?: string;
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        payment_intent?: any;
        error?: string;
      }>(`/duffel/payment-intents/${paymentIntentId}/confirm`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to confirm payment intent'
      };
    }
  }

  /**
   * Get Duffel seat maps
   * GET /api/duffel/seat-maps
   */
  async getDuffelSeatMaps(params: {
    offer_id?: string;
    order_id?: string;
    segment_id?: string;
  }): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params.offer_id) queryParams.append('offer_id', params.offer_id);
      if (params.order_id) queryParams.append('order_id', params.order_id);
      if (params.segment_id) queryParams.append('segment_id', params.segment_id);
      
      const response = await api.get<{
        success: boolean;
        data?: any[];
        error?: string;
      }>(`/duffel/seat-maps?${queryParams.toString()}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get seat maps'
      };
    }
  }

  /**
   * Get Duffel order by ID
   * GET /api/duffel/orders/:id
   */
  async getDuffelOrder(orderId: string): Promise<any> {
    try {
      const response = await api.get<any>(`/duffel/orders/${orderId}`);
      return response;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Cancel a Duffel order
   * POST /api/duffel/order-cancellations
   */
  async cancelDuffelOrder(orderId: string): Promise<{
    success: boolean;
    cancellation?: any;
    error?: string;
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        cancellation?: any;
        error?: string;
      }>('/duffel/order-cancellations', { order_id: orderId });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to cancel order'
      };
    }
  }

  /**
   * Confirm a Duffel order cancellation
   * POST /api/duffel/order-cancellations/:id/confirm
   */
  async confirmDuffelCancellation(cancellationId: string): Promise<{
    success: boolean;
    cancellation?: any;
    error?: string;
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        cancellation?: any;
        error?: string;
      }>(`/duffel/order-cancellations/${cancellationId}/confirm`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to confirm cancellation'
      };
    }
  }

  // ============================================================================
  // Duffel Bags & Ancillaries
  // ============================================================================

  /**
   * Get available services for an offer
   * GET /api/duffel/offers/:id/available-services
   */
  async getDuffelAvailableServices(offerId: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const response = await api.get<{
        success: boolean;
        data?: any[];
        error?: string;
      }>(`/duffel/offers/${offerId}/available-services`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get available services'
      };
    }
  }

  /**
   * Add baggage to an order
   * POST /api/duffel/bags
   */
  async addDuffelBaggage(params: {
    order_id: string;
    services: Array<{
    id: string;
    quantity: number;
  }>;
  }): Promise<{
    success: boolean;
    order?: any;
    error?: string;
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        order?: any;
        error?: string;
      }>('/duffel/bags', params);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to add baggage'
      };
    }
  }

  /**
   * Get available services for an order
   * GET /api/duffel/orders/:id/available-services
   */
  async getDuffelOrderAvailableServices(orderId: string): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const response = await api.get<{
        success: boolean;
        data?: any[];
        error?: string;
      }>(`/duffel/orders/${orderId}/available-services`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get order available services'
      };
    }
  }

  // ============================================================================
  // Duffel Loyalty Programme Accounts
  // ============================================================================

  /**
   * Get loyalty programme accounts
   * GET /api/duffel/loyalty-programme-accounts
   */
  async getDuffelLoyaltyAccounts(params?: {
    passenger_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.passenger_id) queryParams.append('passenger_id', params.passenger_id);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      
      const response = await api.get<{
        success: boolean;
        data?: any[];
        error?: string;
      }>(`/duffel/loyalty-programme-accounts?${queryParams.toString()}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get loyalty accounts'
      };
    }
  }

  /**
   * Create a loyalty programme account
   * POST /api/duffel/loyalty-programme-accounts
   */
  async createDuffelLoyaltyAccount(params: {
    passenger_id: string;
    airline_iata_code: string;
    account_number: string;
  }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        data?: any;
        error?: string;
      }>('/duffel/loyalty-programme-accounts', params);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create loyalty account'
      };
    }
  }

  /**
   * Delete a loyalty programme account
   * DELETE /api/duffel/loyalty-programme-accounts/:id
   */
  async deleteDuffelLoyaltyAccount(accountId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await api.delete(`/duffel/loyalty-programme-accounts/${accountId}`);
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete loyalty account'
      };
    }
  }

  // ============================================================================
  // Duffel Cancel For Any Reason (CFAR)
  // ============================================================================

  /**
   * Get CFAR offers for an order
   * POST /api/duffel/cfar-offers
   */
  async getDuffelCFAROffers(orderId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        data?: any;
        error?: string;
      }>('/duffel/cfar-offers', { order_id: orderId });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get CFAR offers'
      };
    }
  }

  /**
   * Create a CFAR contract
   * POST /api/duffel/cfar-contracts
   */
  async createDuffelCFARContract(params: {
    cfar_offer_id: string;
    payment_method?: { type: 'balance' | 'card' };
  }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        data?: any;
        error?: string;
      }>('/duffel/cfar-contracts', params);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create CFAR contract'
      };
    }
  }

  /**
   * Create a CFAR claim (request refund)
   * POST /api/duffel/cfar-claims
   */
  async createDuffelCFARClaim(params: {
    cfar_contract_id: string;
    reason?: string;
  }): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await api.post<{
        success: boolean;
        data?: any;
        error?: string;
      }>('/duffel/cfar-claims', params);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create CFAR claim'
      };
    }
  }

  /**
   * Get CFAR contract by ID
   * GET /api/duffel/cfar-contracts/:id
   */
  async getDuffelCFARContract(contractId: string): Promise<any> {
    try {
      const response = await api.get<any>(`/duffel/cfar-contracts/${contractId}`);
      return response;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Get CFAR claim by ID
   * GET /api/duffel/cfar-claims/:id
   */
  async getDuffelCFARClaim(claimId: string): Promise<any> {
    try {
      const response = await api.get<any>(`/duffel/cfar-claims/${claimId}`);
      return response;
    } catch (error: any) {
      return null;
    }
  }
}

// Export singleton instance
const flightApi = new FlightApi();
export default flightApi;
