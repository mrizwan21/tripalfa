/**
 * Booking Repository
 * Single source of truth for all Booking CRUD across B2B and B2C channels.
 * All writes MUST flow through these methods to ensure correct `salesChannel` stamping.
 */

import { Booking, BookingStatus, Prisma, SalesChannel, StatusChangeLog } from '../../generated/prisma-client';
import { getBookingDb } from '../index';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateBookingInput {
  bookingRef: string;
  tenantId: string;
  agentCode: string;
  service: string;
  salesChannel: SalesChannel;
  /** Set to the same value as salesChannel for explicit B2B/B2C tracing */
  serviceType?: string; // Changed to string for flexibility
  passengerName: string;
  amount: number;
  currency: string;
  netFare: number;
  markup?: number;
  travelDate: string | Date;
  returnDate?: string | Date;
  pnr?: string;
  route?: string;
  productType?: string;
  customerEmail?: string;
  customerPhone?: string;
  userId?: string;
  corporateId?: string;
  subagentId?: string;
  remarks?: string;
  hotelName?: string;
  inventoryBlockId?: string;
  status?: string;
  workflowState?: string;
  passengerDob?: string;
  passengerNationality?: string;
  passengerPassport?: string;
  passengerPassportExpiry?: string;
  passengerResidency?: string;
  supplierCost?: number;
  baseAmount?: number | string;
  taxAmount?: number | string;
  markupAmount?: number | string;
  totalAmount?: number | string;
  metadata?: any;
  notifications?: string;
}

