import { Router, Request, Response } from 'express';

const router = Router();

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  inventory: number;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

// In-memory store for demonstration
const products: Product[] = [];

// GET /products - List all products
router.get('/', (_req: Request, res: Response) => {
  res.json(products);
});

// POST /products - Add a new product
router.post('/', (req: Request, res: Response) => {
  const { name, sku, price, inventory, status } = req.body;
  if (!name || !sku) {
    return res.status(400).json({ message: 'Name and SKU are required' });
  }
  const newProduct: Product = {
    id: Date.now().toString(),
    name,
    sku,
    price: Number(price) || 0,
    inventory: Number(inventory) || 0,
    status: status || 'Active',
    createdAt: new Date().toISOString(),
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT /products/:id/status - Toggle product status
router.put('/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const product = products.find(p => p.id === id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  product.status = product.status === 'Active' ? 'Inactive' : 'Active';
  res.json(product);
});

export default router;
