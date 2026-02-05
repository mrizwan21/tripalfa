import { Router, Request, Response } from 'express';

const router = Router();

export type UserType = 'b2c' | 'b2b' | 'super-admin';
export interface User {
  id: string;
  name: string;
  email: string;
  type: UserType;
  companyId?: string; // For B2B users
  role?: string;      // For B2B users (designation/role)
  partnerId?: string; // For B2B users
  status: 'Active' | 'Inactive';
  joined: string;
}

// Mock data for demonstration
const users: User[] = [
  {
    id: 'u1',
    name: 'Ava Patel',
    email: 'ava.patel@globaltravel.com',
    type: 'super-admin',
    status: 'Active',
    joined: '2025-05-10',
  },
  {
    id: 'u2',
    name: 'Liam Müller',
    email: 'liam.muller@eurotours.de',
    type: 'b2b',
    companyId: 'c1',
    role: 'Manager',
    partnerId: 'p1',
    status: 'Inactive',
    joined: '2025-07-22',
  },
  {
    id: 'u3',
    name: 'Sophia Chen',
    email: 'sophia.chen@gmail.com',
    type: 'b2c',
    status: 'Active',
    joined: '2025-09-15',
  },
];

// GET /users - list all users, filter by type
router.get('/', (req: Request, res: Response) => {
  const { type } = req.query;
  if (type && typeof type === 'string') {
    res.json(users.filter(u => u.type === type));
  } else {
    res.json(users);
  }
});

// GET /users/:id - get user details
router.get('/:id', (req: Request, res: Response) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json(user);
});

// POST /users - create new user
router.post('/', (req: Request, res: Response) => {
  const { name, email, type, companyId, role, partnerId } = req.body ?? {};
  if (!name || !email || !type) {
    return res.status(400).json({ message: 'Name, email, and type are required.' });
  }
  if (!['b2c', 'b2b', 'super-admin'].includes(type)) {
    return res.status(400).json({ message: 'Invalid user type.' });
  }
  const newUser: User = {
    id: String(Date.now()),
    name,
    email,
    type,
    companyId,
    role,
    partnerId,
    status: 'Active',
    joined: new Date().toISOString().slice(0, 10),
  };
  users.push(newUser);
  res.status(201).json(newUser);
});

// PUT /users/:id - update user
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, type, companyId, role, partnerId, status } = req.body ?? {};
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: 'User not found.' });
  }
  if (name) users[idx].name = name;
  if (email) users[idx].email = email;
  if (type && ['b2c', 'b2b', 'super-admin'].includes(type)) users[idx].type = type;
  if (companyId !== undefined) users[idx].companyId = companyId;
  if (role !== undefined) users[idx].role = role;
  if (partnerId !== undefined) users[idx].partnerId = partnerId;
  if (status && ['Active', 'Inactive'].includes(status)) users[idx].status = status;
  res.json(users[idx]);
});

// DELETE /users/:id - delete user
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: 'User not found.' });
  }
  const deleted = users.splice(idx, 1)[0];
  res.json(deleted);
});

export default router;
