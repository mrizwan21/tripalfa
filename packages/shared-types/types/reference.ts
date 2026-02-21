// ============================================================================
// TripAlfa Shared Types - Reference Data Domain
// Static reference data: Airlines, Airports, Cities, Currencies, Languages
// ============================================================================

import {
  AirportType,
  AirportSize,
  DocCategory,
  TextDirection,
  ExchangeRateSource,
  BufferType,
  BufferDirection,
} from './enums';

// ============================================================================
// Airline Types
// ============================================================================
export interface Airline {
  id: string;
  iataCode: string;
  icaoCode?: string;
  name: string;
  callsign?: string;
  country?: string;
  
  // Branding
  logo?: string;
  logoSmall?: string;
  primaryColor?: string;
  
  // Contact
  website?: string;
  phone?: string;
  
  // Alliance
  alliance?: string;
  
  // Operational
  isActive: boolean;
  isLowCost: boolean;
  
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AirlineCreate {
  iataCode: string;
  icaoCode?: string;
  name: string;
  callsign?: string;
  country?: string;
  logo?: string;
  logoSmall?: string;
  primaryColor?: string;
  website?: string;
  phone?: string;
  alliance?: string;
  isLowCost?: boolean;
  metadata?: Record<string, unknown>;
}

export interface AirlineUpdate {
  name?: string;
  icaoCode?: string;
  callsign?: string;
  country?: string;
  logo?: string;
  logoSmall?: string;
  primaryColor?: string;
  website?: string;
  phone?: string;
  alliance?: string;
  isActive?: boolean;
  isLowCost?: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Airport Types
// ============================================================================
export interface Airport {
  id: string;
  iataCode: string;
  icaoCode?: string;
  name: string;
  localName?: string;
  
  // Location
  cityId?: string;
  cityCode?: string;
  cityName?: string;
  country: string;
  countryName?: string;
  region?: string;
  
  // Coordinates
  latitude?: number;
  longitude?: number;
  elevation?: number;
  
  // Timezone
  timezone?: string;
  utcOffset?: number;
  
  // Type
  type: AirportType;
  size: AirportSize;
  
  isActive: boolean;
  
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AirportCreate {
  iataCode: string;
  icaoCode?: string;
  name: string;
  localName?: string;
  cityId?: string;
  cityCode?: string;
  cityName?: string;
  country: string;
  countryName?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  timezone?: string;
  utcOffset?: number;
  type?: AirportType;
  size?: AirportSize;
  metadata?: Record<string, unknown>;
}

export interface AirportUpdate {
  name?: string;
  icaoCode?: string;
  localName?: string;
  cityId?: string;
  cityCode?: string;
  cityName?: string;
  countryName?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  timezone?: string;
  utcOffset?: number;
  type?: AirportType;
  size?: AirportSize;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// City Types
// ============================================================================
export interface City {
  id: string;
  iataCode?: string;
  name: string;
  localName?: string;
  
  // Location
  country: string;
  countryName?: string;
  region?: string;
  state?: string;
  
  // Coordinates
  latitude?: number;
  longitude?: number;
  
  // Timezone
  timezone?: string;
  
  // Metadata
  population?: number;
  isCapital: boolean;
  isPopular: boolean;
  
