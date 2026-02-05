import { Router, Request, Response } from 'express';

const router = Router();

interface Settings {
  featureXEnabled: boolean;
  maintenanceMode: boolean;
  supportEmail: string;
}

// In-memory settings store for demonstration
let settings: Settings = {
  featureXEnabled: true,
  maintenanceMode: false,
  supportEmail: 'support@example.com',
};

// GET /settings - Get system settings
router.get('/', (_req: Request, res: Response) => {
  res.json(settings);
});

// PUT /settings - Update system settings
router.put('/', (req: Request, res: Response) => {
  settings = { ...settings, ...req.body };
  res.json(settings);
});

export default router;
