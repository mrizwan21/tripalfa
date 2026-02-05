import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';

type MulterFile = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename: string;
  path?: string;
  buffer?: Buffer;
};

const router = Router();

// Branding configuration interface
export interface BrandingConfig {
  id: string;
  companyId: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  customCss?: string;
  emailTemplateHeader?: string;
  emailTemplateFooter?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  metaTitle?: string;
  metaDescription?: string;
  googleAnalyticsId?: string;
  customDomain?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Mock branding data
// In-memory history store
const brandingHistory: Record<string, BrandingConfig[]> = {};

// Mock branding data
const brandingConfigs: BrandingConfig[] = [
  {
    id: 'brand1',
    companyId: 'comp1',
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    accentColor: '#28a745',
    fontFamily: 'Inter, sans-serif',
    socialLinks: {
      facebook: 'https://facebook.com/company',
      twitter: 'https://twitter.com/company',
      linkedin: 'https://linkedin.com/company/company'
    },
    metaTitle: 'Travel Portal - Company Name',
    metaDescription: 'Book your perfect vacation with our white-label travel portal',
    googleAnalyticsId: 'GA-XXXXXXX',
    isActive: true,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z'
  }
];

// Multer setup for branding assets
const brandingStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads/branding'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const brandingUpload = multer({ storage: brandingStorage });

// GET /branding - Get branding config for company
router.get('/', (req: Request, res: Response) => {
  const { companyId } = req.query;
  if (!companyId || typeof companyId !== 'string') {
    return res.status(400).json({ message: 'companyId query parameter required' });
  }

  const config = brandingConfigs.find(b => b.companyId === companyId);
  if (!config) {
    return res.status(404).json({ message: 'Branding configuration not found' });
  }

  res.json(config);
});

// POST /branding - Create new branding config
router.post('/', (req: Request, res: Response) => {
  const {
    companyId,
    primaryColor,
    secondaryColor,
    accentColor,
    fontFamily,
    customCss,
    emailTemplateHeader,
    emailTemplateFooter,
    socialLinks,
    metaTitle,
    metaDescription,
    googleAnalyticsId,
    customDomain
  } = req.body;

  if (!companyId || !primaryColor || !secondaryColor || !accentColor || !fontFamily) {
    return res.status(400).json({
      message: 'companyId, primaryColor, secondaryColor, accentColor, and fontFamily are required'
    });
  }

  const existingConfig = brandingConfigs.find(b => b.companyId === companyId);
  if (existingConfig) {
    return res.status(409).json({ message: 'Branding configuration already exists for this company' });
  }

  const newConfig: BrandingConfig = {
    id: String(Date.now()),
    companyId,
    primaryColor,
    secondaryColor,
    accentColor,
    fontFamily,
    customCss,
    emailTemplateHeader,
    emailTemplateFooter,
    socialLinks: typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks,
    metaTitle,
    metaDescription,
    googleAnalyticsId,
    customDomain,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  brandingConfigs.push(newConfig);
  brandingHistory[newConfig.id] = [JSON.parse(JSON.stringify(newConfig))];
  res.status(201).json(newConfig);
});

// PUT /branding/:id - Update branding config
router.put('/:id', (req: Request, res: Response) => {
  const config = brandingConfigs.find(b => b.id === req.params.id);
  if (!config) {
    return res.status(404).json({ message: 'Branding configuration not found' });
  }

  const {
    primaryColor,
    secondaryColor,
    accentColor,
    fontFamily,
    customCss,
    emailTemplateHeader,
    emailTemplateFooter,
    socialLinks,
    metaTitle,
    metaDescription,
    googleAnalyticsId,
    customDomain,
    isActive
  } = req.body;

  // Update fields
  if (primaryColor) config.primaryColor = primaryColor;
  if (secondaryColor) config.secondaryColor = secondaryColor;
  if (accentColor) config.accentColor = accentColor;
  if (fontFamily) config.fontFamily = fontFamily;
  if (customCss !== undefined) config.customCss = customCss;
  if (emailTemplateHeader !== undefined) config.emailTemplateHeader = emailTemplateHeader;
  if (emailTemplateFooter !== undefined) config.emailTemplateFooter = emailTemplateFooter;
  if (socialLinks) config.socialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
  if (metaTitle !== undefined) config.metaTitle = metaTitle;
  if (metaDescription !== undefined) config.metaDescription = metaDescription;
  if (googleAnalyticsId !== undefined) config.googleAnalyticsId = googleAnalyticsId;
  if (customDomain !== undefined) config.customDomain = customDomain;
  if (typeof isActive === 'boolean') config.isActive = isActive;

  config.updatedAt = new Date().toISOString();
  // Save to history
  if (!brandingHistory[config.id]) brandingHistory[config.id] = [];
  brandingHistory[config.id].push(JSON.parse(JSON.stringify(config)));
  res.json(config);
});

// GET /branding/:id/history - Get branding config history
router.get('/:id/history', (req: Request, res: Response) => {
  const { id } = req.params;
  const key = String(id);
  res.json(brandingHistory[key] || []);
});

// POST /branding/upload-logo - Upload logo
router.post('/upload-logo', brandingUpload.single('logo'), (req: Request & { file?: MulterFile }, res: Response) => {
  const { companyId } = req.body;
  if (!companyId) {
    return res.status(400).json({ message: 'companyId required' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Logo file required' });
  }

  const config = brandingConfigs.find(b => b.companyId === companyId);
  if (!config) {
    return res.status(404).json({ message: 'Branding configuration not found' });
  }

  config.logoUrl = `/uploads/branding/${req.file.filename}`;
  config.updatedAt = new Date().toISOString();

  res.json({ logoUrl: config.logoUrl });
});

// POST /branding/upload-favicon - Upload favicon
router.post('/upload-favicon', brandingUpload.single('favicon'), (req: Request & { file?: MulterFile }, res: Response) => {
  const { companyId } = req.body;
  if (!companyId) {
    return res.status(400).json({ message: 'companyId required' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Favicon file required' });
  }

  const config = brandingConfigs.find(b => b.companyId === companyId);
  if (!config) {
    return res.status(404).json({ message: 'Branding configuration not found' });
  }

  config.faviconUrl = `/uploads/branding/${req.file.filename}`;
  config.updatedAt = new Date().toISOString();

  res.json({ faviconUrl: config.faviconUrl });
});

// DELETE /branding/:id - Delete branding config
router.delete('/:id', (req: Request, res: Response) => {
  const idx = brandingConfigs.findIndex(b => b.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Branding configuration not found' });
  }

  const deleted = brandingConfigs.splice(idx, 1)[0];
  res.json(deleted);
});

export default router;
