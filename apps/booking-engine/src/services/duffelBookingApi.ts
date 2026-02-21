/**
 * Duffel Flight Booking API Service
 * Complete integration for Offer Requests, Offers, Orders, and Payments
 */

import { API_BASE_URL } from '../lib/constants';

// Do not use provider secrets in frontend; all calls must go via backend
const API_ENV = import.meta.env.VITE_DUFFEL_ENV || 'test';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface FlightSlice {
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
}

export interface Passenger {
  type: 'adult' | 'child' | 'infant';
}

export interface OfferRequestParams {
  slices: FlightSlice[];
  passengers: Passenger[];
  cabin_class?: 'economy' | 'business' | 'first' | 'premium_economy';
}

export interface PaymentMethod {
  id: string;
  type: string;
  name: string;
  description?: string;
  supported_currencies?: string[];
  logo_url?: string;
}

export interface PaymentIntentParams {
  order_id: string;
  amount: {
    amount: number; // in cents
    currency: string;
  };
  return_url?: string;
}

export interface PaymentConfirmParams {
  paymentIntentId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  paymentMethodId?: string;
  provider?: string;
  environment?: string;
}

// ============================================================================
// SEAT MAP TYPES
// ============================================================================

export interface SeatElement {
  designator: string;     // e.g., "1A"
  type: 'seat' | 'empty' | 'lavatory' | 'galley' | 'bassinet' | 'closet';
  available_services?: Array<{
    id: string;
    passenger_id?: string;
    total_amount: string;
    total_currency: string;
  }>;
  disclosures?: any[];
}

export interface SeatSection {
  elements: SeatElement[];
}

export interface SeatRow {
  sections: SeatSection[];
}

export interface Cabin {
  cabin_class: string;    // 'economy', 'business', etc.
  deck: number;
  aisles: number;
  rows: SeatRow[];
}

export interface SeatMap {
  id: string;             // Seat map ID
  segment_id: string;     // Segment ID
  slice_id: string;       // Slice ID
  cabins: Cabin[];        // Array of cabins
}

export interface GetSeatMapsResponse {
  data: SeatMap[];
}

export interface SelectedSeat {
  designator: string;     // e.g., "1A"
  passengerId: string;
  segmentId: string;
  serviceId?: string;     // Available service ID for seat
}

/**
 * Create an offer request (search for flights)
 */
export async function createOfferRequest(params: OfferRequestParams): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'duffel',
        env: API_ENV,
        data: {
          slices: params.slices,
          passengers: params.passengers,
          cabin_class: params.cabin_class || 'economy',
          return_available_services: true,
        },
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const text = await response.text();
      let msg = text;
      try { const j = JSON.parse(text); msg = j.message || j.error || text; } catch {}
      throw new Error(msg || 'Failed to create offer request');
    }

    return await response.json();
  } catch (error) {
    console.error('[Duffel] Offer request error:', (error as any)?.message);
    throw error;
  }
}

/**
 * Get offer details by ID
 */
export async function getOfferDetails(offerId: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/offers/${offerId}`, { credentials: 'include' });
    if (!response.ok) {
      const text = await response.text();
      let msg = text;
      try { const j = JSON.parse(text); msg = j.message || j.error || text; } catch {}
      throw new Error(msg || 'Failed to fetch offer');
    }
    return await response.json();
  } catch (error) {
    console.error('[Duffel] Offer details error:', (error as any)?.message);
    throw error;
  }
}

// ============================================================================
// ORDERS - Create and manage flight orders
// ============================================================================

export interface PassengerData {
  id: string;
  email: string;
  type: 'adult' | 'child' | 'infant';
  given_name: string;
  family_name: string;
  phone_number: string;
  born_at?: string;
  gender?: 'M' | 'F';
}

export interface CreateOrderParams {
  selectedOffers: string[];
  passengers: PassengerData[];
  orderType?: 'instant' | 'hold';
  paymentMethod?: {
    type: 'balance' | 'card';
    id?: string;
  };
}

/**
 * Create a flight order from selected offers
 */
export async function createFlightOrder(params: CreateOrderParams): Promise<any> {
  try {
    console.log('[Duffel] Creating flight order:', params);

    const response = await fetch(`${API_BASE_URL}/bookings/flight/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'duffel',
        selectedOffers: params.selectedOffers,
        passengers: params.passengers,
        orderType: params.orderType || 'hold',
        paymentMethod: params.paymentMethod || { type: 'balance' },
        env: API_ENV,
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      const text = await response.text();
      let msg = text; try { const j = JSON.parse(text); msg = j.message || j.error || text; } catch {}
      throw new Error(msg || 'Failed to create order');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Duffel] Create order error:', error);
    throw error;
  }
}

/**
 * Get order details
 */
