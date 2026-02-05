import { Request, Response, NextFunction } from 'express';

// Simple tenant scoping middleware (reads X-Tenant header for now)
export function requireTenant(req: Request, res: Response, next: NextFunction) {
  const tenant = req.header('x-tenant-id') || req.header('X-Tenant-Id');
  if (!tenant) {
    return res.status(400).json({ error: 'Missing X-Tenant-Id header' });
  }
  // attach to request for handlers
  (req as any).tenantId = tenant;
  return next();
}
