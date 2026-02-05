export function formatCurrency(amount: number | string, currency = 'USD') {
  const value = typeof amount === 'string' ? parseFloat(amount as string) : (amount as number);
  if (Number.isNaN(value)) return String(amount);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch (e) {
    return `${currency} ${value}`;
  }
}

export function formatDate(value: string | number | Date) {
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
}
