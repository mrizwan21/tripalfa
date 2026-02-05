import { Plane, Building2, Package, Car, Bell } from 'lucide-react';

export const APP_NAME = 'Travel Kingdom';

// PRODUCTION MODE: Hybrid Routing Architecture
// Dynamic/External APIs → Wicked API Manager (localhost:8000)
// Static Data → Centralized Static Data Package (via @tripalfa/static-data)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Auth (via Wicked)
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_PROFILE: '/auth/profile',
  AUTH_LOGOUT: '/auth/logout',

  // Real-time Search (via Wicked API Gateway)
  SEARCH_FLIGHTS: '/search/flights',
  SEARCH_HOTELS: '/search/hotels',

  // Innstant Travel Live APIs
  INNSTANT_SEARCH_API: 'https://connect.mishor5.innstant-servers.com',
  INNSTANT_BOOKING_API: 'https://book.mishor5.innstant-servers.com',

  // Bookings
  BOOKINGS: '/bookings',
  BOOKING_DETAIL: (id: string) => `/bookings/${id}`,
  BOOKING_CREATE: '/bookings',
  FLIGHT_HOLD: '/bookings/flight/hold',
  FLIGHT_CONFIRM: '/bookings/flight/confirm',
  HOTEL_HOLD: '/bookings/hotel/hold',
  HOTEL_CONFIRM: '/bookings/hotel/confirm',

  // User
  USER_PROFILE: '/users/profile',
  USER_BOOKINGS: '/users/bookings',
  USER_PREFERENCES: '/users/preferences',

  // Wallet & Payments
  WALLET: '/wallet',
  WALLET_TOPUP: '/wallet/topup',
  WALLET_TRANSFER: '/wallet/transfer',
  PAYMENTS_CARD: '/payments/card',
};


export const NAV_LINKS = [
  { label: 'Flights', href: '/flights', icon: Plane },
  { label: 'Hotels', href: '/hotels', icon: Building2 },
  { label: 'Packages', href: '/packages', icon: Package }, // Placeholder
  { label: 'Transfers', href: '/transfers', icon: Car }, // Placeholder
  { label: 'Notifications', href: '/notifications', icon: Bell },
];

export const FLIGHT_CLASSES = [
  { value: 'ECONOMY', label: 'Economy' },
  { value: 'PREMIUM_ECONOMY', label: 'Premium Economy' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'FIRST', label: 'First Class' },
];
