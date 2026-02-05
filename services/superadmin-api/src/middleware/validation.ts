import { Request, Response, NextFunction } from 'express';

export function validateNotificationBody(req: Request, res: Response, next: NextFunction) {
  const body = req.body as Partial<Record<string, any>>;
  const errors: string[] = [];

  if (!body) {
    errors.push('Request body is required');
  } else {
    if (body.message && typeof body.message !== 'string') {
      errors.push('`message` must be a string');
    }
    if (!body.message || String(body.message).trim().length === 0) {
      errors.push('`message` is required');
    }
    if (body.type && typeof body.type !== 'string') {
      errors.push('`type` must be a string');
    }
    if (body.type && String(body.type).length > 64) {
      errors.push('`type` is too long (max 64 chars)');
    }
  }

  if (errors.length) {
    return res.status(400).json({ errors });
  }
  return next();
}
