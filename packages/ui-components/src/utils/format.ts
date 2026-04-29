/**
 * Formats a number as a currency string according to the Apple Design System typography standards.
 * @param amount The numerical amount to format
 * @param currency The currency code (default: USD)
 * @param locale The locale (default: en-US)
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
