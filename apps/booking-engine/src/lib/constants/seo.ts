/**
 * SEO Constants for TripAlfa
 *
 * Based on Web Interface Guidelines and SEO best practices.
 * Use these for meta tags, Open Graph, and Twitter Cards.
 */

export const SEO = {
  // Open Graph - 1200x630px recommended
  og: {
    width: 1200,
    height: 630,
    type: 'website',
  },

  // Twitter Cards - 1200x600px recommended
  twitter: {
    width: 1200,
    height: 600,
    card: 'summary_large_image',
  },

  // Character limits
  limits: {
    title: 60,
    description: { min: 150, max: 160, ideal: 160 },
    keywords: { min: 5, max: 10 },
  },
} as const;

export const SEO_DEFAULTS = {
  siteName: 'TripAlfa',
  siteDescription: 'Book flights, hotels, and experiences worldwide with TripAlfa',
  twitterHandle: '@tripalfa',
  locale: 'en_US',
} as const;

export type SEOConfig = {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  author?: string;
  keywords?: string[];
};
