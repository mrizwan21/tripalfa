import { Router, Request, Response } from 'express';

const router = Router();

interface Partner {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

// In-memory store for demonstration
const partners: Partner[] = [];

// GET /partners - List all partners
router.get('/', (_req: Request, res: Response) => {
  res.json(partners);
});

// POST /partners - Add a new partner
router.post('/', (req: Request, res: Response) => {
  const { name, email, status } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }
  const newPartner: Partner = {
    id: Date.now().toString(),
    name,
    email,
    status: status || 'Active',
    createdAt: new Date().toISOString(),
  };
  partners.push(newPartner);
  res.status(201).json(newPartner);
});

// PUT /partners/:id/status - Toggle partner status
router.put('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const partner = partners.find(p => p.id === id);
  if (!partner) return res.status(404).json({ message: 'Partner not found' });
  partner.status = partner.status === 'Active' ? 'Inactive' : 'Active';
  res.json(partner);
});

export default router;
