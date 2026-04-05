"use client";

/**
 * Chakra UI Provider Component
 *
 * Provides Chakra UI's design system, accessibility features, and theme customization.
 * Can be used alongside existing shadcn/ui components for complex interactive UIs.
 *
 * Usage:
 *   import { ChakraProvider } from '@tripalfa/ui-components/providers';
 *   import { ChakraProvider } from '@tripalfa/ui-components/providers/chakra-provider';
 *
 *   <ChakraProvider>
 *     <YourApp />
 *   </ChakraProvider>
 */

import { ChakraProvider as ChakraUIProvider, createSystem, defaultConfig } from "@chakra-ui/react";
import { type ReactNode } from "react";

// ============================================================================
// Custom Theme Configuration
// ============================================================================

const customTokens = {
  colors: {
    brand: {
      50: { value: "#f0f9ff" },
      100: { value: "#e0f2fe" },
      200: { value: "#bae6fd" },
      300: { value: "#7dd3fc" },
      400: { value: "#38bdf8" },
      500: { value: "#0ea5e9" },
      600: { value: "#0284c7" },
      700: { value: "#0369a1" },
      800: { value: "#075985" },
      900: { value: "#0c4a6e" },
      950: { value: "#082f49" },
    },
  },
  fonts: {
    heading: { value: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)" },
    body: { value: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)" },
  },
  radii: {
    sm: { value: "0.375rem" },
    md: { value: "0.5rem" },
    lg: { value: "0.75rem" },
    xl: { value: "1rem" },
  },
  spacing: {
    "4xs": { value: "0.125rem" },
    "3xs": { value: "0.25rem" },
    "2xs": { value: "0.375rem" },
    xs: { value: "0.5rem" },
    sm: { value: "0.75rem" },
    md: { value: "1rem" },
    lg: { value: "1.25rem" },
    xl: { value: "1.5rem" },
    "2xl": { value: "2rem" },
  },
} as const;

const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      colorPalette: "brand",
    },
  },
  theme: {
    tokens: customTokens,
    semanticTokens: {
      colors: {
        // Map Chakra colors to match existing CSS variables
        background: {
          value: {
            base: { _light: "white", _dark: "gray.950" },
          },
        },
        foreground: {
          value: {
            base: { _light: "gray.900", _dark: "gray.50" },
          },
        },
      },
    },
  },
});

// ============================================================================
// Provider Component
// ============================================================================

interface ChakraProviderProps {
  children: ReactNode;
}

export function ChakraProvider({ children }: ChakraProviderProps) {
  return <ChakraUIProvider value={system}>{children}</ChakraUIProvider>;
}

export { system };