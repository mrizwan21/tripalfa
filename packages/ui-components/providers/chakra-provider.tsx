'use client';

import { ChakraProvider as ChakraUIProvider, createSystem, defaultConfig } from '@chakra-ui/react';
import { type ReactNode } from 'react';

const customTokens = {
  colors: {
    brand: {
      50: { value: '#f0f5ff' },
      100: { value: '#e0eaff' },
      200: { value: '#b2d2ff' },
      300: { value: '#66a3ff' },
      400: { value: '#2997ff' },
      500: { value: '#0071e3' },
      600: { value: '#0066cc' },
      700: { value: '#0052a3' },
      800: { value: '#003d7a' },
      900: { value: '#002952' },
      950: { value: '#001a33' },
    },
  },
  fonts: {
    heading: {
      value:
        "var(--font-inter, -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif)",
    },
    body: {
      value:
        "var(--font-inter, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif)",
    },
  },
  radii: {
    sm: { value: '0.3125rem' },
    md: { value: '0.5rem' },
    lg: { value: '0.6875rem' },
    xl: { value: '0.75rem' },
  },
  spacing: {
    '4xs': { value: '0.125rem' },
    '3xs': { value: '0.25rem' },
    '2xs': { value: '0.375rem' },
    xs: { value: '0.5rem' },
    sm: { value: '0.75rem' },
    md: { value: '1rem' },
    lg: { value: '1.25rem' },
    xl: { value: '1.5rem' },
    '2xl': { value: '2rem' },
  },
} as const;

const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      colorPalette: 'brand',
    },
  },
  theme: {
    tokens: customTokens,
    semanticTokens: {
      colors: {
        background: {
          value: {
            base: { _light: 'white', _dark: 'gray.950' },
          },
        },
        foreground: {
          value: {
            base: { _light: 'gray.900', _dark: 'gray.50' },
          },
        },
      },
    } as any,
  },
});

interface ChakraProviderProps {
  children: ReactNode;
}

export function ChakraProvider({ children }: ChakraProviderProps) {
  return <ChakraUIProvider value={system}>{children}</ChakraUIProvider>;
}

export { system };
