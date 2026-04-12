import axios from "axios";

// Types for Currency Management
export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  exchangeRate: number | null;
  bufferPercentage: number | null;
  decimalPrecision: number;
  roundingMode: RoundingMode;
  isBaseCurrency: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RoundingMode =
  | "HALF_UP"
  | "HALF_DOWN"
  | "BANKERS"
  | "HALF_ODD"
  | "DOWN"
  | "UP"
  | "CEILING"
  | "FLOOR";

export interface CurrencySettings {
  bufferPercentage: number | null;
  decimalPrecision: number;
  roundingMode: RoundingMode;
  isBaseCurrency: boolean;
  isActive: boolean;
}

export interface UpdateCurrencyRequest {
  id: string;
  bufferPercentage?: number | null;
  decimalPrecision?: number;
  roundingMode?: RoundingMode;
  isBaseCurrency?: boolean;
  isActive?: boolean;
}

export interface CurrencyConversionResult {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  baseRate: number;
  bufferPercentage: number;
  effectiveRate: number;
  convertedAmount: number;
  roundedAmount: number;
}

// API Base URL - would typically come from environment
const API_BASE_URL = "/api/v1";
const ENABLE_MOCK_CURRENCY_FALLBACK =
  import.meta.env.DEV &&
  import.meta.env.VITE_ENABLE_B2B_ADMIN_MOCK_FALLBACK === "true";

