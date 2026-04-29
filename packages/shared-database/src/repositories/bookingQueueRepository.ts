/**
 * Booking Queue Repository
 * Handles verification, ticketing, and refund queues.
 */

import { BookingQueue, Prisma } from '../../generated/prisma-client';
import { getBookingDb } from '../index';

export async function createQueueEntry(data: Prisma.BookingQueueCreateInput): Promise<BookingQueue> {
  return getBookingDb().bookingQueue.create({ data });
}

export async function findQueues(params: {
  where?: Prisma.BookingQueueWhereInput;
  skip?: number;
  take?: number;
  includeBooking?: boolean;
}): Promise<BookingQueue[]> {
  return getBookingDb().bookingQueue.findMany({
    where: params.where,
    skip: params.skip,
    take: params.take,
    include: params.includeBooking ? { booking: true } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

export async function countQueues(where?: Prisma.BookingQueueWhereInput): Promise<number> {
  return getBookingDb().bookingQueue.count({ where });
}

export async function updateQueueEntry(id: string, data: Prisma.BookingQueueUpdateInput): Promise<BookingQueue> {
  return getBookingDb().bookingQueue.update({
    where: { id },
    data,
  });
}

export async function findFirstQueueEntryByBookingId(bookingId: string): Promise<BookingQueue | null> {
  return getBookingDb().bookingQueue.findFirst({
    where: { bookingId },
  });
}
