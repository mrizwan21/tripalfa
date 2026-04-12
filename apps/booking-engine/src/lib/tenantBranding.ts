import { api } from './api';
import type { BrandingApiResponse, TenantBrandingConfig } from '@/types/branding';

const BRANDING_STORAGE_KEY = 'branding_config';

const DEFAULT_BRANDING: Required<
  Pick<
    TenantBrandingConfig,
    | 'primaryColor'
    | 'primaryForeground'
    | 'secondaryColor'
    | 'secondaryForeground'
    | 'accentColor'
    | 'accentForeground'
    | 'fontFamily'
    | 'buttonRadius'
    | 'inputRadius'
  >
> = {
  primaryColor: '211 100% 50%',
  primaryForeground: '0 0% 100%',
  secondaryColor: '240 5% 96%',
  secondaryForeground: '240 6% 10%',
  accentColor: '211 100% 62%',
  accentForeground: '0 0% 100%',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  buttonRadius: '0.5rem',
  inputRadius: '0.5rem',
};

function parseCachedBranding(): TenantBrandingConfig | null {
  try {
    const cached = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached);
    if (parsed?.colors && typeof parsed.colors === 'object') {
      return parsed.colors as TenantBrandingConfig;
    }
    if (typeof parsed === 'object') {
      return parsed as TenantBrandingConfig;
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeBrandingConfig(config?: TenantBrandingConfig | null): TenantBrandingConfig {
  return {
    ...DEFAULT_BRANDING,
    ...config,
  };
}

export async function loadTenantBranding(): Promise<TenantBrandingConfig> {
  const cachedConfig = parseCachedBranding();

  try {
    const response = await api.get<BrandingApiResponse>('/branding/colors');
    const remoteConfig = response?.data;
    if (remoteConfig && typeof remoteConfig === 'object') {
      const normalized = normalizeBrandingConfig(remoteConfig);
      localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify({ colors: normalized }));
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
    ['--primary', normalized.primaryColor],
    ['--primary-foreground', normalized.primaryForeground],
    ['--secondary', normalized.secondaryColor],
    ['--secondary-foreground', normalized.secondaryForeground],
    ['--accent', normalized.accentColor],
    ['--accent-foreground', normalized.accentForeground],
    ['--font-sans', normalized.fontFamily],
    ['--ui-button-radius', normalized.buttonRadius],
    ['--ui-input-radius', normalized.inputRadius],
  ];

  cssVarEntries.forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
