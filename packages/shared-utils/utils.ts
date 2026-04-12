// Admin Panel - Utility Functions
// @ts-ignore
import { clsx, type ClassValue } from 'clsx';
// @ts-ignore
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { DATE_FORMAT, DATE_TIME_FORMAT, DEFAULT_CURRENCY } from './constants';

// ============================================================================
// Class Name Utilities
// ============================================================================

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// ============================================================================
// Date Utilities
// ============================================================================

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, DATE_FORMAT);
}

function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, DATE_TIME_FORMAT);
}

function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(parsedDate, { addSuffix: true });
}

// ============================================================================
// Currency Utilities
// ============================================================================

export function formatCurrency(
  amount: number | null | undefined,
  currency: string = DEFAULT_CURRENCY,
  options?: Intl.NumberFormatOptions
): string {
  if (amount === null || amount === undefined) return '-';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

export function formatNumber(
  value: number | null | undefined,
  options?: Intl.NumberFormatOptions
): string {
  if (value === null || value === undefined) return '-';

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatPercent(value: number | null | undefined, decimals: number = 1): string {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(decimals)}%`;
}

// ============================================================================
// String Utilities
// ============================================================================

function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatEnumValue(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
}

// ============================================================================
// Status Badge Utilities
// ============================================================================

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

function getStatusBadgeVariant(status: string): BadgeVariant {
  const statusLower = status.toLowerCase();

  if (['active', 'confirmed', 'completed', 'ticketed', 'paid', 'approved'].includes(statusLower)) {
    return 'success';
  }
  if (['pending', 'processing', 'in_progress', 'on_hold'].includes(statusLower)) {
    return 'warning';
  }
  if (
    ['inactive', 'cancelled', 'failed', 'rejected', 'suspended', 'expired'].includes(statusLower)
  ) {
    return 'error';
  }
  if (['draft', 'new'].includes(statusLower)) {
    return 'info';
  }
  return 'neutral';
}

function getStatusBadgeClass(status: string): string {
  const variant = getStatusBadgeVariant(status);
  const variantClasses: Record<BadgeVariant, string> = {
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
    neutral: 'badge-neutral',
  };
  return variantClasses[variant];
}

// ============================================================================
// Validation Utilities
// ============================================================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Array Utilities
// ============================================================================

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (groups, item) => {
      const groupKey = String(item[key]);
      return {
        ...groups,
        [groupKey]: [...(groups[groupKey] || []), item],
      };
    },
    {} as Record<string, T[]>
  );
}

function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    const comparison = aVal < bVal ? -1 : 1;
    return order === 'asc' ? comparison : -comparison;
  });
}

// ============================================================================
// Object Utilities
// ============================================================================

function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
}

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach(key => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

// ============================================================================
// Query String Utilities
// ============================================================================

export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, String(v)));
      } else {
        searchParams.set(key, String(value));
      }
    }
  });

  return searchParams.toString();
}

function parseQueryString(search: string): Record<string, string | string[]> {
  const searchParams = new URLSearchParams(search);
  const result: Record<string, string | string[]> = {};

  searchParams.forEach((value, key) => {
    if (key in result) {
      const existing = result[key];
      result[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      result[key] = value;
    }
  });

  return result;
}

// ============================================================================
// File Utilities
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

// ============================================================================
// ID Utilities
// ============================================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// ============================================================================
// Debounce/Throttle
// ============================================================================

function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), wait);
  };
}

function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
// ============================================================================
// Cache Utilities
// ============================================================================

export interface CacheClient {
  get(key: string): Promise<string | null | undefined>;
  set(key: string, value: string, options?: { EX?: number }): Promise<string | null | undefined>;
}

/**
 * Wraps an async function with standard caching logic.
 * Standardizes TTL and serialization across microservices.
 */
async function withCache<T>(
  cache: CacheClient,
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  try {
    const cached = await cache.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
  } catch (err) {
    console.warn(`Cache fetch error for key ${key}:`, err);
  }

  const result = await fn();

  try {
    await cache.set(key, JSON.stringify(result), { EX: ttlSeconds });
  } catch (err) {
    console.warn(`Cache store error for key ${key}:`, err);
  }

  return result;
}
