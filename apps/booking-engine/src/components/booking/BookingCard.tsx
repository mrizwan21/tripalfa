import React from 'react';
import { Booking } from '../../lib/srs-types';
import { Link } from 'react-router-dom';
import { Plane, Hotel } from 'lucide-react';

export function BookingCard({ booking }: { booking: Booking }) {
  const isFlight = booking.product === 'flight';

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-5 flex flex-col sm:flex-row justify-between gap-4">
      <div className="flex-1 min-w-0">
        {/* Product Type */}
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              isFlight
                ? 'bg-blue-50 text-blue-500'
                : 'bg-violet-50 text-violet-500'
            }`}
          >
            {isFlight ? (
              <Plane size={14} className="-rotate-45" />
            ) : (
              <Hotel size={14} />
            )}
          </div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {booking.product} Booking
          </span>
        </div>

        {/* Reference */}
        <h3 className="text-sm font-bold text-gray-900 tracking-tight truncate mb-1">
          {booking.reference || booking.id}
        </h3>

        {/* Date */}
        <p className="text-sm text-gray-500">
          {new Date(booking.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </p>

        {/* Status */}
        <div className="mt-2 inline-flex items-center">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              booking.status === 'Confirmed' ||
              booking.status === 'Issued' ||
              booking.status === 'Vouchered'
                ? 'bg-emerald-50 text-emerald-600'
                : booking.status === 'On hold'
                ? 'bg-amber-50 text-amber-600'
                : booking.status === 'Canceled' ||
                  booking.status === 'Cancelled'
                ? 'bg-rose-50 text-rose-600'
                : 'bg-gray-50 text-gray-500'
            }`}
          >
            {booking.status}
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex flex-col items-start sm:items-end justify-between gap-3 min-w-[120px] pt-1 sm:pt-0 border-t sm:border-t-0 border-dashed border-gray-100 sm:pl-4">
        <div className="text-right">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            Total
          </p>
          <p className="text-lg font-bold text-gray-900">
            {booking.total?.currency} {booking.total?.amount?.toLocaleString()}
          </p>
        </div>

        <Link
          to={`/booking/${booking.id}`}
          className="bg-[#003b95] text-white text-sm font-medium rounded-xl px-4 py-2 hover:opacity-90 transition-opacity duration-200"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
