// ============================================================================
// TripAlfa Shared Types - Utility Types
// Common interfaces, type helpers, and shared utilities
// ============================================================================

// ============================================================================
// ID Types (Branded/Nominal)
// ============================================================================
export type CompanyId = string & { readonly __brand: "CompanyId" };
export type UserId = string & { readonly __brand: "UserId" };
export type BookingId = string & { readonly __brand: "BookingId" };
export type SupplierId = string & { readonly __brand: "SupplierId" };
export type TransactionId = string & { readonly __brand: "TransactionId" };
export type WalletId = string & { readonly __brand: "WalletId" };
export type RoleId = string & { readonly __brand: "RoleId" };
export type PermissionId = string & { readonly __brand: "PermissionId" };

// ============================================================================
// JSON Types
// ============================================================================
export type JsonPrimitive = string | number | boolean | null;
export type JsonArray = JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

// ============================================================================
// Date/Time Types
// ============================================================================
export type ISODateString = string; // ISO 8601 format: YYYY-MM-DD
export type ISODateTimeString = string; // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
export type TimeString = string; // HH:mm:ss
export type TimezoneString = string; // IANA timezone: America/New_York

export interface DateRange {
  startDate: ISODateString;
  endDate: ISODateString;
}

export interface DateTimeRange {
  startDateTime: ISODateTimeString;
  endDateTime: ISODateTimeString;
}

// ============================================================================
// Money/Currency Types
// ============================================================================
export interface Money {
  amount: number;
  currency: string;
}

export interface MoneyWithRate {
  amount: number;
  currency: string;
  exchangeRate?: number;
  baseCurrencyAmount?: number;
  baseCurrency?: string;
}

export interface PriceBreakdown {
  basePrice: number;
  taxes: number;
  fees: number;
  markup?: number;
  discount?: number;
  total: number;
  currency: string;
}

// ============================================================================
// Contact Information
// ============================================================================
export interface ContactInfo {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
}

export interface AddressInfo {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  countryCode?: string;
}

export interface FullContactInfo extends ContactInfo {
  address?: AddressInfo;
  company?: string;
  jobTitle?: string;
}

// ============================================================================
// Geo Location Types
// ============================================================================
export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface GeoLocationWithAddress extends GeoLocation {
  address?: string;
  city?: string;
  country?: string;
}

// ============================================================================
// File Types
// ============================================================================
export interface FileInfo {
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

export interface ImageInfo extends FileInfo {
  width?: number;
  height?: number;
  thumbnailUrl?: string;
}

// ============================================================================
// Selection/Dropdown Types
// ============================================================================
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface TreeNode<T = unknown> {
  id: string;
  label: string;
  data?: T;
  children?: TreeNode<T>[];
  isExpanded?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
}

// ============================================================================
// Table/Grid Types
// ============================================================================
export interface SortConfig {
  field: string;
  direction: "asc" | "desc";
}

export interface FilterConfig {
  field: string;
  operator:
    | "eq"
    | "ne"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "contains"
    | "startsWith"
    | "endsWith"
    | "in"
    | "between";
  value: unknown;
}

export interface TableState {
  page: number;
  pageSize: number;
  sort?: SortConfig;
  filters?: FilterConfig[];
  search?: string;
  selectedIds?: string[];
}

// ============================================================================
// Form Types
// ============================================================================
export interface FormField<T = unknown> {
  name: string;
  value: T;
  error?: string;
  touched?: boolean;
  dirty?: boolean;
}

export interface FormState<T extends Record<string, unknown>> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

// ============================================================================
// Audit/Timestamp Types
// ============================================================================
export interface Timestamps {
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface SoftDelete {
  deletedAt?: ISODateTimeString;
  isDeleted?: boolean;
}

export interface AuditFields extends Timestamps {
  createdBy?: string;
  updatedBy?: string;
}

export interface FullAuditFields extends AuditFields, SoftDelete {
  deletedBy?: string;
}

// ============================================================================
// Status/State Types
// ============================================================================
export interface StatusInfo {
  status: string;
  statusText?: string;
  statusColor?:
    | "default"
    | "primary"
    | "success"
    | "warning"
    | "error"
    | "info";
}

export interface ProgressInfo {
  current: number;
  total: number;
  percentage: number;
  status?: "pending" | "in_progress" | "completed" | "failed";
}

// ============================================================================
// Async Operation Types
// ============================================================================
export type AsyncStatus = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  status: AsyncStatus;
  data?: T;
  error?: string;
  lastFetchedAt?: ISODateTimeString;
}

// ============================================================================
// Utility Type Helpers
// ============================================================================
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<
  T,
  Exclude<keyof T, Keys>
> &
  {
    [K in Keys]-?: Required<Pick<T, K>> &
      Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type PickByType<T, Type> = {
  [P in keyof T as T[P] extends Type ? P : never]: T[P];
};

export type OmitByType<T, Type> = {
  [P in keyof T as T[P] extends Type ? never : P]: T[P];
};

export type KeysOfType<T, Type> = {
  [K in keyof T]: T[K] extends Type ? K : never;
}[keyof T];

// ============================================================================
// Entity Base Types
// ============================================================================
export interface BaseEntity {
  id: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface TenantEntity extends BaseEntity {
  companyId: string;
}

export interface SoftDeleteEntity extends BaseEntity {
  deletedAt?: ISODateTimeString;
}

export interface VersionedEntity extends BaseEntity {
  version: number;
}

// ============================================================================
// Search/Filter Result Types
// ============================================================================
export interface FacetValue {
  value: string;
  count: number;
  label?: string;
}

export interface SearchFacet {
  field: string;
  label: string;
  values: FacetValue[];
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  facets?: SearchFacet[];
  query?: string;
  took?: number;
}

// ============================================================================
// Notification/Toast Types
// ============================================================================
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id?: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// Chart/Dashboard Types
// ============================================================================
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  timestamp: ISODateTimeString;
  value: number;
}

export interface MetricValue {
  current: number;
  previous?: number;
  change?: number;
  changePercentage?: number;
  trend?: "up" | "down" | "stable";
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: MetricValue;
  unit?: string;
  icon?: string;
}
