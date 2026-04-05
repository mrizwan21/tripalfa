/**
 * Duffel API Types
 * 
 * Comprehensive type definitions for all Duffel API responses
 */

// ============================================================================
// GENERIC API RESPONSE TYPES
// ============================================================================

export interface DuffelMeta {
  link_id: string;
  offered_at: string;
  expires_at: string;
}

export interface DuffelResponse<T> {
  data: T;
  meta?: DuffelMeta;
}

export interface DuffelListResponse<T> {
  data: T[];
  meta?: {
    link_id: string;
    has_more: boolean;
    cursor?: string;
  };
}

// ============================================================================
// OFFER REQUEST TYPES
// ============================================================================

export interface DuffelOfferRequest {
  id: string;
  live_mode: boolean;
  created_at: string;
  slices: Array<{
    id: string;
    origin_type: string;
    destinations: Array<{
      type: string;
      time: string;
      place: {
        type: string;
        name: string;
        time_zone: string;
        iata_code: string;
        iata_type: string;
        city?: {
          name: string;
          iata_code: string;
        };
        country?: {
          name: string;
          code: string;
        };
      };
    }>;
  }>;
  passengers: Array<{
    type: 'adult' | 'child' | 'infant';
    id?: string;
  }>;
  cabin_class: 'economy' | 'business' | 'first' | 'premium_economy';
  offers: DuffelOffer[];
}

// ============================================================================
// OFFER TYPES
// ============================================================================

