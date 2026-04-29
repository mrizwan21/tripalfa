/// <reference types="node" />

// ============================================================
// OTA PLATFORM - SHARED TYPES
// ============================================================
// Centralized type definitions used across all services
// ============================================================

// ============================================================
// SALES CHANNELS
// ============================================================

export enum SalesChannel {
  POS_DC = 'POS_DC',       // On Behalf of Direct Customer (Midoffice Front Desk)
  POS_SA = 'POS_SA',       // On Behalf of Subagent (Midoffice Front Desk)
  POS_CA = 'POS_CA',       // On Behalf of Corporate (Midoffice Front Desk / SBT)
  SUBAGENT = 'SUBAGENT',   // B2B Dashboard
  WEBSITE = 'WEBSITE',     // B2C Website
  MOBILE = 'MOBILE',       // Mobile App
}

export const SALES_CHANNEL_LABELS: Record<SalesChannel, string> = {
  [SalesChannel.POS_DC]: 'Direct Customer',
  [SalesChannel.POS_SA]: 'Sub-Agent Counter',
  [SalesChannel.POS_CA]: 'Corporate Counter',
  [SalesChannel.SUBAGENT]: 'B2B Sub-Agent',
  [SalesChannel.WEBSITE]: 'B2C Website',
  [SalesChannel.MOBILE]: 'Mobile App',
};

// ============================================================
// BOOKING STATUS
// ============================================================

export enum BookingStatus {
  NEW_BOOKING = 'NEW_BOOKING',
  PROVISIONAL = 'PROVISIONAL',
  AUTHORIZED = 'AUTHORIZED',
  TICKETED = 'TICKETED',
  DOCUMENTED = 'DOCUMENTED',
  DISPATCHED = 'DISPATCHED',
  CANCELLED = 'CANCELLED',
  VOID = 'VOID',
  REFUNDED = 'REFUNDED',
  REFUND_ON_HOLD = 'REFUND_ON_HOLD',
  REJECTED = 'REJECTED',
}

export enum SegmentStatus {
  HK = 'HK',  // Confirmed
  UC = 'UC',  // Unconfirmed
  RQ = 'RQ',  // On Request
  HX = 'HX',  // Cancelled by airline
  NO = 'NO',  // No record
}

// ============================================================
// SERVICE TYPES
// ============================================================

export enum ServiceType {
  FLIGHT = 'Flight',
  HOTEL = 'Hotel',
  CAR = 'Car',
  FLIGHT_ANCILLARY = 'FA',
  FOREX = 'FC',
  OTHER = 'O',
  PACKAGE = 'Package',
  INSURANCE = 'Insurance',
  SIGHTSEEING = 'Sightseeing',
  TRANSFER = 'Transfer',
}

export enum ProductType {
  FLIGHT = 'Flight',
  HOTEL = 'Hotel',
  CAR = 'Car',
  FA = 'FA',
  FC = 'FC',
  O = 'O',
}

// ============================================================
// DOCUMENT TYPES
// ============================================================

export enum DocumentType {
  TICKET = 'TICKET',
  VOUCHER = 'VOUCHER',
  INVOICE = 'INVOICE',
  CREDIT_NOTE = 'CREDIT_NOTE',
  DEBIT_NOTE = 'DEBIT_NOTE',
  RECEIPT = 'RECEIPT',
}

// ============================================================
// SERVICE REQUEST
// ============================================================

export enum ServiceRequestType {
  REFUND = 'REFUND',
  RESCHEDULE = 'RESCHEDULE',
  CANCEL = 'CANCEL',
  CLIENT_SWITCH = 'CLIENT_SWITCH',
}

export enum ServiceRequestStatus {
  OPEN = 'OPEN',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
}

// ============================================================
// APPROVAL WORKFLOW
// ============================================================

export enum ApprovalLevel {
  LEVEL_1 = 'LEVEL_1',
  LEVEL_2 = 'LEVEL_2',
  LEVEL_3 = 'LEVEL_3',
  LINE_MANAGER = 'LINE_MANAGER',
  FINANCE_MANAGER = 'FINANCE_MANAGER',
}

// ============================================================
// TENANT TYPES
// ============================================================

export enum TenantType {
  MASTER = 'MASTER',
  SUB_AGENT = 'SUB_AGENT',
  CORPORATE = 'CORPORATE',
}

// ============================================================
// WALLET & PAYMENT
// ============================================================

