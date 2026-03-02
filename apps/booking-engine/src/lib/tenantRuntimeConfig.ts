import { api } from "@/lib/api";
import type {
  TenantBrandingConfig,
  PricingBreakdown,
  RuntimeSettingsApiResponse,
  TenantCheckoutPolicy,
  TenantFeatureFlags,
  TenantPricingPolicy,
  TenantRuntimeConfig,
} from "@/types/runtimeConfig";

const RUNTIME_CONFIG_STORAGE_KEY = "tenant_runtime_config";
const CONFIG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL for security

const DEFAULT_FEATURES: TenantFeatureFlags = {
  walletEnabled: true,
  walletTopupEnabled: true,
  flightBookingEnabled: true,
  hotelBookingEnabled: true,
  seatSelectionEnabled: true,
  ancillariesEnabled: true,
};

const DEFAULT_PRICING: TenantPricingPolicy = {
  markupPercent: 0,
  markupFlat: 0,
  commissionPercent: 0,
  commissionFlat: 0,
  commissionChargeableToCustomer: false,
};

const DEFAULT_CHECKOUT: TenantCheckoutPolicy = {
  defaultPaymentMethod: "wallet",
  allowedPaymentMethods: ["wallet"],
  enforceSupplierWallet: true,
};

const DEFAULT_BRANDING: TenantBrandingConfig = {
  appName: "TripAlfa",
  logoUrl: "/logo.png",
  defaultAvatarUrl: "",
  rtlEnabled: true,
};

export const DEFAULT_RUNTIME_CONFIG: TenantRuntimeConfig = {
  features: DEFAULT_FEATURES,
  pricing: DEFAULT_PRICING,
  checkout: DEFAULT_CHECKOUT,
  branding: DEFAULT_BRANDING,
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return fallback;
}

function dedupeMethods(
  methods: unknown,
): TenantCheckoutPolicy["allowedPaymentMethods"] {
  if (!Array.isArray(methods)) return DEFAULT_CHECKOUT.allowedPaymentMethods;
  const valid = methods.filter(
    (
      method,
    ): method is TenantCheckoutPolicy["allowedPaymentMethods"][number] => {
      return (
        method === "wallet" ||
        method === "card" ||
        method === "bank_transfer" ||
        method === "upi"
      );
    },
  );
  return valid.length > 0
    ? Array.from(new Set(valid))
    : DEFAULT_CHECKOUT.allowedPaymentMethods;
}

function toStringValue(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  return fallback;
}

function getStorage() {
  if (typeof window === "undefined") return null;
  // Use localStorage with TTL for better UX while maintaining security
  // Config persists across page refreshes but expires after TTL
  return window.localStorage;
}

interface CachedConfig {
  config: Partial<TenantRuntimeConfig>;
  timestamp: number;
}

function parseCachedRuntimeConfig(): Partial<TenantRuntimeConfig> | null {
  try {
    const storage = getStorage();
    if (!storage) return null;
    const cached = storage.getItem(RUNTIME_CONFIG_STORAGE_KEY);
    if (!cached) return null;
    const parsed: CachedConfig = JSON.parse(cached);
    if (!parsed || typeof parsed !== "object" || !parsed.config) return null;

    // Check TTL - reject expired cache to prevent stale config usage
    const now = Date.now();
    if (!parsed.timestamp || now - parsed.timestamp > CONFIG_CACHE_TTL_MS) {
      // Cache expired, clear it
      storage.removeItem(RUNTIME_CONFIG_STORAGE_KEY);
      return null;
    }

    return parsed.config;
  } catch {
    return null;
  }
}

