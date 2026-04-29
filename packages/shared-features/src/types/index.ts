// ============================================================
// CORE ENUMS & CONSTANTS
// ============================================================

export type MarkupValueType = 'PERCENTAGE' | 'FIXED';
export type MarkupJourneyType = 'OneWay' | 'RoundTrip' | 'MultiCity';
export type MarkupCustomerType = 'B2B' | 'B2C' | 'Corporate' | 'Guest';
export type MarkupRuleConditions = Record<string, any>;

export type CommissionRecipientType = 'Agency' | 'SubAgent' | 'Agent' | 'Corporate';
export type CommissionTransactionStatus = 'Pending' | 'Settled' | 'Disputed' | 'Cancelled';

export type PaymentHoldStatus = 'Active' | 'Expired' | 'Cancelled' | 'Paid';
export type RefundStatus = 'Pending' | 'Processed' | 'Failed' | 'Rejected';

export type TransactionCategory = 'Top-Up' | 'Service Payment' | 'Credit Draw' | 'Interest Charge' | 'Bulk Payout' | 'Refund' | 'Commission';
export type TransactionType = 'Credit' | 'Debit';

// ============================================================
// BOOKING FLOW TYPES
// ============================================================

export interface GuestStepData {
  ancillaries: {
    earlyCheckIn: boolean;
    breakfast: boolean;
    transfer: 'None' | 'Private' | 'Group';
  };
  travellers: Array<{
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }>;
  selectedInventoryBlock: string | null;
}

export interface AppTheme {
  primaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
  isRead: boolean;
  link?: string;
  createdAt?: string;
}

export interface TenantConfig {
  id: string;
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  currency: string;
  supportPhone: string;
  supportEmail: string;
}

export type UserRole = 'Admin' | 'Sales Executive' | 'Ticketing Lead' | 'Accountant' | 'Booking Agent' | 'Support Staff';



