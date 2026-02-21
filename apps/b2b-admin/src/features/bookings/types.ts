/**
 * Workflow States for V2 Bookings
 * These states define the complete booking lifecycle
 */
export enum WorkflowState {
    DRAFT = 'draft',
    QUEUED = 'queued',
    PRICING = 'pricing',
    INVOICED = 'invoiced',
    PAYMENT_PENDING = 'payment_pending',
    PAYMENT_CONFIRMED = 'payment_confirmed',
    SUPPLIER_BOOKING = 'supplier_booking',
    CONFIRMED = 'confirmed',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

/**
 * Pricing breakdown for V2 bookings
 */
export interface PricingBreakdown {
    baseAmount: number;
    markupAmount: number;
    commissionAmount: number;
    discountAmount: number;
    taxAmount: number;
    feesAmount: number;
    finalAmount: number;
    currency: string;
    appliedRules: string[];
    isManualOverride: boolean;
}

/**
 * V2 Extended Admin Booking interface
 * Includes workflow state machine fields
 */
export interface AdminBookingV2 {
    // Existing fields
    id: string;
    reference?: string;
    bookingRef?: string;
    status?: string;
    type?: string;
    product?: string;
    totalAmount?: number;
    amount?: number;
    currency?: string;
    createdAt?: string;
    issuedDate?: string;
    paymentStatus?: string;
    customerName?: string;
    email?: string;
    phone?: string;
    destination?: string;
    origin?: string;
    checkInDate?: string;
    checkOutDate?: string;
    roomType?: string;
    passengers?: number;
    customerEmail?: string;
    userEmail?: string;
    customerPhone?: string;
    pnr?: string;
    supplier?: string;
    provider?: string;
    source?: string;
    channel?: string;
    onHold?: boolean;
    isOnHold?: boolean;
    productType?: string;
    bookingType?: string;
    category?: string;
    kind?: string;
    queueId?: string;
    traveler?: string;
    queueStatus?: string;
    priority?: string;
    total?: number;
    raw?: Record<string, any>;
    
    // V2 Workflow Fields
    workflowState?: WorkflowState;
    supplierBookingRef?: string;
    pricingBreakdown?: PricingBreakdown;
    isManualPricing?: boolean;
    pricingAuditLogId?: string;
}

/**
 * Legacy type alias for backward compatibility
 */
export type AdminBooking = AdminBookingV2;

export interface OfflineBookingPayload {
    traveler: string;
    product: string;
    reference: string;
    notes: string;
    amount: string;
}

export interface FinanceState {
    baseAmount: string;
    markup: string;
    tax: string;
    fees: string;
    currency: string;
    note: string;
}

export interface BookingQueueItem {
    id: string;
    reference: string;
    traveler: string;
    product: string;
    status: "Pending" | "Confirmed" | "Hold" | "Cancelled";
    priority: "high" | "medium" | "low";
    amount: number;
    currency: string;
    createdAt: string;
    channel: string;
}
