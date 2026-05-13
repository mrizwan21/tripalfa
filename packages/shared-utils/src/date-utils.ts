/**
 * Date formatting utilities
 */

export function formatDate(
  value: Date | string | number | null | undefined,
  locale: string = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return '';
  
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
}

export function formatDateTime(
  value: Date | string | number | null | undefined,
  locale: string = 'en-US',
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return '';
  
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };
  
  return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
}

export function formatTime(
  value: Date | string | number | null | undefined,
  locale: string = 'en-US'
): string {
  if (!value) return '';
  
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function isToday(date: Date | string | number): boolean {
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

export function differenceInDays(
  dateLeft: Date | string | number,
  dateRight: Date | string | number
): number {
  const left = new Date(dateLeft).getTime();
  const right = new Date(dateRight).getTime();
  return Math.floor((left - right) / (1000 * 60 * 60 * 24));
}