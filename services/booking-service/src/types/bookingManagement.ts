import { BookingStatus, ServiceType, Priority, CustomerType, PaymentMethod } from './booking';

export interface CreateBookingRequest {
  type: ServiceType;
  details: {
    origin?: string;
    destination?: string;
    checkIn?: Date;
    checkOut?: Date;
    travelDate: Date;
    returnDate?: Date;
    passengers: Array<{
      firstName: string;
      lastName: string;
      type: 'adult' | 'child' | 'infant';
      dateOfBirth: Date;
      passportNumber?: string;
      nationality?: string;
    }>;
    serviceDetails?: any;
  };
  customerInfo: {
    type: CustomerType;
    name: string;
    email: string;
    phone: string;
    address?: string;
    companyName?: string;
    companyRegistrationNumber?: string;
    branchId?: string;
  };
  paymentInfo: {
    method: PaymentMethod;
    amount: number;
    currency: string;
    paymentReference?: string;
    paymentDetails?: any;
  };
  bookingOptions?: {
    hold?: boolean;
    priority?: Priority;
    remarks?: string;
    tags?: string[];
  };
}

export interface SearchBookingsRequest {
  page?: number;
  limit?: number;
  status?: BookingStatus[];
  customer?: string;
  agent?: string;
  dateFrom?: string;
  dateTo?: string;
  travelDateFrom?: string;
  travelDateTo?: string;
  serviceType?: ServiceType;
  origin?: string;
  destination?: string;
  supplier?: string;
  priority?: Priority[];
  queueStatus?: string[];
  assignedAgent?: string;
  branchId?: string;
  search?: string;
}

