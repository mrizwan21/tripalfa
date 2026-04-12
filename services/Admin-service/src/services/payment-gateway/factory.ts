/**
 * Payment Gateway Factory
 * Creates and manages payment gateway instances
 */

import { IPaymentGateway, PaymentGatewayConfig } from "./types.js";
import StripePaymentGateway from "./stripe.js";

class PaymentGatewayFactory {
  private static gateways: Map<string, IPaymentGateway> = new Map();

  /**
   * Get or create a payment gateway instance
   */
  static getGateway(config: PaymentGatewayConfig): IPaymentGateway {
    const key = this.getGatewayKey(config.provider, config.testMode);

    if (!this.gateways.has(key)) {
      const gateway = this.createGateway(config);
      this.gateways.set(key, gateway);
    }

    return this.gateways.get(key)!;
  }

  /**
   * Create a new gateway instance
   */
  private static createGateway(config: PaymentGatewayConfig): IPaymentGateway {
    switch (config.provider) {
      case "stripe":
        return new StripePaymentGateway(config);
      case "paypal":
        // PayPal implementation placeholder
        throw new Error("PayPal gateway not yet implemented");
      case "wise":
        // Wise (formerly TransferWise) implementation placeholder
        throw new Error("Wise gateway not yet implemented");
      default:
        throw new Error(`Unknown payment gateway: ${config.provider}`);
    }
  }

  /**
   * Get unique key for gateway instance
   */
  private static getGatewayKey(provider: string, testMode?: boolean): string {
    return `${provider}:${testMode ? "test" : "live"}`;
  }

  /**
   * Clear all cached gateways
   */
  static clearCache(): void {
    this.gateways.clear();
  }
}

export default PaymentGatewayFactory;
