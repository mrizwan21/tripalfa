import { Router, Request, Response } from 'express';
import type { Tenant } from '@tripalfa/shared-types';

const router = Router();

// GET /v1/tenants - list tenants (stubbed)
router.get('/', (_req: Request, res: Response) => {
  const tenants: Tenant[] = [
    { id: 'tenant_1', name: 'Demo Tenant 1', active: true },
    { id: 'tenant_2', name: 'Demo Tenant 2', active: false }
  ];
  res.json({ data: tenants });
});

// GET /v1/tenants/:id - get tenant
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const tenant: Tenant = { id, name: `Tenant ${id}`, active: true };
  res.json({ data: tenant });
});

export default router;
