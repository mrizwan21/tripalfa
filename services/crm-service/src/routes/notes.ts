import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router: Router = Router();

interface Note {
  id: string;
  content: string;
  type: 'INTERNAL' | 'SHARED' | 'CONFIDENTIAL';
  relatedTo: { type: 'CONTACT' | 'BOOKING' | 'COMPANY'; id: string };
  pinnedForTeam: boolean;
  comments: Array<{ id: string; author: string; text: string; createdAt: string }>;
  tags: string[];
  createdAt: string;
}

const notes: Map<string, Note> = new Map();

/**
 * @swagger
 * /api/crm/notes:
 *   get:
 *     tags: [Notes]
 *     summary: List notes
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INTERNAL, SHARED, CONFIDENTIAL]
 *         description: Filter by note type
 *       - in: query
 *         name: relatedTo
 *         schema:
 *           type: string
 *         description: Filter by related entity ID
 *       - in: query
 *         name: pinnedOnly
 *         schema:
 *           type: boolean
 *         description: Filter pinned notes only
 *     responses:
 *       200:
 *         description: List of notes
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
 *                     $ref: '#/components/schemas/Note'
 *                 count:
 *                   type: integer
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { type, relatedTo, pinnedOnly } = req.query;
    let filtered = Array.from(notes.values());

    if (type) filtered = filtered.filter(n => n.type === type);
    if (pinnedOnly === 'true') filtered = filtered.filter(n => n.pinnedForTeam);
    if (relatedTo) filtered = filtered.filter(n => n.relatedTo.id === relatedTo);

    res.status(200).json({ success: true, data: filtered, count: filtered.length });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to fetch notes' });
  }
});

/**
 * @swagger
 * /api/crm/notes:
 *   post:
 *     tags: [Notes]
 *     summary: Create note
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content, relatedTo]
 *             properties:
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [INTERNAL, SHARED, CONFIDENTIAL]
 *                 default: INTERNAL
 *               relatedTo:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [CONTACT, BOOKING, COMPANY]
 *                   id:
 *                     type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 default: []
 *     responses:
 *       201:
 *         description: Note created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Note'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post('/', (req: Request, res: Response) => {
  try {
    const { content, type = 'INTERNAL', relatedTo, tags = [] } = req.body;

    if (!content || !relatedTo) {
      return res.status(400).json({ success: false, error: 'Content and relatedTo required' });
    }

    const note: Note = {
      id: uuidv4(),
      content,
      type,
      relatedTo,
      pinnedForTeam: false,
      comments: [],
      tags,
      createdAt: new Date().toISOString(),
    };

    notes.set(note.id, note);

    res.status(201).json({ success: true, data: note });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to create note' });
  }
});

/**
 * @swagger
 * /api/crm/notes/{id}/comments:
 *   post:
 *     tags: [Notes]
 *     summary: Add comment to note
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [author, text]
 *             properties:
 *               author:
 *                 type: string
 *               text:
 *                 type: string
 *     responses:
 *       200:
 *         description: Comment added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Note'
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post('/:id/comments', (req: Request, res: Response) => {
  try {
    const note = notes.get(req.params.id as string);
    if (!note) return res.status(404).json({ success: false, error: 'Note not found' });

    const { author, text } = req.body;
    const comment = { id: uuidv4(), author, text, createdAt: new Date().toISOString() };

    note.comments.push(comment);

    res.status(200).json({ success: true, data: note });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

/**
 * @swagger
 * /api/crm/notes/{id}/pin:
 *   patch:
 *     tags: [Notes]
 *     summary: Toggle pin status
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Pin status toggled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Note'
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.patch('/:id/pin', (req: Request, res: Response) => {
  try {
    const note = notes.get(req.params.id as string);
    if (!note) return res.status(404).json({ success: false, error: 'Note not found' });

    note.pinnedForTeam = !note.pinnedForTeam;

    res.status(200).json({ success: true, data: note });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to pin note' });
  }
});

/**
 * @swagger
 * /api/crm/notes/{id}:
 *   delete:
 *     tags: [Notes]
 *     summary: Delete note
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Note ID
 *     responses:
 *       200:
 *         description: Note deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.delete('/:id', (req: Request, res: Response) => {
  try {
    if (!notes.has(req.params.id as string)) {
      return res.status(404).json({ success: false, error: 'Note not found' });
    }
    notes.delete(req.params.id as string);
    res.status(200).json({ success: true, message: 'Note deleted' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to delete note' });
  }
});

export default router;