class CurrencyService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });

  private handleCurrencyError(error: unknown, context: string): never {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${context}: ${message}`);
  }

  /**
   * Get all currencies with their settings
   */
  async getCurrencies(): Promise<Currency[]> {
    try {
      const response = await this.api.get<Currency[]>("/currencies");
      return response.data;
    } catch (error) {
      console.error("Error fetching currencies:", error);
      if (ENABLE_MOCK_CURRENCY_FALLBACK) {
        return this.getMockCurrencies();
      }
      this.handleCurrencyError(error, "Failed to fetch currencies");
    }
  }

  /**
   * Get a single currency by ID
   */
  async getCurrency(id: string): Promise<Currency | null> {
    try {
      const response = await this.api.get<Currency>(`/currencies/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching currency:", error);
      return null;
    }
  }

  /**
   * Update currency settings
   */
  async updateCurrencySettings(
    request: UpdateCurrencyRequest,
  ): Promise<Currency> {
    const response = await this.api.patch<Currency>(
      `/currencies/${request.id}`,
      {
        bufferPercentage: request.bufferPercentage,
        decimalPrecision: request.decimalPrecision,
        roundingMode: request.roundingMode,
        isBaseCurrency: request.isBaseCurrency,
        isActive: request.isActive,
      },
    );
    return response.data;
  }

  /**
   * Set a currency as the base currency (only one can be base)
   */
  async setBaseCurrency(id: string): Promise<Currency> {
    const response = await this.api.patch<Currency>(
      `/currencies/${id}/set-base`,
    );
    return response.data;
  }

  /**
   * Convert amount from one currency to another with buffer applied
   */
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): Promise<CurrencyConversionResult> {
    try {
      const response = await this.api.post<CurrencyConversionResult>(
        "/currencies/convert",
        {
          amount,
          fromCurrency,
          toCurrency,
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error converting currency:", error);
      if (ENABLE_MOCK_CURRENCY_FALLBACK) {
        return this.calculateConversion(amount, fromCurrency, toCurrency);
      }
      this.handleCurrencyError(error, "Failed to convert currency");
    }
  }

  /**
   * Manually update exchange rate for a currency
   */
  async updateExchangeRate(id: string, rate: number): Promise<Currency> {
    const response = await this.api.patch<Currency>(`/currencies/${id}/rate`, {
      exchangeRate: rate,
    });
    return response.data;
  }

  /**
   * Refresh exchange rates from OpenExchange API
   */
  async refreshExchangeRates(): Promise<{
    success: boolean;
    updatedCount: number;
  }> {
    try {
      const response = await this.api.post<{
        success: boolean;
        updatedCount: number;
      }>("/currencies/refresh-rates");
      return response.data;
    } catch (error) {
      console.error("Error refreshing exchange rates:", error);
      return { success: false, updatedCount: 0 };
    }
  }

  /**
   * Get available rounding modes
   */
  getRoundingModes(): {
    value: RoundingMode;
    label: string;
    description: string;
  }[] {
    return [
      {
        value: "HALF_UP",
        label: "Half Up (Standard)",
        description: "Rounds 0.5 up (2.5 → 3)",
      },
      {
        value: "HALF_DOWN",
        label: "Half Down",
        description: "Rounds 0.5 down (2.5 → 2)",
      },
      {
        value: "BANKERS",
        label: "Banker's Rounding",
        description: "Rounds to nearest even (2.5 → 2, 3.5 → 4)",
      },
      {
        value: "HALF_ODD",
        label: "Half Odd",
        description: "Rounds to nearest odd number",
      },
      {
        value: "DOWN",
        label: "Round Down",
        description: "Always rounds towards zero",
      },
      {
        value: "UP",
        label: "Round Up",
        description: "Always rounds away from zero",
      },
      { value: "CEILING", label: "Ceiling", description: "Always rounds up" },
      { value: "FLOOR", label: "Floor", description: "Always rounds down" },
    ];
  }

  /**
   * Calculate effective rate with buffer
   */
  calculateEffectiveRate(
    baseRate: number,
    bufferPercentage: number | null,
  ): number {
    if (!bufferPercentage || bufferPercentage === 0) {
      return baseRate;
    }
    return baseRate * (1 + bufferPercentage / 100);
  }

  /**
   * Round amount according to currency settings
   */
  roundAmount(
    amount: number,
    roundingMode: RoundingMode,
    decimalPlaces: number,
  ): number {
    const multiplier = Math.pow(10, decimalPlaces);
    let rounded: number;

    switch (roundingMode) {
      case "HALF_UP":
        rounded = Math.round(amount * multiplier) / multiplier;
        break;
      case "HALF_DOWN":
        rounded = Math.floor(amount * multiplier + 0.5) / multiplier;
        if (this.isHalfWay(amount, decimalPlaces)) {
          rounded -= 1 / multiplier;
        }
        break;
      case "BANKERS":
        rounded = this.bankersRound(amount, decimalPlaces);
        break;
      case "HALF_ODD":
        rounded = this.halfOddRound(amount, decimalPlaces);
        break;
      case "DOWN":
        rounded = Math.trunc(amount * multiplier) / multiplier;
        break;
      case "UP":
        rounded = Math.ceil(amount * multiplier) / multiplier;
        break;
      case "CEILING":
        rounded = Math.ceil(amount * multiplier) / multiplier;
        break;
      case "FLOOR":
        rounded = Math.floor(amount * multiplier) / multiplier;
        break;
      default:
        rounded = Math.round(amount * multiplier) / multiplier;
    }

    return rounded;
  }

  private isHalfWay(value: number, decimalPlaces: number): boolean {
    const multiplier = Math.pow(10, decimalPlaces);
    const scaled = value * multiplier;
    return scaled % 1 === 0.5;
  }

  private bankersRound(value: number, decimalPlaces: number): number {
    const multiplier = Math.pow(10, decimalPlaces);
    const scaled = value * multiplier;
    const floor = Math.floor(scaled);
    const ceil = Math.ceil(scaled);

    if (floor % 2 === 0 && scaled - floor === 0.5) {
      return floor / multiplier;
    }
    if (ceil % 2 === 0 && ceil - scaled === 0.5) {
      return ceil / multiplier;
    }
    return Math.round(scaled) / multiplier;
  }

  private halfOddRound(value: number, decimalPlaces: number): number {
    const multiplier = Math.pow(10, decimalPlaces);
    const scaled = value * multiplier;
    const rounded = Math.round(scaled);

    if (Math.abs(scaled - rounded) === 0.5) {
      return (rounded % 2 === 1 ? rounded : rounded - 1) / multiplier;
    }
    return rounded / multiplier;
  }

  private calculateConversion(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
  ): CurrencyConversionResult {
    // Mock calculation - in production would come from API
    const rates: Record<string, number> = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      AED: 3.67,
      INR: 83.12,
    };

    const buffers: Record<string, number> = {
      USD: 0,
      EUR: 2,
      GBP: 1.5,
      AED: 0,
      INR: 1,
    };

    const baseRate = (rates[toCurrency] || 1) / (rates[fromCurrency] || 1);
    const bufferPercentage = buffers[toCurrency] || 0;
    const effectiveRate = this.calculateEffectiveRate(
      baseRate,
      bufferPercentage,
    );
    const convertedAmount = amount * effectiveRate;
    const roundedAmount = this.roundAmount(convertedAmount, "HALF_UP", 2);

    return {
      fromCurrency,
      toCurrency,
      amount,
      baseRate,
      bufferPercentage,
      effectiveRate,
      convertedAmount,
      roundedAmount,
    };
  }

  private getMockCurrencies(): Currency[] {
    return [
      {
        id: "1",
        code: "USD",
        name: "US Dollar",
        symbol: "$",
        exchangeRate: 1,
        bufferPercentage: 0,
        decimalPrecision: 2,
        roundingMode: "HALF_UP",
        isBaseCurrency: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "2",
        code: "EUR",
        name: "Euro",
        symbol: "€",
        exchangeRate: 0.92,
        bufferPercentage: 2,
        decimalPrecision: 2,
        roundingMode: "HALF_UP",
        isBaseCurrency: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "3",
        code: "GBP",
        name: "British Pound",
        symbol: "£",
        exchangeRate: 0.79,
        bufferPercentage: 1.5,
        decimalPrecision: 2,
        roundingMode: "HALF_UP",
        isBaseCurrency: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "4",
        code: "AED",
        name: "UAE Dirham",
        symbol: "د.إ",
        exchangeRate: 3.67,
        bufferPercentage: 0,
        decimalPrecision: 2,
        roundingMode: "HALF_UP",
        isBaseCurrency: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "5",
        code: "INR",
        name: "Indian Rupee",
        symbol: "₹",
        exchangeRate: 83.12,
        bufferPercentage: 1,
        decimalPrecision: 2,
        roundingMode: "HALF_UP",
        isBaseCurrency: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "6",
        code: "JPY",
        name: "Japanese Yen",
        symbol: "¥",
        exchangeRate: 149.5,
        bufferPercentage: 0,
        decimalPrecision: 0,
        roundingMode: "HALF_UP",
        isBaseCurrency: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
}

const currencyService = new CurrencyService();
export default currencyService;
