import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router: Router = Router();

interface Workflow {
  id: string;
  name: string;
  description?: string;
  triggers: Array<{ type: string; condition?: string }>;
  actions: Array<{ type: string; config: any }>;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  executedCount: number;
  lastExecutedAt?: string;
  createdAt: string;
}

const workflows: Map<string, Workflow> = new Map();

/**
 * @swagger
 * /api/crm/workflows:
 *   get:
 *     tags: [Workflows]
 *     summary: List workflows
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         required: false
 *         description: Filter workflows by status
 *     responses:
 *       200:
 *         description: List of workflows
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
 *                 error:
 *                   type: string
 *       500:
 *         description: Internal server error
 */
router.get('/', (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let filtered = Array.from(workflows.values());

    if (status) filtered = filtered.filter(w => w.status === status);

    res.status(200).json({ success: true, data: filtered });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to fetch workflows' });
  }
});

/**
 * @swagger
 * /api/crm/workflows:
 *   post:
 *     summary: Create workflow
 *     tags: [Workflows]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               triggers:
 *                 type: array
 *                 items:
 *                   type: object
 *               actions:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Workflow created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     triggers:
 *                       type: array
 *                     actions:
 *                       type: array
 *                     status:
 *                       type: string
 *                     executedCount:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                 error:
 *                   type: string
 *       400:
 *         description: Name required
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
    const { name, description, triggers = [], actions = [] } = req.body;

    if (!name) return res.status(400).json({ success: false, error: 'Name required' });

    const workflow: Workflow = {
      id: uuidv4(),
      name,
      description,
      triggers,
      actions,
      status: 'DRAFT',
      executedCount: 0,
      createdAt: new Date().toISOString(),
    };

    workflows.set(workflow.id, workflow);

    res.status(201).json({ success: true, data: workflow });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to create workflow' });
  }
});

/**
 * @swagger
 * /api/crm/workflows/{id}/publish:
 *   patch:
 *     tags: [Workflows]
 *     summary: Publish workflow
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workflow ID
 *     responses:
 *       200:
 *         description: Workflow published
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 error:
 *                   type: string
 *       404:
 *         description: Workflow not found
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
router.patch('/:id/publish', (req: Request, res: Response) => {
  try {
    const workflow = workflows.get(req.params.id as string);
    if (!workflow) return res.status(404).json({ success: false, error: 'Workflow not found' });

    workflow.status = 'ACTIVE';

    res.status(200).json({ success: true, data: workflow });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to publish workflow' });
  }
});

export default router;
