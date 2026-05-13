import React from "react";
import { Booking } from "../../lib/srs-types";
import { BookingActions } from "./BookingActions";
import {
  Plane,
  Hotel,
  Calendar,
  CreditCard,
  ArrowRight,
  Package,
} from "lucide-react";
import { Link } from "react-router-dom";

function StatusBadge({ status }: { status?: string }) {
  const s = status || "Unknown";

  const configs: Record<string, string> = {
    // Success states
    Confirmed: "badge-success",
    Issued: "badge-success",
    Vouchered: "badge-success",
    Ticketed: "badge-success",
    "Service confirmed": "badge-success",
    Used: "badge-success",

    // Warning states
    "On hold": "badge-warning",
    Hold: "badge-warning",
    "Additional request": "badge-warning",

    // Info / In-progress states
    "In process": "badge-primary",
    Processing: "badge-primary",
    "Cancel in process": "badge-primary",

    // Error / Terminal states
    Canceled: "badge-destructive",
    Cancelled: "badge-destructive",
    Expired: "badge-destructive",
    "Service rejected": "badge-destructive",
    Failed: "badge-destructive",

    // Neutral states
    Refunded: "badge-secondary",
    "Refund on hold": "badge-secondary",
  };

  const badgeClass = configs[s] || "badge-secondary";

  return (
    <span className={`badge ${badgeClass}`}>
      {s}
    </span>
  );
}

export function BookingTable({ items }: { items: Booking[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
          <Package className="text-gray-300 w-8 h-8" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-900 uppercase tracking-widest">
            No Bookings Found
          </p>
          <p className="text-xs font-medium text-gray-400">
            Try adjusting your filters or start a new search.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {items.map((b, index) => {
        const isFlight = b.product === "flight";

        return (
          <div
            key={b.id}
            data-testid={`booking-card-${index}`}
            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden flex flex-col"
          >
            {/* Accent line */}
            <div className="h-0.5 w-full bg-gradient-to-r from-blue-500/20 via-transparent to-transparent" />

            <div className="flex flex-col flex-1 p-5 gap-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                        isFlight
                          ? "bg-blue-50 text-blue-500"
                          : "bg-violet-50 text-violet-500"
                      }`}
                    >
                      {isFlight ? (
                        <Plane size={12} className="-rotate-45" />
                      ) : (
                        <Hotel size={12} />
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider truncate">
                      {b.product} Booking
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 tracking-tight truncate leading-tight">
                    {b.bookingId || b.reference}
                  </h3>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={b.status} />
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mt-2 flex-1">
                <div className="space-y-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={10} className="shrink-0" /> Date
                  </p>
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {new Date(b.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="space-y-1 min-w-0">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard size={10} className="shrink-0" /> Amount
                  </p>
                  <p className="text-sm font-bold text-gray-700 truncate">
                    {b.total?.currency} {b.total?.amount?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-dashed border-gray-100" />

              {/* Footer */}
              <div className="flex items-center justify-between gap-3">
                {/* Lead Passenger Avatar */}
                <div className="flex items-center gap-2.5 min-w-0 overflow-hidden">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-white shadow-sm">
                    {(b.details?.leadPassenger?.name || b.details?.guestName || "G")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate leading-none">
                      {b.details?.leadPassenger?.name ||
                        b.details?.guestName ||
                        "Guest User"}
                    </p>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tight mt-0.5">
                      Lead Passenger
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <BookingActions
                    status={b.status}
                    product={b.product}
                    id={b.id}
                  />
                  <Link
                    to={
                      b.product === "hotel"
                        ? `/hotel-booking-card/${b.id}`
                        : `/booking-card/${b.id}`
                    }
                    className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-900 hover:text-white transition-all duration-200 shadow-sm active:scale-95"
                    title="View Details"
                  >
                    <ArrowRight
                      size={14}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
