// Shared TypeScript types and adapter interfaces used across services
export enum Intent {
    READ_STATIC = "READ_STATIC",
    QUERY_STATIC = "QUERY_STATIC",
    WRITE = "WRITE",
    READ_REALTIME = "READ_REALTIME",
    QUERY_REALTIME = "QUERY_REALTIME",
    ADAPTER = "ADAPTER"
}

// Adapter interface for external integrations
export interface Adapter {
    name: string;
    request(payload: any): Promise<any>;
}

// Flight search result
export interface FlightResult {
    id: string;
    airline: string;
    flightNumber: string;
    departure: {
        airport: string;
        time: Date;
    };
    arrival: {
        airport: string;
        time: Date;
    };
    price: number;
    currency: string;
    availableSeats: number;
}

// Hotel search result
export interface HotelResult {
    id: string;
    name: string;
    location: string;
    rating: number;
    pricePerNight: number;
    currency: string;
    availableRooms: number;
    amenities: string[];
}

// Realtime data for ingest
export interface RealtimeData {
    id: string;
    vendor: string;
    productId: string;
    payload: any;
    ts: string;
    sequence: number;
}

// Metric for monitoring
export interface Metric {
    name: string;
    value: number;
    ts?: string;
    tags?: Record<string, string>;
}

// Currency for finance management
export interface Currency {
    code: string;
    name: string;
    symbol?: string;
    decimal_digits?: number;
    buffer_percentage?: number;
    is_active?: boolean;
}

// ============================================================================
// OFFLINE REQUEST MANAGEMENT TYPES
// ============================================================================

export enum OfflineRequestStatus {
    PENDING_STAFF = "PENDING_STAFF",
    PRICING_SUBMITTED = "PRICING_SUBMITTED",
    PENDING_CUSTOMER_APPROVAL = "PENDING_CUSTOMER_APPROVAL",
    APPROVED = "APPROVED",
    PAYMENT_PENDING = "PAYMENT_PENDING",
    COMPLETED = "COMPLETED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED"
}

export enum OfflineRequestType {
    SCHEDULE_CHANGE = "schedule_change",
    PASSENGER_NAME_CHANGE = "passenger_name_change",
    SEAT_SELECTION = "seat_selection",
    ANCILLARY_UPDATE = "ancillary_update",
    BOOKING_MODIFICATION = "booking_modification",
    CANCELLATION_WITH_REBOOKING = "cancellation_with_rebooking"
}

export enum OfflineRequestPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}

export enum OfflineRequestAuditAction {
    CREATED = "CREATED",
    PRICING_SUBMITTED = "PRICING_SUBMITTED",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    PAYMENT_RECORDED = "PAYMENT_RECORDED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}

export interface Timeline {
    requestedAt?: string;
    requestedBy?: string;
    staffPricedAt?: string;
    customerNotifiedAt?: string;
    customerApprovedAt?: string;
    paymentDueAt?: string;
    paymentCompletedAt?: string;
    documentsIssuedAt?: string;
    completedAt?: string;
    rejectedAt?: string;
    cancelledAt?: string;
}

export interface PriceDifference {
    baseFareDiff?: number;
    taxesDiff?: number;
    markupDiff?: number;
    totalDiff: number;
}

export interface StaffPricing {
    newBaseFare?: number;
    newTaxes?: number;
    newMarkup?: number;
    newTotalPrice: number;
    currency: string;
    staffNotes?: string;
    supplierReference?: string;
    supplierPNR?: string;
    pricedAt?: string;
    pricedBy?: string;
}

export interface CustomerApproval {
    approved: boolean;
    approvedAt?: string;
}

export interface Payment {
    paymentId: string;
    amount: number;
    method?: string;
    transactionRef?: string;
    paidAt?: string;
}

export interface OfflineChangeRequest {
    id: string;
    requestRef: string;
    bookingId: string;
    bookingRef: string;
    requestType: OfflineRequestType;
    status: OfflineRequestStatus;
    priority?: OfflineRequestPriority;
    originalDetails?: Record<string, any>;
    requestedChanges?: Record<string, any>;
    staffPricing?: StaffPricing;
    priceDifference?: PriceDifference;
    customerApproval?: CustomerApproval;
    payment?: Payment;
    reissuedDocuments?: Record<string, any>;
    timeline: Timeline;
    tags?: string[];
    internalNotes?: string[];
    createdAt: string;
    updatedAt?: string;
}

export interface OfflineRequestAuditLog {
    id: string;
    offlineRequestId: string;
    action: OfflineRequestAuditAction;
    actorId: string;
    actorType: 'staff' | 'customer' | 'system';
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    details?: Record<string, any>;
    createdAt: string;
}

export interface CreateOfflineRequestPayload {
    bookingId: string;
    bookingRef: string;
    requestType: OfflineRequestType;
    requestedChanges: Record<string, any>;
    priority?: OfflineRequestPriority;
}

export interface SubmitPricingPayload {
    newBaseFare?: number;
    newTaxes?: number;
    newMarkup?: number;
    newTotalPrice: number;
    currency: string;
    staffNotes?: string;
    supplierReference?: string;
    supplierPNR?: string;
}