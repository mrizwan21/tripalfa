/**
 * Hotel Deal Types
 * Specialized hotel deal types including contracted rates, packages, and promotions
 */

// ============================================
// Enums
// ============================================

export enum HotelDealType {
  CONTRACTED_RATE = "contracted_rate",
  PACKAGE_DEAL = "package_deal",
  EARLY_BIRD = "early_bird",
  LAST_MINUTE = "last_minute",
  FREE_NIGHTS = "free_nights",
  SEASONAL = "seasonal",
}

export enum PropertyType {
  HOTEL = "hotel",
  RESORT = "resort",
  APARTMENT = "apartment",
  VILLA = "villa",
  BOUTIQUE = "boutique",
  MOTEL = "motel",
  GUEST_HOUSE = "guest_house",
}

export enum LocationType {
  CITY_CENTER = "city_center",
  AIRPORT = "airport",
  BEACH = "beach",
  SUBURBAN = "suburban",
  DOWNTOWN = "downtown",
  MOUNTAIN = "mountain",
}

export enum MealPlan {
  ROOM_ONLY = "room_only",
  BREAKFAST = "breakfast",
  HALF_BOARD = "half_board",
  FULL_BOARD = "full_board",
  ALL_INCLUSIVE = "all_inclusive",
}

export enum RoomType {
  STANDARD = "standard",
  SUPERIOR = "superior",
  DELUXE = "deluxe",
  SUITE = "suite",
  VILLA = "villa",
  PENTHOUSE = "penthouse",
}

export enum BedType {
  SINGLE = "single",
  DOUBLE = "double",
  TWIN = "twin",
  KING = "king",
  QUEEN = "queen",
  BUNK = "bunk",
}

// ============================================
// Package Inclusions
// ============================================

export interface PackageInclusions {
  breakfast?: boolean;
  airportTransfer?: boolean;
  spaCredit?: number;
  lateCheckout?: boolean;
  roomUpgrade?: boolean;
  activities?: string[];
  mealVouchers?: number;
  parkingIncluded?: boolean;
  wifiIncluded?: boolean;
}

export interface PackageInclusionValue {
  type: keyof PackageInclusions;
  value: number;
}

// ============================================
// Booking Tiers (Early Bird & Last Minute)
// ============================================

export interface AdvanceBookingTier {
  minDays: number;
  discountPercentage: number;
}

export interface LastMinuteTier {
  maxDays: number;
  discountPercentage: number;
}

// ============================================
// Free Night Structure
// ============================================

export interface FreeNightStructure {
  stay: number; // Total nights to stay
  pay: number; // Number of nights to pay for
}

// ============================================
// Pricing Results
// ============================================

export interface PackagePricing {
  baseRoomRate: number;
  inclusionsValue: number;
  subtotal: number;
  packageDiscount: number;
  finalPrice: number;
  inclusions: PackageInclusionValue[];
  savingsVsStandard: number;
}

export interface FreeNightResult {
  totalNights: number;
  payingNights: number;
  freeNights: number;
  completeSets: number;
  remainingNights: number;
  qualifiesForPromotion: boolean;
}

export interface TimingDiscount {
  type: "early_bird" | "last_minute" | "standard";
  discountPercentage: number;
  daysInAdvance: number;
}

// ============================================
// Meal Plan Discounts
// ============================================

export interface MealPlanDiscounts {
  [key: string]: number; // {breakfast: 5, half_board: 10, full_board: 15}
}

// ============================================
// Hotel Deal Configuration
// ============================================

export interface HotelDealConfiguration {
  id: string;
  dealId: string;

  // Hotel Identification
  hotelChain?: string;
  hotelBrand?: string;
  hotelPropertyIds: string[];

  // Category Filters
  starRatings: number[];
  propertyTypes: PropertyType[];
  locationTypes: LocationType[];

  // Amenity Requirements
  requiredAmenities: string[];
  preferredAmenities: string[];

  // Room Type Mapping
  roomTypes: RoomType[];
  bedTypes: BedType[];

