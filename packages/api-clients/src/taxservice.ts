import axios from "axios";
import { getEnv } from "./env.js";
import { getErrorMessage } from "./utils.js";

export interface TaxCalculation {
  id: string;
  bookingId: string;
  baseAmount: number;
  taxAmount: number;
  taxRate: number;
  taxType: string;
  jurisdiction: string;
  breakdown: TaxBreakdown[];
  totalAmount: number;
  calculatedAt: string;
}

export interface TaxBreakdown {
  type: string;
  rate: number;
  amount: number;
  description: string;
}

export class TaxService {
  /**
   * Get base URL for tax service - uses lazy evaluation to support runtime config changes
   */
  private static get baseURL(): string {
    return getEnv("VITE_TAX_SERVICE_URL", "http://localhost:3011");
  }

  /**
   * Calculate taxes for a booking
   */
  static async calculateTaxes(
    bookingId: string,
    baseAmount: number,
    jurisdiction: string,
  ): Promise<TaxCalculation> {
    try {
      const response = await axios.post<TaxCalculation>(
        `${this.baseURL}/api/tax/calculate`,
        { bookingId, baseAmount, jurisdiction },
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to calculate taxes: ${message}`, { cause: error });
    }
  }

  /**
   * Get tax calculation by ID
   */
  static async getTaxCalculation(
    calculationId: string,
  ): Promise<TaxCalculation> {
    try {
      const response = await axios.get<TaxCalculation>(
        `${this.baseURL}/api/tax/calculations/${calculationId}`,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to get tax calculation: ${message}`, { cause: error });
    }
  }

  /**
   * Get tax calculations for a booking
   */
  static async getTaxCalculationsByBooking(
    bookingId: string,
  ): Promise<TaxCalculation[]> {
    try {
      const response = await axios.get<TaxCalculation[]>(
        `${this.baseURL}/api/tax/calculations/booking/${bookingId}`,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to get tax calculations for booking: ${message}`, { cause: error });
    }
  }

  /**
   * Get tax rates for jurisdiction
   */
  static async getTaxRates(jurisdiction: string): Promise<TaxBreakdown[]> {
    try {
      const response = await axios.get<TaxBreakdown[]>(
        `${this.baseURL}/api/tax/rates/${jurisdiction}`,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to get tax rates: ${message}`, { cause: error });
    }
  }
}

export default TaxService;