export interface SearchCustomersRequest {
  page?: number;
  limit?: number;
  type?: CustomerType;
  name?: string;
  email?: string;
  phone?: string;
  companyName?: string;
  branchId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateCustomerRequest {
  type: CustomerType;
  name: string;
  email: string;
  phone: string;
  address?: string;
  dateOfBirth?: Date;
  nationality?: string;
  passportNumber?: string;
  companyName?: string;
  companyRegistrationNumber?: string;
  branchId?: string;
  creditLimit?: number;
  paymentTerms?: 'prepaid' | 'postpaid' | 'credit';
  tags?: string[];
  notes?: string;
}

export interface SearchSuppliersRequest {
  page?: number;
  limit?: number;
  type?: string;
  name?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  status?: string;
  serviceTypes?: ServiceType[];
}

export interface CreateSupplierRequest {
  name: string;
  type: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  commissionRate?: number;
  paymentTerms?: 'prepaid' | 'postpaid' | 'net_7' | 'net_15' | 'net_30';
  status?: 'active' | 'inactive' | 'suspended';
  serviceTypes?: ServiceType[];
  apiEndpoint?: string;
  apiKey?: string;
  notes?: string;
}

export interface HoldInventoryRequest {
  serviceType: ServiceType;
  inventoryDetails: {
    flight?: {
      origin: string;
      destination: string;
      departureDate: Date;
      returnDate?: Date;
      airline?: string;
      flightNumber?: string;
      cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
    };
    hotel?: {
      hotelName: string;
      city: string;
      checkIn: Date;
      checkOut: Date;
      rooms: Array<{
        roomType: string;
        adults: number;
        children: number;
        infants: number;
      }>;
    };
    package?: {
      packageId: string;
      travelDate: Date;
      returnDate?: Date;
      paxCount: number;
    };
  };
  holdDuration: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  remarks?: string;
}

export interface ConfirmBookingRequest {
  bookingId: string;
  supplierReference: string;
  supplierPNR?: string;
  confirmationDetails?: {
    ticketNumbers?: string[];
    eTicketDetails?: Array<{
      passengerName: string;
      ticketNumber: string;
      pnr: string;
    }>;
    hotelVoucher?: string;
    packageItinerary?: string;
  };
  paymentInfo: {
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    transactionId?: string;
  };
  remarks?: string;
}

export interface IssueTicketRequest {
  bookingId: string;
  passengerDetails: Array<{
    passengerId: string;
    ticketNumber: string;
    pnr: string;
    seatNumber?: string;
    baggageAllowance?: string;
  }>;
  issueDetails: {
    issuedBy: string;
    issueDate?: Date;
    remarks?: string;
  };
}

export interface UpdateWorkflowStatusRequest {
  bookingId: string;
  status: BookingStatus;
  reason?: string;
  nextAction?: string;
  estimatedCompletion?: Date;
}

export interface AssignBookingRequest {
  bookingId: string;
  agentId: string;
  reason?: string;
  priority?: Priority;
  deadline?: Date;
}

export interface UpdatePriorityRequest {
  bookingId: string;
  priority: Priority;
  reason?: string;
  assignedAgent?: string;
}

export interface AddInventoryRequest {
  serviceType: ServiceType;
  inventoryDetails: {
    flight?: {
      airline: string;
      flightNumber: string;
      origin: string;
      destination: string;
      departureDate: Date;
      returnDate?: Date;
      cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
      availableSeats: number;
      basePrice: number;
      currency: string;
      markup: number;
    };
    hotel?: {
      hotelName: string;
      city: string;
      checkIn: Date;
      checkOut: Date;
      rooms: Array<{
        roomType: string;
        availableRooms: number;
        basePrice: number;
        currency: string;
        markup: number;
      }>;
    };
    package?: {
      packageName: string;
      destination: string;
      travelDate: Date;
      returnDate?: Date;
      paxCount: number;
      basePrice: number;
      currency: string;
      markup: number;
    };
  };
  supplierId: string;
  validity: {
    startDate: Date;
    endDate: Date;
    bookingDeadline: Date;
  };
  restrictions?: {
    minimumStay?: number;
    maximumStay?: number;
    blackoutDates?: Date[];
    cancellationPolicy?: string;
  };
}

export interface UpdateInventoryRequest {
  inventoryId: string;
  updates: {
    availableCount?: number;
    price?: number;
    status?: 'available' | 'sold_out' | 'suspended';
    validity?: {
      startDate?: Date;
      endDate?: Date;
      bookingDeadline?: Date;
    };
    restrictions?: {
      minimumStay?: number;
      maximumStay?: number;
      blackoutDates?: Date[];
      cancellationPolicy?: string;
    };
  };
}

export interface CreatePricingRuleRequest {
  name: string;
  description?: string;
  ruleType: 'markup' | 'discount' | 'fixed_price' | 'dynamic';
  conditions: {
    serviceType: ServiceType[];
    customerType?: CustomerType[];
    bookingChannel?: ('b2b' | 'b2c' | 'call_center')[];
    bookingDateRange?: {
      startDate?: Date;
      endDate?: Date;
    };
    travelDateRange?: {
      startDate?: Date;
      endDate?: Date;
    };
    minimumAmount?: number;
    maximumAmount?: number;
  };
  pricingLogic: {
    markupPercentage?: number;
    discountPercentage?: number;
    fixedPrice?: number;
    currency: string;
    applyTo: 'base_price' | 'selling_price' | 'all';
  };
  validity: {
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
  };
  priority: number;
}

export interface UpdatePricingRuleRequest {
  ruleId: string;
  updates: {
    name?: string;
    description?: string;
    ruleType?: 'markup' | 'discount' | 'fixed_price' | 'dynamic';
    conditions?: {
      serviceType?: ServiceType[];
      customerType?: CustomerType[];
      bookingChannel?: ('b2b' | 'b2c' | 'call_center')[];
      bookingDateRange?: {
        startDate?: Date;
        endDate?: Date;
      };
      travelDateRange?: {
        startDate?: Date;
        endDate?: Date;
      };
      minimumAmount?: number;
      maximumAmount?: number;
    };
    pricingLogic?: {
      markupPercentage?: number;
      discountPercentage?: number;
      fixedPrice?: number;
      currency?: string;
      applyTo?: 'base_price' | 'selling_price' | 'all';
    };
    validity?: {
      startDate?: Date;
      endDate?: Date;
      isActive?: boolean;
    };
    priority?: number;
  };
}

export interface CreateCommissionRuleRequest {
  name: string;
  description?: string;
  ruleType: 'percentage' | 'fixed_amount' | 'tiered';
  conditions: {
    serviceType: ServiceType[];
    customerType?: CustomerType[];
    bookingChannel?: ('b2b' | 'b2c' | 'call_center')[];
    bookingAmountRange?: {
      minAmount?: number;
      maxAmount?: number;
    };
    agentLevel?: string[];
  };
  commissionLogic: {
    percentage?: number;
    fixedAmount?: number;
    currency: string;
    calculationBasis: 'net_price' | 'selling_price' | 'profit';
    tieredStructure?: Array<{
      minAmount: number;
      maxAmount?: number;
      percentage: number;
    }>;
  };
  paymentTerms: {
    paymentMethod: 'immediate' | 'monthly' | 'quarterly';
    paymentDate: 'end_of_month' | '15th_of_month' | 'custom';
    customPaymentDate?: number;
  };
  validity: {
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
  };
}

export interface UpdateCommissionRuleRequest {
  ruleId: string;
  updates: {
    name?: string;
    description?: string;
    ruleType?: 'percentage' | 'fixed_amount' | 'tiered';
    conditions?: {
      serviceType?: ServiceType[];
      customerType?: CustomerType[];
      bookingChannel?: ('b2b' | 'b2c' | 'call_center')[];
      bookingAmountRange?: {
        minAmount?: number;
        maxAmount?: number;
      };
      agentLevel?: string[];
    };
    commissionLogic?: {
      percentage?: number;
      fixedAmount?: number;
      currency?: string;
      calculationBasis?: 'net_price' | 'selling_price' | 'profit';
      tieredStructure?: Array<{
        minAmount: number;
        maxAmount?: number;
        percentage: number;
      }>;
    };
    paymentTerms?: {
      paymentMethod?: 'immediate' | 'monthly' | 'quarterly';
      paymentDate?: 'end_of_month' | '15th_of_month' | 'custom';
      customPaymentDate?: number;
    };
    validity?: {
      startDate?: Date;
      endDate?: Date;
      isActive?: boolean;
    };
  };
}

export interface BookingReportRequest {
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filters?: {
    status?: BookingStatus[];
    serviceType?: ServiceType[];
    customerType?: CustomerType[];
    agentId?: string;
    branchId?: string;
    paymentMethod?: PaymentMethod[];
  };
  groupBy?: string[];
  includeDetails?: boolean;
}

export interface CommissionReportRequest {
  reportType: 'agent' | 'team' | 'period';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filters?: {
    agentId?: string;
    teamId?: string;
    serviceType?: ServiceType[];
    commissionStatus?: string[];
  };
  includeDetails?: boolean;
}

export interface InventoryReportRequest {
  reportType: 'availability' | 'utilization' | 'forecast';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filters?: {
    serviceType: ServiceType[];
    supplierId?: string;
    route?: {
      origin?: string;
      destination?: string;
    };
    hotelName?: string;
  };
  includeDetails?: boolean;
}

export interface AuditLogRequest {
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filters?: {
    userId?: string;
    actionType?: string[];
    resourceType?: string[];
    ipAddress?: string;
  };
  includeDetails?: boolean;
  page?: number;
  limit?: number;
}

export interface AssignPermissionsRequest {
  userId: string;
  permissions: string[];
  roleId?: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: string[];
  isActive?: boolean;
}

export interface UpdateRoleRequest {
  roleId: string;
  updates: {
    name?: string;
    description?: string;
    permissions?: string[];
    isActive?: boolean;
  };
}

export interface AssignUserRoleRequest {
  userId: string;
  roleId: string;
  effectiveDate?: Date;
  expiryDate?: Date;
}

export interface BookingManagementResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface BookingSearchResult {
  bookings: any[];
  pagination: PaginationResponse;
}

export interface CustomerSearchResult {
  customers: any[];
  pagination: PaginationResponse;
}

export interface SupplierSearchResult {
  suppliers: any[];
  pagination: PaginationResponse;
}

export interface InventorySearchResult {
  inventory: any[];
  pagination: PaginationResponse;
}

export interface ReportResult {
  report: any;
  metadata: {
    reportType: string;
    dateRange: {
      startDate: Date;
      endDate: Date;
    };
    generatedAt: Date;
    generatedBy: string;
  };
}

export interface AuditLogResult {
  auditLogs: any[];
  pagination: PaginationResponse;
}