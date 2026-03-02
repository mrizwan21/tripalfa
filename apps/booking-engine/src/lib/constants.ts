import { Plane, Building2, Package, Car, Bell, Gift } from "lucide-react";

export const APP_NAME = "Travel Kingdom";

// Dev: Use relative paths so Vite proxy intercepts requests (http://localhost:3000)
// Prod: Use full URL via VITE_API_BASE_URL environment variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const API_ENDPOINTS = {
  // Auth (via Wicked)
  AUTH_LOGIN: "/auth/login",
  AUTH_REGISTER: "/auth/register",
  AUTH_PROFILE: "/auth/profile",
  AUTH_LOGOUT: "/auth/logout",

  // Social OAuth Authentication
  AUTH_OAUTH: "/auth/oauth",
  AUTH_OAUTH_CALLBACK: "/auth/oauth/callback",
  AUTH_OAUTH_LINK: "/auth/oauth/link",
  AUTH_OAUTH_UNLINK: "/auth/oauth/unlink",
  AUTH_LINKED_ACCOUNTS: "/auth/linked-accounts",

  // Real-time Search (via Wicked API Gateway)
  SEARCH_FLIGHTS: "/search/flights",
  SEARCH_HOTELS: "/search/hotels",

  // Innstant Travel Live APIs
  INNSTANT_SEARCH_API: "https://connect.mishor5.innstant-servers.com",
  INNSTANT_BOOKING_API: "https://book.mishor5.innstant-servers.com",

  // Bookings
  BOOKINGS: "/bookings",
  BOOKING_DETAIL: (id: string) => `/bookings/${id}`,
  BOOKING_CREATE: "/bookings",
  FLIGHT_HOLD: "/bookings/flight/hold",
  FLIGHT_CONFIRM: "/bookings/flight/confirm",
  HOTEL_HOLD: "/bookings/hotel/hold",
  HOTEL_CONFIRM: "/bookings/hotel/confirm",

  // User
  USER_PROFILE: "/users/profile",
  USER_BOOKINGS: "/users/bookings",
  USER_PREFERENCES: "/users/preferences",

  // Wallet & Payments
  WALLET: "/wallet",
  WALLET_TOPUP: "/wallet/topup",
  WALLET_TRANSFER: "/wallet/transfer",
  PAYMENTS_CARD: "/payments/card",
};

export const NAV_LINKS = [
  { label: "Flights", href: "/flights", icon: Plane },
  { label: "Hotels", href: "/hotels", icon: Building2 },
  { label: "Packages", href: "/packages", icon: Package }, // Placeholder
  { label: "Transfers", href: "/transfers", icon: Car }, // Placeholder
  { label: "Loyalty", href: "/loyalty", icon: Gift },
  { label: "Alerts", href: "/alerts", icon: Bell },
];

export const FLIGHT_CLASSES = [
  { value: "ECONOMY", label: "Economy" },
  { value: "PREMIUM_ECONOMY", label: "Premium Economy" },
  { value: "BUSINESS", label: "Business" },
  { value: "FIRST", label: "First Class" },
];
