// Booking Types for Travel Module

export type BookingType = 'flight' | 'hotel' | 'ancillary';
export type BookingStatus = 'pending' | 'confirmed' | 'issued' | 'cancelled' | 'amended' | 'reissued';
export type PassengerType = 'ADT' | 'CHD' | 'INF';
export type JourneyType = 'DEP' | 'ARR' | 'TRANSIT';
export type RequestType = 'confirm' | 'pricing' | 'amendment' | 'reissue' | 'cancellation';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type NotificationType = 'email' | 'sms' | 'system' | 'whatsapp';

// Old/New Details for amendments
export interface BookingDetails {
  bookingRef: string;
  invoice: string;
  supplierRef: string;
  date: Date;
  time: string;
  status: BookingStatus;
}

// Flight Segment
export interface FlightSegment {
  id: string;
  journey: JourneyType;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  date: Date;
  departureTime: string;
  arrivalTime: string;
  terminal: string;
  class: string;
  seat: string;
  stopOver: number;
  bags: string;
  status: string;
  pnr: string;
}

// Passenger
export interface Passenger {
  id: string;
  pNo: number;
  ticketNumber: string;
  name: string;
  type: PassengerType;
  dateOfBirth?: Date;
  passportNumber?: string;
  passportExpiry?: Date;
  nationality?: string;
}

// Customer Costing
export interface CustomerCosting {
  pNo: number;
  passengerName: string;
  fareBase: number;
  taxes: number;
  markup: number;
  serviceCharge: number;
  netCost: number;
}

// Supplier Costing
export interface SupplierCosting {
  pNo: number;
  passengerName: string;
  fareBase: number;
  taxes: number;
  commission: number;
  netCost: number;
}

// Supplier Details
export interface SupplierDetails {
  supplierId: string;
  supplierName: string;
  contactMode: 'email' | 'phone' | 'api';
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
}

// Hotel Booking
export interface HotelBooking {
  id: string;
  hotelName: string;
  checkIn: Date;
  checkOut: Date;
  roomType: string;
  numberOfRooms: number;
  ratePerNight: number;
  totalNights: number;
  mealPlan: 'RO' | 'BB' | 'HB' | 'FB' | 'AI';
  specialRequests?: string;
  confirmationNumber?: string;
}

// Hotel Costing
export interface HotelCustomerCosting {
  roomNumber: number;
  guestName: string;
  roomRate: number;
  taxes: number;
  markup: number;
  serviceCharge: number;
  netCost: number;
}

export interface HotelSupplierCosting {
  roomNumber: number;
  guestName: string;
  roomRate: number;
  taxes: number;
  commission: number;
  netCost: number;
}

// Ancillary Service
export interface AncillaryService {
  id: string;
  serviceType: 'visa' | 'insurance' | 'transfer' | 'tour' | 'baggage' | 'seat' | 'meal' | 'lounge' | 'other';
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  linkedPassenger?: string;
  linkedBooking?: string;
}

// Customer Request Form
export interface CustomerRequest {
  id: string;
  queueNo: string;
  requestType: RequestType;
  priority: Priority;
  customerId: string;
  customerMessage: string;
  oldDetails?: BookingDetails;
  passengers: Passenger[];
  flightSegments?: FlightSegment[];
  hotelBooking?: HotelBooking;
  ancillaryServices?: AncillaryService[];
  supplierDetails: SupplierDetails;
  createdAt: Date;
  updatedAt: Date;
}

// Amendment Request
export interface AmendmentRequest {
  id: string;
  originalBookingRef: string;
  amendmentType: 'date_change' | 'name_change' | 'route_change' | 'class_upgrade' | 'add_service' | 'remove_service';
  oldDetails: BookingDetails;
  newDetails: Partial<BookingDetails>;
  oldItinerary?: FlightSegment[];
  newItinerary?: FlightSegment[];
  oldHotelDetails?: HotelBooking;
  newHotelDetails?: Partial<HotelBooking>;
  amendmentFee: number;
  fareDifference: number;
  totalCharge: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
}

// Reissue Request
export interface ReissueRequest {
  id: string;
  originalBookingRef: string;
  originalTickets: string[];
  newTickets: string[];
  oldDetails: BookingDetails;
  newDetails: BookingDetails;
  oldItinerary: FlightSegment[];
  newItinerary: FlightSegment[];
  customerCosting: CustomerCosting[];
  supplierCosting: SupplierCosting[];
  reissueFee: number;
  fareDifference: number;
  taxDifference: number;
  totalCharge: number;
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

// Complete Booking
export interface Booking {
  id: string;
  type: BookingType;
  queueNo: string;
  bookingRef: string;
  invoice: string;
  status: BookingStatus;
  customerRequest: CustomerRequest;
  flightSegments?: FlightSegment[];
  hotelBookings?: HotelBooking[];
  ancillaryServices?: AncillaryService[];
  customerCosting: CustomerCosting[] | HotelCustomerCosting[];
  supplierCosting: SupplierCosting[] | HotelSupplierCosting[];
  supplierDetails: SupplierDetails;
  totalCustomerCost: number;
  totalSupplierCost: number;
  profit: number;
  amendments?: AmendmentRequest[];
  reissues?: ReissueRequest[];
  createdAt: Date;
  updatedAt: Date;
}

// Notification
export interface Notification {
  id: string;
  customerId: string;
  title: string;
  type: NotificationType;
  priority: Priority;
  message: string;
  sentAt?: Date;
  status: 'draft' | 'sent' | 'delivered' | 'failed';
}
