import { Router, Request, Response } from 'express';
import type { SuperAdminNotification as Notification } from '@tripalfa/shared-types';
import { requireTenant } from '../middleware/tenantMiddleware';
import { requireRole } from '../middleware/rbacMiddleware';
import { validateNotificationBody } from '../middleware/validation';
import { addNotification, listNotifications } from '../store/notificationsStore';

const router = Router();

// Public: GET /v1/notifications - list recent notifications
router.get('/', (_req: Request, res: Response) => {
  const notifications = listNotifications();
  res.json({ data: notifications });
});

// Protected: POST /v1/notifications - create notification (requires tenant + admin role)
router.post('/', requireTenant, requireRole(['admin']), validateNotificationBody, (req: Request, res: Response, next) => {
  try {
    const body = req.body as Partial<Notification>;
    const tenantId = (req as any).tenantId as string;
    const notification: Notification = {
      id: `n_${Date.now()}`,
      tenantId,
      type: body.type || 'system',
      message: body.message || 'No message',
      createdAt: new Date().toISOString()
    };
    const saved = addNotification(notification);
    return res.status(201).json({ data: saved });
  } catch (err) {
    return next(err);
  }
});

export default router;
