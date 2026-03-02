// ============================================================================
// TripAlfa Shared Types - Offline Request Management
// Handles booking modifications requiring manual staff intervention
// ============================================================================

// ============================================================================
// Enums & Constants
// ============================================================================

export enum OfflineRequestType {
  FLIGHT_CHANGE = "flight_change",
  HOTEL_CHANGE = "hotel_change",
  DATE_CHANGE = "date_change",
  PASSENGER_CHANGE = "passenger_change",
  OTHER = "other",
}

export enum OfflineRequestStatus {
  PENDING_STAFF = "pending_staff", // Waiting for staff to provide pricing
  PRICING_SUBMITTED = "pricing_submitted", // Staff has submitted pricing
  PENDING_CUSTOMER_APPROVAL = "pending_customer_approval", // Waiting for customer approval
  APPROVED = "approved", // Customer approved the changes
  PAYMENT_PENDING = "payment_pending", // Waiting for payment
  COMPLETED = "completed", // Request completed successfully
  REJECTED = "rejected", // Customer rejected the changes
  CANCELLED = "cancelled", // Request cancelled
}

export enum OfflineRequestPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum OfflineRequestAuditAction {
  CREATED = "created",
  PRICING_SUBMITTED = "pricing_submitted",
  PRICING_UPDATED = "pricing_updated",
  APPROVED = "approved",
  REJECTED = "rejected",
  PAYMENT_PROCESSED = "payment_processed",
  DOCUMENTS_ISSUED = "documents_issued",
  CANCELLED = "cancelled",
  NOTE_ADDED = "note_added",
  ASSIGNED_TO_STAFF = "assigned_to_staff",
}

export enum OfflinePaymentMethod {
  WALLET = "wallet",
  CREDIT_CARD = "credit_card",
  SUPPLIER_CREDIT = "supplier_credit",
}

export enum OfflinePaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
}

// ============================================================================
// Flight Itinerary Types
// ============================================================================

export interface FlightSegment {
  origin: string;
  destination: string;
  departureDate: string; // ISO 8601
  arrivalDate: string; // ISO 8601
  airline?: string;
  flightNumber?: string;
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
}

export interface FlightPassenger {
  firstName: string;
  lastName: string;
  type: "adult" | "child" | "infant";
  dateOfBirth?: string;
}

export interface FlightItinerary {
  type: "flight";
  segments: FlightSegment[];
  passengers: FlightPassenger[];
}

// ============================================================================
// Hotel Itinerary Types
// ============================================================================

export interface HotelRoom {
  roomType: string;
  adults: number;
  children: number;
  childAges?: number[];
  boardType?: string; // e.g., "Room Only", "Breakfast Included", "Half Board"
}

export interface HotelItinerary {
  type: "hotel";
  hotelName: string;
  location: string;
  checkIn: string; // ISO 8601
  checkOut: string; // ISO 8601
  rooms: HotelRoom[];
  guestName: string;
}

// ============================================================================
// Pricing Types
// ============================================================================

export interface PricingBreakdown {
  baseFare: number;
  taxes: number;
  markup: number;
  totalPrice: number;
  currency: string;
}

export interface StaffPricing {
  newBaseFare: number;
  newTaxes: number;
  newMarkup: number;
  newTotalPrice: number;
  currency: string;
  supplierReference?: string;
  supplierPNR?: string;
  staffNotes?: string;
  pricedAt?: string;
  pricedBy?: string;
}

export interface PriceDifference {
  baseFareDiff: number;
  taxesDiff: number;
  markupDiff: number;
  totalDiff: number; // Can be positive (additional payment) or negative (refund)
  currency: string;
}

// ============================================================================
// Customer Approval Types
// ============================================================================

export interface CustomerApproval {
  approved: boolean;
  approvedAt?: string;
  rejectionReason?: string;
}

// ============================================================================
// Payment Types
// ============================================================================

export interface PaymentDetails {
  paymentId: string;
  amount: number;
  currency: string;
  method: OfflinePaymentMethod;
  status: OfflinePaymentStatus;
  paidAt?: string;
  transactionRef?: string;
}

// ============================================================================
// Re-issued Documents Types
// ============================================================================

export interface ReissuedDocuments {
  newTicketNumber?: string;
  newVoucherNumber?: string;
  newPNR?: string;
  invoiceId?: string;
  receiptId?: string;
  documentUrls: string[];
  issuedAt?: string;
}

// ============================================================================
// Timeline Types
// ============================================================================

