/**
 * Duffel API Types
 * Comprehensive TypeScript definitions for Duffel API integration
 * Based on Duffel API documentation: https://duffel.com/docs/api
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';

export type PassengerType = 'adult' | 'child' | 'infant';

export type OrderType = 'instant' | 'hold';

export type PaymentType = 'balance' | 'card' | 'pay_later';

// ============================================================================
// AIRPORT & LOCATION TYPES
// ============================================================================

export interface DuffelAirport {
  id: string;
  iata_code: string;
  name: string;
  city_name?: string;
  city?: {
    name: string;
    iata_code?: string;
  };
  country?: string;
  country_code?: string;
  latitude?: number;
  longitude?: number;
  time_zone?: string;
  icao_code?: string;
}

export interface DuffelPlace {
  id: string;
  name: string;
  iata_code: string;
  city_name?: string;
  country_name?: string;
  type: 'airport' | 'city';
}

// ============================================================================
// AIRLINE & AIRCRAFT TYPES
// ============================================================================

export interface DuffelAirline {
  id: string;
  iata_code: string;
  icao_code?: string;
  name: string;
  logo_symbol_url?: string;
  logo_lockup_url?: string;
  country_code?: string;
}

export interface DuffelAircraft {
  id: string;
  iata_code: string;
  icao_code?: string;
  name: string;
}

// ============================================================================
// PASSENGER TYPES
// ============================================================================

export interface DuffelPassengerBase {
  type: PassengerType;
  given_name?: string;
  family_name?: string;
  email?: string;
  phone_number?: string;
  born_at?: string; // ISO 8601 date
  gender?: 'm' | 'f';
  title?: 'mr' | 'mrs' | 'ms' | 'miss' | 'dr' | 'prof';
  id?: string;
}

export interface DuffelPassenger extends DuffelPassengerBase {
  id: string;
  fare_brand_name?: string;
  cabin_class?: CabinClass;
  baggages?: DuffelBaggage[];
  loyalty_programme?: {
    airline_iata_code: string;
    account_number: string;
  };
}

export interface DuffelBaggage {
  id?: string;
  type: 'checked' | 'carry_on';
  quantity: number;
  maximum_weight_kg?: number;
  maximum_dimensions?: {
    length_cm: number;
    width_cm: number;
    height_cm: number;
  };
}

// ============================================================================
// SLICE & SEGMENT TYPES
// ============================================================================

export interface DuffelSlice {
  id?: string;
  origin: string | DuffelAirport;
  destination: string | DuffelAirport;
  departure_date: string;
  origin_type?: 'airport' | 'city';
  destination_type?: 'airport' | 'city';
  segments?: DuffelSegment[];
  duration?: string; // ISO 8601 duration
  conditions?: DuffelSliceConditions;
}

export interface DuffelSegment {
  id: string;
  origin: DuffelAirport;
  destination: DuffelAirport;
  departing_at: string; // ISO 8601 datetime
  arriving_at: string; // ISO 8601 datetime
  duration?: string; // ISO 8601 duration
  distance?: number; // in kilometers
  marketing_carrier: DuffelAirline;
  marketing_carrier_flight_number: string;
  operating_carrier?: DuffelAirline;
  operating_carrier_flight_number?: string;
  aircraft?: DuffelAircraft;
  origin_terminal?: string;
  destination_terminal?: string;
  cabin_class?: CabinClass;
  fare_brand_name?: string;
  amenities?: DuffelAmenity[];
  passengers?: {
    passenger_id: string;
    fare_brand_name?: string;
    cabin_class: CabinClass;
    seat?: {
      designator: string;
    };
  }[];
}

export interface DuffelAmenity {
  id: string;
  name: string;
  description?: string;
  type: 'meal' | 'beverage' | 'entertainment' | 'wifi' | 'power' | 'other';
  is_complimentary?: boolean;
}

export interface DuffelSliceConditions {
  change_before_departure?: DuffelCondition;
  refund_before_departure?: DuffelCondition;
}

export interface DuffelCondition {
  allowed: boolean;
  penalty_amount?: string;
  penalty_currency?: string;
}

// ============================================================================
// OFFER TYPES
// ============================================================================

export interface DuffelOfferRequest {
  id: string;
  live_mode: boolean;
  slices: DuffelSlice[];
  passengers: DuffelPassengerBase[];
  cabin_class: CabinClass;
  offers?: DuffelOffer[];
  created_at: string;
  updated_at: string;
}

export interface DuffelOffer {
  id: string;
  live_mode: boolean;
  owner: DuffelAirline;
  slices: DuffelSlice[];
  passengers: DuffelPassenger[];
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
  conditions?: DuffelOfferConditions;
  available_services?: DuffelService[];
  created_at: string;
  updated_at: string;
  expires_at?: string;
}

export interface DuffelOfferConditions {
  change_before_departure?: DuffelCondition;
  refund_before_departure?: DuffelCondition;
}

export interface DuffelService {
  id: string;
  type: 'baggage' | 'seat' | 'meal' | 'lounge' | 'priority_boarding' | 'other';
  total_amount: string;
  total_currency: string;
  passenger_id?: string;
  segment_id?: string;
  metadata?: {
    name?: string;
    description?: string;
    maximum_weight_kg?: number;
    maximum_dimensions?: {
      length_cm: number;
      width_cm: number;
      height_cm: number;
    };
    maximum_quantity?: number;
  };
}

// ============================================================================
// ORDER TYPES
// ============================================================================

export interface DuffelOrder {
  id: string;
  live_mode: boolean;
  type: OrderType;
  owner: DuffelAirline;
  slices: DuffelSlice[];
  passengers: DuffelPassenger[];
  base_amount: string;
  base_currency: string;
  tax_amount: string;
  tax_currency: string;
  total_amount: string;
  total_currency: string;
  booking_reference: string;
  status: 'created' | 'pending' | 'paid' | 'confirmed' | 'ticketed' | 'cancelled' | 'expired';
  payment_status: 'awaiting_payment' | 'partial' | 'paid' | 'refunded';
  documents?: DuffelDocument[];
  services?: DuffelService[];
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  ticketed_at?: string;
}

export interface DuffelDocument {
  id: string;
  type: 'ticket' | 'boarding_pass' | 'invoice' | 'receipt' | 'itinerary';
  passenger_id: string;
  passenger_name?: string;
  ticket_number?: string;
  booking_reference?: string;
  download_url?: string;
}

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export interface DuffelPaymentIntent {
  id: string;
  live_mode: boolean;
  order_id: string;
  amount: string;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'requires_action';
  client_token?: string;
  payment_method?: DuffelPaymentMethod;
  created_at: string;
  updated_at: string;
}

export interface DuffelPaymentMethod {
  id: string;
  type: PaymentType;
  card?: {
    brand: string;
    last_four_digits: string;
    expiry_month: number;
    expiry_year: number;
  };
  balance?: {
    available_amount: string;
    available_currency: string;
  };
}

// ============================================================================
// SEAT MAP TYPES
// ============================================================================

export interface DuffelSeatMap {
  id: string;
  segment_id: string;
  slice_id: string;
  cabins: DuffelCabin[];
}

export interface DuffelCabin {
  cabin_class: CabinClass;
  deck: number;
  aisles: number;
  rows: DuffelSeatRow[];
  wings?: {
    first_row: number;
    last_row: number;
  };
}

export interface DuffelSeatRow {
  row_number: number;
  sections: DuffelSeatSection[];
}

export interface DuffelSeatSection {
  elements: DuffelSeatElement[];
}

export interface DuffelSeatElement {
  type: 'seat' | 'empty' | 'lavatory' | 'galley' | 'bassinet' | 'closet' | 'exit_row';
  designator?: string;
  name?: string;
  available_services?: DuffelSeatService[];
  disclosures?: string[];
}

export interface DuffelSeatService {
  id: string;
  total_amount: string;
  total_currency: string;
  passenger_id?: string;
}

// ============================================================================
// CANCELLATION & CHANGE TYPES
// ============================================================================

export interface DuffelOrderCancellation {
  id: string;
  order_id: string;
  status: 'pending' | 'confirmed' | 'failed' | 'expired';
  refund_amount?: string;
  refund_currency?: string;
  created_at: string;
  confirmed_at?: string;
}

export interface DuffelOrderChangeRequest {
  id: string;
  order_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  slices?: DuffelSlice[];
  created_at: string;
}

export interface DuffelOrderChangeOffer {
  id: string;
  order_change_request_id: string;
  total_amount: string;
  total_currency: string;
  tax_amount: string;
  tax_currency: string;
  slices: DuffelSlice[];
  expires_at?: string;
}

// ============================================================================
// API REQUEST/PARAM TYPES
// ============================================================================

export interface CreateOfferRequestParams {
  slices: Array<{
    origin: string;
    destination: string;
    departure_date: string;
  }>;
  passengers: Array<{
    type: PassengerType;
    given_name?: string;
    family_name?: string;
  }>;
  cabin_class?: CabinClass;
  return_available_services?: boolean;
  supplier_timeout?: number;
  // Private fares support - Duffel API
  source?: 'duffel' | 'alliance' | 'airline' | 'corporate';
  payment_partner?: string;
  brand_id?: string;
  loyalty_programme_accounts?: Array<{
    airline_iata_code: string;
    account_number: string;
  }>;
}

export interface CreateOrderParams {
  selected_offers: string[];
  passengers: Array<{
    id?: string;
    type: PassengerType;
    given_name: string;
    family_name: string;
    email: string;
    phone_number: string;
    born_at?: string;
    gender?: 'm' | 'f';
    title?: 'mr' | 'mrs' | 'ms' | 'miss' | 'dr' | 'prof';
    loyalty_programme?: {
      airline_iata_code: string;
      account_number: string;
    };
  }>;
  type?: OrderType;
  payment_method?: {
    type: PaymentType;
    id?: string;
  };
  metadata?: Record<string, string>;
}

export interface CreatePaymentIntentParams {
  order_id: string;
  amount: string;
  currency: string;
  return_url?: string;
}

// ============================================================================
// FRONTEND DISPLAY TYPES (Mapped from Duffel)
// ============================================================================

export interface FlightSearchResult {
  id: string;
  offerId: string;
  tripType: 'one-way' | 'round-trip' | 'multi-city';
  airline: string;
  carrierCode: string;
  flightNumber: string;
  departureTime: string;
  origin: string;
  originCity?: string;
  originResolved?: string;
  arrivalTime: string;
  destination: string;
  destinationCity?: string;
  destinationResolved?: string;
  duration: string;
  stops: number;
  amount: number;
  currency: string;
  refundable: boolean;
  changeable?: boolean;
  refundPenalty?: string | null;
  changePenalty?: string | null;
  includedBags: Array<{
    quantity: number;
    weight?: number;
    unit: string;
    type?: string;
  }>;
  segments: FlightSegment[];
  extraSlices?: FlightExtraSlice[];
  rawOffer: DuffelOffer;
}

export interface FlightSegment {
  id: string;
  origin: string;
  originCity?: string;
  destination: string;
  destinationCity?: string;
  departureTime: string;
  arrivalTime: string;
  flightNumber: string;
  airline: string;
  duration: string;
  layoverDuration?: string | null;
  departureTerminal?: string | null;
  arrivalTerminal?: string | null;
  aircraft?: string;
}

export interface FlightExtraSlice {
  origin: string;
  originCity?: string;
  destination: string;
  destCity?: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
}

export interface FlightSearchFilters {
  stops: Set<string>;
  airlines: Set<string>;
  countries: Set<string>;
  alliances: Set<string>;
  minPrice?: number;
  maxPrice?: number;
  departureTime?: string[];
}

export interface FlightSearchState {
  loading: boolean;
  error: string | null;
  flights: FlightSearchResult[];
  filters: FlightSearchFilters;
  searchParams: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    travelers: number;
    cabinClass: CabinClass;
    tripType: 'roundTrip' | 'oneWay' | 'multiCity';
  };
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseDuffelSearchResult {
  search: (params: CreateOfferRequestParams) => Promise<void>;
  loading: boolean;
  error: string | null;
  flights: FlightSearchResult[];
  reset: () => void;
}

export interface UseDuffelOrderResult {
  createOrder: (params: CreateOrderParams) => Promise<DuffelOrder>;
  getOrder: (orderId: string) => Promise<DuffelOrder>;
  loading: boolean;
  error: string | null;
  order: DuffelOrder | null;
}