export async function getFlightOrder(orderId: string): Promise<any> {
  try {
    console.log('[Duffel] Fetching order:', orderId);

    const response = await fetch(
      `${API_BASE_URL}/bookings/flight/order/${orderId}?provider=duffel&env=${API_ENV}`,
      { credentials: 'include' }
    );

    if (!response.ok) {
      const text = await response.text();
      let msg = text; try { const j = JSON.parse(text); msg = j.message || j.error || text; } catch {}
      throw new Error(msg || 'Failed to fetch order');
    }

    const data = await response.json();
    console.log('[Duffel] Order details:', data);
    return data;
  } catch (error) {
    console.error('[Duffel] Get order error:', error);
    throw error;
  }
}

/**
 * Update order (add services, etc.)
 */
export async function updateFlightOrder(orderId: string, updateData: any): Promise<any> {
  try {
    console.log('[Duffel] Updating order:', orderId, updateData);

    const response = await fetch(`${API_BASE_URL}/bookings/flight/order/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'duffel', env: API_ENV, data: updateData }),
      credentials: 'include'
    });

    if (!response.ok) {
      const text = await response.text();
      let msg = text; try { const j = JSON.parse(text); msg = j.message || j.error || text; } catch {}
      throw new Error(msg || 'Failed to update order');
    }

    const data = await response.json();
    console.log('[Duffel] Order updated:', data);
    return data;
  } catch (error) {
    console.error('[Duffel] Update order error:', error);
    throw error;
  }
}

// ============================================================================
// PAYMENT INTENTS - Handle payment processing
// ============================================================================

/**
 * Create payment intent for order
 */
export async function createPaymentIntent(params: PaymentIntentParams): Promise<any> {
  try {
    console.log('[Duffel] Creating payment intent:', params);

    const response = await fetch(`${API_BASE_URL}/bookings/flight/payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'duffel', order_id: params.order_id, amount: params.amount, env: API_ENV }),
      credentials: 'include'
    });

    if (!response.ok) {
      const text = await response.text();
      let msg = text; try { const j = JSON.parse(text); msg = j.message || j.error || text; } catch {}
      throw new Error(msg || 'Failed to create payment intent');
    }

    const data = await response.json();
    console.log('[Duffel] Payment intent created:', data);
    return data;
  } catch (error) {
    console.error('[Duffel] Payment intent error:', error);
    throw error;
  }
}

// ============================================================================
// ORDER CONFIRMATION - Confirm held orders
// ============================================================================

/**
 * Confirm a held order (convert to booking)
 */
export async function confirmFlightOrder(orderId: string): Promise<any> {
  try {
    console.log('[Duffel] Confirming order:', orderId);

    const response = await fetch(`${API_BASE_URL}/bookings/flight/order/${orderId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'duffel', env: API_ENV }),
      credentials: 'include'
    });

    if (!response.ok) {
      const text = await response.text();
      let msg = text; try { const j = JSON.parse(text); msg = j.message || j.error || text; } catch {}
      throw new Error(msg || 'Failed to confirm order');
    }

    const data = await response.json();
    console.log('[Duffel] Order confirmed:', data);
    return data;
  } catch (error) {
    console.error('[Duffel] Confirm order error:', error);
    throw error;
  }
}

// ============================================================================
// COMPLETE BOOKING FLOW - Orchestrates all steps
// ============================================================================

export interface CompleteBookingRequest {
  searchParams: OfferRequestParams;
  selectedOfferId: string;
  passengers: PassengerData[];
  returnUrl: string;
  addServices?: any;
}

/**
 * Execute complete booking flow
 * 1. Create offer request
 * 2. Get order details
 * 3. Create payment intent
 * 4. Confirm order
 */
export async function completeBookingFlow(request: CompleteBookingRequest): Promise<any> {
  try {
    console.log('[Duffel] Starting complete booking flow');

    // Step 1: Create offer request (validate search params)
    console.log('[Duffel] Step 1: Creating offer request');
    const offerResponse = await createOfferRequest(request.searchParams);

    if (!offerResponse.offers || offerResponse.offers.length === 0) {
      throw new Error('No offers found for selected flights');
    }

    // Step 2: Create order
    console.log('[Duffel] Step 2: Creating order');
    const orderResponse = await createFlightOrder({
      selectedOffers: [request.selectedOfferId],
      passengers: request.passengers,
      orderType: 'hold',
      paymentMethod: { type: 'balance' },
    });

    if (!orderResponse.order) {
      throw new Error('Failed to create order');
    }

    const orderId = orderResponse.order.id;
    const total = orderResponse.order.total_amount;
    const currency = orderResponse.order.total_currency;

    // Step 3: Update order if services needed
    if (request.addServices) {
      console.log('[Duffel] Step 3a: Adding services');
      await updateFlightOrder(orderId, { services: request.addServices });
    }

    // Step 4: Create payment intent
    console.log('[Duffel] Step 3: Creating payment intent');
    const paymentResponse = await createPaymentIntent({
      order_id: orderId,
      amount: {
        amount: Math.round(total * 100),
        currency: currency
      },
      return_url: request.returnUrl,
    });

    if (!paymentResponse.paymentIntent) {
      throw new Error('Failed to create payment intent');
    }

    // Return payment URL and order ID for redirect
    return {
      success: true,
      orderId,
      paymentUrl: paymentResponse.paymentIntent.hosted_payment_page_url,
      order: orderResponse.order,
      payment: paymentResponse.paymentIntent,
    };
  } catch (error) {
    console.error('[Duffel] Complete booking flow error:', error);
    throw error;
  }
}

/**
 * Handle payment callback - confirm order after successful payment
 */
export async function handlePaymentCallback(orderId: string): Promise<any> {
  try {
    console.log('[Duffel] Handling payment callback for order:', orderId);

    // Confirm the order
    const confirmResponse = await confirmFlightOrder(orderId);

    if (!confirmResponse.order || !confirmResponse.order.bookings) {
      throw new Error('Failed to confirm order');
    }

    return {
      success: true,
      orderId,
      confirmationNumber: confirmResponse.order.bookings[0]?.confirmation_number || 'N/A',
      order: confirmResponse.order,
    };
  } catch (error) {
    console.error('[Duffel] Payment callback error:', error);
    throw error;
  }
}
/**
 * Get available payment methods
 * Retrieves all available payment methods that can be used for bookings
 */
export async function getPaymentMethods(provider: string = 'duffel', environment: string = 'test'): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/bookings/flight/payment-methods`, { method: 'GET', credentials: 'include' });
    if (!response.ok) throw new Error(`Failed to fetch payment methods: ${response.statusText}`);
    const result = await response.json();
    return result.paymentMethods || result.data?.payment_methods || [];
  } catch (error) {
    console.error('[Duffel] Get payment methods error:', (error as any)?.message);
    throw error;
  }
}