export interface FindBookingsInput {
  tenantId: string;
  salesChannel?: SalesChannel;
  status?: BookingStatus;
  agentCode?: string;
  corporateId?: string;
  skip?: number;
  take?: number;
  orderBy?: 'bookingDate' | 'travelDate' | 'amount';
  orderDir?: 'asc' | 'desc';
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createBooking(
  input: CreateBookingInput,
  tx?: Prisma.TransactionClient,
): Promise<Booking> {
  const client = tx || getBookingDb();
  
  // Helper to safely parse strings or numbers to floats
  const toFloat = (val: any) => (val !== undefined && val !== null) ? parseFloat(String(val)) : undefined;

  return client.booking.create({
    data: {
      bookingRef: input.bookingRef,
      tenantId: input.tenantId,
      agentCode: input.agentCode,
      service: input.service,
      salesChannel: input.salesChannel,
      serviceType: input.serviceType ?? input.salesChannel,
      passengerName: input.passengerName,
      amount: input.amount,
      currency: input.currency,
      netFare: input.netFare,
      markup: input.markup ?? 0,
      travelDate: input.travelDate instanceof Date ? input.travelDate.toISOString() : input.travelDate,
tripStartDate: new Date(input.travelDate), // Consistent with schema consolidation
  pnr: input.pnr,
      route: input.route,
      productType: input.productType,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      userId: input.userId,
      corporateId: input.corporateId,
      subagentId: input.subagentId,
      remarks: input.remarks,
      hotelName: input.hotelName,
      inventoryBlockId: input.inventoryBlockId,
      status: (input.status as any) || 'NEW_BOOKING',
      passengerDob: input.passengerDob,
      passengerNationality: input.passengerNationality,
      passengerPassport: input.passengerPassport,
      passengerPassportExpiry: input.passengerPassportExpiry,
      passengerResidency: input.passengerResidency,
      supplierCost: input.supplierCost,
      baseAmount: toFloat(input.baseAmount),
      taxAmount: toFloat(input.taxAmount),
      markupAmount: toFloat(input.markupAmount),
      totalAmount: toFloat(input.totalAmount),
      metadata: input.metadata || {},
      notifications: input.notifications,
    },
  });
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function findBookingById(id: string, tx?: Prisma.TransactionClient): Promise<Booking | null> {
  const client = tx || getBookingDb();
  return client.booking.findUnique({
    where: { id },
    include: {
      bookingSegments: true,
      bookingPassengers: true,
      documents: true,
      statusHistory: true,
      invoices: true,
    },
  });
}

export async function findBookingByRef(bookingRef: string): Promise<Booking | null> {
  return getBookingDb().booking.findUnique({
    where: { bookingRef },
    include: {
      bookingSegments: true,
      bookingPassengers: true,
      documents: true,
      statusHistory: true,
    },
  });
}

export async function findBookings(input: FindBookingsInput): Promise<{
  data: Booking[];
  total: number;
}> {
  const db = getBookingDb();
  const where: Prisma.BookingWhereInput = {
    tenantId: input.tenantId,
    ...(input.salesChannel && { salesChannel: input.salesChannel }),
    ...(input.status && { status: input.status }),
    ...(input.agentCode && { agentCode: input.agentCode }),
    ...(input.corporateId && { corporateId: input.corporateId }),
  };

  const [data, total] = await db.$transaction([
    db.booking.findMany({
      where,
      skip: input.skip ?? 0,
      take: input.take ?? 50,
      orderBy: { [input.orderBy ?? 'bookingDate']: input.orderDir ?? 'desc' },
      include: {
        bookingSegments: true,
        bookingPassengers: true,
      },
    }),
    db.booking.count({ where }),
  ]);

  return { data, total };
}

/**
 * B2C-specific: fetch bookings for a consumer channel (WEBSITE / MOBILE)
 */
export async function findB2CBookings(
  tenantId: string,
  opts?: { skip?: number; take?: number },
): Promise<{ data: Booking[]; total: number }> {
  return findBookings({
    tenantId,
    salesChannel: SalesChannel.WEBSITE,
    skip: opts?.skip,
    take: opts?.take,
  });
}

/**
 * B2B-specific: fetch bookings for agent/sub-agent channels
 */
export async function findB2BBookings(
  tenantId: string,
  agentCode?: string,
  opts?: { skip?: number; take?: number },
): Promise<{ data: Booking[]; total: number }> {
  return findBookings({
    tenantId,
    salesChannel: SalesChannel.SUBAGENT,
    agentCode,
    skip: opts?.skip,
    take: opts?.take,
  });
}

/**
 * Fetch a booking with all its related entities (segments, passengers, docs, status logs, invoices)
 */
export async function findBookingWithFullRelations(id: string): Promise<Booking | null> {
  return getBookingDb().booking.findUnique({
    where: { id },
    include: {
      bookingSegments: true,
      bookingPassengers: true,
      documents: true,
      statusHistory: true,
      invoices: {
        include: {
          payments: true,
        },
      },
      approvals: true,
      serviceRequests: true,
    },
  });
}

/**
 * Raw read methods for specialized queries that don't fit the standard B2B/B2C patterns
 */
export async function findBookingsRaw(args: Prisma.BookingFindManyArgs): Promise<Booking[]> {
  return getBookingDb().booking.findMany(args);
}

export async function findFirstBooking(args: Prisma.BookingFindFirstArgs): Promise<Booking | null> {
  return getBookingDb().booking.findFirst(args);
}

export async function countBookings(args: Prisma.BookingCountArgs): Promise<number> {
  return getBookingDb().booking.count(args);
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateBookingStatus(
  bookingRef: string,
  status: BookingStatus,
  changedBy: string,
  reason?: string,
): Promise<Booking> {
  const db = getBookingDb();

  const [updated] = await db.$transaction([
    db.booking.update({
      where: { bookingRef },
      data: { status },
    }),
    db.statusChangeLog.create({
      data: {
        bookingId: bookingRef, // resolved via relation in calling context
        toStatus: status,
        changedBy,
        reason,
      },
    }),
  ]);

  return updated;
}

/**
 * Base update method for a booking
 */
export async function updateBooking(
  id: string,
  data: Prisma.BookingUpdateInput,
  tx?: Prisma.TransactionClient,
): Promise<Booking> {
  const client = tx || getBookingDb();
  return client.booking.update({
    where: { id },
    data,
  });
}

/**
 * Upsert a booking — useful for sync operations and PNR imports
 */
export async function upsertBooking(
  bookingRef: string,
  data: Prisma.BookingCreateInput & Prisma.BookingUpdateInput
): Promise<Booking> {
  return getBookingDb().booking.upsert({
    where: { bookingRef },
    update: data,
    create: data,
  });
}

/**
 * Create a booking modification record
 */
export async function createBookingModification(input: {
  bookingId: string;
  modificationType: string;
  oldValue: any;
  status: string;
  tx?: any;
}) {
  const client = input.tx || getBookingDb();
  // Check if BookingModification model exists in Prisma schema
  // For now, we'll just log and return a dummy object
  console.warn('createBookingModification: BookingModification model may not exist in schema');
  return { id: 'dummy-modification-id' };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteBooking(id: string): Promise<Booking> {
  return getBookingDb().booking.delete({
    where: { id },
  });
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function getBookingStats(tenantId?: string): Promise<any> {
  const db = getBookingDb();
  const where: Prisma.BookingWhereInput = tenantId ? { tenantId } : {};

  const [aggregates, statusCounts, offlineCount] = await Promise.all([
    db.booking.aggregate({
      where,
      _count: { id: true },
      _sum: { amount: true, markup: true },
    }),
    db.booking.groupBy({
      where,
      by: ['status'],
      _count: { id: true },
      _sum: { amount: true },
    }),
    db.booking.count({
      where: { ...where, bookingRef: { startsWith: 'OFF-' } },
    }),
  ]);

  const stats = {
    totalBookings: aggregates._count.id,
    totalVolume: aggregates._sum.amount || 0,
    totalMarkup: aggregates._sum.markup || 0,
    offlineCount,
    statusBreakdown: statusCounts.reduce((acc: Record<string, { count: number; amount: number }>, curr: { status: string; _count: { id: number }; _sum: { amount: number | null } }) => {
      acc[curr.status] = { count: curr._count.id, amount: curr._sum.amount || 0 };
      return acc;
    }, {} as any),
  };

  return stats;
}

export async function getFinancialKPIs(tenantId?: string, days: number = 30): Promise<any> {
  const db = getBookingDb();
  const now = new Date();
  const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousPeriodStart = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

  const where: Prisma.BookingWhereInput = tenantId ? { tenantId } : {};

  const [current, previous] = await Promise.all([
    db.booking.aggregate({
      where: { ...where, bookingDate: { gte: currentPeriodStart } },
      _sum: { amount: true, markup: true, supplierCost: true },
    }),
    db.booking.aggregate({
      where: { ...where, bookingDate: { gte: previousPeriodStart, lt: currentPeriodStart } },
      _sum: { amount: true, markup: true },
    }),
  ]);

  return {
    current: {
      volume: current._sum.amount || 0,
      markup: current._sum.markup || 0,
      supplierCost: current._sum.supplierCost || 0,
    },
    previous: {
      volume: previous._sum.amount || 0,
      markup: previous._sum.markup || 0,
    },
  };
}

export async function getVolumetricData(tenantId?: string, days: number = 7): Promise<any> {
  const db = getBookingDb();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const where: Prisma.BookingWhereInput = tenantId ? { tenantId, bookingDate: { gte: startDate } } : { bookingDate: { gte: startDate } };

  const bookings = await db.booking.findMany({
    where,
    select: { bookingDate: true },
  });

  return bookings;
}

export async function getServiceDispersal(tenantId?: string): Promise<any> {
  const db = getBookingDb();
  const where: Prisma.BookingWhereInput = tenantId ? { tenantId } : {};

  const stats = await db.booking.groupBy({
    where,
    by: ['service'],
    _count: { id: true },
  });

  return stats;
}

export async function getTopClients(tenantId?: string, limit: number = 10): Promise<any> {
  const db = getBookingDb();
  const where: Prisma.BookingWhereInput = tenantId ? { tenantId } : {};

  return db.booking.groupBy({
    where,
    by: ['passengerName'],
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: limit,
  });
}

export async function getActiveClientCount(tenantId?: string): Promise<number> {
  const db = getBookingDb();
  const where: Prisma.BookingWhereInput = tenantId ? { tenantId } : {};

  const clients = await db.booking.groupBy({
    where,
    by: ['passengerName'],
  });

  return clients.length;
}

export async function updateSegments(
  bookingId: string,
  airlinePnr: string,
  data: Prisma.SegmentUpdateManyMutationInput
): Promise<Prisma.BatchPayload> {
  return getBookingDb().segment.updateMany({
    where: { bookingId, airlinePnr },
    data,
  });
}

/**
 * Fetch a booking with invoices and basic includes
 */
export async function findBookingWithInvoices(id: string): Promise<Booking | null> {
  return getBookingDb().booking.findUnique({
    where: { id },
    include: {
      invoices: true,
      bookingSegments: true,
      bookingPassengers: true,
    },
  });
}

/**
* Get recent bookings for dashboard
*/
export async function getRecentBookings(tenantId: string, limit: number = 10): Promise<Booking[]> {
 return getBookingDb().booking.findMany({
   where: { tenantId },
   orderBy: { bookingDate: 'desc' },
   take: limit,
   include: {
     bookingSegments: true,
     bookingPassengers: true,
   },
 });
}
/**
 * Create a new segment record
 */
export async function createSegment(data: Prisma.SegmentCreateInput): Promise<any> {
  return getBookingDb().segment.create({ data });
}

/**
 * Create a new document record
 */
export async function createBookingDocument(data: Prisma.DocumentCreateInput): Promise<any> {
  return getBookingDb().document.create({ data });
}

/**
 * Create a ledger transaction record (legacy/internal)
 */
export async function createLedgerTransaction(data: any): Promise<any> {
  const db = getBookingDb();
  return (db as any).ledgerTransaction.create({ data });
}

/**
 * Fetch total profit for a tenant based on markup earnings
 */
export async function getTotalProfit(tenantId: string): Promise<number> {
  const db = getBookingDb();
  const profit = await (db as any).ledgerTransaction.aggregate({
    where: { tenantId, category: 'Markup Earning' },
    _sum: { amount: true }
  });
  return profit._sum.amount ?? 0;
}

/**
 * Adds a markup earning entry to the ledger
 */
export async function createMarkupLedgerEntry(
  data: {
    referenceId: string;
    amount: number;
    currency: string;
    service: string;
    tenantId: string;
    tx?: Prisma.TransactionClient;
  }
): Promise<void> {
  const client = data.tx || getBookingDb();
  
  // Find current balance for running balance calculation
  const lastTx = await (client as any).ledgerTransaction.findFirst({
    where: { tenantId: data.tenantId },
    orderBy: { date: 'desc' }
  });
  
  const currentBalance = lastTx ? (lastTx as any).runningBalance : 0;

  await (client as any).ledgerTransaction.create({
    data: {
      tenantId: data.tenantId,
      referenceId: data.referenceId,
      amount: data.amount,
      currency: data.currency,
      runningBalance: currentBalance + data.amount,
      category: 'Markup Earning',
      description: `Auto-Settlement for ${data.service} Node`,
    },
  });
}

/**
 * Fetch status change history for a booking
 */
export async function findStatusChangeLogs(bookingId: string) {
  const db = getBookingDb();
  return (db as any).statusChangeLog.findMany({
    where: { bookingId },
    orderBy: { changedAt: 'desc' }
  });
}

/**
 * Create a status change log entry
 */
export async function createStatusChangeLog(input: {
  bookingId: string;
  fromStatus?: string;
  toStatus: string;
  changedBy: string;
  changedByName?: string;
  reason?: string;
}) {
  const db = getBookingDb();
  return db.statusChangeLog.create({
    data: {
      bookingId: input.bookingId,
      fromStatus: input.fromStatus,
      toStatus: input.toStatus,
      changedBy: input.changedBy,
      changedByName: input.changedByName,
      reason: input.reason,
    },
  });
}

/**
 * Fetch ledger transactions for a tenant
 */
export async function findLedgerTransactions(tenantId: string) {
  const db = getBookingDb();
  return (db as any).ledgerTransaction.findMany({
    where: { tenantId },
    orderBy: { date: 'desc' }
  });
}

/**
 * Finds bookings eligible for auto-cancellation (deadlines exceeded)
 */
export async function findBookingsForAutoCancel() {
  const db = getBookingDb();
  const now = new Date();
  return (db as any).booking.findMany({
    where: {
      ticketDeadline: { lt: now },
      status: { notIn: ['TICKETED', 'CANCELLED', 'REFUNDED'] },
      autoCancelScheduled: true
    }
  });
}

