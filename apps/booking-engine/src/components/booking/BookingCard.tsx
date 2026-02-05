import React from 'react';
import { Booking } from '../../lib/srs-types';
import { Link } from 'react-router-dom';

export function BookingCard({ booking }: { booking: Booking }) {
  return (
    <div className="border rounded p-4 flex justify-between">
      <div>
        <div className="text-sm text-gray-500">{booking.product.toUpperCase()}</div>
        <div className="font-medium">{booking.reference}</div>
        <div className="text-sm">{booking.createdAt}</div>
        <div className="text-sm">Status: {booking.status}</div>
      </div>
      <div className="text-right">
        <div className="font-semibold">{booking.total.currency} {booking.total.amount.toFixed(2)}</div>
        <Link to={`/booking/${booking.id}`} className="inline-block mt-2 text-sm text-blue-600">View</Link>
      </div>
    </div>
  );
}