export interface OfflineRequestTimeline {
  requestedAt: string;
  requestedBy: string;
  assignedToStaff?: string;
  staffPricedAt?: string;
  customerNotifiedAt?: string;
  customerApprovedAt?: string;
  paymentCompletedAt?: string;
  documentsIssuedAt?: string;
  completedAt?: string;
}

// ============================================================================
// Original Booking Details (Snapshot)
// ============================================================================

export interface OriginalBookingDetails {
  serviceType: "flight" | "hotel";
  itinerary: FlightItinerary | HotelItinerary;
  pricing: PricingBreakdown;
  documents: {
    ticketNumber?: string;
    voucherNumber?: string;
    pnr?: string;
  };
}

// ============================================================================
// Requested Changes
// ============================================================================

export interface RequestedChange {
  serviceType: "flight" | "hotel";
  newItinerary: FlightItinerary | HotelItinerary;
  changeReason: string;
  customerNotes?: string;
}

// ============================================================================
// Main OfflineChangeRequest Type
// ============================================================================

export interface OfflineChangeRequest {
  id: string;
  requestRef: string;
  bookingId: string;
  bookingRef: string;

  // Request Type & Status
  requestType: OfflineRequestType;
  status: OfflineRequestStatus;
  priority: OfflineRequestPriority;

  // Original Booking Details (Snapshot)
  originalDetails: OriginalBookingDetails;

  // Requested Changes
  requestedChanges: RequestedChange;

  // Staff Financial Details
  staffPricing?: StaffPricing;

  // Calculated Difference
  priceDifference?: PriceDifference;

  // Customer Approval
  customerApproval?: CustomerApproval;

  // Payment Details
  payment?: PaymentDetails;

  // Re-issued Documents
  reissuedDocuments?: ReissuedDocuments;

  // Timeline
  timeline: OfflineRequestTimeline;

  // Metadata
  tags: string[];
  internalNotes: string[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Offline Request Audit Log
// ============================================================================

export interface OfflineRequestAuditLog {
  id: string;
  offlineRequestId: string;

  // Audit details
  action: OfflineRequestAuditAction;
  actorId: string;
  actorType: "customer" | "staff" | "system";

  // Change details
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  details?: Record<string, unknown>;

  // Timestamp
  createdAt: string;
}

// ============================================================================
// Offline Request Notification
// ============================================================================

export interface OfflineRequestNotification {
  id: string;
  offlineRequestId: string;
  offlineRequestRef: string;

  // Notification type
  type:
    | "offline_request_created"
    | "offline_request_priced"
    | "offline_request_approved"
    | "offline_request_completed";

  // Recipients
  recipientIds: string[];

  // Metadata
  metadata: {
    requestType: OfflineRequestType;
    priceDifference?: number;
    currency?: string;
  };
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateOfflineRequestPayload {
  bookingId: string;
  bookingRef: string;
  requestType: OfflineRequestType;
  requestedChanges: RequestedChange;
  priority?: OfflineRequestPriority;
  customerNotes?: string;
}

export interface SubmitPricingPayload {
  newBaseFare: number;
  newTaxes: number;
  newMarkup: number;
  newTotalPrice: number;
  currency: string;
  supplierReference?: string;
  supplierPNR?: string;
  staffNotes?: string;
}

export interface ApproveChangePayload {
  approvalConfirmed: boolean;
}

export interface RejectChangePayload {
  rejectionReason: string;
}

export interface ProcessPaymentPayload {
  paymentMethod: OfflinePaymentMethod;
  amount: number;
  transactionRef?: string;
}

// ============================================================================
// Queue Management Types
// ============================================================================

export interface OfflineRequestQueueItem {
  id: string;
  requestRef: string;
  bookingRef: string;
  requestType: OfflineRequestType;
  status: OfflineRequestStatus;
  priority: OfflineRequestPriority;
  customerName: string;
  createdAt: string;
  priceDifference?: number;
  currency?: string;
}

export interface OfflineRequestQueueResponse {
  total: number;
  pending: number;
  priced: number;
  pendingApproval: number;
  items: OfflineRequestQueueItem[];
}

// ============================================================================
// Statistics & Metrics
// ============================================================================

export interface OfflineRequestStats {
  total: number;
  byStatus: Record<OfflineRequestStatus, number>;
  byType: Record<OfflineRequestType, number>;
  byPriority: Record<OfflineRequestPriority, number>;
  averageResolutionTime: number; // in milliseconds
  averageStaffResponseTime: number;
  approvalRate: number; // percentage
  paymentSuccessRate: number; // percentage
}

// ============================================================================
// Error Types
// ============================================================================

export interface OfflineRequestError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
