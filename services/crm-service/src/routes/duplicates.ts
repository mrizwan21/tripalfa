import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router: Router = Router();

interface DuplicateMatch {
  id: string;
  recordA: { id: string; name: string; email: string; type: 'CONTACT' | 'KYC_SUBMISSION' };
  recordB: { id: string; name: string; email: string; type: 'CONTACT' | 'KYC_SUBMISSION' };
  matchScore: number;
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'MERGED' | 'REJECTED' | 'MANUAL_REVIEW';
  detectedAt: string;
}

const matches: Map<string, DuplicateMatch> = new Map();

/**
 * @swagger
 * /api/crm/duplicates:
 *   get:
 *     summary: List duplicate matches
 *     tags: [Duplicates]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, MERGED, REJECTED, MANUAL_REVIEW]
 *         description: Filter by match status
 *       - in: query
 *         name: confidenceLevel
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filter by confidence level
 *     responses:
 *       200:
 *         description: List of duplicate matches
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
 *                     $ref: '#/components/schemas/DuplicateMatch'
 *                 count:
 *                   type: integer
 *       500:
 *         description: Internal server error
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
    const { status, confidenceLevel } = req.query;
    let filtered = Array.from(matches.values());

    if (status) filtered = filtered.filter(m => m.status === status);
    if (confidenceLevel) filtered = filtered.filter(m => m.confidenceLevel === confidenceLevel);

    // Filter to pending by default
    filtered = filtered.filter(m => m.status === 'PENDING');

    res.status(200).json({ success: true, data: filtered, count: filtered.length });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to fetch duplicates' });
  }
});

/**
 * @swagger
 * /api/crm/duplicates/detect:
 *   post:
 *     summary: Run duplicate detection
 *     tags: [Duplicates]
 *     responses:
 *       200:
 *         description: Duplicate detection started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
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
router.post('/detect', (req: Request, res: Response) => {
  try {
    // Would trigger duplicate detection algorithm here
    res.status(200).json({ success: true, message: 'Duplicate detection started' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to start detection' });
  }
});

/**
 * @swagger
 * /api/crm/duplicates/{id}/reject:
 *   post:
 *     summary: Reject a duplicate match
 *     tags: [Duplicates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The match ID to reject
 *     responses:
 *       200:
 *         description: Match rejected successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DuplicateMatch'
 *       404:
 *         description: Match not found
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
 *         description: Internal server error
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
router.post('/:id/reject', (req: Request, res: Response) => {
  try {
    const match = matches.get(req.params.id as string);
    if (!match) return res.status(404).json({ success: false, error: 'Match not found' });

    match.status = 'REJECTED';

    res.status(200).json({ success: true, data: match });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to reject match' });
  }
});

/**
 * @swagger
 * /api/crm/duplicates/merge:
 *   post:
 *     summary: Merge duplicate records
 *     tags: [Duplicates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matchId
 *               - preference
 *             properties:
 *               matchId:
 *                 type: string
 *                 description: The match ID to merge
 *               preference:
 *                 type: string
 *                 enum: [A, B]
 *                 description: Which record to keep (A or B)
 *     responses:
 *       200:
 *         description: Records merged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/DuplicateMatch'
 *                 message:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       404:
 *         description: Match not found
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
 *         description: Internal server error
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
router.post('/merge', (req: Request, res: Response) => {
  try {
    const { matchId, preference } = req.body;

    if (!matchId || !preference) {
      return res.status(400).json({ success: false, error: 'matchId and preference required' });
    }

    const match = matches.get(matchId);
    if (!match) return res.status(404).json({ success: false, error: 'Match not found' });

    match.status = 'MERGED';

    res.status(200).json({
      success: true,
      data: match,
      message: `Records merged, keeping ${preference === 'A' ? match.recordA.name : match.recordB.name}`,
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to merge records' });
  }
});

export default router;