/**
 * Get available payment methods for a specific order
 * Shows which payment methods are available for this particular order
 */
export async function getOrderPaymentMethods(
  orderId: string,
  provider: string = 'duffel',
  environment: string = 'test'
): Promise<any> {
  try {
    console.log(`[Duffel] Fetching payment methods for order ${orderId}...`);

    const response = await fetch(
      `${API_BASE_URL}/bookings/flight/order/${orderId}/payment-methods?provider=${provider}&env=${environment}`,
      { method: 'GET', credentials: 'include' }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch order payment methods: ${response.statusText} ${text || ''}`);
    }

    const result = await response.json();
    console.log(`[Duffel] Order payment methods retrieved for ${orderId}:`, result);

    return result.paymentMethods || result.data?.available_payment_methods || [];
  } catch (error) {
    console.error('[Duffel] Get order payment methods error:', error);
    throw error;
  }
}

/**
 * Confirm a payment to finalize the booking
 * Authorizes payment and converts held order to confirmed booking
 */
export async function confirmPayment(params: {
  paymentIntentId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  paymentMethodId?: string;
  provider?: string;
  environment?: string;
}): Promise<any> {
  try {
    const { paymentIntentId, orderId, amount, currency = 'USD', paymentMethodId, provider = 'duffel', environment = 'test' } = params;

    const paymentData = { provider, env: environment, payment_intent_id: paymentIntentId, order_id: orderId, payment_method_id: paymentMethodId, ...(amount && { amount }), ...(currency && { currency }) };

    const response = await fetch(`${API_BASE_URL}/bookings/flight/payment-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
      credentials: 'include'
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to confirm payment: ${response.statusText} ${text || ''}`);
    }

    const result = await response.json();
    return result.paymentResult || result.data;
  } catch (error) {
    console.error('[Duffel] Confirm payment error:', (error as any)?.message);
    throw error;
  }
}

/**
 * Get payment details and status
 * Retrieve information about a specific payment
 */
export async function getPayment(
  paymentId: string,
  provider: string = 'duffel',
  environment: string = 'test'
): Promise<any> {
  try {
    console.log(`[Duffel] Fetching payment details for ${paymentId}...`);

    const response = await fetch(
      `${API_BASE_URL}/bookings/flight/payment/${paymentId}?provider=${provider}&env=${environment}`,
      { method: 'GET', credentials: 'include' }
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch payment details: ${response.statusText} ${text || ''}`);
    }

    const result = await response.json();
    console.log(`[Duffel] Payment details retrieved for ${paymentId}:`, result);

    return result.payment || result.data;
  } catch (error) {
    console.error('[Duffel] Get payment error:', error);
    throw error;
  }
}