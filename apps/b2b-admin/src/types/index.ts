// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent extends User {
  department: string;
  assignedBookings: number;
  performanceMetrics: {
    avgResponseTime: number;
    satisfactionRating: number;
    bookingConversionRate: number;
  };
}

// Customer Types
export interface Customer {
  id: string;
  type: 'individual' | 'corporate';
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  companyRegistrationNumber?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  preferences: {
    preferredAirlines: string[];
    preferredHotels: string[];
    mealPreferences: string[];
    specialRequests: string[];
  };
  loyaltyInfo: {
    membershipLevel: string;
    points: number;
    tierStatus: string;
  };
  status: 'active' | 'inactive' | 'blacklisted';
  createdAt: Date;
  updatedAt: Date;
}

// Supplier Types
export interface Supplier {
  id: string;
  name: string;
  type: 'airline' | 'hotel' | 'car_rental' | 'insurance' | 'visa_service' | 'transfer_service';
  contactInfo: {
    email: string;
    phone: string;
    address: string;
    website: string;
  };
  contractDetails: {
    contractType: 'commission' | 'fixed_fee' | 'hybrid';
    commissionRate: number;
    paymentTerms: string;
    validityPeriod: {
      start: Date;
      end: Date;
    };
  };
  serviceDetails: {
    serviceAreas: string[];
    operatingHours: string;
    cancellationPolicy: string;
    specialTerms: string[];
  };
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

// Booking Types
export interface Booking {
  id: string;
  reference: string;
  userId?: string; // Added for wallet integration
  type: 'flight' | 'hotel' | 'package' | 'transfer' | 'visa' | 'insurance';
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED' | 'EXPIRED' | 'HOLD';
  customerInfo: {
    type: 'individual' | 'corporate';
    name: string;
    email: string;
    phone: string;
    companyName?: string;
    companyRegistrationNumber?: string;
  };
  details: FlightDetails | HotelDetails | PackageDetails | TransferDetails | VisaDetails | InsuranceDetails;
  pricing: {
    netAmount: number;
    sellingAmount: number;
    currency: string;
    profitMargin: number;
    commission: number;
    taxes: number;
    fees: number;
  };
  bookingOptions: {
    hold: boolean;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    remarks: string;
    tags: string[];
  };
  timeline: {
    bookingDate: Date;
    travelDate: Date;
    returnDate?: Date;
    holdUntil?: Date;
    expiryDate?: Date;
  };
  assignedAgent?: {
    id: string;
    name: string;
  };
  createdByUser?: {
    id: string;
    name: string;
  };
  paymentInfo: {
    method: 'wallet' | 'credit_card' | 'debit_card' | 'net_banking' | 'upi' | 'cash';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    transactionId?: string;
    paymentDate?: Date;
  };
  supplierInfo: {
    id: string;
    name: string;
    confirmationNumber?: string;
    pnr?: string;
  };
  auditTrail: AuditLog[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FlightDetails {
  origin: string;
  destination: string;
  travelDate: Date;
  returnDate?: Date;
  flightNumber?: string;
  airline?: string;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  passengers: Passenger[];
  bookingClass?: string;
  ticketType: 'one_way' | 'round_trip' | 'multi_city';
}

export interface HotelDetails {
  hotelName: string;
  checkInDate: Date;
  checkOutDate: Date;
  roomType: string;
  roomCount: number;
  occupancy: {
    adults: number;
    children: number;
    infants: number;
  };
  amenities: string[];
  mealPlan: 'room_only' | 'breakfast_included' | 'half_board' | 'full_board' | 'all_inclusive';
  bookingReference?: string;
}

export interface PackageDetails {
  packageName: string;
  packageType: 'flight_hotel' | 'flight_hotel_transfer' | 'all_inclusive' | 'custom';
  components: Booking[];
  totalDuration: number;
  destination: string;
  travelDates: {
    startDate: Date;
    endDate: Date;
  };
  groupSize: number;
  packagePrice: number;
}

export interface TransferDetails {
  transferType: 'airport' | 'hotel' | 'city' | 'intercity';
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: Date;
  vehicleType: string;
  passengerCount: number;
  driverInfo?: {
    name: string;
    contact: string;
    licenseNumber: string;
  };
}

export interface VisaDetails {
  visaType: 'tourist' | 'business' | 'student' | 'transit' | 'work';
  destinationCountry: string;
  processingTime: string;
  requiredDocuments: string[];
  applicationStatus: 'pending' | 'submitted' | 'approved' | 'rejected';
  visaNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
}

export interface InsuranceDetails {
  policyType: 'travel' | 'health' | 'trip_cancellation' | 'baggage' | 'comprehensive';
  coverageAmount: number;
  policyNumber?: string;
  insuranceProvider: string;
  coveragePeriod: {
    startDate: Date;
    endDate: Date;
  };
  beneficiaries: string[];
  claimStatus?: 'active' | 'claimed' | 'expired';
}

export interface Passenger {
  firstName: string;
  lastName: string;
  type: 'adult' | 'child' | 'infant';
  dateOfBirth: Date;
  nationality: string;
  passportNumber?: string;
  passportExpiry?: Date;
}

export interface AuditLog {
  id: string;
  actionType: string;
  resourceType: string;
  resourceId: string;
  userId: string;
  userName: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Permission Types
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
  createdAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface BookingSearchResult {
  bookings: Booking[];
  pagination: Pagination;
}

export interface CustomerSearchResult {
  customers: Customer[];
  pagination: Pagination;
}

export interface SupplierSearchResult {
  suppliers: Supplier[];
  pagination: Pagination;
}

export interface AgentSearchResult {
  agents: Agent[];
  pagination: Pagination;
}

// Form Types
export interface BookingFormData {
  type: string;
  details: any;
  customerInfo: {
    type: 'individual' | 'corporate';
    name: string;
    email: string;
    phone: string;
    companyName?: string;
    companyRegistrationNumber?: string;
  };
  paymentInfo: {
    method: string;
    amount: number;
    currency: string;
  };
  bookingOptions: {
    hold: boolean;
    priority: string;
    remarks: string;
    tags: string[];
  };
}

export interface CustomerFormData {
  type: 'individual' | 'corporate';
  name: string;
  email: string;
  phone: string;
  companyName?: string;
  companyRegistrationNumber?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  preferences: {
    preferredAirlines: string[];
    preferredHotels: string[];
    mealPreferences: string[];
    specialRequests: string[];
  };
}

export interface SupplierFormData {
  name: string;
  type: string;
  contactInfo: {
    email: string;
    phone: string;
    address: string;
    website: string;
  };
  contractDetails: {
    contractType: string;
    commissionRate: number;
    paymentTerms: string;
    validityPeriod: {
      start: Date;
      end: Date;
    };
  };
  serviceDetails: {
    serviceAreas: string[];
    operatingHours: string;
    cancellationPolicy: string;
    specialTerms: string[];
  };
}

// Dashboard Types
export interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  todayRevenue: number;
  agentPerformance: AgentPerformance[];
  bookingTrends: BookingTrend[];
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalBookings: number;
  conversionRate: number;
  avgResponseTime: number;
  satisfactionRating: number;
}

export interface BookingTrend {
  date: string;
  bookings: number;
  revenue: number;
  bookingType: string;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'payment_received' | 'agent_assigned';
  title: string;
  message: string;
  userId: string;
  read: boolean;
  createdAt: Date;
  bookingId?: string;
}

// Report Types
export interface ReportFilters {
  dateRange: {
    start: Date;
    end: Date;
  };
  bookingType?: string;
  status?: string[];
  agentId?: string;
  customerId?: string;
}

export interface BookingReport {
  bookings: Booking[];
  summary: {
    totalBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
    cancellationRate: number;
    conversionRate: number;
  };
}

export interface CommissionReport {
  commissions: CommissionDetail[];
  summary: {
    totalCommission: number;
    averageCommission: number;
    topPerformingAgents: string[];
  };
}

export interface CommissionDetail {
  bookingId: string;
  bookingReference: string;
  agentId: string;
  agentName: string;
  commissionAmount: number;
  commissionRate: number;
  bookingDate: Date;
  paymentStatus: string;
}

// System Health Types
export interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  timestamp: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    cache: CacheHealth;
  };
  metrics: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
    activeConnections: number;
  };
}

export interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  lastCheck: string;
}

export interface CacheHealth {
  status: 'healthy' | 'unhealthy';
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
}

// Configuration Types
export interface AppConfig {
  apiBaseUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    bookingManagement: boolean;
    customerManagement: boolean;
    supplierManagement: boolean;
    reporting: boolean;
    notifications: boolean;
  };
  limits: {
    maxBookingsPerAgent: number;
    maxConcurrentBookings: number;
    bookingHoldTime: number;
  };
}