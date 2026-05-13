import React from "react";
import { Booking } from "../../lib/srs-types";
import { BookingCard } from "./BookingCard";
import { Package } from "lucide-react";

interface BookingListProps {
  bookings: Booking[];
  emptyTitle?: string;
  emptyDescription?: string;
}

export function BookingList({
  bookings,
  emptyTitle = "No Bookings Found",
  emptyDescription = "Try adjusting your filters or start a new search.",
}: BookingListProps) {
  if (!bookings || bookings.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
          <Package className="text-gray-300 w-7 h-7" />
        </div>
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-1">
          {emptyTitle}
        </h4>
        <p className="text-xs font-medium text-gray-400">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {bookings.map((booking) => (
        <BookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  );
}