function normalizeRuntimeConfig(
  input?: Partial<TenantRuntimeConfig> | null,
): TenantRuntimeConfig {
  const features = input?.features ?? DEFAULT_FEATURES;
  const pricing = input?.pricing ?? DEFAULT_PRICING;
  const checkout = input?.checkout ?? DEFAULT_CHECKOUT;
  const branding = input?.branding ?? DEFAULT_BRANDING;

  const defaultPaymentMethod =
    checkout.defaultPaymentMethod === "wallet" ||
    checkout.defaultPaymentMethod === "card" ||
    checkout.defaultPaymentMethod === "bank_transfer" ||
    checkout.defaultPaymentMethod === "upi"
      ? checkout.defaultPaymentMethod
      : DEFAULT_CHECKOUT.defaultPaymentMethod;

  return {
    features: {
      walletEnabled: toBoolean(
        features.walletEnabled,
        DEFAULT_FEATURES.walletEnabled,
      ),
      walletTopupEnabled: toBoolean(
        features.walletTopupEnabled,
        DEFAULT_FEATURES.walletTopupEnabled,
      ),
      flightBookingEnabled: toBoolean(
        features.flightBookingEnabled,
        DEFAULT_FEATURES.flightBookingEnabled,
      ),
      hotelBookingEnabled: toBoolean(
        features.hotelBookingEnabled,
        DEFAULT_FEATURES.hotelBookingEnabled,
      ),
      seatSelectionEnabled: toBoolean(
        features.seatSelectionEnabled,
        DEFAULT_FEATURES.seatSelectionEnabled,
      ),
      ancillariesEnabled: toBoolean(
        features.ancillariesEnabled,
        DEFAULT_FEATURES.ancillariesEnabled,
      ),
    },
    pricing: {
      markupPercent: toNumber(
        pricing.markupPercent,
        DEFAULT_PRICING.markupPercent,
      ),
      markupFlat: toNumber(pricing.markupFlat, DEFAULT_PRICING.markupFlat),
      commissionPercent: toNumber(
        pricing.commissionPercent,
        DEFAULT_PRICING.commissionPercent,
      ),
      commissionFlat: toNumber(
        pricing.commissionFlat,
        DEFAULT_PRICING.commissionFlat,
      ),
      commissionChargeableToCustomer: toBoolean(
        pricing.commissionChargeableToCustomer,
        DEFAULT_PRICING.commissionChargeableToCustomer,
      ),
    },
    checkout: {
      defaultPaymentMethod,
      allowedPaymentMethods: dedupeMethods(checkout.allowedPaymentMethods),
      enforceSupplierWallet: toBoolean(
        checkout.enforceSupplierWallet,
        DEFAULT_CHECKOUT.enforceSupplierWallet,
      ),
    },
    branding: {
      appName: toStringValue(branding.appName, DEFAULT_BRANDING.appName),
      logoUrl: toStringValue(branding.logoUrl, DEFAULT_BRANDING.logoUrl),
      defaultAvatarUrl: toStringValue(
        branding.defaultAvatarUrl,
        DEFAULT_BRANDING.defaultAvatarUrl,
      ),
      rtlEnabled: toBoolean(branding.rtlEnabled, DEFAULT_BRANDING.rtlEnabled),
    },
  };
}

function extractData<T = Record<string, unknown>>(value: unknown): T | null {
  if (!value || typeof value !== "object") return null;
  const maybeData = (value as { data?: unknown }).data;
  if (maybeData && typeof maybeData === "object") return maybeData as T;
  return value as T;
}

function pickActiveMarkupRule(
  rawRules: unknown,
): Record<string, unknown> | null {
  if (!Array.isArray(rawRules)) return null;

  const now = Date.now();
  const activeRules = rawRules
    .filter(
      (rule): rule is Record<string, unknown> =>
        !!rule && typeof rule === "object",
    )
    .filter((rule) => {
      if (rule.isActive === false) return false;
      const from = rule.validFrom
        ? Date.parse(String(rule.validFrom))
        : Number.NaN;
      const to = rule.validTo ? Date.parse(String(rule.validTo)) : Number.NaN;
      const afterStart = Number.isNaN(from) || now >= from;
      const beforeEnd = Number.isNaN(to) || now <= to;
      return afterStart && beforeEnd;
    })
    .sort((a, b) => toNumber(b.priority, 0) - toNumber(a.priority, 0));

  return activeRules[0] ?? null;
}

function parseMarkupPricing(
  markupResponse: unknown,
): Pick<TenantPricingPolicy, "markupPercent" | "markupFlat"> {
  const markupPayload = extractData(markupResponse) as {
    data?: unknown[];
  } | null;
  const markupRule = pickActiveMarkupRule(markupPayload?.data);

  if (!markupRule) {
    return {
      markupPercent: 0,
      markupFlat: 0,
    };
  }

  const type = String(markupRule.markupType ?? "").toUpperCase();
  const value = toNumber(markupRule.markupValue, 0);
  const isPercent = type.includes("PERCENT");

  return {
    markupPercent: isPercent ? value : 0,
    markupFlat: isPercent ? 0 : value,
  };
}

