import { Request, Response, NextFunction } from 'express';

// Simple RBAC middleware for the scaffold. Checks `x-user-role` header.
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req.header('x-user-role') || req.header('X-User-Role') || '') as string;
    if (!role) {
      return res.status(401).json({ error: 'Missing X-User-Role header' });
    }
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Insufficient role' });
    }
    (req as any).userRole = role;
    return next();
  };
}
