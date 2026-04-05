export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId?: string;
  bookingId?: string;
  companyId?: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  source: 'web' | 'email' | 'phone' | 'chat' | 'api';
  assignedTo?: string;
  assignedAt?: Date;
  dueDate?: Date;
  slaBreachAt?: Date;
  resolution?: string;
  resolvedAt?: Date;
  closedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface SupportInteraction {
  id: string;
  ticketId: string;
  type: 'internal_note' | 'customer_reply' | 'system_event';
  content: string;
  createdBy?: string;
  isInternal: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

interface SupportAttachment {
  id: string;
  ticketId: string;
  interactionId?: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  uploadedBy?: string;
  createdAt: Date;
}

export interface CreateTicketRequest {
  userId?: string;
  bookingId?: string;
  companyId?: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  source?: 'web' | 'email' | 'phone' | 'chat' | 'api';
  metadata?: Record<string, any>;
}

export interface UpdateTicketRequest {
  subject?: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo?: string;
  resolution?: string;
  metadata?: Record<string, any>;
}

export interface CreateInteractionRequest {
  type: 'internal_note' | 'customer_reply' | 'system_event';
  content: string;
  createdBy?: string;
  isInternal?: boolean;
  metadata?: Record<string, any>;
}

export interface TicketFilter {
  status?: string;
  priority?: string;
  category?: string;
  assignedTo?: string;
  userId?: string;
  bookingId?: string;
  companyId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}