export enum WalletOwnerType {
  CUSTOMER = 'CUSTOMER',
  AGENT = 'AGENT',
  CORPORATE = 'CORPORATE',
  SUPPLIER = 'SUPPLIER',
  SUB_AGENT = 'SUB_AGENT',
}

export enum WalletStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
}

export enum TransactionCategory {
  FLIGHT_BOOKING = 'Flight Booking',
  HOTEL_BOOKING = 'Hotel Booking',
  MARKUP_EARNING = 'Markup Earning',
  COMMISSION_EARNING = 'Commission Earning',
  REFUND = 'Refund',
  CREDIT_LIMIT = 'Credit Limit',
  AUTO_RELOAD = 'Auto Reload',
  MANUAL_ADJUSTMENT = 'Manual Adjustment',
}

export interface CreateWalletInput {
  ownerType: string;
  ownerId: string;
  ownerName: string;
  defaultCurrency?: string;
  autoReloadEnabled?: boolean;
  autoReloadAmount?: number;
  autoReloadThreshold?: number;
  autoReloadCurrency?: string;
}

export interface WalletRechargeInput {
  walletId: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  paymentReference?: string;
  description?: string;
  userId: string;
  userName: string;
}

export interface WalletDebitInput {
  walletId: string;
  amount: number;
  currency: string;
  bookingId?: string;
  bookingRef?: string;
  description?: string;
  userId: string;
  userName: string;
}

export interface WalletHoldInput {
  walletId: string;
  amount: number;
  currency: string;
  bookingId: string;
  bookingRef: string;
  reason: string;
  expiresAt: Date;
  userId: string;
  userName: string;
}

export interface WalletTransferInput {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  currency: string;
  description?: string;
  userId: string;
  userName: string;
}

export const CURRENCY_PRECISION: Record<string, number> = {
  BHD: 3, JOD: 3, KWD: 3, OMR: 3, TND: 3,
  JPY: 0, KRW: 0, VND: 0,
  USD: 2, EUR: 2, GBP: 2, SAR: 2, AED: 2,
  INR: 2, PKR: 2, BDT: 2, CNY: 2, HKD: 2,
  SGD: 2, MYR: 2, THB: 2, AUD: 2, CAD: 2,
  CHF: 2, SEK: 2, NOK: 2, DKK: 2, ZAR: 2,
  RUB: 2, BRL: 2, MXN: 2, NZD: 2,
};

// ============================================================
// INVENTORY
// ============================================================

export enum InventoryType {
  FLIGHT = 'Flight',
  HOTEL = 'Hotel',
}

export enum InventoryStatus {
  ACTIVE = 'Active',
  DEPLETED = 'Depleted',
  EXPIRED = 'Expired',
  CARRY_FORWARDED = 'CarryForwarded',
}

export enum InventoryTransactionType {
  PURCHASE = 'Purchase',
  SALE = 'Sale',
  CARRY_FORWARD = 'CarryForward',
  ADJUSTMENT = 'Adjustment',
  GROUP_SALE = 'GroupSale',
}

// ============================================================
// MARKUP & COMMISSION
// ============================================================

export enum MarkupValueType {
  PERCENTAGE = 'Percentage',
  FIXED = 'Fixed',
}

export enum MarkupRuleLevel {
  BASE = 'BASE',
  OVERRIDE = 'OVERRIDE',
  EXCEPTION = 'EXCEPTION',
}

export enum CommissionSourceType {
  AIRLINE = 'Airline',
  HOTEL_SUPPLIER = 'HotelSupplier',
  GDS = 'GDS',
  DIRECT_CONTRACT = 'DirectContract',
}

export enum CommissionType {
  PERCENTAGE = 'Percentage',
  FIXED = 'Fixed',
  TIERED = 'Tiered',
}

// ============================================================
// USER & ROLE
// ============================================================

export enum UserRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager',
  AGENT = 'Agent',
  VIEWER = 'Viewer',
  FINANCE = 'Finance',
  SUPER_ADMIN = 'SuperAdmin',
}

// ============================================================
// NOTIFICATION
// ============================================================

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in_app',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

// ============================================================
// SUPPLIER
// ============================================================

export enum SupplierType {
  DUFFEL = 'duffel',
  LITEAPI = 'liteapi',
  AMADEUS = 'amadeus',
  TRAVELPORT = 'travelport',
}

export enum SupplierStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DEGRADED = 'degraded',
}

