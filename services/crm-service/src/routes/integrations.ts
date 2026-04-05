import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router: Router = Router();

interface ConnectedAccount {
  id: string;
  provider: 'GMAIL' | 'OUTLOOK' | 'SLACK' | 'STRIPE' | 'DUFFEL' | 'LITEAPI' | 'ZAPIER';
  email?: string;
  username?: string;
  status: 'CONNECTED' | 'CONNECTING' | 'ERROR' | 'DISCONNECTED';
  syncStatus?: 'IDLE' | 'SYNCING' | 'ERROR';
  lastSyncedAt?: string;
  createdAt: string;
}

const accounts: Map<string, ConnectedAccount> = new Map();

/**
 * @swagger
 * /api/crm/integrations:
 *   get:
 *     summary: List connected accounts
 *     tags: [Integrations]
 *     responses:
 *       200:
 *         description: List of connected accounts
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
 *                     properties:
 *                       id:
 *                         type: string
 *                       provider:
 *                         type: string
 *                       email:
 *                         type: string
 *                       username:
 *                         type: string
 *                       status:
 *                         type: string
 *                       syncStatus:
 *                         type: string
 *                       lastSyncedAt:
 *                         type: string
 *                       createdAt:
 *                         type: string
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
    const filtered = Array.from(accounts.values());
    res.status(200).json({ success: true, data: filtered });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to fetch accounts' });
  }
});

/**
 * @swagger
 * /api/crm/integrations/authorize:
 *   post:
 *     summary: Start OAuth flow
 *     tags: [Integrations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [GMAIL, OUTLOOK, SLACK, STRIPE, DUFFEL, LITEAPI, ZAPIER]
 *     responses:
 *       200:
 *         description: OAuth flow started successfully
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
 *                     provider:
 *                       type: string
 *                     status:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                 oauthUrl:
 *                   type: string
 *       400:
 *         description: Missing provider
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
router.post('/authorize', (req: Request, res: Response) => {
  try {
    const { provider } = req.body;

    if (!provider) {
      return res.status(400).json({ success: false, error: 'Provider required' });
    }

    const account: ConnectedAccount = {
      id: uuidv4(),
      provider,
      status: 'CONNECTING',
      createdAt: new Date().toISOString(),
    };

    accounts.set(account.id, account);

    // In real implementation, return OAuth URL
    res.status(200).json({
      success: true,
      data: account,
      oauthUrl: `https://oauth.provider.com/authorize?client_id=xxx&redirect_uri=http://localhost:3000/callback&state=${account.id}`,
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to authorize' });
  }
});

/**
 * @swagger
 * /api/crm/integrations/{id}/sync:
 *   post:
 *     summary: Trigger sync
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Sync triggered successfully
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
 *                     provider:
 *                       type: string
 *                     status:
 *                       type: string
 *                     syncStatus:
 *                       type: string
 *                     lastSyncedAt:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *       404:
 *         description: Account not found
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
router.post('/:id/sync', (req: Request, res: Response) => {
  try {
    const account = accounts.get(req.params.id);
    if (!account) return res.status(404).json({ success: false, error: 'Account not found' });

    account.syncStatus = 'SYNCING';
    account.lastSyncedAt = new Date().toISOString();

    res.status(200).json({ success: true, data: account });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to sync' });
  }
});

/**
 * @swagger
 * /api/crm/integrations/{id}:
 *   delete:
 *     summary: Disconnect account
 *     tags: [Integrations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Account disconnected successfully
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
 *         description: Account not found
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
router.delete('/:id', (req: Request, res: Response) => {
  try {
    if (!accounts.has(req.params.id)) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    accounts.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Account disconnected' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to disconnect' });
  }
});

export default router;
