import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router: Router = Router();

interface Opportunity {
  id: string;
  name: string;
  companyId: string;
  stage:
    | 'PROSPECTING'
    | 'QUALIFICATION'
    | 'PROPOSAL'
    | 'NEGOTIATION'
    | 'CLOSED_WON'
    | 'CLOSED_LOST';
  value: number;
  probability: number;
  expectedValue: number;
  owner: string;
  closeDate?: string;
  createdAt: string;
}

const opportunities: Map<string, Opportunity> = new Map();

/**
 * @swagger
 * /api/crm/opportunities:
 *   get:
 *     summary: List opportunities
 *     tags: [Opportunities]
 *     parameters:
 *       - in: query
 *         name: stage
 *         schema:
 *           type: string
 *           enum: [PROSPECTING, QUALIFICATION, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST]
 *         required: false
 *         description: Filter by stage
 *       - in: query
 *         name: owner
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter by owner
 *     responses:
 *       200:
 *         description: List of opportunities
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
 *                     $ref: '#/components/schemas/Opportunity'
 *                 metrics:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                     totalValue:
 *                       type: number
 *                     expectedValue:
 *                       type: number
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
    const { stage, owner } = req.query;
    let filtered = Array.from(opportunities.values());

    if (stage) filtered = filtered.filter(o => o.stage === stage);
    if (owner) filtered = filtered.filter(o => o.owner === owner);

    const totalValue = filtered.reduce((sum, o) => sum + o.value, 0);
    const expectedValue = filtered.reduce((sum, o) => sum + o.expectedValue, 0);

    res.status(200).json({
      success: true,
      data: filtered,
      metrics: { count: filtered.length, totalValue, expectedValue },
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to fetch opportunities' });
  }
});

/**
 * @swagger
 * /api/crm/opportunities:
 *   post:
 *     summary: Create opportunity
 *     tags: [Opportunities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, companyId]
 *             properties:
 *               name:
 *                 type: string
 *               companyId:
 *                 type: string
 *               value:
 *                 type: number
 *               owner:
 *                 type: string
 *               probability:
 *                 type: number
 *                 default: 0.5
 *               stage:
 *                 type: string
 *     responses:
 *       201:
 *         description: Opportunity created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Opportunity'
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
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, companyId, value, owner, probability = 0.5 } = req.body;

    if (!name || !companyId) {
      return res.status(400).json({ success: false, error: 'Name and companyId required' });
    }

    const opportunity: Opportunity = {
      id: uuidv4(),
      name,
      companyId,
      stage: 'PROSPECTING',
      value,
      probability,
      expectedValue: value * probability,
      owner,
      createdAt: new Date().toISOString(),
    };

    opportunities.set(opportunity.id, opportunity);

    res.status(201).json({ success: true, data: opportunity });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to create opportunity' });
  }
});

/**
 * @swagger
 * /api/crm/opportunities/{id}/stage:
 *   patch:
 *     summary: Update opportunity stage
 *     tags: [Opportunities]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Opportunity ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [stage]
 *             properties:
 *               stage:
 *                 type: string
 *                 enum: [PROSPECTING, QUALIFICATION, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST]
 *     responses:
 *       200:
 *         description: Stage updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Opportunity'
 *       404:
 *         description: Opportunity not found
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
router.patch('/:id/stage', (req: Request, res: Response) => {
  try {
    const { stage } = req.body;
    const opp = opportunities.get(req.params.id as string);
    if (!opp) return res.status(404).json({ success: false, error: 'Opportunity not found' });

    opp.stage = stage;
    opp.expectedValue = opp.value * opp.probability;

    res.status(200).json({ success: true, data: opp });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to update opportunity' });
  }
});

export default router;
