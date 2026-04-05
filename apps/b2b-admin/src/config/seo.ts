/**
 * SEO Constants for B2B Admin
 *
 * Based on Web Interface Guidelines and SEO best practices.
 */

export const SEO = {
  og: {
    width: 1200,
    height: 630,
    type: 'website',
  },
  twitter: {
    width: 1200,
    height: 600,
    card: 'summary_large_image',
  },
  limits: {
    title: 60,
    description: { min: 150, max: 160, ideal: 160 },
    keywords: { min: 5, max: 10 },
  },
} as const;

export const SEO_DEFAULTS = {
  siteName: 'TripAlfa B2B',
  siteDescription: 'B2B Admin Portal for TripAlfa',
  twitterHandle: '@tripalfa',
  locale: 'en_US',
} as const;
