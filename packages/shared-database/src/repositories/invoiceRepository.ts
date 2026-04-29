/**
 * Invoice Repository
 * Handles invoices and related financial events/payments.
 */

import { Invoice, FinancialEvent, Prisma } from '../../generated/prisma-client';
import { getBookingDb } from '../index';

export async function createInvoice(data: Prisma.InvoiceCreateInput): Promise<Invoice> {
  return getBookingDb().invoice.create({ data });
}

export async function findInvoiceById(id: string): Promise<Invoice | null> {
  return getBookingDb().invoice.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          bookingPassengers: true,
          bookingSegments: true,
        },
      },
      payments: true,
    },
  });
}

export async function findInvoiceByBookingId(bookingId: string): Promise<Invoice | null> {
  return getBookingDb().invoice.findFirst({
    where: {
      OR: [{ bookingId }, { invoiceNumber: bookingId }],
    },
    include: {
      booking: {
        include: {
          bookingPassengers: true,
          bookingSegments: true,
        },
      },
      payments: true,
    },
  });
}

export async function updateInvoice(id: string, data: Prisma.InvoiceUpdateInput): Promise<Invoice> {
  return getBookingDb().invoice.update({
    where: { id },
    data,
  });
}

export async function createFinancialEvent(data: Prisma.FinancialEventCreateInput): Promise<FinancialEvent> {
  return getBookingDb().financialEvent.create({ data });
}

export async function findFinancialEventById(id: string): Promise<FinancialEvent | null> {
  return getBookingDb().financialEvent.findUnique({
    where: { id },
  });
}