export interface DuffelOffer {
  id: string;
  live_mode: boolean;
  created_at: string;
  owner: {
    name: string;
    id: string;
    iata_code: string;
    logo_symbol_url?: string;
  };
  slices: Array<{
    id: string;
    origin: {
      type: string;
      time: string;
      place: {
        name: string;
        iata_code: string;
        city?: { name: string; iata_code: string };
        country?: { name: string; code: string };
      };
    };
    destination: {
      type: string;
      time: string;
      place: {
        name: string;
        iata_code: string;
        city?: { name: string; iata_code: string };
        country?: { name: string; code: string };
      };
    };
    segments: Array<{
      id: string;
      origin: { flight_number: string; terminal?: string; time: string; place: { name: string; iata_code: string } };
      destination: { flight_number: string; terminal?: string; time: string; place: { name: string; iata_code: string } };
      passengers: Array<{
        passenger_id: string;
        cabin_class_marketing_name: string;
        cabin_class: string;
        fare_basis_code?: string;
        baggages: Array<{
          type: string;
          quantity: number;
        }>;
      }>;
      distance: { value: number; unit: string };
      duration: string;
      marketing_carrier: { name: string; id: string; iata_code: string };
      operating_carrier: { name: string; id: string; iata_code: string };
    }>;
    duration: string;
    fare_brand_name?: string;
    conditions: {
      change_before_departure?: {
        allowed: boolean;
        penalty_currency?: string;
        penalty_amount?: string;
      };
      refund_before_departure?: {
        allowed: boolean;
        penalty_currency?: string;
        penalty_amount?: string;
      };
    };
  }>;
  passengers: Array<{
    id: string;
    type: 'adult' | 'child' | 'infant';
    given_name?: string;
    family_name?: string;
  }>;
  base_amount: string;
  base_currency: string;
  tax_amount: string;
  tax_currency: string;
  total_amount: string;
  total_currency: string;
  payment_requirements?: {
    payment_required_by?: string;
    price_guarantee_expires_at?: string;
  };
  supported_passenger_identity_types?: string[];
  available_services?: Array<{
    id: string;
    type: string;
    passenger_ids: string[];
    segment_ids: string[];
    total_amount: string;
    total_currency: string;
    metadata?: Record<string, unknown>;
  }>;
  conditions: {
    change_before_departure?: { allowed: boolean; penalty_amount?: string; penalty_currency?: string };
    refund_before_departure?: { allowed: boolean; penalty_amount?: string; penalty_currency?: string };
  };
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export interface DuffelOrder {
  id: string;
  live_mode: boolean;
  created_at: string;
  booking_reference: string;
  status: 'awaiting_payment' | 'partially_refunded' | 'refunded' | 'cancelled' | 'confirmed';
  owner: {
    name: string;
    id: string;
    iata_code: string;
  };
  slices: Array<{
    id: string;
    origin_type: string;
    destination_type: string;
    origin: { time: string; place: { name: string; iata_code: string } };
    destination: { time: string; place: { name: string; iata_code: string } };
    segments: Array<{
      id: string;
      origin: { terminal?: string; time: string; place: { name: string; iata_code: string } };
      destination: { terminal?: string; time: string; place: { name: string; iata_code: string } };
      marketing_carrier: { name: string; id: string; iata_code: string };
      operating_carrier: { name: string; id: string; iata_code: string };
    }>;
  }>;
  passengers: Array<{
    id: string;
    type: 'adult' | 'child' | 'infant';
    given_name: string;
    family_name: string;
    email?: string;
    phone_number?: string;
  }>;
  base_amount: string;
  base_currency: string;
  tax_amount: string;
  tax_currency: string;
  total_amount: string;
  total_currency: string;
  payment_status?: {
    price_guarantee_expires_at?: string;
    payment_required_by?: string;
    paid_at?: string;
  };
  services?: Array<{
    id: string;
    type: string;
    status: string;
    total_amount: string;
    total_currency: string;
    metadata?: Record<string, unknown>;
  }>;
  metadata?: Record<string, unknown>;
  synced_at?: string;
}

// ============================================================================
// CANCELLATION TYPES
// ============================================================================

export interface DuffelCancellation {
  id: string;
  live_mode: boolean;
  created_at: string;
  order_id: string;
  refund_to: string;
  refund_amount: string;
  refund_currency: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmed_at?: string;
  expires_at?: string;
  available_actions?: string[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// ORDER CHANGE TYPES
// ============================================================================

export interface DuffelOrderChangeRequest {
  id: string;
  live_mode: boolean;
  order_id: string;
  status: string;
  change_offers?: DuffelOrderChangeOffer[];
  created_at: string;
  updated_at: string;
}

export interface DuffelOrderChangeOffer {
  id: string;
  live_mode: boolean;
  order_change_request_id: string;
  owner: { name: string; id: string; iata_code: string };
  slices: Array<{
    id: string;
    origin: { place: { name: string; iata_code: string } };
    destination: { place: { name: string; iata_code: string } };
  }>;
  base_amount: string;
  base_currency: string;
  tax_amount: string;
  tax_currency: string;
  total_amount: string;
  total_currency: string;
  change_total_amount: string;
  change_currency: string;
  created_at: string;
  expires_at: string;
  updated_at: string;
}

export interface DuffelOrderChange {
  id: string;
  live_mode: boolean;
  order_id: string;
  status: string;
  change_total_amount: string;
  change_currency: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// AIRLINE CREDIT TYPES
// ============================================================================

export interface DuffelAirlineCredit {
  id: string;
  live_mode: boolean;
  airline: { name: string; id: string; iata_code: string };
  credit_code: string;
  original_order_id: string;
  amount: string;
  currency: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// AIRPORT SEARCH TYPES
// ============================================================================

export interface DuffelAirport {
  name: string;
  iata_code: string;
  iata_type: string;
  city?: { name: string; iata_code: string };
  country?: { name: string; code: string };
  time_zone?: string;
  latitude?: number;
  longitude?: number;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface DuffelPaymentIntent {
  id: string;
  client_secret?: string;
  status: string;
  amount: { amount: string; currency: string };
  card_network?: string;
  created_at: string;
  expires_at?: string;
}

// ============================================================================
// GENERIC UNKNOWN DATA TYPE
// ============================================================================

export type DuffelUnknownData = Record<string, unknown>;