  isActive: boolean;
  
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CityCreate {
  iataCode?: string;
  name: string;
  localName?: string;
  country: string;
  countryName?: string;
  region?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  population?: number;
  isCapital?: boolean;
  isPopular?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CityUpdate {
  name?: string;
  localName?: string;
  countryName?: string;
  region?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  population?: number;
  isCapital?: boolean;
  isPopular?: boolean;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Currency Types
// ============================================================================
export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  symbolNative?: string;
  decimalDigits: number;
  rounding: number;
  namePlural?: string;
  
  isActive: boolean;
  isBaseCurrency: boolean;
  
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CurrencyCreate {
  code: string;
  name: string;
  symbol: string;
  symbolNative?: string;
  decimalDigits?: number;
  rounding?: number;
  namePlural?: string;
  isBaseCurrency?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CurrencyUpdate {
  name?: string;
  symbol?: string;
  symbolNative?: string;
  decimalDigits?: number;
  rounding?: number;
  namePlural?: string;
  isActive?: boolean;
  isBaseCurrency?: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Exchange Rate Types
// ============================================================================
export interface ExchangeRate {
  id: string;
  fromCurrencyId: string;
  toCurrencyId: string;
  
  rate: number;
  inverseRate: number;
  
  source: ExchangeRateSource;
  sourceRef?: string;
  
  validFrom: string;
  validTo?: string;
  
  createdAt: string;
}

export interface ExchangeRateCreate {
  fromCurrencyId: string;
  toCurrencyId: string;
  rate: number;
  source?: ExchangeRateSource;
  sourceRef?: string;
  validFrom: string;
  validTo?: string;
}

export interface ExchangeRateBuffer {
  id: string;
  currencyId: string;
  companyId?: string;
  
  bufferType: BufferType;
  bufferValue: number;
  
  serviceTypes: string[];
  direction: BufferDirection;
  
  isActive: boolean;
  validFrom: string;
  validTo?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRateBufferCreate {
  currencyId: string;
  companyId?: string;
  bufferType: BufferType;
  bufferValue: number;
  serviceTypes?: string[];
  direction?: BufferDirection;
  validFrom: string;
  validTo?: string;
}

// ============================================================================
// Currency Conversion Types
// ============================================================================
export interface CurrencyConversion {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  serviceType?: string;
  companyId?: string;
}

export interface CurrencyConversionResult {
  fromCurrency: string;
  toCurrency: string;
  originalAmount: number;
  convertedAmount: number;
  rate: number;
  buffer?: number;
  effectiveRate: number;
  timestamp: string;
}

// ============================================================================
// Document Type Reference
// ============================================================================
export interface DocumentTypeRef {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: DocCategory;
  
  // Validation
  validationPattern?: string;
  requiredFields: string[];
  
  // Countries
  countries: string[];
  
  isActive: boolean;
  
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentTypeRefCreate {
  code: string;
  name: string;
  description?: string;
  category: DocCategory;
  validationPattern?: string;
  requiredFields?: string[];
  countries?: string[];
  metadata?: Record<string, unknown>;
}

export interface DocumentTypeRefUpdate {
  name?: string;
  description?: string;
  category?: DocCategory;
  validationPattern?: string;
  requiredFields?: string[];
  countries?: string[];
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Language Types
// ============================================================================
export interface Language {
  id: string;
  code: string;
  name: string;
  nativeName?: string;
  
  // Script
  script?: string;
  direction: TextDirection;
  
  // Regional
  country?: string;
  locale?: string;
  
  isActive: boolean;
  isDefault: boolean;
  
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface LanguageCreate {
  code: string;
  name: string;
  nativeName?: string;
  script?: string;
  direction?: TextDirection;
  country?: string;
  locale?: string;
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
}

export interface LanguageUpdate {
  name?: string;
  nativeName?: string;
  script?: string;
  direction?: TextDirection;
  country?: string;
  locale?: string;
  isActive?: boolean;
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Search/Autocomplete Types
// ============================================================================
export interface LocationSearchParams {
  query: string;
  types?: ('airport' | 'city' | 'country')[];
  country?: string;
  limit?: number;
}

export interface LocationSearchResult {
  type: 'airport' | 'city' | 'country';
  code: string;
  name: string;
  displayName: string;
  country: string;
  countryName?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  airports?: Airport[];
}

export interface AirlineSearchParams {
  query: string;
  country?: string;
  alliance?: string;
  limit?: number;
}

export interface AirlineSearchResult extends Airline {
  displayName: string;
}
