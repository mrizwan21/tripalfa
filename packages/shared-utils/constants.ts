// Super Admin Panel - Constants
// Navigation, permissions, and configuration constants

import type { MenuItem, FilterOption } from './types';

// ============================================================================
// Navigation Menu
// ============================================================================

export const MAIN_MENU: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    href: '/dashboard',
  },
  {
    id: 'companies',
    label: 'Companies',
    icon: 'Building2',
    href: '/companies',
    permissions: ['companies.read'],
  },
  {
    id: 'users',
    label: 'Users',
    icon: 'Users',
    href: '/users',
    permissions: ['users.read'],
  },
  {
    id: 'roles',
    label: 'Roles & Permissions',
    icon: 'ShieldCheck',
    href: '/roles',
    permissions: ['roles.read'],
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: 'Plane',
    href: '/bookings',
    permissions: ['bookings.read'],
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    icon: 'Building2',
    href: '/suppliers',
    permissions: ['suppliers.read'],
  },
  {
    id: 'finance',
    label: 'Finance',
    icon: 'DollarSign',
    href: '/finance',
    permissions: ['finance.read'],
  },
  {
    id: 'rules',
    label: 'Rule Management',
    icon: 'ShieldCheck',
    href: '/rules',
    permissions: ['rules.read'],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'BarChart3',
    href: '/reports',
    permissions: ['reports.read'],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: 'Megaphone',
    href: '/marketing',
    permissions: ['marketing.read'],
  },
  {
    id: 'promotions',
    label: 'Promotions',
    icon: 'Award',
    href: '/promotions',
    permissions: ['marketing.read'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: 'Box',
    href: '/inventory',
    permissions: ['inventory.read'],
  },
  {
    id: 'tax',
    label: 'Tax Management',
    icon: 'Calculator',
    href: '/tax',
    permissions: ['finance.read'],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    href: '/settings',
    permissions: ['settings.read'],
  },
  {
    id: 'audit-logs',
    label: 'Audit Trail',
    icon: 'Shield',
    href: '/audit-logs',
    permissions: ['audit.read'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'Bell',
    href: '/notifications',
    permissions: ['notifications.read'],
  },
];


// ============================================================================
// Status Options
// ============================================================================

export const COMPANY_STATUS_OPTIONS: FilterOption[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Pending', value: 'PENDING' },
];

export const USER_STATUS_OPTIONS: FilterOption[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Pending Verification', value: 'PENDING_VERIFICATION' },
];

export const BOOKING_STATUS_OPTIONS: FilterOption[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Ticketed', value: 'TICKETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  { label: 'Refunded', value: 'REFUNDED' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Failed', value: 'FAILED' },
];

export const PAYMENT_STATUS_OPTIONS: FilterOption[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Failed', value: 'FAILED' },
  { label: 'Refunded', value: 'REFUNDED' },
  { label: 'Partially Refunded', value: 'PARTIALLY_REFUNDED' },
];

// ============================================================================
// Booking Segment Types
// ============================================================================

export const BOOKING_SEGMENT_TYPES: FilterOption[] = [
  { label: 'Flight', value: 'FLIGHT' },
  { label: 'Hotel', value: 'HOTEL' },
  { label: 'Car', value: 'CAR' },
  { label: 'Transfer', value: 'TRANSFER' },
  { label: 'Activity', value: 'ACTIVITY' },
  { label: 'Cruise', value: 'CRUISE' },
  { label: 'Insurance', value: 'INSURANCE' },
  { label: 'Visa', value: 'VISA' },
  { label: 'Package', value: 'PACKAGE' },
];

// ============================================================================
// Company Types
// ============================================================================

export const COMPANY_TYPE_OPTIONS: FilterOption[] = [
  { label: 'Travel Agency', value: 'TRAVEL_AGENCY' },
  { label: 'Tour Operator', value: 'TOUR_OPERATOR' },
  { label: 'OTA', value: 'OTA' },
  { label: 'Corporate', value: 'CORPORATE' },
  { label: 'Wholesaler', value: 'WHOLESALER' },
  { label: 'Consolidator', value: 'CONSOLIDATOR' },
  { label: 'DMC', value: 'DMC' },
  { label: 'Franchise', value: 'FRANCHISE' },
];

// ============================================================================
// API Configuration
// ============================================================================

export const API_BASE_URL = (typeof process !== 'undefined' ? process.env?.VITE_API_BASE_URL || process.env?.REACT_APP_API_BASE_URL : (import.meta as any).env?.VITE_API_BASE_URL) || '/api';

export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: '/v1/auth/login',
    logout: '/v1/auth/logout',
    refresh: '/v1/auth/refresh',
    me: '/v1/auth/me',
  },
  // Admin (Super Admin Panel endpoints)
  ADMIN: {
    COMPANIES: '/v1/admin/companies',
    USERS: '/v1/admin/users',
    ROLES: '/v1/admin/roles',
    PERMISSIONS: '/v1/admin/permissions',
    LANGUAGES: '/v1/admin/languages',
    CURRENCIES: '/v1/admin/currencies',
    REGIONS: '/v1/admin/regions',
    IP_WHITELIST: '/v1/admin/ip-whitelist',
    BRANDING: '/v1/admin/branding',
    STAFF: '/v1/admin/staff',
    AUDIT_LOGS: '/v1/admin/audit-logs',
  },
  // Lowercase alias for backward compatibility
  admin: {
    companies: '/v1/admin/companies',
    users: '/v1/admin/users',
    roles: '/v1/admin/roles',
    permissions: '/v1/admin/permissions',
    languages: '/v1/admin/languages',
    currencies: '/v1/admin/currencies',
    regions: '/v1/admin/regions',
    ipWhitelist: '/v1/admin/ip-whitelist',
    branding: '/v1/admin/branding',
    staff: '/v1/admin/staff',
    auditLogs: '/v1/admin/audit-logs',
  },
  // Companies
  companies: '/v1/partner/companies',
  branches: '/v1/partner/branches',
  // Users
  users: '/v1/partner/users',
  // Roles
  roles: '/v1/partner/roles',
  permissions: '/v1/partner/permissions',
  // Bookings
  bookings: '/v1/partner/bookings',
  bookingQueue: '/v1/partner/bookings/queue',
  // Suppliers
  suppliers: '/v1/partner/suppliers',
  contracts: '/v1/partner/contracts',
  apiVendors: '/v1/partner/api-vendors',
  apiVendorsList: '/v1/partner/api-vendors',
  // Finance
  wallets: '/v1/partner/wallet',
  transactions: '/v1/partner/transactions',
  invoices: '/v1/partner/invoices',
  commissions: '/v1/partner/commissions',
  // Pricing
  markup: '/v1/partner/markup',
  discounts: '/v1/partner/discounts',
  taxes: '/v1/partner/taxes',
  // Reports
  reports: '/v1/partner/reports',
  // Settings
  currenciesSettings: '/v1/partner/currencies',
  partnerAuditLogs: '/v1/partner/audit-logs',
  notifications: '/v1/partner/notifications',
  // Reference Data
  airlines: '/v1/partner/reference/airlines',
  airports: '/v1/partner/reference/airports',
  cities: '/v1/partner/reference/cities',
  // Audit Logs (Super Admin)
  auditLogs: {
    list: '/v1/admin/audit-logs',
    byId: (id: string) => `/v1/admin/audit-logs/${id}`,
    stats: '/v1/admin/audit-logs/stats',
    export: '/v1/admin/audit-logs/export',
    byUser: (userId: string) => `/v1/admin/audit-logs/user/${userId}`,
    suspicious: '/v1/admin/audit-logs/suspicious',
  },
};

// ============================================================================
// Pagination Defaults
// ============================================================================

export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ============================================================================
// Date Formats
// ============================================================================

export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATE_TIME_FORMAT = 'MMM dd, yyyy HH:mm';
export const TIME_FORMAT = 'HH:mm';
export const API_DATE_FORMAT = 'yyyy-MM-dd';

// ============================================================================
// Currency Defaults
// ============================================================================

export const DEFAULT_CURRENCY = 'USD';
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'INR', 'SGD', 'MYR'];
