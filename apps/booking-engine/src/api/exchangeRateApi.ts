/**
 * Exchange Rate API Client
 *
 * Source of truth: backend endpoint `/api/exchange-rates/latest`
 * backed by static DB rates refreshed by hourly cron.
 */

// Currency code type
export type CurrencyCode = string;

// Exchange rate response
export interface ExchangeRatesResponse {
  success: boolean;
  timestamp: number;
  base: string;
  rates: Record<CurrencyCode, number>;
  source?: string;
  updatedAt?: string | null;
}

// Conversion result
export interface ConversionResult {
  from: CurrencyCode;
  to: CurrencyCode;
  amount: number;
  result: number;
  rate: number;
  timestamp: number;
}

// Popular currencies for travel
export const POPULAR_CURRENCIES: CurrencyCode[] = [
  "USD",
  "EUR",
  "GBP",
  "AED",
  "SAR",
  "QAR",
  "KWD",
  "BHD",
  "JPY",
  "CNY",
  "INR",
  "PKR",
  "PHP",
  "THB",
  "SGD",
  "MYR",
  "AUD",
  "NZD",
  "CAD",
  "CHF",
  "SEK",
  "NOK",
  "DKK",
];

// Currency symbols
export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  SAR: "﷼",
  QAR: "﷼",
  KWD: "د.ك",
  BHD: ".د.ب",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  PKR: "₨",
  PHP: "₱",
  THB: "฿",
  SGD: "S$",
  MYR: "RM",
  AUD: "A$",
  NZD: "NZ$",
  CAD: "C$",
  CHF: "CHF",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  ZAR: "R",
  TRY: "₺",
  RUB: "₽",
  BRL: "R$",
  MXN: "$",
  HKD: "HK$",
  KRW: "₩",
  IDR: "Rp",
  VND: "₫",
  EGP: "E£",
  MAD: "د.م.",
  TND: "د.ت",
  JOD: "د.ا",
  LBP: "ل.ل",
  OMR: "﷼",
};

// Currency names
export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  AED: "UAE Dirham",
  SAR: "Saudi Riyal",
  QAR: "Qatari Riyal",
  KWD: "Kuwaiti Dinar",
  BHD: "Bahraini Dinar",
  JPY: "Japanese Yen",
  CNY: "Chinese Yuan",
  INR: "Indian Rupee",
  PKR: "Pakistani Rupee",
  PHP: "Philippine Peso",
  THB: "Thai Baht",
  SGD: "Singapore Dollar",
  MYR: "Malaysian Ringgit",
  AUD: "Australian Dollar",
  NZD: "New Zealand Dollar",
  CAD: "Canadian Dollar",
  CHF: "Swiss Franc",
  SEK: "Swedish Krona",
  NOK: "Norwegian Krone",
  DKK: "Danish Krone",
  ZAR: "South African Rand",
  TRY: "Turkish Lira",
  RUB: "Russian Ruble",
  BRL: "Brazilian Real",
  MXN: "Mexican Peso",
  HKD: "Hong Kong Dollar",
  KRW: "South Korean Won",
  IDR: "Indonesian Rupiah",
  VND: "Vietnamese Dong",
  EGP: "Egyptian Pound",
  MAD: "Moroccan Dirham",
  TND: "Tunisian Dinar",
  JOD: "Jordanian Dinar",
  LBP: "Lebanese Pound",
  OMR: "Omani Rial",
};

class ExchangeRateApi {
  private cache: { rates: ExchangeRatesResponse | null; timestamp: number } = {
    rates: null,
    timestamp: 0,
  };
  private cacheDuration = 60 * 60 * 1000; // 1 hour cache

