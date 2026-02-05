import { Router, Request, Response } from 'express';

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: number[]; // Array of permission IDs
}

const router = Router();

// In-memory demo data
const roles: Role[] = [
  { id: 1, name: 'Admin', description: 'Full access to all features.', permissions: [1, 2, 3, 4, 5] },
  { id: 2, name: 'Staff', description: 'Limited access to company features.', permissions: [1, 2] },
];

// GET /roles - List all roles
router.get('/', (req, res) => {
  res.json(roles);
});

// GET /roles/:id - Get details for a specific role
router.get('/:id', (req, res) => {
  const role = roles.find(r => r.id === Number(req.params.id));
  if (!role) return res.status(404).json({ message: 'Role not found' });
  res.json(role);
});

// POST /roles - Create a new role
router.post('/', (req: Request, res: Response) => {
  const { name, description, permissions } = req.body;
  if (!name) return res.status(400).json({ message: 'Role name is required' });
  const newRole: Role = {
    id: Date.now(),
    name,
    description,
    permissions: Array.isArray(permissions) ? permissions : []
  };
  roles.push(newRole);
  res.status(201).json(newRole);
});

// PUT /roles/:id - Update a role
router.put('/:id', (req, res) => {
  const role = roles.find(r => r.id === Number(req.params.id));
  if (!role) return res.status(404).json({ message: 'Role not found' });
  const { name, description } = req.body;
  if (name) role.name = name;
  if (description) role.description = description;
  res.json(role);
});

// DELETE /roles/:id - Delete a role
router.delete('/:id', (req, res) => {
  const idx = roles.findIndex(r => r.id === Number(req.params.id));
  if (idx === -1) return res.status(404).json({ message: 'Role not found' });
  const deleted = roles.splice(idx, 1);
  res.json(deleted[0]);
});

export default router;
