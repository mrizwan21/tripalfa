import { getCoreDb } from '@tripalfa/shared-database';
import {
  CreateTicketRequest,
  UpdateTicketRequest,
  CreateInteractionRequest,
  TicketFilter,
  SupportTicket
} from '../types';
import { AppError } from '../middleware/errorHandler';
import { generateTicketNumber } from '../utils/ticketUtils';

const prisma = getCoreDb();

export class TicketService {
  /**
   * Get all support tickets with optional filtering
   */
  static async getTickets(filters: TicketFilter = {}) {
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
      page = 1,
      limit = 20
    } = filters;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;
    if (assignedTo) where.assignedTo = assignedTo;
    if (userId) where.userId = userId;
    if (bookingId) where.bookingId = bookingId;
    if (companyId) where.companyId = companyId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [tickets, total] = await Promise.all([
      prisma.support_ticket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          },
          booking: {
            select: {
              id: true,
              bookingRef: true,
              serviceType: true,
              status: true
            }
          },
          interactions: {
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          _count: {
            select: {
              interactions: true,
              attachments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.support_ticket.count({ where })
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get a single ticket by ID
   */
  static async getTicketById(id: string) {
    const ticket = await prisma.support_ticket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true
          }
        },
        booking: {
          select: {
            id: true,
            bookingRef: true,
            serviceType: true,
            status: true,
            totalAmount: true,
            currency: true,
            travelDate: true
          }
        },
        interactions: {
          orderBy: { createdAt: 'asc' },
          include: {
            attachments: true
          }
        },
        attachments: true
      }
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    return ticket;
  }

  /**
   * Create a new support ticket
   */
  static async createTicket(data: CreateTicketRequest) {
    const ticketNumber = await generateTicketNumber();
    
    const ticket = await prisma.support_ticket.create({
      data: {
        ticketNumber,
        userId: data.userId,
        bookingId: data.bookingId,
        companyId: data.companyId,
        subject: data.subject,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: 'open',
        source: data.source || 'web',
        metadata: data.metadata
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return ticket;
  }

  /**
   * Update an existing ticket
   */
  static async updateTicket(id: string, data: UpdateTicketRequest) {
    const ticket = await prisma.support_ticket.findUnique({
      where: { id }
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    const updateData: any = { ...data };

    // Handle status transitions
    if (data.status === 'resolved' && !ticket.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    if (data.status === 'closed' && !ticket.closedAt) {
      updateData.closedAt = new Date();
      if (!ticket.resolvedAt) {
        updateData.resolvedAt = new Date();
      }
    }

    // Handle assignment
    if (data.assignedTo && !ticket.assignedAt) {
      updateData.assignedAt = new Date();
    }

    const updatedTicket = await prisma.support_ticket.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return updatedTicket;
  }

  /**
   * Add an interaction to a ticket
   */
  static async addInteraction(ticketId: string, data: CreateInteractionRequest) {
    const ticket = await prisma.support_ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    const interaction = await prisma.support_interaction.create({
      data: {
        ticketId,
        type: data.type,
        content: data.content,
        createdBy: data.createdBy,
        isInternal: data.isInternal || false,
        metadata: data.metadata
      }
    });

    // Update ticket's updatedAt timestamp
    await prisma.support_ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    });

    return interaction;
  }

  /**
   * Get ticket statistics
   */
  static async getTicketStats() {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      highPriorityTickets,
      byCategory
    ] = await Promise.all([
      prisma.support_ticket.count(),
      prisma.support_ticket.count({ where: { status: 'open' } }),
      prisma.support_ticket.count({ where: { status: 'in_progress' } }),
      prisma.support_ticket.count({ where: { status: 'resolved' } }),
      prisma.support_ticket.count({ where: { status: 'closed' } }),
      prisma.support_ticket.count({ where: { priority: 'high' } }),
      prisma.support_ticket.groupBy({
        by: ['category'],
        _count: true
      })
    ]);

    return {
      total: totalTickets,
      byStatus: {
        open: openTickets,
        in_progress: inProgressTickets,
        resolved: resolvedTickets,
        closed: closedTickets
      },
      highPriority: highPriorityTickets,
      byCategory: byCategory.reduce((acc: Record<string, number>, item: any) => {
        acc[item.category] = item._count;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  /**
   * Assign ticket to an agent
   */
  static async assignTicket(ticketId: string, agentId: string) {
    const ticket = await prisma.support_ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    const updatedTicket = await prisma.support_ticket.update({
      where: { id: ticketId },
      data: {
        assignedTo: agentId,
        assignedAt: new Date(),
        status: ticket.status === 'open' ? 'in_progress' : ticket.status
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return updatedTicket;
  }

  /**
   * Resolve a ticket
   */
  static async resolveTicket(ticketId: string, resolution: string) {
    const ticket = await prisma.support_ticket.findUnique({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    const updatedTicket = await prisma.support_ticket.update({
      where: { id: ticketId },
      data: {
        status: 'resolved',
        resolution,
        resolvedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return updatedTicket;
  }
}