import express, { Router, Request, Response } from 'express';
import { emailCampaignService } from '../services/email-campaign.service.js';
import { CreateEmailCampaignSchema } from '../types/index.js';

const router: Router = express.Router();

/**
 * @swagger
 * /api/marketing/campaigns:
 *   post:
 *     summary: Create a new email campaign
 *     tags: [Campaigns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, subject, content]
 *             properties:
 *               name:
 *                 type: string
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Campaign created
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
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const parsed = CreateEmailCampaignSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const campaign = await emailCampaignService.createCampaign(parsed.data);
    res.status(201).json(campaign);
  } catch (error: unknown) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/campaigns/{campaignId}:
 *   get:
 *     summary: Get campaign details with analytics
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.get('/:campaignId', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const campaign = await emailCampaignService.getCampaignAnalytics(campaignId as string);
    res.json(campaign);
  } catch (error: unknown) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/campaigns/{campaignId}/send:
 *   post:
 *     summary: Send campaign to audience
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [audience]
 *             properties:
 *               audience:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Campaign sent
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
 *         description: Missing audience
 *       500:
 *         description: Server error
 */
router.post('/:campaignId/send', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const { audience } = req.body;

    if (!audience || !Array.isArray(audience)) {
      return res.status(400).json({ error: 'audience array is required' });
    }

    const result = await emailCampaignService.sendCampaignToAudience(
      campaignId as string,
      audience
    );
    res.json(result);
  } catch (error: unknown) {
    console.error('Error sending campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/campaigns/{campaignId}/pause:
 *   post:
 *     summary: Pause a campaign
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign paused
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/:campaignId/pause', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const campaign = await emailCampaignService.pauseCampaign(campaignId as string);
    res.json(campaign);
  } catch (error: unknown) {
    console.error('Error pausing campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/campaigns/{campaignId}/resume:
 *   post:
 *     summary: Resume a paused campaign
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: campaignId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Campaign resumed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/:campaignId/resume', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const campaign = await emailCampaignService.resumeCampaign(campaignId as string);
    res.json(campaign);
  } catch (error: unknown) {
    console.error('Error resuming campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/marketing/campaigns/webhook/resend:
 *   post:
 *     summary: Resend campaign webhooks
 *     tags: [Campaigns]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhooks resent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       500:
 *         description: Server error
 */
router.post('/webhook/resend', async (req: Request, res: Response) => {
  try {
    const result = await emailCampaignService.handleResendWebhook(req.body);
    res.json(result);
  } catch (error: unknown) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
