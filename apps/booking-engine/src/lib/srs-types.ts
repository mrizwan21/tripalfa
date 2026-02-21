export type Money = { amount: number; currency: string };

export type BookingStatus =
  | 'On hold'
  | 'In process'
  | 'Ticketed'
  | 'Refund on hold'
  | 'Refunded'
  | 'Cancel in process'
  | 'Canceled'
  | 'Additional request'
  | 'Service confirmed'
  | 'Service rejected'
  | 'Used'
  | 'Vouchered'
  | 'Issued'
  | 'Hold';

export interface Booking {
  id: string;
  bookingId?: string; // TL-###### when issued
  userId?: string; // Added for wallet integration
  product: 'hotel' | 'flight';
  status: BookingStatus | string;
  reference?: string;
  total: Money;
  createdAt: string; // ISO
  paymentStatus?: string;
  details?: any;
  raw?: any;
}

export interface HotelRoom {
  id: string;
  name: string;
  boardType?: string;
  rateType?: string;
  roomView?: string;
  originalPrice: Money;
  tax?: number;
  commission?: number;
  availability?: number;
}

export interface Hotel {
  id: string;
  name: string;
  rating?: number;
  address?: { street?: string; city?: string; country?: string; zip?: string };
  latitude?: number;
  longitude?: number;
  images?: { url: string; hero?: boolean; maxwidth?: number }[];
  facilities?: { code: string; name: string; free?: boolean }[];
  rooms: HotelRoom[];
  raw?: any;
}

export interface FlightSegment {
  id?: string;
  from?: string; // Deprecated, use origin
  to?: string; // Deprecated, use destination
  depart?: string; // Deprecated, use departureTime
  arrive?: string; // Deprecated, use arrivalTime
  origin: string;
  originCity?: string;
  destination: string;
  destinationCity?: string;
  departureTime: string; // ISO
  arrivalTime: string; // ISO
  flightNumber?: string;
  airline?: string;
  carrierCode?: string;
  duration?: string;
  layoverDuration?: string | null;
  departureTerminal?: string;
  arrivalTerminal?: string;
  aircraft?: string;
  airlineLogo?: string;
}

export interface FlightFare {
  fareId: string;
  cabin: string;
  amount: number;
  currency: string;
  includedBags: { quantity: number; weight?: number; unit?: string; type?: string }[];
  segments?: FlightSegment[];
  rules?: string;
  raw?: any;
}

export interface SpecialServiceRequest {
  code: string;
  name: string;
  description?: string;
  price: number;
  status: 'Confirmed' | 'Pending' | 'Rejected' | 'RQ';
  passengerIndex?: number;
}

export interface AncillaryService {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  type: 'baggage' | 'seat' | 'meal' | 'other';
  raw?: any;
}

export interface Flight extends FlightFare {
  id: string;
  airline: string;
  carrierCode: string;
  flightNumber: string;
  origin: string;
  originCity?: string;
  destination: string;
  destinationCity?: string;
  duration: string;
  stops: number;
  departureTime: string;
  arrivalTime: string;
  isLCC?: boolean;
  airlineLogo?: string;
  refundable?: boolean;
  ancillaries?: AncillaryService[];
  upsells?: Flight[];
}

export interface WalletAccount {
  currency: string;
  currentBalance: number;
  pendingBalance: number;
  status?: string;
}