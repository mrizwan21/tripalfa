import { getCoreDb } from '@tripalfa/shared-database';

const prisma = getCoreDb();

/**
 * Generate a unique ticket number in format TICKET-YYYYMMDD-XXXXX
 */
export async function generateTicketNumber(): Promise<string> {
  const date = new Date();
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  
  // Get the count of tickets created today
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const todayCount = await prisma.support_ticket.count({
    where: {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });
  
  const sequence = (todayCount + 1).toString().padStart(5, '0');
  return `TICKET-${datePart}-${sequence}`;
}

/**
 * Validate ticket priority
 */
function isValidPriority(priority: string): boolean {
  const validPriorities = ['low', 'medium', 'high', 'critical'];
  return validPriorities.includes(priority);
}

/**
 * Validate ticket status
 */
function isValidStatus(status: string): boolean {
  const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
  return validStatuses.includes(status);
}

/**
 * Validate ticket source
 */
function isValidSource(source: string): boolean {
  const validSources = ['web', 'email', 'phone', 'chat', 'api'];
  return validSources.includes(source);
}

/**
 * Calculate SLA breach time based on priority
 */
function calculateSLABreachTime(priority: string): Date {
  const now = new Date();
  const slaHours = {
    critical: 2,    // 2 hours for critical
    high: 4,        // 4 hours for high
    medium: 24,     // 24 hours for medium
    low: 72         // 72 hours for low
  };
  
  const hours = slaHours[priority as keyof typeof slaHours] || 24;
  const breachTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
  
  return breachTime;
}

/**
 * Format ticket for response
 */
export function formatTicketResponse(ticket: any) {
  return {
    id: ticket.id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    source: ticket.source,
    userId: ticket.userId,
    bookingId: ticket.bookingId,
    companyId: ticket.companyId,
    assignedTo: ticket.assignedTo,
    assignedAt: ticket.assignedAt,
    dueDate: ticket.dueDate,
    slaBreachAt: ticket.slaBreachAt,
    resolution: ticket.resolution,
    resolvedAt: ticket.resolvedAt,
    closedAt: ticket.closedAt,
    metadata: ticket.metadata,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    user: ticket.user,
    booking: ticket.booking,
    interactionCount: ticket._count?.interactions || 0,
    attachmentCount: ticket._count?.attachments || 0
  };
}