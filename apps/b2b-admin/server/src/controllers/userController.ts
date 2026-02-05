import express, { Request, Response } from 'express';

const router = express.Router();

type User = { id: number; name: string; email: string; role: string };

let users: User[] = [
  { id: 1, name: 'Admin User', email: 'admin@example.com', role: 'admin' },
];

// Get all users
router.get('/', (_req: Request, res: Response) => {
  res.json(users);
});

// Create a new user
router.post('/', (req: Request, res: Response) => {
  const { name, email, role } = req.body as Partial<User>;
  const id = users.length ? users[users.length - 1].id + 1 : 1;
  const newUser: User = { id, name: name || '', email: email || '', role: role || 'user' };
  users.push(newUser);
  res.status(201).json(newUser);
});

// Update a user
router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, role } = req.body as Partial<User>;
  const user = users.find(u => u.id == Number(id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;
  res.json(user);
});

// Delete a user
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  users = users.filter(u => u.id != Number(id));
  res.status(204).send();
});

export default router;