export interface BoardNotice {
  id: string;
  title: string;
  content: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  targets: string[]; 
  isAcknowledgeRequired: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface PromotionalBanner {
  id: string;
  imageUrl: string;
  actionUrl?: string;
  title?: string;
  targets: string[]; 
  isActive: boolean;
  sortOrder: number;
}

export interface AgencyCompliance {
  isGated: boolean;
  reason?: 'StaleProvisional' | 'CreditExceeded' | 'ComplianceHold';
  staleBookingCount: number;
  totalProvisionalAmount: number;
  lastSync: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  agencyName: string;
  agentCode?: string;
  phone?: string;
  address?: string;
  businessType?: string;
  balance?: number;
  availableCredit?: number;
  currency: string;
  country?: string;
  compliance?: AgencyCompliance;
  theme?: AppTheme;
  logoUrl?: string;
  registrationNo?: string;
  vatNo?: string;
  iataNo?: string;
  abtaNo?: string;
  atolNo?: string;
  officeId?: string;
  dateOfOperations?: string;
  creditLimit?: number;
  creditLimitAlert?: number;
  tempCreditLimit?: number;
  tempCreditLimitStart?: string;
  tempCreditLimitEnd?: string;
  tdsApplicable?: number;
  tdsExemption?: number;
  payPeriod?: string;
  dailyTicketValue?: number;
  canAllowAutoTicket?: boolean;
  canImportPNR?: boolean;
  canAccessIITFare?: boolean;
  canManageSupplierCreds?: boolean;
  showLogoOnDashboard?: boolean;
  allowAirCanx?: boolean;
  agentName?: string;
  salesRep?: string;
  salesRepPhone?: string;
  lastLogin?: string;
  allowedAirlines?: string[]; 
  restrictedServices?: string[]; 
}

export interface WalletAccount {
  id: string;
  name: string;
  type: 'Cash' | 'Credit' | 'Top-up';
  currency: string;
  balance: number;
  pending: number;
  limit?: number; 
}

export interface SubUser {
  id: string;
  tenantId?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  username: string;
  email: string;
  phone: string;
  telephone?: string;
  mobile?: string;
  isActive: boolean;
  disabledAirlines: string[];
  restrictedServices?: string[];
  role: UserRole;
  status?: 'Active' | 'Restricted' | 'Suspended';
  lastActive?: string;
  createdAt?: string;
  mpinEnabled?: boolean;
  gender?: 'Male' | 'Female' | 'Other';
  language?: string;
  isPrimaryContact?: boolean;
  isAccountsContact?: boolean;
  allowAutoTicket?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Inactive';
  city: string;
  state?: string;
  country?: string;
  email: string;
  phone: string;
  mobile?: string;
  fax?: string;
  address: string;
  address1?: string;
  address2?: string;
  address3?: string;
  postCode?: string;
  vatNo?: string;
  registrationNo?: string;
  officeId?: string;
  branchType?: 'GSA' | 'Sales Office' | 'Airport Desk' | 'Support Hub';
}

export interface TravellerProfile {
  id: string;
  tenantId: string;
  profileType: 'Individual' | 'Corporate' | 'Sub-Agent';
  title: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  taxId?: string;
  dob: string;
  nationality: string;
  passportNumber: string;
  passportExpiry: string;
  issuingCountry: string;
  type: 'Adult' | 'Child' | 'Infant';
  email?: string;
  phone?: string;
  mobile?: string;
  frequentFlyer?: string;
}

export type MarkupRuleType = 'Flight' | 'Hotel' | 'All';
type MarkupRuleLevel = 'BASE' | 'OVERRIDE' | 'EXCEPTION';

export interface MarkupRule {
  id: string;
  tenantId?: string;
  name: string;
  description?: string;
  serviceType?: MarkupRuleType;
  type?: MarkupRuleType; 
  valueType?: MarkupValueType;
  ruleType?: 'PERCENTAGE' | 'FIXED'; 
  value: number;
  isActive: boolean;
  priority: number;
  ruleLevel?: MarkupRuleLevel;
  airlineCode?: string;
  airlineGroup?: string;
  originCode?: string;
  destinationCode?: string;
  marketRegion?: string;
  rbdClass?: string;
  journeyType?: MarkupJourneyType;
  cabinClass?: CabinClass;
  hotelId?: string;
  hotelChain?: string;
  hotelStars?: number;
  mealPlan?: string;
  supplierCode?: string;
  customerId?: string;
  customerType?: MarkupCustomerType;
  customerTier?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  conditions?: MarkupRuleConditions;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================
// COMMISSION MANAGEMENT TYPES
// ============================================================

export type BookingContext = 'direct' | 'subagent' | 'corporate';

export type CommissionSourceType = 'Airline' | 'HotelSupplier' | 'GDS' | 'DirectContract';
export type CommissionValueType = 'Percentage' | 'Fixed' | 'Tiered';

export interface CommissionRule {
  id: string;
  name: string;
  description?: string;
  sourceType: CommissionSourceType;
  serviceType: MarkupRuleType;
  commissionType: CommissionValueType;
  baseCommission: number;
  isActive: boolean;
  supplierCode?: string;
  supplierId?: string;
  contractRef?: string;
  airlineCode?: string;
  airlineGroup?: string;
  originCode?: string;
  destinationCode?: string;
  rbdClass?: string;
  cabinClass?: string;
  hotelId?: string;
  hotelChain?: string;
  hotelStars?: number;
  mealPlan?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  sharingRules?: CommissionSharingRule[];
}

export interface CommissionSharingRule {
  id: string;
  commissionRuleId: string;
  shareType: CommissionValueType;
  shareValue: number;
  recipientType: CommissionRecipientType;
  customerId?: string;
  customerType?: string;
  customerTier?: string;
  minBookingValue?: number;
  maxShareValue?: number;
  priority: number;
  isActive: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommissionTransaction {
  id: string;
  bookingRef: string;
  commissionRuleId: string;
  sharingRuleId?: string;
  baseCommission: number;
  sharedAmount: number;
  retainedAmount: number;
  currency: string;
  recipientType: string;
  recipientId?: string;
  status: CommissionTransactionStatus;
  paidAt?: string;
  description?: string;
  createdAt: string;
  commissionRule?: CommissionRule;
  sharingRule?: CommissionSharingRule;
}

export interface CommissionSummary {
  totalBaseCommission: number;
  totalShared: number;
  totalRetained: number;
  transactionCount: number;
  averageCommission: number;
}

export interface FlightFare {
  id: string;
  name: string;
  description?: string;
  amount: number;
  netFare: number;
  currency: string;
  refundable: boolean;
  cabinClass: CabinClass;
}

export interface FlightSegment {
  airline: string;
  airlineCode: string;
  flightNumber: string;
  aircraft: string;
  from: string;
  fromCity: string;
  fromAirport: string;
  to: string;
  toCity: string;
  toAirport: string;
  departure: string;
  arrival: string;
  duration: string;
  class: string;
  refundable: 'Refundable' | 'Non-Refundable' | 'Partially Refundable';
  baggage: string;
  cabinBaggage: string;
  terminal?: string;
}

export interface FlightResult {
  id: string;
  segments: FlightSegment[];
  stops: number;
  totalDuration: string;
  economyBasic: number;
  published: number;
  netFare: number;
  currency: string;
  refundable: 'Refundable' | 'Non-Refundable' | 'Partially Refundable';
  seatsLeft?: number;
  origin?: string;
  destination?: string;
  airline?: string;
  fares?: FlightFare[];
}

export type CabinClass = 'Economy' | 'Business' | 'First' | 'Premium Economy';

export interface HotelRoom {
  id: string;
  name: string;
  mealPlan: string;
  price: number;
  netFare: number;
  refundable: boolean;
  bedType: string;
  capacity: number;
  isRecommended?: boolean;
  isDeal?: boolean;
}

export interface Hotel {
  id: string;
  name: string;
  chain?: string;
  stars: number;
  rating: number;
  ratingLabel: string;
  totalRatings: number;
  address: string;
  city: string;
  image: string;
  images: string[];
  price: number;
  netFare: number;
  netRate?: number; 
  currency: string;
  refundable: boolean;
  amenities: string[];
  boardBasis: string[];
  neighborhood: string;
  rooms: HotelRoom[];
  description: string;
  lat: number;
  lng: number;
  nearbyAttractions: string[];
  checkInPolicy: string;
  cancellationPolicy: string;
  mealPlan?: string;
}

export interface HotelSearch {
  destination: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  rooms: number;
  adults: number;
  children: number;
  infants: number;
}

export type BookingStatus = 'Confirmed' | 'Pending' | 'Cancelled' | 'On Hold' | 'Refunded' | 'Paid' | 'Issued';

export interface PaymentHoldBooking {
  id: string;
  tenantId: string;
  referenceNo: string;
  service: 'Flight' | 'Hotel';
  status: 'On Hold' | 'Payment Due';
  paymentHoldStatus: PaymentHoldStatus;
  holdPlacedAt: string;
  holdExpiresAt: string;
  autoCancelAt?: string;
  reminderSentCount: number;
  passengerName: string;
  route?: string;
  hotelName?: string;
  amount: number;
  currency: string;
  paymentMethod?: string;
  createdBy?: string;
  lastReminderAt?: string;
}

export interface RefundTrackingBooking {
  id: string;
  tenantId: string;
  referenceNo: string;
  service: 'Flight' | 'Hotel';
  status: 'Refunded' | 'Pending Refund' | 'Refund Failed';
  refundStatus: RefundStatus;
  refundRequestedAt?: string;
  refundProcessedAt?: string;
  refundAmount?: number;
  originalAmount: number;
  penaltyPercent?: number;
  netRefundAmount?: number;
  refundTransactionId?: string;
  paymentMethod?: string;
  passengerName: string;
  route?: string;
  hotelName?: string;
  currency: string;
  processedBy?: string;
  refundNote?: string;
  retryCount?: number;
}

export interface BookingNote {
  id: string;
  author: string;
  content: string;
  level: 'Internal' | 'Supplier' | 'System';
  timestamp: string;
}

export interface BookingMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isInternal: boolean;
  status: 'sent' | 'read' | 'failed';
}

export type AmendmentType = 'NameChange' | 'DateChange' | 'SectorCancel' | 'FullCancel' | 'AncillaryAdd';

export interface AmendmentRequest {
  id: string;
  bookingId: string;
  type: AmendmentType;
  status: 'Pending' | 'ProviderAcknowledge' | 'Approved' | 'Rejected' | 'Refunded';
  requestedAt: string;
  requestedBy: string;
  description: string;
  estimatedPenalty?: number;
  providerReference?: string;
  resolutionNote?: string;
}

export interface Booking {
  id: string;
  tenantId: string;
  referenceNo: string;
  service: 'Flight' | 'Hotel';
  status: BookingStatus;
  passengerName: string;
  route?: string;
  airline?: string;
  pnr?: string;
  ticketNo?: string;
  hotelName?: string;
  hotelStars?: number;
  mealPlan?: string;
  travelDate: string;
  bookingDate: string;
  amount: number;
  markup?: number;
  currency: string;
  subUser?: string;
  remarks?: string;
  paymentMethod?: 'Cash' | 'Wallet' | 'Online';
  paymentDate?: string;
  issuedDate?: string;
  invoiceNo?: string;
  receiptNo?: string;
  passengerDob?: string;
  passengerNationality?: string;
  passengerPassport?: string;
  passengerPassportExpiry?: string;
  passengerResidency?: string;
  supplierCost?: number;
  notifications?: string; 
  refundDate?: string;
  refundAmount?: number;
  refundNoteText?: string;
  lockedBy?: string;
  lockedAt?: string;
  authorizationStatus?: 'Provisional' | 'Authorized' | 'Rejected';
  authorizationBy?: string;
  rejectionReason?: string;
  customerAccount?: {
    id: string;
    name: string;
    type: 'Corporate' | 'Individual';
    accountNo: string;
    creditLimit?: number;
    outstanding?: number;
  };
  supplierSettlementStatus?: 'Pending' | 'Vouched' | 'Settled' | 'Disputed';
  notes?: BookingNote[];
  messages?: BookingMessage[];
  approvalStatus?: 'Pending' | 'Approved' | 'Rejected';
  approvedCount?: number;
  approvalCount?: number;
  amendmentHistory?: AmendmentRequest[];
}

export interface Transaction {
  id: string;
  tenantId: string;
  date: string;
  description: string;
  reference: string;
  category: TransactionCategory;
  type: TransactionType;
  amount: number;
  currency: string;
  runningBalance: number;
  accountId?: string;
  accountName?: string;
}

export interface InventoryBlock {
  id: string;
  type: 'Flight' | 'Hotel';
  title?: string;
  provider: string;
  reference: string;
  totalQuantity: number;
  availableQuantity: number;
  costPerUnit: number;
  sellPricePerUnit: number;
  expiryDate: string;
  status: 'Active' | 'Depleted' | 'Expired' | 'CarryForwarded';
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  agentName: string;
  action: string;
  reference: string;
  status: 'Success' | 'Failed' | 'Warning';
  details: string;
  ipAddress?: string;
}

export interface SecurityEntry {
  timestamp: string;
  event: string;
  status: string;
  ipAddress?: string;
  device?: string;
  location?: string;
  browser?: string;
}

export interface AgencyNode {
  id: string;
  name: string;
  agentCode: string;
  type: 'MASTER' | 'Sub Agent';
  totalBookings: number;
  revenue: number;
  bookings?: number;
  status: 'Active' | 'Restricted' | 'Provisioning';
  perfData?: number[];
  children?: AgencyNode[];
}

export interface AgencyHierarchyItem extends AgencyNode {
  cachedBookings?: number;
  cachedRevenue?: number;
  perfSparkline?: number[];
  isActive: boolean;
  subAgencies?: AgencyHierarchyItem[];
}

// ============================================================
// WALLET & CREDIT TYPES
// ============================================================

export interface CreditEligibilityResult {
  clientId: string;
  clientName: string;
  eligible: boolean;
  recommendedLimit: number;
  recommendedApr: number;
  maxRatio: number;
  riskTier: 'Low' | 'Medium' | 'High';
  loyaltyScore: number;
  scoringFactors: Array<{
    factor: string;
    weight: number;
    score: number;
    impact: 'Positive' | 'Neutral' | 'Negative';
    description: string;
  }>;
  lastComputedAt: string;
  reviewRequiredAt: string;
}

export interface BulkPayout {
  id: string;
  tenantId: string;
  clientId?: string;
  title: string;
  type: string;
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  totalAmount: number;
  currency: string;
  lineItems: Array<{
    id: string;
    payee: string;
    accountRef: string;
    bank: string;
    amount: number;
    currency: string;
    reference: string;
    status: 'Queued' | 'Sent' | 'Failed';
  }>;
  isEscrow: boolean;
  escrowReleaseDate?: string;
  createdAt: string;
  processedAt?: string;
  createdBy: string;
}

export interface OpenBankingConsent {
  id: string;
  clientId: string;
  clientName: string;
  bankName: string;
  bankCode: string;
  accountNickname: string;
  maskedAccountNo: string;
  iban?: string;
  currency: string;
  status: 'Active' | 'Expired' | 'Revoked';
  permissions: string[];
  consentGrantedAt: string;
  consentExpiresAt: string;
  autoTopUpEnabled: boolean;
  autoTopUpThreshold?: number;
  autoTopUpAmount?: number;
  lastUsedAt?: string;
}

export interface WalletAnalytics {
  totalBalance?: number;
  totalCreditLimit?: number;
  utilizationRate?: number;
  monthlySpend?: number;
  projectedSpend?: number;
  currency?: string;
  totalWalletVolume?: number;
  totalCreditExtended?: number;
  totalCreditUsed?: number;
  avgUtilizationPct?: number;
  activeClients?: number;
  atRiskClients?: number;
  frozenClients?: number;
  totalInflow?: number;
  totalOutflow?: number;
  monthlyVolume?: number[];
  topUpVolume?: number[];
  lastUpdatedAt?: string;
  topPayees?: Array<{ name: string; amount: number }>;
  spendingByCategory?: Record<string, number>;
  historicalBalances?: Array<{ date: string; balance: number }>;
}

export interface CreditFacility {
  id: string;
  clientId: string;
  clientName: string;
  depositAmount: number;
  creditLimit: number;
  creditUsed: number;
  creditAvailable: number;
  apr: number;
  gracePeriodDays: number;
  repaymentDueDate?: string;
  outstandingInterest?: number;
  autoRepayEnabled: boolean;
  autoRepayAccountId?: string;
  lastReviewedAt: string;
  nextReviewAt: string;
  currency: string;
}

export interface WalletTransaction extends Transaction {
  clientId: string;
  clientName: string;
  status: 'Pending' | 'Settled' | 'Failed';
  method: string;
  openBankingRef?: string;
  bookingRef?: string;
}

// ============================================================
// CALL CENTER & CRM TYPES
// ============================================================

export interface FlightSearch {
  from: string;
  fromCode?: string;
  to: string;
  toCode?: string;
  departureDate: string;
  departDate?: string;
  returnDate?: string;
  adults: number;
  children: number;
  infants: number;
  cabinClass: CabinClass;
}

export type WalletPaymentMethod = 'WalletBalance' | 'Card' | 'OpenBanking' | 'CashDeposit';

export interface SupplierProfile {
  id: string;
  name: string;
  code: string;
  type: string;
  status: string;
  contactEmail: string;
  contactPhone: string;
}

export interface SupplierSearchResult extends SupplierProfile {}

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  status: string;
}

export interface ClientPassport {
  id: string;
  number: string;
  expiry: string;
}

export interface ClientVisa {
  id: string;
  visaNumber?: string;
  country: string;
  type?: string;
  dateOfIssue?: string;
  dateOfExpiry?: string;
  expiry?: string; // Legacy
}

export interface ClientDependent {
  id: string;
  name: string;
  relation: string;
  dob?: string;
  gender?: string;
  passportNumber?: string;
}

export interface ClientPreferences {
  meal?: string;
  seat?: string;
  flight?: {
    meal?: string;
    seat?: string;
    frequentFlyer?: string;
    class?: string;
    baggage?: string;
    wheelchair?: boolean;
  };
  hotel?: {
    room?: string;
    floor?: string;
    view?: string;
    smoking?: boolean;
    breakfast?: boolean;
    earlyCheckIn?: boolean;
    transfer?: string;
  };
  car?: {
    transmission?: string;
    type?: string;
    gps?: boolean;
    insurance?: boolean;
  };
}

export interface ClientDocument {
  id: string;
  name?: string;
  url?: string;
  title?: string;
  fileName?: string;
}

export interface ClientPersonalCard {
  id: string;
  type?: string;
  last4?: string;
  cardName?: string;
  cardType?: string;
  cardNumber?: string;
  expiryDate?: string;
}

export interface ClientAssociation {
  id: string;
  name: string;
}

export interface ClientSearchResult extends ClientProfile {}

export interface CustomAlert {
  id: string;
  title: string;
  message: string;
  type: string;
}

export interface CommunicationLogEntry {
  id: string;
  timestamp?: string;
  date?: string;
  channel: string;
  direction?: string;
  summary?: string;
  agentName?: string;
}

export interface ClientFeedback {
  id: string;
  clientId?: string;
  type: string;
  rating: number;
  comment: string;
  npsScore?: number;
  createdAt?: string;
}

export interface ClientOrderTracking {
  id: string;
  clientId?: string;
  bookingRef: string;
  serviceType: string;
  status: string;
  amount: number;
  currency: string;
  bookingDate: string;
  travelDate: string;
}

export interface EscalationRule {
  id: string;
  level?: number;
  trigger?: string;
  action?: string;
  severity?: string;
  isActive?: boolean;
}

export interface ComplianceCheck {
  id: string;
  status: string;
}

export interface RegulatoryReport {
  id: string;
  name: string;
  date?: string;
  status?: string;
}

export interface WalletClient {
  id: string;
  tenantId?: string;
  name?: string;
  clientName?: string;
  clientCode?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  clientType?: string;
  status?: string;
  tier?: string;
  loyaltyScore?: number;
  kycVerified?: boolean;
  walletBalance?: number;
  balance?: number;
  pendingBalance?: number;
  currency: string;
  creditEnabled?: boolean;
  creditLimit?: number;
  creditUsed?: number;
  creditAvailable?: number;
  annualSpend?: number;
  monthlyAvgSpend?: number;
  totalTransactions?: number;
  lastActivityAt?: string;
  createdAt?: string;
  linkedBankAccounts?: number;
  autoTopUpEnabled?: boolean;
  autoTopUpThreshold?: number;
  autoTopUpAmount?: number;
}

export interface MpinSettings {
  hasPin: boolean;
  biometricLinked: boolean;
}

export interface SecurityEntry {
  timestamp: string;
  event: string;
  status: string;
}
