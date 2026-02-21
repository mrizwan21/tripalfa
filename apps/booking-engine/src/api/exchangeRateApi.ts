/**
 * Exchange Rate API Client (Open Exchange Rates)
 * 
 * Provides currency exchange rates for flight/hotel bookings
 * - Real-time exchange rates
 * - Currency conversion
 * - Historical rates (if needed)
 */

import axios, { AxiosInstance } from 'axios';

// Currency code type
export type CurrencyCode = string;

// Exchange rate response
export interface ExchangeRatesResponse {
  disclaimer: string;
  license: string;
  timestamp: number;
  base: string;
  rates: Record<CurrencyCode, number>;
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
  'USD', 'EUR', 'GBP', 'AED', 'SAR', 'QAR', 'KWD', 'BHD',
  'JPY', 'CNY', 'INR', 'PKR', 'PHP', 'THB', 'SGD', 'MYR',
  'AUD', 'NZD', 'CAD', 'CHF', 'SEK', 'NOK', 'DKK',
];

// Currency symbols
export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
  SAR: '﷼',
  QAR: '﷼',
  KWD: 'د.ك',
  BHD: '.د.ب',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  PKR: '₨',
  PHP: '₱',
  THB: '฿',
  SGD: 'S$',
  MYR: 'RM',
  AUD: 'A$',
  NZD: 'NZ$',
  CAD: 'C$',
  CHF: 'CHF',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  ZAR: 'R',
  TRY: '₺',
  RUB: '₽',
  BRL: 'R$',
  MXN: '$',
  HKD: 'HK$',
  KRW: '₩',
  IDR: 'Rp',
  VND: '₫',
  EGP: 'E£',
  MAD: 'د.م.',
  TND: 'د.ت',
  JOD: 'د.ا',
  LBP: 'ل.ل',
  OMR: '﷼',
};

// Currency names
export const CURRENCY_NAMES: Record<CurrencyCode, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  AED: 'UAE Dirham',
  SAR: 'Saudi Riyal',
  QAR: 'Qatari Riyal',
  KWD: 'Kuwaiti Dinar',
  BHD: 'Bahraini Dinar',
  JPY: 'Japanese Yen',
  CNY: 'Chinese Yuan',
  INR: 'Indian Rupee',
  PKR: 'Pakistani Rupee',
  PHP: 'Philippine Peso',
  THB: 'Thai Baht',
  SGD: 'Singapore Dollar',
  MYR: 'Malaysian Ringgit',
  AUD: 'Australian Dollar',
  NZD: 'New Zealand Dollar',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
  SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone',
  DKK: 'Danish Krone',
  ZAR: 'South African Rand',
  TRY: 'Turkish Lira',
  RUB: 'Russian Ruble',
  BRL: 'Brazilian Real',
  MXN: 'Mexican Peso',
  HKD: 'Hong Kong Dollar',
  KRW: 'South Korean Won',
  IDR: 'Indonesian Rupiah',
  VND: 'Vietnamese Dong',
  EGP: 'Egyptian Pound',
  MAD: 'Moroccan Dirham',
  TND: 'Tunisian Dinar',
  JOD: 'Jordanian Dinar',
  LBP: 'Lebanese Pound',
  OMR: 'Omani Rial',
};

class ExchangeRateApi {
  private api: AxiosInstance;
  private apiKey: string;
  private baseURL = 'https://openexchangerates.org/api';
  private cache: { rates: ExchangeRatesResponse | null; timestamp: number } = {
    rates: null,
    timestamp: 0,
  };
  private cacheDuration = 60 * 60 * 1000; // 1 hour cache

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENEXCHANGE_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('OpenExchange API key not configured. Currency conversion features will use fallback rates.');
    }

    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get latest exchange rates
   * @param base - Base currency (default: USD)
   */
  async getLatestRates(base: CurrencyCode = 'USD'): Promise<ExchangeRatesResponse> {
    if (!this.apiKey) {
      // Return fallback rates if no API key
      return this.getFallbackRates(base);
    }

    // Check cache
    const now = Date.now();
    if (this.cache.rates && (now - this.cache.timestamp) < this.cacheDuration) {
      return this.cache.rates;
    }

    try {
      const response = await this.api.get<ExchangeRatesResponse>('/latest.json', {
        params: {
          app_id: this.apiKey,
          base,
        },
      });

      // Update cache
      this.cache = {
        rates: response.data,
        timestamp: now,
      };

      return response.data;
    } catch (error: any) {
      console.error('Exchange Rate API error:', error);
      // Return fallback rates on error
      return this.getFallbackRates(base);
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
    to: CurrencyCode
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
    const rates = await this.getLatestRates('USD');
    
    // Get rates for both currencies
    const fromRate = rates.rates[from] || 1;
    const toRate = rates.rates[to] || 1;
    
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
      timestamp: rates.timestamp * 1000,
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
    targets: CurrencyCode[]
  ): Promise<Record<CurrencyCode, number>> {
    const rates = await this.getLatestRates('USD');
    
    const baseRate = rates.rates[base] || 1;
    const result: Record<CurrencyCode, number> = {};
    
    for (const target of targets) {
      const targetRate = rates.rates[target] || 1;
      result[target] = Math.round((targetRate / baseRate) * 10000) / 10000;
    }
    
    return result;
  }

  /**
   * Fallback rates (approximate, for when API is unavailable)
   * These are approximate rates and should not be used for actual transactions
   */
  private getFallbackRates(base: CurrencyCode): ExchangeRatesResponse {
    // Approximate rates as of 2024 (for fallback only)
    const fallbackRates: Record<CurrencyCode, number> = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      AED: 3.67,
      SAR: 3.75,
      QAR: 3.64,
      KWD: 0.31,
      BHD: 0.38,
      JPY: 149.50,
      CNY: 7.24,
      INR: 83.12,
      PKR: 278.50,
      PHP: 56.20,
      THB: 35.80,
      SGD: 1.34,
      MYR: 4.72,
      AUD: 1.53,
      NZD: 1.64,
      CAD: 1.36,
      CHF: 0.88,
      SEK: 10.42,
      NOK: 10.68,
      DKK: 6.87,
      ZAR: 18.65,
      TRY: 32.15,
      RUB: 92.50,
      BRL: 4.97,
      MXN: 17.15,
      HKD: 7.82,
      KRW: 1325.50,
      IDR: 15650,
      VND: 24350,
      EGP: 30.90,
      MAD: 10.05,
      TND: 3.12,
      JOD: 0.71,
      LBP: 89500,
      OMR: 0.38,
    };

    return {
      disclaimer: 'Fallback rates - not for actual transactions',
      license: 'Fallback data',
      timestamp: Math.floor(Date.now() / 1000),
      base,
      rates: fallbackRates,
    };
  }

  /**
   * Format currency amount with symbol
   */
  formatCurrency(amount: number, currency: CurrencyCode): string {
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    
    return `${symbol}${formatted}`;
  }
}

// Export singleton instance
export const exchangeRateApi = new ExchangeRateApi();