// ============================================================
// COMMON INTERFACES
// ============================================================

// ============================================================
// COMMON INTERFACES
// ============================================================

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthenticatedRequest {
  userId: string;
  tenantId: string;
  agentCode: string;
  salesChannel: SalesChannel;
  role: UserRole;
}

export interface BookingFilter {
  salesChannel?: SalesChannel;
  service?: ServiceType;
  status?: BookingStatus;
  dateFrom?: string;
  dateTo?: string;
  agentCode?: string;
  corporateId?: string;
  subagentId?: string;
  search?: string;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface Money {
  amount: number;
  currency: string;
}

// ============================================================
// WEBHOOK
// ============================================================

export type DuffelEventType =
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  | 'flight_schedule_changed'
  | 'airline_initiated_change'
  | 'seat_map_updated'
  | 'order_change_completed';

export type LiteApiEventType =
  | 'booking.confirmed'
  | 'booking.cancelled'
  | 'booking.modified'
  | 'booking.pending';

export interface WebhookLog {
  id: string;
  source: 'duffel' | 'liteapi';
  eventType: string;
  payload: any;
  processed: boolean;
  processedAt?: Date;
  error?: string;
  retryCount: number;
  createdAt: Date;
}

export const WEBHOOK_SUPPLIER_MAP: Record<string, string> = {
  duffel: 'duffel',
  liteapi: 'innstant',
};

export const DUFFEL_EVENTS: readonly DuffelEventType[] = [
  'order.created',
  'order.updated',
  'order.cancelled',
  'flight_schedule_changed',
  'airline_initiated_change',
  'seat_map_updated',
  'order_change_completed',
];

export const LITEAPI_EVENTS: readonly LiteApiEventType[] = [
  'booking.confirmed',
  'booking.cancelled',
  'booking.modified',
  'booking.pending',
];

// ============================================================
// SHARED AUTH
// ============================================================

export interface AuthRequestBase {
  userId?: string;
  tenantId?: string;
  agentCode?: string;
  salesChannel?: string;
  role?: string;
}

export function extractTokenFromHeader(req: { headers: { authorization?: string } }): string | undefined {
  const authHeader = req.headers['authorization'];
  return authHeader && authHeader.split(' ')[1];
}

export function assignDecodedToRequest(req: AuthRequestBase, decoded: any): void {
  req.userId = decoded.userId;
  req.tenantId = decoded.tenantId;
  req.agentCode = decoded.agentCode;
  req.salesChannel = decoded.salesChannel;
  req.role = decoded.role;
}

// ============================================================
// FLIGHT SEGMENT UNIFIED TYPE
// ============================================================

export interface FlightSegment {
  // Shared base fields
  airline: string;
  flightNumber: string;
  duration: string;
  
  // Optional ID field
  id?: string;
  
  // Origin
  from?: string; // used by B2B
  origin?: string; // used by B2C (FlightSegmentResult)
  fromCity?: string;
  originCity?: string;
  fromAirport?: string;
  
  // Destination
  to?: string;
  destination?: string;
  toCity?: string;
  destinationCity?: string;
  toAirport?: string;
  
  // Timing
  departure?: string;
  departureTime?: string;
  arrival?: string;
  arrivalTime?: string;
  
