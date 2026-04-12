import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router: Router = Router();

interface CalendarEvent {
  id: string;
  title: string;
  type: 'MEETING' | 'CALL' | 'REMINDER' | 'TASK_DUE' | 'BOOKING_DEADLINE' | 'EMAIL';
  startTime: string;
  endTime: string;
  attendees: Array<{ userId: string; name: string; rsvp: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE' }>;
  relatedTo?: { type: string; id: string };
  createdAt: string;
}

const events: Map<string, CalendarEvent> = new Map();

/**
 * @swagger
 * tags:
 *   name: Calendar
 *   description: Calendar event management
 * /api/crm/calendar:
 *   get:
 *     summary: List calendar events
 *     tags: [Calendar]
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events starting from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter events ending before this date
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [MEETING, CALL, REMINDER, TASK_DUE, BOOKING_DEADLINE, EMAIL]
 *         description: Filter events by type
 *     responses:
 *       200:
 *         description: List of calendar events
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
 *                       title:
 *                         type: string
 *                       type:
 *                         type: string
 *                       startTime:
 *                         type: string
 *                       endTime:
 *                         type: string
 *                       attendees:
 *                         type: array
 *                         items:
 *                           type: object
 *                       relatedTo:
 *                         type: object
 *                       createdAt:
 *                         type: string
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
    const { startDate, endDate, type } = req.query;
    let filtered = Array.from(events.values());

    if (type) filtered = filtered.filter(e => e.type === type);
    if (startDate)
      filtered = filtered.filter(e => new Date(e.startTime) >= new Date(startDate as string));
    if (endDate)
      filtered = filtered.filter(e => new Date(e.endTime) <= new Date(endDate as string));

    res.status(200).json({
      success: true,
      data: filtered,
      count: filtered.length,
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to fetch events' });
  }
});

/**
 * @swagger
 * /api/crm/calendar:
 *   post:
 *     summary: Create a new calendar event
 *     tags: [Calendar]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, startTime]
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [MEETING, CALL, REMINDER, TASK_DUE, BOOKING_DEADLINE, EMAIL]
 *                 default: MEETING
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     rsvp:
 *                       type: string
 *                       enum: [ACCEPTED, DECLINED, TENTATIVE]
 *               relatedTo:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                   id:
 *                     type: string
 *     responses:
 *       201:
 *         description: Event created successfully
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
 *                     title:
 *                       type: string
 *                     type:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                     endTime:
 *                       type: string
 *                     attendees:
 *                       type: array
 *                     relatedTo:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                 message:
 *                   type: string
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
    const { title, type = 'MEETING', startTime, endTime, attendees = [], relatedTo } = req.body;

    if (!title || !startTime) {
      return res.status(400).json({ success: false, error: 'Title and startTime required' });
    }

    const event: CalendarEvent = {
      id: uuidv4(),
      title,
      type,
      startTime,
      endTime,
      attendees,
      relatedTo,
      createdAt: new Date().toISOString(),
    };

    events.set(event.id, event);

    res.status(201).json({
      success: true,
      data: event,
      message: 'Event created successfully',
    });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to create event' });
  }
});

/**
 * @swagger
 * /api/crm/calendar/{id}:
 *   put:
 *     summary: Update a calendar event
 *     tags: [Calendar]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [MEETING, CALL, REMINDER, TASK_DUE, BOOKING_DEADLINE, EMAIL]
 *               startTime:
 *                 type: string
 *                 format: date-time
 *               endTime:
 *                 type: string
 *                 format: date-time
 *               attendees:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     rsvp:
 *                       type: string
 *                       enum: [ACCEPTED, DECLINED, TENTATIVE]
 *               relatedTo:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                   id:
 *                     type: string
 *     responses:
 *       200:
 *         description: Event updated successfully
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
 *                     title:
 *                       type: string
 *                     type:
 *                       type: string
 *                     startTime:
 *                       type: string
 *                     endTime:
 *                       type: string
 *                     attendees:
 *                       type: array
 *                     relatedTo:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *       404:
 *         description: Event not found
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
router.put('/:id', (req: Request, res: Response) => {
  try {
    const event = events.get(req.params.id as string);
    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });

    const updated: CalendarEvent = { ...event, ...req.body };
    events.set(req.params.id as string, updated);

    res.status(200).json({ success: true, data: updated });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to update event' });
  }
});

/**
 * @swagger
 * /api/crm/calendar/{id}:
 *   delete:
 *     summary: Delete a calendar event
 *     tags: [Calendar]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
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
 *         description: Event not found
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
    if (!events.has(req.params.id as string)) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }
    events.delete(req.params.id as string);
    res.status(200).json({ success: true, message: 'Event deleted' });
  } catch (error: unknown) {
    res.status(500).json({ success: false, error: 'Failed to delete event' });
  }
});

export default router;
