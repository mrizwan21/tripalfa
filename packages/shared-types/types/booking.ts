// ============================================================================
// TripAlfa Shared Types - Booking Domain
// Multi-segment bookings with OTA-compliant data structures
// ============================================================================

import {
  BookingType,
  BookingStatus,
  PaymentStatus,
  ApprovalStatus,
  BookingSource,
  PassengerType,
  TicketStatus,
  QueueType,
  QueuePriority,
  QueueStatus,
  RemarkType,
  Gender,
} from './enums';

// ============================================================================
// Booking Types
// ============================================================================
export interface TaxBreakdownItem {
  code: string;
  name: string;
  amount: number;
  reclaimable: boolean;
}

export interface Booking {
  id: string;
  bookingRef: string;
  companyId?: string;
  branchId?: string;
  userId: string;
  createdById: string;
  supplierId?: string;
  type: BookingType;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  
  // Booking Data
  bookingData: FlightBookingData | HotelBookingData | CarBookingData | unknown;
  searchCriteria?: unknown;
  supplierResponse?: unknown;
  
  // Supplier References
  pnr?: string;
  supplierRef?: string;
  confirmationNo?: string;
  
  // Pricing
  currency: string;
  baseFare: number;
  taxes: number;
  fees: number;
  markup: number;
  discount: number;
  commission: number;
  totalAmount: number;
  paidAmount: number;
  
  // Tax breakdown
  taxBreakdown?: TaxBreakdownItem[];
  
  // Pricing rules
  markupRuleId?: string;
  commissionRuleId?: string;
  discountCouponId?: string;
  
  // Dates
  bookingDate: string;
  ticketingDeadline?: string;
  travelStartDate?: string;
  travelEndDate?: string;
  cancelledAt?: string;
  
  // Approval
  requiresApproval: boolean;
  approvalStatus?: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  
  // Source
  source: BookingSource;
  ipAddress?: string;
  userAgent?: string;
  
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Flight Booking Data
// ============================================================================
export interface FlightSegment {
  segmentRef: string;
  flightNumber: string;
  airline: string;
  operatingAirline?: string;
  aircraft?: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  duration: number; // minutes
  cabinClass: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  fareClass: string;
  baggageAllowance?: {
    weight?: number;
    unit?: 'KG' | 'LB';
    pieces?: number;
  };
  status: string;
}

export interface FlightBookingData {
  tripType: 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_CITY';
  segments: FlightSegment[];
  fareRules?: {
    changeFee?: number;
    cancelFee?: number;
    refundable: boolean;
  };
}

// ============================================================================
// Hotel Booking Data
// ============================================================================
export interface HotelRoom {
  roomRef: string;
  roomType: string;
  roomName: string;
  boardBasis: string; // 'RO', 'BB', 'HB', 'FB', 'AI'
  adults: number;
  children: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  ratePerNight: number;
  totalRate: number;
}

export interface HotelBookingData {
  hotelId: string;
  hotelName: string;
  hotelAddress: string;
  starRating: number;
  rooms: HotelRoom[];
  specialRequests?: string[];
  cancellationPolicy?: {
    freeCancellationUntil?: string;
    penalty?: number;
  };
}

// ============================================================================
// Car Booking Data
// ============================================================================
export interface CarBookingData {
  carId: string;
  carType: string;
  carName: string;
  supplier: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDateTime: string;
  dropoffDateTime: string;
  days: number;
  ratePerDay: number;
  totalRate: number;
  extras?: {
    name: string;
    price: number;
  }[];
  insurance?: {
    type: string;
    coverage: string;
    price: number;
  };
}

// ============================================================================
// Booking Create/Update Types
// ============================================================================
export interface BookingCreate {
  companyId?: string;
  branchId?: string;
  userId: string;
  supplierId?: string;
  type: BookingType;
  bookingData: FlightBookingData | HotelBookingData | CarBookingData | unknown;
  searchCriteria?: unknown;
  supplierResponse?: unknown;
  pnr?: string;
  supplierRef?: string;
  currency: string;
  baseFare: number;
  taxes: number;
  fees?: number;
  markup?: number;
  discount?: number;
  taxBreakdown?: TaxBreakdownItem[];
  ticketingDeadline?: string;
  travelStartDate?: string;
  travelEndDate?: string;
  source?: BookingSource;
  metadata?: Record<string, unknown>;
}

export interface BookingUpdate {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  pnr?: string;
  supplierRef?: string;
  confirmationNo?: string;
  paidAmount?: number;
  approvalStatus?: ApprovalStatus;
  approvedBy?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Passenger Types
// ============================================================================
export interface Ancillary {
  type: string;
  description: string;
  amount: number;
  segmentRef?: string;
}

export interface SeatAssignment {
  segmentRef: string;
  seatNo: string;
}

export interface FrequentFlyer {
  programCode: string;
  membershipNo: string;
}

export interface Passenger {
  id: string;
  bookingId: string;
  userId?: string;
  type: PassengerType;
  title?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: Gender;
  nationality: string;
  email?: string;
  phone?: string;
  
