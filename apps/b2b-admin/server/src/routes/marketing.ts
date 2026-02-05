import { Router, Request, Response } from 'express';
import multer from 'multer';
import type { Express } from 'express';
import path from 'path';

type MulterFile = Express.Multer.File;

const router = Router();

// SEO Configuration interface
export interface SEOConfig {
  id: string;
  companyId: string;
  pageTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard: 'summary' | 'summary_large_image';
  structuredData?: object;
  robotsTxt?: string;
  sitemapUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Social Media Configuration
export interface SocialConfig {
  id: string;
  companyId: string;
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok';
  pageUrl: string;
  appId?: string;
  appSecret?: string;
  accessToken?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Promotional Banner
export interface PromoBanner {
  id: string;
  companyId: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string;
  position: 'header' | 'sidebar' | 'footer' | 'popup';
  startDate: string;
  endDate: string;
  isActive: boolean;
  clickCount: number;
  impressionCount: number;
  createdAt: string;
  updatedAt: string;
}

// Affiliate Program
export interface AffiliateProgram {
  id: string;
  companyId: string;
  name: string;
  description: string;
  commissionRate: number;
  commissionType: 'percentage' | 'fixed';
  cookieDays: number;
  minimumPayout: number;
  paymentMethod: 'paypal' | 'bank_transfer' | 'check';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock data
const seoConfigs: SEOConfig[] = [
  {
    id: 'seo1',
    companyId: 'comp1',
    pageTitle: 'Travel Portal - Book Your Dream Vacation',
    metaDescription: 'Discover amazing travel deals and book your perfect vacation with our comprehensive travel portal.',
    metaKeywords: ['travel', 'booking', 'vacation', 'flights', 'hotels'],
    canonicalUrl: 'https://travelportal.com',
    ogTitle: 'Travel Portal - Your Gateway to Amazing Journeys',
    ogDescription: 'Book flights, hotels, and vacation packages with confidence.',
    ogImage: '/images/og-image.jpg',
    twitterCard: 'summary_large_image',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'TravelAgency',
      name: 'Travel Portal',
      url: 'https://travelportal.com'
    },
    robotsTxt: 'User-agent: *\nAllow: /\nDisallow: /admin/',
    sitemapUrl: 'https://travelportal.com/sitemap.xml',
    isActive: true,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  }
];

const socialConfigs: SocialConfig[] = [
  {
    id: 'social1',
    companyId: 'comp1',
    platform: 'facebook',
    pageUrl: 'https://facebook.com/travelportal',
    appId: '123456789',
    isActive: true,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  }
];

const promoBanners: PromoBanner[] = [
  {
    id: 'banner1',
    companyId: 'comp1',
    title: 'Summer Sale - 30% Off!',
    description: 'Book your summer vacation now and save big!',
    imageUrl: '/images/summer-sale-banner.jpg',
    linkUrl: '/search?season=summer',
    position: 'header',
    startDate: '2026-06-01T00:00:00Z',
    endDate: '2026-08-31T23:59:59Z',
    isActive: true,
    clickCount: 0,
    impressionCount: 0,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  }
];

const affiliatePrograms: AffiliateProgram[] = [
  {
    id: 'aff1',
    companyId: 'comp1',
    name: 'Travel Influencer Program',
    description: 'Earn commission by promoting our travel deals',
    commissionRate: 8.5,
    commissionType: 'percentage',
    cookieDays: 30,
    minimumPayout: 50,
    paymentMethod: 'paypal',
    isActive: true,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  }
];

// Multer setup for banner uploads
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads/banners'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const bannerUpload = multer({ storage: bannerStorage });

// SEO Routes
router.get('/seo', (req: Request, res: Response) => {
  const { companyId } = req.query;
  if (!companyId || typeof companyId !== 'string') {
    return res.status(400).json({ message: 'companyId query parameter required' });
  }

  const config = seoConfigs.find(s => s.companyId === companyId);
  if (!config) {
    return res.status(404).json({ message: 'SEO configuration not found' });
  }

  res.json(config);
});

router.post('/seo', (req: Request, res: Response) => {
  const { companyId, pageTitle, metaDescription, metaKeywords, canonicalUrl, ogTitle, ogDescription, ogImage, twitterCard, structuredData, robotsTxt, sitemapUrl } = req.body;

  if (!companyId || !pageTitle || !metaDescription) {
    return res.status(400).json({ message: 'companyId, pageTitle, and metaDescription are required' });
  }

  const existingConfig = seoConfigs.find(s => s.companyId === companyId);
  if (existingConfig) {
    return res.status(409).json({ message: 'SEO configuration already exists for this company' });
  }

  const newConfig: SEOConfig = {
    id: String(Date.now()),
    companyId,
    pageTitle,
    metaDescription,
    metaKeywords: Array.isArray(metaKeywords) ? metaKeywords : [],
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogImage,
    twitterCard: twitterCard || 'summary',
    structuredData,
    robotsTxt,
    sitemapUrl,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  seoConfigs.push(newConfig);
  res.status(201).json(newConfig);
});

router.put('/seo/:id', (req: Request, res: Response) => {
  const config = seoConfigs.find(s => s.id === req.params.id);
  if (!config) {
    return res.status(404).json({ message: 'SEO configuration not found' });
  }

  const updates = req.body;
  Object.assign(config, updates);
  config.updatedAt = new Date().toISOString();

  res.json(config);
});

// Social Media Routes
router.get('/social', (req: Request, res: Response) => {
  const { companyId, platform } = req.query;
  let configs = socialConfigs;

  if (companyId && typeof companyId === 'string') {
    configs = configs.filter(s => s.companyId === companyId);
  }

  if (platform && typeof platform === 'string') {
    configs = configs.filter(s => s.platform === platform);
  }

  res.json(configs);
});

router.post('/social', (req: Request, res: Response) => {
  const { companyId, platform, pageUrl, appId, appSecret, accessToken } = req.body;

  if (!companyId || !platform || !pageUrl) {
    return res.status(400).json({ message: 'companyId, platform, and pageUrl are required' });
  }

  const newConfig: SocialConfig = {
    id: String(Date.now()),
    companyId,
    platform,
    pageUrl,
    appId,
    appSecret,
    accessToken,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  socialConfigs.push(newConfig);
  res.status(201).json(newConfig);
});

router.put('/social/:id', (req: Request, res: Response) => {
  const config = socialConfigs.find(s => s.id === req.params.id);
  if (!config) {
    return res.status(404).json({ message: 'Social configuration not found' });
  }

  Object.assign(config, req.body);
  config.updatedAt = new Date().toISOString();

  res.json(config);
});

router.delete('/social/:id', (req: Request, res: Response) => {
  const idx = socialConfigs.findIndex(s => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Social configuration not found' });
  }

  const deleted = socialConfigs.splice(idx, 1)[0];
  res.json(deleted);
});

// Promotional Banner Routes
router.get('/banners', (req: Request, res: Response) => {
  const { companyId, position, active } = req.query;
  let banners = promoBanners;

  if (companyId && typeof companyId === 'string') {
    banners = banners.filter(b => b.companyId === companyId);
  }

  if (position && typeof position === 'string') {
    banners = banners.filter(b => b.position === position);
  }

  if (active !== undefined) {
    const isActive = active === 'true';
    banners = banners.filter(b => b.isActive === isActive);
  }

  res.json(banners);
});

router.post('/banners', bannerUpload.single('image'), (req: Request & { file?: MulterFile }, res: Response) => {
  const { companyId, title, description, linkUrl, position, startDate, endDate } = req.body;

  if (!companyId || !title || !description || !position || !startDate || !endDate) {
    return res.status(400).json({ message: 'companyId, title, description, position, startDate, and endDate are required' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Banner image is required' });
  }

  const newBanner: PromoBanner = {
    id: String(Date.now()),
    companyId,
    title,
    description,
    imageUrl: `/uploads/banners/${req.file.filename}`,
    linkUrl,
    position,
    startDate,
    endDate,
    isActive: true,
    clickCount: 0,
    impressionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  promoBanners.push(newBanner);
  res.status(201).json(newBanner);
});

router.put('/banners/:id', (req: Request, res: Response) => {
  const banner = promoBanners.find(b => b.id === req.params.id);
  if (!banner) {
    return res.status(404).json({ message: 'Banner not found' });
  }

  Object.assign(banner, req.body);
  banner.updatedAt = new Date().toISOString();

  res.json(banner);
});

router.delete('/banners/:id', (req: Request, res: Response) => {
  const idx = promoBanners.findIndex(b => b.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Banner not found' });
  }

  const deleted = promoBanners.splice(idx, 1)[0];
  res.json(deleted);
});

// Track banner impressions and clicks
router.post('/banners/:id/impression', (req: Request, res: Response) => {
  const banner = promoBanners.find(b => b.id === req.params.id);
  if (!banner) {
    return res.status(404).json({ message: 'Banner not found' });
  }

  banner.impressionCount++;
  res.json({ success: true });
});

router.post('/banners/:id/click', (req: Request, res: Response) => {
  const banner = promoBanners.find(b => b.id === req.params.id);
  if (!banner) {
    return res.status(404).json({ message: 'Banner not found' });
  }

  banner.clickCount++;
  res.json({ success: true, redirectUrl: banner.linkUrl });
});

// Affiliate Program Routes
router.get('/affiliates', (req: Request, res: Response) => {
  const { companyId } = req.query;
  let programs = affiliatePrograms;

  if (companyId && typeof companyId === 'string') {
    programs = programs.filter(a => a.companyId === companyId);
  }

  res.json(programs);
});

router.post('/affiliates', (req: Request, res: Response) => {
  const { companyId, name, description, commissionRate, commissionType, cookieDays, minimumPayout, paymentMethod } = req.body;

  if (!companyId || !name || !description || typeof commissionRate !== 'number' || !commissionType || !paymentMethod) {
    return res.status(400).json({ message: 'All required fields must be provided' });
  }

  const newProgram: AffiliateProgram = {
    id: String(Date.now()),
    companyId,
    name,
    description,
    commissionRate,
    commissionType,
    cookieDays: cookieDays || 30,
    minimumPayout: minimumPayout || 50,
    paymentMethod,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  affiliatePrograms.push(newProgram);
  res.status(201).json(newProgram);
});

router.put('/affiliates/:id', (req: Request, res: Response) => {
  const program = affiliatePrograms.find(a => a.id === req.params.id);
  if (!program) {
    return res.status(404).json({ message: 'Affiliate program not found' });
  }

  Object.assign(program, req.body);
  program.updatedAt = new Date().toISOString();

  res.json(program);
});

router.delete('/affiliates/:id', (req: Request, res: Response) => {
  const idx = affiliatePrograms.findIndex(a => a.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Affiliate program not found' });
  }

  const deleted = affiliatePrograms.splice(idx, 1)[0];
  res.json(deleted);
});

// Generate affiliate links
router.post('/affiliates/:id/generate-link', (req: Request, res: Response) => {
  const { baseUrl, affiliateId } = req.body;

  if (!baseUrl || !affiliateId) {
    return res.status(400).json({ message: 'baseUrl and affiliateId are required' });
  }

  const affiliateLink = `${baseUrl}?ref=${affiliateId}`;
  res.json({ affiliateLink });
});

export default router;
