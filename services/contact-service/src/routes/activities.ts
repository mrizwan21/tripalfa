import * as express from 'express';
import type { Router, Request, Response } from 'express';
import { activityService } from '../services/activity.service';
import { CreateActivitySchema } from '../types';

const router: Router = express.Router();

/**
 * @swagger
 * /api/activities/{contactId}:
 *   get:
 *     summary: Get timeline for contact
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
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
 *       - in: query
 *         name: type
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
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get('/:contactId', async (req: Request, res: Response) => {
  try {
    const contactId = req.params.contactId as string;
    const { limit, offset, type } = req.query;

    // Helper function to extract string value from query parameter
    const getStringValue = (param: string | string[] | any): string | undefined => {
      if (param === undefined) return undefined;
      if (Array.isArray(param)) return param[0] as string;
      // Handle ParsedQs object (from qs library)
      if (typeof param === 'object' && param !== null) {
        // Convert ParsedQs to string by taking first value
        const entries = Object.entries(param);
        if (entries.length > 0) {
          const value = entries[0][1];
          return Array.isArray(value) ? value[0] : String(value);
        }
        return undefined;
      }
      return param as string;
    };

    // Helper function to extract number value from query parameter
    const getNumberValue = (param: string | string[] | any, defaultValue: number): number => {
      if (param === undefined) return defaultValue;
      if (Array.isArray(param)) {
        const val = param[0];
        if (typeof val === 'object' && val !== null) {
          const entries = Object.entries(val);
          if (entries.length > 0) {
            const numVal = entries[0][1];
            const strVal = Array.isArray(numVal) ? numVal[0] : String(numVal);
            return parseInt(strVal) || defaultValue;
          }
        }
        return parseInt(val) || defaultValue;
      }
      if (typeof param === 'object' && param !== null) {
        const entries = Object.entries(param);
        if (entries.length > 0) {
          const numVal = entries[0][1];
          const strVal = Array.isArray(numVal) ? numVal[0] : String(numVal);
          return parseInt(strVal) || defaultValue;
        }
      }
      const num = parseInt(param);
      return isNaN(num) ? defaultValue : num;
    };

    const result = await activityService.getTimeline(contactId, {
      limit: getNumberValue(limit, 20),
      offset: getNumberValue(offset, 0),
      type: getStringValue(type),
    });

    res.json(result);
  } catch (error: unknown) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/activities/{contactId}/metrics:
 *   get:
 *     summary: Get activity metrics
 *     tags: [Activities]
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
 *       500:
 *         description: Server error
 */
router.get('/:contactId/metrics', async (req: Request, res: Response) => {
  try {
    const contactId = req.params.contactId as string;
    const metrics = await activityService.getActivityMetrics(contactId);
    res.json(metrics);
  } catch (error: unknown) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/activities:
 *   post:
 *     summary: Create activity
 *     tags: [Activities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contactId
 *               - type
 *             properties:
 *               contactId:
 *                 type: string
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Activity created
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
    const parsed = CreateActivitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const activity = await activityService.logActivity(parsed.data);
    res.status(201).json(activity);
  } catch (error: unknown) {
    console.error('Error creating activity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/activities/booking/{bookingId}:
 *   get:
 *     summary: Get activities by booking
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: bookingId
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
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get('/booking/:bookingId', async (req: Request, res: Response) => {
  try {
    const bookingId = req.params.bookingId as string;
    const activities = await activityService.getActivitiesByBookingId(bookingId);
    res.json(activities);
  } catch (error: unknown) {
    console.error('Error fetching booking activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/activities/ticket/{ticketId}:
 *   get:
 *     summary: Get activities by ticket
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: ticketId
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
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get('/ticket/:ticketId', async (req: Request, res: Response) => {
  try {
    const ticketId = req.params.ticketId as string;
    const activities = await activityService.getActivitiesByTicketId(ticketId);
    res.json(activities);
  } catch (error: unknown) {
    console.error('Error fetching ticket activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
