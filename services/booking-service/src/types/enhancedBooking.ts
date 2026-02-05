export interface Booking {
  id: string;
  bookingRef: string;
  confirmationNumber?: string;
  type: 'flight' | 'hotel' | 'package';
  status: 'pending' | 'confirmed' | 'hold' | 'cancelled' | 'refunded' | 'amended' | 'imported' | 'ticketed';
  bookingType: 'instant' | 'hold' | 'request' | 'imported';
  customerType: 'B2B' | 'B2C';
  customerId: string;
  companyId?: string;
  branchId?: string;
  productId?: string;
  supplierId?: string;
  serviceDetails: any;
  passengers: Passenger[];
  pricing: Pricing;
  payment: Payment;
  specialRequests: string[];
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
  holdUntil?: Date;
  queueStatus?: 'pending' | 'completed' | 'failed';
  importedAt?: Date;
  importedBy?: string;
  ticketDetails?: any;
  refunds: Refund[];
  amendments: Amendment[];
}

export interface Passenger {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  passportNumber?: string;
  nationality?: string;
  type: 'adult' | 'child' | 'infant';
  seatPreference?: string;
  mealPreference?: string;
}

export interface Pricing {
  customerPrice: number;
  supplierPrice: number;
  markup: number;
  currency: string;
  taxes: number;
  fees: number;
  discount?: number;
}

export interface Payment {
  method: 'wallet' | 'credit_card' | 'debit_card' | 'net_banking' | 'upi' | 'supplier_credit';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  supplierPayment?: {
    method: string;
    terms: string;
    creditLimit?: number;
  };
  transactions: PaymentTransaction[];
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  timestamp: Date;
  transactionId?: string;
  gateway?: string;
  gatewayResponse?: any;
}

export interface Refund {
  id: string;
  amount: number;
  reason: string;
  type: 'full' | 'partial';
  status: 'pending' | 'completed' | 'failed';
  timestamp: Date;
  processedBy?: string;
}

export interface Amendment {
  id: string;
  bookingId: string;
  changes: any;
  reason: string;
  priceDifference: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
}

export interface BookingQueue {
  id: string;
  bookingId: string;
  queueType: 'hold' | 'refund' | 'amendment' | 'special_request' | 'website' | 'cancellation';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  processedAt?: Date;
  error?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  notes?: string;
}

export interface BookingHistory {
  id: string;
  bookingId: string;
  action: string;
  description: string;
  performedBy: string;
  timestamp: Date;
  details: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface BookingDocument {
  id: string;
  bookingId: string;
  type: 'invoice' | 'receipt' | 'credit_note' | 'e_ticket' | 'hotel_voucher' | 'amendment_invoice';
  fileName: string;
  fileUrl: string;
  mimeType: string;
  size: number;
  generatedAt: Date;
  generatedBy: string;
  status: 'generated' | 'sent' | 'downloaded';
  sentTo?: string[];
  downloadCount: number;
}

export interface GDSIntegration {
  type: 'amadeus' | 'sabre' | 'travelport';
  credentials: {
    clientId: string;
    clientSecret: string;
    apiUrl: string;
  };
  isActive: boolean;
  lastSync?: Date;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: 'invoice' | 'receipt' | 'credit_note' | 'e_ticket' | 'hotel_voucher';
  template: string;
  variables: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierIntegration {
  id: string;
  name: string;
  type: 'GDS' | 'DIRECT_API' | 'LOCAL';
  vendorId: string;
  credentials: any;
  isActive: boolean;
  settings: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface LedgerEntry {
  id: string;
  accountId: string;
  amount: number;
  type: 'debit' | 'credit';
  description: string;
  reference: string;
  timestamp: Date;
  status: 'pending' | 'posted' | 'reversed';
  postedBy?: string;
}

export interface SearchFilters {
  bookingId?: string;
  customerName?: string;
  customerEmail?: string;
  pnr?: string;
  supplierRef?: string;
  companyId?: string;
  branchId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  status?: string[];
  type?: string[];
  queueType?: string[];
  customerType?: 'B2B' | 'B2C' | 'ALL';
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface BookingStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  refundedBookings: number;
  totalRevenue: number;
  totalRefunds: number;
  averageBookingValue: number;
  bookingByType: {
    flight: number;
    hotel: number;
    package: number;
  };
  bookingByStatus: {
    [key: string]: number;
  };
}

export interface PaymentRequest {
  bookingId: string;
  amount: number;
  method: string;
  currency: string;
  description?: string;
}

export interface RefundRequest {
  bookingId: string;
  amount: number;
  reason: string;
  type: 'full' | 'partial';
  refundTo: 'original' | 'wallet';
}

export interface AmendmentRequest {
  bookingId: string;
  changes: any;
  reason: string;
  customerApprovalRequired: boolean;
}

export interface ImportRequest {
  gdsType: 'amadeus' | 'sabre' | 'travelport';
  pnr: string;
  supplierRef: string;
  customerId?: string;
  companyId?: string;
}

// Lightweight request types used by controllers (placeholder any to satisfy existing callers)
export type CreateBookingRequest = any;
export type SearchBookingRequest = any;