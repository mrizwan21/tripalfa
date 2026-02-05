import { BookingData, BookingResponse, SearchParams, BookingStats, UserBookingStats } from './index';

/**
 * Type guards for runtime type checking
 */

// Type guard for BookingData
export function isBookingData(obj: any): obj is BookingData {
  return (
    obj &&
    typeof obj.userId === 'string' &&
    typeof obj.totalAmount === 'number' &&
    typeof obj.currency === 'string' &&
    typeof obj.bookingId === 'string' &&
    typeof obj.partnerId === 'string' &&
    typeof obj.productId === 'string' &&
    typeof obj.status === 'string'
  );
}

// Type guard for BookingResponse
export function isBookingResponse(obj: any): obj is BookingResponse {
  return (
    obj &&
    typeof obj.id === 'number' &&
    typeof obj.userId === 'string' &&
    typeof obj.totalAmount === 'number' &&
    typeof obj.currency === 'string' &&
    typeof obj.bookingId === 'string' &&
    typeof obj.partnerId === 'string' &&
    typeof obj.productId === 'string' &&
    typeof obj.status === 'string' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date &&
    typeof obj.tenantId === 'string' &&
    typeof obj.companyId === 'string'
  );
}

// Type guard for SearchParams
export function isSearchParams(obj: any): obj is SearchParams {
  return (
    obj &&
    (obj.status === undefined || typeof obj.status === 'string') &&
    (obj.type === undefined || typeof obj.type === 'string') &&
    (obj.startDate === undefined || typeof obj.startDate === 'string') &&
    (obj.endDate === undefined || typeof obj.endDate === 'string') &&
    (obj.userId === undefined || typeof obj.userId === 'string') &&
    (obj.bookingId === undefined || typeof obj.bookingId === 'string') &&
    (obj.partnerId === undefined || typeof obj.partnerId === 'string') &&
    (obj.productId === undefined || typeof obj.productId === 'string') &&
    (obj.page === undefined || typeof obj.page === 'number') &&
    (obj.limit === undefined || typeof obj.limit === 'number')
  );
}

// Type guard for BookingStats
export function isBookingStats(obj: any): obj is BookingStats {
  return (
    obj &&
    typeof obj.totalBookings === 'number' &&
    typeof obj.pendingBookings === 'number' &&
    typeof obj.confirmedBookings === 'number' &&
    typeof obj.cancelledBookings === 'number' &&
    typeof obj.totalAmount === 'number' &&
    typeof obj.currency === 'string'
  );
}

// Type guard for UserBookingStats
export function isUserBookingStats(obj: any): obj is UserBookingStats {
  return (
    obj &&
    typeof obj.userId === 'string' &&
    typeof obj.totalBookings === 'number' &&
    typeof obj.totalSpent === 'number' &&
    typeof obj.currency === 'string' &&
    (obj.lastBookingDate === null || obj.lastBookingDate instanceof Date) &&
    Array.isArray(obj.bookingHistory) &&
    obj.bookingHistory.every(isBookingResponse)
  );
}

// Type guard for API Response
export function isErrorResponse(obj: any): obj is { success: false; error: string; details?: any } {
  return obj && obj.success === false && typeof obj.error === 'string';
}

export function isSuccessResponse<T>(obj: any): obj is { success: true; data: T } {
  return obj && obj.success === true;
}

// Type guard for Express Request
export function isTypedRequest(obj: any): obj is Express.Request {
  return obj && typeof obj.body === 'object' && typeof obj.params === 'object';
}

// Type guard for Express Response
export function isTypedResponse(obj: any): obj is Express.Response {
  return obj && typeof obj.status === 'function' && typeof obj.json === 'function';
}

// Type guard for Error
export function isError(obj: any): obj is Error {
  return obj && typeof obj.message === 'string';
}

// Type guard for ValidationError
export function isValidationError(obj: any): obj is { name: 'ValidationError'; message: string; field?: string } {
  return obj && obj.name === 'ValidationError' && typeof obj.message === 'string';
}

// Type guard for NotFoundError
export function isNotFoundError(obj: any): obj is { name: 'NotFoundError'; message: string; resource?: string } {
  return obj && obj.name === 'NotFoundError' && typeof obj.message === 'string';
}

// Type guard for Date string
export function isDateString(str: any): str is string {
  return typeof str === 'string' && !isNaN(Date.parse(str));
}

// Type guard for Numeric string
export function isNumericString(str: any): str is string {
  return typeof str === 'string' && !isNaN(Number(str));
}

// Type guard for UUID
export function isUUID(str: any): str is string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof str === 'string' && uuidRegex.test(str);
}

// Type guard for Email
export function isEmail(str: any): str is string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof str === 'string' && emailRegex.test(str);
}

// Type guard for Currency code
export function isCurrencyCode(str: any): str is string {
  const currencyRegex = /^[A-Z]{3}$/;
  return typeof str === 'string' && currencyRegex.test(str);
}

// Type guard for Status
export function isStatus(str: any): str is string {
  const validStatuses = ['pending', 'confirmed', 'cancelled', 'refunded', 'failed'];
  return typeof str === 'string' && validStatuses.includes(str);
}

// Type guard for Role
export function isRole(str: any): str is string {
  const validRoles = ['admin', 'agent', 'supervisor', 'manager'];
  return typeof str === 'string' && validRoles.includes(str);
}

// Type guard for Permission
export function isPermission(str: any): str is string {
  const validPermissions = [
    'create_booking', 'search_bookings', 'view_bookings', 'update_booking',
    'cancel_booking', 'confirm_booking', 'issue_ticket', 'hold_inventory',
    'view_customers', 'create_customer', 'update_customer', 'delete_customer',
    'view_suppliers', 'create_supplier', 'update_supplier', 'delete_supplier',
    'manage_workflow', 'assign_booking', 'update_priority', 'view_inventory',
    'manage_inventory', 'add_inventory', 'update_inventory', 'delete_inventory',
    'manage_pricing', 'view_pricing', 'create_pricing_rule', 'update_pricing_rule',
    'delete_pricing_rule', 'manage_commissions', 'view_commissions',
    'create_commission_rule', 'update_commission_rule', 'delete_commission_rule',
    'manage_permissions', 'view_permissions', 'view_reports', 'generate_reports',
    'view_audit', 'view_compliance'
  ];
  return typeof str === 'string' && validPermissions.includes(str);
}

// Type guard for HTTP Method
export function isHttpMethod(str: any): str is 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' {
  const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
  return typeof str === 'string' && validMethods.includes(str.toUpperCase());
}

// Type guard for HTTP Status Code
export function isHttpStatusCode(num: any): num is number {
  return typeof num === 'number' && num >= 100 && num <= 599 && Number.isInteger(num);
}

// Type guard for Object
export function isObject(obj: any): obj is Record<string, any> {
  return obj && typeof obj === 'object' && obj.constructor === Object;
}

// Type guard for Array
export function isArray<T>(arr: any): arr is T[] {
  return Array.isArray(arr);
}

// Type guard for Non-empty Array
export function isNonEmptyArray<T>(arr: any): arr is T[] {
  return Array.isArray(arr) && arr.length > 0;
}

// Type guard for Non-null value
export function isNonNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

// Type guard for String
export function isString(str: any): str is string {
  return typeof str === 'string';
}

// Type guard for Number
export function isNumber(num: any): num is number {
  return typeof num === 'number' && !isNaN(num);
}

// Type guard for Boolean
export function isBoolean(bool: any): bool is boolean {
  return typeof bool === 'boolean';
}

// Type guard for Function
export function isFunction(fn: any): fn is Function {
  return typeof fn === 'function';
}