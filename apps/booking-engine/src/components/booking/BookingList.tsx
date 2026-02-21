import React from 'react';
import { Booking } from '../../lib/srs-types';
import { BookingCard } from './BookingCard';

export function BookingList({ bookings }: { bookings: Booking[] }) {
  if (!bookings || bookings.length === 0) return <div>No bookings found</div>;
  return (
    <div className="space-y-4">
      {bookings.map(b => <BookingCard key={b.id} booking={b} />)}
    </div>
  );
}
