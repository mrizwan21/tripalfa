// ============================================================================
// TripAlfa Shared Types - Enums
// All enum definitions matching Prisma schema
// ============================================================================

// Company Domain
export enum CompanyType {
  AGENCY = 'AGENCY',
  CORPORATE = 'CORPORATE',
  CONSOLIDATOR = 'CONSOLIDATOR',
  SUB_AGENT = 'SUB_AGENT',
  FRANCHISE = 'FRANCHISE',
}

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
}

export enum BranchType {
  HEAD_OFFICE = 'HEAD_OFFICE',
  OFFICE = 'OFFICE',
  FRANCHISE = 'FRANCHISE',
  VIRTUAL = 'VIRTUAL',
}

export enum BranchStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CLOSED = 'CLOSED',
}

// User Domain
export enum UserType {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  B2B = 'B2B',
  B2C = 'B2C',
  API = 'API',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum CustomerTier {
  STANDARD = 'STANDARD',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
}

// Role Domain
export enum RoleType {
  SYSTEM = 'SYSTEM',
  COMPANY = 'COMPANY',
  CUSTOM = 'CUSTOM',
}

export enum RoleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

// Security Domain
export enum LoginAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MFA_ENABLE = 'MFA_ENABLE',
  MFA_DISABLE = 'MFA_DISABLE',
  SESSION_REFRESH = 'SESSION_REFRESH',
}

export enum LoginStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  BLOCKED = 'BLOCKED',
}

// Booking Domain
export enum BookingType {
  FLIGHT = 'FLIGHT',
  HOTEL = 'HOTEL',
  CAR = 'CAR',
  TRANSFER = 'TRANSFER',
  ACTIVITY = 'ACTIVITY',
  PACKAGE = 'PACKAGE',
  INSURANCE = 'INSURANCE',
  VISA = 'VISA',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  ON_HOLD = 'ON_HOLD',
  TICKETED = 'TICKETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ESCALATED = 'ESCALATED',
}

export enum BookingSource {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
  API = 'API',
  AGENT = 'AGENT',
  CALL_CENTER = 'CALL_CENTER',
}

export enum PassengerType {
  ADT = 'ADT',
  CHD = 'CHD',
  INF = 'INF',
  YTH = 'YTH',
  SRC = 'SRC',
  STU = 'STU',
}

export enum TicketStatus {
  PENDING = 'PENDING',
  ISSUED = 'ISSUED',
  VOIDED = 'VOIDED',
  REFUNDED = 'REFUNDED',
  EXCHANGED = 'EXCHANGED',
}

export enum QueueType {
  TICKETING = 'TICKETING',
  APPROVAL = 'APPROVAL',
  PAYMENT = 'PAYMENT',
  SCHEDULE_CHANGE = 'SCHEDULE_CHANGE',
  CANCELLATION = 'CANCELLATION',
  REVALIDATION = 'REVALIDATION',
  NAME_CHANGE = 'NAME_CHANGE',
  GENERAL = 'GENERAL',
}

export enum QueuePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum QueueStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  ESCALATED = 'ESCALATED',
  CANCELLED = 'CANCELLED',
}

export enum RemarkType {
  GENERAL = 'GENERAL',
  AGENT = 'AGENT',
  SYSTEM = 'SYSTEM',
  SUPPLIER = 'SUPPLIER',
  CUSTOMER = 'CUSTOMER',
}

// Supplier Domain
export enum SupplierType {
  GDS = 'GDS',
  DIRECT_API = 'DIRECT_API',
  CONSOLIDATOR = 'CONSOLIDATOR',
  LOCAL = 'LOCAL',
}

export enum SupplierCategory {
  AIRLINE = 'AIRLINE',
  HOTEL = 'HOTEL',
  CAR_RENTAL = 'CAR_RENTAL',
  TRANSFER = 'TRANSFER',
  ACTIVITY = 'ACTIVITY',
  INSURANCE = 'INSURANCE',
  VISA = 'VISA',
  MULTI_SERVICE = 'MULTI_SERVICE',
}

export enum SupplierStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum ContractType {
  STANDARD = 'STANDARD',
  PREFERRED = 'PREFERRED',
  EXCLUSIVE = 'EXCLUSIVE',
  NET_RATE = 'NET_RATE',
}

export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
}

export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum RemittanceStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// API Domain
export enum ApiVendorType {
  GDS = 'GDS',
  AGGREGATOR = 'AGGREGATOR',
  DIRECT = 'DIRECT',
  PAYMENT = 'PAYMENT',
  UTILITY = 'UTILITY',
}

export enum ApiVendorStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  DEPRECATED = 'DEPRECATED',
}

export enum AuthType {
  API_KEY = 'API_KEY',
  OAUTH2 = 'OAUTH2',
  BASIC = 'BASIC',
  BEARER = 'BEARER',
  CERTIFICATE = 'CERTIFICATE',
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

// Tax Domain
export enum TaxType {
  INCLUSIVE = 'INCLUSIVE',
  EXCLUSIVE = 'EXCLUSIVE',
  COMPOUND = 'COMPOUND',
}

export enum ReclaimStatus {
  NOT_CLAIMED = 'NOT_CLAIMED',
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

export enum ClaimStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
}

// Markup & Commission Domain
export enum MarkupType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  PER_SEGMENT = 'PER_SEGMENT',
  PER_PASSENGER = 'PER_PASSENGER',
}

