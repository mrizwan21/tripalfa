import { Router } from 'express';

const router = Router();

// Mock data for demonstration
const companies = [
  {
    id: '1',
    name: 'Global Travel Inc.',
    type: 'B2B',
    country: 'United States',
    status: 'Active',
    createdAt: '2025-06-01',
  },
  {
    id: '2',
    name: 'Euro Tours',
    type: 'B2C',
    country: 'Germany',
    status: 'Inactive',
    createdAt: '2025-07-15',
  },
];


router.get('/', (req, res) => {
  res.json(companies);
});

router.post('/', (req, res) => {
  const { name, type, country } = req.body ?? {};
  if (!name || !type || !country) {
    return res.status(400).json({ message: 'Name, type, and country are required.' });
  }
  const newCompany = {
    id: String(Date.now()),
    name,
    type,
    country,
    status: 'Active',
    createdAt: new Date().toISOString().slice(0, 10),
  };
  companies.push(newCompany);
  res.status(201).json(newCompany);
});


// Update company
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, type, country } = req.body ?? {};
  const idx = companies.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Company not found.' });
  }
  if (!name || !type || !country) {
    return res.status(400).json({ message: 'Name, type, and country are required.' });
  }
  companies[idx] = { ...companies[idx], name, type, country };
  res.json(companies[idx]);
});

// Delete company
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const idx = companies.findIndex(c => c.id === id);
  if (idx === -1) {
    return res.status(404).json({ message: 'Company not found.' });
  }
  const deleted = companies.splice(idx, 1)[0];
  res.json(deleted);
});

export default router;
