/**
 * Hotel Repository
 * Manages hotel-specific bookings (LiteAPI), mappings, and prebook sessions.
 */

import { 
  LiteApiBooking, 
  PrebookSession, 
  SupplierHotelMapping, 
  Prisma 
} from '../../generated/prisma-client';
import { getBookingDb } from '../index';

// ─── Hotel Mapping ───────────────────────────────────────────────────────────

export async function findHotelMapping(supplierHotelId: string): Promise<SupplierHotelMapping | null> {
  return getBookingDb().supplierHotelMapping.findFirst({
    where: { supplierHotelId }
  });
}

export async function createHotelMapping(data: {
  supplierHotelId: string;
  localHotelId?: string;
  hotelName?: string;
}): Promise<SupplierHotelMapping> {
  return getBookingDb().supplierHotelMapping.create({ data });
}

// ─── LiteAPI Bookings ────────────────────────────────────────────────────────

export interface CreateLiteApiBookingInput {
  bookingId: string;
  transactionId?: string;
  localBookingId: string;
  status: string;
  hotelId: string;
  hotelName: string;
  checkIn: Date;
  checkOut: Date;
  totalAmount: string;
  currency: string;
  metadata?: any;
}

export async function createLiteApiBooking(
  input: CreateLiteApiBookingInput,
  tx?: Prisma.TransactionClient
): Promise<LiteApiBooking> {
  const client = tx || getBookingDb();

  return client.liteApiBooking.create({
    data: {
      bookingId: input.bookingId,
      transactionId: input.transactionId,
      localBookingId: input.localBookingId,
      status: input.status,
      hotelId: input.hotelId,
      hotelName: input.hotelName,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      totalAmount: input.totalAmount,
      currency: input.currency,
      metadata: input.metadata || {},
    }
  });
}

export async function findLiteApiBookingByLocalId(localBookingId: string): Promise<LiteApiBooking | null> {
  return getBookingDb().liteApiBooking.findFirst({
    where: { localBookingId }
  });
}

// ─── Prebook Sessions ────────────────────────────────────────────────────────

export interface CreatePrebookSessionInput {
  transactionId: string;
  offerId: string;
  hotelId: string;
  price: string;
  currency: string;
  guestEmail?: string;
  guestName?: string;
  expiresAt: Date;
  status: string;
  bookingId?: string;
  searchParams?: any;
}

export async function createPrebookSession(
  input: CreatePrebookSessionInput,
  tx?: Prisma.TransactionClient
): Promise<PrebookSession> {
  const client = tx || getBookingDb();

  return client.prebookSession.create({
    data: {
      transactionId: input.transactionId,
      offerId: input.offerId,
      hotelId: input.hotelId,
      price: input.price,
      currency: input.currency,
      guestEmail: input.guestEmail,
      guestName: input.guestName,
      expiresAt: input.expiresAt,
      status: input.status,
      bookingId: input.bookingId,
      searchParams: input.searchParams || {},
    }
  });
}

export async function getPrebookSession(transactionId: string): Promise<PrebookSession | null> {
  return getBookingDb().prebookSession.findUnique({
    where: { transactionId }
  });
}

export async function updatePrebookSessionStatus(
  transactionId: string, 
  status: string,
  tx?: Prisma.TransactionClient
): Promise<PrebookSession> {
  const client = tx || getBookingDb();
  return client.prebookSession.update({
    where: { transactionId },
    data: { status }
  });
}