  // Extra Info
  airlineCode?: string;
  aircraft?: string;
  class?: string;
  refundable?: 'Refundable' | 'Non-Refundable' | 'Partially Refundable' | boolean;
  baggage?: string;
  cabinBaggage?: string;
  terminal?: string;
  departureTerminal?: string | null;
  arrivalTerminal?: string | null;
  layoverDuration?: string | null;
}

// ============================================================
// TENANT CONFIGURATION SHARED TYPES
// ============================================================

export interface ProductAccessInput {
  accessFlights?: boolean;
  accessHotels?: boolean;
  accessCars?: boolean;
  accessInsurance?: boolean;
  accessPackages?: boolean;
  accessSightseeing?: boolean;
  accessTransfers?: boolean;
  accessDynamicSearch?: boolean;
}

export interface CompanyPermissionsInput {
  enableB2B2C?: boolean;
  canManageBranches?: boolean;
  canManageUsers?: boolean;
  canManageRoles?: boolean;
  canManageMarkups?: boolean;
  canManageCreditCards?: boolean;
  canImportPNR?: boolean;
  canAllowAutoTicket?: boolean;
  canAccessIITFare?: boolean;
  canManageSupplierCreds?: boolean;
  canManagePGCreds?: boolean;
  showLogoOnDashboard?: boolean;
  allowAirCanx?: boolean;
}

// ============================================================
// MARKUP CALCULATION SHARED HELPERS
// ============================================================

export const MARKUP_CONDITION_FIELDS = [
  'airlineCode', 'airlineGroup', 'originCode', 'destinationCode',
  'marketRegion', 'rbdClass', 'journeyType', 'cabinClass',
  'hotelId', 'hotelChain', 'hotelStars', 'mealPlan',
  'supplierCode', 'customerId', 'customerType', 'customerTier',
] as const;

export function calculateSpecificity(rule: Record<string, any>): number {
  let score = 0;
  MARKUP_CONDITION_FIELDS.forEach(field => {
    if (rule[field] !== null && rule[field] !== undefined && rule[field] !== '') {
      score += 10;
    }
  });

  if (rule.ruleLevel === 'EXCEPTION') score += 100;
  else if (rule.ruleLevel === 'OVERRIDE') score += 50;

  score += rule.priority || 0;
  return score;
}

export interface AppliedMarkupRuleResult {
  ruleId: string;
  ruleName: string;
  ruleLevel: string;
  valueType: string;
  value: number;
  markupAmount: number;
  priority: number;
}

export interface MarkupCalculationResult {
  netFare: number;
  totalMarkup: number;
  finalPrice: number;
  appliedRules: AppliedMarkupRuleResult[];
}

export function applyMarkupRulesWithConflictResolution(
  netFare: number,
  sortedRules: Array<Record<string, any>>,
  formatPrecision: (val: number) => number = (val) => parseFloat(val.toFixed(2))
): MarkupCalculationResult {
  const appliedRules: AppliedMarkupRuleResult[] = [];
  let totalMarkup = 0;
  let hasException = false;
  let hasOverride = false;

  for (const rule of sortedRules) {
    let markupAmount = 0;

    if (rule.valueType === 'Percentage' || rule.ruleType === 'PERCENTAGE') {
      markupAmount = (netFare * rule.value) / 100;
    } else {
      markupAmount = rule.value;
    }

    const ruleLevel = rule.ruleLevel || 'BASE';

    if (ruleLevel === 'EXCEPTION') {
      if (!hasException) {
        totalMarkup = markupAmount;
        appliedRules.length = 0;
        appliedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          ruleLevel,
          valueType: rule.valueType || 'Fixed',
          value: rule.value,
          markupAmount,
          priority: rule.priority || 0,
        });
        hasException = true;
        break;
      }
    } else if (ruleLevel === 'OVERRIDE') {
      if (!hasException) {
        if (!hasOverride) {
          totalMarkup = markupAmount;
          const baseRules = appliedRules.filter(r => r.ruleLevel === 'BASE');
          baseRules.forEach(r => {
            totalMarkup -= r.markupAmount;
          });
          appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            ruleLevel,
            valueType: rule.valueType || 'Fixed',
            value: rule.value,
            markupAmount,
            priority: rule.priority || 0,
          });
          hasOverride = true;
        }
      }
    } else {
      if (!hasException && !hasOverride) {
        totalMarkup += markupAmount;
        appliedRules.push({
          ruleId: rule.id,
          ruleName: rule.name,
          ruleLevel,
          valueType: rule.valueType || 'Fixed',
          value: rule.value,
          markupAmount,
          priority: rule.priority || 0,
        });
      }
    }
  }

  return {
    netFare,
    totalMarkup: formatPrecision(totalMarkup),
    finalPrice: formatPrecision(netFare + totalMarkup),
    appliedRules,
  };
}

export function validateMarkupRuleBasics(input: {
  name?: string;
  serviceType?: string;
  valueType?: string;
  value?: number;
}): string[] {
  const errors: string[] = [];

  if (!input.name || input.name.trim() === '') errors.push('Rule name is required');
  if (!input.serviceType || !['Flight', 'Hotel', 'All'].includes(input.serviceType)) {
    errors.push('Service type must be Flight, Hotel, or All');
  }
  if (!input.valueType || !['Percentage', 'Fixed'].includes(input.valueType)) {
    errors.push('Value type must be Percentage or Fixed');
  }
  if (typeof input.value !== 'number') errors.push('Value must be a valid number');

  return errors;
}

