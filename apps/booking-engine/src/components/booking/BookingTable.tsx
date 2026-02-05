import React from 'react';
import { Booking } from '../../lib/srs-types';
import { BookingActions } from './BookingActions';
import { Plane, Hotel, Calendar, CreditCard, ArrowRight, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

function StatusPill({ status }: { status?: string }) {
  const s = status || 'Unknown';

  const statusConfigs: Record<string, { bg: string; text: string; border: string }> = {
    'Confirmed': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    'Issued': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    'Vouchered': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    'Ticketed': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    'Service confirmed': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
    'Used': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },

    'On hold': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    'Hold': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
    'Additional request': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },

    'In process': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    'Processing': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
    'Cancel in process': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },

    'Canceled': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
    'Cancelled': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
    'Expired': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
    'Service rejected': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
    'Failed': { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },

    'Refunded': { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' },
    'Refund on hold': { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' },
  };

  const config = statusConfigs[s] || { bg: 'bg-gray-50', text: 'text-gray-400', border: 'border-gray-100' };

  return (
    <span className={`px-3 py-1 ${config.bg} ${config.text} border ${config.border} rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap mb-auto`}>
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
        <div className="space-y-1">
          <p className="text-sm font-black text-gray-900 uppercase tracking-widest">No Bookings Found</p>
          <p className="text-[11px] font-bold text-gray-400">Try adjusting your filters or start a new search.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
      {items.map(b => (
        <div key={b.id} className="group relative bg-white rounded-3xl border border-gray-100 p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 overflow-hidden flex flex-col">
          {/* Glassmorphism Background Pattern */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary-500/10 to-transparent" />

          {/* Product Icon Background */}
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none">
            {b.product === 'flight' ? <Plane size={140} className="-rotate-45" /> : <Hotel size={140} />}
          </div>

          <div className="relative z-10 flex flex-col flex-1 h-full">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg ${b.product === 'flight' ? 'bg-blue-50 text-blue-500' : 'bg-violet-50 text-violet-500'} flex items-center justify-center`}>
                    {b.product === 'flight' ? <Plane size={12} className="-rotate-45" /> : <Hotel size={12} />}
                  </div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{b.product} Booking</span>
                </div>
                <h3 className="text-lg font-black text-gray-900 tracking-tighter truncate leading-tight">
                  {b.bookingId || b.reference}
                </h3>
              </div>
              <StatusPill status={b.status} />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8 mt-auto">
              <div className="space-y-1.5 min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar size={10} className="shrink-0" /> Date Created
                </p>
                <p className="text-[11px] font-bold text-gray-700 truncate leading-none">
                  {new Date(b.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="space-y-1.5 min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <CreditCard size={10} className="shrink-0" /> Total Amount
                </p>
                <p className="text-[11px] font-black text-primary-600 uppercase tracking-wide truncate leading-none">
                  {b.total?.currency} {b.total?.amount?.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-dashed border-gray-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                <div className="w-8 h-8 shrink-0 rounded-full border-2 border-white shadow-sm overflow-hidden bg-primary-50 flex items-center justify-center text-[10px] font-black text-primary-600 transition-transform group-hover:scale-110">
                  {(b.details?.leadPassenger?.name || b.details?.guestName || 'G').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-gray-900 leading-none truncate mb-0.5">
                    {b.details?.leadPassenger?.name || b.details?.guestName || 'Guest User'}
                  </p>
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tight">Lead Passenger</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <BookingActions status={b.status} product={b.product} id={b.id} />
                <Link
                  to={b.product === 'hotel' ? `/hotel-booking-card/${b.id}` : `/booking-card/${b.id}`}
                  className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-primary-600 hover:text-white transition-all shadow-sm group/btn active:scale-95"
                  title="View Details"
                >
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

