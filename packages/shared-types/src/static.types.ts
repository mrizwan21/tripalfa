// ── Airports ───────────────────────────────────────────────────
export interface Airport {
  iataCode: string;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isActive: boolean;
}

// ── Airlines ───────────────────────────────────────────────────
export interface Airline {
  iataCode: string;
  name: string;
  logoUrl: string | null;
  country: string | null;
  alliance: string | null;
  checkinUrl: string | null;
}

export interface AircraftType {
  iataCode: string;
  name: string;
  manufacturer: string | null;
  seatCountEconomy: number | null;
  seatCountBusiness: number | null;
  seatCountFirst: number | null;
}

export interface LoyaltyProgram {
  id: number;
  airlineId: string;
  programName: string;
}

// ── Geo ────────────────────────────────────────────────────────
export interface Country {
  code: string;
  name: string;
  dialCode: string | null;
  flagEmoji: string | null;
  isActive: boolean;
}

export interface State {
  id: number;
  countryCode: string;
  code: string;
  name: string;
}

// ── Financial ──────────────────────────────────────────────────
export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
}

// ── UI lookups ─────────────────────────────────────────────────
export interface Language {
  code: string;
  name: string;
  direction: "ltr" | "rtl";
  isActive: boolean;
}

export interface Salutation {
  code: string;
  label: string;
  displayOrder: number;
}

export interface Gender {
  code: string;
  label: string;
}

export interface CabinClass {
  code: string;
  name: string;
  displayOrder: number;
}

export interface MealPreference {
  code: string;
  label: string;
  description: string | null;
}

export interface SpecialAssistanceType {
  code: string;
  label: string;
  description: string | null;
}

export interface BoardBasisType {
  code: string;
  label: string;
}

export interface PropertyType {
  code: string;
  label: string;
}

export interface PaymentMethod {
  id: number;
  code: string;
  label: string;
  iconUrl: string | null;
  isActive: boolean;
  displayOrder: number;
}

export interface Amenity {
  id: number;
  name: string;
  icon: string | null;
  category: string | null;
  filterable: boolean;
  displayOrder: number;
}

// ── Hotels ─────────────────────────────────────────────────────
export interface HotelImage {
  id: number;
  hotelId: string;
  imageUrl: string;
  caption: string | null;
  category: string | null;
  isPrimary: boolean;
  displayOrder: number;
}

export interface HotelReview {
  id: number;
  hotelId: string;
  reviewerName: string | null;
  rating: number;
  comment: string | null;
  reviewDate: string;
}

export interface RoomBed {
  id: number;
  roomTypeId: number;
  bedType: string;
  bedCount: number;
}

export interface RoomType {
  id: number;
  hotelId: string;
  name: string;
  sizeSqm: number | null;
  maxAdults: number | null;
  maxChildren: number | null;
  images: { id: number; imageUrl: string }[];
  beds: RoomBed[];
  roomAmenities: { amenity: Amenity }[];
}

export interface HotelStaticDetail {
  id: string;
  name: string;
  starRating: number | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  country: string | null;
  checkinTime: string | null;
  checkoutTime: string | null;
  description: string | null;
  distanceFromCenter: number | null;
  neighbourhood: string | null;
  images: HotelImage[];
  hotelAmenities: { amenity: Amenity }[];
  policies: { id: number; policyType: string; description: string }[];
  nearbyPlaces: { id: number; name: string; distanceKm: number; category: string }[];
  roomTypes: RoomType[];
}

export interface HotelReviewsResponse {
  reviews: HotelReview[];
  total: number;
  page: number;
  pages: number;
  averageRating: number;
}

// ── Insurance ──────────────────────────────────────────────────
export interface InsuranceCoverageDetail {
  id: number;
  productId: number;
  coverageType: string;
  amount: number | null;
  description: string;
}

export interface InsuranceProduct {
  id: number;
  name: string;
  basePrice: number;
  currency: string;
  isActive: boolean;
  coverageDetails: InsuranceCoverageDetail[];
}

// ── Content ────────────────────────────────────────────────────
export interface PopularDestination {
  id: number;
  city: string;
  country: string;
  imageUrl: string;
  rank: number;
}

export interface Promotion {
  id: number;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

export interface PromoValidationResponse {
  valid: boolean;
  code?: string;
  discountType?: "PERCENTAGE" | "FIXED";
  discountValue?: number;
  discountAmount?: number;
  error?: string;
}

export interface LegalDocument {
  id: number;
  type: string;
  content: string | null;
  url: string | null;
  version: string;
  isActive: boolean;
}

export interface CancellationPolicy {
  id: number;
  type: string;
  description: string;
  penaltyPercentage: number | null;
  deadlineHours: number | null;
}
