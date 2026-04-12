/**
 * Consolidated formatting utilities
 * Replaces duplicate implementations across the codebase
 */

export { formatDate, formatDateTime, formatRelativeTime } from './date-utils';

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number, 
  currency = 'USD', 
  locale = 'en-US'
): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '';
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format number with optional options
 */
export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions
): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '';
  }
  
  const defaultOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  };
  
  return new Intl.NumberFormat('en-US', { 
    ...defaultOptions, 
    ...options 
  }).format(value);
}

/**
 * Format percentage
 */
export function formatPercent(
  value: number,
  decimals = 1
): string {
  return formatNumber(value * 100, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}