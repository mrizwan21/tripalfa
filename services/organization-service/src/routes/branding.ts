import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

const router: ExpressRouter = Router();

// Branding configuration interface
export type BrandingConfig = {
  id: string;
  companyId: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor?: string;
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
};

// Mock branding data
// In-memory history store
const brandingHistory: Record<string, BrandingConfig[]> = {};

// Mock branding data
const brandingConfigs: BrandingConfig[] = [
  {
    id: 'brand1',
    companyId: 'comp1',
    primaryColor: 'rgb(0, 123, 255)',
    secondaryColor: 'rgb(108, 117, 125)',
    accentColor: 'rgb(40, 167, 69)',
    fontFamily: 'Inter, sans-serif',
    socialLinks: {
      facebook: 'https://facebook.com/company',
      twitter: 'https://twitter.com/company',
      linkedin: 'https://linkedin.com/company/company',
    },
    metaTitle: 'Travel Portal - Company Name',
    metaDescription: 'Book your perfect vacation with our white-label travel portal',
    googleAnalyticsId: 'GA-XXXXXXX',
    isActive: true,
    createdAt: '2026-01-20T10:00:00Z',
    updatedAt: '2026-01-20T10:00:00Z',
  },
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

/**
 * @swagger
 * /api/organization/branding:
 *   get:
 *     summary: Get branding config for company
 *     tags: [Branding]
 *     parameters:
 *       - in: query
 *         name: companyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *       404:
 *         description: Not found
 */
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

/**
 * @swagger
 * /api/organization/branding:
 *   post:
 *     summary: Create branding config
 *     tags: [Branding]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               companyId:
 *                 type: string
 *               primaryColor:
 *                 type: string
 *               secondaryColor:
 *                 type: string
 *               accentColor:
 *                 type: string
 *               fontFamily:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
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
    customDomain,
  } = req.body;

  if (!companyId || !primaryColor || !secondaryColor || !accentColor || !fontFamily) {
    return res.status(400).json({
      message: 'companyId, primaryColor, secondaryColor, accentColor, and fontFamily are required',
    });
  }

  const existingConfig = brandingConfigs.find(b => b.companyId === companyId);
  if (existingConfig) {
    return res.status(409).json({
      message: 'Branding configuration already exists for this company',
    });
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
    updatedAt: new Date().toISOString(),
  };

  brandingConfigs.push(newConfig);
  brandingHistory[newConfig.id] = [JSON.parse(JSON.stringify(newConfig))];
  res.status(201).json(newConfig);
});

/**
 * @swagger
 * /api/organization/branding/{id}:
 *   put:
 *     summary: Update branding config
 *     tags: [Branding]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
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
    isActive,
  } = req.body;

  // Update fields
  if (primaryColor) config.primaryColor = primaryColor;
  if (secondaryColor) config.secondaryColor = secondaryColor;
  if (accentColor) config.accentColor = accentColor;
  if (fontFamily) config.fontFamily = fontFamily;
  if (customCss !== undefined) config.customCss = customCss;
  if (emailTemplateHeader !== undefined) config.emailTemplateHeader = emailTemplateHeader;
  if (emailTemplateFooter !== undefined) config.emailTemplateFooter = emailTemplateFooter;
  if (socialLinks)
    config.socialLinks = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
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

/**
 * @swagger
 * /api/organization/branding/{id}/history:
 *   get:
 *     summary: Get branding config history
 *     tags: [Branding]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *       500:
 *         description: Server error
 */
router.get('/:id/history', (req: Request, res: Response) => {
  const { id } = req.params;
  const key = String(id);
  res.json(brandingHistory[key] || []);
});

/**
 * @swagger
 * /api/organization/branding/upload-logo:
 *   post:
 *     summary: Upload logo
 *     tags: [Branding]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               companyId:
 *                 type: string
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post(
  '/upload-logo',
  brandingUpload.single('logo'),
  (req: Request & { file?: MulterFile }, res: Response) => {
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
  }
);

/**
 * @swagger
 * /api/organization/branding/upload-favicon:
 *   post:
 *     summary: Upload favicon
 *     tags: [Branding]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               companyId:
 *                 type: string
 *               favicon:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post(
  '/upload-favicon',
  brandingUpload.single('favicon'),
  (req: Request & { file?: MulterFile }, res: Response) => {
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
  }
);

/**
 * @swagger
 * /api/organization/branding/{id}:
 *   delete:
 *     summary: Delete branding config
 *     tags: [Branding]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.delete('/:id', (req: Request, res: Response) => {
  const idx = brandingConfigs.findIndex(b => b.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Branding configuration not found' });
  }

  const deleted = brandingConfigs.splice(idx, 1)[0];
  res.json(deleted);
});

export default router;