function parseCommissionPricing(
  commissionResponse: unknown,
): Pick<TenantPricingPolicy, "commissionPercent" | "commissionFlat"> {
  const commissionPayload = extractData(commissionResponse) as {
    data?: unknown[];
  } | null;
  const firstCommission = Array.isArray(commissionPayload?.data)
    ? (commissionPayload.data.find(
        (item) => !!item && typeof item === "object",
      ) as Record<string, unknown> | undefined)
    : undefined;

  return {
    commissionPercent: toNumber(
      firstCommission?.commissionPercent ??
        firstCommission?.commissionRate ??
        0,
      0,
    ),
    commissionFlat: toNumber(
      firstCommission?.commissionAmount ?? firstCommission?.amount ?? 0,
      0,
    ),
  };
}

function parsePricingFromAdminRules(
  markupResponse: unknown,
  commissionResponse: unknown,
): Partial<TenantRuntimeConfig> {
  const markupPricing = parseMarkupPricing(markupResponse);
  const commissionPricing = parseCommissionPricing(commissionResponse);

  return {
    pricing: {
      ...DEFAULT_PRICING,
      ...markupPricing,
      ...commissionPricing,
      commissionChargeableToCustomer: false,
    },
  };
}

export async function loadTenantRuntimeConfig(): Promise<TenantRuntimeConfig> {
  const cached = normalizeRuntimeConfig(parseCachedRuntimeConfig());
  const storage = getStorage();

  try {
    const settingsResponse =
      await api.get<RuntimeSettingsApiResponse>("/branding/settings");
    const normalizedSettings = normalizeRuntimeConfig({
      features: settingsResponse?.features,
      pricing: settingsResponse?.pricing as Partial<TenantPricingPolicy>,
      checkout: settingsResponse?.checkout,
      branding: settingsResponse?.branding,
      ...settingsResponse?.data,
    } as Partial<TenantRuntimeConfig>);
    if (storage) {
      const cacheEntry: CachedConfig = {
        config: normalizedSettings,
        timestamp: Date.now(),
      };
      storage.setItem(RUNTIME_CONFIG_STORAGE_KEY, JSON.stringify(cacheEntry));
    }
    return normalizedSettings;
  } catch {
    // Non-fatal. Fallback continues below.
  }

  try {
    const [markupResponse, commissionResponse] = await Promise.allSettled([
      api.get("/rules/markup?isActive=true&limit=100"),
      api.get("/rules/commissions?limit=50"),
    ]);

    const derivedConfig = parsePricingFromAdminRules(
      markupResponse.status === "fulfilled" ? markupResponse.value : null,
      commissionResponse.status === "fulfilled"
        ? commissionResponse.value
        : null,
    );

    const normalized = normalizeRuntimeConfig({
      ...cached,
      ...derivedConfig,
      pricing: {
        ...(cached.pricing ?? DEFAULT_PRICING),
        ...(derivedConfig.pricing ?? {}),
      },
    });

    if (storage) {
      const cacheEntry: CachedConfig = {
        config: normalized,
        timestamp: Date.now(),
      };
      storage.setItem(RUNTIME_CONFIG_STORAGE_KEY, JSON.stringify(cacheEntry));
    }
    return normalized;
  } catch {
    return cached;
  }
}

export function calculatePricingBreakdown(
  baseTotal: number,
  pricing: TenantPricingPolicy,
): PricingBreakdown {
  const safeBase = Number.isFinite(baseTotal) ? Math.max(baseTotal, 0) : 0;

  const markupAmount =
    safeBase * (Math.max(pricing.markupPercent, 0) / 100) +
    Math.max(pricing.markupFlat, 0);

  const commissionAmountRaw =
    safeBase * (Math.max(pricing.commissionPercent, 0) / 100) +
    Math.max(pricing.commissionFlat, 0);

  const commissionAmount = pricing.commissionChargeableToCustomer
    ? commissionAmountRaw
    : 0;
  const finalTotal = safeBase + markupAmount + commissionAmount;

  return {
    baseTotal: safeBase,
    markupAmount,
    commissionAmount,
    finalTotal,
  };
}