export function validateTemporalConditions(input: {
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
}): string[] {
  const errors: string[] = [];

  if (input.effectiveFrom && input.effectiveTo) {
    if (new Date(input.effectiveFrom) >= new Date(input.effectiveTo)) {
      errors.push('Effective from date must be before effective to date');
    }
  }

  return errors;
}

export function validateNonNegative(val: any, field: string, errors: string[]): void {
  if (typeof val !== 'number' || val < 0) {
    errors.push(`${field} must be a non-negative number`);
  }
}

export const formatPrecision = (val: number) => parseFloat(val.toFixed(2));

/**
 * Check if a rule is currently active within its temporal constraints
 * @param rule Rule with optional effectiveFrom and effectiveTo dates
 * @returns true if rule is active (within date range or no date constraints)
 */
export function isRuleTemporallyActive(rule: {
  effectiveFrom?: Date | null;
  effectiveTo?: Date | null;
  isActive?: boolean;
}): boolean {
  const now = new Date();

  if (rule.effectiveFrom && new Date(rule.effectiveFrom) > now) {
    return false;
  }

  if (rule.effectiveTo && new Date(rule.effectiveTo) < now) {
    return false;
  }

  return rule.isActive !== false;
}

/**
 * Filter markup rules by active status and matching conditions, then sort by specificity
 * @param rules Array of markup rules to process
 * @param conditions Conditions object to match against
 * @param matcher Function to determine if a rule matches the given conditions
 * @returns Filtered and sorted array of matching rules
 */
export function filterAndSortMarkupRules(
  rules: Array<Record<string, any>>,
  conditions: any,
  matcher: (rule: any, conditions: any) => boolean
): Array<Record<string, any>> {
  return rules
    .filter(rule => rule.isActive && isRuleTemporallyActive(rule) && matcher(rule, conditions))
    .sort((a, b) => {
      const specificityA = calculateSpecificity(a);
      const specificityB = calculateSpecificity(b);
      return specificityB - specificityA;
    });
}

// ============================================================
// FRONTEND CONTENT CONFIG
// ============================================================

export interface AlertsItemConfig {
  title?: string;
  message?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export interface TenantContentConfig {
  alerts: {
    items: AlertsItemConfig[];
  };
  helpCenter: {
    categories: Array<{ title: string; desc: string; icon?: string }>;
    faqs: Array<{ q: string; a: string }>;
    contact: {
      email: string;
      phone: string;
      whatsapp: string;
    };
  };
  [key: string]: any;
}

export const DEFAULT_CONTENT_CONFIG: TenantContentConfig = {
  alerts: {
    items: [],
  },
  helpCenter: {
    categories: [],
    faqs: [],
    contact: {
      email: "support@tripalfa.com",
      phone: "+1-000-000-0000",
      whatsapp: "+1-000-000-0000",
    },
  },
};

// ============================================================
// OFFLINE REQUEST TYPES
// ============================================================

export enum OfflineRequestStatus {
  PENDING_STAFF = "PENDING_STAFF",
  PRICING_SUBMITTED = "PRICING_SUBMITTED",
  PENDING_CUSTOMER_APPROVAL = "PENDING_CUSTOMER_APPROVAL",
  APPROVED = "APPROVED",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  COMPLETED = "COMPLETED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

export enum OfflineRequestPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

export enum OfflineRequestType {
  DATE_CHANGE = "DATE_CHANGE",
  ROUTE_CHANGE = "ROUTE_CHANGE",
  NAME_CORRECTION = "NAME_CORRECTION",
  CANCELLATION = "CANCELLATION",
  REFUND = "REFUND",
  OTHER = "OTHER",
}

export interface OfflineChangeRequest {
  id: string;
  requestRef?: string;
  bookingId: string;
  bookingRef?: string;
  requestType: OfflineRequestType | string;
  status: OfflineRequestStatus | string;
  priority?: OfflineRequestPriority | string;
  requestedBy?: string;
  assignedTo?: string;
  subject?: string;
  description?: string;
  remarks?: string;
  metadata?: Record<string, any>;
  pricing?: {
    originalAmount?: number;
    newAmount?: number;
    difference?: number;
    currency?: string;
  };
  timeline?: Array<{
    at: string;
    status: string;
    actor?: string;
    remarks?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOfflineRequestPayload {
  bookingId: string;
  bookingRef?: string;
  requestType: OfflineRequestType | string;
  priority?: OfflineRequestPriority | string;
  subject?: string;
  description: string;
  details?: Record<string, any>;
}
