/**
 * Flight Repository
 * Manages flight-specific offers, offer requests, and Duffel orders.
 */

import { 
  DuffelOffer, 
  DuffelOfferRequest, 
  DuffelOrder, 
  Prisma 
} from '../../generated/prisma-client';
import { getBookingDb } from '../index';

// ─── Duffel Offer Requests ───────────────────────────────────────────────────

export interface CreateDuffelOfferRequestInput {
  id: string; // From Duffel
  userId?: string;
  origin: string;
  destination: string;
  departureDate: Date;
  returnDate?: Date | null;
  passengers: any;
  cabinClass?: string;
  rawResponse: any;
}

export async function createDuffelOfferRequest(
  input: CreateDuffelOfferRequestInput,
  tx?: Prisma.TransactionClient
): Promise<DuffelOfferRequest> {
  const client = tx || getBookingDb();
  return client.duffelOfferRequest.create({
    data: {
      id: input.id,
      userId: input.userId,
      origin: input.origin,
      destination: input.destination,
      departureDate: input.departureDate,
      returnDate: input.returnDate,
      passengers: input.passengers,
      cabinClass: input.cabinClass || 'economy',
      rawResponse: input.rawResponse,
    }
  });
}

// ─── Duffel Offers ───────────────────────────────────────────────────────────

export interface CreateDuffelOfferInput {
  id: string;
  offerRequestId: string;
  totalAmount: string;
  taxAmount?: string;
  currency: string;
  ownerId: string;
  expiresAt: Date;
  rawResponse: any;
}

export async function createDuffelOffers(
  offers: CreateDuffelOfferInput[],
  tx?: Prisma.TransactionClient
): Promise<Prisma.BatchPayload> {
  const client = tx || getBookingDb();
  return client.duffelOffer.createMany({
    data: offers,
    skipDuplicates: true,
  });
}

// ─── Duffel Orders ───────────────────────────────────────────────────────────

export interface CreateDuffelOrderInput {
  orderId: string;
  bookingId: string;
  clientKey: string;
  pnr?: string;
  status?: string;
  totalAmount: number;
  totalCurrency: string;
  passengers: any;
  slices: any;
  taxAmount?: number;
  taxCurrency?: string;
  metadata?: any;
}

export async function createDuffelOrder(
  input: CreateDuffelOrderInput,
  tx?: Prisma.TransactionClient
): Promise<DuffelOrder> {
  const client = tx || getBookingDb();
  return client.duffelOrder.create({
    data: {
      orderId: input.orderId,
      bookingId: input.bookingId,
      clientKey: input.clientKey,
      pnr: input.pnr,
      status: input.status || 'CREATED',
      totalAmount: input.totalAmount,
      totalCurrency: input.totalCurrency,
      passengers: input.passengers,
      slices: input.slices,
      taxAmount: input.taxAmount,
      taxCurrency: input.taxCurrency,
      metadata: input.metadata || {},
    }
  });
}

export async function findDuffelOrderByLocalId(localBookingId: string): Promise<DuffelOrder | null> {
  return getBookingDb().duffelOrder.findFirst({
    where: { bookingId: localBookingId }
  });
}
