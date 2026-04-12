import { Router, Request, Response } from 'express';
import { TicketService } from '../services/ticketService';
import { AppError } from '../middleware/errorHandler';
import { formatTicketResponse } from '../utils/ticketUtils';

const router: Router = Router();

/**
 * @swagger
 * /api/crm/tickets:
 *   get:
 *     summary: List tickets with filtering
 *     tags: [Tickets]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *       - in: query
 *         name: bookingId
 *         schema:
 *           type: string
 *       - in: query
 *         name: companyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
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
 *                   properties:
 *                     tickets:
 *                       type: array
 *                     pagination:
 *                       type: object
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      status,
      priority,
      category,
      assignedTo,
      userId,
      bookingId,
      companyId,
      startDate,
      endDate,
      page = '1',
      limit = '20',
    } = req.query;

    const filters = {
      status: status as string,
      priority: priority as string,
      category: category as string,
      assignedTo: assignedTo as string,
      userId: userId as string,
      bookingId: bookingId as string,
      companyId: companyId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };

    const result = await TicketService.getTickets(filters);

    res.status(200).json({
      success: true,
      data: {
        tickets: result.tickets.map(formatTicketResponse),
        pagination: result.pagination,
      },
      message: 'Tickets retrieved successfully',
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Error fetching tickets:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
});

/**
 * @swagger
 * /api/crm/tickets/stats:
 *   get:
 *     summary: Get ticket statistics
 *     tags: [Tickets]
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
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await TicketService.getTicketStats();

    res.status(200).json({
      success: true,
      data: stats,
      message: 'Ticket statistics retrieved successfully',
    });
  } catch (error: unknown) {
    console.error('Error fetching ticket stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * @swagger
 * /api/crm/tickets/{id}:
 *   get:
 *     summary: Get ticket by ID
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
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
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const ticket = await TicketService.getTicketById(id);

    res.status(200).json({
      success: true,
      data: formatTicketResponse(ticket),
      message: 'Ticket retrieved successfully',
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Error fetching ticket:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
});

/**
 * @swagger
 * /api/crm/tickets:
 *   post:
 *     summary: Create new ticket
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - description
 *               - category
 *               - priority
 *             properties:
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               priority:
 *                 type: string
 *               userId:
 *                 type: string
 *               bookingId:
 *                 type: string
 *               companyId:
 *                 type: string
 *               assignedTo:
 *                 type: string
 *     responses:
 *       201:
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
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const ticketData = req.body;

    // Validate required fields
    if (
      !ticketData.subject ||
      !ticketData.description ||
      !ticketData.category ||
      !ticketData.priority
    ) {
      throw new AppError('Missing required fields: subject, description, category, priority', 400);
    }

    const ticket = await TicketService.createTicket(ticketData);

    res.status(201).json({
      success: true,
      data: formatTicketResponse(ticket),
      message: 'Ticket created successfully',
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Error creating ticket:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
});

/**
 * @swagger
 * /api/crm/tickets/{id}:
 *   put:
 *     summary: Update ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               priority:
 *                 type: string
 *               status:
 *                 type: string
 *               assignedTo:
 *                 type: string
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
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updateData = req.body;

    const ticket = await TicketService.updateTicket(id, updateData);

    res.status(200).json({
      success: true,
      data: formatTicketResponse(ticket),
      message: 'Ticket updated successfully',
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Error updating ticket:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
});

/**
 * @swagger
 * /api/crm/tickets/{id}/interactions:
 *   post:
 *     summary: Add interaction to ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - content
 *             properties:
 *               type:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
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
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/:id/interactions', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const interactionData = req.body;

    // Validate required fields
    if (!interactionData.type || !interactionData.content) {
      throw new AppError('Missing required fields: type, content', 400);
    }

    const interaction = await TicketService.addInteraction(id, interactionData);

    res.status(201).json({
      success: true,
      data: interaction,
      message: 'Interaction added successfully',
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Error adding interaction:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
});

/**
 * @swagger
 * /api/crm/tickets/{id}/assign:
 *   post:
 *     summary: Assign ticket to agent
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agentId
 *             properties:
 *               agentId:
 *                 type: string
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
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/:id/assign', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { agentId } = req.body;

    if (!agentId) {
      throw new AppError('Missing required field: agentId', 400);
    }

    const ticket = await TicketService.assignTicket(id, agentId);

    res.status(200).json({
      success: true,
      data: formatTicketResponse(ticket),
      message: 'Ticket assigned successfully',
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Error assigning ticket:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
});

/**
 * @swagger
 * /api/crm/tickets/{id}/resolve:
 *   post:
 *     summary: Resolve ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resolution
 *             properties:
 *               resolution:
 *                 type: string
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
 *                 message:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post('/:id/resolve', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { resolution } = req.body;

    if (!resolution) {
      throw new AppError('Missing required field: resolution', 400);
    }

    const ticket = await TicketService.resolveTicket(id, resolution);

    res.status(200).json({
      success: true,
      data: formatTicketResponse(ticket),
      message: 'Ticket resolved successfully',
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Error resolving ticket:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
});

/**
 * @swagger
 * /api/crm/tickets/{id}:
 *   delete:
 *     summary: Delete/close ticket
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
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
 *                 message:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Instead of hard delete, mark as closed
    const ticket = await TicketService.updateTicket(id, { status: 'closed' });

    res.status(200).json({
      success: true,
      data: formatTicketResponse(ticket),
      message: 'Ticket closed successfully',
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    } else {
      console.error('Error closing ticket:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
});

export default router;
