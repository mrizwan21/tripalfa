import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router: Router = Router();

interface Document {
  id: string;
  name: string;
  fileType: string;
  size: number;
  uploadedBy: string;
  accessLevel: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
  securityStatus: 'PENDING' | 'CLEAN' | 'QUARANTINED';
  relatedTo?: { type: string; id: string };
  expiresAt?: string;
  downloadCount: number;
  createdAt: string;
}

const documents: Map<string, Document> = new Map();

/**
 * @swagger
 * /api/crm/documents:
 *   get:
 *     tags: [Documents]
 *     summary: List documents
 *     parameters:
 *       - in: query
 *         name: accessLevel
 *         schema:
 *           type: string
 *           enum: [PUBLIC, INTERNAL, CONFIDENTIAL]
 *         description: Filter documents by access level
 *     responses:
 *       200:
 *         description: List of documents
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
 *                     $ref: '#/components/schemas/Document'
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
    const { accessLevel } = req.query;
    let filtered = Array.from(documents.values());

    if (accessLevel) filtered = filtered.filter(d => d.accessLevel === accessLevel);

    res.status(200).json({ success: true, data: filtered });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to fetch documents' });
  }
});

/**
 * @swagger
 * /api/crm/documents:
 *   post:
 *     tags: [Documents]
 *     summary: Upload document
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               fileType:
 *                 type: string
 *               size:
 *                 type: number
 *               uploadedBy:
 *                 type: string
 *               accessLevel:
 *                 type: string
 *                 enum: [PUBLIC, INTERNAL, CONFIDENTIAL]
 *                 default: INTERNAL
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Document'
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
    const { name, fileType, size, uploadedBy, accessLevel = 'INTERNAL' } = req.body;

    if (!name) return res.status(400).json({ success: false, error: 'Name required' });

    const doc: Document = {
      id: uuidv4(),
      name,
      fileType,
      size,
      uploadedBy,
      accessLevel,
      securityStatus: 'PENDING',
      downloadCount: 0,
      createdAt: new Date().toISOString(),
    };

    documents.set(doc.id, doc);

    res.status(201).json({ success: true, data: doc });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to upload document' });
  }
});

/**
 * @swagger
 * /api/crm/documents/{id}/download:
 *   post:
 *     tags: [Documents]
 *     summary: Record download
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Download recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Document'
 *       404:
 *         description: Document not found
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
router.post('/:id/download', (req: Request, res: Response) => {
  try {
    const doc = documents.get(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });

    doc.downloadCount++;

    res.status(200).json({ success: true, data: doc });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to download document' });
  }
});

/**
 * @swagger
 * /api/crm/documents/{id}:
 *   delete:
 *     tags: [Documents]
 *     summary: Delete document
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
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
 *         description: Document not found
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
    if (!documents.has(req.params.id)) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    documents.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Document deleted' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to delete document' });
  }
});

export default router;