  // Travel Documents
  passportNumber?: string;
  passportExpiry?: string;
  passportCountry?: string;
  
  // Ticket info
  ticketNumber?: string;
  ticketStatus?: TicketStatus;
  ticketedAt?: string;
  
  // Pricing
  baseFare: number;
  taxes: number;
  totalAmount: number;
  
  // Extras
  ancillaries?: Ancillary[];
  seatAssignments?: SeatAssignment[];
  specialRequests: string[];
  frequentFlyer?: FrequentFlyer;
  
  isPrimary: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PassengerCreate {
  bookingId: string;
  userId?: string;
  type: PassengerType;
  title?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: Gender;
  nationality: string;
  email?: string;
  phone?: string;
  passportNumber?: string;
  passportExpiry?: string;
  passportCountry?: string;
  baseFare: number;
  taxes: number;
  ancillaries?: Ancillary[];
  seatAssignments?: SeatAssignment[];
  specialRequests?: string[];
  frequentFlyer?: FrequentFlyer;
  isPrimary?: boolean;
  metadata?: Record<string, unknown>;
}

export interface PassengerUpdate {
  title?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  passportNumber?: string;
  passportExpiry?: string;
  passportCountry?: string;
  ticketNumber?: string;
  ticketStatus?: TicketStatus;
  ancillaries?: Ancillary[];
  seatAssignments?: SeatAssignment[];
  specialRequests?: string[];
  frequentFlyer?: FrequentFlyer;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Booking Queue Types
// ============================================================================
export interface BookingQueue {
  id: string;
  bookingId: string;
  queueType: QueueType;
  priority: QueuePriority;
  status: QueueStatus;
  assignedTo?: string;
  dueDate?: string;
  notes?: string;
  attempts: number;
  lastAttempt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingQueueCreate {
  bookingId: string;
  queueType: QueueType;
  priority?: QueuePriority;
  assignedTo?: string;
  dueDate?: string;
  notes?: string;
}

export interface BookingQueueUpdate {
  priority?: QueuePriority;
  status?: QueueStatus;
  assignedTo?: string | null;
  dueDate?: string;
  notes?: string;
  resolution?: string;
}

// ============================================================================
// Booking Status History
// ============================================================================
export interface BookingStatusHistory {
  id: string;
  bookingId: string;
  fromStatus?: BookingStatus;
  toStatus: BookingStatus;
  changedBy?: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ============================================================================
// Booking Remarks
// ============================================================================
export interface BookingRemark {
  id: string;
  bookingId: string;
  type: RemarkType;
  text: string;
  isInternal: boolean;
  createdBy: string;
  createdAt: string;
}

export interface BookingRemarkCreate {
  bookingId: string;
  type: RemarkType;
  text: string;
  isInternal?: boolean;
}

// ============================================================================
// Booking Search/List Types
// ============================================================================
export interface BookingListParams {
  page?: number;
  limit?: number;
  search?: string;
  companyId?: string;
  branchId?: string;
  userId?: string;
  type?: BookingType;
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  fromDate?: string;
  toDate?: string;
  travelFromDate?: string;
  travelToDate?: string;
  sortBy?: 'bookingDate' | 'travelStartDate' | 'totalAmount' | 'bookingRef';
  sortOrder?: 'asc' | 'desc';
}

export interface BookingListResponse {
  data: Booking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// Booking with Relations
// ============================================================================
export interface BookingWithRelations extends Booking {
  passengers: Passenger[];
  statusHistory: BookingStatusHistory[];
  remarks: BookingRemark[];
  queue?: BookingQueue;
  company?: {
    id: string;
    code: string;
    name: string;
  };
  branch?: {
    id: string;
    code: string;
    name: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  supplier?: {
    id: string;
    code: string;
    name: string;
  };
}
