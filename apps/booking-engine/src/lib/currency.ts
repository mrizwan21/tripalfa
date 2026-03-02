/**
 * Currency utilities for automatic detection and conversion
 */

// Currency information
export const CURRENCY_INFO: Record<
  string,
  { symbol: string; name: string; decimalDigits: number }
> = {
  USD: { symbol: "$", name: "US Dollar", decimalDigits: 2 },
  EUR: { symbol: "€", name: "Euro", decimalDigits: 2 },
  GBP: { symbol: "£", name: "British Pound", decimalDigits: 2 },
  AED: { symbol: "د.إ", name: "UAE Dirham", decimalDigits: 2 },
  SAR: { symbol: "﷼", name: "Saudi Riyal", decimalDigits: 2 },
  INR: { symbol: "₹", name: "Indian Rupee", decimalDigits: 2 },
  JPY: { symbol: "¥", name: "Japanese Yen", decimalDigits: 0 },
  AUD: { symbol: "A$", name: "Australian Dollar", decimalDigits: 2 },
  CAD: { symbol: "C$", name: "Canadian Dollar", decimalDigits: 2 },
  CHF: { symbol: "CHF", name: "Swiss Franc", decimalDigits: 2 },
};

// Country to currency mapping based on IP location
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  US: "USD",
  GB: "GBP",
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  IT: "EUR",
  AE: "AED",
  SA: "SAR",
  IN: "INR",
  JP: "JPY",
  AU: "AUD",
  CA: "CAD",
  CH: "CHF",
};

// Default currency
export const DEFAULT_CURRENCY = "USD";

// Current state
let currentCurrency: string = DEFAULT_CURRENCY;
let exchangeRates: Record<string, number> = {};
let ratesLastUpdated: number = 0;
let isUpdatingRates: boolean = false;

/**
 * Get current currency
 */
export function getCurrentCurrency(): string {
  if (typeof window === "undefined") return DEFAULT_CURRENCY;

  return localStorage.getItem("currency") || DEFAULT_CURRENCY;
}

/**
 * Set current currency and update localStorage
 */
export function setCurrentCurrency(currency: string): void {
  if (typeof window === "undefined") return;

  localStorage.setItem("currency", currency);
  currentCurrency = currency;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_INFO[currency]?.symbol || currency;
}

/**
 * Get currency name
 */
export function getCurrencyName(currency: string): string {
  return CURRENCY_INFO[currency]?.name || currency;
}

/**
 * Get decimal digits for currency
 */
export function getCurrencyDecimalDigits(currency: string): number {
  return CURRENCY_INFO[currency]?.decimalDigits || 2;
}

/**
 * Detect user's currency based on IP location
 */
export async function detectUserCurrency(): Promise<string> {
  try {
    // Primary: Use ipapi.co (recommended service)
    try {
      const response = await fetch("https://ipapi.co/json/", {
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const countryCode = data.country_code;

        if (countryCode && COUNTRY_CURRENCY_MAP[countryCode]) {
          return COUNTRY_CURRENCY_MAP[countryCode];
        }
      }
    } catch (error) {
      console.warn("Currency detection service ipapi.co failed:", error);
    }

    // Fallback: Try additional IP detection services
    const fallbackServices = [
      "https://freegeoip.app/json/",
      "https://ipinfo.io/json",
    ];

    for (const service of fallbackServices) {
      try {
        const response = await fetch(service, {
          headers: {
            Accept: "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const countryCode =
            data.country || data.country_code || data.country_code_iso2;

          if (countryCode && COUNTRY_CURRENCY_MAP[countryCode]) {
            return COUNTRY_CURRENCY_MAP[countryCode];
          }
        }
      } catch (error) {
        console.warn(`Currency detection service ${service} failed:`, error);
      }
    }

    // Fallback to browser language detection
    const browserLang = navigator.language || (navigator as any).userLanguage;
    if (browserLang) {
      const langParts = browserLang.split("-");
      if (langParts.length > 1) {
        const country = langParts[1].toUpperCase();
        if (COUNTRY_CURRENCY_MAP[country]) {
          return COUNTRY_CURRENCY_MAP[country];
        }
      }
    }

    // Final fallback to default
    return DEFAULT_CURRENCY;
  } catch (error) {
    console.error("Currency detection failed:", error);
    return DEFAULT_CURRENCY;
  }
}

/**
 * Get exchange rates from API Gateway
 */
async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch("/api/exchange-rates/latest");
    if (response.ok) {
      const data = await response.json();
      const rawRates =
        data?.rates && typeof data.rates === "object" ? data.rates : {};
      const normalizedRates: Record<string, number> = {};

      for (const [code, value] of Object.entries(rawRates)) {
        const numericRate = Number(value);
        if (Number.isFinite(numericRate) && numericRate > 0) {
          normalizedRates[String(code).toUpperCase()] = numericRate;
        }
      }

      return normalizedRates;
    }

    // Return empty rates if API fails - no mock data
    console.warn("Failed to fetch exchange rates, returning empty rates");
    return {};
  } catch (error) {
    console.warn("Failed to fetch exchange rates:", error);
    return {};
  }
}

/**
 * Update exchange rates
 */
export async function updateExchangeRates(): Promise<void> {
  if (isUpdatingRates) return;

  isUpdatingRates = true;
  try {
    const rates = await fetchExchangeRates();
    if (Object.keys(rates).length > 0) {
      exchangeRates = rates;
      ratesLastUpdated = Date.now();
    }
  } finally {
    isUpdatingRates = false;
  }
}

/**
 * Get exchange rate from base currency to target currency
 */
export function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
): number {
  const normalizedFrom = String(fromCurrency || "").toUpperCase();
  const normalizedTo = String(toCurrency || "").toUpperCase();

  if (!normalizedFrom || !normalizedTo) return 0;
  if (normalizedFrom === normalizedTo) return 1.0;

  // Check if we have recent rates (less than 1 hour old)
  const now = Date.now();
  if (now - ratesLastUpdated > 3600000) {
    // 1 hour
    updateExchangeRates();
  }

  const fromRate = exchangeRates[normalizedFrom];
  const toRate = exchangeRates[normalizedTo];

  if (!fromRate || !toRate) {
    console.warn(
      `Missing exchange rates for ${normalizedFrom}/${normalizedTo}`,
    );
    return 0;
  }

  return toRate / fromRate;
}

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): number {
  const rate = getExchangeRate(fromCurrency, toCurrency);
  if (!Number.isFinite(rate) || rate <= 0) {
    return 0;
  }
  const decimalDigits = getCurrencyDecimalDigits(toCurrency);
  return Number((amount * rate).toFixed(decimalDigits));
}

