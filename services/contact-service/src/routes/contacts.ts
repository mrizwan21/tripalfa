import express, { Router, Request, Response } from 'express';
import { contactService } from '../services/contact.service';
import { CreateContactSchema, UpdateContactSchema, ContactQuerySchema } from '../types';

const router: Router = express.Router();

/**
 * @swagger
 * /api/contacts/{contactId}:
 *   get:
 *     summary: Get contact details
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Server error
 */
router.get('/:contactId', async (req: Request, res: Response) => {
  try {
    const contactId = req.params.contactId as string;
    const contact = await contactService.getContact(contactId);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error: unknown) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/contacts:
 *   get:
 *     summary: List contacts
 *     tags: [Contacts]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const parsed = ContactQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const result = await contactService.listContacts(parsed.data);
    res.json(result);
  } catch (error: unknown) {
    console.error('Error listing contacts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/contacts/email/{email}:
 *   get:
 *     summary: Get contact by email
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Server error
 */
router.get('/email/:email', async (req: Request, res: Response) => {
  try {
    const email = req.params.email as string;
    const contact = await contactService.getContactByEmail(email);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error: unknown) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/contacts:
 *   post:
 *     summary: Create contact
 *     tags: [Contacts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - email
 *               - firstName
 *               - lastName
 *             properties:
 *               userId:
 *                 type: string
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: Contact created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Server error
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = CreateContactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const contact = await contactService.syncOrCreateContact(
      parsed.data.userId,
      parsed.data.email,
      parsed.data.firstName,
      parsed.data.lastName
    );

    res.status(201).json(contact);
  } catch (error: unknown) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/contacts/{contactId}:
 *   put:
 *     summary: Update contact
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Server error
 */
router.put('/:contactId', async (req: Request, res: Response) => {
  try {
    const contactId = req.params.contactId as string;
    const parsed = UpdateContactSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const contact = await contactService.updateContact(contactId, parsed.data);
    res.json(contact);
  } catch (error: unknown) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/contacts/{contactId}/tier:
 *   put:
 *     summary: Update contact tier
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - totalSpent
 *             properties:
 *               totalSpent:
 *                 type: number
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Server error
 */
router.put('/:contactId/tier', async (req: Request, res: Response) => {
  try {
    const contactId = req.params.contactId as string;
    const { totalSpent } = req.body;

    if (typeof totalSpent !== 'number') {
      return res.status(400).json({ error: 'totalSpent must be a number' });
    }

    const contact = await contactService.updateTierBySpending(contactId, totalSpent);
    res.json(contact);
  } catch (error: unknown) {
    console.error('Error updating tier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/contacts/{contactId}/summary:
 *   get:
 *     summary: Get contact summary
 *     tags: [Contacts]
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Contact not found
 *       500:
 *         description: Server error
 */
router.get('/:contactId/summary', async (req: Request, res: Response) => {
  try {
    const contactId = req.params.contactId as string;
    const summary = await contactService.getContactSummary(contactId);

    if (!summary) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(summary);
  } catch (error: unknown) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
