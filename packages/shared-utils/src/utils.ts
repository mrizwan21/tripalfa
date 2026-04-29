import { clsx } from "clsx";

export function cn(...classes: Array<string | false | null | undefined>) {
  return clsx(classes);
}

export function formatCurrency(
  value: number,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(value);
}