  // Meal Plans
  mealPlans: MealPlan[];
  mealPlanDiscounts: MealPlanDiscounts;

  // Package Configuration
  isPackageDeal: boolean;
  packageInclusions?: PackageInclusions;
  packageDiscountPercentage?: number;

  // Stay Requirements
  minNights: number;
  maxNights?: number;
  freeNightStructure?: FreeNightStructure;

  // Advance Booking
  advanceBookingTiers?: AdvanceBookingTier[];

  // Last Minute
  lastMinuteTiers?: LastMinuteTier[];

  // Cancellation Policy
  freeCancellationDays?: number;
  cancellationPenaltyPercentage?: number;

  // Allotment (for contracted rates)
  hasAllotment: boolean;
  allotmentRooms?: number;
  allotmentReleaseDays?: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Allotment Tracking
// ============================================

export interface HotelAllotmentTracking {
  id: string;
  dealConfigurationId: string;
  hotelPropertyId: string;

  checkInDate: Date;
  checkOutDate: Date;

  totalRooms: number;
  bookedRooms: number;
  availableRooms: number;

  releaseDate: Date;
  released: boolean;
  releasedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Allotment Reservation
// ============================================

export interface AllotmentReservation {
  allotmentId: string;
  roomsReserved: number;
  remainingRooms: number;
}

// ============================================
// Hotel Information (for matching)
// ============================================

export interface HotelInfo {
  propertyId: string;
  name: string;
  chain?: string;
  brand?: string;
  starRating: number;
  propertyType: PropertyType;
  locationType: LocationType;
  amenities: string[];
  roomTypes: RoomType[];
  bedTypes: BedType[];
  mealPlans: MealPlan[];
}

// ============================================
// Deal Categories Matching
// ============================================

export interface HotelCategoryMatch {
  matchType: "specific" | "category" | "none";
  matchedPropertyIds?: string[];
  matchScore?: number;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateContractedRateRequest {
  dealId: string;
  hotelChain?: string;
  hotelBrand?: string;
  hotelPropertyIds: string[];
  starRatings: number[];
  propertyTypes: PropertyType[];
  roomTypes: RoomType[];
  bedTypes: BedType[];
  freeCancellationDays?: number;
  cancellationPenaltyPercentage?: number;
  hasAllotment: boolean;
  allotmentRooms?: number;
  allotmentReleaseDays?: number;
}

export interface CreatePackageDealRequest {
  dealId: string;
  hotelPropertyIds: string[];
  starRatings: number[];
  propertyTypes: PropertyType[];
  packageInclusions: PackageInclusions;
  packageDiscountPercentage: number;
  minNights: number;
  maxNights?: number;
}

export interface CreateEarlyBirdDealRequest {
  dealId: string;
  hotelPropertyIds: string[];
  starRatings: number[];
  propertyTypes: PropertyType[];
  advanceBookingTiers: AdvanceBookingTier[];
  minNights?: number;
}

export interface CreateLastMinuteDealRequest {
  dealId: string;
  hotelPropertyIds: string[];
  starRatings: number[];
  propertyTypes: PropertyType[];
  lastMinuteTiers: LastMinuteTier[];
}

export interface CreateFreeNightsDealRequest {
  dealId: string;
  hotelPropertyIds: string[];
  starRatings: number[];
  propertyTypes: PropertyType[];
  freeNightStructure: FreeNightStructure;
  minNights: number;
}

export interface AllotmentCheckRequest {
  dealId: string;
  hotelPropertyId: string;
  checkInDate: Date;
  checkOutDate: Date;
  roomsNeeded: number;
}

export interface AllotmentReleaseRequest {
  dealId: string;
  hotelPropertyId: string;
  checkInDate: Date;
}

// ============================================
// Deal Response
// ============================================

export interface HotelDealResponse {
  id: string;
  dealId: string;
  dealType: HotelDealType;
  configuration: HotelDealConfiguration;
  status: "active" | "inactive" | "scheduled";
  validFrom: Date;
  validTo: Date;
}
