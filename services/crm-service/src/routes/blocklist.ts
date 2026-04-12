import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router: Router = Router();

interface BlocklistEntry {
  id: string;
  email?: string;
  phoneNumber?: string;
  reason: 'FRAUD' | 'ABUSIVE' | 'DUPLICATE' | 'COMPLIANCE' | 'KYC_FAILED' | 'MANUAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'ACTIVE' | 'EXPIRED' | 'APPEALED';
  kycSubmissionId?: string;
  appealStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  blockedAt: string;
}

const blocklist: Map<string, BlocklistEntry> = new Map();

/**
 * @swagger
 * /api/crm/blocklist:
 *   get:
 *     tags: [Blocklist]
 *     summary: List blocklist entries
 *     parameters:
 *       - in: query
 *         name: reason
 *         schema:
 *           type: string
 *           enum: [FRAUD, ABUSIVE, DUPLICATE, COMPLIANCE, KYC_FAILED, MANUAL]
 *         description: Filter by reason
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filter by severity
 *       - in: query
 *         name: kycRelated
 *         schema:
 *           type: boolean
 *         description: Filter KYC-related entries
 *     responses:
 *       200:
 *         description: List of blocklist entries
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
 *                     $ref: '#/components/schemas/BlocklistEntry'
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
    const { reason, severity, kycRelated } = req.query;
    let filtered = Array.from(blocklist.values());

    if (reason) filtered = filtered.filter(e => e.reason === reason);
    if (severity) filtered = filtered.filter(e => e.severity === severity);
    if (kycRelated === 'true') filtered = filtered.filter(e => e.kycSubmissionId);

    res.status(200).json({ success: true, data: filtered, count: filtered.length });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to fetch blocklist' });
  }
});

/**
 * @swagger
 * /api/crm/blocklist:
 *   post:
 *     tags: [Blocklist]
 *     summary: Add to blocklist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: []
 *             properties:
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               reason:
 *                 type: string
 *                 enum: [FRAUD, ABUSIVE, DUPLICATE, COMPLIANCE, KYC_FAILED, MANUAL]
 *                 default: MANUAL
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *                 default: MEDIUM
 *               kycSubmissionId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Entry added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BlocklistEntry'
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
    const {
      email,
      phoneNumber,
      reason = 'MANUAL',
      severity = 'MEDIUM',
      kycSubmissionId,
    } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ success: false, error: 'Email or phone required' });
    }

    const entry: BlocklistEntry = {
      id: uuidv4(),
      email,
      phoneNumber,
      reason,
      severity,
      status: 'ACTIVE',
      kycSubmissionId,
      blockedAt: new Date().toISOString(),
    };

    blocklist.set(entry.id, entry);

    res.status(201).json({ success: true, data: entry });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to add to blocklist' });
  }
});

/**
 * @swagger
 * /api/crm/blocklist/{id}/appeal:
 *   post:
 *     tags: [Blocklist]
 *     summary: Submit appeal
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blocklist entry ID
 *     responses:
 *       200:
 *         description: Appeal submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BlocklistEntry'
 *       404:
 *         description: Entry not found
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
router.post('/:id/appeal', (req: Request, res: Response) => {
  try {
    const entry = blocklist.get(req.params.id as string);
    if (!entry) return res.status(404).json({ success: false, error: 'Entry not found' });

    entry.appealStatus = 'PENDING';
    entry.status = 'APPEALED';

    res.status(200).json({ success: true, data: entry });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to submit appeal' });
  }
});

/**
 * @swagger
 * /api/crm/blocklist/{id}:
 *   delete:
 *     tags: [Blocklist]
 *     summary: Remove from blocklist
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Blocklist entry ID
 *     responses:
 *       200:
 *         description: Entry removed
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
 *         description: Entry not found
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
    if (!blocklist.has(req.params.id as string)) {
      return res.status(404).json({ success: false, error: 'Entry not found' });
    }
    blocklist.delete(req.params.id as string);
    res.status(200).json({ success: true, message: 'Entry removed' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to remove entry' });
  }
});

export default router;
