// Shared TypeScript types and adapter interfaces used across services
export enum Intent {
    READ_STATIC = "READ_STATIC",
    QUERY_STATIC = "QUERY_STATIC",
    WRITE = "WRITE",
    READ_REALTIME = "QUERY_REALTIME",
    QUERY_REALTIME = "READ_REALTIME",
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

// ============================================================================
// HOTEL DEALS TYPES
// ============================================================================
export { HotelDealType, PropertyType, LocationType, MealPlan, RoomType, BedType } from './hotel-deals';

// ============================================================================
// DOMAIN TYPES FROM TYPES DIRECTORY
// ============================================================================

import { PaymentStatus } from '../types/enums';
export { PaymentStatus } from '../types/enums';
export * from '../types/enums';
export * from '../types/index';
// Add individual exports for types that hooks.ts needs
export * from '../types/company';
export * from '../types/user';
export * from '../types/rbac';
export * from '../types/booking';
export * from '../types/loyalty';
export * from '../types/supplier';
export * from '../types/payment';
export * from '../types/finance';
export * from '../types/pricing';
export * from '../types/reference';
export * from '../types/system';

// ============================================================================
// PRICING DOMAIN TYPES
// ============================================================================

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

// Admin Booking Card Types
export interface AdminBookingCard {
  // Core Booking Information
  id: string;
  bookingRef: string;
  confirmationNumber: string;
  status: BookingStatus;
  bookingType: BookingType;
  customerType: 'B2B' | 'B2C';
  
  // Customer Information
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    type: 'individual' | 'corporate';
    companyId?: string;
    branchId?: string;
  };
  
  // Service Details
  serviceDetails: {
    type: 'flight' | 'hotel' | 'package' | 'transfer' | 'visa' | 'insurance';
    segments: ServiceSegment[];
    supplier: {
      id: string;
      name: string;
      pnr: string;
      supplierRef: string;
    };
  };
  
  // Financial Information
  financials: {
    customerPrice: number;
    supplierPrice: number;
    markup: number;
    taxes: number;
    fees: number;
    currency: string;
    paymentStatus: PaymentStatus;
    paymentMethod: PaymentMethod;
    profit: number;
  };
  
  // Timeline Information
  timeline: {
    bookedAt: Date;
    travelDate: Date;
    returnDate?: Date;
    holdUntil?: Date;
    lastModified: Date;
  };
  
  // Admin-Specific Features
  adminFeatures: {
    assignedAgent: string;
    branch: string;
    queueStatus: QueueStatus;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    tags: string[];
    notes: AdminNote[];
    auditTrail: AuditEvent[];
  };
  
  // Documents & Communications
  documents: BookingDocument[];
  communications: CommunicationLog[];
  
  // Special Features
  specialFeatures: {
    specialRequests: string[];
    amendments: AmendmentRequest[];
    refunds: RefundRequest[];
    notifications: Notification[];
  };
}

export interface RealTimeStatus {
  currentStatus: BookingStatus;
  statusHistory: StatusChange[];
  queuePosition: number;
  estimatedProcessingTime: string;
  lastUpdated: Date;
  autoRefresh: boolean;
}

export interface AdminSearchFilters {
  bookingRef?: string;
  customerName?: string;
  customerEmail?: string;
  pnr?: string;
  supplierRef?: string;
  companyId?: string;
  branchId?: string;
  agentId?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  status: BookingStatus[];
  bookingType: BookingType[];
  queueType: QueueType[];
  priority: Priority[];
  paymentStatus: PaymentStatus[];
  serviceType: ServiceType[];
  tags: string[];
}

export interface BulkOperations {
  selectAllMatching: (filters: AdminSearchFilters) => void;
  bulkUpdateStatus: (status: BookingStatus, bookingIds: string[]) => Promise<void>;
  bulkAssignAgent: (agentId: string, bookingIds: string[]) => Promise<void>;
  bulkAddTags: (tags: string[], bookingIds: string[]) => Promise<void>;
  bulkSendNotifications: (message: string, bookingIds: string[]) => Promise<void>;
  bulkExport: (format: 'pdf' | 'excel' | 'csv', bookingIds: string[]) => Promise<Blob>;
}

export interface WorkflowAutomation {
  autoAssignRules: AutoAssignRule[];
  escalationRules: EscalationRule[];
  notificationTriggers: NotificationTrigger[];
  approvalWorkflows: ApprovalWorkflow[];
  SLAManagement: SLAConfiguration[];
}

