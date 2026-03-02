import { api } from "./api";
import type {
  BrandingApiResponse,
  TenantBrandingConfig,
} from "@/types/branding";

const BRANDING_STORAGE_KEY = "branding_config";

const DEFAULT_BRANDING: Required<
  Pick<
    TenantBrandingConfig,
    | "primaryColor"
    | "primaryForeground"
    | "secondaryColor"
    | "secondaryForeground"
    | "accentColor"
    | "accentForeground"
    | "fontFamily"
    | "buttonRadius"
    | "inputRadius"
  >
> = {
  primaryColor: "229 66% 24%",
  primaryForeground: "0 0% 100%",
  secondaryColor: "9 82% 61%",
  secondaryForeground: "0 0% 100%",
  accentColor: "174 72% 51%",
  accentForeground: "229 66% 24%",
  fontFamily: "Inter, system-ui, sans-serif",
  buttonRadius: "0.75rem",
  inputRadius: "0.75rem",
};

function parseCachedBranding(): TenantBrandingConfig | null {
  try {
    const cached = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (parsed?.colors && typeof parsed.colors === "object") {
      return parsed.colors as TenantBrandingConfig;
    }
    if (typeof parsed === "object") {
      return parsed as TenantBrandingConfig;
    }
    return null;
  } catch {
    return null;
  }
}

export function normalizeBrandingConfig(
  config?: TenantBrandingConfig | null,
): TenantBrandingConfig {
  return {
    ...DEFAULT_BRANDING,
    ...config,
  };
}

export async function loadTenantBranding(): Promise<TenantBrandingConfig> {
  const cachedConfig = parseCachedBranding();

  try {
    const response = await api.get<BrandingApiResponse>("/branding/colors");
    const remoteConfig = response?.data;
    if (remoteConfig && typeof remoteConfig === "object") {
      const normalized = normalizeBrandingConfig(remoteConfig);
      localStorage.setItem(
        BRANDING_STORAGE_KEY,
        JSON.stringify({ colors: normalized }),
      );
      return normalized;
    }
  } catch {
    // Non-fatal: fallback to cached/default tokens.
  }

  return normalizeBrandingConfig(cachedConfig);
}

export function applyBrandingToRoot(config: TenantBrandingConfig): void {
  const root = document.documentElement;
  const normalized = normalizeBrandingConfig(config);
  const cssVarEntries: Array<[string, string]> = [
    ["--primary", normalized.primaryColor],
    ["--primary-foreground", normalized.primaryForeground],
    ["--secondary", normalized.secondaryColor],
    ["--secondary-foreground", normalized.secondaryForeground],
    ["--accent", normalized.accentColor],
    ["--accent-foreground", normalized.accentForeground],
    ["--font-sans", normalized.fontFamily],
    ["--ui-button-radius", normalized.buttonRadius],
    ["--ui-input-radius", normalized.inputRadius],
  ];

  cssVarEntries.forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
