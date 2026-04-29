/**
 * 09-bookings.ts — Booking, Segment, Document, BookingPassenger, BookingQueue
 */
import { PrismaClient } from '../../generated/prisma-client';
import { faker } from '@faker-js/faker';
import { TENANT_IDS, USER_IDS } from './02-tenants.js';
import { log, genBookingRef, randomPastDate, randomFutureDate, daysFromNow, pickOne, pickN, AIRPORTS, AIRLINES, COUNTRIES } from './helpers/faker.js';

export const BOOKING_IDS: Record<string, string> = {};

export async function seedBookings(prisma: PrismaClient) {
  console.log('\n📅 [09-bookings] Seeding bookings...');

  const statuses = [
    { s: 'NEW_BOOKING', count: 5 },
    { s: 'PROVISIONAL', count: 8 },
    { s: 'AUTHORIZED', count: 5 },
    { s: 'TICKETED', count: 15 },
    { s: 'DOCUMENTED', count: 5 },
    { s: 'CANCELLED', count: 5 },
    { s: 'REFUNDED', count: 3 },
    { s: 'VOID', count: 2 },
    { s: 'REFUND_ON_HOLD', count: 2 },
  ];

  let bookingCount = 0;
  let segmentCount = 0;
  let passengerCount = 0;
  let documentCount = 0;

  for (const statusDef of statuses) {
    for (let i = 0; i < statusDef.count; i++) {
      const id = `booking-${statusDef.s.toLowerCase()}-${i}`;
      BOOKING_IDS[id] = id;
      
      const isFlight = faker.datatype.boolean({ probability: 0.7 });
      const service = isFlight ? 'Flight' : faker.datatype.boolean({ probability: 0.8 }) ? 'Hotel' : 'Car';
      const bookingDate = randomPastDate(1, 90);
      const travelDate = randomFutureDate(1, 90);
      
      const ref = genBookingRef();
      const amount = faker.number.float({ min: 100, max: 2000, fractionDigits: 2 });
      const markup = amount * 0.05;
      const netFare = amount - markup;

      await prisma.booking.create({
        data: {
          id,
          bookingRef: ref,
          pnr: statusDef.s !== 'NEW_BOOKING' ? faker.string.alphanumeric(6).toUpperCase() : null,
          tenantId: pickOne([TENANT_IDS.sub1, TENANT_IDS.sub2, TENANT_IDS.sub5, TENANT_IDS.corp1]),
          salesChannel: 'SUBAGENT',
          agentCode: 'SUBA001',
          service,
          status: statusDef.s as any,
          ticketed: ['TICKETED', 'DOCUMENTED', 'REFUNDED', 'VOID'].includes(statusDef.s),
          dispatched: statusDef.s === 'DOCUMENTED',
          bookingDate,
          travelDate: travelDate.toISOString().split('T')[0],
          tripStartDate: travelDate,
          passengerName: `${faker.person.firstName()} ${faker.person.lastName()}`,
          amount,
          currency: 'BHD',
          markup,
          netFare,
          destination: isFlight ? pickOne(AIRPORTS) : pickOne(COUNTRIES),
          paymentStatus: ['TICKETED', 'DOCUMENTED'].includes(statusDef.s) ? 'PAID' : 'PENDING',
          tktLater: statusDef.s === 'PROVISIONAL',
          ticketDeadline: statusDef.s === 'PROVISIONAL' ? daysFromNow(2) : null,
          refundAmount: statusDef.s === 'REFUNDED' ? amount * 0.8 : null,
          penaltyAmount: statusDef.s === 'REFUNDED' ? amount * 0.2 : null,
        },
      });
      bookingCount++;

      // Passengers
      const numPax = faker.number.int({ min: 1, max: 4 });
      for (let p = 0; p < numPax; p++) {
        await prisma.bookingPassenger.create({
          data: {
            bookingId: id,
            firstName: faker.person.firstName(),
            lastName: faker.person.lastName(),
            email: p === 0 ? faker.internet.email() : null,
            passengerType: p === 0 ? 'ADULT' : pickOne(['ADULT', 'CHILD', 'INFANT']),
          },
        });
        passengerCount++;
      }

      // Segments
      if (statusDef.s !== 'NEW_BOOKING') {
        if (isFlight) {
          const numSegs = faker.number.int({ min: 1, max: 3 });
          for (let s = 0; s < numSegs; s++) {
            await prisma.segment.create({
              data: {
                bookingId: id,
                type: 'Flight',
                airlineCode: pickOne(AIRLINES),
                flightNumber: String(faker.number.int({ min: 100, max: 9999 })),
                origin: pickOne(AIRPORTS),
                destination: pickOne(AIRPORTS),
                departureDateTime: travelDate,
                arrivalDateTime: daysFromNow(90),
                class: pickOne(['Economy', 'Business', 'First']),
                status: 'HK',
              },
            });
            segmentCount++;
          }
        } else if (service === 'Hotel') {
          await prisma.segment.create({
            data: {
              bookingId: id,
              type: 'Hotel',
              hotelName: `${faker.company.name()} Hotel`,
              checkInDate: travelDate,
              checkOutDate: daysFromNow(95),
              roomType: pickOne(['Standard', 'Deluxe', 'Suite']),
              noOfNights: faker.number.int({ min: 1, max: 7 }),
              status: 'HK',
            },
          });
          segmentCount++;
        }
      }

      // Documents (Tickets)
      if (['TICKETED', 'DOCUMENTED', 'REFUNDED', 'VOID'].includes(statusDef.s)) {
        for (let d = 0; d < numPax; d++) {
          await prisma.document.create({
            data: {
              bookingId: id,
              type: 'TICKET',
              documentNo: `${faker.string.numeric(3)}-${faker.string.numeric(10)}`,
              status: statusDef.s === 'VOID' ? 'Voided' : statusDef.s === 'REFUNDED' ? 'Refunded' : 'Active',
              issuedAt: bookingDate,
              issuedBy: USER_IDS.sub1Agent,
            },
          });
          documentCount++;
        }
      }

      // Status Change Logs
      await prisma.statusChangeLog.create({
        data: {
          bookingId: id,
          fromStatus: null,
          toStatus: 'NEW_BOOKING',
          changedBy: USER_IDS.sub1Agent,
          changedAt: bookingDate,
        },
      });
      if (statusDef.s !== 'NEW_BOOKING') {
        await prisma.statusChangeLog.create({
          data: {
            bookingId: id,
            fromStatus: 'NEW_BOOKING',
            toStatus: statusDef.s,
            changedBy: USER_IDS.sub1Agent,
            changedAt: new Date(bookingDate.getTime() + 1000 * 60 * 5), // 5 mins later
          },
        });
      }
    }
  }

  log('09-bookings', 'Booking', bookingCount);
  log('09-bookings', 'BookingPassenger', passengerCount);
  log('09-bookings', 'Segment', segmentCount);
  log('09-bookings', 'Document', documentCount);
}
