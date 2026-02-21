// Utility: cn (classNames)
// Simple utility to join class names conditionally
export function cn(...args: any[]): string {
  return args
    .flat(Infinity)
    .filter(Boolean)
    .join(' ');
}

// Utility: formatCurrency
export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