/**
 * Format currency with symbol and proper decimals
 */
export function formatCurrency(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency);
  const decimalDigits = getCurrencyDecimalDigits(currency);
  const formattedAmount = amount.toFixed(decimalDigits);

  // Handle currencies that put symbol after amount
  const symbolAfter = ["د.إ", "€", "£"]; // AED, EUR, GBP
  if (symbolAfter.includes(symbol)) {
    return `${formattedAmount} ${symbol}`;
  } else {
    return `${symbol}${formattedAmount}`;
  }
}

/**
 * Format price for display with currency conversion
 */
export function formatPrice(
  amount: number,
  fromCurrency: string,
  toCurrency?: string,
): string {
  const targetCurrency = toCurrency || getCurrentCurrency();
  const convertedAmount = convertCurrency(amount, fromCurrency, targetCurrency);
  return formatCurrency(convertedAmount, targetCurrency);
}

/**
 * Currency hook for React components
 */
export function useCurrency() {
  const [currency, setCurrencyState] =
    React.useState<string>(getCurrentCurrency());
  const [rates, setRates] = React.useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] =
    React.useState<number>(ratesLastUpdated);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    const initCurrency = async () => {
      setIsLoading(true);
      try {
        // Try to detect user's currency
        const detectedCurrency = await detectUserCurrency();
        const savedCurrency = getCurrentCurrency();

        // Use detected currency if different from saved and not default
        if (
          detectedCurrency !== DEFAULT_CURRENCY &&
          detectedCurrency !== savedCurrency
        ) {
          setCurrentCurrency(detectedCurrency);
          setCurrencyState(detectedCurrency);
        } else {
          setCurrencyState(savedCurrency);
        }

        // Update exchange rates
        await updateExchangeRates();
        setRates(exchangeRates);
        setLastUpdated(ratesLastUpdated);
      } catch (error) {
        console.error("Currency initialization failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initCurrency();
  }, []);

  const setCurrency = React.useCallback(async (newCurrency: string) => {
    setCurrentCurrency(newCurrency);
    setCurrencyState(newCurrency);

    // Update user preferences
    try {
      await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currency: newCurrency }),
      });
    } catch (error) {
      console.error("Failed to save currency preference:", error);
    }
  }, []);

  const convert = React.useCallback(
    (amount: number, fromCurrency: string, toCurrency?: string) => {
      return convertCurrency(amount, fromCurrency, toCurrency || currency);
    },
    [currency],
  );

  const format = React.useCallback(
    (amount: number, fromCurrency: string, toCurrency?: string) => {
      return formatPrice(amount, fromCurrency, toCurrency);
    },
    [currency],
  );

  return {
    currency,
    setCurrency,
    convert,
    format,
    rates,
    lastUpdated,
    isLoading,
  };
}

// Make React available for the hook
import React from "react";
