import express, { Router, Request, Response } from 'express';
import { contactService } from '../services/contact.service';
import { UpdatePreferenceSchema } from '../types';

const router: Router = express.Router();

/**
 * @swagger
 * /api/preferences/{contactId}:
 *   get:
 *     summary: Get preferences
 *     tags: [Preferences]
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

    res.json(contact.preferences);
  } catch (error: unknown) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/preferences/{contactId}:
 *   put:
 *     summary: Update preferences
 *     tags: [Preferences]
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
 *               dietary:
 *                 type: array
 *                 items:
 *                   type: string
 *               accessibility:
 *                 type: array
 *                 items:
 *                   type: string
 *               communication:
 *                 type: object
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
    const parsed = UpdatePreferenceSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const preferences = await contactService.updatePreference(contactId, parsed.data);
    res.json(preferences);
  } catch (error: unknown) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/preferences/{contactId}/notes:
 *   post:
 *     summary: Add note
 *     tags: [Preferences]
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
 *               - content
 *               - createdBy
 *             properties:
 *               content:
 *                 type: string
 *               createdBy:
 *                 type: string
 *               isInternal:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Note added
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
router.post('/:contactId/notes', async (req: Request, res: Response) => {
  try {
    const contactId = req.params.contactId as string;
    const { content, createdBy, isInternal } = req.body;

    if (!content || !createdBy) {
      return res.status(400).json({ error: 'content and createdBy are required' });
    }

    const note = await contactService.addNote(contactId, content, createdBy, isInternal);
    res.status(201).json(note);
  } catch (error: unknown) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
