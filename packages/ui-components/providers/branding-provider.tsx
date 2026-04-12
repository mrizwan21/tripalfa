/**
 * Branding Provider - Whitelabel Support
 *
 * This provider enables dynamic branding by accepting configuration from
 * the Marketing service and applying it as CSS variables.
 *
 * Usage:
 * <BrandingProvider config={brandingConfig}>
 *   <App />
 * </BrandingProvider>
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

/**
 * Branding configuration from Marketing service
 */
export interface BrandingColors {
  primary?: string; // HSL values e.g., "221.2 83.2% 53.3%"
  primaryForeground?: string;
  secondary?: string;
  secondaryForeground?: string;
  accent?: string;
  accentForeground?: string;
}

export interface BrandingConfig {
  colors?: BrandingColors;
  logo?: string;
  favicon?: string;
  companyName?: string;
}

interface BrandingContextType {
  branding: BrandingConfig;
  isLoading: boolean;
  setBranding: (config: BrandingConfig) => void;
  updateColors: (colors: BrandingColors) => void;
}

const defaultBranding: BrandingConfig = {
  colors: {
    primary: '211 100% 50%',
    primaryForeground: '0 0% 100%',
    secondary: '240 5% 96%',
    secondaryForeground: '240 6% 10%',
    accent: '211 100% 62%',
    accentForeground: '0 0% 100%',
  },
};

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

interface BrandingProviderProps {
  children: ReactNode;
  config?: BrandingConfig;
  autoLoad?: boolean;
}

/**
 * Apply branding colors as CSS variables on the root element
 */
const applyBrandingColors = (colors: BrandingColors): void => {
  const root = document.documentElement;

  if (colors.primary) {
    root.style.setProperty('--brand-primary', colors.primary);
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--ring', colors.primary);
  }
  if (colors.primaryForeground) {
    root.style.setProperty('--brand-primary-foreground', colors.primaryForeground);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
  }
  if (colors.secondary) {
    root.style.setProperty('--brand-secondary', colors.secondary);
    root.style.setProperty('--secondary', colors.secondary);
  }
  if (colors.secondaryForeground) {
    root.style.setProperty('--brand-secondary-foreground', colors.secondaryForeground);
    root.style.setProperty('--secondary-foreground', colors.secondaryForeground);
  }
  if (colors.accent) {
    root.style.setProperty('--brand-accent', colors.accent);
    root.style.setProperty('--accent', colors.accent);
  }
  if (colors.accentForeground) {
    root.style.setProperty('--brand-accent-foreground', colors.accentForeground);
    root.style.setProperty('--accent-foreground', colors.accentForeground);
  }
};

/**
 * Branding Provider Component
 *
 * Wraps the application and provides branding configuration.
 * When config is provided, it applies the colors as CSS variables.
 */
export function BrandingProvider({ children, config, autoLoad = true }: BrandingProviderProps) {
  const [branding, setBrandingState] = useState<BrandingConfig>(config || defaultBranding);
  const [isLoading, setIsLoading] = useState(false);

  // Apply branding colors when they change
  useEffect(() => {
    if (branding.colors) {
      applyBrandingColors(branding.colors);
    }
  }, [branding.colors]);

  // Auto-load branding from localStorage or API (if enabled)
  useEffect(() => {
    if (!autoLoad) return;

    const loadSavedBranding = () => {
      try {
        const saved = localStorage.getItem('branding_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          setBrandingState(parsed);
        }
      } catch (error) {
        console.warn('Failed to load saved branding:', error);
      }
    };

    loadSavedBranding();
  }, [autoLoad]);

  // Save branding to localStorage when it changes
  const setBranding = (config: BrandingConfig) => {
    setBrandingState(config);
    try {
      localStorage.setItem('branding_config', JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save branding:', error);
    }
  };

  // Update only colors
  const updateColors = (colors: BrandingColors) => {
    const newBranding = {
      ...branding,
      colors: {
        ...branding.colors,
        ...colors,
      },
    };
    setBranding(newBranding);
  };

  return (
    <BrandingContext.Provider value={{ branding, isLoading, setBranding, updateColors }}>
      {children}
    </BrandingContext.Provider>
  );
}

/**
 * Hook to access branding configuration
 */
export function useBranding(): BrandingContextType {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
}

/**
 * Hook to get brand colors as inline styles
 * Useful for dynamic elements that need brand colors
 */
export function useBrandStyles(): React.CSSProperties {
  const { branding } = useBranding();
  const colors = branding.colors || defaultBranding.colors!;

  return {
    '--brand-primary': colors.primary,
    '--brand-primary-foreground': colors.primaryForeground,
    '--brand-secondary': colors.secondary,
    '--brand-secondary-foreground': colors.secondaryForeground,
    '--brand-accent': colors.accent,
    '--brand-accent-foreground': colors.accentForeground,
  } as React.CSSProperties;
}

/**
 * Helper to convert hex color to HSL format
 */
export function hexToHsl(hex: string): string {
  // Remove # if present
  hex = hex.replace('#', '');

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Default branding export
 */
export { defaultBranding };
