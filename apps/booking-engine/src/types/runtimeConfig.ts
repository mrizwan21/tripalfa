export type PaymentMethodId = "wallet" | "card" | "bank_transfer" | "upi";

export interface TenantFeatureFlags {
  walletEnabled: boolean;
  walletTopupEnabled: boolean;
  flightBookingEnabled: boolean;
  hotelBookingEnabled: boolean;
  seatSelectionEnabled: boolean;
  ancillariesEnabled: boolean;
}

export interface TenantPricingPolicy {
  markupPercent: number;
  markupFlat: number;
  commissionPercent: number;
  commissionFlat: number;
  commissionChargeableToCustomer: boolean;
}

export interface TenantCheckoutPolicy {
  defaultPaymentMethod: PaymentMethodId;
  allowedPaymentMethods: PaymentMethodId[];
  enforceSupplierWallet: boolean;
}

export interface TenantBrandingConfig {
  appName: string;
  logoUrl: string;
  defaultAvatarUrl: string;
  rtlEnabled: boolean;
}

export interface TenantRuntimeConfig {
  features: TenantFeatureFlags;
  pricing: TenantPricingPolicy;
  checkout: TenantCheckoutPolicy;
  branding: TenantBrandingConfig;
}

export interface PricingBreakdown {
  baseTotal: number;
  markupAmount: number;
  commissionAmount: number;
  finalTotal: number;
}

export interface RuntimeSettingsApiResponse {
  data?: Partial<TenantRuntimeConfig>;
  features?: Partial<TenantFeatureFlags>;
  pricing?: Partial<TenantPricingPolicy>;
  checkout?: Partial<TenantCheckoutPolicy>;
  branding?: Partial<TenantBrandingConfig>;
}
