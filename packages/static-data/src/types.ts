/**
 * Type definitions for the centralized static data system
 */

// Core static data types
export interface Airport {
  iata_code: string;
  name: string;
  city: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  updated_at: string;
}

export interface Airline {
  iata_code: string;
  name: string;
  logo_url: string;
  is_active: boolean;
  updated_at: string;
}

export interface Aircraft {
  id: string;
  iata_code: string;
  name: string;
  is_active: boolean;
  updated_at: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  updated_at: string;
}

export interface LoyaltyProgram {
  name: string;
  code: string;
  airline_id: number;
  updated_at: string;
}

export interface City {
  name: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  timezone: string;
  is_popular: boolean;
  created_at: string;
  updated_at: string;
}

export interface Country {
  code: string;
  name: string;
  status: string;
  updated_at: string;
}

export interface Nationality {
  code: string;
  name: string;
  country: string;
  updated_at: string;
}

export interface HotelChain {
  name: string;
  code: string;
  website?: string;
  logo_url?: string;
  tier?: string;
  loyalty_program?: string;
  is_active?: boolean;
  updated_at: string;
}

/**
 * HotelAmenity - Unified amenity type for both hotel and room level
 * This consolidates the previous hotel_facilities and amenities concepts
 */
export interface HotelAmenity {
  code: string;
  name: string;
  category: string;
  icon?: string;
  /** Whether this amenity applies to 'hotel', 'room', or 'both' */
  applies_to: 'hotel' | 'room' | 'both';
  is_popular?: boolean;
  sort_order?: number;
  updated_at: string;
}

export interface HotelType {
  code?: string;
  name: string;
  description?: string;
  icon?: string;
  sort_order?: number;
  updated_at: string;
}

// Location types for autocomplete
export interface Location {
  id?: string;
  name: string;
  country?: string;
  country_code?: string;
  type: 'airport' | 'city';
  iata_code?: string;
  latitude?: number;
  longitude?: number;
}

// API response types
export interface StaticDataResponse<T> {
  data: T[];
  total: number;
  cached: boolean;
  source: string;
}

export interface SearchParams {
  query?: string;
  limit?: number;
  offset?: number;
  type?: string;
}

// Cache configuration
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of cached items
}

// Data source configuration
export interface DataSourceConfig {
  name: string;
  priority: number;
  endpoint?: string;
  enabled: boolean;
  timeout: number;
}

// Static data client configuration
export interface StaticDataConfig {
  apiBase: string;
  cache: CacheConfig;
  sources: DataSourceConfig[];
  fallbackEnabled: boolean;
}

// Notification types
export type NotificationType = 'SSR' | 'ITINERARY_CHANGE' | 'CONFIRMATION' | 'AMENDMENT' | 'SYSTEM';
export type NotificationStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'INFO' | 'CANCELLED';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  date: string;
  status: NotificationStatus;
  isRead: boolean;
  passengerName?: string;
  segment?: string;
  price?: number;
  currency?: string;
  remarks?: string;
}

// Error types
export class StaticDataError extends Error {
  constructor(
    message: string,
    public source: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'StaticDataError';
  }
}

// Cache key generator
export type CacheKey = string;

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  source: string;
}