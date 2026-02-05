import express, { Request, Response } from 'express';

const router = express.Router();

interface SupportTicket {
  id: number;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'closed';
  createdAt: string;
  updatedAt: string;
}

const tickets: SupportTicket[] = [];
let nextId = 1;

// List all support tickets
router.get('/', (req: Request, res: Response) => {
  res.json(tickets);
});

// Submit a new support ticket
router.post('/', (req: Request, res: Response) => {
  const { subject, message } = req.body;
  if (!subject || !message) {
    return res.status(400).json({ error: 'Subject and message are required.' });
  }
  const ticket: SupportTicket = {
    id: nextId++,
    subject,
    message,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  tickets.push(ticket);
  res.status(201).json(ticket);
});

// Update ticket status
router.patch('/:id/status', (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  const { status } = req.body;
  const ticket = tickets.find(t => t.id === id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }
  if (!['open', 'in_progress', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  ticket.status = status;
  ticket.updatedAt = new Date().toISOString();
  res.json(ticket);
});

// Get ticket detail
router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  const ticket = tickets.find(t => t.id === id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }
  res.json(ticket);
});

// Delete a ticket
router.delete('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  const idx = tickets.findIndex(t => t.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Ticket not found.' });
  }
  tickets.splice(idx, 1);
  res.status(204).send();
});

export default router;