  /**
   * Get latest exchange rates
   * @param base - Base currency (default: USD)
   */
  async getLatestRates(
    base: CurrencyCode = "USD",
  ): Promise<ExchangeRatesResponse> {
    const normalizedBase = String(base || "USD").toUpperCase();

    // Check cache
    const now = Date.now();
    if (
      this.cache.rates &&
      this.cache.rates.base === normalizedBase &&
      now - this.cache.timestamp < this.cacheDuration
    ) {
      return this.cache.rates;
    }

    try {
      const response = await fetch(
        `/api/exchange-rates/latest?base=${encodeURIComponent(normalizedBase)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch exchange rates (${response.status})`);
      }

      const data = await response.json();

      if (!data?.rates || typeof data.rates !== "object") {
        throw new Error("Invalid exchange rates response");
      }

      const normalizedRates: Record<CurrencyCode, number> = {};
      for (const [code, rate] of Object.entries(data.rates)) {
        const numericRate = Number(rate);
        if (Number.isFinite(numericRate) && numericRate > 0) {
          normalizedRates[String(code).toUpperCase()] = numericRate;
        }
      }

      const payload: ExchangeRatesResponse = {
        success: true,
        timestamp: data.updatedAt ? Date.parse(data.updatedAt) || now : now,
        base: String(data.base || normalizedBase).toUpperCase(),
        rates: normalizedRates,
        source: data.source,
        updatedAt: data.updatedAt || null,
      };

      // Update cache
      this.cache = {
        rates: payload,
        timestamp: now,
      };

      return payload;
    } catch (error: any) {
      console.error("Exchange Rate API error:", error);

      // Return cached rates if available and base currency matches
      if (this.cache.rates && this.cache.rates.base === normalizedBase) {
        console.warn("Returning stale cached exchange rates due to API error");
        return this.cache.rates;
      }

      throw error;
    }
  }

  /**
   * Convert amount from one currency to another
   * @param amount - Amount to convert
   * @param from - Source currency
   * @param to - Target currency
   */
  async convert(
    amount: number,
    from: CurrencyCode,
    to: CurrencyCode,
  ): Promise<ConversionResult> {
    // If same currency, return as-is
    if (from === to) {
      return {
        from,
        to,
        amount,
        result: amount,
        rate: 1,
        timestamp: Date.now(),
      };
    }

    // Get rates (base is USD)
    const rates = await this.getLatestRates("USD");

    // Get rates for both currencies
    const fromRate = rates.rates[from];
    const toRate = rates.rates[to];

    if (!fromRate || !toRate) {
      throw new Error(`Missing exchange rate for ${from}/${to}`);
    }

    // Convert: amount -> USD -> target
    const usdAmount = amount / fromRate;
    const result = usdAmount * toRate;
    const rate = toRate / fromRate;

    return {
      from,
      to,
      amount,
      result: Math.round(result * 100) / 100, // Round to 2 decimal places
      rate: Math.round(rate * 10000) / 10000, // Round to 4 decimal places
      timestamp: rates.timestamp,
    };
  }

  /**
   * Get exchange rate between two currencies
   * @param from - Source currency
   * @param to - Target currency
   */
  async getRate(from: CurrencyCode, to: CurrencyCode): Promise<number> {
    const conversion = await this.convert(1, from, to);
    return conversion.rate;
  }

  /**
   * Get multiple exchange rates for a base currency
   * @param base - Base currency
   * @param targets - Target currencies
   */
  async getMultipleRates(
    base: CurrencyCode,
    targets: CurrencyCode[],
  ): Promise<Record<CurrencyCode, number>> {
    const rates = await this.getLatestRates("USD");
    const normalizedBase = String(base).toUpperCase();
    const baseRate = rates.rates[normalizedBase];
    if (!baseRate) {
      throw new Error(
        `Missing exchange rate for base currency: ${normalizedBase}`,
      );
    }
    const result: Record<CurrencyCode, number> = {};

    for (const target of targets) {
      const normalizedTarget = String(target).toUpperCase();
      const targetRate = rates.rates[normalizedTarget];
      if (!targetRate) {
        continue;
      }
      result[normalizedTarget] =
        Math.round((targetRate / baseRate) * 10000) / 10000;
    }

    return result;
  }

  /**
   * Format currency amount with symbol
   */
  formatCurrency(amount: number, currency: CurrencyCode): string {
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    return `${symbol}${formatted}`;
  }
}

// Export singleton instance
export const exchangeRateApi = new ExchangeRateApi();
