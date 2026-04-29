/**
 * Document Repository
 * Centralized management for tickets, invoices, and notes.
 */

import { getBookingDb } from '../index';
import { Document, Prisma } from '../../generated/prisma-client';

export async function findDocument(id: string): Promise<Document | null> {
  return getBookingDb().document.findUnique({
    where: { id },
  });
}

export async function findDocumentsByBooking(bookingId: string): Promise<Document[]> {
  return getBookingDb().document.findMany({
    where: { bookingId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function findActiveTicket(bookingId: string): Promise<Document | null> {
  return getBookingDb().document.findFirst({
    where: { bookingId, type: 'TICKET', status: 'Active' },
  });
}

export async function updateDocument(id: string, data: Prisma.DocumentUpdateInput): Promise<Document> {
  return getBookingDb().document.update({
    where: { id },
    data,
  });
}

export async function createDocument(data: Prisma.DocumentCreateInput): Promise<Document> {
  return getBookingDb().document.create({ data });
}

export async function findDocuments(args: Prisma.DocumentFindManyArgs): Promise<Document[]> {
  return getBookingDb().document.findMany(args);
}

export async function updateManyDocuments(
  where: Prisma.DocumentWhereInput,
  data: Prisma.DocumentUpdateManyMutationInput
): Promise<Prisma.BatchPayload> {
  return getBookingDb().document.updateMany({ where, data });
}