export interface QueueManagement {
  dragAndDrop: {
    enableReordering: boolean;
    enableStatusChange: boolean;
    enableAssignment: boolean;
  };
  
  queueVisualization: {
    kanbanView: KanbanView;
    listView: ListView;
    calendarView: CalendarView;
  };
}

export interface RealTimeCollaboration {
  liveEditing: {
    concurrentEditing: boolean;
    conflictResolution: ConflictResolutionStrategy;
    editHistory: EditHistory[];
  };
  
  teamCommunication: {
    mentionUsers: (users: string[], message: string) => void;
    privateNotes: PrivateNote[];
    teamChat: TeamChat[];
  };
}

export interface DocumentManagement {
  documentTypes: DocumentType[];
  uploadProgress: UploadProgress;
  versionControl: VersionControl;
  eSignature: ESignatureIntegration;
  documentSharing: DocumentSharing;
}

// Type definitions for enums and interfaces
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'refunded' | 'ticketed' | 'imported';
export type BookingType = 'instant' | 'hold' | 'request' | 'imported';
// export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'; // Removed to avoid conflict with enum
export type PaymentMethod = 'wallet' | 'credit_card' | 'supplier_credit';
export type QueueType = 'hold' | 'refund' | 'amendment' | 'special_request';
export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type ServiceType = 'flight' | 'hotel' | 'package' | 'transfer' | 'visa' | 'insurance';

interface ServiceSegment {
  id: string;
  type: string;
  departure: string;
  arrival: string;
  date: Date;
  details: any;
}

interface AdminNote {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
}

interface AuditEvent {
  id: string;
  action: string;
  actor: string;
  timestamp: Date;
  details: any;
}

interface BookingDocument {
  id: string;
  type: string;
  url: string;
  createdAt: Date;
  createdBy: string;
}

interface CommunicationLog {
  id: string;
  type: string;
  content: string;
  timestamp: Date;
  sender: string;
  recipient: string;
}

interface AmendmentRequest {
  id: string;
  type: string;
  reason: string;
  status: string;
  createdAt: Date;
}

interface RefundRequest {
  id: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: Date;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

interface StatusChange {
  status: BookingStatus;
  timestamp: Date;
  actor: string;
}

interface AutoAssignRule {
  id: string;
  conditions: any;
  assignee: string;
}

interface EscalationRule {
  id: string;
  conditions: any;
  escalateTo: string;
  timeLimit: number;
}

interface NotificationTrigger {
  id: string;
  event: string;
  recipients: string[];
  channels: string[];
}

interface ApprovalWorkflow {
  id: string;
  steps: ApprovalStep[];
}

interface ApprovalStep {
  id: string;
  approvers: string[];
  conditions: any;
}

interface SLAConfiguration {
  id: string;
  serviceType: ServiceType;
  responseTime: number;
  resolutionTime: number;
}

interface KanbanView {
  columns: KanbanColumn[];
}

interface KanbanColumn {
  id: string;
  title: string;
  bookings: AdminBookingCard[];
}

interface ListView {
  bookings: AdminBookingCard[];
}

interface CalendarView {
  events: CalendarEvent[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  bookingId: string;
}

interface ConflictResolutionStrategy {
  type: 'last_wins' | 'merge' | 'manual';
  rules: any[];
}

interface EditHistory {
  id: string;
  editor: string;
  changes: any;
  timestamp: Date;
}

interface PrivateNote {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  visibleTo: string[];
}

interface TeamChat {
  id: string;
  message: string;
  author: string;
  timestamp: Date;
  bookingId: string;
}

interface DocumentType {
  id: string;
  name: string;
  required: boolean;
  templateId?: string;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'failed';
}

interface VersionControl {
  currentVersion: number;
  versions: DocumentVersion[];
}

interface DocumentVersion {
  id: string;
  version: number;
  url: string;
  createdAt: Date;
  createdBy: string;
}

interface ESignatureIntegration {
  provider: string;
  templateId?: string;
  signers: Signer[];
  status: 'pending' | 'completed' | 'failed';
}

interface Signer {
  id: string;
  name: string;
  email: string;
  order: number;
}

interface DocumentSharing {
  id: string;
  sharedWith: string[];
  permissions: string[];
  expiresAt?: Date;
}