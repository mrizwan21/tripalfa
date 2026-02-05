import { Request, Response, NextFunction } from 'express';
import { TypedRequest } from '../types';

interface RoleAuthorizationOptions {
  roles: string[];
  requireOwnership?: boolean;
  ownerField?: string;
}

const authorize = (optionsOrRoles: RoleAuthorizationOptions | string[]) => {
  const options: RoleAuthorizationOptions = Array.isArray(optionsOrRoles)
    ? { roles: optionsOrRoles }
    : optionsOrRoles;

  return (req: Request, res: Response, next: NextFunction): void => {
    const typedReq = req as TypedRequest;
    
    if (!typedReq.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Check role permissions
    if (options.roles && options.roles.length && !options.roles.includes(typedReq.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    // Check ownership if required
    if (options.requireOwnership && options.ownerField) {
      const resourceId = req.params.id || req.params.bookingId;
      if (resourceId && typedReq.user.role !== 'admin') {
        // This would typically involve a database check
        // For now, we'll assume the middleware will be enhanced
        // with actual ownership verification logic
      }
    }

    next();
  };
};

export default authorize;