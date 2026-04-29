import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

export type ThemeVariant = "super-admin" | "sub-agency" | "b2b" | "b2c";
export type ColorMode = "light" | "dark" | "system";

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSizeBase: string;
  fontWeightNormal: number;
  fontWeightMedium: number;
  fontWeightBold: number;
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  variant: ThemeVariant;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borderRadius: string;
  boxShadow: string;
  tenantId?: string;
  isDefault?: boolean;
}

export interface ThemeContextValue {
  theme: ThemeConfig;
  variant: ThemeVariant;
  colorMode: ColorMode;
  setTheme: (theme: ThemeConfig) => void;
  setVariant: (variant: ThemeVariant) => void;
  setColorMode: (mode: ColorMode) => void;
  updateThemeColors: (colors: Partial<ThemeColors>) => void;
  resetToDefault: () => void;
}

const defaultThemes: Record<ThemeVariant, ThemeConfig> = {
  "super-admin": {
    id: "super-admin-default",
    name: "Super Admin Default",
    variant: "super-admin",
    colors: {
      primary: "#0071e3", // Apple Blue
      secondary: "#1d1d1f", // Near Black
      accent: "#0071e3", // Apple Blue
      background: "#f5f5f7", // Light Gray
      surface: "#ffffff",
      text: "#1d1d1f", // Near Black
      textSecondary: "#86868b", // Gray
      border: "#d2d2d7", // Light Border
      success: "#0071e3", // Apple Blue
      warning: "#0071e3", // Apple Blue
      error: "#1d1d1f", // Near Black
      info: "#0071e3", // Apple Blue
    },
    typography: {
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSizeBase: "16px",
      fontWeightNormal: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
    },
    spacing: {
      xs: "0.25rem", // 4px
      sm: "0.5rem",  // 8px
      md: "1rem",    // 16px
      lg: "1.5rem",  // 24px
      xl: "2rem",    // 32px
    },
    borderRadius: "0.5rem",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    isDefault: true,
  },
  "sub-agency": {
    id: "sub-agency-default",
    name: "Sub Agency Default",
    variant: "sub-agency",
    colors: {
      primary: "#0071e3", // Apple Blue
      secondary: "#1d1d1f", // Near Black
      accent: "#0071e3", // Apple Blue
      background: "#f5f5f7", // Light Gray
      surface: "#ffffff",
      text: "#1d1d1f", // Near Black
      textSecondary: "#86868b", // Gray
      border: "#d2d2d7", // Light Border
      success: "#0071e3", // Apple Blue
      warning: "#0071e3", // Apple Blue
      error: "#1d1d1f", // Near Black
      info: "#0071e3", // Apple Blue
    },
    typography: {
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSizeBase: "15px",
      fontWeightNormal: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "0.875rem", // 14px
      lg: "1.25rem",  // 20px
      xl: "1.75rem",  // 28px
    },
    borderRadius: "0.375rem",
    boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    isDefault: true,
  },
  "b2b": {
    id: "b2b-default",
    name: "B2B Portal Default",
    variant: "b2b",
    colors: {
      primary: "#000000", // Black
      secondary: "#1d1d1f", // Near black
      accent: "#0071e3", // Apple blue
      background: "#000000",
      surface: "#1d1d1f",
      text: "#ffffff",
      textSecondary: "rgba(255, 255, 255, 0.7)",
      border: "rgba(255, 255, 255, 0.1)",
      success: "#30d158", // Apple green
      warning: "#ff9f0a", // Apple orange
      error: "#ff453a", // Apple red
      info: "#5ac8fa", // Apple light blue
    },
    typography: {
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif",
      fontSizeBase: "17px",
      fontWeightNormal: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem",
    },
    borderRadius: "12px",
    boxShadow: "0 4px 14px 0 rgba(0, 0, 0, 0.5)",
    isDefault: true,
  },
  "b2c": {
    id: "b2c-default",
    name: "B2C Portal Default",
    variant: "b2c",
    colors: {
      primary: "#0071e3", // Apple Blue
      secondary: "#1d1d1f", // Near Black
      accent: "#0071e3", // Apple Blue
      background: "#f5f5f7", // Light gray
      surface: "#ffffff",
      text: "#1d1d1f", // Near black
      textSecondary: "#86868b", // Gray
      border: "#d2d2d7", // Light border
      success: "#0071e3", // Apple Blue
      warning: "#0071e3", // Apple Blue
      error: "#1d1d1f", // Near Black
      info: "#0071e3", // Apple Blue
    },
    typography: {
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif",
      fontSizeBase: "16px",
      fontWeightNormal: 400,
      fontWeightMedium: 500,
      fontWeightBold: 700,
    },
    spacing: {
      xs: "0.25rem",
      sm: "0.5rem",
      md: "1rem",
      lg: "1.5rem",
      xl: "2rem",
    },
    borderRadius: "0.75rem",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    isDefault: true,
  },
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export interface ThemeProviderProps {
  children: React.ReactNode;
  initialVariant?: ThemeVariant;
  initialColorMode?: ColorMode;
  tenantId?: string;
  onThemeChange?: (theme: ThemeConfig) => void;
}

export function ThemeProvider({
  children,
  initialVariant = "super-admin",
  initialColorMode = "light",
  tenantId,
  onThemeChange,
}: ThemeProviderProps) {
  const [variant, setVariant] = useState<ThemeVariant>(initialVariant);
  const [colorMode, setColorMode] = useState<ColorMode>(initialColorMode);
  const [theme, setTheme] = useState<ThemeConfig>(() => {
    const baseTheme = defaultThemes[initialVariant];
    return {
      ...baseTheme,
      tenantId,
    };
  });

  // Update theme when variant changes
  useEffect(() => {
    const newTheme = {
      ...defaultThemes[variant],
      tenantId,
    };
    setTheme(newTheme);
    onThemeChange?.(newTheme);
  }, [variant, tenantId, onThemeChange]);

  // Apply theme to CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });
    
    // Apply typography variables
    root.style.setProperty(`--theme-font-family`, theme.typography.fontFamily);
    root.style.setProperty(`--theme-font-size-base`, theme.typography.fontSizeBase);
    
    // Apply spacing variables
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--theme-spacing-${key}`, value);
    });
    
    root.style.setProperty(`--theme-border-radius`, theme.borderRadius);
    root.style.setProperty(`--theme-box-shadow`, theme.boxShadow);
    
    // Apply color mode
    if (colorMode === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else if (colorMode === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      // System mode - check prefers-color-scheme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    }
  }, [theme, colorMode]);

  const updateThemeColors = (colors: Partial<ThemeColors>) => {
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        ...colors,
      },
    }));
  };

  const resetToDefault = () => {
    setVariant(initialVariant);
    setColorMode(initialColorMode);
    setTheme({
      ...defaultThemes[initialVariant],
      tenantId,
    });
  };

  const value: ThemeContextValue = {
    theme,
    variant,
    colorMode,
    setTheme,
    setVariant,
    setColorMode,
    updateThemeColors,
    resetToDefault,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Hook for component styling with theme
export function useThemeStyles() {
  const { theme } = useTheme();
  
  return {
    // Common style combinations
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius,
      boxShadow: theme.boxShadow,
      border: `1px solid ${theme.colors.border}`,
      padding: theme.spacing.md,
    },
    button: {
      primary: {
        backgroundColor: theme.colors.primary,
        color: "#ffffff",
        borderRadius: theme.borderRadius,
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        fontWeight: theme.typography.fontWeightMedium,
      },
      secondary: {
        backgroundColor: theme.colors.surface,
        color: theme.colors.text,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius,
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        fontWeight: theme.typography.fontWeightMedium,
      },
    },
    input: {
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.borderRadius,
      padding: theme.spacing.sm,
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.fontSizeBase,
    },
    text: {
      heading: {
        fontFamily: theme.typography.fontFamily,
        fontWeight: theme.typography.fontWeightBold,
        color: theme.colors.text,
        fontSize: "1.5rem",
        lineHeight: 1.2,
      },
      body: {
        fontFamily: theme.typography.fontFamily,
        fontWeight: theme.typography.fontWeightNormal,
        color: theme.colors.text,
        fontSize: theme.typography.fontSizeBase,
        lineHeight: 1.5,
      },
      caption: {
        fontFamily: theme.typography.fontFamily,
        fontWeight: theme.typography.fontWeightNormal,
        color: theme.colors.textSecondary,
        fontSize: "0.875rem",
        lineHeight: 1.4,
      },
    },
  };
}

// Utility to generate CSS variables for a theme
export function generateThemeCSS(theme: ThemeConfig): string {
  const variables: string[] = [];
  
  // Color variables
  Object.entries(theme.colors).forEach(([key, value]) => {
    variables.push(`--theme-${key}: ${value};`);
  });
  
  // Typography variables
  variables.push(`--theme-font-family: ${theme.typography.fontFamily};`);
  variables.push(`--theme-font-size-base: ${theme.typography.fontSizeBase};`);
  variables.push(`--theme-font-weight-normal: ${theme.typography.fontWeightNormal};`);
  variables.push(`--theme-font-weight-medium: ${theme.typography.fontWeightMedium};`);
  variables.push(`--theme-font-weight-bold: ${theme.typography.fontWeightBold};`);
  
  // Spacing variables
  Object.entries(theme.spacing).forEach(([key, value]) => {
    variables.push(`--theme-spacing-${key}: ${value};`);
  });
  
  // Other variables
  variables.push(`--theme-border-radius: ${theme.borderRadius};`);
  variables.push(`--theme-box-shadow: ${theme.boxShadow};`);
  
  return `:root { ${variables.join("\n  ")} }`;
}