export enum CommissionType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  PER_SEGMENT = 'PER_SEGMENT',
  PER_PASSENGER = 'PER_PASSENGER',
  TIERED = 'TIERED',
}

export enum CommissionTargetType {
  COMPANY = 'COMPANY',
  BRANCH = 'BRANCH',
  USER = 'USER',
}

export enum SettlementStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SETTLED = 'SETTLED',
  FAILED = 'FAILED',
}

// Discount Domain
export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum RedemptionStatus {
  APPLIED = 'APPLIED',
  REVERSED = 'REVERSED',
  EXPIRED = 'EXPIRED',
}

// Payment Domain
export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  ADYEN = 'ADYEN',
  CHECKOUT = 'CHECKOUT',
  SQUARE = 'SQUARE',
  CYBERSOURCE = 'CYBERSOURCE',
  MANUAL = 'MANUAL',
}

export enum PaymentGatewayType {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  WALLET = 'WALLET',
}

export enum GatewayStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export enum PaymentMethodType {
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET',
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  CREDIT = 'CREDIT',
}

export enum PaymentMethodStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
  TOPUP = 'TOPUP',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum RefundType {
  FULL = 'FULL',
  PARTIAL = 'PARTIAL',
  CANCELLATION = 'CANCELLATION',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum RefundStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
}

// Wallet Domain
export enum WalletType {
  COMPANY = 'COMPANY',
  USER = 'USER',
  ESCROW = 'ESCROW',
}

export enum WalletStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN',
  CLOSED = 'CLOSED',
}

export enum LedgerEntryType {
  BOOKING_PAYMENT = 'BOOKING_PAYMENT',
  REFUND = 'REFUND',
  TOPUP = 'TOPUP',
  WITHDRAWAL = 'WITHDRAWAL',
  COMMISSION = 'COMMISSION',
  ADJUSTMENT = 'ADJUSTMENT',
  FEE = 'FEE',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
}

export enum LedgerDirection {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum MojaloopStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CLOSED = 'CLOSED',
}

// Report Domain
export enum ReportCategory {
  SALES = 'SALES',
  FINANCE = 'FINANCE',
  BOOKING = 'BOOKING',
  CUSTOMER = 'CUSTOMER',
  SUPPLIER = 'SUPPLIER',
  PERFORMANCE = 'PERFORMANCE',
  AUDIT = 'AUDIT',
  CUSTOM = 'CUSTOM',
}

export enum DeliveryMethod {
  EMAIL = 'EMAIL',
  SFTP = 'SFTP',
  WEBHOOK = 'WEBHOOK',
  STORAGE = 'STORAGE',
}

// Document Domain
export enum DocumentType {
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  TICKET = 'TICKET',
  VOUCHER = 'VOUCHER',
  CONTRACT = 'CONTRACT',
  ID_DOCUMENT = 'ID_DOCUMENT',
  TRAVEL_DOCUMENT = 'TRAVEL_DOCUMENT',
  OTHER = 'OTHER',
}

export enum InvoiceType {
  SALES = 'SALES',
  CREDIT_NOTE = 'CREDIT_NOTE',
  DEBIT_NOTE = 'DEBIT_NOTE',
  PROFORMA = 'PROFORMA',
}

export enum CustomerInvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
  VOIDED = 'VOIDED',
}

// Notification Domain
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
  WHATSAPP = 'WHATSAPP',
}

export enum NotificationType {
  BOOKING_CONFIRMATION = 'BOOKING_CONFIRMATION',
  PAYMENT_RECEIPT = 'PAYMENT_RECEIPT',
  SCHEDULE_CHANGE = 'SCHEDULE_CHANGE',
  CANCELLATION = 'CANCELLATION',
  REMINDER = 'REMINDER',
  PROMOTIONAL = 'PROMOTIONAL',
  SYSTEM = 'SYSTEM',
  ALERT = 'ALERT',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

// Audit Domain
export enum AuditSeverity {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum GdsLogStatus {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
}

// Currency Domain
export enum ExchangeRateSource {
  MANUAL = 'MANUAL',
  OPENEXCHANGE = 'OPENEXCHANGE',
  CURRENCYLAYER = 'CURRENCYLAYER',
  FIXER = 'FIXER',
  ECB = 'ECB',
}

export enum BufferType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum BufferDirection {
  BUY = 'BUY',
  SELL = 'SELL',
  BOTH = 'BOTH',
}

// Reference Data Domain
export enum AirportType {
  AIRPORT = 'AIRPORT',
  HELIPORT = 'HELIPORT',
  SEAPLANE_BASE = 'SEAPLANE_BASE',
  RAIL_STATION = 'RAIL_STATION',
  BUS_STATION = 'BUS_STATION',
}

export enum AirportSize {
  LARGE = 'LARGE',
  MEDIUM = 'MEDIUM',
  SMALL = 'SMALL',
}

export enum DocCategory {
  IDENTITY = 'IDENTITY',
  TRAVEL = 'TRAVEL',
  FINANCIAL = 'FINANCIAL',
  LEGAL = 'LEGAL',
  OTHER = 'OTHER',
}

export enum TextDirection {
  LTR = 'LTR',
  RTL = 'RTL',
}
