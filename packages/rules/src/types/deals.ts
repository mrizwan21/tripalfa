/**
 * Travel Agency Deal Management Types
 * Comprehensive type definitions for supplier deals, packages, and promotions
 */

/**
 * Deal types supported
 */
export type DealType =
  | "contracted_rate"
  | "package_deal"
  | "early_bird"
  | "last_minute"
  | "free_nights"
  | "seasonal"
  | "supplier_exclusive"
  | "volume_discount";

/**
 * Deal status
 */
export type DealStatus = "draft" | "active" | "paused" | "expired" | "archived";

/**
 * Discount type for deals
 */
export type DealDiscountType = "percentage" | "fixed" | "tiered";

/**
 * Property type
 */
export type PropertyType =
  | "hotel"
  | "resort"
  | "apartment"
  | "villa"
  | "boutique"
  | "motel"
  | "guest_house";

/**
 * Journey type
 */
export type JourneyType = "one_way" | "round_trip" | "multi_city" | "all";

/**
 * Supplier deal definition
 */
export interface SupplierDeal {
  id: string;
  name: string;
  code: string;
  productType: string; // 'flight', 'hotel', 'holiday'
  dealType: DealType;
  status: DealStatus;
  supplierCodes: string[];
  discountType: DealDiscountType;
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  priority: number;
  isCombinableWithCoupons: boolean;
  validFrom: string;
  validTo: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierDealCreate {
  name: string;
  code: string;
  productType: string;
  dealType: DealType;
  supplierCodes: string[];
  discountType: DealDiscountType;
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  priority?: number;
  isCombinableWithCoupons?: boolean;
  validFrom: string;
  validTo: string;
  metadata?: Record<string, unknown>;
  mappingRules?: DealMappingRuleCreate[];
}

export interface SupplierDealUpdate {
  name?: string;
  code?: string;
  dealType?: DealType;
  discountType?: DealDiscountType;
  discountValue?: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  status?: DealStatus;
  priority?: number;
  isCombinableWithCoupons?: boolean;
  validFrom?: string;
  validTo?: string;
  metadata?: Record<string, unknown>;
  mappingRules?: DealMappingRuleCreate[];
  supplierCodes?: string[];
}

/**
 * Deal mapping rules for product-specific matching
 */
export interface DealMappingRules {
  id: string;
  dealId: string;
  journeyType: JourneyType;
  bookingClasses?: string[];
  rbds?: string[];
  cabinClasses?: string[];
  originCities?: string[];
  destinationCities?: string[];
  originCountries?: string[];
  destinationCountries?: string[];
  regions?: string[];
  routes?: string[];
  channels?: string[];
  b2bCompanyIds?: string[];
  hotelCategories?: string[];
  hotelStarRatings?: number[];
  conditions?: Record<string, unknown>;
  createdAt: string;
}

export interface DealMappingRuleCreate {
  journeyType?: JourneyType;
  bookingClasses?: string[];
  rbds?: string[];
  cabinClasses?: string[];
  originCities?: string[];
  destinationCities?: string[];
  originCountries?: string[];
  destinationCountries?: string[];
  regions?: string[];
  routes?: string[];
  channels?: string[];
  b2bCompanyIds?: string[];
  hotelCategories?: string[];
  hotelStarRatings?: number[];
  conditions?: Record<string, unknown>;
}

/**
 * Deal application record
 */
export interface DealApplication {
  id: string;
  dealId: string;
  bookingId: string;
  appliedDiscount: number;
  originalAmount: number;
  finalAmount: number;
  discountPercentage?: number;
  appliedAt: string;
}

/**
 * Deal match result for search results
 */
export interface DealMatchResult {
  deal: SupplierDeal;
  discountAmount: number;
  applicableAmount: number;
  reason: string;
  priority: number;
}

/**
 * Deal filters for searching
 */
export interface DealFilters {
  productType?: string;
  dealType?: DealType;
  status?: DealStatus;
  supplierCode?: string;
  priority?: number;
  validFrom?: string;
  validTo?: string;
  search?: string;
}

/**
 * Search criteria for deal matching
 */
export interface SearchCriteria {
  productType: string;
  supplierCodes?: string[];
  origin?: string;
  destination?: string;
  departureDate?: string;
  bookingClass?: string;
  cabinClass?: string;
  rbd?: string;
  journeyType?: JourneyType;
  hotelCategory?: string;
  hotelStarRating?: number;
  channel?: string;
  customerId?: string;
}

/**
 * Customer context for deal matching
 */
export interface CustomerContext {
  customerId: string;
  companyId?: string;
  segment?: string;
  loyaltyTier?: string;
  totalBookingValue?: number;
  previousBookings?: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Deal conflict report
 */
export interface ConflictReport {
  conflicts: Array<{
    dealId1: string;
    dealId2: string;
    conflictType: string;
    severity: "low" | "medium" | "high";
  }>;
  totalConflicts: number;
}

/**
 * Airline deal category types
 */
export type AirlineDealCategory =
  | "private_fare"
  | "ndc_special"
  | "route_specific"
  | "contract";

/**
 * Airline-specific deal metadata
 */
export interface AirlineDealMetadata {
  airlineCode: string;
  dealCategory: AirlineDealCategory;
  cabinClasses?: string[];
  aircraftTypes?: string[];
  fareBasis?: string;
  ancillaryIncluded?: string[];
  apbEligible?: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Airline deal definition
 */
export interface AirlineDeal extends SupplierDeal {
  metadata: AirlineDealMetadata & Record<string, unknown>;
}

/**
 * Airline deal creation parameters
 */
export interface AirlineDealCreate extends SupplierDealCreate {
  airlineCode: string;
  dealCategory: AirlineDealCategory;
  cabinClasses?: string[];
  aircraftTypes?: string[];
  fareBasis?: string;
  ancillaryIncluded?: string[];
  apbEligible?: boolean;
}

/**
 * Airline deal update parameters
 */
export interface AirlineDealUpdate extends SupplierDealUpdate {
  cabinClasses?: string[];
  aircraftTypes?: string[];
  fareBasis?: string;
  ancillaryIncluded?: string[];
  apbEligible?: boolean;
}

/**
 * Private fare configuration
 */
export interface PrivateFareConfig {
  dealId: string;
  airlineCode: string;
  origin: string;
  destination: string;
  baseFare: number;
  netFare: number;
  markup?: number;
  validFrom: string;
  validTo: string;
}

/**
 * NDC special deal
 */
export interface NDCSpecialDeal {
  dealId: string;
  airlineCode: string;
  ancillaries: Array<{
    code: string;
    name: string;
    price: number;
    currency: string;
  }>;
  baggage?: {
    pieces?: number;
    weight?: number;
    unit?: "kg" | "lb";
  };
  seatSelection?: boolean;
  mealOptions?: string[];
  loungaAccess?: boolean;
  validFrom: string;
  validTo: string;
}

/**
 * Airline contract
 */
export interface AirlineContract {
  dealId: string;
  airlineCode: string;
  contractNumber: string;
  commissioning?: {
    percentage?: number;
    fixedAmount?: number;
    currency?: string;
  };
  apbRequirements?: {
    minimumBookings?: number;
    minimumRevenue?: number;
    currency?: string;
  };
  exclusívites?: string[];
  validFrom: string;
  validTo: string;
}
