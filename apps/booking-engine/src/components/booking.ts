export enum BookingStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
  EXPIRED = "EXPIRED",
  HOLD = "HOLD",
}

export enum ServiceType {
  FLIGHT = "flight",
  HOTEL = "hotel",
  PACKAGE = "package",
  TRANSFER = "transfer",
  VISA = "visa",
  INSURANCE = "insurance",
}

export enum Priority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum PaymentMethod {
  WALLET = "wallet",
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  NET_BANKING = "net_banking",
  UPI = "upi",
}

export enum CustomerType {
  INDIVIDUAL = "individual",
  CORPORATE = "corporate",
}

export enum SupplierType {
  AIRLINE = "airline",
  HOTEL = "hotel",
  CAR_RENTAL = "car_rental",
  VISA_AGENCY = "visa_agency",
  INSURANCE_COMPANY = "insurance_company",
}

export enum UserRole {
  ADMIN = "admin",
  AGENT = "agent",
  SUPERVISOR = "supervisor",
  MANAGER = "manager",
}

export enum Permission {
  CREATE_BOOKING = "create_booking",
  SEARCH_BOOKINGS = "search_bookings",
  VIEW_BOOKINGS = "view_bookings",
  UPDATE_BOOKING = "update_booking",
  CANCEL_BOOKING = "cancel_booking",
  CONFIRM_BOOKING = "confirm_booking",
  ISSUE_TICKET = "issue_ticket",
  HOLD_INVENTORY = "hold_inventory",
  VIEW_CUSTOMERS = "view_customers",
  CREATE_CUSTOMER = "create_customer",
  UPDATE_CUSTOMER = "update_customer",
  DELETE_CUSTOMER = "delete_customer",
  VIEW_SUPPLIERS = "view_suppliers",
  CREATE_SUPPLIER = "create_supplier",
  UPDATE_SUPPLIER = "update_supplier",
  DELETE_SUPPLIER = "delete_supplier",
  MANAGE_WORKFLOW = "manage_workflow",
  ASSIGN_BOOKING = "assign_booking",
  UPDATE_PRIORITY = "update_priority",
  VIEW_INVENTORY = "view_inventory",
  MANAGE_INVENTORY = "manage_inventory",
  ADD_INVENTORY = "add_inventory",
  UPDATE_INVENTORY = "update_inventory",
  DELETE_INVENTORY = "delete_inventory",
  MANAGE_PRICING = "manage_pricing",
  VIEW_PRICING = "view_pricing",
  CREATE_PRICING_RULE = "create_pricing_rule",
  UPDATE_PRICING_RULE = "update_pricing_rule",
  DELETE_PRICING_RULE = "delete_pricing_rule",
  MANAGE_COMMISSIONS = "manage_commissions",
  VIEW_COMMISSIONS = "view_commissions",
  CREATE_COMMISSION_RULE = "create_commission_rule",
  UPDATE_COMMISSION_RULE = "update_commission_rule",
  DELETE_COMMISSION_RULE = "delete_commission_rule",
  MANAGE_PERMISSIONS = "manage_permissions",
  VIEW_PERMISSIONS = "view_permissions",
  VIEW_REPORTS = "view_reports",
  GENERATE_REPORTS = "generate_reports",
  VIEW_AUDIT = "view_audit",
  VIEW_COMPLIANCE = "view_compliance",
}

export interface BookingDetails {
  origin?: string;
  destination?: string;
  checkIn?: Date;
  checkOut?: Date;
  travelDate: Date;
  returnDate?: Date;
  passengers: Passenger[];
  serviceDetails?: any;
}

export interface Passenger {
  firstName: string;
  lastName: string;
  type: "adult" | "child" | "infant";
  dateOfBirth: Date;
  passportNumber?: string;
  nationality?: string;
}

export interface CustomerInfo {
  type: CustomerType;
  name: string;
  email: string;
  phone: string;
  address?: string;
  companyName?: string;
  companyRegistrationNumber?: string;
  branchId?: string;
}

export interface PaymentInfo {
  method: PaymentMethod;
  amount: number;
  currency: string;
  paymentReference?: string;
  paymentDetails?: any;
}

export interface BookingOptions {
  hold: boolean;
  priority: Priority;
  remarks?: string;
  tags?: string[];
}

export interface PricingInfo {
  netAmount: number;
  sellingAmount: number;
  profit: number;
  currency: string;
}

export interface WorkflowStatus {
  currentStatus: BookingStatus;
  reason?: string;
  nextAction?: string;
  estimatedCompletion?: Date;
  updatedAt: Date;
  updatedBy: string;
}

export interface TicketInfo {
  bookingId: string;
  passengerId: string;
  ticketNumber: string;
  pnr: string;
  seatNumber?: string;
  baggageAllowance?: string;
  issuedBy: string;
  issueDate: Date;
  remarks?: string;
}

export interface InventoryHold {
  inventoryId: string;
  serviceType: ServiceType;
  inventoryDetails: any;
  holdDuration: number;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  remarks?: string;
  createdBy: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface PricingRule {
  name: string;
  description?: string;
  ruleType: "markup" | "discount" | "fixed_price" | "dynamic";
  conditions: {
    serviceType: ServiceType[];
    customerType?: CustomerType[];
    bookingChannel?: ("b2b" | "b2c" | "call_center")[];
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
    applyTo: "base_price" | "selling_price" | "all";
  };
  validity: {
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
  };
  priority: number;
}

export interface CommissionRule {
  name: string;
  description?: string;
  ruleType: "percentage" | "fixed_amount" | "tiered";
  conditions: {
    serviceType: ServiceType[];
    customerType?: CustomerType[];
    bookingChannel?: ("b2b" | "b2c" | "call_center")[];
    bookingAmountRange?: {
      minAmount?: number;
      maxAmount?: number;
    };
    agentLevel?: UserRole[];
  };
  commissionLogic: {
    percentage?: number;
    fixedAmount?: number;
    currency: string;
    calculationBasis: "net_price" | "selling_price" | "profit";
    tieredStructure?: Array<{
      minAmount: number;
      maxAmount?: number;
      percentage: number;
    }>;
  };
  paymentTerms: {
    paymentMethod: "immediate" | "monthly" | "quarterly";
    paymentDate: "end_of_month" | "15th_of_month" | "custom";
    customPaymentDate?: number;
  };
  validity: {
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
  };
}

export interface AuditLog {
  id: string;
  userId: string;
  actionType: string;
  resourceType: string;
  resourceId: string;
  details: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface ReportParams {
  reportType: "daily" | "weekly" | "monthly" | "custom";
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  filters?: any;
  groupBy?: string[];
  includeDetails?: boolean;
}

export interface SearchParams {
  page?: number;
  limit?: number;
  [key: string]: any;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  companyId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  companyRegistrationNumber: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  creditLimit?: number;
  paymentTerms: "prepaid" | "postpaid" | "credit";
  status: "active" | "inactive" | "suspended";
  branches: Branch[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  commissionRate?: number;
  paymentTerms: "prepaid" | "postpaid" | "net_7" | "net_15" | "net_30";
  status: "active" | "inactive" | "suspended";
  serviceTypes: ServiceType[];
  apiEndpoint?: string;
  apiKey?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inventory {
  id: string;
  serviceType: ServiceType;
  inventoryDetails: any;
  supplierId: string;
  availableCount: number;
  price: number;
  currency: string;
  markup: number;
  status: "available" | "sold_out" | "suspended" | "on_hold";
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
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
