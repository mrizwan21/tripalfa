/**
 * Passenger Repository
 * Typed CRUD for BookingPassenger — used by both B2B and B2C after a booking is created.
 * Replaces duplicated inline `prisma.bookingPassenger.create()` calls in booking-service
 * and b2b-backend routes.
 */

import { BookingPassenger, Prisma } from '../../generated/prisma-client';
import { getBookingDb } from '../index';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UpsertPassengerInput {
  bookingId: string;
  firstName: string;
  lastName: string;
  passengerType?: 'ADULT' | 'CHILD' | 'INFANT';
  email?: string;
  phone?: string;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createPassenger(
  input: UpsertPassengerInput,
): Promise<BookingPassenger> {
  return getBookingDb().bookingPassenger.create({
    data: {
      bookingId: input.bookingId,
      firstName: input.firstName,
      lastName: input.lastName,
      passengerType: input.passengerType ?? 'ADULT',
      email: input.email,
      phone: input.phone,
    },
  });
}

export async function createPassengers(
  inputs: UpsertPassengerInput[],
): Promise<Prisma.BatchPayload> {
  return getBookingDb().bookingPassenger.createMany({
    data: inputs.map((p) => ({
      bookingId: p.bookingId,
      firstName: p.firstName,
      lastName: p.lastName,
      passengerType: p.passengerType ?? 'ADULT',
      email: p.email,
      phone: p.phone,
    })),
    skipDuplicates: true,
  });
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function findPassengersByBooking(
  bookingId: string,
): Promise<BookingPassenger[]> {
  return getBookingDb().bookingPassenger.findMany({
    where: { bookingId },
    orderBy: { createdAt: 'asc' },
  });
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deletePassengersByBooking(
  bookingId: string,
): Promise<Prisma.BatchPayload> {
  return getBookingDb().bookingPassenger.deleteMany({
    where: { bookingId },
  });
}
